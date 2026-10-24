import { getDb } from '../database/mongo.js';
export async function getActivityLeaderboard(guildId, limit = 10) {
  try {
    const db = getDb();
    const col = db.collection('user_activity_stats');
    const docs = await col
      .find({ guildId })
      .sort({ totalScore: -1, messagesCount: -1 })
      .limit(limit)
      .toArray();
    return docs.map((doc, idx) => ({
      rank: idx + 1,
      userId: doc.userId,
      username: doc.username || 'Membre',
      messagesCount: doc.messagesCount || 0,
      voiceMinutes: doc.voiceMinutes || 0,
      totalScore: doc.totalScore || 0,
    }));
  } catch (err) {
    console.error('[CommunityLeaderboard] Erreur getActivityLeaderboard:', err.message);
    return [];
  }
}
export async function trackUserActivity(guildId, userId, username, type = 'message', amount = 1) {
  try {
    const db = getDb();
    const col = db.collection('user_activity_stats');
    const incField = type === 'message' ? { messagesCount: amount, totalScore: amount * 2 } : { voiceMinutes: amount, totalScore: amount * 3 };
    await col.updateOne(
      { guildId, userId },
      {
        $inc: incField,
        $set: { username, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
  } catch {}
}
export async function getQuizLeaderboard(guildId, limit = 10) {
  try {
    const db = getDb();
    const col = db.collection('quiz_stats');
    const docs = await col
      .find({ guildId })
      .sort({ score: -1, wins: -1 })
      .limit(limit)
      .toArray();
    return docs.map((doc, idx) => ({
      rank: idx + 1,
      userId: doc.userId,
      username: doc.username || 'Joueur',
      score: doc.score || 0,
      wins: doc.wins || 0,
      gamesPlayed: doc.gamesPlayed || 0,
    }));
  } catch (err) {
    console.error('[CommunityLeaderboard] Erreur getQuizLeaderboard:', err.message);
    return [];
  }
}
export async function addQuizScore(guildId, userId, username, points = 10, isWin = false) {
  try {
    const db = getDb();
    const col = db.collection('quiz_stats');
    await col.updateOne(
      { guildId, userId },
      {
        $inc: { score: points, wins: isWin ? 1 : 0, gamesPlayed: 1 },
        $set: { username, lastPlayedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
  } catch {}
}
export async function getGiveawayLeaderboard(guildId, limit = 10) {
  try {
    const db = getDb();
    const col = db.collection('giveaways_history');
    const pipeline = [
      { $match: { guildId } },
      { $unwind: '$winnerIds' },
      {
        $group: {
          _id: '$winnerIds',
          totalWins: { $sum: 1 },
          lastWinDate: { $max: '$endedAt' },
        },
      },
      { $sort: { totalWins: -1 } },
      { $limit: limit },
    ];
    const results = await col.aggregate(pipeline).toArray();
    return results.map((r, idx) => ({
      rank: idx + 1,
      userId: r._id,
      totalWins: r.totalWins,
      lastWinDate: r.lastWinDate,
    }));
  } catch (err) {
    console.error('[CommunityLeaderboard] Erreur getGiveawayLeaderboard:', err.message);
    return [];
  }
}
