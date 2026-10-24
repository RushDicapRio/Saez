import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getDb } from '../database/mongo.js';
const LOG_COLORS = {
  COMMAND: 0x5865f2, 
  VOICE: 0x10b981,   
  ROLE: 0xf59e0b,    
  MEMBER: 0x06b6d4, 
  LEVEL: 0xfbbf24,  
  EVENT: 0xec4899,  
  MODERATION: 0xef4444, 
  SYSTEM: 0x8b5cf6,  
};
const LOG_ICONS = {
  COMMAND: '⚡',
  VOICE: '🎙️',
  ROLE: '🎭',
  MEMBER: '👤',
  LEVEL: '🏆',
  EVENT: '🎟️',
  MODERATION: '🛡️',
  SYSTEM: '⚙️',
};
export async function getLogsConfig(guildId) {
  try {
    const db = getDb();
    const doc = await db.collection('discord_logs_config').findOne({ guild_id: guildId });
    return doc || {
      guild_id: guildId,
      channel_id: null,
      enabled: true,
      log_commands: true,
      log_voice: true,
      log_roles: true,
      log_members: true,
      log_levels: true,
      log_events: true,
      log_moderation: true,
    };
  } catch (err) {
    console.error('[Logs Service] Erreur getLogsConfig :', err);
    return { guild_id: guildId, channel_id: null, enabled: false };
  }
}
export async function saveLogsConfig(guildId, updates) {
  try {
    const db = getDb();
    await db.collection('discord_logs_config').updateOne(
      { guild_id: guildId },
      { $set: { ...updates, guild_id: guildId, updated_at: new Date() } },
      { upsert: true }
    );
    return { success: true };
  } catch (err) {
    console.error('[Logs Service] Erreur saveLogsConfig :', err);
    return { success: false, error: err.message };
  }
}
export async function recordLog({
  client,
  guildId,
  type = 'SYSTEM',
  action = 'ACTION',
  user = null,
  target = null,
  details = '',
  channelId = null,
  status = 'INFO',
}) {
  const timestamp = new Date();
  const logEntry = {
    guild_id: guildId,
    type,
    action,
    user: user ? { id: user.id, username: user.username || user.user?.username, tag: user.tag || user.user?.tag } : null,
    target: target ? (typeof target === 'string' ? target : { id: target.id, name: target.name || target.username, type: target.type }) : null,
    details,
    channel_id: channelId,
    status,
    timestamp,
  };
  try {
    const db = getDb();
    await db.collection('discord_server_logs').insertOne(logEntry);
  } catch (err) {
    console.error('[Logs Service] Erreur insertion log Mongo :', err);
  }
  if (!client || !guildId) return;
  try {
    const config = await getLogsConfig(guildId);
    if (!config || !config.enabled || !config.channel_id) return;
    if (type === 'COMMAND' && config.log_commands === false) return;
    if (type === 'VOICE' && config.log_voice === false) return;
    if (type === 'ROLE' && config.log_roles === false) return;
    if (type === 'MEMBER' && config.log_members === false) return;
    if (type === 'LEVEL' && config.log_levels === false) return;
    if (type === 'EVENT' && config.log_events === false) return;
    if (type === 'MODERATION' && config.log_moderation === false) return;
    const channel = client.channels.cache.get(config.channel_id) || (await client.channels.fetch(config.channel_id).catch(() => null));
    if (!channel || !channel.isTextBased()) return;
    const icon = LOG_ICONS[type] || '📝';
    const color = LOG_COLORS[type] || 0x5865f2;
    const embed = new EmbedBuilder()
      .setColor(color)
      .setAuthor({
        name: `Journal Serveur • ${type}`,
        iconURL: user?.displayAvatarURL ? user.displayAvatarURL() : client.user?.displayAvatarURL(),
      })
      .setTitle(`${icon} ${action}`)
      .setDescription(typeof details === 'string' ? details : JSON.stringify(details, null, 2))
      .setFooter({ text: 'Codé avec ❤️ par Saez' })
      .setTimestamp(timestamp);
    if (user) {
      embed.addFields({
        name: '👤 Auteur / Utilisateur',
        value: `<@${user.id}> (\`${user.username || user.id}\`)`,
        inline: true,
      });
    }
    if (channelId) {
      embed.addFields({
        name: '📍 Salon',
        value: `<#${channelId}>`,
        inline: true,
      });
    }
    if (target) {
      const targetStr = typeof target === 'string' ? target : (target.name || target.id);
      embed.addFields({
        name: '🎯 Cible / Élément',
        value: `\`${targetStr}\``,
        inline: true,
      });
    }
    await channel.send({ embeds: [embed] }).catch((e) => console.warn('[Logs Service] Erreur envoi embed log :', e.message));
  } catch (sendErr) {
    console.error('[Logs Service] Erreur transmission log Discord :', sendErr);
  }
}
export async function getRecentLogs(guildId, limit = 50, filterType = null) {
  try {
    const db = getDb();
    const query = {};
    if (guildId) query.guild_id = guildId;
    if (filterType && filterType !== 'ALL') query.type = filterType;
    const logs = await db
      .collection('discord_server_logs')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(Math.min(limit, 200))
      .toArray();
    return logs;
  } catch (err) {
    console.error('[Logs Service] Erreur getRecentLogs :', err);
    return [];
  }
}
