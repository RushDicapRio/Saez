import { getDb } from '../database/mongo.js';
let inMemoryStore = null;
function getStore() {
  try {
    const db = getDb();
    if (db) return { type: 'mongo', db };
  } catch {}
  if (!inMemoryStore) {
    inMemoryStore = {
      bookmarks: new Map(),
      collections: new Map(),
      settings: new Map(),
      history: [],
    };
  }
  return { type: 'memory', store: inMemoryStore };
}
export function resetMemoryStore() {
  inMemoryStore = {
    bookmarks: new Map(),
    collections: new Map(),
    settings: new Map(),
    history: [],
  };
}
export function isUrlSafe(urlString) {
  try {
    const parsed = new URL(urlString);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { safe: false, reason: 'Seuls les protocoles HTTP et HTTPS sont autorisés.' };
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '0.0.0.0' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return { safe: false, reason: 'Accès aux adresses privées, locales ou de loopback strictement interdit.' };
    }
    return { safe: true, parsed };
  } catch (err) {
    return { safe: false, reason: 'Format d\'adresse URL invalide.' };
  }
}
export function normalizeUrl(url) {
  try {
    const p = new URL(url.trim());
    return `${p.protocol}//${p.hostname.toLowerCase()}${p.pathname.replace(/\/+$/, '')}${p.search}`;
  } catch {
    return url.trim().toLowerCase();
  }
}
export function detectResourceType(url) {
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be') || u.includes('vimeo.com') || u.includes('twitch.tv')) {
    return 'video';
  }
  if (u.includes('github.com') || u.includes('gitlab.com') || u.includes('stackoverflow.com') || u.includes('npm.im')) {
    return 'code';
  }
  if (u.includes('discord.com/channels/')) {
    return 'discord_msg';
  }
  if (u.includes('spotify.com') || u.includes('soundcloud.com') || u.includes('deezer.com')) {
    return 'musique';
  }
  if (/\.(png|jpe?g|gif|webp|svg)$/i.test(u)) {
    return 'image';
  }
  if (u.includes('wikipedia.org') || u.includes('medium.com') || u.includes('dev.to')) {
    return 'article';
  }
  return 'site';
}
export async function recordHistory(userId, action, bookmarkId, details) {
  const entry = {
    userId,
    action,
    bookmarkId,
    details: details.slice(0, 200),
    timestamp: new Date(),
  };
  const s = getStore();
  if (s.type === 'mongo') {
    await s.db.collection('user_bookmark_history').insertOne(entry).catch(() => {});
  } else {
    s.store.history.unshift(entry);
    if (s.store.history.length > 100) s.store.history.pop();
  }
}
export async function addBookmark(userId, titleOrObj, contentArg, categoryArg = 'Général') {
  let title = '';
  let url = '';
  let description = '';
  let tags = [];
  let category = categoryArg;
  let collectionId = null;
  let isFavorite = false;
  let isPinned = false;
  let isPrivate = true;
  let note = '';
  let allowDuplicate = false;
  if (typeof titleOrObj === 'object' && titleOrObj !== null) {
    title = titleOrObj.title || '';
    url = titleOrObj.url || titleOrObj.content || '';
    description = titleOrObj.description || '';
    tags = Array.isArray(titleOrObj.tags) ? titleOrObj.tags : [];
    category = titleOrObj.category || 'Général';
    collectionId = titleOrObj.collectionId || null;
    isFavorite = !!titleOrObj.isFavorite;
    isPinned = !!titleOrObj.isPinned;
    isPrivate = titleOrObj.isPrivate !== false;
    note = titleOrObj.note || '';
    allowDuplicate = !!titleOrObj.allowDuplicate;
  } else {
    title = titleOrObj || '';
    url = contentArg || '';
  }
  const cleanUrl = url.trim();
  const cleanTitle = (title.trim() || cleanUrl).slice(0, 150);
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    throw new Error('L\'URL doit commencer par http:// ou https://');
  }
  const s = getStore();
  if (!allowDuplicate) {
    const existing = await findDuplicateByUrl(userId, cleanUrl);
    if (existing) {
      const err = new Error(`Ce lien est déjà enregistré sous le titre "${existing.title}".`);
      err.code = 'DUPLICATE_URL';
      err.existing = existing;
      throw err;
    }
  }
  const id = `bm_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const contentType = detectResourceType(cleanUrl);
  const doc = {
    _id: id,
    userId,
    title: cleanTitle,
    url: cleanUrl,
    content: cleanUrl,
    description: description.slice(0, 500),
    tags: tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
    category: category.trim(), 
    collectionId,
    isFavorite,
    isPinned,
    isArchived: false,
    note: note.slice(0, 1000), 
    visibility: isPrivate ? 'private' : 'shared',
    sharedWith: [],
    viewCount: 0,
    lastVisitedAt: null,
    lastVerifiedAt: null,
    httpStatus: null,
    contentType,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  if (s.type === 'mongo') {
    await s.db.collection('user_bookmarks').insertOne(doc);
  } else {
    s.store.bookmarks.set(id, doc);
  }
  await recordHistory(userId, 'ADD', id, `Ajout du marque-page "${cleanTitle}"`);
  return doc;
}
export async function getUserBookmarks(userId, options = {}) {
  const {
    collectionId = null,
    tag = null,
    filter = 'all', 
    search = '',
    sortBy = 'createdAt', 
    sortOrder = -1,
    page = 1,
    limit = 50,
  } = options;
  const s = getStore();
  let list = [];
  if (s.type === 'mongo') {
    const query = { userId };
    if (filter === 'favorites') query.isFavorite = true;
    if (filter === 'pinned') query.isPinned = true;
    if (filter === 'archived') {
      query.isArchived = true;
    } else {
      query.isArchived = { $ne: true }; 
    }
    if (collectionId) query.collectionId = collectionId;
    if (tag) query.tags = tag.toLowerCase().trim();
    if (search?.trim()) {
      const reg = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ title: reg }, { description: reg }, { url: reg }, { note: reg }, { tags: reg }];
    }
    const sort = {};
    sort[sortBy] = sortOrder;
    list = await s.db
      .collection('user_bookmarks')
      .find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
  } else {
    let all = [...s.store.bookmarks.values()].filter((b) => b.userId === userId);
    if (filter === 'favorites') all = all.filter((b) => b.isFavorite);
    if (filter === 'pinned') all = all.filter((b) => b.isPinned);
    if (filter === 'archived') {
      all = all.filter((b) => b.isArchived);
    } else {
      all = all.filter((b) => !b.isArchived);
    }
    if (collectionId) all = all.filter((b) => b.collectionId === collectionId);
    if (tag) all = all.filter((b) => b.tags && b.tags.includes(tag.toLowerCase().trim()));
    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      all = all.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          (b.description && b.description.toLowerCase().includes(q)) ||
          (b.note && b.note.toLowerCase().includes(q)) ||
          (b.tags && b.tags.some((t) => t.includes(q)))
      );
    }
    all.sort((a, b) => {
      let va = a[sortBy] || 0;
      let vb = b[sortBy] || 0;
      if (typeof va === 'string') return sortOrder === 1 ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortOrder === 1 ? va - vb : vb - va;
    });
    list = all.slice((page - 1) * limit, page * limit);
  }
  return list;
}
export async function getBookmarkById(userId, bookmarkId, allowShared = true) {
  const s = getStore();
  let doc = null;
  if (s.type === 'mongo') {
    doc = await s.db.collection('user_bookmarks').findOne({ _id: bookmarkId });
  } else {
    doc = s.store.bookmarks.get(bookmarkId) || null;
  }
  if (!doc) return null;
  if (doc.userId === userId) return doc;
  if (allowShared && (doc.visibility === 'shared' || doc.sharedWith?.includes(userId))) {
    const sanitized = { ...doc, note: null };
    return sanitized;
  }
  return null;
}
export async function updateBookmark(userId, bookmarkId, updates) {
  const s = getStore();
  const existing = await getBookmarkById(userId, bookmarkId, false);
  if (!existing || existing.userId !== userId) {
    return { success: false, message: 'Marque-page introuvable ou vous n\'en êtes pas le propriétaire.' };
  }
  const cleanUpdates = {
    ...updates,
    updatedAt: new Date(),
  };
  if (cleanUpdates.url) {
    cleanUpdates.content = cleanUpdates.url; 
    cleanUpdates.contentType = detectResourceType(cleanUpdates.url);
  }
  if (s.type === 'mongo') {
    await s.db.collection('user_bookmarks').updateOne({ _id: bookmarkId, userId }, { $set: cleanUpdates });
  } else {
    Object.assign(existing, cleanUpdates);
  }
  await recordHistory(userId, 'EDIT', bookmarkId, `Modification du marque-page "${existing.title}"`);
  return { success: true, bookmark: { ...existing, ...cleanUpdates } };
}
export async function deleteBookmark(userId, bookmarkId) {
  const s = getStore();
  let deleted = false;
  if (s.type === 'mongo') {
    const res = await s.db.collection('user_bookmarks').deleteOne({ _id: bookmarkId, userId });
    deleted = res.deletedCount > 0;
  } else {
    const b = s.store.bookmarks.get(bookmarkId);
    if (b && b.userId === userId) {
      s.store.bookmarks.delete(bookmarkId);
      deleted = true;
    }
  }
  if (deleted) {
    await recordHistory(userId, 'DELETE', bookmarkId, 'Suppression du marque-page');
  }
  return deleted;
}
export async function toggleFavorite(userId, bookmarkId, forceStatus = null) {
  const bm = await getBookmarkById(userId, bookmarkId, false);
  if (!bm) return null;
  const newStatus = forceStatus !== null ? !!forceStatus : !bm.isFavorite;
  await updateBookmark(userId, bookmarkId, { isFavorite: newStatus });
  await recordHistory(userId, newStatus ? 'FAVORITE' : 'UNFAVORITE', bookmarkId, `Favori : ${newStatus}`);
  return newStatus;
}
export async function togglePin(userId, bookmarkId, forceStatus = null) {
  const bm = await getBookmarkById(userId, bookmarkId, false);
  if (!bm) return null;
  const newStatus = forceStatus !== null ? !!forceStatus : !bm.isPinned;
  await updateBookmark(userId, bookmarkId, { isPinned: newStatus });
  await recordHistory(userId, newStatus ? 'PIN' : 'UNPIN', bookmarkId, `Épinglé : ${newStatus}`);
  return newStatus;
}
export async function toggleArchive(userId, bookmarkId, forceStatus = null) {
  const bm = await getBookmarkById(userId, bookmarkId, false);
  if (!bm) return null;
  const newStatus = forceStatus !== null ? !!forceStatus : !bm.isArchived;
  await updateBookmark(userId, bookmarkId, { isArchived: newStatus });
  await recordHistory(userId, newStatus ? 'ARCHIVE' : 'RESTORE', bookmarkId, `Archivé : ${newStatus}`);
  return newStatus;
}
export async function recordBookmarkVisit(userId, bookmarkId) {
  const bm = await getBookmarkById(userId, bookmarkId, true);
  if (!bm) return null;
  const updates = {
    viewCount: (bm.viewCount || 0) + 1,
    lastVisitedAt: new Date(),
  };
  const s = getStore();
  if (s.type === 'mongo') {
    await s.db.collection('user_bookmarks').updateOne({ _id: bookmarkId }, { $set: updates });
  } else {
    Object.assign(bm, updates);
  }
  return updates.viewCount;
}
export async function duplicateBookmark(userId, bookmarkId, customTitle = null) {
  const original = await getBookmarkById(userId, bookmarkId, false);
  if (!original) return null;
  return await addBookmark(userId, {
    title: customTitle?.trim() || `${original.title} (Copie)`,
    url: original.url,
    description: original.description,
    tags: [...(original.tags || [])],
    collectionId: original.collectionId,
    note: original.note,
    allowDuplicate: true,
  });
}
export async function createCollection(userId, options = {}) {
  const {
    name,
    description = '',
    emoji = '📁',
    color = '#00e5ff',
    visibility = 'private',
  } = options;
  if (!name?.trim()) throw new Error('Le nom de la collection est requis.');
  const id = `col_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const doc = {
    _id: id,
    userId,
    name: name.trim().slice(0, 100),
    description: description.trim().slice(0, 300),
    emoji: emoji.slice(0, 10),
    color,
    visibility,
    sharedWith: [],
    isPinned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const s = getStore();
  if (s.type === 'mongo') {
    await s.db.collection('user_bookmark_collections').insertOne(doc);
  } else {
    s.store.collections.set(id, doc);
  }
  await recordHistory(userId, 'COLLECTION_CREATE', id, `Création collection "${doc.name}"`);
  return doc;
}
export async function getUserCollections(userId) {
  const s = getStore();
  let list = [];
  if (s.type === 'mongo') {
    list = await s.db
      .collection('user_bookmark_collections')
      .find({
        $or: [{ userId }, { visibility: 'shared', 'sharedWith.userId': userId }],
      })
      .sort({ createdAt: -1 })
      .toArray();
  } else {
    list = [...s.store.collections.values()].filter(
      (c) => c.userId === userId || (c.visibility === 'shared' && c.sharedWith?.some((u) => u.userId === userId))
    );
  }
  for (const c of list) {
    if (s.type === 'mongo') {
      c.count = await s.db.collection('user_bookmarks').countDocuments({ collectionId: c._id });
    } else {
      c.count = [...s.store.bookmarks.values()].filter((b) => b.collectionId === c._id).length;
    }
  }
  return list;
}
export async function getCollectionById(userId, collectionId) {
  const s = getStore();
  let col = null;
  if (s.type === 'mongo') {
    col = await s.db.collection('user_bookmark_collections').findOne({ _id: collectionId });
  } else {
    col = s.store.collections.get(collectionId) || null;
  }
  if (!col) return null;
  if (col.userId === userId || col.visibility === 'shared' || col.sharedWith?.some((u) => u.userId === userId)) {
    return col;
  }
  return null;
}
export async function updateCollection(userId, collectionId, updates) {
  const col = await getCollectionById(userId, collectionId);
  if (!col || col.userId !== userId) {
    return { success: false, message: 'Collection introuvable ou vous n\'en êtes pas le créateur.' };
  }
  const clean = { ...updates, updatedAt: new Date() };
  const s = getStore();
  if (s.type === 'mongo') {
    await s.db.collection('user_bookmark_collections').updateOne({ _id: collectionId }, { $set: clean });
  } else {
    Object.assign(col, clean);
  }
  await recordHistory(userId, 'COLLECTION_EDIT', collectionId, `Modification collection "${col.name}"`);
  return { success: true, collection: { ...col, ...clean } };
}
export async function deleteCollection(userId, collectionId, deleteBookmarks = false) {
  const col = await getCollectionById(userId, collectionId);
  if (!col || col.userId !== userId) {
    return { success: false, message: 'Collection introuvable.' };
  }
  const s = getStore();
  if (s.type === 'mongo') {
    await s.db.collection('user_bookmark_collections').deleteOne({ _id: collectionId, userId });
    if (deleteBookmarks) {
      await s.db.collection('user_bookmarks').deleteMany({ collectionId, userId });
    } else {
      await s.db.collection('user_bookmarks').updateMany({ collectionId, userId }, { $set: { collectionId: null } });
    }
  } else {
    s.store.collections.delete(collectionId);
    if (deleteBookmarks) {
      for (const [id, b] of s.store.bookmarks.entries()) {
        if (b.collectionId === collectionId && b.userId === userId) {
          s.store.bookmarks.delete(id);
        }
      }
    } else {
      for (const b of s.store.bookmarks.values()) {
        if (b.collectionId === collectionId && b.userId === userId) {
          b.collectionId = null;
        }
      }
    }
  }
  await recordHistory(userId, 'COLLECTION_DELETE', collectionId, `Suppression collection "${col.name}"`);
  return { success: true };
}
export async function moveBookmark(userId, bookmarkId, targetCollectionId, copyOnly = false) {
  const bm = await getBookmarkById(userId, bookmarkId, false);
  if (!bm) return { success: false, message: 'Marque-page introuvable.' };
  if (targetCollectionId) {
    const col = await getCollectionById(userId, targetCollectionId);
    if (!col) return { success: false, message: 'Collection cible introuvable.' };
  }
  if (copyOnly) {
    const copy = await duplicateBookmark(userId, bookmarkId);
    await updateBookmark(userId, copy._id, { collectionId: targetCollectionId });
    return { success: true, bookmark: copy, mode: 'copy' };
  } else {
    await updateBookmark(userId, bookmarkId, { collectionId: targetCollectionId });
    return { success: true, bookmark: bm, mode: 'move' };
  }
}
export async function getUserTags(userId) {
  const bookmarks = await getUserBookmarks(userId, { limit: 1000 });
  const counts = new Map();
  for (const b of bookmarks) {
    if (b.tags && Array.isArray(b.tags)) {
      for (const t of b.tags) {
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    }
  }
  return [...counts.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
}
export async function addTagToBookmark(userId, bookmarkId, tag) {
  const bm = await getBookmarkById(userId, bookmarkId, false);
  if (!bm) return null;
  const cleanTag = tag.trim().toLowerCase();
  const currentTags = new Set(bm.tags || []);
  currentTags.add(cleanTag);
  await updateBookmark(userId, bookmarkId, { tags: [...currentTags] });
  return [...currentTags];
}
export async function removeTagFromBookmark(userId, bookmarkId, tag) {
  const bm = await getBookmarkById(userId, bookmarkId, false);
  if (!bm) return null;
  const cleanTag = tag.trim().toLowerCase();
  const currentTags = (bm.tags || []).filter((t) => t !== cleanTag);
  await updateBookmark(userId, bookmarkId, { tags: currentTags });
  return currentTags;
}
export async function findDuplicateByUrl(userId, url) {
  const norm = normalizeUrl(url);
  const all = await getUserBookmarks(userId, { limit: 1000 });
  return all.find((b) => normalizeUrl(b.url) === norm) || null;
}
export async function findAllDuplicates(userId) {
  const all = await getUserBookmarks(userId, { limit: 1000 });
  const urlMap = new Map();
  const duplicates = [];
  for (const b of all) {
    const norm = normalizeUrl(b.url);
    if (urlMap.has(norm)) {
      duplicates.push({ original: urlMap.get(norm), duplicate: b });
    } else {
      urlMap.set(norm, b);
    }
  }
  return duplicates;
}
export async function getRandomBookmarks(userId, count = 1, collectionId = null) {
  const all = await getUserBookmarks(userId, { collectionId, limit: 1000 });
  if (all.length === 0) return [];
  const shuffled = [...all];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
export async function verifyBookmarkUrl(userId, bookmarkId) {
  const bm = await getBookmarkById(userId, bookmarkId, false);
  if (!bm) return { success: false, message: 'Marque-page introuvable.' };
  const check = isUrlSafe(bm.url);
  if (!check.safe) {
    return { success: false, message: `URL bloquée par sécurité : ${check.reason}` };
  }
  let status = null;
  let accessible = false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(bm.url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'SaezAnimes-BookmarkVerifier/1.0' },
    });
    clearTimeout(timeout);
    status = res.status;
    accessible = res.ok || (status >= 200 && status < 400);
  } catch (netErr) {
    accessible = false;
    status = netErr.name === 'AbortError' ? 408 : 503;
  }
  await updateBookmark(userId, bookmarkId, {
    httpStatus: status,
    lastVerifiedAt: new Date(),
  });
  return {
    success: true,
    accessible,
    status,
    url: bm.url,
  };
}
export async function exportUserBookmarks(userId, options = {}) {
  const { collectionId = null, onlyFavorites = false, format = 'json' } = options;
  let bookmarks = await getUserBookmarks(userId, { collectionId, limit: 2000 });
  if (onlyFavorites) bookmarks = bookmarks.filter((b) => b.isFavorite);
  const collections = await getUserCollections(userId);
  if (format === 'csv') {
    const headers = ['ID', 'Titre', 'URL', 'Tags', 'Collection', 'Favori', 'Date_Creation'];
    const rows = bookmarks.map((b) => {
      const colName = collections.find((c) => c._id === b.collectionId)?.name || 'Aucune';
      return [
        `"${b._id}"`,
        `"${(b.title || '').replace(/"/g, '""')}"`,
        `"${b.url}"`,
        `"${(b.tags || []).join(';')}"`,
        `"${colName}"`,
        b.isFavorite ? 'Oui' : 'Non',
        b.createdAt ? new Date(b.createdAt).toISOString() : '',
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    return {
      format: 'csv',
      data: Buffer.from(csvContent, 'utf-8'),
      filename: `bookmarks-${userId}-${Date.now()}.csv`,
      count: bookmarks.length,
    };
  }
  const exportPayload = {
    manifest: {
      generator: 'Saez Animes Bookmark Engine',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      userId,
      totalBookmarks: bookmarks.length,
      totalCollections: collections.length,
    },
    collections: collections.map((c) => ({
      id: c._id,
      name: c.name,
      description: c.description,
      emoji: c.emoji,
      color: c.color,
    })),
    bookmarks: bookmarks.map((b) => ({
      id: b._id,
      title: b.title,
      url: b.url,
      description: b.description,
      tags: b.tags,
      collectionId: b.collectionId,
      isFavorite: b.isFavorite,
      isPinned: b.isPinned,
      note: b.note, 
      createdAt: b.createdAt,
    })),
  };
  const jsonStr = JSON.stringify(exportPayload, null, 2);
  return {
    format: 'json',
    data: Buffer.from(jsonStr, 'utf-8'),
    filename: `bookmarks-${userId}-${Date.now()}.json`,
    count: bookmarks.length,
  };
}
export async function importUserBookmarks(userId, rawContentOrBuffer, options = {}) {
  const { onDuplicate = 'ignore' } = options; 
  let parsed;
  try {
    const raw = Buffer.isBuffer(rawContentOrBuffer) ? rawContentOrBuffer.toString('utf-8') : String(rawContentOrBuffer);
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error('Fichier JSON invalide ou corrompu.');
  }
  const items = Array.isArray(parsed) ? parsed : parsed.bookmarks || [];
  if (!Array.isArray(items)) {
    throw new Error('Structure de données incompatible : liste des marque-pages introuvable.');
  }
  let importedCount = 0;
  let skippedCount = 0;
  for (const item of items) {
    if (!item.url) {
      skippedCount++;
      continue;
    }
    try {
      const isDup = await findDuplicateByUrl(userId, item.url);
      if (isDup) {
        if (onDuplicate === 'ignore') {
          skippedCount++;
          continue;
        }
      }
      await addBookmark(userId, {
        title: item.title || item.url,
        url: item.url,
        description: item.description || '',
        tags: Array.isArray(item.tags) ? item.tags : [],
        isFavorite: !!item.isFavorite,
        note: item.note || '',
        allowDuplicate: onDuplicate === 'add',
      });
      importedCount++;
    } catch {
      skippedCount++;
    }
  }
  await recordHistory(userId, 'IMPORT', 'BATCH', `Importation : ${importedCount} importés, ${skippedCount} ignorés.`);
  return { importedCount, skippedCount, totalProcessed: items.length };
}
export async function getUserBookmarkStats(userId) {
  const bookmarks = await getUserBookmarks(userId, { limit: 2000 });
  const collections = await getUserCollections(userId);
  const total = bookmarks.length;
  const favorites = bookmarks.filter((b) => b.isFavorite).length;
  const pinned = bookmarks.filter((b) => b.isPinned).length;
  const archived = bookmarks.filter((b) => b.isArchived).length;
  const typeCounts = {};
  for (const b of bookmarks) {
    const t = b.contentType || 'autre';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  }
  const tagCounts = await getUserTags(userId);
  return {
    total,
    favorites,
    pinned,
    archived,
    collectionsCount: collections.length,
    types: typeCounts,
    topTags: tagCounts.slice(0, 5),
    mostVisited: [...bookmarks].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 3),
  };
}
export async function getUserBookmarkQuota(userId) {
  const bookmarks = await getUserBookmarks(userId, { limit: 2000 });
  const collections = await getUserCollections(userId);
  const maxBookmarks = 500;
  const maxCollections = 50;
  return {
    usedBookmarks: bookmarks.length,
    maxBookmarks,
    percentBookmarks: Math.min(100, Math.round((bookmarks.length / maxBookmarks) * 100)),
    usedCollections: collections.length,
    maxCollections,
    percentCollections: Math.min(100, Math.round((collections.length / maxCollections) * 100)),
  };
}
export async function getUserBookmarkHistory(userId, limit = 15) {
  const s = getStore();
  if (s.type === 'mongo') {
    return await s.db
      .collection('user_bookmark_history')
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  } else {
    return s.store.history.filter((h) => h.userId === userId).slice(0, limit);
  }
}
