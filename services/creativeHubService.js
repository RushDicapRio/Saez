import { getDb } from '../database/mongo.js';
let inMemoryStore = null;
function getStore() {
  try {
    const db = getDb();
    if (db) return { type: 'mongo', db };
  } catch {}
  if (!inMemoryStore) {
    inMemoryStore = {
      books: new Map(),
      bookClubs: new Map(),
      recipes: new Map(),
      serverStories: [],
      userStories: new Map(),
      letters: new Map(),
      poems: new Map(),
      serverWorldbuilding: new Map(),
      userUniverses: new Map(),
      universeElements: new Map(),
      collections: new Map(),
      ideas: new Map(),
      projects: new Map(),
      gallery: new Map(),
      reports: [],
    };
  }
  return { type: 'memory', store: inMemoryStore };
}
export function resetMemoryStore() {
  inMemoryStore = {
    books: new Map(),
    bookClubs: new Map(),
    recipes: new Map(),
    serverStories: [],
    userStories: new Map(),
    letters: new Map(),
    poems: new Map(),
    serverWorldbuilding: new Map(),
    userUniverses: new Map(),
    universeElements: new Map(),
    collections: new Map(),
    ideas: new Map(),
    projects: new Map(),
    gallery: new Map(),
    reports: [],
  };
}
export async function addReadingBook(userId, {
  title,
  author = 'Inconnu',
  category = 'Manga',
  totalVolumes = 1,
  currentVolume = 1,
  totalPages = 0,
  currentPage = 0,
  rating = 0,
  format = 'Papier',
  status = null,
  description = '',
  tags = [],
  notes = '',
  isFavorite = false,
}) {
  if (!title || !title.trim()) throw new Error('Le titre du livre est obligatoire.');
  const curVol = parseInt(currentVolume, 10) || 1;
  const totVol = parseInt(totalVolumes, 10) || curVol;
  const curPage = parseInt(currentPage, 10) || 0;
  const totPages = parseInt(totalPages, 10) || 0;
  const resolvedStatus = status || (curVol >= totVol && totVol > 0 ? 'Terminé' : 'En cours');
  const doc = {
    _id: `book_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    title: title.trim(),
    author: author.trim(),
    category, 
    totalVolumes: totVol,
    currentVolume: curVol,
    totalPages: totPages,
    currentPage: curPage,
    rating: Math.max(0, Math.min(5, parseInt(rating, 10) || 0)),
    format, 
    status: resolvedStatus, 
    description: description.trim(),
    tags: Array.isArray(tags) ? tags : String(tags || '').split(',').map(t => t.trim()).filter(Boolean),
    notes: notes.trim(),
    quotes: [],
    sessions: [],
    isFavorite: Boolean(isFavorite),
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('user_reading_tracker').insertOne(doc);
  } else {
    store.store.books.set(doc._id, doc);
  }
  return doc;
}
export async function getReadingBookById(userId, bookId) {
  const store = getStore();
  if (store.type === 'mongo') {
    return await store.db.collection('user_reading_tracker').findOne({ _id: bookId, userId });
  } else {
    const item = store.store.books.get(bookId);
    return item && item.userId === userId ? item : null;
  }
}
export async function updateReadingBook(userId, bookId, updates) {
  const book = await getReadingBookById(userId, bookId);
  if (!book) throw new Error('Livre introuvable ou non autorisé.');
  const allowed = [
    'title', 'author', 'category', 'totalVolumes', 'currentVolume',
    'totalPages', 'currentPage', 'rating', 'format', 'status',
    'description', 'tags', 'notes', 'sessions', 'quotes', 'isFavorite', 'isArchived'
  ];
  const patch = { updatedAt: new Date() };
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      if (key === 'rating') patch[key] = Math.max(0, Math.min(5, parseInt(updates[key], 10) || 0));
      else if (['totalVolumes', 'currentVolume', 'totalPages', 'currentPage'].includes(key)) {
        patch[key] = parseInt(updates[key], 10) || 0;
      } else if (key === 'tags' && !Array.isArray(updates[key])) {
        patch[key] = String(updates[key]).split(',').map(s => s.trim()).filter(Boolean);
      } else {
        patch[key] = updates[key];
      }
    }
  }
  if (!updates.status && (patch.currentVolume !== undefined || patch.totalVolumes !== undefined)) {
    const cv = patch.currentVolume ?? book.currentVolume;
    const tv = patch.totalVolumes ?? book.totalVolumes;
    if (cv >= tv && tv > 0) patch.status = 'Terminé';
  }
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('user_reading_tracker').updateOne({ _id: bookId, userId }, { $set: patch });
    return await store.db.collection('user_reading_tracker').findOne({ _id: bookId });
  } else {
    const updated = { ...book, ...patch };
    store.store.books.set(bookId, updated);
    return updated;
  }
}
export async function deleteReadingBook(userId, bookId) {
  const book = await getReadingBookById(userId, bookId);
  if (!book) throw new Error('Livre introuvable ou vous n\'en êtes pas le propriétaire.');
  const store = getStore();
  if (store.type === 'mongo') {
    const res = await store.db.collection('user_reading_tracker').deleteOne({ _id: bookId, userId });
    return res.deletedCount > 0;
  } else {
    return store.store.books.delete(bookId);
  }
}
export async function getUserReadingBooks(userId, {
  status = null,
  category = null,
  tag = null,
  search = '',
  isFavorite = null,
  isArchived = false,
  limit = 50,
} = {}) {
  const store = getStore();
  if (store.type === 'mongo') {
    const query = { userId };
    if (isArchived !== null) query.isArchived = Boolean(isArchived);
    if (status) query.status = status;
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (isFavorite !== null) query.isFavorite = Boolean(isFavorite);
    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ];
    }
    return await store.db.collection('user_reading_tracker')
      .find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();
  } else {
    let list = Array.from(store.store.books.values()).filter(b => b.userId === userId);
    if (isArchived !== null) list = list.filter(b => Boolean(b.isArchived) === Boolean(isArchived));
    if (status) list = list.filter(b => b.status === status);
    if (category) list = list.filter(b => b.category === category);
    if (tag) list = list.filter(b => b.tags && b.tags.includes(tag));
    if (isFavorite !== null) list = list.filter(b => Boolean(b.isFavorite) === Boolean(isFavorite));
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.tags && b.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return list.slice(0, limit);
  }
}
export async function recordReadingSession(userId, bookId, { pagesRead = 0, volumesRead = 0, minutes = 0, note = '' }) {
  const book = await getReadingBookById(userId, bookId);
  if (!book) throw new Error('Livre introuvable.');
  const pRead = Math.max(0, parseInt(pagesRead, 10) || 0);
  const vRead = Math.max(0, parseInt(volumesRead, 10) || 0);
  const min = Math.max(0, parseInt(minutes, 10) || 0);
  const newCurPage = Math.min(book.totalPages || 999999, (book.currentPage || 0) + pRead);
  const newCurVol = Math.min(book.totalVolumes || 999, (book.currentVolume || 0) + vRead);
  const sessionEntry = {
    id: `sess_${Date.now().toString(36)}`,
    date: new Date(),
    pagesRead: pRead,
    volumesRead: vRead,
    minutes: min,
    note: note.trim(),
  };
  const sessions = Array.isArray(book.sessions) ? [...book.sessions, sessionEntry] : [sessionEntry];
  const patch = {
    sessions,
    currentPage: pRead > 0 ? newCurPage : book.currentPage,
    currentVolume: vRead > 0 ? newCurVol : book.currentVolume,
    updatedAt: new Date(),
  };
  if (patch.currentVolume >= book.totalVolumes && book.totalVolumes > 0) {
    patch.status = 'Terminé';
  }
  return await updateReadingBook(userId, bookId, patch);
}
export async function addReadingQuote(userId, bookId, { quote, author = '', page = null }) {
  const book = await getReadingBookById(userId, bookId);
  if (!book) throw new Error('Livre introuvable.');
  if (!quote || !quote.trim()) throw new Error('La citation ne peut pas être vide.');
  const quoteEntry = {
    id: `qt_${Date.now().toString(36)}`,
    quote: quote.trim().slice(0, 500),
    author: (author || book.author).trim(),
    page: page ? parseInt(page, 10) : null,
    addedAt: new Date(),
  };
  const quotes = Array.isArray(book.quotes) ? [...book.quotes, quoteEntry] : [quoteEntry];
  return await updateReadingBook(userId, bookId, { quotes });
}
export async function toggleReadingBookFavorite(userId, bookId) {
  const book = await getReadingBookById(userId, bookId);
  if (!book) throw new Error('Livre introuvable.');
  return await updateReadingBook(userId, bookId, { isFavorite: !book.isFavorite });
}
export async function toggleReadingBookArchive(userId, bookId) {
  const book = await getReadingBookById(userId, bookId);
  if (!book) throw new Error('Livre introuvable.');
  return await updateReadingBook(userId, bookId, { isArchived: !book.isArchived });
}
export async function getReadingStats(userId) {
  const allBooks = await getUserReadingBooks(userId, { isArchived: null, limit: 500 });
  const activeBooks = allBooks.filter(b => !b.isArchived);
  const total = activeBooks.length;
  const finished = activeBooks.filter(b => b.status === 'Terminé').length;
  const inProgress = activeBooks.filter(b => b.status === 'En cours').length;
  const planToRead = activeBooks.filter(b => b.status === 'À lire').length;
  const onHold = activeBooks.filter(b => b.status === 'En pause').length;
  const dropped = activeBooks.filter(b => b.status === 'Abandonné').length;
  const totalVolumesRead = activeBooks.reduce((sum, b) => sum + (b.currentVolume || 0), 0);
  const totalPagesRead = activeBooks.reduce((sum, b) => sum + (b.currentPage || 0), 0);
  const ratedBooks = activeBooks.filter(b => b.rating > 0);
  const avgRating = ratedBooks.length > 0
    ? (ratedBooks.reduce((s, b) => s + b.rating, 0) / ratedBooks.length).toFixed(1)
    : 'N/A';
  const categoryBreakdown = {};
  for (const b of activeBooks) {
    categoryBreakdown[b.category] = (categoryBreakdown[b.category] || 0) + 1;
  }
  return {
    total,
    finished,
    inProgress,
    planToRead,
    onHold,
    dropped,
    totalVolumesRead,
    totalPagesRead,
    avgRating,
    categoryBreakdown,
  };
}
export async function createBookClub(guildId, ownerId, ownerName, { name, description = '', currentBook = '' }) {
  if (!name || !name.trim()) throw new Error('Le nom du club de lecture est requis.');
  const doc = {
    _id: `club_${Date.now().toString(36)}`,
    guildId,
    ownerId,
    ownerName,
    name: name.trim(),
    description: description.trim(),
    currentBook: currentBook.trim() || 'À définir ensemble',
    members: [{ userId: ownerId, username: ownerName, role: 'Fondateur', joinedAt: new Date() }],
    suggestions: [],
    reviews: [],
    history: [],
    meetingDate: null,
    createdAt: new Date(),
  };
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('reading_clubs').insertOne(doc);
  } else {
    store.store.bookClubs.set(doc._id, doc);
  }
  return doc;
}
export async function getBookClubById(clubId) {
  const store = getStore();
  if (store.type === 'mongo') {
    return await store.db.collection('reading_clubs').findOne({ _id: clubId });
  } else {
    return store.store.bookClubs.get(clubId) || null;
  }
}
export async function getUserBookClubs(guildId, userId) {
  const store = getStore();
  if (store.type === 'mongo') {
    return await store.db.collection('reading_clubs').find({
      guildId,
      'members.userId': userId,
    }).toArray();
  } else {
    return Array.from(store.store.bookClubs.values())
      .filter(c => c.guildId === guildId && c.members.some(m => m.userId === userId));
  }
}
export async function joinBookClub(clubId, userId, username) {
  const club = await getBookClubById(clubId);
  if (!club) throw new Error('Club introuvable.');
  if (club.members.some(m => m.userId === userId)) throw new Error('Vous êtes déjà membre de ce club.');
  club.members.push({ userId, username, role: 'Lecteur', joinedAt: new Date() });
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('reading_clubs').updateOne({ _id: clubId }, { $set: { members: club.members } });
  } else {
    store.store.bookClubs.set(clubId, club);
  }
  return club;
}
export async function leaveBookClub(clubId, userId) {
  const club = await getBookClubById(clubId);
  if (!club) throw new Error('Club introuvable.');
  if (club.ownerId === userId && club.members.length > 1) {
    throw new Error('En tant que fondateur, cédez le club ou supprimez-le avant de quitter.');
  }
  club.members = club.members.filter(m => m.userId !== userId);
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('reading_clubs').updateOne({ _id: clubId }, { $set: { members: club.members } });
  } else {
    store.store.bookClubs.set(clubId, club);
  }
  return club;
}
export async function suggestBookToClub(clubId, userId, username, bookTitle) {
  const club = await getBookClubById(clubId);
  if (!club) throw new Error('Club introuvable.');
  if (!club.members.some(m => m.userId === userId)) throw new Error('Vous devez rejoindre le club pour suggérer un livre.');
  const suggestion = {
    id: `sug_${Date.now().toString(36)}`,
    title: bookTitle.trim(),
    userId,
    username,
    votes: [userId],
    suggestedAt: new Date(),
  };
  club.suggestions = Array.isArray(club.suggestions) ? [...club.suggestions, suggestion] : [suggestion];
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('reading_clubs').updateOne({ _id: clubId }, { $set: { suggestions: club.suggestions } });
  } else {
    store.store.bookClubs.set(clubId, club);
  }
  return suggestion;
}
export async function voteClubBook(clubId, userId, suggestionId) {
  const club = await getBookClubById(clubId);
  if (!club) throw new Error('Club introuvable.');
  const item = (club.suggestions || []).find(s => s.id === suggestionId);
  if (!item) throw new Error('Suggestion introuvable.');
  const hasVoted = item.votes.includes(userId);
  if (hasVoted) {
    item.votes = item.votes.filter(id => id !== userId);
  } else {
    item.votes.push(userId);
  }
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('reading_clubs').updateOne({ _id: clubId }, { $set: { suggestions: club.suggestions } });
  } else {
    store.store.bookClubs.set(clubId, club);
  }
  return { voted: !hasVoted, votesCount: item.votes.length };
}
export async function addRecipe({
  title,
  description = '',
  category = 'Anime Food',
  ingredients,
  steps,
  prepTime = '20 min',
  cookTime = '0 min',
  restTime = '0 min',
  servings = 4,
  difficulty = 'Facile',
  origin = 'Saez Gourmand',
  imageUrl = null,
  notes = '',
  tags = [],
  allergens = [],
  authorId,
  authorName,
  isPublic = true,
}) {
  if (!title || !title.trim()) throw new Error('Le titre de la recette est requis.');
  if (!ingredients) throw new Error('La liste des ingrédients est requise.');
  if (!steps) throw new Error('Les étapes de préparation sont requises.');
  const ingList = Array.isArray(ingredients)
    ? ingredients.map(i => typeof i === 'string' ? i.trim() : i)
    : String(ingredients).split(',').map(s => s.trim()).filter(Boolean);
  const stepList = Array.isArray(steps)
    ? steps
    : String(steps).split('\n').map(s => s.trim()).filter(Boolean);
  const tagList = Array.isArray(tags)
    ? tags
    : String(tags || '').split(',').map(s => s.trim()).filter(Boolean);
  const allerList = Array.isArray(allergens)
    ? allergens
    : String(allergens || '').split(',').map(s => s.trim()).filter(Boolean);
  const doc = {
    _id: `rec_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim(),
    description: description.trim(),
    category: category || 'Anime Food', 
    ingredients: ingList,
    steps: stepList,
    prepTime: String(prepTime).trim() || '20 min',
    cookTime: String(cookTime).trim() || '0 min',
    restTime: String(restTime).trim() || '0 min',
    servings: Math.max(1, parseInt(servings, 10) || 4),
    difficulty: difficulty || 'Facile', 
    origin: origin.trim() || 'Inspiré d\'animé',
    imageUrl: imageUrl && imageUrl.startsWith('http') ? imageUrl.trim() : null,
    notes: notes.trim(),
    tags: tagList,
    allergens: allerList,
    authorId,
    authorName,
    likes: 0,
    likedBy: [],
    isPublic: Boolean(isPublic),
    isArchived: false,
    testedCount: 0,
    reviews: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('community_recipes').insertOne(doc);
  } else {
    store.store.recipes.set(doc._id, doc);
  }
  return doc;
}
export async function getRecipeById(recipeId) {
  const store = getStore();
  if (store.type === 'mongo') {
    return await store.db.collection('community_recipes').findOne({ _id: recipeId });
  } else {
    return store.store.recipes.get(recipeId) || null;
  }
}
export async function updateRecipe(recipeId, userId, updates) {
  const recipe = await getRecipeById(recipeId);
  if (!recipe) throw new Error('Recette introuvable.');
  if (recipe.authorId !== userId) throw new Error('Vous n\'êtes pas l\'auteur de cette recette.');
  const patch = { updatedAt: new Date() };
  const allowed = [
    'title', 'description', 'category', 'ingredients', 'steps',
    'prepTime', 'cookTime', 'restTime', 'servings', 'difficulty',
    'origin', 'imageUrl', 'notes', 'tags', 'allergens', 'isPublic', 'isArchived'
  ];
  for (const k of allowed) {
    if (updates[k] !== undefined) {
      if (k === 'servings') patch[k] = Math.max(1, parseInt(updates[k], 10) || 1);
      else if (k === 'ingredients' && !Array.isArray(updates[k])) {
        patch[k] = String(updates[k]).split(',').map(s => s.trim()).filter(Boolean);
      } else if (k === 'steps' && !Array.isArray(updates[k])) {
        patch[k] = String(updates[k]).split('\n').map(s => s.trim()).filter(Boolean);
      } else {
        patch[k] = updates[k];
      }
    }
  }
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('community_recipes').updateOne({ _id: recipeId }, { $set: patch });
    return await store.db.collection('community_recipes').findOne({ _id: recipeId });
  } else {
    const updated = { ...recipe, ...patch };
    store.store.recipes.set(recipeId, updated);
    return updated;
  }
}
export async function deleteRecipe(recipeId, userId) {
  const recipe = await getRecipeById(recipeId);
  if (!recipe) throw new Error('Recette introuvable.');
  if (recipe.authorId !== userId) throw new Error('Vous n\'êtes pas autorisé à supprimer cette recette.');
  const store = getStore();
  if (store.type === 'mongo') {
    const res = await store.db.collection('community_recipes').deleteOne({ _id: recipeId, authorId: userId });
    return res.deletedCount > 0;
  } else {
    return store.store.recipes.delete(recipeId);
  }
}
export async function searchRecipes(query = '', {
  category = null,
  difficulty = null,
  authorId = null,
  limit = 20,
} = {}) {
  const store = getStore();
  if (store.type === 'mongo') {
    const q = { isArchived: false };
    if (authorId) q.authorId = authorId;
    if (category) q.category = category;
    if (difficulty) q.difficulty = difficulty;
    if (query && query.trim()) {
      const regex = { $regex: query.trim(), $options: 'i' };
      q.$or = [{ title: regex }, { category: regex }, { ingredients: regex }, { tags: regex }];
    }
    return await store.db.collection('community_recipes').find(q).sort({ createdAt: -1 }).limit(limit).toArray();
  } else {
    let list = Array.from(store.store.recipes.values()).filter(r => !r.isArchived);
    if (authorId) list = list.filter(r => r.authorId === authorId);
    if (category) list = list.filter(r => r.category === category);
    if (difficulty) list = list.filter(r => r.difficulty === difficulty);
    if (query && query.trim()) {
      const s = query.trim().toLowerCase();
      list = list.filter(r =>
        r.title.toLowerCase().includes(s) ||
        r.category.toLowerCase().includes(s) ||
        (Array.isArray(r.ingredients) && r.ingredients.some(i => String(i).toLowerCase().includes(s))) ||
        (Array.isArray(r.tags) && r.tags.some(t => t.toLowerCase().includes(s)))
      );
    }
    return list.slice(0, limit);
  }
}
export async function getRandomRecipe(category = null) {
  const recipes = await searchRecipes('', { category, limit: 100 });
  if (recipes.length === 0) return null;
  const idx = Math.floor(Math.random() * recipes.length);
  return recipes[idx];
}
export function calculateRecipePortions(recipe, targetServings) {
  if (!recipe || !recipe.ingredients) throw new Error('Recette invalide.');
  const baseServings = Math.max(1, recipe.servings || 4);
  const target = Math.max(1, parseInt(targetServings, 10) || baseServings);
  const ratio = target / baseServings;
  const scaledIngredients = recipe.ingredients.map(ing => {
    const line = String(ing).trim();
    const match = line.match(/^(\d+(?:[.,]\d+)?|\d+\/\d+)\s*([a-zA-Zà-ÿÀ-Ý.]+)?\s*(.*)$/);
    if (!match) return line;
    let num = match[1];
    if (num.includes('/')) {
      const [n, d] = num.split('/');
      num = parseFloat(n) / parseFloat(d);
    } else {
      num = parseFloat(num.replace(',', '.'));
    }
    if (isNaN(num)) return line;
    const scaledNum = Math.round((num * ratio) * 10) / 10;
    const unit = match[2] ? ` ${match[2]}` : '';
    const rest = match[3] ? ` ${match[3]}` : '';
    return `${scaledNum}${unit}${rest}`.trim();
  });
  return {
    baseServings,
    targetServings: target,
    ratio,
    scaledIngredients,
  };
}
export function generateGroceryList(recipesList) {
  if (!Array.isArray(recipesList) || recipesList.length === 0) return [];
  const lines = [];
  for (const rec of recipesList) {
    if (Array.isArray(rec.ingredients)) {
      for (const ing of rec.ingredients) {
        lines.push(`[ ] ${String(ing).trim()} *(de: ${rec.title})*`);
      }
    }
  }
  return lines;
}
export function convertCookingUnits(value, fromUnit, toUnit) {
  const v = parseFloat(value);
  if (isNaN(v)) throw new Error('Valeur numérique invalide.');
  const from = fromUnit.toLowerCase().trim();
  const to = toUnit.toLowerCase().trim();
  if (['g', 'kg'].includes(from) && ['g', 'kg'].includes(to)) {
    if (from === 'g' && to === 'kg') return `${v / 1000} kg`;
    if (from === 'kg' && to === 'g') return `${v * 1000} g`;
    return `${v} ${to}`;
  }
  if (['ml', 'cl', 'l'].includes(from) && ['ml', 'cl', 'l'].includes(to)) {
    const inMl = from === 'l' ? v * 1000 : from === 'cl' ? v * 10 : v;
    if (to === 'l') return `${inMl / 1000} l`;
    if (to === 'cl') return `${inMl / 10} cl`;
    return `${inMl} ml`;
  }
  if (from === 'cas' && to === 'ml') return `${v * 15} ml (environ)`;
  if (from === 'cac' && to === 'ml') return `${v * 5} ml (environ)`;
  if (from === 'ml' && to === 'cas') return `${(v / 15).toFixed(1)} c.à.s (environ)`;
  if (from === 'ml' && to === 'cac') return `${(v / 5).toFixed(1)} c.à.c (environ)`;
  if (from === 'c' && to === 'f') return `${Math.round((v * 9 / 5) + 32)} °F`;
  if (from === 'f' && to === 'c') return `${Math.round((v - 32) * 5 / 9)} °C`;
  throw new Error(`Conversion de ${fromUnit} vers ${toUnit} non supportée sans hypothèse de densité.`);
}
export async function duplicateRecipe(recipeId, userId, username) {
  const original = await getRecipeById(recipeId);
  if (!original) throw new Error('Recette d\'origine introuvable.');
  return await addRecipe({
    title: `${original.title} (Copie de ${username})`,
    description: original.description,
    category: original.category,
    ingredients: original.ingredients,
    steps: original.steps,
    prepTime: original.prepTime,
    cookTime: original.cookTime,
    restTime: original.restTime,
    servings: original.servings,
    difficulty: original.difficulty,
    origin: original.origin,
    imageUrl: original.imageUrl,
    notes: `Dupliqué depuis la recette de ${original.authorName}.`,
    tags: original.tags,
    allergens: original.allergens,
    authorId: userId,
    authorName: username,
    isPublic: false,
  });
}
export async function addStorySentence(guildId, userId, username, text) {
  if (!text || !text.trim()) throw new Error('Le texte ne peut pas être vide.');
  const doc = {
    _id: `st_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    guildId,
    userId,
    username,
    text: text.trim().slice(0, 1000),
    createdAt: new Date(),
  };
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('server_stories').insertOne(doc);
  } else {
    store.store.serverStories.push(doc);
  }
  return doc;
}
export async function getStorySentences(guildId, limit = 25) {
  const store = getStore();
  if (store.type === 'mongo') {
    return await store.db.collection('server_stories').find({ guildId }).sort({ createdAt: 1 }).limit(limit).toArray();
  } else {
    return store.store.serverStories.filter(s => s.guildId === guildId).slice(-limit);
  }
}
export async function createStory(userId, authorName, guildId, {
  title,
  summary = '',
  genre = 'Fantasy',
  tone = 'Aventureux',
  targetAudience = 'Tous publics',
  coverUrl = null,
  visibility = 'prive',
  wordGoal = 10000,
  tags = [],
}) {
  if (!title || !title.trim()) throw new Error('Le titre de l\'histoire est requis.');
  const doc = {
    _id: `story_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    authorName,
    guildId,
    title: title.trim(),
    summary: summary.trim(),
    genre, 
    tone,
    targetAudience,
    coverUrl: coverUrl && coverUrl.startsWith('http') ? coverUrl : null,
    visibility,
    status: 'Brouillon', 
    wordGoal: parseInt(wordGoal, 10) || 10000,
    totalWords: 0,
    chapters: [],
    characters: [],
    scenes: [],
    authorNotes: '',
    collaborators: [{ userId, username: authorName, role: 'Auteur principal' }],
    tags: Array.isArray(tags) ? tags : String(tags || '').split(',').map(s => s.trim()).filter(Boolean),
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('user_stories').insertOne(doc);
  } else {
    store.store.userStories.set(doc._id, doc);
  }
  return doc;
}
export async function getStoryById(storyId) {
  const store = getStore();
  if (store.type === 'mongo') {
    return await store.db.collection('user_stories').findOne({ _id: storyId });
  } else {
    return store.store.userStories.get(storyId) || null;
  }
}
export async function updateStory(storyId, userId, updates) {
  const story = await getStoryById(storyId);
  if (!story) throw new Error('Histoire introuvable.');
  const isOwner = story.userId === userId;
  const isCollab = (story.collaborators || []).some(c => c.userId === userId);
  if (!isOwner && !isCollab) throw new Error('Vous n\'avez pas les droits de modification sur cette histoire.');
  const patch = { updatedAt: new Date() };
  const allowed = [
    'title', 'summary', 'genre', 'tone', 'targetAudience', 'coverUrl',
    'visibility', 'status', 'wordGoal', 'authorNotes', 'tags',
    'chapters', 'characters', 'scenes', 'totalWords', 'isArchived'
  ];
  for (const k of allowed) {
    if (updates[k] !== undefined) {
      if (k === 'tags' && !Array.isArray(updates[k])) {
        patch[k] = String(updates[k]).split(',').map(s => s.trim()).filter(Boolean);
      } else {
        patch[k] = updates[k];
      }
    }
  }
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('user_stories').updateOne({ _id: storyId }, { $set: patch });
    return await store.db.collection('user_stories').findOne({ _id: storyId });
  } else {
    const updated = { ...story, ...patch };
    store.store.userStories.set(storyId, updated);
    return updated;
  }
}
export async function deleteStory(storyId, userId) {
  const story = await getStoryById(storyId);
  if (!story) throw new Error('Histoire introuvable.');
  if (story.userId !== userId) throw new Error('Seul l\'auteur principal peut supprimer cette histoire.');
  const store = getStore();
  if (store.type === 'mongo') {
    const res = await store.db.collection('user_stories').deleteOne({ _id: storyId, userId });
    return res.deletedCount > 0;
  } else {
    return store.store.userStories.delete(storyId);
  }
}
export async function getUserStories(userId, { status = null, genre = null, limit = 20 } = {}) {
  const store = getStore();
  if (store.type === 'mongo') {
    const q = {
      isArchived: false,
      $or: [{ userId }, { 'collaborators.userId': userId }, { visibility: 'public' }],
    };
    if (status) q.status = status;
    if (genre) q.genre = genre;
    return await store.db.collection('user_stories').find(q).sort({ updatedAt: -1 }).limit(limit).toArray();
  } else {
    let list = Array.from(store.store.userStories.values()).filter(s =>
      !s.isArchived &&
      (s.userId === userId || s.collaborators?.some(c => c.userId === userId) || s.visibility === 'public')
    );
    if (status) list = list.filter(s => s.status === status);
    if (genre) list = list.filter(s => s.genre === genre);
    return list.slice(0, limit);
  }
}
export async function addOrUpdateChapter(storyId, userId, { chapterNumber, title, content }) {
  const story = await getStoryById(storyId);
  if (!story) throw new Error('Histoire introuvable.');
  const num = parseInt(chapterNumber, 10) || ((story.chapters || []).length + 1);
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const chars = content.length;
  const chapters = [...(story.chapters || [])];
  const idx = chapters.findIndex(c => c.number === num);
  const chapterData = {
    number: num,
    title: (title || `Chapitre ${num}`).trim(),
    content: content.trim(),
    wordCount: words,
    charCount: chars,
    updatedAt: new Date(),
  };
  if (idx >= 0) {
    chapters[idx] = chapterData;
  } else {
    chapters.push(chapterData);
  }
  chapters.sort((a, b) => a.number - b.number);
  const totalWords = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);
  return await updateStory(storyId, userId, { chapters, totalWords });
}
export async function addStoryCharacter(storyId, userId, { name, role = 'Protagoniste', age = 'N/A', appearance = '', history = '', goals = '', secrets = '', isPublic = true }) {
  const story = await getStoryById(storyId);
  if (!story) throw new Error('Histoire introuvable.');
  const character = {
    id: `char_${Date.now().toString(36)}`,
    name: name.trim(),
    role: role.trim(),
    age: String(age).trim(),
    appearance: appearance.trim(),
    history: history.trim(),
    goals: goals.trim(),
    secrets: secrets.trim(), 
    isPublic: Boolean(isPublic),
  };
  const characters = [...(story.characters || []), character];
  return await updateStory(storyId, userId, { characters });
}
export function analyzeWritingText(text = '') {
  const trimmed = text.trim();
  if (!trimmed) {
    return { words: 0, characters: 0, charactersNoSpaces: 0, paragraphs: 0, estimatedReadingTime: '0 min' };
  }
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const characters = trimmed.length;
  const charactersNoSpaces = trimmed.replace(/\s+/g, '').length;
  const paragraphs = trimmed.split(/\n+/).filter(Boolean).length;
  const readingTimeMins = Math.max(1, Math.ceil(words / 200));
  return {
    words,
    characters,
    charactersNoSpaces,
    paragraphs,
    estimatedReadingTime: `${readingTimeMins} min`,
  };
}
export const LETTER_TEMPLATES = {
  remerciements: {
    name: 'Remerciements Chaleureux',
    tone: 'Chaleureuse',
    template: 'Cher(e) [Destinataire],\n\nJe tiens à t\'exprimer toute ma gratitude pour [Motif du remerciement]. Ton soutien et ta bienveillance ont été précieux.\n\nMerci encore pour tout ce que tu fais.\n\nAvec toute mon amitié,\n[Signature]',
  },
  felicitations: {
    name: 'Félicitations & Succès',
    tone: 'Chaleureuse',
    template: 'Bravo [Destinataire] !\n\nJ\'ai appris la formidable nouvelle concernant [Événement / Réussite]. C\'est amplement mérité au vu de tes efforts et de ton dévouement !\n\nJe te souhaite tout le succès possible pour cette nouvelle étape.\n\nFélicitations,\n[Signature]',
  },
  anniversaire: {
    name: 'Joyeux Anniversaire',
    tone: 'Amicale',
    template: 'Joyeux anniversaire [Destinataire] ! 🎉\n\nQue cette nouvelle année t\'apporte joie, santé, projets passionnants et de magnifiques moments entouré(e) de ceux qui comptent pour toi.\n\nPasse une excellente journée de fête !\n\nBien amicalement,\n[Signature]',
  },
  excuses: {
    name: 'Excuses Sincères',
    tone: 'Formelle',
    template: 'Cher(e) [Destinataire],\n\nJe t\'écris ces quelques mots pour te présenter mes excuses les plus sincères au sujet de [Situation]. Mon intention n\'a jamais été de te blesser ou de causer ce désagrément.\n\nJ\'espère que nous pourrons en discuter sereinement et repartir sur de bonnes bases.\n\nSincèrement,\n[Signature]',
  },
  motivation: {
    name: 'Courage & Motivation',
    tone: 'Chaleureuse',
    template: 'Garde confiance, [Destinataire] !\n\nJe sais que la période actuelle est exigeante avec [Défi / Obstacle], mais souviens-toi de tes forces et du chemin déjà parcouru. Tu as toutes les compétences pour surmonter cette épreuve.\n\nOn est avec toi à 100% !\n\nAvec toute mon énergie,\n[Signature]',
  },
  futur: {
    name: 'Lettre à soi-même dans le futur',
    tone: 'Poétique',
    template: 'Mon cher moi du futur,\n\nEn ce [Date actuelle], je t\'écris alors que je vis [Situation actuelle]. Mes espoirs en ce moment sont [Objectifs / Rêves].\n\nAs-tu accompli ce qui te tenait tant à cœur ? Prends soin de toi et n\'oublie jamais d\'où tu viens.\n\nTon moi passé,\n[Signature]',
  },
  fictif: {
    name: 'Correspondance dans un univers imaginaire',
    tone: 'Fictive',
    template: 'Par-delà les monts et les étoiles, à l\'attention de [Destinataire],\n\nLes nouvelles de la cité sont [Nouvelles du royaume / lore]. Le vent murmure qu\'une grande aventure s\'annonce.\n\nQue les astres guident tes pas jusqu\'à notre prochaine rencontre.\n\nSigné dans l\'ombre,\n[Nom de plume / Rang]',
  },
};
export async function createLetter(userId, authorName, {
  title,
  recipient = '',
  tone = 'Amicale',
  template = 'Libre',
  content,
  isDraft = false,
  isPrivate = true,
}) {
  if (!title || !title.trim()) throw new Error('Le titre de la lettre est requis.');
  if (!content || !content.trim()) throw new Error('Le contenu de la lettre ne peut pas être vide.');
  const text = content.trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const doc = {
    _id: `let_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    authorName,
    title: title.trim(),
    recipient: recipient.trim() || 'À qui de droit',
    tone, 
    template,
    content: text,
    wordCount,
    isDraft: Boolean(isDraft),
    isPrivate: Boolean(isPrivate), 
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('user_letters').insertOne(doc);
  } else {
    store.store.letters.set(doc._id, doc);
  }
  return doc;
}
export async function getLetterById(letterId, userId) {
  const store = getStore();
  let letter = null;
  if (store.type === 'mongo') {
    letter = await store.db.collection('user_letters').findOne({ _id: letterId });
  } else {
    letter = store.store.letters.get(letterId) || null;
  }
  if (!letter) return null;
  if (letter.isPrivate && letter.userId !== userId) {
    throw new Error('Cette lettre est privée et protégée par son auteur.');
  }
  return letter;
}
export async function getUserLetters(userId, { isDraft = null, isArchived = false, limit = 25 } = {}) {
  const store = getStore();
  if (store.type === 'mongo') {
    const q = { userId };
    if (isDraft !== null) q.isDraft = Boolean(isDraft);
    if (isArchived !== null) q.isArchived = Boolean(isArchived);
    return await store.db.collection('user_letters').find(q).sort({ updatedAt: -1 }).limit(limit).toArray();
  } else {
    let list = Array.from(store.store.letters.values()).filter(l => l.userId === userId);
    if (isDraft !== null) list = list.filter(l => Boolean(l.isDraft) === Boolean(isDraft));
    if (isArchived !== null) list = list.filter(l => Boolean(l.isArchived) === Boolean(isArchived));
    return list.slice(0, limit);
  }
}
export async function deleteLetter(letterId, userId) {
  const letter = await getLetterById(letterId, userId);
  if (!letter || letter.userId !== userId) throw new Error('Lettre introuvable ou action non autorisée.');
  const store = getStore();
  if (store.type === 'mongo') {
    const res = await store.db.collection('user_letters').deleteOne({ _id: letterId, userId });
    return res.deletedCount > 0;
  } else {
    return store.store.letters.delete(letterId);
  }
}
const FRENCH_RHYME_DICTIONARY = {
  'eur': ['fleur', 'cœur', 'bonheur', 'lueur', 'ardeur', 'douceur', 'peur', 'chaleur', 'couleur', 'ondeur', 'splendeur'],
  'ment': ['vent', 'temps', 'doucement', 'firmament', 'moment', 'enchantement', 'cheminement', 'tourment', 'souvent'],
  'ance': ['silence', 'espérance', 'danse', 'confidence', 'évidence', 'errance', 'enfance', 'souffrance'],
  'ette': ['comète', 'fête', 'silhouette', 'planète', 'quête', 'secrète', 'tempête', 'poète'],
  'oir': ['espoir', 'soir', 'miroir', 'manoir', 'pouvoir', 'vouloir', 'mémoire', 'gloire', 'histoire'],
  'ée': ['rosée', 'pensée', 'envolée', 'marée', 'destinée', 'étoilée', 'journée', 'fée'],
  'on': ['horizon', 'passion', 'frisson', 'chanson', 'rayon', 'saison', 'maison', 'prison'],
  'ie': ['vie', 'harmonie', 'mélancolie', 'poésie', 'infinie', 'folie', 'patrie', 'magie'],
  'er': ['mer', 'clair', 'éclair', 'hiver', 'univers', 'fer', 'mystère', 'lumière', 'terre'],
};
export function findFrenchRhymes(word = '') {
  const clean = word.toLowerCase().trim().replace(/[^a-zà-ÿ]/g, '');
  if (!clean || clean.length < 2) return [];
  for (const [suffix, rhymes] of Object.entries(FRENCH_RHYME_DICTIONARY)) {
    if (clean.endsWith(suffix) || clean.endsWith(suffix.replace('e', ''))) {
      return rhymes.filter(r => r !== clean);
    }
  }
  const end3 = clean.slice(-3);
  const end2 = clean.slice(-2);
  const results = [];
  for (const rhymeList of Object.values(FRENCH_RHYME_DICTIONARY)) {
    for (const w of rhymeList) {
      if ((w.endsWith(end3) || w.endsWith(end2)) && w !== clean) {
        results.push(w);
      }
    }
  }
  return [...new Set(results)].slice(0, 8);
}
export function estimateSyllables(verse = '') {
  const line = verse.toLowerCase().trim();
  if (!line) return 0;
  const normalized = line
    .replace(/[éèêë]/g, 'e')
    .replace(/[àâä]/g, 'a')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/[ùûü]/g, 'u');
  const vowelGroups = normalized.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 0;
  if (normalized.endsWith('e') && count > 1 && !normalized.endsWith('ee')) {
    count -= 1;
  }
  return Math.max(1, count);
}
export function checkHaikuStructure(text = '') {
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
  if (lines.length !== 3) {
    return { isHaiku: false, versesCount: lines.length, details: 'Un haïku classique doit comporter exactement 3 vers.' };
  }
  const s1 = estimateSyllables(lines[0]);
  const s2 = estimateSyllables(lines[1]);
  const s3 = estimateSyllables(lines[2]);
  const matches = (s1 >= 4 && s1 <= 6) && (s2 >= 6 && s2 <= 8) && (s3 >= 4 && s3 <= 6);
  return {
    isHaiku: matches,
    structure: `${s1} - ${s2} - ${s3} syllabes`,
    target: '5 - 7 - 5 syllabes',
    verses: lines,
  };
}
export async function createPoem(userId, authorName, guildId, {
  title,
  form = 'Poésie libre', 
  content,
  theme = 'Général',
  tags = [],
  recueil = 'Personnel',
  isPublic = true,
}) {
  if (!title || !title.trim()) throw new Error('Le titre du poème est requis.');
  if (!content || !content.trim()) throw new Error('Le texte du poème ne peut pas être vide.');
  const verses = content.trim().split(/\n+/).map(v => v.trim()).filter(Boolean);
  const verseCount = verses.length;
  const syllableEstimate = verses.reduce((sum, v) => sum + estimateSyllables(v), 0);
  const doc = {
    _id: `poem_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    authorName,
    guildId,
    title: title.trim(),
    form,
    content: content.trim(),
    verses,
    verseCount,
    syllableEstimate,
    theme: theme.trim(),
    tags: Array.isArray(tags) ? tags : String(tags || '').split(',').map(s => s.trim()).filter(Boolean),
    recueil: recueil.trim(),
    isPublic: Boolean(isPublic),
    isArchived: false,
    likes: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('user_poems').insertOne(doc);
  } else {
    store.store.poems.set(doc._id, doc);
  }
  return doc;
}
export async function getPoemById(poemId) {
  const store = getStore();
  if (store.type === 'mongo') {
    return await store.db.collection('user_poems').findOne({ _id: poemId });
  } else {
    return store.store.poems.get(poemId) || null;
  }
}
export async function getUserPoems(userId, { form = null, theme = null, limit = 20 } = {}) {
  const store = getStore();
  if (store.type === 'mongo') {
    const q = { userId, isArchived: false };
    if (form) q.form = form;
    if (theme) q.theme = theme;
    return await store.db.collection('user_poems').find(q).sort({ updatedAt: -1 }).limit(limit).toArray();
  } else {
    let list = Array.from(store.store.poems.values()).filter(p => p.userId === userId && !p.isArchived);
    if (form) list = list.filter(p => p.form === form);
    if (theme) list = list.filter(p => p.theme === theme);
    return list.slice(0, limit);
  }
}
export async function deletePoem(poemId, userId) {
  const poem = await getPoemById(poemId);
  if (!poem || poem.userId !== userId) throw new Error('Poème introuvable ou non autorisé.');
  const store = getStore();
  if (store.type === 'mongo') {
    const res = await store.db.collection('user_poems').deleteOne({ _id: poemId, userId });
    return res.deletedCount > 0;
  } else {
    return store.store.poems.delete(poemId);
  }
}
export async function addWorldBuildingElement({ guildId, title, category, description, authorName }) {
  if (!title || !title.trim()) throw new Error('Le titre de l\'élément est requis.');
  const doc = {
    _id: `wb_${Date.now().toString(36)}`,
    guildId,
    title: title.trim(),
    category: category || 'Lore', 
    description: description.trim(),
    authorName,
    createdAt: new Date(),
  };
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('server_worldbuilding').insertOne(doc);
  } else {
    store.store.serverWorldbuilding.set(doc._id, doc);
  }
  return doc;
}
export async function getWorldBuildingElements(guildId, category = null) {
  const store = getStore();
  if (store.type === 'mongo') {
    const query = { guildId };
    if (category) query.category = category;
    return await store.db.collection('server_worldbuilding').find(query).sort({ createdAt: -1 }).limit(25).toArray();
  } else {
    let list = Array.from(store.store.serverWorldbuilding.values()).filter(w => w.guildId === guildId);
    if (category) list = list.filter(w => w.category === category);
    return list.slice(0, 25);
  }
}
export async function createUniverse(userId, authorName, guildId, {
  name,
  genre = 'Fantasy',
  description = '',
  mood = 'Épique & Mystérieux',
  generalRules = '',
  visibility = 'public',
  tags = [],
}) {
  if (!name || !name.trim()) throw new Error('Le nom de l\'univers est requis.');
  const doc = {
    _id: `uni_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    authorName,
    guildId,
    name: name.trim(),
    genre,
    description: description.trim(),
    mood: mood.trim(),
    generalRules: generalRules.trim(),
    visibility, 
    tags: Array.isArray(tags) ? tags : String(tags || '').split(',').map(s => s.trim()).filter(Boolean),
    elementsCount: 0,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('user_universes').insertOne(doc);
  } else {
    store.store.userUniverses.set(doc._id, doc);
  }
  return doc;
}
export async function getUniverseById(universeId) {
  const store = getStore();
  if (store.type === 'mongo') {
    return await store.db.collection('user_universes').findOne({ _id: universeId });
  } else {
    return store.store.userUniverses.get(universeId) || null;
  }
}
export async function getUserUniverses(userId, guildId) {
  const store = getStore();
  if (store.type === 'mongo') {
    return await store.db.collection('user_universes').find({
      $or: [{ userId }, { guildId, visibility: 'public' }],
      isArchived: false,
    }).sort({ updatedAt: -1 }).toArray();
  } else {
    return Array.from(store.store.userUniverses.values()).filter(u =>
      !u.isArchived && (u.userId === userId || (u.guildId === guildId && u.visibility === 'public'))
    );
  }
}
export async function addUniverseElement(universeId, userId, authorName, guildId, {
  title,
  category = 'Lore',
  description,
  status = 'Canon',
  fictionalDate = null,
  era = 'Ère Principale',
  relationships = [],
  secrets = '',
  tags = [],
}) {
  const universe = await getUniverseById(universeId);
  if (!universe) throw new Error('Univers introuvable.');
  const doc = {
    _id: `uel_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    universeId,
    userId,
    authorName,
    guildId,
    title: title.trim(),
    category, 
    description: description.trim(),
    status,
    fictionalDate: fictionalDate ? String(fictionalDate).trim() : null,
    era: era.trim(),
    relationships: Array.isArray(relationships) ? relationships : [],
    secrets: secrets.trim(),
    tags: Array.isArray(tags) ? tags : String(tags || '').split(',').map(s => s.trim()).filter(Boolean),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('universe_elements').insertOne(doc);
    await store.db.collection('user_universes').updateOne({ _id: universeId }, { $inc: { elementsCount: 1 } });
  } else {
    store.store.universeElements.set(doc._id, doc);
    universe.elementsCount = (universe.elementsCount || 0) + 1;
  }
  return doc;
}
export async function getUniverseElements(universeId, { category = null, limit = 50 } = {}) {
  const store = getStore();
  if (store.type === 'mongo') {
    const q = { universeId };
    if (category) q.category = category;
    return await store.db.collection('universe_elements').find(q).sort({ createdAt: 1 }).limit(limit).toArray();
  } else {
    let list = Array.from(store.store.universeElements.values()).filter(e => e.universeId === universeId);
    if (category) list = list.filter(e => e.category === category);
    return list.slice(0, limit);
  }
}
export async function checkUniverseConsistency(universeId) {
  const elements = await getUniverseElements(universeId);
  const categories = new Set(elements.map(e => e.category));
  const checklist = {
    hasGeography: categories.has('Géographie'),
    hasFactions: categories.has('Faction'),
    hasMagicOrTech: categories.has('Magie') || categories.has('Technologie'),
    hasHistoryOrLore: categories.has('Lore') || categories.has('Chronologie'),
    hasCharacters: categories.has('Personnage'),
  };
  const suggestions = [];
  if (!checklist.hasGeography) suggestions.push('Ajoutez des régions, villes ou royaumes (Géographie).');
  if (!checklist.hasFactions) suggestions.push('Créez des guildes, clans ou factions politiques.');
  if (!checklist.hasMagicOrTech) suggestions.push('Définissez les règles du système de magie ou niveau technologique.');
  if (!checklist.hasHistoryOrLore) suggestions.push('Ajoutez des événements historiques marquants ou mythes fondateurs.');
  if (!checklist.hasCharacters) suggestions.push('Créez des figures clés ou héros emblématiques.');
  return {
    totalElements: elements.length,
    checklist,
    suggestions,
    score: Math.round((Object.values(checklist).filter(Boolean).length / 5) * 100),
  };
}
export async function addCollectionItem(userId, {
  name,
  category = 'Figurine',
  rarity = 'Commune',
  condition = 'Neuf',
  estimatedValue = 'N/A',
  collectionGroupName = 'Générale',
  description = '',
  tags = [],
  isFavorite = false,
  note = '',
}) {
  if (!name || !name.trim()) throw new Error('Le nom de l\'objet de collection est requis.');
  const doc = {
    _id: `col_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    name: name.trim(),
    category, 
    rarity, 
    condition, 
    estimatedValue: String(estimatedValue).trim(),
    collectionGroupName: collectionGroupName.trim(),
    description: description.trim(),
    tags: Array.isArray(tags) ? tags : String(tags || '').split(',').map(s => s.trim()).filter(Boolean),
    isFavorite: Boolean(isFavorite),
    note: note.trim(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('user_physical_collections').insertOne(doc);
  } else {
    store.store.collections.set(doc._id, doc);
  }
  return doc;
}
export async function getUserCollection(userId, { category = null, groupName = null, isFavorite = null } = {}) {
  const store = getStore();
  if (store.type === 'mongo') {
    const q = { userId };
    if (category) q.category = category;
    if (groupName) q.collectionGroupName = groupName;
    if (isFavorite !== null) q.isFavorite = Boolean(isFavorite);
    return await store.db.collection('user_physical_collections').find(q).sort({ createdAt: -1 }).toArray();
  } else {
    let list = Array.from(store.store.collections.values()).filter(c => c.userId === userId);
    if (category) list = list.filter(c => c.category === category);
    if (groupName) list = list.filter(c => c.collectionGroupName === groupName);
    if (isFavorite !== null) list = list.filter(c => Boolean(c.isFavorite) === Boolean(isFavorite));
    return list;
  }
}
export async function deleteCollectionItem(itemId, userId) {
  const store = getStore();
  if (store.type === 'mongo') {
    const res = await store.db.collection('user_physical_collections').deleteOne({ _id: itemId, userId });
    return res.deletedCount > 0;
  } else {
    const item = store.store.collections.get(itemId);
    if (item && item.userId === userId) {
      return store.store.collections.delete(itemId);
    }
    return false;
  }
}
export async function getCollectionStats(userId) {
  const items = await getUserCollection(userId);
  const total = items.length;
  const categories = {};
  const rarities = {};
  let totalNumericValue = 0;
  for (const it of items) {
    categories[it.category] = (categories[it.category] || 0) + 1;
    rarities[it.rarity] = (rarities[it.rarity] || 0) + 1;
    const match = String(it.estimatedValue).match(/(\d+(?:[.,]\d+)?)/);
    if (match) {
      totalNumericValue += parseFloat(match[1].replace(',', '.'));
    }
  }
  return {
    total,
    categories,
    rarities,
    totalEstimatedValue: totalNumericValue > 0 ? `${totalNumericValue.toFixed(2)} €` : 'N/A',
  };
}
const CREATIVE_CHALLENGES = {
  daily: [
    { title: 'Écriture Éclair (5 min)', prompt: 'Rédigez une scène commençant par : « Le ciel s\'illumina d\'un bleu impossible... »', domain: 'Écriture' },
    { title: 'Haïku du Matin', prompt: 'Composez un haïku en 5-7-5 syllabes célébrant la pluie sur les vitres.', domain: 'Poésie' },
    { title: 'Concept de Personnage', prompt: 'Imaginez un cuisinier qui infuse des souvenirs dans ses pâtisseries.', domain: 'Worldbuilding' },
    { title: 'Recette Anime', prompt: 'Inventez une boisson inspirée de votre technique ou pouvoir préféré.', domain: 'Cuisine' },
    { title: 'Page Tournée', prompt: 'Lisez 20 pages de votre livre en cours et notez votre citation favorite.', domain: 'Lecture' },
  ],
  weekly: [
    { title: 'Le Duel des Croyances', prompt: 'Développez deux factions qui s\'opposent sur l\'origine de la magie dans votre univers.', domain: 'Worldbuilding' },
    { title: 'Le Conte Sans Retour', prompt: 'Écrivez un court récit où le protagoniste ne peut prononcer que des vérités.', domain: 'Écriture' },
    { title: 'Sonnet des Saisons', prompt: 'Rédigez un sonnet classique (14 vers) décrivant le passage de l\'automne à l\'hiver.', domain: 'Poésie' },
    { title: 'Menu Thématique Ghibli', prompt: 'Concevez un menu complet entrée-plat-dessert digne d\'un banquet féerique.', domain: 'Cuisine' },
  ],
};
const RANDOM_PROMPTS = {
  histoire: [
    'Un messager apporte une lettre vieille de 300 ans à la mauvaise personne.',
    'Une horloge qui décompte le temps jusqu\'à la prochaine décision fatidique.',
    'Deux rivaux découvrent qu\'ils partagent le même rêve chaque nuit.',
    'Un objet antique vendu au marché noir commence à murmurer en pleine nuit.',
  ],
  personnage: [
    'Un archiviste myope capable de lire les émotions passées sur le papier.',
    'Une guerrière légendaire reconvertie dans la fabrication d\'instruments de musique.',
    'Un apprenti alchimiste allergique à ses propres potions.',
    'Un détective qui ne résout que les mystères survenus pendant les orages.',
  ],
  lieu: [
    'Une bibliothèque flottante au milieu d\'un gouffre sans fond.',
    'Un village où le temps s\'arrête chaque jour pendant exactement 7 minutes.',
    'Un phare dressé en plein désert de sable doré.',
    'Un marché clandestin situé dans les reflets des miroirs d\'une capitale.',
  ],
  recette: [
    'Bento du Voyageur Éthéré : riz vinaigré aux baies lumineuses et saumon mariné.',
    'Ramen du Tonnerre d\'Or : bouillon épicé miso noir et œuf mollet mariné au soja doux.',
    'Soufflé aux Rêves de Nuage : dessert vanillé ultra-aérien et coulis de framboises sauvages.',
  ],
};
export function getCreativeChallenge(type = 'daily') {
  const list = CREATIVE_CHALLENGES[type] || CREATIVE_CHALLENGES.daily;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}
export function getRandomInspiration(domain = 'histoire') {
  const key = domain.toLowerCase();
  const pool = RANDOM_PROMPTS[key] || [
    ...RANDOM_PROMPTS.histoire,
    ...RANDOM_PROMPTS.personnage,
    ...RANDOM_PROMPTS.lieu,
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}
export async function addCreativeIdea(userId, { text, domain = 'Général', tags = [] }) {
  if (!text || !text.trim()) throw new Error('L\'idée ne peut pas être vide.');
  const doc = {
    _id: `idea_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    text: text.trim(),
    domain: domain.trim(),
    tags: Array.isArray(tags) ? tags : String(tags || '').split(',').map(s => s.trim()).filter(Boolean),
    isStarred: false,
    createdAt: new Date(),
  };
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('user_creative_ideas').insertOne(doc);
  } else {
    store.store.ideas.set(doc._id, doc);
  }
  return doc;
}
export async function getUserIdeas(userId, { domain = null } = {}) {
  const store = getStore();
  if (store.type === 'mongo') {
    const q = { userId };
    if (domain) q.domain = domain;
    return await store.db.collection('user_creative_ideas').find(q).sort({ createdAt: -1 }).toArray();
  } else {
    let list = Array.from(store.store.ideas.values()).filter(i => i.userId === userId);
    if (domain) list = list.filter(i => i.domain === domain);
    return list;
  }
}
export async function deleteCreativeIdea(ideaId, userId) {
  const store = getStore();
  if (store.type === 'mongo') {
    const res = await store.db.collection('user_creative_ideas').deleteOne({ _id: ideaId, userId });
    return res.deletedCount > 0;
  } else {
    const item = store.store.ideas.get(ideaId);
    if (item && item.userId === userId) {
      return store.store.ideas.delete(ideaId);
    }
    return false;
  }
}
export async function createCreativeProject(ownerId, ownerName, guildId, {
  title,
  type = 'Roman collectif', 
  description = '',
  visibility = 'public',
}) {
  if (!title || !title.trim()) throw new Error('Le titre du projet est requis.');
  const doc = {
    _id: `proj_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    ownerId,
    ownerName,
    guildId,
    title: title.trim(),
    type,
    description: description.trim(),
    visibility, 
    status: 'Actif', 
    members: [{ userId: ownerId, username: ownerName, role: 'Chef de projet', joinedAt: new Date() }],
    tasks: [],
    documents: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('creative_projects').insertOne(doc);
  } else {
    store.store.projects.set(doc._id, doc);
  }
  return doc;
}
export async function getProjectById(projectId) {
  const store = getStore();
  if (store.type === 'mongo') {
    return await store.db.collection('creative_projects').findOne({ _id: projectId });
  } else {
    return store.store.projects.get(projectId) || null;
  }
}
export async function getUserProjects(userId, guildId) {
  const store = getStore();
  if (store.type === 'mongo') {
    return await store.db.collection('creative_projects').find({
      guildId,
      $or: [{ ownerId: userId }, { 'members.userId': userId }, { visibility: 'public' }],
    }).sort({ updatedAt: -1 }).toArray();
  } else {
    return Array.from(store.store.projects.values()).filter(p =>
      p.guildId === guildId &&
      (p.ownerId === userId || p.members?.some(m => m.userId === userId) || p.visibility === 'public')
    );
  }
}
export async function joinCreativeProject(projectId, userId, username, role = 'Contributeur') {
  const proj = await getProjectById(projectId);
  if (!proj) throw new Error('Projet introuvable.');
  if (proj.members.some(m => m.userId === userId)) throw new Error('Vous participez déjà à ce projet.');
  proj.members.push({ userId, username, role, joinedAt: new Date() });
  proj.updatedAt = new Date();
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('creative_projects').updateOne({ _id: projectId }, { $set: { members: proj.members, updatedAt: proj.updatedAt } });
  } else {
    store.store.projects.set(projectId, proj);
  }
  return proj;
}
export async function addProjectTask(projectId, userId, { title, assignedTo = 'Tous', status = 'À faire' }) {
  const proj = await getProjectById(projectId);
  if (!proj) throw new Error('Projet introuvable.');
  if (!proj.members.some(m => m.userId === userId)) throw new Error('Action réservée aux membres du projet.');
  const task = {
    id: `tsk_${Date.now().toString(36)}`,
    title: title.trim(),
    assignedTo: assignedTo.trim(),
    status, 
    createdBy: userId,
    createdAt: new Date(),
  };
  proj.tasks = [...(proj.tasks || []), task];
  proj.updatedAt = new Date();
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('creative_projects').updateOne({ _id: projectId }, { $set: { tasks: proj.tasks, updatedAt: proj.updatedAt } });
  } else {
    store.store.projects.set(projectId, proj);
  }
  return task;
}
export async function publishToGallery(userId, username, guildId, {
  creationType,
  creationId,
  title,
  description = '',
  previewContent = '',
  tags = [],
}) {
  const doc = {
    _id: `gal_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    authorName: username,
    guildId,
    creationType,
    creationId,
    title: title.trim(),
    description: description.trim(),
    previewContent: previewContent.trim().slice(0, 1500),
    tags: Array.isArray(tags) ? tags : String(tags || '').split(',').map(s => s.trim()).filter(Boolean),
    likes: 0,
    likedBy: [],
    reportsCount: 0,
    publishedAt: new Date(),
  };
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('community_gallery').insertOne(doc);
  } else {
    store.store.gallery.set(doc._id, doc);
  }
  return doc;
}
export async function getGalleryItems(guildId, { type = null, limit = 25 } = {}) {
  const store = getStore();
  if (store.type === 'mongo') {
    const q = { guildId, reportsCount: { $lt: 5 } };
    if (type) q.creationType = type;
    return await store.db.collection('community_gallery').find(q).sort({ publishedAt: -1 }).limit(limit).toArray();
  } else {
    let list = Array.from(store.store.gallery.values()).filter(g => g.guildId === guildId && (g.reportsCount || 0) < 5);
    if (type) list = list.filter(g => g.creationType === type);
    return list.slice(0, limit);
  }
}
export async function likeGalleryItem(itemId, userId) {
  const store = getStore();
  let item = null;
  if (store.type === 'mongo') {
    item = await store.db.collection('community_gallery').findOne({ _id: itemId });
  } else {
    item = store.store.gallery.get(itemId);
  }
  if (!item) throw new Error('Élément de la galerie introuvable.');
  const hasLiked = (item.likedBy || []).includes(userId);
  const patch = hasLiked
    ? { likedBy: item.likedBy.filter(id => id !== userId), likes: Math.max(0, (item.likes || 1) - 1) }
    : { likedBy: [...(item.likedBy || []), userId], likes: (item.likes || 0) + 1 };
  if (store.type === 'mongo') {
    await store.db.collection('community_gallery').updateOne({ _id: itemId }, { $set: patch });
  } else {
    Object.assign(item, patch);
  }
  return { liked: !hasLiked, totalLikes: patch.likes };
}
export async function searchAllUserCreations(userId, query = '') {
  const q = (query || '').toLowerCase().trim();
  if (!q) return { books: [], recipes: [], stories: [], poems: [], letters: [], collections: [] };
  const [books, recipes, stories, poems, letters, collections] = await Promise.all([
    getUserReadingBooks(userId, { search: q, limit: 10 }),
    searchRecipes(q, { authorId: userId, limit: 10 }),
    getUserStories(userId, { limit: 10 }),
    getUserPoems(userId, { limit: 10 }),
    getUserLetters(userId, { limit: 10 }),
    getUserCollection(userId),
  ]);
  return {
    books: books.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)),
    recipes: recipes.filter(r => r.title.toLowerCase().includes(q)),
    stories: stories.filter(s => s.title.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q)),
    poems: poems.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)),
    letters: letters.filter(l => l.title.toLowerCase().includes(q) || l.recipient.toLowerCase().includes(q)),
    collections: collections.filter(c => c.name.toLowerCase().includes(q)),
  };
}
export async function getUserConsolidatedStats(userId) {
  const [books, recipes, stories, poems, letters, collections, ideas] = await Promise.all([
    getUserReadingBooks(userId, { isArchived: null, limit: 500 }),
    searchRecipes('', { authorId: userId, limit: 500 }),
    getUserStories(userId, { limit: 100 }),
    getUserPoems(userId, { limit: 200 }),
    getUserLetters(userId, { limit: 100 }),
    getUserCollection(userId),
    getUserIdeas(userId),
  ]);
  const totalWordsInStories = stories.reduce((sum, s) => sum + (s.totalWords || 0), 0);
  const totalVerses = poems.reduce((sum, p) => sum + (p.verseCount || 0), 0);
  const totalBooksFinished = books.filter(b => b.status === 'Terminé').length;
  return {
    booksCount: books.length,
    booksFinished: totalBooksFinished,
    recipesCount: recipes.length,
    storiesCount: stories.length,
    totalWordsInStories,
    poemsCount: poems.length,
    totalVerses,
    lettersCount: letters.length,
    collectionsCount: collections.length,
    ideasCount: ideas.length,
    grandTotal: books.length + recipes.length + stories.length + poems.length + letters.length + collections.length + ideas.length,
  };
}
export async function exportUserCreations(userId, format = 'json') {
  const [books, recipes, stories, poems, letters, collections] = await Promise.all([
    getUserReadingBooks(userId, { isArchived: null, limit: 200 }),
    searchRecipes('', { authorId: userId, limit: 200 }),
    getUserStories(userId, { limit: 100 }),
    getUserPoems(userId, { limit: 100 }),
    getUserLetters(userId, { limit: 100 }),
    getUserCollection(userId),
  ]);
  if (format === 'markdown') {
    let md = `# 🎨 ATELIER CRÉATIF SAEZ — EXPORT PERSONNEL\n\n`;
    md += `*Généré le ${new Date().toLocaleDateString('fr-FR')} pour l'utilisateur ${userId}*\n\n`;
    md += `## 📚 Mes Lectures (${books.length})\n`;
    for (const b of books) {
      md += `- **${b.title}** par *${b.author}* [${b.category}] — Tome ${b.currentVolume}/${b.totalVolumes} (${b.status})\n`;
    }
    md += `\n## 🍜 Mes Recettes (${recipes.length})\n`;
    for (const r of recipes) {
      md += `### ${r.title} (${r.category})\n`;
      md += `*Ingrédients :* ${r.ingredients.join(', ')}\n\n`;
      md += `*Préparation :*\n${r.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n`;
    }
    md += `## 📜 Mes Histoires (${stories.length})\n`;
    for (const s of stories) {
      md += `### ${s.title} [${s.genre}] (${s.status})\n`;
      md += `> ${s.summary || 'Sans résumé'}\n\n`;
      if (s.chapters && s.chapters.length > 0) {
        for (const c of s.chapters) {
          md += `#### ${c.title}\n${c.content}\n\n`;
        }
      }
    }
    md += `## 🌸 Mes Poèmes (${poems.length})\n`;
    for (const p of poems) {
      md += `### ${p.title} (${p.form})\n`;
      md += `*${p.content}*\n\n`;
    }
    return { filename: `creativite_export_${userId}.md`, content: md, mimeType: 'text/markdown' };
  }
  const payload = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    userId,
    data: {
      books,
      recipes,
      stories,
      poems,
      letters,
      collections,
    },
  };
  return {
    filename: `creativite_export_${userId}.json`,
    content: JSON.stringify(payload, null, 2),
    mimeType: 'application/json',
  };
}
export async function validateAndImportUserCreations(userId, authorName, rawContent) {
  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error('Contenu de fichier vide ou illisible.');
  }
  if (rawContent.length > 512 * 1024) {
    throw new Error('Le fichier importé dépasse la limite maximale autorisée de 500 Ko.');
  }
  let parsed = null;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new Error('Format de fichier invalide. Seul un fichier JSON valide peut être importé.');
  }
  if (!parsed || typeof parsed !== 'object' || !parsed.data) {
    throw new Error('Structure JSON invalide : clé racine "data" manquante.');
  }
  let importedCount = 0;
  const errors = [];
  if (Array.isArray(parsed.data.books)) {
    for (const b of parsed.data.books.slice(0, 50)) {
      if (b.title && typeof b.title === 'string') {
        try {
          await addReadingBook(userId, {
            title: b.title.slice(0, 150),
            author: String(b.author || 'Inconnu').slice(0, 100),
            category: String(b.category || 'Manga').slice(0, 50),
            totalVolumes: b.totalVolumes || 1,
            currentVolume: b.currentVolume || 1,
            status: b.status || 'En cours',
            rating: b.rating || 0,
          });
          importedCount++;
        } catch (e) {
          errors.push(`Livre "${b.title}": ${e.message}`);
        }
      }
    }
  }
  if (Array.isArray(parsed.data.recipes)) {
    for (const r of parsed.data.recipes.slice(0, 30)) {
      if (r.title && r.ingredients && r.steps) {
        try {
          await addRecipe({
            title: String(r.title).slice(0, 150),
            category: String(r.category || 'Anime Food').slice(0, 50),
            ingredients: r.ingredients,
            steps: r.steps,
            prepTime: String(r.prepTime || '20 min').slice(0, 30),
            authorId: userId,
            authorName,
          });
          importedCount++;
        } catch (e) {
          errors.push(`Recette "${r.title}": ${e.message}`);
        }
      }
    }
  }
  if (Array.isArray(parsed.data.poems)) {
    for (const p of parsed.data.poems.slice(0, 30)) {
      if (p.title && p.content) {
        try {
          await createPoem(userId, authorName, null, {
            title: String(p.title).slice(0, 150),
            form: String(p.form || 'Poésie libre').slice(0, 50),
            content: String(p.content).slice(0, 2000),
            theme: String(p.theme || 'Général').slice(0, 50),
          });
          importedCount++;
        } catch (e) {
          errors.push(`Poème "${p.title}": ${e.message}`);
        }
      }
    }
  }
  return {
    success: true,
    importedCount,
    errors,
  };
}
