import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { getDb } from '../database/mongo.js';
import { config as appConfig } from '../config.js';
let isServerStatsSyncing = false;
export async function getServerStatsConfig(guildId) {
  const db = getDb();
  const col = db.collection('config');
  let doc = await col.findOne({ _id: `server_stats_${guildId}` });
  if (!doc) {
    doc = {
      _id: `server_stats_${guildId}`,
      guild_id: guildId,
      enabled: false,
      category_id: null,
      category_name: '📈・STATS SERVEUR',
      channels: {
        total: { id: null, enabled: true, pattern: '👥・Membres : {count}' },
        humans: { id: null, enabled: true, pattern: '👤・Humains : {count}' },
        bots: { id: null, enabled: true, pattern: '🤖・Bots : {count}' },
        online: { id: null, enabled: true, pattern: '🟢・En ligne : {count}' },
        boosts: { id: null, enabled: true, pattern: '🚀・Boosts : {count}' },
      },
      updated_at: new Date(),
    };
  }
  return doc;
}
export async function saveServerStatsConfig(guildId, data) {
  const db = getDb();
  const col = db.collection('config');
  await col.updateOne(
    { _id: `server_stats_${guildId}` },
    { $set: { ...data, updated_at: new Date() } },
    { upsert: true }
  );
}
export async function computeServerMetrics(guild) {
  try {
    await guild.members.fetch().catch(() => {});
  } catch {}
  const total = guild.memberCount || guild.members.cache.size;
  const bots = guild.members.cache.filter((m) => m.user.bot).size;
  const humans = Math.max(0, total - bots);
  const online = guild.members.cache.filter(
    (m) => m.presence && m.presence.status !== 'offline'
  ).size;
  const boosts = guild.premiumSubscriptionCount || 0;
  const boostTier = guild.premiumTier;
  return {
    total,
    humans,
    bots,
    online: online > 0 ? online : Math.round(humans * 0.4), 
    boosts,
    boostTier,
  };
}
function formatName(pattern, count) {
  const str = (count ?? 0).toLocaleString('fr-FR');
  return (pattern || '{count}').replace('{count}', str).slice(0, 100);
}
export async function syncServerStatsChannels(guild, force = false) {
  if (!guild) return { success: false, message: 'Serveur invalide.' };
  if (isServerStatsSyncing && !force) {
    return { success: false, message: 'Synchronisation déjà en cours.' };
  }
  isServerStatsSyncing = true;
  try {
    const cfg = await getServerStatsConfig(guild.id);
    if (!cfg.enabled && !force) {
      isServerStatsSyncing = false;
      return { success: false, message: 'Module désactivé.' };
    }
    const metrics = await computeServerMetrics(guild);
    let category = cfg.category_id ? guild.channels.cache.get(cfg.category_id) : null;
    const catName = cfg.category_name || '📈・STATS SERVEUR';
    if (!category) {
      category = guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === catName.toLowerCase()
      );
    }
    if (!category) {
      category = await guild.channels.create({
        name: catName,
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionFlagsBits.ViewChannel],
            deny: [PermissionFlagsBits.Connect],
          },
        ],
      });
      cfg.category_id = category.id;
    }
    const definitions = [
      { key: 'total', val: metrics.total, defPattern: '👥・Membres : {count}' },
      { key: 'humans', val: metrics.humans, defPattern: '👤・Humains : {count}' },
      { key: 'bots', val: metrics.bots, defPattern: '🤖・Bots : {count}' },
      { key: 'online', val: metrics.online, defPattern: '🟢・En ligne : {count}' },
      { key: 'boosts', val: metrics.boosts, defPattern: '🚀・Boosts : {count}' },
    ];
    if (!cfg.channels) cfg.channels = {};
    let updatedCount = 0;
    let createdCount = 0;
    for (const def of definitions) {
      const channelCfg = cfg.channels[def.key] || { enabled: true, pattern: def.defPattern, id: null };
      if (!channelCfg.enabled) continue;
      const newName = formatName(channelCfg.pattern || def.defPattern, def.val);
      let channel = channelCfg.id ? guild.channels.cache.get(channelCfg.id) : null;
      if (!channel) {
        channel = guild.channels.cache.find(
          (c) => c.parentId === category.id && (c.name.includes(def.defPattern.split(':')[0].trim()) || c.name.startsWith(newName.slice(0, 4)))
        );
      }
      if (!channel) {
        channel = await guild.channels.create({
          name: newName,
          type: ChannelType.GuildVoice,
          parent: category.id,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [PermissionFlagsBits.ViewChannel],
              deny: [PermissionFlagsBits.Connect],
            },
          ],
        });
        channelCfg.id = channel.id;
        createdCount++;
      } else {
        channelCfg.id = channel.id;
        if (channel.name !== newName) {
          await channel.setName(newName).catch((err) => {
            console.warn(`[ServerStats] Rate limit ou erreur sur ${channel.name} :`, err.message);
          });
          updatedCount++;
        }
      }
      cfg.channels[def.key] = channelCfg;
    }
    cfg.enabled = true;
    await saveServerStatsConfig(guild.id, cfg);
    return {
      success: true,
      updatedCount,
      createdCount,
      metrics,
    };
  } catch (err) {
    console.error('[ServerStats] Erreur lors de la synchronisation :', err);
    return { success: false, error: err.message };
  } finally {
    isServerStatsSyncing = false;
  }
}
export function startPeriodicServerStatsSync(client, intervalMinutes = 10) {
  const intervalMs = Math.max(5, intervalMinutes) * 60 * 1000;
  console.log(`[ServerStats] ⏱️ Démarrage de la boucle auto-stats serveur (${intervalMinutes} min)...`);
  setTimeout(async () => {
    for (const guild of client.guilds.cache.values()) {
      try {
        const cfg = await getServerStatsConfig(guild.id);
        if (cfg.enabled) {
          await syncServerStatsChannels(guild);
        }
      } catch {}
    }
  }, 120 * 1000);
  setInterval(async () => {
    for (const guild of client.guilds.cache.values()) {
      try {
        const cfg = await getServerStatsConfig(guild.id);
        if (cfg.enabled) {
          await syncServerStatsChannels(guild);
        }
      } catch {}
    }
  }, intervalMs);
}
