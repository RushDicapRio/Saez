import { getDb } from '../database/mongo.js';
import { EmbedBuilder } from 'discord.js';
export async function getStarboardConfig(guildId) {
  try {
    const db = getDb();
    const doc = await db.collection('server_starboards').findOne({ guild_id: guildId });
    return doc || {
      guild_id: guildId,
      channel_id: null,
      threshold: 3,
      emoji: '⭐',
      enabled: false,
    };
  } catch {
    return { guild_id: guildId, channel_id: null, threshold: 3, emoji: '⭐', enabled: false };
  }
}
export async function saveStarboardConfig(guildId, data) {
  try {
    const db = getDb();
    await db.collection('server_starboards').updateOne(
      { guild_id: guildId },
      { $set: { ...data, guild_id: guildId, updated_at: new Date() } },
      { upsert: true }
    );
    return true;
  } catch (err) {
    console.error('Erreur saveStarboardConfig:', err);
    return false;
  }
}
export async function recordStarredMessage(guildId, originalMessageId, starboardMessageId, starCount) {
  try {
    const db = getDb();
    await db.collection('starboard_messages').updateOne(
      { guild_id: guildId, original_message_id: originalMessageId },
      {
        $set: {
          starboard_message_id: starboardMessageId,
          star_count: starCount,
          updated_at: new Date(),
        },
        $setOnInsert: { created_at: new Date() },
      },
      { upsert: true }
    );
  } catch {}
}
export async function getStarredMessage(guildId, originalMessageId) {
  try {
    const db = getDb();
    return await db.collection('starboard_messages').findOne({
      guild_id: guildId,
      original_message_id: originalMessageId,
    });
  } catch {
    return null;
  }
}
export async function getTopStarredMessages(guildId, limit = 5) {
  try {
    const db = getDb();
    return await db
      .collection('starboard_messages')
      .find({ guild_id: guildId })
      .sort({ star_count: -1 })
      .limit(limit)
      .toArray();
  } catch {
    return [];
  }
}
