import { PermissionFlagsBits } from 'discord.js';
import { getDb } from '../../database/mongo.js';
import { getCountingConfig, saveCountingConfig } from '../countingService.js';
import { getPlayerStats, savePlayerStats } from './statsEngine.js';
let inMemoryAuditLogs = [];
let inMemorySnapshots = new Map(); 
let logSeqCounter = 0;
export function resetAdminMemoryStore() {
  inMemoryAuditLogs = [];
  inMemorySnapshots = new Map();
  logSeqCounter = 0;
}
export async function recordAuditLog(guildId, adminUser, action, details = {}) {
  const logEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    seq: ++logSeqCounter,
    guildId,
    adminId: adminUser?.id || 'system',
    adminTag: adminUser?.tag || adminUser?.username || 'Système',
    action,
    details,
    timestamp: new Date(),
  };
  inMemoryAuditLogs.push(logEntry);
  if (inMemoryAuditLogs.length > 100) inMemoryAuditLogs.shift();
  try {
    const db = getDb();
    if (db) {
      await db.collection('counting_audit').insertOne(logEntry);
    }
  } catch {}
  return logEntry;
}
export async function getAuditLogs(guildId, limit = 10) {
  try {
    const db = getDb();
    if (db) {
      const logs = await db.collection('counting_audit')
        .find({ guildId })
        .sort({ timestamp: -1, _id: -1 })
        .limit(limit)
        .toArray();
      if (logs.length > 0) return logs;
    }
  } catch {}
  return inMemoryAuditLogs
    .filter(l => l.guildId === guildId)
    .sort((a, b) => (b.seq || 0) - (a.seq || 0))
    .slice(0, limit);
}
export async function createPreResetSnapshot(guildId, adminUser) {
  const currentConfig = await getCountingConfig(guildId);
  const snapshot = {
    guildId,
    createdAt: new Date(),
    adminId: adminUser?.id,
    config: JSON.parse(JSON.stringify(currentConfig)),
  };
  inMemorySnapshots.set(guildId, snapshot);
  try {
    const db = getDb();
    if (db) {
      await db.collection('counting_snapshots').updateOne(
        { guildId },
        { $set: snapshot },
        { upsert: true }
      );
    }
  } catch {}
  return snapshot;
}
export async function restoreLastSnapshot(guildId, adminUser) {
  let snapshot = null;
  try {
    const db = getDb();
    if (db) {
      snapshot = await db.collection('counting_snapshots').findOne({ guildId });
    }
  } catch {}
  if (!snapshot) {
    snapshot = inMemorySnapshots.get(guildId);
  }
  if (!snapshot || !snapshot.config) {
    return { success: false, message: 'Aucun snapshot de sauvegarde disponible pour ce serveur.' };
  }
  await saveCountingConfig(guildId, snapshot.config);
  await recordAuditLog(guildId, adminUser, 'RESTORE_SNAPSHOT', { restoredConfig: snapshot.config });
  return { success: true, restoredCount: snapshot.config.current_count || 0 };
}
export async function resetCurrentCount(guildId, adminUser, reason = 'Demande administrateur') {
  await createPreResetSnapshot(guildId, adminUser);
  const cfg = await getCountingConfig(guildId);
  const previous = cfg.current_count || 0;
  cfg.current_count = 0;
  cfg.last_user_id = null;
  await saveCountingConfig(guildId, cfg);
  await recordAuditLog(guildId, adminUser, 'RESET_CURRENT_COUNT', {
    previousCount: previous,
    reason,
  });
  return { success: true, previousCount: previous, nextCount: 1 };
}
export async function resetHighScore(guildId, adminUser) {
  await createPreResetSnapshot(guildId, adminUser);
  const cfg = await getCountingConfig(guildId);
  const previousRecord = cfg.high_score || 0;
  cfg.high_score = 0;
  await saveCountingConfig(guildId, cfg);
  await recordAuditLog(guildId, adminUser, 'RESET_HIGH_SCORE', { previousRecord });
  return { success: true, previousRecord };
}
export async function resetMemberStats(guildId, targetUserId, adminUser) {
  const stats = await getPlayerStats(guildId, targetUserId);
  const previous = { ...stats };
  stats.counts_valid = 0;
  stats.counts_invalid = 0;
  stats.current_streak = 0;
  stats.points = 0;
  stats.logic_solved = 0;
  stats.minigames_won = 0;
  await savePlayerStats(stats);
  await recordAuditLog(guildId, adminUser, 'RESET_MEMBER_STATS', { targetUserId, previous });
  return { success: true, targetUserId };
}
export async function runCountingDiagnostic(guild, channelId) {
  const report = {
    guildName: guild.name,
    channelFound: false,
    channelName: null,
    isTextChannel: false,
    botPermissions: {
      viewChannel: false,
      sendMessages: false,
      embedLinks: false,
      addReactions: false,
      manageMessages: false,
      readHistory: false,
    },
    allEssentialPermissions: false,
    countingConfig: null,
    recommendations: [],
  };
  const channel = channelId ? guild.channels.cache.get(channelId) || (await guild.channels.fetch(channelId).catch(() => null)) : null;
  if (channel) {
    report.channelFound = true;
    report.channelName = channel.name;
    report.isTextChannel = channel.isTextBased();
    const me = await guild.members.fetchMe().catch(() => null);
    if (me) {
      const perms = channel.permissionsFor(me);
      report.botPermissions = {
        viewChannel: perms.has(PermissionFlagsBits.ViewChannel),
        sendMessages: perms.has(PermissionFlagsBits.SendMessages),
        embedLinks: perms.has(PermissionFlagsBits.EmbedLinks),
        addReactions: perms.has(PermissionFlagsBits.AddReactions),
        manageMessages: perms.has(PermissionFlagsBits.ManageMessages),
        readHistory: perms.has(PermissionFlagsBits.ReadMessageHistory),
      };
      report.allEssentialPermissions =
        report.botPermissions.viewChannel &&
        report.botPermissions.sendMessages &&
        report.botPermissions.embedLinks &&
        report.botPermissions.addReactions;
    }
  } else {
    report.recommendations.push('Le salon configuré est introuvable. Définissez-en un avec `/counting config salon`.');
  }
  const cfg = await getCountingConfig(guild.id);
  report.countingConfig = cfg;
  if (!report.botPermissions.manageMessages) {
    report.recommendations.push('Recommandé : Accordez la permission "Gérer les messages" au bot pour pouvoir supprimer les erreurs en mode strict.');
  }
  return report;
}
