import { getDb } from '../../database/mongo.js';
import { addXp } from '../discordLevelService.js';
import { adjustBalance } from '../economyService.js';
let inMemoryPlayerStats = new Map();
export function resetStatsMemoryStore() {
  inMemoryPlayerStats = new Map();
}
export const ACHIEVEMENTS = [
  { id: 'first_count', name: 'Premier Pas', icon: '🌱', desc: 'Valider son premier nombre dans le salon de comptage.' },
  { id: 'fifty_counts', name: 'Compteur Actif', icon: '🔢', desc: 'Valider 50 nombres.' },
  { id: 'centurion', name: 'Centurion', icon: '🏛️', desc: 'Valider 100 nombres dans le comptage communautaire.' },
  { id: 'millenaire', name: 'Millénaire', icon: '👑', desc: 'Participer à une chaîne ayant dépassé 1 000.' },
  { id: 'streak_10', name: 'Série de Fer', icon: '⛓️', desc: 'Maintenir une série de 10 participations sans erreur.' },
  { id: 'streak_25', name: 'Série Dorée', icon: '🌟', desc: 'Maintenir une série de 25 participations sans erreur.' },
  { id: 'logic_apprentice', name: 'Initié de la Logique', icon: '💡', desc: 'Résoudre 5 énigmes de logique numérique.' },
  { id: 'logic_master', name: 'Maître de la Déduction', icon: '🧠', desc: 'Résoudre 25 énigmes de logique.' },
  { id: 'math_expert', name: 'Génie Mathématique', icon: '🎓', desc: 'Résoudre avec succès une énigme de difficulté Expert.' },
  { id: 'minigame_winner', name: 'As des Mini-Jeux', icon: '🎮', desc: 'Gagner 5 mini-jeux numériques.' },
  { id: 'duel_champion', name: 'Champion de Duel', icon: '⚔️', desc: 'Remporter 3 duels mathématiques contre d\'autres membres.' },
];
export async function getPlayerStats(guildId, userId) {
  const key = `${guildId}_${userId}`;
  try {
    const db = getDb();
    if (db) {
      const doc = await db.collection('counting_players').findOne({ guild_id: guildId, user_id: userId });
      if (doc) return doc;
    }
  } catch {}
  if (inMemoryPlayerStats.has(key)) {
    return inMemoryPlayerStats.get(key);
  }
  const defaultStats = {
    guild_id: guildId,
    user_id: userId,
    username: 'Membre',
    counts_valid: 0,
    counts_invalid: 0,
    highest_count_reached: 0,
    current_streak: 0,
    best_streak: 0,
    points: 0,
    logic_solved: 0,
    logic_by_difficulty: { debutant: 0, facile: 0, intermediaire: 0, difficile: 0, expert: 0 },
    minigames_won: 0,
    duels_won: 0,
    duels_lost: 0,
    achievements: [],
    daily_counts: 0,
    weekly_counts: 0,
    monthly_counts: 0,
    last_count_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  };
  inMemoryPlayerStats.set(key, defaultStats);
  return defaultStats;
}
export async function savePlayerStats(stats) {
  const key = `${stats.guild_id}_${stats.user_id}`;
  stats.updated_at = new Date();
  inMemoryPlayerStats.set(key, stats);
  try {
    const db = getDb();
    if (db) {
      await db.collection('counting_players').updateOne(
        { guild_id: stats.guild_id, user_id: stats.user_id },
        { $set: stats },
        { upsert: true }
      );
    }
  } catch {}
}
export async function recordValidCount(guild, user, countValue) {
  const stats = await getPlayerStats(guild.id, user.id);
  stats.username = user.username;
  stats.counts_valid = (stats.counts_valid || 0) + 1;
  stats.daily_counts = (stats.daily_counts || 0) + 1;
  stats.weekly_counts = (stats.weekly_counts || 0) + 1;
  stats.monthly_counts = (stats.monthly_counts || 0) + 1;
  stats.current_streak = (stats.current_streak || 0) + 1;
  if (stats.current_streak > (stats.best_streak || 0)) {
    stats.best_streak = stats.current_streak;
  }
  if (countValue > (stats.highest_count_reached || 0)) {
    stats.highest_count_reached = countValue;
  }
  stats.points = (stats.points || 0) + 2;
  stats.last_count_at = new Date();
  checkAndUnlockAchievements(stats, countValue);
  await savePlayerStats(stats);
  try {
    await addXp(guild, user, 5, { isMessage: true });
    await adjustBalance(guild.id, user.id, 2);
  } catch {}
  return stats;
}
export async function recordInvalidCount(guild, user) {
  const stats = await getPlayerStats(guild.id, user.id);
  stats.username = user.username;
  stats.counts_invalid = (stats.counts_invalid || 0) + 1;
  stats.current_streak = 0; 
  stats.last_count_at = new Date();
  await savePlayerStats(stats);
  return stats;
}
export async function recordLogicSolution(guild, user, puzzle) {
  const stats = await getPlayerStats(guild.id, user.id);
  stats.username = user.username;
  stats.logic_solved = (stats.logic_solved || 0) + 1;
  stats.points = (stats.points || 0) + (puzzle.points || 20);
  if (!stats.logic_by_difficulty) {
    stats.logic_by_difficulty = { debutant: 0, facile: 0, intermediaire: 0, difficile: 0, expert: 0 };
  }
  const diff = puzzle.difficulty || 'facile';
  stats.logic_by_difficulty[diff] = (stats.logic_by_difficulty[diff] || 0) + 1;
  if (stats.logic_solved >= 5 && !stats.achievements.includes('logic_apprentice')) {
    stats.achievements.push('logic_apprentice');
  }
  if (stats.logic_solved >= 25 && !stats.achievements.includes('logic_master')) {
    stats.achievements.push('logic_master');
  }
  if (diff === 'expert' && !stats.achievements.includes('math_expert')) {
    stats.achievements.push('math_expert');
  }
  await savePlayerStats(stats);
  try {
    if (puzzle.xp) await addXp(guild, user, puzzle.xp);
    if (puzzle.coins) await adjustBalance(guild.id, user.id, puzzle.coins);
  } catch {}
  return stats;
}
export async function recordMiniGameWin(guild, user, game) {
  const stats = await getPlayerStats(guild.id, user.id);
  stats.username = user.username;
  stats.minigames_won = (stats.minigames_won || 0) + 1;
  stats.points = (stats.points || 0) + (game.points || 25);
  if (stats.minigames_won >= 5 && !stats.achievements.includes('minigame_winner')) {
    stats.achievements.push('minigame_winner');
  }
  await savePlayerStats(stats);
  try {
    if (game.xp) await addXp(guild, user, game.xp);
    if (game.coins) await adjustBalance(guild.id, user.id, game.coins);
  } catch {}
  return stats;
}
function checkAndUnlockAchievements(stats, countValue) {
  if (!stats.achievements) stats.achievements = [];
  if (stats.counts_valid >= 1 && !stats.achievements.includes('first_count')) {
    stats.achievements.push('first_count');
  }
  if (stats.counts_valid >= 50 && !stats.achievements.includes('fifty_counts')) {
    stats.achievements.push('fifty_counts');
  }
  if (stats.counts_valid >= 100 && !stats.achievements.includes('centurion')) {
    stats.achievements.push('centurion');
  }
  if (countValue >= 1000 && !stats.achievements.includes('millenaire')) {
    stats.achievements.push('millenaire');
  }
  if (stats.current_streak >= 10 && !stats.achievements.includes('streak_10')) {
    stats.achievements.push('streak_10');
  }
  if (stats.current_streak >= 25 && !stats.achievements.includes('streak_25')) {
    stats.achievements.push('streak_25');
  }
}
export async function getCountingLeaderboard(guildId, category = 'global', limit = 10) {
  try {
    const db = getDb();
    if (db) {
      const col = db.collection('counting_players');
      let sortField = 'points';
      const filter = { guild_id: guildId };
      if (category === 'counts') sortField = 'counts_valid';
      else if (category === 'daily') sortField = 'daily_counts';
      else if (category === 'weekly') sortField = 'weekly_counts';
      else if (category === 'monthly') sortField = 'monthly_counts';
      else if (category === 'streak') sortField = 'best_streak';
      else if (category === 'logic') sortField = 'logic_solved';
      else if (category === 'minigames') sortField = 'minigames_won';
      const docs = await col
        .find(filter)
        .sort({ [sortField]: -1 })
        .limit(limit)
        .toArray();
      return docs.map((d, idx) => ({
        rank: idx + 1,
        userId: d.user_id,
        username: d.username || 'Membre',
        points: d.points || 0,
        countsValid: d.counts_valid || 0,
        bestStreak: d.best_streak || 0,
        logicSolved: d.logic_solved || 0,
        scoreValue: d[sortField] || 0,
      }));
    }
  } catch {}
  const all = Array.from(inMemoryPlayerStats.values()).filter(p => p.guild_id === guildId);
  let sortKey = 'points';
  if (category === 'counts') sortKey = 'counts_valid';
  else if (category === 'streak') sortKey = 'best_streak';
  else if (category === 'logic') sortKey = 'logic_solved';
  all.sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
  return all.slice(0, limit).map((d, idx) => ({
    rank: idx + 1,
    userId: d.user_id,
    username: d.username || 'Membre',
    points: d.points || 0,
    countsValid: d.counts_valid || 0,
    bestStreak: d.best_streak || 0,
    logicSolved: d.logic_solved || 0,
    scoreValue: d[sortKey] || 0,
  }));
}
export async function comparePlayers(guildId, user1, user2) {
  const p1 = await getPlayerStats(guildId, user1.id);
  const p2 = await getPlayerStats(guildId, user2.id);
  const total1 = (p1.counts_valid || 0) + (p1.counts_invalid || 0);
  const total2 = (p2.counts_valid || 0) + (p2.counts_invalid || 0);
  const acc1 = total1 > 0 ? Math.round(((p1.counts_valid || 0) / total1) * 100) : 100;
  const acc2 = total2 > 0 ? Math.round(((p2.counts_valid || 0) / total2) * 100) : 100;
  return {
    player1: {
      user: user1,
      stats: p1,
      accuracy: acc1,
    },
    player2: {
      user: user2,
      stats: p2,
      accuracy: acc2,
    },
  };
}
