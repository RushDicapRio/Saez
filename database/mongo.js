import { MongoClient } from 'mongodb';
import { config } from '../config.js';
let client = null;
let db = null;
export async function connectMongo() {
  if (db) return db;
  try {
    console.log('[MongoDB] Connexion à MongoDB Atlas en cours...');
    client = new MongoClient(config.mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    });
    await client.connect();
    db = client.db(config.mongoDbName);
    console.log(`[MongoDB] ✅ Connecté avec succès à la base "${config.mongoDbName}" !`);
    return db;
  } catch (err) {
    console.error('[MongoDB] ❌ Échec de la connexion à MongoDB Atlas :', err.message);
    throw err;
  }
}
export function getDb() {
  if (!db) {
    throw new Error('La base de données MongoDB n\'est pas encore connectée.');
  }
  return db;
}
export async function closeMongo() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('[MongoDB] Connexion fermée.');
  }
}
