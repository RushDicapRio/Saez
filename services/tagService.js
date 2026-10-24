import { getDb } from '../database/mongo.js';
export async function createTag(guildId, name, content, authorId) {
  try {
    const db = getDb();
    const cleanName = name.toLowerCase().trim();
    await db.collection('server_tags').updateOne(
      { guild_id: guildId, name: cleanName },
      {
        $set: {
          guild_id: guildId,
          name: cleanName,
          content,
          author_id: authorId,
          updated_at: new Date(),
        },
        $setOnInsert: { created_at: new Date(), uses: 0 },
      },
      { upsert: true }
    );
    return true;
  } catch {
    return false;
  }
}
export async function getTag(guildId, name) {
  try {
    const db = getDb();
    const cleanName = name.toLowerCase().trim();
    const tag = await db.collection('server_tags').findOneAndUpdate(
      { guild_id: guildId, name: cleanName },
      { $inc: { uses: 1 } },
      { returnDocument: 'after' }
    );
    return tag;
  } catch {
    return null;
  }
}
export async function deleteTag(guildId, name) {
  try {
    const db = getDb();
    const cleanName = name.toLowerCase().trim();
    const res = await db.collection('server_tags').deleteOne({ guild_id: guildId, name: cleanName });
    return res.deletedCount > 0;
  } catch {
    return false;
  }
}
export async function listTags(guildId, limit = 25) {
  try {
    const db = getDb();
    return await db.collection('server_tags')
      .find({ guild_id: guildId })
      .sort({ uses: -1 })
      .limit(limit)
      .toArray();
  } catch {
    return [];
  }
}
