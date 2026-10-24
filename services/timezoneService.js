import { getDb } from '../database/mongo.js';
export async function setUserTimezone(userId, timezone) {
  try {
    const db = getDb();
    await db.collection('user_timezones').updateOne(
      { user_id: userId },
      { $set: { user_id: userId, timezone, updated_at: new Date() } },
      { upsert: true }
    );
    return true;
  } catch {
    return false;
  }
}
export async function getUserTimezone(userId) {
  try {
    const db = getDb();
    const doc = await db.collection('user_timezones').findOne({ user_id: userId });
    return doc?.timezone || null;
  } catch {
    return null;
  }
}
