import { getDb } from '../database/mongo.js';
export async function getAllAnimes() {
  const db = getDb();
  try {
    const col = db.collection('catalogue');
    const docs = await col.find({}).toArray();
    if (docs.length > 0) {
      if (docs.length === 1 && docs[0]._id === 'main_catalogue' && Array.isArray(docs[0].data)) {
        return docs[0].data;
      }
      return docs.filter((d) => d && d.title);
    }
  } catch (err) {
    console.error('[CatalogueService] Erreur lecture catalogue:', err.message);
  }
  return [];
}
export async function searchAnimes(query, limit = 5) {
  const animes = await getAllAnimes();
  const q = (query || '').toLowerCase().trim();
  if (!q) return animes.slice(0, limit);
  return animes
    .filter((a) => {
      const title = (a.title || '').toLowerCase();
      const genres = (a.genres || '').toLowerCase();
      const desc = (a.description || '').toLowerCase();
      const year = a.year ? String(a.year) : '';
      return title.includes(q) || genres.includes(q) || desc.includes(q) || year.includes(q);
    })
    .slice(0, limit);
}
export async function getRecentReleases(limit = 6) {
  const db = getDb();
  try {
    const col = db.collection('releases');
    const doc = await col.findOne({ _id: 'recent_releases' });
    if (doc && Array.isArray(doc.data)) {
      return doc.data.slice(0, limit);
    }
  } catch (err) {
    console.error('[CatalogueService] Erreur lecture releases:', err.message);
  }
  return [];
}
