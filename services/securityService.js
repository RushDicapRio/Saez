import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getDb } from '../database/mongo.js';
import { config } from '../config.js';
const userMessageTimestamps = new Map(); 
const recentJoins = []; 
export const DEFAULT_BLACKLISTED_PATTERNS = [
  'nigger', 'nigga', 'negre', 'negresse', 'bougnoul', 'bougnoule', 'bamboula',
  'bicot', 'macaque', 'chintok', 'chinetoque', 'niafou', 'youpin', 'sale juif',
  'feuj', 'sale arabe', 'sale noir', 'sale blanc', 'goulag', 'hitler', 'nazi',
  'ss', 'reich', 'shoah', 'antisemite', 'raton', 'crouille',
  'pede', 'pd', 'tapette', 'gouine', 'encule', 'tarlouze', 'fiotte', 'travelo',
  'transsexuel de merde', 'sale travelo', 'sale pd', 'sale trans', 'enfoire de pd',
  'fils de pute', 'fdp', 'va te faire foutre', 'suce ma bite', 'suceur',
  'sale batard', 'grosse pute', 'pute', 'connard', 'salope', 'suicide toi',
  'creve', 'meurs', 'va mourir',
];
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  let clean = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); 
  const leetMap = {
    '0': 'o',
    '1': 'i',
    '!': 'i',
    '|': 'i',
    '3': 'e',
    '4': 'a',
    '@': 'a',
    '5': 's',
    '$': 's',
    '7': 't',
    '+': 't',
    '8': 'b',
  };
  clean = clean.replace(/[01!|34@5$7+8]/g, (char) => leetMap[char] || char);
  const compact = clean.replace(/[\s\-_.,;:/\\*~`^'"()\[\]{}|]+/g, '');
  return { clean, compact };
}
export async function getSecurityConfig() {
  const db = getDb();
  const col = db.collection('config');
  let doc = await col.findOne({ _id: 'security_config' });
  if (!doc) {
    doc = {
      _id: 'security_config',
      antiraid: {
        enabled: true,
        max_joins: 5, 
        window_seconds: 10,
        action: 'alert', 
        suspicious_account_age_hours: 24, 
      },
      antispam: {
        enabled: true,
        max_messages: 5, 
        window_seconds: 4,
        timeout_minutes: 5, 
        block_duplicate_messages: true,
      },
      antilink: {
        enabled: true,
        block_discord_invites: true, 
        block_all_links: false,
      },
      word_filter: {
        enabled: true,
        delete_message: true,
        timeout_repeat_offender: true,
        timeout_minutes: 10,
        custom_words: [],
      },
      log_channel_id: '', 
      updated_at: new Date(),
    };
    await col.insertOne(doc);
  }
  return doc;
}
export async function saveSecurityConfig(data) {
  const db = getDb();
  const col = db.collection('config');
  await col.updateOne(
    { _id: 'security_config' },
    { $set: { ...data, updated_at: new Date() } },
    { upsert: true }
  );
}
export function checkBlacklistedWord(content, customWords = []) {
  if (!content) return null;
  const { clean, compact } = normalizeText(content);
  const allPatterns = [...DEFAULT_BLACKLISTED_PATTERNS, ...customWords];
  for (const pattern of allPatterns) {
    const p = pattern.toLowerCase().trim();
    if (!p) continue;
    const wordRegex = new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (wordRegex.test(clean)) {
      return p;
    }
    if (p.length >= 3 && compact.includes(p.replace(/\s+/g, ''))) {
      return p;
    }
  }
  return null;
}
export function checkSpam(userId, maxMessages = 5, windowSeconds = 4) {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  let timestamps = userMessageTimestamps.get(userId) || [];
  timestamps = timestamps.filter((t) => now - t < windowMs);
  timestamps.push(now);
  userMessageTimestamps.set(userId, timestamps);
  return timestamps.length > maxMessages;
}
export function checkLink(content, allowInvites = false, blockAll = false) {
  if (!content) return false;
  const inviteRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite|dsc\.gg|invite\.gg)(\/[a-zA-Z0-9_\-]+)?/i;
  const rawDiscordGgRegex = /(https?:\/\/)?(www\.)?discord\.gg/i;
  const rawDiscordInviteRegex = /(https?:\/\/)?(www\.)?discord(app)?\.com\/invite/i;
  const obfuscatedRegex = /discord\s*(\.|\(dot\)|,)\s*(gg|com\/invite)/i;
  const dotGgRegex = /(^|\s)(https?:\/\/)?([a-zA-Z0-9_\-]+\.)?gg\/[a-zA-Z0-9_\-]+/i;
  if (!allowInvites) {
    if (
      inviteRegex.test(content) ||
      rawDiscordGgRegex.test(content) ||
      rawDiscordInviteRegex.test(content) ||
      obfuscatedRegex.test(content) ||
      dotGgRegex.test(content)
    ) {
      return 'discord_invite';
    }
  }
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/i;
  if (blockAll && urlRegex.test(content)) {
    return 'link';
  }
  return false;
}
export async function sendSecurityAlert(guild, title, description, fields = [], color = config.colors.accent) {
  try {
    const cfg = await getSecurityConfig();
    const logChannelId = cfg.log_channel_id || '';
    const logChannel = guild.channels.cache.get(logChannelId) || (await guild.channels.fetch(logChannelId).catch(() => null));
    if (!logChannel) return;
    const embed = new EmbedBuilder()
      .setTitle(`🛡️ Protection Saez : ${title}`)
      .setDescription(description)
      .setColor(color)
      .setThumbnail(config.assets.logoUrl)
      .addFields(fields)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Bouclier de Sécurité' })
      .setTimestamp();
    await logChannel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[SecurityAlert] Erreur envoi log sécurité :', err);
  }
}
