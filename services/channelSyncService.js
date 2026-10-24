import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { getDb } from '../database/mongo.js';
import { getSaezRealStats } from './statsService.js';
import { config as appConfig } from '../config.js';
let isSyncRunning = false;
export function formatChannelName(pattern, count) {
  const formatted = (count || 0).toLocaleString('fr-FR');
  const rendered = (pattern || '{count}').replace('{count}', formatted);
  return rendered.slice(0, 100);
}
export async function syncDiscordStatsChannels(client, force = false) {
  if (isSyncRunning) {
    console.log('[ChannelSync] Synchronisation déjà en cours, saut de cycle.');
    return { success: false, message: 'Synchronisation déjà en cours.' };
  }
  isSyncRunning = true;
  const db = getDb();
  try {
    const cfgCol = db.collection('config');
    const cfgDoc = await cfgCol.findOne({ _id: 'discord_stats_config' });
    const guildId = cfgDoc?.guild_id || appConfig.guildId;
    if (!guildId) {
      console.log('[ChannelSync] Aucun Guild ID configuré dans MongoDB ou .env.');
      isSyncRunning = false;
      return { success: false, message: 'Aucun serveur configuré.' };
    }
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) {
      console.warn(`[ChannelSync] Impossible de trouver le serveur Discord ID ${guildId}.`);
      isSyncRunning = false;
      return { success: false, message: 'Serveur introuvable.' };
    }
    const stats = await getSaezRealStats();
    const statsConfig = cfgDoc?.stats || {
      online_users: { enabled: true, name_pattern: '🟢・Saez en ligne : {count}' },
      animes: { enabled: true, name_pattern: '🎌・Animes : {count}' },
      episodes: { enabled: true, name_pattern: '📺・Épisodes : {count}' },
      films: { enabled: true, name_pattern: '🎬・Films : {count}' },
      oav: { enabled: true, name_pattern: '💿・OAV : {count}' },
    };
    let categoryId = cfgDoc?.category_id;
    let category = categoryId ? guild.channels.cache.get(categoryId) : null;
    const categoryName = cfgDoc?.category_name || '📊・STATISTIQUES SAEZ';
    if (!category) {
      category = guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === categoryName.toLowerCase()
      );
      if (!category) {
        console.log(`[ChannelSync] Création de la catégorie "${categoryName}"...`);
        category = await guild.channels.create({
          name: categoryName,
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [PermissionFlagsBits.ViewChannel],
              deny: [PermissionFlagsBits.Connect],
            },
          ],
        });
        categoryId = category.id;
      } else {
        categoryId = category.id;
      }
    }
    const channelType = cfgDoc?.channel_type === 'text' ? ChannelType.GuildText : ChannelType.GuildVoice;
    const statMapping = [
      { key: 'online_users', value: stats.onlineUsers, label: 'Utilisateurs en ligne' },
      { key: 'animes', value: stats.totalAnimes, label: 'Animes' },
      { key: 'episodes', value: stats.totalEpisodes, label: 'Épisodes' },
      { key: 'films', value: stats.totalFilms, label: 'Films' },
      { key: 'oav', value: stats.totalOav, label: 'OAV' },
    ];
    let updatedCount = 0;
    let skippedCount = 0;
    let createdCount = 0;
    const updatedStatsConfig = { ...statsConfig };
    for (const item of statMapping) {
      const conf = updatedStatsConfig[item.key] || { enabled: true, name_pattern: `${item.label} : {count}` };
      if (!conf.enabled) continue;
      const targetName = formatChannelName(conf.name_pattern, item.value);
      let channel = conf.channel_id ? guild.channels.cache.get(conf.channel_id) : null;
      if (!channel) {
        console.log(`[ChannelSync] Création du salon "${targetName}"...`);
        channel = await guild.channels.create({
          name: targetName,
          type: channelType,
          parent: categoryId,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [PermissionFlagsBits.ViewChannel],
              deny: channelType === ChannelType.GuildVoice ? [PermissionFlagsBits.Connect] : [PermissionFlagsBits.SendMessages],
            },
          ],
        });
        conf.channel_id = channel.id;
        conf.last_channel_name = targetName;
        conf.last_value = item.value;
        conf.last_updated_at = Date.now();
        createdCount++;
      } else {
        if (!force && channel.name === targetName) {
          skippedCount++;
          continue;
        }
        try {
          await channel.setName(targetName);
          conf.last_channel_name = targetName;
          conf.last_value = item.value;
          conf.last_updated_at = Date.now();
          updatedCount++;
          console.log(`[ChannelSync] Salon "${item.label}" renommé en "${targetName}".`);
        } catch (renameErr) {
          console.warn(`[ChannelSync] Erreur renommage (${item.label}):`, renameErr.message);
        }
      }
    }
    await cfgCol.updateOne(
      { _id: 'discord_stats_config' },
      {
        $set: {
          guild_id: guildId,
          guild_name: guild.name,
          category_id: categoryId,
          category_name: categoryName,
          stats: updatedStatsConfig,
          last_sync_timestamp: Date.now(),
          last_sync_status: 'success',
          last_sync_message: `Synchronisation bot réussie (${updatedCount} maj, ${createdCount} créés, ${skippedCount} inchangés).`,
        },
      },
      { upsert: true }
    );
    console.log(`[ChannelSync] ✅ Cycle terminé : ${updatedCount} mis à jour, ${createdCount} créés, ${skippedCount} inchangés.`);
    isSyncRunning = false;
    return {
      success: true,
      updatedCount,
      createdCount,
      skippedCount,
      message: `Synchronisation réussie (${updatedCount} maj, ${skippedCount} inchangés).`,
    };
  } catch (err) {
    console.error('[ChannelSync] ❌ Erreur lors de la synchronisation des salons:', err);
    isSyncRunning = false;
    return { success: false, message: err.message };
  }
}
export function startPeriodicChannelSync(client, intervalMinutes = 10) {
  const safeMinutes = Math.max(5, intervalMinutes);
  console.log(`[ChannelSync] ⏱️ Démarrage de la boucle de synchronisation automatique (toutes les ${safeMinutes} minutes)...`);
  setTimeout(() => {
    syncDiscordStatsChannels(client, false).catch(() => {});
  }, 5000);
  return setInterval(() => {
    syncDiscordStatsChannels(client, false).catch(() => {});
  }, safeMinutes * 60 * 1000);
}
