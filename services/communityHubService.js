import crypto from 'node:crypto';
import { getDb } from '../database/mongo.js';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } from 'discord.js';
import { config } from '../config.js';
const memoryStore = {
  settings: new Map(),
  applications: new Map(),
  drafts: new Map(),
  birthdays: new Map(),
  birthdayWishes: new Map(),
  reputations: new Map(),
  reputationLogs: [],
  reputationReports: [],
  confessions: new Map(),
  debates: new Map(),
  mentorProfiles: new Map(),
  mentorships: new Map(),
  goals: new Map(),
  challenges: new Map(),
  thanks: new Map(),
  userProfiles: new Map(),
  helpRequests: new Map(),
  resources: new Map(),
  milestones: new Map(),
  guestbook: [],
};
export function safeGetDb() {
  try {
    return getDb();
  } catch {
    return null;
  }
}
export const DEFAULT_COMMUNITY_SETTINGS = {
  enabled: true,
  anniversaires_channel_id: null,
  confessions_channel_id: null,
  confessions_mod_channel_id: null,
  candidatures_channel_id: null,
  debats_channel_id: null,
  entraide_channel_id: null,
  merci_channel_id: null,
  staff_role_id: null,
  birthday_role_id: null,
  mentor_role_id: null,
  confessions_require_approval: true,
  reputation_cooldown_hours: 12,
  candidature_cooldown_days: 7,
  birthday_mention: 'none',
};
export async function getCommunitySettings(guildId) {
  const db = safeGetDb();
  if (db) {
    try {
      const doc = await db.collection('community_settings').findOne({ _id: guildId });
      if (doc) return { ...DEFAULT_COMMUNITY_SETTINGS, ...doc, guildId };
    } catch {}
  }
  const mem = memoryStore.settings.get(guildId);
  return { ...DEFAULT_COMMUNITY_SETTINGS, ...(mem || {}), guildId };
}
export async function saveCommunitySettings(guildId, updates) {
  const db = safeGetDb();
  const current = await getCommunitySettings(guildId);
  const updated = { ...current, ...updates, guildId, updatedAt: new Date() };
  if (db) {
    try {
      await db.collection('community_settings').updateOne(
        { _id: guildId },
        { $set: updated },
        { upsert: true }
      );
    } catch {}
  }
  memoryStore.settings.set(guildId, updated);
  return updated;
}
export async function isCommunityEnabled(guildId) {
  const settings = await getCommunitySettings(guildId);
  return settings.enabled !== false;
}
export const APPLICATION_ROLES = {
  MODERATEUR: 'Modérateur',
  ANIMATEUR: 'Animateur',
  HELPER: 'Helper',
  REDACTEUR: 'Rédacteur',
  DEVELOPPEUR: 'Développeur',
  BENEVOLE: 'Bénévole',
};
export const APPLICATION_MODELS = {
  [APPLICATION_ROLES.MODERATEUR]: {
    label: '🛡️ Modérateur',
    questions: [
      'Expérience passée en modération Discord',
      'Comment gérez-vous une situation conflictuelle en public ?',
      'Vos motivations pour rejoindre la modération Saez',
      'Vos disponibilités hebdomadaires (heures/jours)',
    ],
  },
  [APPLICATION_ROLES.ANIMATEUR]: {
    label: '🎉 Animateur',
    questions: [
      'Quels types d\'événements et jeux souhaitez-vous organiser ?',
      'Votre aisance à l\'oral et à l\'animation vocale',
      'Vos motivations pour animer la communauté Saez',
      'Vos disponibilités hebdomadaires',
    ],
  },
  [APPLICATION_ROLES.HELPER]: {
    label: '🤝 Helper / Entraide',
    questions: [
      'Vos domaines de prédilection (Anime, Technique, Discord, Jeux)',
      'Comment accueillez-vous un nouveau membre perdu ?',
      'Vos motivations pour aider les membres',
      'Vos créneaux de disponibilité',
    ],
  },
  [APPLICATION_ROLES.REDACTEUR]: {
    label: '✍️ Rédacteur Anime',
    questions: [
      'Vos genres d\'animes et mangas préférés',
      'Exemple ou extrait de critique / synopsis',
      'Votre rythme de publication envisageable',
      'Vos motivations',
    ],
  },
  [APPLICATION_ROLES.DEVELOPPEUR]: {
    label: '💻 Développeur Bot',
    questions: [
      'Votre maîtrise de JavaScript, Node.js et Discord.js v14',
      'Exemples de projets ou bots déjà réalisés',
      'Disponibilités et rigueur Git',
      'Vos motivations',
    ],
  },
  [APPLICATION_ROLES.BENEVOLE]: {
    label: '🌟 Bénévole de Projet',
    questions: [
      'Compétences que vous souhaitez apporter au projet',
      'Vos disponibilités',
      'Vos motivations',
    ],
  },
};
export async function saveApplicationDraft(guildId, userId, data) {
  const key = `${guildId}_${userId}`;
  const draft = {
    ...data,
    guildId,
    userId,
    updatedAt: new Date(),
  };
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('server_application_drafts').updateOne(
        { _id: key },
        { $set: draft },
        { upsert: true }
      );
    } catch {}
  }
  memoryStore.drafts.set(key, draft);
  return draft;
}
export async function getApplicationDraft(guildId, userId) {
  const key = `${guildId}_${userId}`;
  const db = safeGetDb();
  if (db) {
    try {
      const doc = await db.collection('server_application_drafts').findOne({ _id: key });
      if (doc) return doc;
    } catch {}
  }
  return memoryStore.drafts.get(key) || null;
}
export async function canApplyAgain(guildId, userId) {
  const settings = await getCommunitySettings(guildId);
  const cooldownDays = settings.candidature_cooldown_days || 7;
  const cutoff = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000);
  const apps = await getApplications(guildId, { userId });
  const pendingOrReview = apps.find((a) => ['pending', 'under_review', 'interview'].includes(a.status));
  if (pendingOrReview) {
    return {
      allowed: false,
      reason: `Vous avez déjà une candidature en cours de traitement pour le poste de **${pendingOrReview.role}** (Dossier \`${pendingOrReview._id}\`).`,
    };
  }
  const lastRejected = apps.find((a) => a.status === 'rejected');
  if (lastRejected && new Date(lastRejected.reviewedAt || lastRejected.createdAt) > cutoff) {
    const elapsed = Date.now() - new Date(lastRejected.reviewedAt || lastRejected.createdAt).getTime();
    const remainDays = Math.ceil((cooldownDays * 24 * 60 * 60 * 1000 - elapsed) / (1000 * 60 * 60 * 24));
    return {
      allowed: false,
      reason: `Votre dernière candidature a été refusée récemment. Vous pourrez déposer une nouvelle candidature dans environ **${remainDays} jour(s)**.`,
    };
  }
  return { allowed: true };
}
export async function submitApplication({
  guildId,
  userId,
  username,
  role,
  experience = '',
  motivation,
  availability = 'Flexible',
  answers = {},
}) {
  const check = await canApplyAgain(guildId, userId);
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }
  const id = `app_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
  const doc = {
    _id: id,
    guildId,
    userId,
    username,
    role,
    experience: experience.trim(),
    motivation: motivation.trim(),
    availability: availability.trim(),
    answers,
    status: 'pending', 
    reviewerId: null,
    reviewerName: null,
    assignedToId: null,
    assignedToName: null,
    reviewNote: null,
    interviewDate: null,
    comments: [], 
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('server_applications').insertOne(doc);
      await db.collection('server_application_drafts').deleteOne({ _id: `${guildId}_${userId}` });
    } catch {}
  }
  memoryStore.applications.set(id, doc);
  memoryStore.drafts.delete(`${guildId}_${userId}`);
  return { success: true, application: doc };
}
export async function getApplications(guildId, { status = null, role = null, userId = null, limit = 50 } = {}) {
  const db = safeGetDb();
  if (db) {
    try {
      const q = { guildId };
      if (status) q.status = status;
      if (role) q.role = role;
      if (userId) q.userId = userId;
      return await db.collection('server_applications').find(q).sort({ createdAt: -1 }).limit(limit).toArray();
    } catch {}
  }
  let list = Array.from(memoryStore.applications.values()).filter((a) => a.guildId === guildId);
  if (status) list = list.filter((a) => a.status === status);
  if (role) list = list.filter((a) => a.role === role);
  if (userId) list = list.filter((a) => a.userId === userId);
  return list.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
}
export async function getApplicationById(appId) {
  const db = safeGetDb();
  if (db) {
    try {
      const doc = await db.collection('server_applications').findOne({ _id: appId });
      if (doc) return doc;
    } catch {}
  }
  return memoryStore.applications.get(appId) || null;
}
export async function updateApplicationStatus(appId, status, reviewer, { note = '', reason = '', interviewDate = null } = {}) {
  const app = await getApplicationById(appId);
  if (!app) return { success: false, error: 'Candidature introuvable.' };
  const reviewerId = reviewer?.id || reviewer;
  const reviewerName = reviewer?.username || 'Staff';
  const updates = {
    status,
    reviewerId,
    reviewerName,
    reviewNote: note || reason || app.reviewNote,
    interviewDate: interviewDate || app.interviewDate,
    reviewedAt: new Date(),
    updatedAt: new Date(),
  };
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('server_applications').updateOne({ _id: appId }, { $set: updates });
    } catch {}
  }
  const merged = { ...app, ...updates };
  memoryStore.applications.set(appId, merged);
  return { success: true, application: merged };
}
export async function addApplicationComment(appId, authorId, authorName, text) {
  const app = await getApplicationById(appId);
  if (!app) return { success: false, error: 'Candidature introuvable.' };
  const comment = { authorId, authorName, text: text.trim(), date: new Date() };
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('server_applications').updateOne(
        { _id: appId },
        { $push: { comments: comment }, $set: { updatedAt: new Date() } }
      );
    } catch {}
  }
  if (!app.comments) app.comments = [];
  app.comments.push(comment);
  memoryStore.applications.set(appId, app);
  return { success: true, comment };
}
export async function assignApplication(appId, assignedToId, assignedToName) {
  const app = await getApplicationById(appId);
  if (!app) return { success: false, error: 'Candidature introuvable.' };
  const updates = { assignedToId, assignedToName, status: app.status === 'pending' ? 'under_review' : app.status, updatedAt: new Date() };
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('server_applications').updateOne({ _id: appId }, { $set: updates });
    } catch {}
  }
  const merged = { ...app, ...updates };
  memoryStore.applications.set(appId, merged);
  return { success: true, application: merged };
}
export async function cancelApplication(appId, userId) {
  const app = await getApplicationById(appId);
  if (!app) return { success: false, error: 'Candidature introuvable.' };
  if (app.userId !== userId) return { success: false, error: 'Vous ne pouvez pas annuler la candidature d\'un autre membre.' };
  if (['accepted', 'rejected'].includes(app.status)) {
    return { success: false, error: 'Impossible d\'annuler une candidature déjà finalisée.' };
  }
  const updates = { status: 'cancelled', updatedAt: new Date() };
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('server_applications').updateOne({ _id: appId }, { $set: updates });
    } catch {}
  }
  const merged = { ...app, ...updates };
  memoryStore.applications.set(appId, merged);
  return { success: true, application: merged };
}
export async function getApplicationStats(guildId) {
  const apps = await getApplications(guildId, { limit: 500 });
  const total = apps.length;
  const accepted = apps.filter((a) => a.status === 'accepted').length;
  const rejected = apps.filter((a) => a.status === 'rejected').length;
  const pending = apps.filter((a) => a.status === 'pending').length;
  const underReview = apps.filter((a) => ['under_review', 'interview'].includes(a.status)).length;
  const reviewed = apps.filter((a) => a.reviewedAt && a.createdAt);
  let avgProcessingHours = 0;
  if (reviewed.length > 0) {
    const totalMs = reviewed.reduce((sum, a) => sum + (new Date(a.reviewedAt).getTime() - new Date(a.createdAt).getTime()), 0);
    avgProcessingHours = Math.round(totalMs / reviewed.length / (1000 * 60 * 60));
  }
  return { total, accepted, rejected, pending, underReview, avgProcessingHours };
}
export async function setUserBirthday(
  guildId,
  userId,
  username,
  day,
  month,
  { year = null, showAge = false, visibility = 'public', timezone = 'Europe/Paris' } = {}
) {
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = year ? parseInt(year, 10) : null;
  if (isNaN(d) || d < 1 || d > 31 || isNaN(m) || m < 1 || m > 12) {
    throw new Error('Date d\'anniversaire invalide (jour entre 1 et 31, mois entre 1 et 12).');
  }
  const doc = {
    guildId,
    userId,
    username,
    day: d,
    month: m,
    year: y,
    showAge: Boolean(showAge && y),
    visibility, 
    timezone,
    lastAnnouncedYear: null,
    updatedAt: new Date(),
  };
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('user_birthdays').updateOne({ guildId, userId }, { $set: doc }, { upsert: true });
    } catch {}
  }
  memoryStore.birthdays.set(`${guildId}_${userId}`, doc);
  return doc;
}
export async function getUserBirthday(guildId, userId) {
  const db = safeGetDb();
  if (db) {
    try {
      const doc = await db.collection('user_birthdays').findOne({ guildId, userId });
      if (doc) return doc;
    } catch {}
  }
  return memoryStore.birthdays.get(`${guildId}_${userId}`) || null;
}
export async function deleteUserBirthday(guildId, userId) {
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('user_birthdays').deleteOne({ guildId, userId });
    } catch {}
  }
  memoryStore.birthdays.delete(`${guildId}_${userId}`);
  return true;
}
export async function getUpcomingBirthdays(guildId, limit = 10, includePrivate = false) {
  const db = safeGetDb();
  let list = [];
  if (db) {
    try {
      list = await db.collection('user_birthdays').find({ guildId }).toArray();
    } catch {}
  }
  if (!list.length) {
    list = Array.from(memoryStore.birthdays.values()).filter((b) => b.guildId === guildId);
  }
  if (!includePrivate) {
    list = list.filter((b) => b.visibility !== 'private');
  }
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  list.sort((a, b) => {
    const aDiff = (a.month - currentMonth) * 31 + (a.day - currentDay);
    const bDiff = (b.month - currentMonth) * 31 + (b.day - currentDay);
    const aNorm = aDiff < 0 ? aDiff + 372 : aDiff;
    const bNorm = bDiff < 0 ? bDiff + 372 : bDiff;
    return aNorm - bNorm;
  });
  return list.slice(0, limit);
}
export async function getTodayBirthdays(guildId, targetDate = new Date()) {
  const list = await getUpcomingBirthdays(guildId, 100, false);
  const m = targetDate.getMonth() + 1;
  const d = targetDate.getDate();
  return list.filter((b) => b.month === m && b.day === d);
}
export async function sendBirthdayWish(guildId, targetUserId, fromUserId, message = 'Joyeux anniversaire ! 🎉') {
  if (targetUserId === fromUserId) {
    return { success: false, error: 'Vous ne pouvez pas vous souhaiter vous-même un joyeux anniversaire !' };
  }
  const key = `${guildId}_${targetUserId}`;
  const wish = { fromUserId, message: message.trim(), createdAt: new Date() };
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('birthday_wishes').insertOne({ guildId, targetUserId, fromUserId, message: message.trim(), createdAt: new Date() });
    } catch {}
  }
  const current = memoryStore.birthdayWishes.get(key) || [];
  current.push(wish);
  memoryStore.birthdayWishes.set(key, current);
  return { success: true, count: current.length };
}
export async function getBirthdayWishes(guildId, targetUserId) {
  const db = safeGetDb();
  if (db) {
    try {
      return await db.collection('birthday_wishes').find({ guildId, targetUserId }).toArray();
    } catch {}
  }
  return memoryStore.birthdayWishes.get(`${guildId}_${targetUserId}`) || [];
}
export async function giveReputation(guildId, fromUserId, toUserId, reason = '') {
  if (fromUserId === toUserId) {
    return { success: false, message: 'Vous ne pouvez pas vous donner de la réputation à vous-même !' };
  }
  const settings = await getCommunitySettings(guildId);
  const cooldownHours = settings.reputation_cooldown_hours || 12;
  const cutoff = new Date(Date.now() - cooldownHours * 60 * 60 * 1000);
  const db = safeGetDb();
  let lastLog = null;
  if (db) {
    try {
      lastLog = await db.collection('reputation_logs').findOne({
        guildId,
        fromUserId,
        createdAt: { $gte: cutoff },
      });
    } catch {}
  }
  if (!lastLog) {
    lastLog = memoryStore.reputationLogs.find(
      (l) => l.guildId === guildId && l.fromUserId === fromUserId && l.createdAt >= cutoff
    );
  }
  if (lastLog) {
    const elapsed = Date.now() - new Date(lastLog.createdAt).getTime();
    const remainMs = cooldownHours * 60 * 60 * 1000 - elapsed;
    const remainHours = Math.ceil(remainMs / (1000 * 60 * 60));
    return {
      success: false,
      message: `Vous avez déjà attribué un point de réputation récemment. Revenez dans environ **${remainHours} heure(s)**.`,
    };
  }
  const reciprocalCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let reciprocal = null;
  if (db) {
    try {
      reciprocal = await db.collection('reputation_logs').findOne({
        guildId,
        fromUserId: toUserId,
        toUserId: fromUserId,
        createdAt: { $gte: reciprocalCutoff },
      });
    } catch {}
  }
  if (!reciprocal) {
    reciprocal = memoryStore.reputationLogs.find(
      (l) => l.guildId === guildId && l.fromUserId === toUserId && l.toUserId === fromUserId && l.createdAt >= reciprocalCutoff
    );
  }
  const logId = `rep_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
  const logDoc = {
    _id: logId,
    guildId,
    fromUserId,
    toUserId,
    reason: (reason || 'Entraide & sympathie').trim(),
    isSuspicious: Boolean(reciprocal),
    createdAt: new Date(),
  };
  if (db) {
    try {
      await db.collection('user_reputations').updateOne(
        { guildId, userId: toUserId },
        { $inc: { points: 1 }, $set: { updatedAt: new Date() } },
        { upsert: true }
      );
      await db.collection('reputation_logs').insertOne(logDoc);
    } catch {}
  }
  const userKey = `${guildId}_${toUserId}`;
  const curPoints = (memoryStore.reputations.get(userKey) || 0) + 1;
  memoryStore.reputations.set(userKey, curPoints);
  memoryStore.reputationLogs.push(logDoc);
  return {
    success: true,
    points: curPoints,
    logId,
    isSuspicious: Boolean(reciprocal),
  };
}
export async function getUserReputation(guildId, userId) {
  const db = safeGetDb();
  if (db) {
    try {
      const doc = await db.collection('user_reputations').findOne({ guildId, userId });
      if (doc) return doc.points || 0;
    } catch {}
  }
  return memoryStore.reputations.get(`${guildId}_${userId}`) || 0;
}
export async function getTopReputation(guildId, limit = 10, period = 'all') {
  const db = safeGetDb();
  if (period === 'all') {
    if (db) {
      try {
        return await db.collection('user_reputations').find({ guildId }).sort({ points: -1 }).limit(limit).toArray();
      } catch {}
    }
    const list = Array.from(memoryStore.reputations.entries())
      .filter(([k]) => k.startsWith(`${guildId}_`))
      .map(([k, pts]) => ({ userId: k.replace(`${guildId}_`, ''), points: pts }));
    return list.sort((a, b) => b.points - a.points).slice(0, limit);
  }
  const days = period === 'week' ? 7 : 30;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  if (db) {
    try {
      const agg = await db.collection('reputation_logs').aggregate([
        { $match: { guildId, createdAt: { $gte: cutoff } } },
        { $group: { _id: '$toUserId', points: { $sum: 1 } } },
        { $sort: { points: -1 } },
        { $limit: limit },
      ]).toArray();
      return agg.map((r) => ({ userId: r._id, points: r.points }));
    } catch {}
  }
  const counts = new Map();
  for (const log of memoryStore.reputationLogs) {
    if (log.guildId === guildId && log.createdAt >= cutoff) {
      counts.set(log.toUserId, (counts.get(log.toUserId) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([userId, points]) => ({ userId, points }))
    .sort((a, b) => b.points - a.points)
    .slice(0, limit);
}
export async function getReputationHistory(guildId, userId, type = 'received', limit = 10) {
  const db = safeGetDb();
  const q = { guildId };
  if (type === 'received') q.toUserId = userId;
  else if (type === 'given') q.fromUserId = userId;
  else q.$or = [{ toUserId: userId }, { fromUserId: userId }];
  if (db) {
    try {
      return await db.collection('reputation_logs').find(q).sort({ createdAt: -1 }).limit(limit).toArray();
    } catch {}
  }
  return memoryStore.reputationLogs
    .filter((l) => {
      if (l.guildId !== guildId) return false;
      if (type === 'received') return l.toUserId === userId;
      if (type === 'given') return l.fromUserId === userId;
      return l.toUserId === userId || l.fromUserId === userId;
    })
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}
export async function reportReputation(guildId, logId, reporterId, reason) {
  const report = {
    guildId,
    logId,
    reporterId,
    reason: reason.trim(),
    createdAt: new Date(),
  };
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('reputation_reports').insertOne(report);
    } catch {}
  }
  memoryStore.reputationReports.push(report);
  return { success: true, report };
}
export async function revokeReputation(guildId, logId, moderatorId, reason) {
  const db = safeGetDb();
  let log = null;
  if (db) {
    try {
      log = await db.collection('reputation_logs').findOne({ _id: logId, guildId });
    } catch {}
  }
  if (!log) {
    log = memoryStore.reputationLogs.find((l) => l._id === logId && l.guildId === guildId);
  }
  if (!log) return { success: false, error: 'Attribution introuvable.' };
  if (db) {
    try {
      await db.collection('reputation_logs').deleteOne({ _id: logId });
      await db.collection('user_reputations').updateOne({ guildId, userId: log.toUserId }, { $inc: { points: -1 } });
    } catch {}
  }
  const idx = memoryStore.reputationLogs.findIndex((l) => l._id === logId);
  if (idx !== -1) memoryStore.reputationLogs.splice(idx, 1);
  const uKey = `${guildId}_${log.toUserId}`;
  const pts = Math.max(0, (memoryStore.reputations.get(uKey) || 1) - 1);
  memoryStore.reputations.set(uKey, pts);

  return { success: true, points: pts };
}
export const CONFESSION_CATEGORIES = {
  anecdote: '📖 Anecdote',
  reflexion: '💭 Réflexion',
  remerciement: '💖 Remerciement',
  question: '❓ Question Intime / Curiosité',
  coup_de_coeur: '✨ Coup de Cœur',
  autre: '💬 Libre',
};
export async function submitConfession(
  guildId,
  text,
  channelId,
  { isAnonymous = true, authorId = null, authorName = null, category = 'anecdote' } = {}
) {
  const db = safeGetDb();
  let count = 0;
  if (db) {
    try {
      count = await db.collection('server_confessions').countDocuments({ guildId });
    } catch {}
  }
  if (!count) {
    count = Array.from(memoryStore.confessions.values()).filter((c) => c.guildId === guildId).length;
  }
  const number = count + 1;
  const settings = await getCommunitySettings(guildId);
  const requiresApproval = settings.confessions_require_approval !== false;
  const id = `conf_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
  const secretKey = crypto.randomBytes(4).toString('hex').toUpperCase();
  const doc = {
    _id: id,
    guildId,
    number,
    text: text.trim(),
    channelId,
    isAnonymous: Boolean(isAnonymous),
    authorId: isAnonymous ? null : authorId,
    authorName: isAnonymous ? 'Anonyme' : (authorName || 'Membre'),
    authorSecretHash: crypto.createHash('sha256').update(`${authorId || ''}_${secretKey}`).digest('hex'),
    category: category in CONFESSION_CATEGORIES ? category : 'autre',
    status: requiresApproval ? 'pending_review' : 'approved',
    reactions: { love: 0, hug: 0, funny: 0, deep: 0 },
    userReactions: {}, 
    reviewerId: null,
    reviewReason: null,
    reportedCount: 0,
    createdAt: new Date(),
  };
  if (db) {
    try {
      await db.collection('server_confessions').insertOne(doc);
    } catch {}
  }
  memoryStore.confessions.set(id, doc);
  return {
    confession: doc,
    secretKey,
    requiresApproval,
  };
}
export async function getConfessions(guildId, { status = 'approved', limit = 10, skip = 0 } = {}) {
  const db = safeGetDb();
  if (db) {
    try {
      return await db.collection('server_confessions')
        .find({ guildId, status })
        .sort({ number: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
    } catch {}
  }
  const list = Array.from(memoryStore.confessions.values())
    .filter((c) => c.guildId === guildId && c.status === status)
    .sort((a, b) => b.number - a.number);
  return list.slice(skip, skip + limit);
}
export async function getConfessionById(confessionId) {
  const db = safeGetDb();
  if (db) {
    try {
      const doc = await db.collection('server_confessions').findOne({ _id: confessionId });
      if (doc) return doc;
    } catch {}
  }
  return memoryStore.confessions.get(confessionId) || null;
}
export async function reviewConfession(confessionId, action, reviewerId, reason = '') {
  const conf = await getConfessionById(confessionId);
  if (!conf) return { success: false, error: 'Confession introuvable.' };
  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  const updates = {
    status: newStatus,
    reviewerId,
    reviewReason: reason.trim(),
    reviewedAt: new Date(),
  };
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('server_confessions').updateOne({ _id: confessionId }, { $set: updates });
    } catch {}
  }
  const merged = { ...conf, ...updates };
  memoryStore.confessions.set(confessionId, merged);
  return { success: true, confession: merged };
}
export async function reactToConfession(confessionId, userId, reactionType) {
  const valid = ['love', 'hug', 'funny', 'deep'];
  if (!valid.includes(reactionType)) return { success: false, error: 'Réaction invalide.' };
  const conf = await getConfessionById(confessionId);
  if (!conf) return { success: false, error: 'Confession introuvable.' };
  if (!conf.reactions) conf.reactions = { love: 0, hug: 0, funny: 0, deep: 0 };
  if (!conf.userReactions) conf.userReactions = {};
  const prev = conf.userReactions[userId];
  if (prev === reactionType) {
    conf.reactions[reactionType] = Math.max(0, conf.reactions[reactionType] - 1);
    delete conf.userReactions[userId];
  } else {
    if (prev) conf.reactions[prev] = Math.max(0, conf.reactions[prev] - 1);
    conf.reactions[reactionType] = (conf.reactions[reactionType] || 0) + 1;
    conf.userReactions[userId] = reactionType;
  }
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('server_confessions').updateOne(
        { _id: confessionId },
        { $set: { reactions: conf.reactions, userReactions: conf.userReactions } }
      );
    } catch {}
  }
  memoryStore.confessions.set(confessionId, conf);
  return { success: true, reactions: conf.reactions, userReaction: conf.userReactions[userId] || null };
}
export async function deleteConfessionBySecret(confessionId, authorId, secretKey) {
  const conf = await getConfessionById(confessionId);
  if (!conf) return { success: false, error: 'Confession introuvable.' };
  const expectedHash = crypto.createHash('sha256').update(`${authorId || ''}_${secretKey.trim().toUpperCase()}`).digest('hex');
  if (conf.authorSecretHash !== expectedHash && conf.authorId !== authorId) {
    return { success: false, error: 'Code de suppression incorrect.' };
  }
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('server_confessions').deleteOne({ _id: confessionId });
    } catch {}
  }
  memoryStore.confessions.delete(confessionId);
  return { success: true };
}
export async function reportConfession(confessionId, userId, reason) {
  const conf = await getConfessionById(confessionId);
  if (!conf) return { success: false, error: 'Confession introuvable.' };
  const db = safeGetDb();
  const count = (conf.reportedCount || 0) + 1;
  const updates = { reportedCount: count, status: count >= 3 ? 'flagged' : conf.status };
  if (db) {
    try {
      await db.collection('server_confessions').updateOne({ _id: confessionId }, { $set: updates });
      await db.collection('confession_reports').insertOne({ confessionId, userId, reason: reason.trim(), createdAt: new Date() });
    } catch {}
  }
  const merged = { ...conf, ...updates };
  memoryStore.confessions.set(confessionId, merged);
  return { success: true, reportedCount: count };
}
export async function createDebate({
  guildId,
  authorId,
  authorName,
  topic,
  description = '',
  options = ['Pour 👍', 'Contre 👎', 'Nuancé 🤔'],
  durationHours = 24,
}) {
  const id = `deb_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
  const endsAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
  const doc = {
    _id: id,
    guildId,
    authorId,
    authorName,
    topic: topic.trim(),
    description: description.trim(),
    options: options && options.length >= 2 ? options : ['Pour 👍', 'Contre 👎', 'Nuancé 🤔'],
    votes: {}, 
    arguments: [],
    status: 'active',
    endsAt,
    closedById: null,
    createdAt: new Date(),
  };
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('server_debates').insertOne(doc);
    } catch {}
  }
  memoryStore.debates.set(id, doc);
  return doc;
}
export async function getDebate(debateId) {
  const db = safeGetDb();
  if (db) {
    try {
      const doc = await db.collection('server_debates').findOne({ _id: debateId });
      if (doc) return doc;
    } catch {}
  }
  return memoryStore.debates.get(debateId) || null;
}
export async function voteDebate(debateId, userId, optionIndex) {
  const debate = await getDebate(debateId);
  if (!debate) return { success: false, error: 'Débat introuvable.' };
  if (debate.status !== 'active') return { success: false, error: 'Ce débat est clos.' };
  const idx = parseInt(optionIndex, 10);
  if (isNaN(idx) || idx < 0 || idx >= debate.options.length) {
    return { success: false, error: 'Option de vote invalide.' };
  }
  debate.votes[userId] = idx;
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('server_debates').updateOne(
        { _id: debateId },
        { $set: { [`votes.${userId}`]: idx, updatedAt: new Date() } }
      );
    } catch {}
  }
  memoryStore.debates.set(debateId, debate);
  const counts = debate.options.map(() => 0);
  Object.values(debate.votes).forEach((val) => {
    if (counts[val] !== undefined) counts[val]++;
  });
  return { success: true, debate, counts, totalVotes: Object.keys(debate.votes).length };
}
export async function addDebateArgument(debateId, { userId, username, optionIndex, argumentText }) {
  const debate = await getDebate(debateId);
  if (!debate) return { success: false, error: 'Débat introuvable.' };
  if (debate.status !== 'active') return { success: false, error: 'Ce débat est clos.' };
  const argDoc = {
    userId,
    username,
    optionIndex: parseInt(optionIndex, 10),
    text: argumentText.trim(),
    createdAt: new Date(),
  };
  if (!debate.arguments) debate.arguments = [];
  debate.arguments.push(argDoc);
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('server_debates').updateOne(
        { _id: debateId },
        { $push: { arguments: argDoc }, $set: { updatedAt: new Date() } }
      );
    } catch {}
  }
  memoryStore.debates.set(debateId, debate);
  return { success: true, argument: argDoc };
}
export async function closeDebate(debateId, closedById) {
  const debate = await getDebate(debateId);
  if (!debate) return { success: false, error: 'Débat introuvable.' };
  debate.status = 'closed';
  debate.closedById = closedById;
  debate.closedAt = new Date();
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('server_debates').updateOne(
        { _id: debateId },
        { $set: { status: 'closed', closedById, closedAt: new Date() } }
      );
    } catch {}
  }
  memoryStore.debates.set(debateId, debate);
  return { success: true, debate };
}
export async function getActiveDebates(guildId, limit = 5) {
  const db = safeGetDb();
  if (db) {
    try {
      return await db.collection('server_debates').find({ guildId, status: 'active' }).sort({ createdAt: -1 }).limit(limit).toArray();
    } catch {}
  }
  return Array.from(memoryStore.debates.values())
    .filter((d) => d.guildId === guildId && d.status === 'active')
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}
export const MENTOR_DOMAINS = [
  'Programmation & Bot',
  'Graphisme & Montage',
  'Anime & Manga Culture',
  'Gaming & Stratégie',
  'Animation & Organisation',
  'Langues & Écriture',
  'Études & Orientation',
];
export async function registerMentorProfile(guildId, userId, username, { domains = [], bio = '', availability = 'Soirées & Week-ends', maxMentees = 2 }) {
  const doc = {
    guildId,
    userId,
    username,
    domains: Array.isArray(domains) ? domains : [domains],
    bio: bio.trim(),
    availability: availability.trim(),
    maxMentees: Math.max(1, Math.min(5, parseInt(maxMentees, 10) || 2)),
    activeMenteesCount: 0,
    updatedAt: new Date(),
  };
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('mentor_profiles').updateOne({ guildId, userId }, { $set: doc }, { upsert: true });
    } catch {}
  }
  memoryStore.mentorProfiles.set(`${guildId}_${userId}`, doc);
  return doc;
}
export async function getMentorProfile(guildId, userId) {
  const db = safeGetDb();
  if (db) {
    try {
      const doc = await db.collection('mentor_profiles').findOne({ guildId, userId });
      if (doc) return doc;
    } catch {}
  }
  return memoryStore.mentorProfiles.get(`${guildId}_${userId}`) || null;
}
export async function searchMentors(guildId, domain = null) {
  const db = safeGetDb();
  let list = [];
  if (db) {
    try {
      const q = { guildId };
      if (domain) q.domains = domain;
      list = await db.collection('mentor_profiles').find(q).toArray();
    } catch {}
  }
  if (!list.length) {
    list = Array.from(memoryStore.mentorProfiles.values()).filter((p) => {
      if (p.guildId !== guildId) return false;
      if (domain) return p.domains.includes(domain);
      return true;
    });
  }
  return list;
}
export async function requestMentorship({ guildId, menteeId, menteeName, mentorId, domain, goals }) {
  if (menteeId === mentorId) {
    return { success: false, error: 'Vous ne pouvez pas demander un parrainage à vous-même !' };
  }
  const mentorProfile = await getMentorProfile(guildId, mentorId);
  if (!mentorProfile) {
    return { success: false, error: 'Ce mentor n\'a pas de profil actif sur le serveur.' };
  }
  const id = `ment_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
  const doc = {
    _id: id,
    guildId,
    mentorId,
    mentorName: mentorProfile.username,
    menteeId,
    menteeName,
    domain,
    goals: goals.trim(),
    status: 'pending', 
    sessions: [], 
    privateNotes: {}, 
    feedback: null,
    createdAt: new Date(),
  };
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('community_mentorships').insertOne(doc);
    } catch {}
  }
  memoryStore.mentorships.set(id, doc);
  return { success: true, mentorship: doc };
}
export async function respondMentorshipRequest(mentorshipId, mentorId, accept = true, rejectReason = '') {
  const db = safeGetDb();
  let m = null;
  if (db) {
    try {
      m = await db.collection('community_mentorships').findOne({ _id: mentorshipId });
    } catch {}
  }
  if (!m) m = memoryStore.mentorships.get(mentorshipId);
  if (!m) return { success: false, error: 'Demande introuvable.' };
  if (m.mentorId !== mentorId) return { success: false, error: 'Action non autorisée.' };
  const updates = {
    status: accept ? 'active' : 'rejected',
    rejectReason: accept ? null : rejectReason,
    startedAt: accept ? new Date() : null,
    updatedAt: new Date(),
  };
  if (db) {
    try {
      await db.collection('community_mentorships').updateOne({ _id: mentorshipId }, { $set: updates });
      if (accept) {
        await db.collection('mentor_profiles').updateOne(
          { guildId: m.guildId, userId: mentorId },
          { $inc: { activeMenteesCount: 1 } }
        );
      }
    } catch {}
  }
  const merged = { ...m, ...updates };
  memoryStore.mentorships.set(mentorshipId, merged);
  return { success: true, mentorship: merged };
}
export async function addMentorshipPrivateNote(mentorshipId, userId, noteText) {
  const db = safeGetDb();
  let m = null;
  if (db) {
    try {
      m = await db.collection('community_mentorships').findOne({ _id: mentorshipId });
    } catch {}
  }
  if (!m) m = memoryStore.mentorships.get(mentorshipId);
  if (!m) return { success: false, error: 'Accompagnement introuvable.' };
  if (m.mentorId !== userId && m.menteeId !== userId) {
    return { success: false, error: 'Vous ne faites pas partie de cet accompagnement.' };
  }
  if (!m.privateNotes) m.privateNotes = {};
  if (!m.privateNotes[userId]) m.privateNotes[userId] = [];
  const note = { text: noteText.trim(), date: new Date() };
  m.privateNotes[userId].push(note);
  if (db) {
    try {
      await db.collection('community_mentorships').updateOne(
        { _id: mentorshipId },
        { $set: { [`privateNotes.${userId}`]: m.privateNotes[userId] } }
      );
    } catch {}
  }
  memoryStore.mentorships.set(mentorshipId, m);
  return { success: true, note };
}
export async function getMentorships(guildId, { userId = null, status = null } = {}) {
  const db = safeGetDb();
  if (db) {
    try {
      const q = { guildId };
      if (status) q.status = status;
      if (userId) q.$or = [{ mentorId: userId }, { menteeId: userId }];
      return await db.collection('community_mentorships').find(q).sort({ createdAt: -1 }).toArray();
    } catch {}
  }
  return Array.from(memoryStore.mentorships.values()).filter((m) => {
    if (m.guildId !== guildId) return false;
    if (status && m.status !== status) return false;
    if (userId && m.mentorId !== userId && m.menteeId !== userId) return false;
    return true;
  });
}
export async function createCommunityGoal({
  guildId,
  title,
  description = '',
  target,
  current = 0,
  unit = 'membres',
  deadline = null,
}) {
  const id = `goal_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
  const doc = {
    _id: id,
    guildId,
    title: title.trim(),
    description: description.trim(),
    target: parseInt(target, 10),
    current: parseInt(current, 10),
    unit: unit.trim(),
    deadline,
    status: 'active', 
    contributors: {},
    createdAt: new Date(),
  };
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('community_goals').insertOne(doc);
    } catch {}
  }
  memoryStore.goals.set(id, doc);
  return doc;
}
export async function getCommunityGoals(guildId, status = 'active') {
  const db = safeGetDb();
  if (db) {
    try {
      const q = { guildId };
      if (status) q.status = status;
      return await db.collection('community_goals').find(q).sort({ createdAt: -1 }).toArray();
    } catch {}
  }
  return Array.from(memoryStore.goals.values())
    .filter((g) => g.guildId === guildId && (!status || g.status === status))
    .sort((a, b) => b.createdAt - a.createdAt);
}
export async function contributeGoal(goalId, amount, contributorId = null, contributorName = 'Membre') {
  const db = safeGetDb();
  let g = null;
  if (db) {
    try {
      g = await db.collection('community_goals').findOne({ _id: goalId });
    } catch {}
  }
  if (!g) g = memoryStore.goals.get(goalId);
  if (!g) return { success: false, error: 'Objectif introuvable.' };
  const add = parseInt(amount, 10) || 1;
  const newCur = g.current + add;
  const isCompleted = newCur >= g.target;
  if (contributorId) {
    if (!g.contributors) g.contributors = {};
    const prev = g.contributors[contributorId]?.amount || 0;
    g.contributors[contributorId] = { name: contributorName, amount: prev + add };
  }
  g.current = newCur;
  if (isCompleted) g.status = 'completed';
  if (db) {
    try {
      await db.collection('community_goals').updateOne(
        { _id: goalId },
        { $set: { current: newCur, status: g.status, contributors: g.contributors } }
      );
    } catch {}
  }
  memoryStore.goals.set(goalId, g);
  return { success: true, goal: g, isCompleted };
}
export const THANK_CATEGORIES = {
  entraide: '🤝 Entraide & Dépannage',
  accueil: '👋 Accueil & Intégration',
  creativite: '🎨 Créativité & Projets',
  soutien: '💖 Soutien Moral & Écoute',
  organisation: '🎉 Organisation & Animation',
  autre: '🌟 Sympathie Générale',
};
export async function sendThankYou({
  guildId,
  fromUserId,
  fromUsername,
  toUserId,
  toUsername,
  message,
  category = 'entraide',
  isPublic = true,
}) {
  if (fromUserId === toUserId) {
    return { success: false, error: 'Vous ne pouvez pas vous remercier vous-même !' };
  }
  const id = `thx_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
  const doc = {
    _id: id,
    guildId,
    fromUserId,
    fromUsername,
    toUserId,
    toUsername,
    message: message.trim(),
    category: category in THANK_CATEGORIES ? category : 'autre',
    isPublic: Boolean(isPublic),
    reactionsCount: 0,
    reactors: [],
    createdAt: new Date(),
  };
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('community_thanks').insertOne(doc);
    } catch {}
  }
  memoryStore.thanks.set(id, doc);
  return { success: true, thank: doc };
}
export async function getPublicThanks(guildId, limit = 10) {
  const db = safeGetDb();
  if (db) {
    try {
      return await db.collection('community_thanks').find({ guildId, isPublic: true }).sort({ createdAt: -1 }).limit(limit).toArray();
    } catch {}
  }
  return Array.from(memoryStore.thanks.values())
    .filter((t) => t.guildId === guildId && t.isPublic)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}
export async function reactToThankYou(thankId, userId) {
  const db = safeGetDb();
  let t = null;
  if (db) {
    try {
      t = await db.collection('community_thanks').findOne({ _id: thankId });
    } catch {}
  }
  if (!t) t = memoryStore.thanks.get(thankId);
  if (!t) return { success: false, error: 'Message introuvable.' };
  if (!t.reactors) t.reactors = [];
  const idx = t.reactors.indexOf(userId);
  if (idx !== -1) {
    t.reactors.splice(idx, 1);
  } else {
    t.reactors.push(userId);
  }
  t.reactionsCount = t.reactors.length;
  if (db) {
    try {
      await db.collection('community_thanks').updateOne(
        { _id: thankId },
        { $set: { reactors: t.reactors, reactionsCount: t.reactionsCount } }
      );
    } catch {}
  }
  memoryStore.thanks.set(thankId, t);
  return { success: true, count: t.reactionsCount, hasReacted: idx === -1 };
}
export const POPULAR_INTERESTS = [
  'Anime & Manga',
  'Gaming (PC / Console)',
  'Programmation & Dev',
  'Dessin & Art Digital',
  'Musique & Chant',
  'Cosplay & Conventions',
  'Lecture & Écriture',
  'Sport & Fitness',
  'Cinéma & Séries',
  'Jeux de Société',
];
export async function saveUserProfile(
  guildId,
  userId,
  username,
  { bio = '', animeFavorites = '', interests = [], skills = [], timezone = 'Europe/Paris' } = {}
) {
  const doc = {
    guildId,
    userId,
    username,
    bio: bio.trim(),
    animeFavorites: animeFavorites.trim(),
    interests: Array.isArray(interests) ? interests : [interests],
    skills: Array.isArray(skills) ? skills : [skills],
    timezone,
    updatedAt: new Date(),
  };
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('community_user_profiles').updateOne({ guildId, userId }, { $set: doc }, { upsert: true });
    } catch {}
  }
  memoryStore.userProfiles.set(`${guildId}_${userId}`, doc);
  return doc;
}
export async function getUserProfile(guildId, userId) {
  const db = safeGetDb();
  if (db) {
    try {
      const doc = await db.collection('community_user_profiles').findOne({ guildId, userId });
      if (doc) return doc;
    } catch {}
  }
  return memoryStore.userProfiles.get(`${guildId}_${userId}`) || null;
}
export async function searchMembersByInterests(guildId, targetInterests = [], limit = 10) {
  const db = safeGetDb();
  let list = [];
  if (db) {
    try {
      list = await db.collection('community_user_profiles').find({ guildId }).toArray();
    } catch {}
  }
  if (!list.length) {
    list = Array.from(memoryStore.userProfiles.values()).filter((p) => p.guildId === guildId);
  }
  const targets = (Array.isArray(targetInterests) ? targetInterests : [targetInterests]).map((t) => t.toLowerCase());
  const matched = list.map((p) => {
    const common = (p.interests || []).filter((i) => targets.includes(i.toLowerCase()));
    return { profile: p, commonCount: common.length, common };
  });
  return matched
    .filter((m) => m.commonCount > 0)
    .sort((a, b) => b.commonCount - a.commonCount)
    .slice(0, limit);
}
export async function calculateCompatibility(guildId, user1Id, user2Id) {
  const p1 = await getUserProfile(guildId, user1Id);
  const p2 = await getUserProfile(guildId, user2Id);
  if (!p1 || !p2) {
    return {
      success: false,
      error: 'Les deux membres doivent avoir rempli leur profil avec `/communaute presentation` pour mesurer les intérêts partagés.',
    };
  }
  const i1 = (p1.interests || []).map((x) => x.toLowerCase());
  const i2 = (p2.interests || []).map((x) => x.toLowerCase());
  const commonInterests = (p1.interests || []).filter((x) => i2.includes(x.toLowerCase()));
  const allCount = new Set([...i1, ...i2]).size;
  const score = allCount > 0 ? Math.round((commonInterests.length / allCount) * 100) : 0;
  return {
    success: true,
    commonInterests,
    score,
    p1,
    p2,
  };
}
export const ICEBREAKER_QUESTIONS = [
  'Quel est le premier animé qui vous a véritablement marqué à vie ?',
  'Si vous pouviez vivre 24h dans l\'univers d\'une série ou d\'un jeu, laquelle choisiriez-vous ?',
  'Quelle est votre habitude la plus inhabituelle ou votre passion méconnue ?',
  'Quel super-pouvoir choisiriez-vous pour vous simplifier la vie quotidienne ?',
  'Quel est le meilleur plat fait-maison que vous savez cuisiner ?',
  'Si vous deviez écouter un seul album en boucle pendant un mois, ce serait quoi ?',
  'Plutôt nuit blanche devant une saison entière ou 1 épisode par semaine sagement ?',
  'Quelle est la plus grande leçon ou découverte que vous avez faite cette année ?',
];
export function getRandomIcebreaker() {
  return ICEBREAKER_QUESTIONS[Math.floor(Math.random() * ICEBREAKER_QUESTIONS.length)];
}
export async function createHelpRequest({ guildId, authorId, authorName, title, domain, description, urgency = 'Normale' }) {
  const id = `help_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
  const doc = {
    _id: id,
    guildId,
    authorId,
    authorName,
    title: title.trim(),
    domain: domain.trim(),
    description: description.trim(),
    urgency,
    status: 'open', 
    helperId: null,
    helperName: null,
    createdAt: new Date(),
  };
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('community_help_requests').insertOne(doc);
    } catch {}
  }
  memoryStore.helpRequests.set(id, doc);
  return doc;
}
export async function claimHelpRequest(requestId, helperId, helperName) {
  const db = safeGetDb();
  let r = null;
  if (db) {
    try {
      r = await db.collection('community_help_requests').findOne({ _id: requestId });
    } catch {}
  }
  if (!r) r = memoryStore.helpRequests.get(requestId);
  if (!r) return { success: false, error: 'Demande introuvable.' };
  if (r.authorId === helperId) return { success: false, error: 'Vous ne pouvez pas prendre en charge votre propre demande !' };
  r.status = 'assigned';
  r.helperId = helperId;
  r.helperName = helperName;
  if (db) {
    try {
      await db.collection('community_help_requests').updateOne(
        { _id: requestId },
        { $set: { status: 'assigned', helperId, helperName } }
      );
    } catch {}
  }
  memoryStore.helpRequests.set(requestId, r);
  return { success: true, request: r };
}
export async function resolveHelpRequest(requestId, resolverId) {
  const db = safeGetDb();
  let r = null;
  if (db) {
    try {
      r = await db.collection('community_help_requests').findOne({ _id: requestId });
    } catch {}
  }
  if (!r) r = memoryStore.helpRequests.get(requestId);
  if (!r) return { success: false, error: 'Demande introuvable.' };
  r.status = 'resolved';
  r.resolvedAt = new Date();
  if (db) {
    try {
      await db.collection('community_help_requests').updateOne(
        { _id: requestId },
        { $set: { status: 'resolved', resolvedAt: new Date() } }
      );
    } catch {}
  }
  memoryStore.helpRequests.set(requestId, r);
  return { success: true, request: r };
}
export async function getHelpRequests(guildId, status = 'open', limit = 10) {
  const db = safeGetDb();
  if (db) {
    try {
      return await db.collection('community_help_requests').find({ guildId, status }).sort({ createdAt: -1 }).limit(limit).toArray();
    } catch {}
  }
  return Array.from(memoryStore.helpRequests.values())
    .filter((r) => r.guildId === guildId && r.status === status)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}
