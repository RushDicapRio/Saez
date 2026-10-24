import { getDb } from '../database/mongo.js';
export async function logFitnessSession(userId, { activity, durationMinutes, caloriesBurned, notes }) {
  const db = getDb();
  const col = db.collection('user_fitness_logs');
  const doc = {
    _id: `fit_${Date.now().toString(36)}`,
    userId,
    activity: activity || 'Course / Marche',
    durationMinutes: parseInt(durationMinutes, 10) || 30,
    caloriesBurned: parseInt(caloriesBurned, 10) || 0,
    notes: notes || '',
    date: new Date(),
  };
  await col.insertOne(doc);
  return doc;
}
export async function getUserFitnessHistory(userId) {
  try {
    const db = getDb();
    const col = db.collection('user_fitness_logs');
    return await col.find({ userId }).sort({ date: -1 }).limit(10).toArray();
  } catch {
    return [];
  }
}
export async function logHabit(userId, habitName) {
  const db = getDb();
  const col = db.collection('user_habits');
  const today = new Date().toISOString().slice(0, 10);
  const existing = await col.findOne({ userId, habitName });
  if (!existing) {
    const newDoc = {
      _id: `hab_${Date.now().toString(36)}`,
      userId,
      habitName: habitName.trim(),
      streak: 1,
      lastChecked: today,
      history: [today],
      createdAt: new Date(),
    };
    await col.insertOne(newDoc);
    return { ...newDoc, alreadyDone: false };
  }
  if (existing.lastChecked === today) {
    return { ...existing, alreadyDone: true };
  }
  const streak = existing.streak + 1;
  await col.updateOne(
    { _id: existing._id },
    {
      $set: { streak, lastChecked: today },
      $push: { history: today },
    }
  );
  return { ...existing, streak, alreadyDone: false };
}
export async function getUserHabits(userId) {
  try {
    const db = getDb();
    const col = db.collection('user_habits');
    return await col.find({ userId }).sort({ streak: -1 }).toArray();
  } catch {
    return [];
  }
}
export async function savePetProfile(userId, { name, species, breed, age, photoUrl, bio }) {
  const db = getDb();
  const col = db.collection('user_pets');
  const doc = {
    _id: `pet_${Date.now().toString(36)}`,
    userId,
    name: name.trim(),
    species: species || 'Chat',
    breed: breed || 'Européen',
    age: age || 'Inconnu',
    photoUrl: photoUrl || '',
    bio: bio || '',
    createdAt: new Date(),
  };
  await col.insertOne(doc);
  return doc;
}
export async function getUserPets(userId) {
  try {
    const db = getDb();
    const col = db.collection('user_pets');
    return await col.find({ userId }).toArray();
  } catch {
    return [];
  }
}
export async function savePlant(userId, { name, species, waterIntervalDays, notes }) {
  const db = getDb();
  const col = db.collection('user_plants');
  const doc = {
    _id: `plant_${Date.now().toString(36)}`,
    userId,
    name: name.trim(),
    species: species || 'Plante d\'intérieur',
    waterIntervalDays: parseInt(waterIntervalDays, 10) || 7,
    lastWatered: new Date(),
    notes: notes || '',
    createdAt: new Date(),
  };
  await col.insertOne(doc);
  return doc;
}
export async function waterPlant(userId, plantId) {
  const db = getDb();
  const col = db.collection('user_plants');
  const res = await col.findOneAndUpdate(
    { _id: plantId, userId },
    { $set: { lastWatered: new Date() } },
    { returnDocument: 'after' }
  );
  return res?.value || res;
}
export async function getUserPlants(userId) {
  try {
    const db = getDb();
    const col = db.collection('user_plants');
    return await col.find({ userId }).toArray();
  } catch {
    return [];
  }
}
export async function addWishlistItem(userId, { title, link, price, priority }) {
  const db = getDb();
  const col = db.collection('user_wishlists');
  const doc = {
    _id: `wish_${Date.now().toString(36)}`,
    userId,
    title: title.trim(),
    link: link || '',
    price: price || 'N/A',
    priority: priority || 'Moyenne', 
    acquired: false,
    createdAt: new Date(),
  };
  await col.insertOne(doc);
  return doc;
}
export async function getUserWishlist(userId) {
  try {
    const db = getDb();
    const col = db.collection('user_wishlists');
    return await col.find({ userId }).sort({ createdAt: -1 }).toArray();
  } catch {
    return [];
  }
}
export async function addFlashcard(userId, { deckName, question, answer }) {
  const db = getDb();
  const col = db.collection('user_flashcards');
  const doc = {
    _id: `card_${Date.now().toString(36)}`,
    userId,
    deckName: (deckName || 'Général').trim(),
    question: question.trim(),
    answer: answer.trim(),
    reviewCount: 0,
    createdAt: new Date(),
  };
  await col.insertOne(doc);
  return doc;
}
export async function getFlashcards(userId, deckName = null) {
  try {
    const db = getDb();
    const col = db.collection('user_flashcards');
    const query = { userId };
    if (deckName) query.deckName = deckName;
    return await col.find(query).toArray();
  } catch {
    return [];
  }
}
