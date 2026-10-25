import { getDb } from '../database/mongo.js';
import { addQuizScore } from './communityLeaderboardService.js';
import { config } from '../config.js';
import {
  EXTENDED_QUOTES,
  SOUNDBOARD_TRACKS,
  CHARACTER_ROULETTE,
  POWER_ROULETTE,
  BLINDTEST_DATA,
  EMOJI_CHALLENGES,
  ANIME_PENDU_WORDS,
  VRAI_OU_FAUX_DATA,
  DEVINE_PERSO_DATA,
  ASSOCIATION_SETS,
  ANAGRAMMES_DATA,
  INTRUS_DATA,
  MOT_INTERDIT_CARDS,
  SCENARIO_STORIES,
} from './animeparty/animepartyData.js';
export {
  EXTENDED_QUOTES,
  SOUNDBOARD_TRACKS,
  CHARACTER_ROULETTE,
  POWER_ROULETTE,
  BLINDTEST_DATA,
  EMOJI_CHALLENGES,
  ANIME_PENDU_WORDS,
  VRAI_OU_FAUX_DATA,
  DEVINE_PERSO_DATA,
  ASSOCIATION_SETS,
  ANAGRAMMES_DATA,
  INTRUS_DATA,
  MOT_INTERDIT_CARDS,
  SCENARIO_STORIES,
};
export const activeParties = new Map();
const inMemoryProfiles = new Map();
const inMemoryFavorites = new Map();
const inMemoryContributions = new Map();
const inMemoryGuildConfigs = new Map();
const inMemoryHistory = [];
function isMongoConnected() {
  try {
    const db = getDb();
    return !!db;
  } catch {
    return false;
  }
}
export async function getAnimePartyProfile(guildId, userId, username = 'Otaku') {
  const profileKey = `${guildId}_${userId}`;
  try {
    if (isMongoConnected()) {
      const db = getDb();
      const col = db.collection('anime_party_stats');
      let doc = await col.findOne({ guildId, userId });
      if (!doc) {
        doc = {
          guildId,
          userId,
          username,
          points: 0,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          streak: 0,
          bestStreak: 0,
          favoriteGame: 'Blindtest',
          badges: ['Néophyte Otaku'],
          dailyClaimedAt: null,
          weeklyClaimedAt: null,
          recentHistory: [],
          updatedAt: new Date(),
        };
        await col.insertOne(doc);
      }
      inMemoryProfiles.set(profileKey, doc);
      return doc;
    }
  } catch (err) {
    console.warn('[AnimeParty] Mongo indisponible pour getAnimePartyProfile, bascule mémoire :', err.message);
  }
  if (!inMemoryProfiles.has(profileKey)) {
    inMemoryProfiles.set(profileKey, {
      guildId,
      userId,
      username,
      points: 0,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      streak: 0,
      bestStreak: 0,
      favoriteGame: 'Blindtest',
      badges: ['Néophyte Otaku'],
      dailyClaimedAt: null,
      weeklyClaimedAt: null,
      recentHistory: [],
      updatedAt: new Date(),
    });
  }
  return inMemoryProfiles.get(profileKey);
}
export async function recordPartyGameResult(
  guildId,
  userId,
  username,
  pointsEarned = 10,
  isWin = false,
  gameType = 'Jeu',
  options = {}
) {
  const isDraw = options.isDraw || false;
  const isLoss = !isWin && !isDraw;
  const current = await getAnimePartyProfile(guildId, userId, username);
  const newStreak = isWin ? (current.streak || 0) + 1 : 0;
  const bestStreak = Math.max(newStreak, current.bestStreak || 0);
  const badges = new Set(current.badges || ['Néophyte Otaku']);
  const totalGames = (current.gamesPlayed || 0) + 1;
  const totalWins = (current.wins || 0) + (isWin ? 1 : 0);
  if (totalGames >= 5) badges.add('Habitué de la Party');
  if (totalGames >= 25) badges.add('Vétéran Otaku');
  if (totalGames >= 100) badges.add('Légende Otaku 🌟');
  if (totalWins >= 10) badges.add('Champion Anime Party');
  if (totalWins >= 50) badges.add('Conquérant Otaku 👑');
  if (bestStreak >= 3) badges.add('Série Enflammée 🔥');
  if (bestStreak >= 7) badges.add('Invaincu Suprême ⚡');
  if (gameType === 'Blindtest' && isWin) badges.add('Oreille d\'Or 🎧');
  if (gameType === 'Anime-Pendu' && isWin) badges.add('Maître du Pendu 🪢');
  if (gameType === 'Réflexe' && isWin) badges.add('Éclair Ninja ⚡');
  if (gameType === 'Duel' && isWin) badges.add('Duelliste Redoutable ⚔️');
  const historyItem = {
    date: new Date().toISOString(),
    game: gameType,
    points: pointsEarned,
    outcome: isWin ? 'Victoire' : isDraw ? 'Égalité' : 'Défaite',
  };
  const recentHistory = [historyItem, ...(current.recentHistory || [])].slice(0, 10);
  const updatedDoc = {
    ...current,
    username,
    points: (current.points || 0) + pointsEarned,
    gamesPlayed: totalGames,
    wins: totalWins,
    losses: (current.losses || 0) + (isLoss ? 1 : 0),
    draws: (current.draws || 0) + (isDraw ? 1 : 0),
    streak: newStreak,
    bestStreak,
    favoriteGame: gameType,
    badges: Array.from(badges),
    recentHistory,
    updatedAt: new Date(),
  };
  const profileKey = `${guildId}_${userId}`;
  inMemoryProfiles.set(profileKey, updatedDoc);
  inMemoryHistory.unshift({
    guildId,
    userId,
    username,
    gameType,
    points: pointsEarned,
    isWin,
    timestamp: Date.now(),
  });
  if (inMemoryHistory.length > 500) inMemoryHistory.pop();
  try {
    if (isMongoConnected()) {
      const db = getDb();
      const col = db.collection('anime_party_stats');
      await col.updateOne(
        { guildId, userId },
        {
          $inc: {
            points: pointsEarned,
            gamesPlayed: 1,
            wins: isWin ? 1 : 0,
            losses: isLoss ? 1 : 0,
            draws: isDraw ? 1 : 0,
          },
          $set: {
            username,
            streak: newStreak,
            bestStreak,
            favoriteGame: gameType,
            badges: Array.from(badges),
            recentHistory,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn('[AnimeParty] Erreur persistence Mongo:', err.message);
  }
  try {
    await addQuizScore(guildId, userId, username, pointsEarned, isWin);
  } catch {}
  if (options.guild && options.member && pointsEarned > 0) {
    try {
      const { addXp } = await import('./discordLevelService.js');
      await addXp(options.guild, options.member.user || options.member, pointsEarned * 3, {
        reason: `Anime Party (${gameType})`,
      });
    } catch {}
  }
  return { pointsEarned, newStreak, bestStreak, badges: Array.from(badges) };
}
export async function getAnimePartyLeaderboard(guildId, limit = 10, filter = 'global') {
  try {
    if (isMongoConnected()) {
      const db = getDb();
      const col = db.collection('anime_party_stats');
      let query = { guildId };
      if (filter && filter !== 'global') {
        if (['blindtest', 'pendu', 'duel'].includes(filter.toLowerCase())) {
          query.favoriteGame = new RegExp(filter, 'i');
        }
      }
      const docs = await col
        .find(query)
        .sort({ points: -1, wins: -1 })
        .limit(limit)
        .toArray();
      if (docs.length > 0) {
        return docs.map((d, i) => ({
          rank: i + 1,
          userId: d.userId,
          username: d.username || 'Joueur Otaku',
          points: d.points || 0,
          wins: d.wins || 0,
          losses: d.losses || 0,
          gamesPlayed: d.gamesPlayed || 0,
          streak: d.streak || 0,
          badgesCount: (d.badges || []).length,
          favoriteGame: d.favoriteGame || 'Jeu',
        }));
      }
    }
  } catch (err) {
    console.warn('[AnimeParty] Erreur Mongo leaderboard, fallback mémoire :', err.message);
  }
  const guildProfiles = Array.from(inMemoryProfiles.values())
    .filter((p) => p.guildId === guildId)
    .sort((a, b) => (b.points || 0) - (a.points || 0) || (b.wins || 0) - (a.wins || 0))
    .slice(0, limit);
  return guildProfiles.map((d, i) => ({
    rank: i + 1,
    userId: d.userId,
    username: d.username || 'Joueur Otaku',
    points: d.points || 0,
    wins: d.wins || 0,
    losses: d.losses || 0,
    gamesPlayed: d.gamesPlayed || 0,
    streak: d.streak || 0,
    badgesCount: (d.badges || []).length,
    favoriteGame: d.favoriteGame || 'Jeu',
  }));
}
export async function addQuoteFavorite(userId, quoteId) {
  const quote = EXTENDED_QUOTES.find((q) => q.id === quoteId);
  if (!quote) return { success: false, message: 'Citation introuvable.' };
  const userFavs = inMemoryFavorites.get(userId) || new Set();
  userFavs.add(quoteId);
  inMemoryFavorites.set(userId, userFavs);
  try {
    if (isMongoConnected()) {
      const db = getDb();
      await db.collection('anime_party_favorites').updateOne(
        { userId },
        { $addToSet: { quoteIds: quoteId }, $set: { updatedAt: new Date() } },
        { upsert: true }
      );
    }
  } catch {}
  return { success: true, quote };
}
export async function getUserQuoteFavorites(userId) {
  let ids = Array.from(inMemoryFavorites.get(userId) || []);
  try {
    if (isMongoConnected()) {
      const db = getDb();
      const doc = await db.collection('anime_party_favorites').findOne({ userId });
      if (doc && Array.isArray(doc.quoteIds)) {
        ids = Array.from(new Set([...ids, ...doc.quoteIds]));
      }
    }
  } catch {}
  return EXTENDED_QUOTES.filter((q) => ids.includes(q.id));
}
export function createParty(channelId, hostUser, gameType = 'quiz', options = {}) {
  const party = {
    id: `party_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    channelId,
    hostId: hostUser.id,
    hostTag: hostUser.tag || hostUser.username,
    gameType,
    status: 'lobby', 
    players: new Map([[hostUser.id, { id: hostUser.id, username: hostUser.username, score: 0 }]]),
    spectators: new Set(),
    round: 0,
    maxRounds: options.maxRounds || 5,
    difficulty: options.difficulty || 'medium',
    theme: options.theme || 'Général',
    createdAt: Date.now(),
    lastActivity: Date.now(),
    data: {},
  };
  activeParties.set(channelId, party);
  return party;
}
export function getParty(channelId) {
  return activeParties.get(channelId) || null;
}
export function joinParty(channelId, user) {
  const party = activeParties.get(channelId);
  if (!party) return { success: false, message: 'Aucune partie en attente dans ce salon.' };
  if (party.status !== 'lobby') return { success: false, message: 'La partie a déjà commencé ou est terminée.' };
  if (party.players.has(user.id)) return { success: false, message: 'Vous êtes déjà inscrit dans cette partie !' };
  if (party.players.size >= 16) return { success: false, message: 'La partie a atteint le nombre maximum de 16 joueurs.' };
  party.players.set(user.id, { id: user.id, username: user.username, score: 0 });
  party.lastActivity = Date.now();
  return { success: true, party };
}
export function leaveParty(channelId, user) {
  const party = activeParties.get(channelId);
  if (!party) return { success: false, message: 'Aucune partie active.' };
  if (!party.players.has(user.id)) return { success: false, message: 'Vous ne faites pas partie de cette session.' };
  party.players.delete(user.id);
  party.lastActivity = Date.now();
  if (party.hostId === user.id) {
    if (party.players.size > 0) {
      const nextHost = Array.from(party.players.values())[0];
      party.hostId = nextHost.id;
      party.hostTag = nextHost.username;
      return { success: true, newHost: nextHost, party };
    } else {
      activeParties.delete(channelId);
      return { success: true, cancelled: true };
    }
  }
  return { success: true, party };
}
export function cancelParty(channelId, user) {
  const party = activeParties.get(channelId);
  if (!party) return { success: false, message: 'Aucune partie active à annuler.' };
  if (party.hostId !== user.id) return { success: false, message: 'Seul l\'hôte de la partie peut l\'annuler.' };
  activeParties.delete(channelId);
  return { success: true };
}
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [chanId, party] of activeParties.entries()) {
    if (now - party.lastActivity > 15 * 60 * 1000) {
      activeParties.delete(chanId);
    }
  }
}, 5 * 60 * 1000);
if (cleanupTimer.unref) cleanupTimer.unref();
export function getDailyChallenge() {
  const todayStr = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < todayStr.length; i++) {
    hash = (hash << 5) - hash + todayStr.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const pool = [
    {
      title: 'Maître du Pendu Quotidien',
      task: 'Résoudre un titre d\'anime au pendu sans faire plus de 3 erreurs !',
      reward: '50 points Party + 200 XP',
      bonusPoints: 50,
      type: 'pendu',
    },
    {
      title: 'Devin des Emojis',
      task: 'Identifier 3 animes grâce à leurs combinaisons d\'emojis mystères.',
      reward: '40 points Party + 150 XP',
      bonusPoints: 40,
      type: 'emoji',
    },
    {
      title: 'Duel au Sommet des Héros',
      task: 'Participer à au moins un duel anime 1v1 contre un autre membre.',
      reward: '60 points Party + 300 XP',
      bonusPoints: 60,
      type: 'duel',
    },
    {
      title: 'Incollable sur les Répliques',
      task: 'Deviner l\'auteur de 2 citations d\'animes cultes.',
      reward: '45 points Party + 180 XP',
      bonusPoints: 45,
      type: 'replique',
    },
    {
      title: 'Expert du Vrai ou Faux',
      task: 'Déjouer 2 pièges d\'anecdotes Otaku dans le mode Vrai ou Faux.',
      reward: '45 points Party + 180 XP',
      bonusPoints: 45,
      type: 'vrai_faux',
    },
    {
      title: 'Mélomane des Openings',
      task: 'Reconnaître sans faute 2 titres de Blindtest en moins de 15 secondes.',
      reward: '55 points Party + 220 XP',
      bonusPoints: 55,
      type: 'blindtest',
    },
  ];
  const chosen = pool[positiveHash % pool.length];
  return { ...chosen, date: todayStr };
}
export function getWeeklyChallenge() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  const pool = [
    {
      title: 'Marathon Otaku de la Semaine',
      task: 'Remporter au moins 5 parties ou mini-jeux au cours de la semaine.',
      reward: '150 points Party + 600 XP + Badge Champion Hebdomadaire',
      bonusPoints: 150,
      week: weekNumber,
    },
    {
      title: 'Légende Polyvalente des Jeux',
      task: 'Jouer à 4 mini-jeux différents (Blindtest, Pendu, Réflexe, Devine-Perso).',
      reward: '120 points Party + 500 XP',
      bonusPoints: 120,
      week: weekNumber,
    },
  ];
  return pool[weekNumber % pool.length];
}
export async function submitContribution(guildId, userId, username, type, content) {
  const id = `contrib_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const doc = {
    id,
    guildId,
    userId,
    username,
    type, 
    content,
    status: 'en_attente', 
    createdAt: new Date(),
  };
  inMemoryContributions.set(id, doc);
  try {
    if (isMongoConnected()) {
      const db = getDb();
      await db.collection('anime_party_contributions').insertOne(doc);
    }
  } catch {}
  return { success: true, contribution: doc };
}
export async function getGuildContributions(guildId, status = 'en_attente') {
  let list = Array.from(inMemoryContributions.values()).filter(
    (c) => c.guildId === guildId && (!status || c.status === status)
  );
  try {
    if (isMongoConnected()) {
      const db = getDb();
      const docs = await db.collection('anime_party_contributions').find({ guildId, status }).toArray();
      if (docs.length > 0) list = docs;
    }
  } catch {}
  return list;
}
export async function getGuildAnimePartyConfig(guildId) {
  const defaultCfg = {
    guildId,
    allowedChannelIds: [], 
    adminRoleIds: [],      
    disabledGames: [],     
    cooldownSeconds: 3,   
    updatedAt: new Date(),
  };
  try {
    if (isMongoConnected()) {
      const db = getDb();
      const doc = await db.collection('anime_party_config').findOne({ _id: guildId });
      if (doc) return { ...defaultCfg, ...doc };
    }
  } catch {}
  return inMemoryGuildConfigs.get(guildId) || defaultCfg;
}
export async function saveGuildAnimePartyConfig(guildId, newConfig) {
  const updated = { ...newConfig, guildId, updatedAt: new Date() };
  inMemoryGuildConfigs.set(guildId, updated);
  try {
    if (isMongoConnected()) {
      const db = getDb();
      await db.collection('anime_party_config').updateOne(
        { _id: guildId },
        { $set: updated },
        { upsert: true }
      );
    }
  } catch {}
  return updated;
}