export async function addMilestone({ guildId, authorId, title, date = new Date(), description = '', category = 'Historique' }) {
  const id = `mile_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
  const doc = {
    _id: id,
    guildId,
    authorId,
    title: title.trim(),
    date: new Date(date),
    description: description.trim(),
    category,
    createdAt: new Date(),
  };
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('community_milestones').insertOne(doc);
    } catch {}
  }
  memoryStore.milestones.set(id, doc);
  return doc;
}
export async function getMilestones(guildId) {
  const db = safeGetDb();
  if (db) {
    try {
      return await db.collection('community_milestones').find({ guildId }).sort({ date: 1 }).toArray();
    } catch {}
  }
  return Array.from(memoryStore.milestones.values())
    .filter((m) => m.guildId === guildId)
    .sort((a, b) => a.date - b.date);
}
export async function addGuestbookEntry({ guildId, authorId, authorName, message }) {
  const entry = {
    _id: `gb_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
    guildId,
    authorId,
    authorName,
    message: message.trim(),
    createdAt: new Date(),
  };
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('community_guestbook').insertOne(entry);
    } catch {}
  }
  memoryStore.guestbook.push(entry);
  return entry;
}
export async function getGuestbookEntries(guildId, limit = 10) {
  const db = safeGetDb();
  if (db) {
    try {
      return await db.collection('community_guestbook').find({ guildId }).sort({ createdAt: -1 }).limit(limit).toArray();
    } catch {}
  }
  return memoryStore.guestbook
    .filter((g) => g.guildId === guildId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}
export async function getCommunityOverviewStats(guildId) {
  const appStats = await getApplicationStats(guildId);
  const birthdays = await getUpcomingBirthdays(guildId, 500, true);
  const goals = await getCommunityGoals(guildId, null);
  const thanks = await getPublicThanks(guildId, 500);
  const activeDebates = await getActiveDebates(guildId, 50);
  const mentors = await searchMentors(guildId);
  return {
    applicationsTotal: appStats.total,
    birthdaysTotal: birthdays.length,
    goalsTotal: goals.length,
    thanksTotal: thanks.length,
    activeDebatesTotal: activeDebates.length,
    mentorsTotal: mentors.length,
  };
}
export async function purgeUserData(guildId, userId) {
  const db = safeGetDb();
  if (db) {
    try {
      await db.collection('user_birthdays').deleteOne({ guildId, userId });
      await db.collection('community_user_profiles').deleteOne({ guildId, userId });
      await db.collection('mentor_profiles').deleteOne({ guildId, userId });
      await db.collection('server_applications').deleteMany({ guildId, userId, status: 'draft' });
    } catch {}
  }
  memoryStore.birthdays.delete(`${guildId}_${userId}`);
  memoryStore.userProfiles.delete(`${guildId}_${userId}`);
  memoryStore.mentorProfiles.delete(`${guildId}_${userId}`);
  memoryStore.drafts.delete(`${guildId}_${userId}`);
  return { success: true };
}
