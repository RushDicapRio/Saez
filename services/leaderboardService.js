import { getDb } from '../database/mongo.js';
import { calculateLevel } from './userService.js';
export async function getLeaderboard(limit = 10) {
  const db = getDb();
  const list = [];
  try {
    const levelsCol = db.collection('user_levels');
    const doc = (await levelsCol.findOne({ _id: 'community_levels' })) || (await levelsCol.findOne({ _id: 'levels_data' }));
    if (doc?.data) {
      if (Array.isArray(doc.data)) {
        for (const item of doc.data) {
          if (!item) continue;
          const xp = item.xp || 0;
          const levelInfo = calculateLevel(xp);
          list.push({
            username: item.username || 'Inconnu',
            xp,
            level: item.level || levelInfo.level,
            episodesCount: item.episodes_count || 0,
            role: item.role || 'user',
          });
        }
      } else if (typeof doc.data === 'object') {
        for (const [username, val] of Object.entries(doc.data)) {
          if (!val) continue;
          const xp = typeof val === 'number' ? val : val.xp || 0;
          const levelInfo = calculateLevel(xp);
          list.push({
            username: val.username || username,
            xp,
            level: levelInfo.level,
            episodesCount: val.episodes_count || 0,
            role: val.role || 'user',
          });
        }
      }
    }
  } catch (err) {
    console.error('[LeaderboardService] Erreur lecture leaderboard:', err.message);
  }
  list.sort((a, b) => b.xp - a.xp);
  return list.slice(0, limit).map((u, idx) => ({
    ...u,
    rank: idx + 1,
  }));
}
