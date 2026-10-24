import { getDb } from '../database/mongo.js';
export async function addPartnership(guildId, { partnerName, inviteUrl, description, repId }) {
  try {
    const db = getDb();
    const doc = {
      guild_id: guildId,
      partner_name: partnerName,
      invite_url: inviteUrl,
      description,
      representative_id: repId,
      created_at: new Date(),
    };
    await db.collection('server_partnerships').insertOne(doc);
    return true;
  } catch {
    return false;
  }
}
export async function getPartnerships(guildId) {
  try {
    const db = getDb();
    return await db.collection('server_partnerships').find({ guild_id: guildId }).sort({ created_at: -1 }).toArray();
  } catch {
    return [];
  }
}
