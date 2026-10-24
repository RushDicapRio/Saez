import crypto from 'node:crypto';
import {
  ChannelType,
  PermissionFlagsBits,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getDb } from '../database/mongo.js';
import { config } from '../config.js';
export const SCHEMA_VERSION = '2.1.0';
export const BACKUP_TYPES = {
  FULL: 'full',
  PARTIAL: 'partial',
  ROLES: 'roles',
  CHANNELS: 'channels',
  BOT_CONFIG: 'bot_config',
  PRE_MODIFICATION: 'pre_modification',
};
const activeOperations = new Map();
export function computeChecksum(data) {
  const serialized = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}
export function generateBackupId() {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(4).toString('hex');
  return `bk_${timestamp}_${randomPart}`;
}
export const findInCache = (cache, predicate) => {
  if (!cache) return null;
  if (typeof cache.find === 'function') return cache.find(predicate);
  if (typeof cache.values === 'function') return [...cache.values()].find(predicate);
  return null;
};
export function safeGetDb() {
  try {
    return getDb();
  } catch {
    return null;
  }
}
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export function sanitizeData(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeData);
  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('token') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('password') ||
      lowerKey.includes('auth') ||
      lowerKey.includes('key_value')
    ) {
      continue;
    }
    clean[key] = typeof val === 'object' && val !== null ? sanitizeData(val) : val;
  }
  return clean;
}
export async function captureRoles(guild) {
  try {
    await guild.roles.fetch();
  } catch {}
  const roles = [];
  const sorted = [...guild.roles.cache.values()].sort((a, b) => a.position - b.position);
  for (const role of sorted) {
    roles.push({
      id: role.id,
      name: role.name,
      color: role.color,
      hexColor: role.hexColor,
      hoist: role.hoist,
      position: role.position,
      permissions: role.permissions.bitfield.toString(),
      mentionable: role.mentionable,
      managed: role.managed,
      isEveryone: role.id === guild.id,
    });
  }
  return roles;
}
export async function captureChannels(guild) {
  try {
    await guild.channels.fetch();
  } catch {}
  const channels = [];
  const sorted = [...guild.channels.cache.values()].sort((a, b) => a.position - b.position);
  for (const channel of sorted) {
    const overwrites = [];
    if (channel.permissionOverwrites) {
      for (const [, ow] of channel.permissionOverwrites.cache) {
        overwrites.push({
          id: ow.id,
          type: ow.type,
          allow: ow.allow.bitfield.toString(),
          deny: ow.deny.bitfield.toString(),
        });
      }
    }
    channels.push({
      id: channel.id,
      name: channel.name,
      type: channel.type,
      parentId: channel.parentId || null,
      position: channel.rawPosition ?? channel.position ?? 0,
      topic: channel.topic || null,
      nsfw: !!channel.nsfw,
      rateLimitPerUser: channel.rateLimitPerUser || 0,
      bitrate: channel.bitrate || null,
      userLimit: channel.userLimit || null,
      permissionOverwrites: overwrites,
    });
  }
  return channels;
}
export function captureGuildSettings(guild) {
  return {
    name: guild.name,
    description: guild.description || null,
    afkTimeout: guild.afkTimeout,
    afkChannelId: guild.afkChannelId || null,
    systemChannelId: guild.systemChannelId || null,
    systemChannelFlags: guild.systemChannelFlags?.bitfield?.toString() || '0',
    verificationLevel: guild.verificationLevel,
    defaultMessageNotifications: guild.defaultMessageNotifications,
    explicitContentFilter: guild.explicitContentFilter,
    preferredLocale: guild.preferredLocale || 'fr',
  };
}
export async function captureBotConfigs(guildId) {
  const configs = {};
  try {
    const db = safeGetDb();
    if (!db) return configs;
    const welcome = await db.collection('config').findOne({ _id: `welcome_config_${guildId}` });
    if (welcome) configs.welcome = sanitizeData(welcome);
    const tickets = await db.collection('config').findOne({ _id: `ticket_config_${guildId}` });
    if (tickets) configs.tickets = sanitizeData(tickets);
    const suggestions = await db.collection('config').findOne({ _id: `suggestion_config_${guildId}` });
    if (suggestions) configs.suggestions = sanitizeData(suggestions);
    const serverStats = await db.collection('config').findOne({ _id: `server_stats_${guildId}` });
    if (serverStats) configs.serverStats = sanitizeData(serverStats);
    const tempVoice = await db.collection('temp_voice_config').findOne({ guild_id: guildId });
    if (tempVoice) configs.tempVoice = sanitizeData(tempVoice);
    const discordLogs = await db.collection('discord_logs_config').findOne({ guild_id: guildId });
    if (discordLogs) configs.discordLogs = sanitizeData(discordLogs);
    const tags = await db.collection('server_tags').find({ guild_id: guildId }).toArray();
    if (tags?.length) configs.tags = tags.map(sanitizeData);
    const automations = await db.collection('bot_automations').find({ guild_id: guildId }).toArray();
    if (automations?.length) configs.automations = automations.map(sanitizeData);
    const autoResponses = await db.collection('bot_auto_responses').find({ guild_id: guildId }).toArray();
    if (autoResponses?.length) configs.autoResponses = autoResponses.map(sanitizeData);
    const starboard = await db.collection('server_starboards').findOne({ guild_id: guildId });
    if (starboard) configs.starboard = sanitizeData(starboard);
    const counting = await db.collection('server_counting').findOne({ guild_id: guildId });
    if (counting) configs.counting = sanitizeData(counting);
    const botLists = await db.collection('bot_lists').find({ guild_id: guildId }).toArray();
    if (botLists?.length) configs.botLists = botLists.map(sanitizeData);
  } catch (err) {
    console.warn(`[BackupService] Erreur lors de la capture des configurations du bot pour ${guildId} :`, err.message);
  }
  return configs;
}
export async function createBackup(guild, author, options = {}) {
  const {
    name = null,
    description = '',
    type = BACKUP_TYPES.FULL,
    include = {
      roles: true,
      channels: true,
      guild_settings: true,
      bot_config: true,
    },
    isAuto = false,
    reason = 'Création manuelle',
  } = options;
  const backupId = generateBackupId();
  const dateStr = new Date().toISOString().slice(0, 10);
  const finalName = name?.trim() || (isAuto ? `AutoBackup-${dateStr}` : `Sauvegarde-${dateStr}`);
  let finalType = type;
  if (
    type === BACKUP_TYPES.FULL &&
    (include.roles === false || include.channels === false || include.bot_config === false)
  ) {
    finalType = BACKUP_TYPES.PARTIAL;
  }
  const data = {};
  let rolesCount = 0;
  let channelsCount = 0;
  let categoriesCount = 0;
  if (include.roles !== false && type !== BACKUP_TYPES.CHANNELS && type !== BACKUP_TYPES.BOT_CONFIG) {
    data.roles = await captureRoles(guild);
    rolesCount = data.roles.length;
  }
  if (include.channels !== false && type !== BACKUP_TYPES.ROLES && type !== BACKUP_TYPES.BOT_CONFIG) {
    data.channels = await captureChannels(guild);
    channelsCount = data.channels.filter((c) => c.type !== ChannelType.GuildCategory).length;
    categoriesCount = data.channels.filter((c) => c.type === ChannelType.GuildCategory).length;
  }
  if (include.guild_settings !== false && (type === BACKUP_TYPES.FULL || type === BACKUP_TYPES.PRE_MODIFICATION)) {
    data.guildSettings = captureGuildSettings(guild);
  }
  if (include.bot_config !== false && type !== BACKUP_TYPES.ROLES && type !== BACKUP_TYPES.CHANNELS) {
    data.botConfigs = await captureBotConfigs(guild.id);
  }
  const checksum = computeChecksum(data);
  const jsonSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
  const backupDoc = {
    backup_id: backupId,
    guild_id: guild.id,
    guild_name: guild.name,
    name: finalName,
    description: description || '',
    author: {
      id: author?.id || 'SYSTEM',
      tag: author?.tag || author?.username || 'Système',
    },
    created_at: new Date(),
    type: finalType,
    schema_version: SCHEMA_VERSION,
    is_auto: !!isAuto,
    reason,
    size_bytes: jsonSize,
    counts: {
      roles: rolesCount,
      channels: channelsCount,
      categories: categoriesCount,
      members: guild.memberCount || guild.members.cache.size,
      bot_modules: Object.keys(data.botConfigs || {}).length,
    },
    checksum,
    data,
    validation: {
      status: 'valid',
      checked_at: new Date(),
      issues: [],
    },
  };
  try {
    const db = safeGetDb();
    if (db) {
      await db.collection('server_backups').insertOne(backupDoc);
      await db.collection('backup_history').insertOne({
        guild_id: guild.id,
        action: 'CREATE',
        backup_id: backupId,
        backup_name: finalName,
        type,
        is_auto: !!isAuto,
        author: backupDoc.author,
        timestamp: new Date(),
        details: `${rolesCount} rôles, ${channelsCount} salons, ${categoriesCount} catégories sauvegardés.`,
      });
      await enforceRetentionPolicy(guild.id);
    }
  } catch (dbErr) {
    console.error('[BackupService] Erreur enregistrement MongoDB backup :', dbErr);
    throw new Error(`Échec de l'enregistrement en base de données : ${dbErr.message}`);
  }
  return backupDoc;
}
export async function getBackup(guildId, backupId) {
  if (!backupId || !guildId) return null;
  const db = safeGetDb();
  if (!db) return null;
  return await db.collection('server_backups').findOne({
    guild_id: guildId,
    backup_id: backupId,
  });
}
export async function listBackups(guildId, options = {}) {
  const {
    type = null,
    search = '',
    sortBy = 'created_at',
    sortOrder = -1,
    page = 1,
    limit = 5,
    onlyValid = false,
  } = options;
  const db = safeGetDb();
  if (!db) return { backups: [], total: 0, page: 1, totalPages: 1 };
  const query = { guild_id: guildId };
  if (type && type !== 'all') {
    query.type = type;
  }
  if (onlyValid) {
    query['validation.status'] = 'valid';
  }
  if (search?.trim()) {
    const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ name: regex }, { description: regex }, { backup_id: regex }];
  }
  const sort = {};
  sort[sortBy] = sortOrder;
  const total = await db.collection('server_backups').countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const backups = await db
    .collection('server_backups')
    .find(query, { projection: { data: 0 } })
    .sort(sort)
    .skip((currentPage - 1) * limit)
    .limit(limit)
    .toArray();
  return {
    backups,
    total,
    page: currentPage,
    totalPages,
    limit,
  };
}
export async function searchBackups(guildId, searchTerm, limit = 10) {
  return await listBackups(guildId, {
    search: searchTerm,
    limit,
    page: 1,
  });
}
export async function deleteBackup(guildId, backupId, author) {
  const db = safeGetDb();
  if (!db) return { success: false, message: 'Base de données inaccessible.' };
  const existing = await db.collection('server_backups').findOne({
    guild_id: guildId,
    backup_id: backupId,
  });
  if (!existing) {
    return { success: false, message: 'Sauvegarde introuvable sur ce serveur.' };
  }
  await db.collection('server_backups').deleteOne({
    guild_id: guildId,
    backup_id: backupId,
  });
  await db.collection('backup_history').insertOne({
    guild_id: guildId,
    action: 'DELETE',
    backup_id: backupId,
    backup_name: existing.name,
    author: {
      id: author?.id || 'SYSTEM',
      tag: author?.tag || author?.username || 'Système',
    },
    timestamp: new Date(),
    details: `Suppression de la sauvegarde ${existing.name} (${existing.type}).`,
  });
  return { success: true, backup: existing };
}
export async function renameBackup(guildId, backupId, newName, newDescription = null) {
  const db = safeGetDb();
  if (!db) return { success: false, message: 'Base de données inaccessible.' };
  const updates = { name: newName.trim(), updated_at: new Date() };
  if (newDescription !== null) {
    updates.description = newDescription.trim();
  }
  const res = await db.collection('server_backups').updateOne(
    { guild_id: guildId, backup_id: backupId },
    { $set: updates }
  );
  return { success: res.matchedCount > 0 };
}
export async function duplicateBackup(guildId, backupId, author, customName = null) {
  const original = await getBackup(guildId, backupId);
  if (!original) return { success: false, message: 'Sauvegarde originale introuvable.' };
  const newBackupId = generateBackupId();
  const duplicateDoc = {
    ...original,
    _id: undefined,
    backup_id: newBackupId,
    name: customName?.trim() || `${original.name} (Copie)`,
    author: {
      id: author?.id || 'SYSTEM',
      tag: author?.tag || author?.username || 'Système',
    },
    created_at: new Date(),
    reason: `Duplication de ${original.backup_id}`,
  };
  const db = safeGetDb();
  if (db) {
    await db.collection('server_backups').insertOne(duplicateDoc);
    await db.collection('backup_history').insertOne({
      guild_id: guildId,
      action: 'DUPLICATE',
      backup_id: newBackupId,
      backup_name: duplicateDoc.name,
      author: duplicateDoc.author,
      timestamp: new Date(),
      details: `Duplication depuis ${original.backup_id}`,
    });
  }
  return { success: true, newBackup: duplicateDoc };
}
export function verifyBackup(backupDoc) {
  const errors = [];
  const warnings = [];
  if (!backupDoc) {
    return { valid: false, errors: ['Données de sauvegarde inexistantes ou vides.'], warnings: [] };
  }
  if (!backupDoc.backup_id) errors.push('Identifiant de sauvegarde (backup_id) manquant.');
  if (!backupDoc.guild_id) errors.push('Identifiant du serveur (guild_id) manquant.');
  if (!backupDoc.schema_version) warnings.push('Version de schéma non renseignée.');
  if (!backupDoc.data || typeof backupDoc.data !== 'object') {
    errors.push('Section des données (data) manquante ou invalide.');
    return { valid: false, errors, warnings };
  }
  if (backupDoc.checksum) {
    const computed = computeChecksum(backupDoc.data);
    if (computed !== backupDoc.checksum) {
      errors.push('Empreinte cryptographique (SHA-256) invalide : les données ont été altérées ou corrompues.');
    }
  } else {
    warnings.push('Aucun checksum SHA-256 enregistré dans la sauvegarde.');
  }
  if (backupDoc.data.roles) {
    if (!Array.isArray(backupDoc.data.roles)) {
      errors.push('La liste des rôles n\'est pas un tableau valide.');
    } else {
      for (const role of backupDoc.data.roles) {
        if (!role.id || !role.name) {
          warnings.push(`Rôle avec données partielles détecté (id ou nom manquant).`);
        }
      }
    }
  }
  if (backupDoc.data.channels) {
    if (!Array.isArray(backupDoc.data.channels)) {
      errors.push('La liste des salons n\'est pas un tableau valide.');
    } else {
      const knownIds = new Set(backupDoc.data.channels.map((c) => c.id));
      for (const ch of backupDoc.data.channels) {
        if (!ch.name || ch.type === undefined) {
          warnings.push(`Salon sans nom ou type détecté.`);
        }
        if (ch.parentId && !knownIds.has(ch.parentId)) {
          warnings.push(`Le salon "${ch.name}" référence une catégorie parente (${ch.parentId}) absente de la sauvegarde.`);
        }
      }
    }
  }
  if (backupDoc.schema_version && backupDoc.schema_version !== SCHEMA_VERSION) {
    warnings.push(`Version de format différente (${backupDoc.schema_version} vs attendu ${SCHEMA_VERSION}). Une migration automatique sera appliquée.`);
  }
  const valid = errors.length === 0;
  return {
    valid,
    status: valid ? (warnings.length > 0 ? 'warning' : 'valid') : 'corrupted',
    errors,
    warnings,
    stats: {
      roles: backupDoc.data.roles?.length || 0,
      channels: backupDoc.data.channels?.length || 0,
      botConfigs: Object.keys(backupDoc.data.botConfigs || {}).length,
    },
  };
}
export async function compareBackup(guild, backupDoc) {
  if (!backupDoc?.data) {
    return { success: false, message: 'Sauvegarde invalide ou sans données.' };
  }
  try {
    await guild.roles.fetch();
    await guild.channels.fetch();
  } catch {}
  const currentRoles = guild.roles.cache;
  const currentChannels = guild.channels.cache;
  const comparison = {
    roles: {
      missingInServer: [], 
      extraInServer: [],   
      modified: [],        
      identical: 0,
    },
    channels: {
      missingInServer: [],
      extraInServer: [],
      modified: [],
      identical: 0,
    },
    botConfigs: {
      availableInBackup: Object.keys(backupDoc.data.botConfigs || {}),
    },
  };
  const backupRoles = backupDoc.data.roles || [];
  const backupRoleMap = new Map(backupRoles.map((r) => [r.id, r]));
  const backupRoleNames = new Map(backupRoles.filter((r) => r.name).map((r) => [r.name.toLowerCase(), r]));
  for (const bRole of backupRoles) {
    if (bRole.isEveryone) continue;
    const liveRole =
      currentRoles.get(bRole.id) ||
      findInCache(currentRoles, (r) => r.name && bRole.name && r.name.toLowerCase() === bRole.name.toLowerCase());

    if (!liveRole) {
      comparison.roles.missingInServer.push({ name: bRole.name, color: bRole.hexColor });
    } else {
      const diffs = [];
      if (liveRole.name !== bRole.name) diffs.push(`Nom : "${liveRole.name}" vs "${bRole.name}"`);
      if (liveRole.hexColor.toLowerCase() !== bRole.hexColor?.toLowerCase()) diffs.push(`Couleur : ${liveRole.hexColor} vs ${bRole.hexColor}`);
      if (liveRole.hoist !== bRole.hoist) diffs.push(`Affichage séparé : ${liveRole.hoist ? 'Oui' : 'Non'} vs ${bRole.hoist ? 'Oui' : 'Non'}`);
      if (diffs.length > 0) {
        comparison.roles.modified.push({ name: liveRole.name, differences: diffs });
      } else {
        comparison.roles.identical++;
      }
    }
  }
  for (const [, lRole] of currentRoles) {
    if (lRole.id === guild.id) continue;
    if (!backupRoleMap.has(lRole.id) && lRole.name && !backupRoleNames.has(lRole.name.toLowerCase())) {
      comparison.roles.extraInServer.push({ name: lRole.name, color: lRole.hexColor });
    }
  }
  const backupChannels = backupDoc.data.channels || [];
  const backupChanMap = new Map(backupChannels.map((c) => [c.id, c]));
  const backupChanNames = new Map(backupChannels.filter((c) => c.name).map((c) => [`${c.name.toLowerCase()}_${c.type}`, c]));
  for (const bChan of backupChannels) {
    const liveChan =
      currentChannels.get(bChan.id) ||
      findInCache(currentChannels, (c) => c.name && bChan.name && c.name.toLowerCase() === bChan.name.toLowerCase() && c.type === bChan.type);
    if (!liveChan) {
      comparison.channels.missingInServer.push({ name: bChan.name, type: bChan.type });
    } else {
      const diffs = [];
      if (liveChan.name !== bChan.name) diffs.push(`Nom : "${liveChan.name}" vs "${bChan.name}"`);
      if (bChan.topic && liveChan.topic !== bChan.topic) diffs.push('Description différente');
      if (bChan.nsfw !== undefined && liveChan.nsfw !== bChan.nsfw) diffs.push(`NSFW : ${liveChan.nsfw} vs ${bChan.nsfw}`);
      if (diffs.length > 0) {
        comparison.channels.modified.push({ name: liveChan.name, differences: diffs });
      } else {
        comparison.channels.identical++;
      }
    }
  }
  for (const [, lChan] of currentChannels) {
    if (!backupChanMap.has(lChan.id) && !backupChanNames.has(`${lChan.name.toLowerCase()}_${lChan.type}`)) {
      comparison.channels.extraInServer.push({ name: lChan.name, type: lChan.type });
    }
  }
  return { success: true, comparison };
}
export async function testRestore(guild, backupDoc, options = {}) {
  const { mode = 'merge' } = options;
  const plan = {
    rolesToCreate: [],
    rolesToUpdate: [],
    rolesToSkip: [],
    categoriesToCreate: [],
    channelsToCreate: [],
    channelsToUpdate: [],
    botConfigsToApply: [],
    warnings: [],
    botPermissions: {
      hasAdmin: guild.members.me?.permissions.has(PermissionFlagsBits.Administrator),
      hasManageRoles: guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles),
      hasManageChannels: guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels),
    },
  };
  const botHighestRole = guild.members.me?.roles.highest.position || 0;
  if (!plan.botPermissions.hasManageRoles && !plan.botPermissions.hasAdmin) {
    plan.warnings.push('⚠️ Le bot ne possède pas la permission "Gérer les rôles" requise.');
  }
  if (!plan.botPermissions.hasManageChannels && !plan.botPermissions.hasAdmin) {
    plan.warnings.push('⚠️ Le bot ne possède pas la permission "Gérer les salons" requise.');
  }
  const backupRoles = backupDoc.data?.roles || [];
  for (const r of backupRoles) {
    if (r.isEveryone || r.managed) {
      plan.rolesToSkip.push({ name: r.name, reason: r.isEveryone ? '@everyone par défaut' : 'Géré par une intégration/bot' });
      continue;
    }
    if (r.position >= botHighestRole && !plan.botPermissions.hasAdmin) {
      plan.warnings.push(`Le rôle "${r.name}" est au-dessus ou au niveau du rôle du bot (position ${r.position} vs ${botHighestRole}).`);
    }
    const existing = findInCache(guild.roles.cache, (live) => live.name && r.name && live.name.toLowerCase() === r.name.toLowerCase());
    if (existing) {
      plan.rolesToUpdate.push({ name: r.name, id: existing.id });
    } else {
      plan.rolesToCreate.push({ name: r.name, color: r.hexColor });
    }
  }
  const backupChannels = backupDoc.data?.channels || [];
  for (const c of backupChannels) {
    const existing = findInCache(guild.channels.cache, (live) => live.name && c.name && live.name.toLowerCase() === c.name.toLowerCase() && live.type === c.type);
    if (c.type === ChannelType.GuildCategory) {
      if (!existing) plan.categoriesToCreate.push({ name: c.name });
    } else {
      if (existing) {
        plan.channelsToUpdate.push({ name: c.name, id: existing.id });
      } else {
        plan.channelsToCreate.push({ name: c.name, type: c.type });
      }
    }
  }
  const botConfigs = backupDoc.data?.botConfigs || {};
  plan.botConfigsToApply = Object.keys(botConfigs);
  return plan;
}
export function cancelRestore(guildId) {
  const op = activeOperations.get(guildId);
  if (op) {
    op.cancelRequested = true;
    return true;
  }
  return false;
}
export async function restoreBackup(guild, backupDoc, author, options = {}) {
  const {
    mode = 'merge',
    categories = ['roles', 'channels', 'bot_config'],
    createPreBackup = true,
  } = options;
  if (activeOperations.has(guild.id)) {
    throw new Error('Une opération de restauration est déjà en cours sur ce serveur.');
  }
  const opState = { cancelRequested: false, stage: 'INITIALISATION', startedAt: new Date() };
  activeOperations.set(guild.id, opState);
  const report = {
    success: false,
    createdRoles: [],
    updatedRoles: [],
    createdCategories: [],
    createdChannels: [],
    updatedChannels: [],
    restoredConfigs: [],
    errors: [],
    warnings: [],
    preBackupId: null,
  };
  try {
    if (createPreBackup) {
      try {
        const preBk = await createBackup(guild, author, {
          name: `PreRestore-${new Date().toISOString().slice(0, 16).replace('T', '_')}`,
          description: `Sauvegarde automatique de sécurité avant restauration de ${backupDoc.name}`,
          type: BACKUP_TYPES.PRE_MODIFICATION,
          reason: 'Sécurité pré-restauration',
        });
        report.preBackupId = preBk.backup_id;
      } catch (preErr) {
        report.warnings.push(`Impossible de créer la sauvegarde pré-restauration : ${preErr.message}`);
      }
    }
    const roleIdMap = new Map(); 
    const channelIdMap = new Map(); 
    if (categories.includes('roles') && backupDoc.data?.roles) {
      opState.stage = 'ROLES';
      const botHighestRole = guild.members.me?.roles.highest.position || 0;
      const sortedRoles = [...backupDoc.data.roles].sort((a, b) => a.position - b.position);
      for (const r of sortedRoles) {
        if (opState.cancelRequested) throw new Error('Restauration interrompue par l\'utilisateur.');
        if (r.isEveryone) {
          roleIdMap.set(r.id, guild.id);
          continue;
        }
        if (r.managed) continue;
        let targetRole = findInCache(guild.roles.cache, (live) => live.name && r.name && live.name.toLowerCase() === r.name.toLowerCase());
        try {
          if (!targetRole) {
            targetRole = await guild.roles.create({
              name: r.name,
              color: r.color,
              hoist: r.hoist,
              mentionable: r.mentionable,
              permissions: BigInt(r.permissions || 0),
              reason: `Restauration Sauvegarde [${backupDoc.name}]`,
            });
            report.createdRoles.push(targetRole.name);
            await delay(400);
          } else {
            if (targetRole.position < botHighestRole) {
              await targetRole.edit({
                color: r.color,
                hoist: r.hoist,
                mentionable: r.mentionable,
                permissions: BigInt(r.permissions || 0),
                reason: `Restauration Sauvegarde [${backupDoc.name}]`,
              }).catch(() => {});
              report.updatedRoles.push(targetRole.name);
              await delay(300);
            } else {
              report.warnings.push(`Rôle "${targetRole.name}" ignoré car supérieur au rôle du bot.`);
            }
          }
          roleIdMap.set(r.id, targetRole.id);
        } catch (rErr) {
          report.errors.push(`Erreur restauration rôle "${r.name}": ${rErr.message}`);
        }
      }
    }
    if (categories.includes('channels') && backupDoc.data?.channels) {
      opState.stage = 'CATEGORIES';
      const categoriesBackup = backupDoc.data.channels.filter((c) => c.type === ChannelType.GuildCategory);
      for (const cat of categoriesBackup) {
        if (opState.cancelRequested) throw new Error('Restauration interrompue par l\'utilisateur.');
        let liveCat = findInCache(
          guild.channels.cache,
          (c) => c.type === ChannelType.GuildCategory && c.name && cat.name && c.name.toLowerCase() === cat.name.toLowerCase()
        );
        try {
          if (!liveCat) {
            liveCat = await guild.channels.create({
              name: cat.name,
              type: ChannelType.GuildCategory,
              position: cat.position,
              reason: `Restauration Sauvegarde [${backupDoc.name}]`,
            });
            report.createdCategories.push(liveCat.name);
            await delay(450);
          }
          channelIdMap.set(cat.id, liveCat.id);
        } catch (catErr) {
          report.errors.push(`Erreur création catégorie "${cat.name}": ${catErr.message}`);
        }
      }
      opState.stage = 'CHANNELS';
      const otherChannels = backupDoc.data.channels.filter((c) => c.type !== ChannelType.GuildCategory);
      for (const ch of otherChannels) {
        if (opState.cancelRequested) throw new Error('Restauration interrompue par l\'utilisateur.');
        let liveChan = findInCache(
          guild.channels.cache,
          (c) => c.type === ch.type && c.name && ch.name && c.name.toLowerCase() === ch.name.toLowerCase()
        );
        const newParentId = ch.parentId ? channelIdMap.get(ch.parentId) : null;
        try {
          if (!liveChan) {
            liveChan = await guild.channels.create({
              name: ch.name,
              type: ch.type,
              parent: newParentId,
              topic: ch.topic || undefined,
              nsfw: ch.nsfw,
              rateLimitPerUser: ch.rateLimitPerUser,
              bitrate: ch.bitrate || undefined,
              userLimit: ch.userLimit || undefined,
              position: ch.position,
              reason: `Restauration Sauvegarde [${backupDoc.name}]`,
            });
            report.createdChannels.push(liveChan.name);
            await delay(450);
          } else {
            if (newParentId && liveChan.parentId !== newParentId) {
              await liveChan.setParent(newParentId).catch(() => {});
            }
            report.updatedChannels.push(liveChan.name);
          }
          channelIdMap.set(ch.id, liveChan.id);
          if (ch.permissionOverwrites?.length && liveChan.permissionOverwrites) {
            const mappedOverwrites = [];
            for (const ow of ch.permissionOverwrites) {
              let targetId = ow.id;
              if (ow.type === 0) {
                targetId = roleIdMap.get(ow.id) || ow.id;
              }
              mappedOverwrites.push({
                id: targetId,
                type: ow.type,
                allow: BigInt(ow.allow || 0),
                deny: BigInt(ow.deny || 0),
              });
            }
            await liveChan.permissionOverwrites.set(mappedOverwrites, `Permissions restauration [${backupDoc.name}]`).catch(() => {});
            await delay(300);
          }
        } catch (chErr) {
          report.errors.push(`Erreur création salon "${ch.name}": ${chErr.message}`);
        }
      }
    }
    if (categories.includes('bot_config') && backupDoc.data?.botConfigs) {
      opState.stage = 'BOT_CONFIG';
      const db = safeGetDb();
      if (db) {
        const cfgs = backupDoc.data.botConfigs;
        if (cfgs.welcome) {
          await db.collection('config').updateOne(
            { _id: `welcome_config_${guild.id}` },
            { $set: { ...cfgs.welcome, _id: `welcome_config_${guild.id}`, guild_id: guild.id } },
            { upsert: true }
          );
          report.restoredConfigs.push('Message & Rôles de Bienvenue');
        }
        if (cfgs.tickets) {
          await db.collection('config').updateOne(
            { _id: `ticket_config_${guild.id}` },
            { $set: { ...cfgs.tickets, _id: `ticket_config_${guild.id}`, guild_id: guild.id } },
            { upsert: true }
          );
          report.restoredConfigs.push('Système de Tickets Support');
        }
        if (cfgs.suggestions) {
          await db.collection('config').updateOne(
            { _id: `suggestion_config_${guild.id}` },
            { $set: { ...cfgs.suggestions, _id: `suggestion_config_${guild.id}` } },
            { upsert: true }
          );
          report.restoredConfigs.push('Boîte à Suggestions');
        }
        if (cfgs.serverStats) {
          await db.collection('config').updateOne(
            { _id: `server_stats_${guild.id}` },
            { $set: { ...cfgs.serverStats, _id: `server_stats_${guild.id}`, guild_id: guild.id } },
            { upsert: true }
          );
          report.restoredConfigs.push('Statistiques Serveur Vocales');
        }
        if (cfgs.tempVoice) {
          await db.collection('temp_voice_config').updateOne(
            { guild_id: guild.id },
            { $set: { ...cfgs.tempVoice, guild_id: guild.id } },
            { upsert: true }
          );
          report.restoredConfigs.push('Salons Vocaux Temporaires');
        }
        if (cfgs.discordLogs) {
          await db.collection('discord_logs_config').updateOne(
            { guild_id: guild.id },
            { $set: { ...cfgs.discordLogs, guild_id: guild.id } },
            { upsert: true }
          );
          report.restoredConfigs.push('Logs et Alertes Discord');
        }
        if (cfgs.tags?.length) {
          for (const t of cfgs.tags) {
            await db.collection('server_tags').updateOne(
              { guild_id: guild.id, name: t.name },
              { $set: { ...t, guild_id: guild.id, updated_at: new Date() } },
              { upsert: true }
            );
          }
          report.restoredConfigs.push(`${cfgs.tags.length} Tags Serveur`);
        }
        if (cfgs.automations?.length) {
          for (const auto of cfgs.automations) {
            await db.collection('bot_automations').updateOne(
              { guild_id: guild.id, name: auto.name },
              { $set: { ...auto, guild_id: guild.id, updated_at: new Date() } },
              { upsert: true }
            );
          }
          report.restoredConfigs.push(`${cfgs.automations.length} Automatisations`);
        }
        if (cfgs.autoResponses?.length) {
          for (const ar of cfgs.autoResponses) {
            await db.collection('bot_auto_responses').updateOne(
              { guild_id: guild.id, trigger: ar.trigger },
              { $set: { ...ar, guild_id: guild.id, updated_at: new Date() } },
              { upsert: true }
            );
          }
          report.restoredConfigs.push(`${cfgs.autoResponses.length} Réponses Automatiques`);
        }
        if (cfgs.starboard) {
          await db.collection('server_starboards').updateOne(
            { guild_id: guild.id },
            { $set: { ...cfgs.starboard, guild_id: guild.id, updated_at: new Date() } },
            { upsert: true }
          );
          report.restoredConfigs.push('Configuration Starboard');
        }
        if (cfgs.counting) {
          await db.collection('server_counting').updateOne(
            { guild_id: guild.id },
            { $set: { ...cfgs.counting, guild_id: guild.id, updated_at: new Date() } },
            { upsert: true }
          );
          report.restoredConfigs.push('Salon de Comptage');
        }
        if (cfgs.botLists?.length) {
          for (const bl of cfgs.botLists) {
            await db.collection('bot_lists').updateOne(
              { guild_id: guild.id, name: bl.name },
              { $set: { ...bl, guild_id: guild.id, updated_at: new Date() } },
              { upsert: true }
            );
          }
          report.restoredConfigs.push(`${cfgs.botLists.length} Listes Automatisées`);
        }
      }
    }
    report.success = report.errors.length === 0;
    const db = safeGetDb();
    if (db) {
      await db.collection('backup_history').insertOne({
        guild_id: guild.id,
        action: 'RESTORE',
        backup_id: backupDoc.backup_id,
        backup_name: backupDoc.name,
        author: {
          id: author?.id || 'SYSTEM',
          tag: author?.tag || author?.username || 'Système',
        },
        timestamp: new Date(),
        details: `Restauration mode ${mode} : ${report.createdRoles.length} rôles, ${report.createdChannels.length} salons, ${report.restoredConfigs.length} modules bot.`,
        success: report.success,
      });
    }
  } finally {
    activeOperations.delete(guild.id);
  }
  return report;
}
export async function exportBackup(guildId, backupId) {
  const backup = await getBackup(guildId, backupId);
  if (!backup) {
    return { success: false, message: 'Sauvegarde introuvable.' };
  }
  const exportPayload = {
    manifest: {
      generator: 'Saez Discord Bot - Backup Engine',
      version: SCHEMA_VERSION,
      exported_at: new Date().toISOString(),
      backup_id: backup.backup_id,
      guild_id: backup.guild_id,
      guild_name: backup.guild_name,
      checksum: backup.checksum,
      type: backup.type,
      counts: backup.counts,
    },
    meta: {
      name: backup.name,
      description: backup.description,
      author: backup.author,
      created_at: backup.created_at,
    },
    data: sanitizeData(backup.data),
  };
  const jsonString = JSON.stringify(exportPayload, null, 2);
  const buffer = Buffer.from(jsonString, 'utf-8');
  const filename = `backup-${backup.guild_id}-${backup.backup_id}.json`;
  return {
    success: true,
    buffer,
    filename,
    sizeBytes: buffer.length,
    backup,
  };
}
export async function importBackup(guildId, guildName, jsonContentOrBuffer, author) {
  let parsed;
  try {
    const raw = Buffer.isBuffer(jsonContentOrBuffer)
      ? jsonContentOrBuffer.toString('utf-8')
      : String(jsonContentOrBuffer);
    if (raw.length > 20 * 1024 * 1024) {
      return { success: false, message: 'Fichier trop volumineux (dépasse la limite de 20 Mo).' };
    }
    parsed = JSON.parse(raw);
  } catch (parseErr) {
    return { success: false, message: `Format JSON invalide ou corrompu : ${parseErr.message}` };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || parsed.__proto__ !== Object.prototype) {
  }
  const data = parsed.data || parsed;
  const meta = parsed.meta || {};
  const manifest = parsed.manifest || {};
  if (!data || (typeof data !== 'object')) {
    return { success: false, message: 'Structure de sauvegarde incompatible : données introuvables.' };
  }
  const cleanData = sanitizeData(data);
  const checksum = computeChecksum(cleanData);
  const newBackupId = generateBackupId();
  const backupDoc = {
    backup_id: newBackupId,
    guild_id: guildId, 
    guild_name: guildName,
    name: meta.name ? `Import: ${meta.name}` : `Import-${new Date().toISOString().slice(0, 10)}`,
    description: meta.description || 'Sauvegarde importée depuis un fichier JSON.',
    author: {
      id: author?.id || 'SYSTEM',
      tag: author?.tag || author?.username || 'Système',
    },
    created_at: new Date(),
    type: manifest.type || BACKUP_TYPES.FULL,
    schema_version: manifest.version || SCHEMA_VERSION,
    is_auto: false,
    reason: 'Importation manuelle depuis fichier',
    size_bytes: Buffer.byteLength(JSON.stringify(cleanData), 'utf8'),
    counts: {
      roles: cleanData.roles?.length || 0,
      channels: cleanData.channels?.filter((c) => c.type !== ChannelType.GuildCategory).length || 0,
      categories: cleanData.channels?.filter((c) => c.type === ChannelType.GuildCategory).length || 0,
      members: 0,
      bot_modules: Object.keys(cleanData.botConfigs || {}).length,
    },
    checksum,
    data: cleanData,
    validation: {
      status: 'valid',
      checked_at: new Date(),
      issues: [],
    },
  };
  const verification = verifyBackup(backupDoc);
  if (!verification.valid) {
    return {
      success: false,
      message: `Le fichier importé échoue à la vérification d'intégrité : ${verification.errors.join(', ')}`,
      errors: verification.errors,
    };
  }
  const db = safeGetDb();
  if (db) {
    await db.collection('server_backups').insertOne(backupDoc);
    await db.collection('backup_history').insertOne({
      guild_id: guildId,
      action: 'IMPORT',
      backup_id: newBackupId,
      backup_name: backupDoc.name,
      author: backupDoc.author,
      timestamp: new Date(),
      details: `Importation réussie (${backupDoc.counts.roles} rôles, ${backupDoc.counts.channels} salons).`,
    });
  }
  return { success: true, backup: backupDoc, verification };
}
export async function enforceRetentionPolicy(guildId) {
  const db = safeGetDb();
  if (!db) return;
  const settings = await getBackupSettings(guildId);
  const maxRetained = settings.retention_count || 10;
  const autoBackups = await db
    .collection('server_backups')
    .find({ guild_id: guildId, is_auto: true })
    .sort({ created_at: -1 })
    .toArray();
  if (autoBackups.length > maxRetained) {
    const toDelete = autoBackups.slice(maxRetained);
    const idsToDelete = toDelete.map((b) => b.backup_id);
    await db.collection('server_backups').deleteMany({
      guild_id: guildId,
      backup_id: { $in: idsToDelete },
    });
    console.log(`[BackupService] 🧹 Rétention : ${idsToDelete.length} ancienne(s) sauvegarde(s) auto nettoyée(s) pour ${guildId}`);
  }
}
export async function cleanupBackups(guildId, options = {}) {
  const { olderThanDays = 30, keepMin = 3, onlyAuto = true } = options;
  const db = safeGetDb();
  if (!db) return { deletedCount: 0 };
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const query = {
    guild_id: guildId,
    created_at: { $lt: cutoff },
  };
  if (onlyAuto) {
    query.is_auto = true;
  }
  const totalCount = await db.collection('server_backups').countDocuments({ guild_id: guildId });
  if (totalCount <= keepMin) {
    return { deletedCount: 0, reason: `Le serveur ne possède que ${totalCount} sauvegardes (minimum garanti de ${keepMin}).` };
  }
  const res = await db.collection('server_backups').deleteMany(query);
  return { deletedCount: res.deletedCount || 0 };
}
export async function getBackupSettings(guildId) {
  const db = safeGetDb();
  if (!db) {
    return {
      guild_id: guildId,
      enabled: true,
      auto_backup_enabled: false,
      auto_backup_frequency: 'daily',
      retention_count: 10,
      notify_channel_id: null,
      default_type: BACKUP_TYPES.FULL,
    };
  }
  const doc = await db.collection('backup_settings').findOne({ _id: guildId });
  return (
    doc || {
      _id: guildId,
      guild_id: guildId,
      enabled: true,
      auto_backup_enabled: false,
      auto_backup_frequency: 'daily',
      retention_count: 10,
      notify_channel_id: null,
      default_type: BACKUP_TYPES.FULL,
    }
  );
}
export async function saveBackupSettings(guildId, updates) {
  const db = safeGetDb();
  if (!db) return false;
  await db.collection('backup_settings').updateOne(
    { _id: guildId },
    { $set: { ...updates, guild_id: guildId, updated_at: new Date() } },
    { upsert: true }
  );
  return true;
}
export async function getBackupStats(guildId) {
  const db = safeGetDb();
  if (!db) return null;
  const total = await db.collection('server_backups').countDocuments({ guild_id: guildId });
  const autoCount = await db.collection('server_backups').countDocuments({ guild_id: guildId, is_auto: true });
  const manualCount = total - autoCount;
  const sizeAggregation = await db
    .collection('server_backups')
    .aggregate([
      { $match: { guild_id: guildId } },
      { $group: { _id: null, totalBytes: { $sum: '$size_bytes' } } },
    ])
    .toArray();
  const totalBytes = sizeAggregation[0]?.totalBytes || 0;
  const newest = await db
    .collection('server_backups')
    .find({ guild_id: guildId })
    .sort({ created_at: -1 })
    .limit(1)
    .toArray();
  const oldest = await db
    .collection('server_backups')
    .find({ guild_id: guildId })
    .sort({ created_at: 1 })
    .limit(1)
    .toArray();
  const settings = await getBackupSettings(guildId);
  return {
    total,
    autoCount,
    manualCount,
    totalBytes,
    totalSizeReadable: (totalBytes / 1024).toFixed(2) + ' Ko',
    lastBackup: newest[0] ? newest[0].created_at : null,
    oldestBackup: oldest[0] ? oldest[0].created_at : null,
    settings,
  };
}
export async function getBackupHistory(guildId, limit = 10) {
  const db = safeGetDb();
  if (!db) return [];
  return await db
    .collection('backup_history')
    .find({ guild_id: guildId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
}
