import { getDb } from '../database/mongo.js';
export async function getSaezRealStats() {
  const db = getDb();
  let onlineUsers = 0;
  const activeMembers = [];
  try {
    const socialCol = db.collection('social_hub');
    const doc = await socialCol.findOne({ _id: 'main_social_data' });
    if (doc && doc.data && doc.data.presences) {
      const presences = doc.data.presences;
      const now = Date.now();
      const counted = new Set();
      for (const [key, p] of Object.entries(presences)) {
        if (p && p.status !== 'offline' && now - (p.lastSeen || 0) < 90 * 1000) {
          const uname = (p.username || key).trim();
          if (!counted.has(uname.toLowerCase())) {
            counted.add(uname.toLowerCase());
            activeMembers.push({
              username: uname,
              status: p.status || 'online',
              activity: p.activity || 'En ligne',
              animeTitle: p.animeTitle,
              episodeTitle: p.episodeTitle,
              avatar: p.avatar,
              lastSeen: p.lastSeen,
            });
          }
        }
      }
      onlineUsers = activeMembers.length;
    }
  } catch (err) {
    console.warn('[StatsService] Erreur lecture présences:', err.message);
  }
  let totalAnimes = 0;
  let totalEpisodes = 0;
  let totalFilms = 0;
  let totalOav = 0;
  try {
    const catCol = db.collection('catalogue');
    let animesList = [];
    const allDocs = await catCol.find({}).toArray();
    if (allDocs.length > 0) {
      if (allDocs.length === 1 && allDocs[0]._id === 'main_catalogue' && Array.isArray(allDocs[0].data)) {
        animesList = allDocs[0].data;
      } else {
        animesList = allDocs.filter((d) => d && d.title);
      }
    }
    totalAnimes = animesList.length;
    for (const anime of animesList) {
      const seasons = Array.isArray(anime.seasons) ? anime.seasons : [];
      const genres = (anime.genres || '').toLowerCase();
      let hasCountedSeason = false;
      for (const season of seasons) {
        const sTitle = (season.title || '').trim().toLowerCase();
        const epCount = Array.isArray(season.episodes) ? season.episodes.length : 0;
        const count = epCount > 0 ? epCount : 1;
        if (sTitle.includes('film') || sTitle.includes('movie')) {
          totalFilms += count;
          hasCountedSeason = true;
        } else if (
          sTitle.includes('oav') ||
          sTitle.includes('ova') ||
          sTitle.includes('spécial') ||
          sTitle.includes('special')
        ) {
          totalOav += count;
          hasCountedSeason = true;
        } else {
          totalEpisodes += epCount;
          if (epCount > 0) hasCountedSeason = true;
        }
      }
      if (!hasCountedSeason) {
        if (genres.includes('film')) {
          totalFilms += 1;
        } else if (genres.includes('oav') || genres.includes('ova')) {
          totalOav += 1;
        }
      }
    }
  } catch (err) {
    console.warn('[StatsService] Erreur lecture catalogue:', err.message);
  }
  let totalWatched = 0;
  let totalFavorites = 0;
  try {
    const commCol = db.collection('community_stats');
    const commDoc = (await commCol.findOne({ _id: 'global_stats' })) || (await commCol.findOne({ _id: 'stats' }));
    if (commDoc) {
      totalWatched = Number(commDoc.total_watched) || 0;
      totalFavorites = Number(commDoc.total_favorites) || 0;
    }
  } catch {}
  return {
    onlineUsers,
    activeMembers,
    totalAnimes,
    totalEpisodes,
    totalFilms,
    totalOav,
    totalWatched,
    totalFavorites,
    lastCalculated: new Date(),
  };
}
