import { EmbedBuilder } from 'discord.js';
import { getDb } from '../database/mongo.js';
import { config as appConfig } from '../config.js';
const DEFAULT_LOG_CHANNEL = ''; 
export async function getLogConfig(guildId) {
  const db = getDb();
  const col = db.collection('config');
  let doc = await col.findOne({ _id: `logs_config_${guildId}` });
  if (!doc) {
    doc = {
      _id: `logs_config_${guildId}`,
      guild_id: guildId,
      general_channel_id: DEFAULT_LOG_CHANNEL,
      channels: {
        messages: null,   
        members: null,
        moderation: null,
        voice: null,
        server: null,
      },
      modules: {
        messages: true,        
        members: true,         
        moderation: true,     
        channels_roles: true,  
        voice: true,           
      },
      updated_at: new Date(),
    };
  }
  return doc;
}
export async function saveLogConfig(guildId, data) {
  const db = getDb();
  const col = db.collection('config');
  await col.updateOne(
    { _id: `logs_config_${guildId}` },
    { $set: { ...data, updated_at: new Date() } },
    { upsert: true }
  );
}
export async function sendLog(guild, type, embed) {
  if (!guild) return;

  try {
    const cfg = await getLogConfig(guild.id);
    if (cfg.modules && cfg.modules[type] === false) {
      return;
    }
    const targetChannelId =
      cfg.channels?.[type] ||
      cfg.general_channel_id ||
      DEFAULT_LOG_CHANNEL;
    const channel =
      guild.channels.cache.get(targetChannelId) ||
      (await guild.channels.fetch(targetChannelId).catch(() => null));
    if (!channel) return;
    if (!embed.data.footer) {
      embed.setFooter({ text: 'Codé avec ❤️ par Saez | Saez Journal d\'Audit • Système de Logs' });
    }
    if (!embed.data.timestamp) {
      embed.setTimestamp();
    }
    await channel.send({ embeds: [embed] }).catch((err) => {
      console.warn(`[LogService] Impossible d'envoyer le log dans #${channel.name} :`, err.message);
    });
  } catch (err) {
    console.error('[LogService] Erreur sendLog :', err);
  }
}
