import { getDb } from '../database/mongo.js';
import { ObjectId } from 'mongodb';
export async function createTournament({ guildId, title, game, maxParticipants = 16, format = 'SINGLE_ELIMINATION', authorId }) {
  try {
    const db = getDb();
    const doc = {
      guild_id: guildId,
      title,
      game,
      max_participants: maxParticipants,
      format,
      author_id: authorId,
      status: 'REGISTRATION', 
      participants: [],
      matches: [],
      created_at: new Date(),
    };
    const res = await db.collection('server_tournaments').insertOne(doc);
    return { ...doc, _id: res.insertedId };
  } catch (err) {
    console.error('Erreur createTournament:', err);
    return null;
  }
}
export async function joinTournament(tournamentId, userId, username) {
  try {
    const db = getDb();
    const t = await db.collection('server_tournaments').findOne({ _id: new ObjectId(tournamentId) });
    if (!t) return { success: false, message: 'Tournoi introuvable.' };
    if (t.status !== 'REGISTRATION') return { success: false, message: 'Les inscriptions sont closes.' };
    if (t.participants.some(p => p.user_id === userId)) return { success: false, message: 'Vous êtes déjà inscrit !' };
    if (t.participants.length >= t.max_participants) return { success: false, message: 'Le tournoi est complet !' };
    await db.collection('server_tournaments').updateOne(
      { _id: new ObjectId(tournamentId) },
      { $push: { participants: { user_id: userId, username, joined_at: new Date() } } }
    );
    return { success: true, count: t.participants.length + 1 };
  } catch (err) {
    return { success: false, message: err.message };
  }
}
export async function getActiveTournaments(guildId) {
  try {
    const db = getDb();
    return await db.collection('server_tournaments')
      .find({ guild_id: guildId, status: { $ne: 'FINISHED' } })
      .sort({ created_at: -1 })
      .toArray();
  } catch {
    return [];
  }
}
export async function closeTournament(tournamentId, winnerName) {
  try {
    const db = getDb();
    await db.collection('server_tournaments').updateOne(
      { _id: new ObjectId(tournamentId) },
      { $set: { status: 'FINISHED', winner: winnerName, finished_at: new Date() } }
    );
    return true;
  } catch {
    return false;
  }
}
