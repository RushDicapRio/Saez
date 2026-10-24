import { getDb } from '../database/mongo.js';
export function calculateLevel(totalXp = 0, xpBase = 100) {
  const safeXp = Math.max(0, Math.floor(totalXp || 0));
  const base = Math.max(10, Math.floor(xpBase || 100));
  let level = 1;
  let remainingXp = safeXp;
  while (true) {
    const xpNeededForNext = level * base;
    if (remainingXp < xpNeededForNext) {
      const progressPct = Math.min(100, Math.max(0, Math.round((remainingXp / xpNeededForNext) * 100)));
      return {
        level,
        currentLevelXp: remainingXp,
        nextLevelXp: xpNeededForNext,
        progressPct,
        totalXp: safeXp,
      };
    }
    remainingXp -= xpNeededForNext;
    level++;
  }
}
export async function getUserProfile(targetUsername) {
  const cleanName = (targetUsername || '').trim().toLowerCase();
  if (!cleanName) return null;
  const db = getDb();
  let presence = null;
  let levelData = null;
  try {
    const socialCol = db.collection('social_hub');
    const doc = await socialCol.findOne({ _id: 'main_social_data' });
    if (doc?.data?.presences) {
      for (const [key, p] of Object.entries(doc.data.presences)) {
        if (key.toLowerCase() === cleanName || (p?.username && p.username.toLowerCase() === cleanName)) {
          presence = p;
          break;
        }
      }
    }
  } catch {}
  try {
    const levelsCol = db.collection('user_levels');
    const doc = (await levelsCol.findOne({ _id: 'community_levels' })) || (await levelsCol.findOne({ _id: 'levels_data' }));
    if (doc?.data) {
      if (Array.isArray(doc.data)) {
        levelData = doc.data.find(
          (u) => u && ((u.username && u.username.toLowerCase() === cleanName) || (u.id && u.id.toLowerCase() === cleanName))
        );
      } else if (typeof doc.data === 'object') {
        levelData = doc.data[cleanName] || null;
      }
    }
  } catch {}
  let progressCount = 0;
  try {
    const progCol = db.collection('user_progress');
    const progDoc = (await progCol.findOne({ _id: `progress_${cleanName}` })) || (await progCol.findOne({ username: new RegExp(`^${cleanName}$`, 'i') }));
    if (progDoc?.items && Array.isArray(progDoc.items)) {
      progressCount = progDoc.items.length;
    }
  } catch {}
  if (!presence && !levelData && progressCount === 0) {
    return null;
  }
  const xp = levelData?.xp || 0;
  const levelInfo = calculateLevel(xp);
  return {
    username: presence?.username || targetUsername,
    avatar: presence?.avatar || null,
    status: presence?.status || 'offline',
    activity: presence?.activity || 'Hors-ligne',
    animeTitle: presence?.animeTitle,
    episodeTitle: presence?.episodeTitle,
    lastSeen: presence?.lastSeen,
    xp,
    levelInfo,
    episodesCount: levelData?.episodes_count || progressCount,
    role: levelData?.role || 'user',
    balance: levelData?.balance ?? 0,
    badge: levelData?.badge || null,
  };
}
export async function getOnlineUsers() {
  const db = getDb();
  const active = [];
  try {
    const socialCol = db.collection('social_hub');
    const doc = await socialCol.findOne({ _id: 'main_social_data' });
    if (doc?.data?.presences) {
      const now = Date.now();
      for (const [key, p] of Object.entries(doc.data.presences)) {
        if (p && p.status !== 'offline' && now - (p.lastSeen || 0) < 90 * 1000) {
          active.push({
            username: p.username || key,
            status: p.status,
            activity: p.activity || 'En ligne sur Saez Animes',
            animeTitle: p.animeTitle,
            episodeTitle: p.episodeTitle,
            seasonTitle: p.seasonTitle,
            avatar: p.avatar,
            lastSeen: p.lastSeen,
          });
        }
      }
    }
  } catch (err) {
    console.error('[UserService] Erreur lecture utilisateurs en ligne:', err.message);
  }
  return active;
}
