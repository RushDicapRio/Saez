import { getDb } from '../../database/mongo.js';
import { recordValidCount } from './statsEngine.js';
import { addXp } from '../discordLevelService.js';
import { adjustBalance } from '../economyService.js';
let inMemoryDuels = new Map();
export function resetDuelsMemoryStore() {
  inMemoryDuels = new Map();
}
export async function createDuelInvitation(guildId, channelId, challenger, opponent, roundsCount = 3) {
  const duelId = `duel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const duel = {
    id: duelId,
    guildId,
    channelId,
    challenger: { id: challenger.id, username: challenger.username, score: 0 },
    opponent: { id: opponent.id, username: opponent.username, score: 0 },
    roundsCount,
    currentRound: 0,
    questions: generateDuelQuestions(roundsCount),
    status: 'pending',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 120000),
  };
  try {
    const db = getDb();
    if (db) await db.collection('counting_duels').insertOne(duel);
  } catch {}
  inMemoryDuels.set(duelId, duel);
  return duel;
}
function generateDuelQuestions(count) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const a = Math.floor(Math.random() * 20) + 10;
    const b = Math.floor(Math.random() * 10) + 2;
    const isMult = Math.random() > 0.4;
    const op = isMult ? '×' : '+';
    const ans = isMult ? a * b : a + b;
    list.push({
      roundNumber: i + 1,
      prompt: `${a} ${op} ${b} = ?`,
      answer: String(ans),
      answeredBy: null,
    });
  }
  return list;
}
export async function getDuel(duelId) {
  try {
    const db = getDb();
    if (db) {
      const doc = await db.collection('counting_duels').findOne({ id: duelId });
      if (doc) return doc;
    }
  } catch {}
  return inMemoryDuels.get(duelId) || null;
}
export async function saveDuel(duel) {
  inMemoryDuels.set(duel.id, duel);
  try {
    const db = getDb();
    if (db) {
      await db.collection('counting_duels').updateOne(
        { id: duel.id },
        { $set: duel },
        { upsert: true }
      );
    }
  } catch {}
}
export async function acceptDuel(duelId, userId) {
  const duel = await getDuel(duelId);
  if (!duel) return { success: false, message: 'Duel introuvable.' };
  if (duel.status !== 'pending') return { success: false, message: 'Ce duel n\'est plus en attente.' };
  if (duel.opponent.id !== userId) return { success: false, message: 'Vous n\'êtes pas le destinataire de ce défi.' };
  duel.status = 'active';
  duel.currentRound = 1;
  duel.startedAt = new Date();
  await saveDuel(duel);
  return { success: true, duel };
}
export async function declineDuel(duelId, userId) {
  const duel = await getDuel(duelId);
  if (!duel) return { success: false, message: 'Duel introuvable.' };
  if (duel.opponent.id !== userId && duel.challenger.id !== userId) {
    return { success: false, message: 'Vous ne faites pas partie de ce duel.' };
  }
  duel.status = 'declined';
  await saveDuel(duel);
  return { success: true, duel };
}
export async function submitDuelAnswer(duelId, user, answer) {
  const duel = await getDuel(duelId);
  if (!duel || duel.status !== 'active') {
    return { success: false, message: 'Ce duel n\'est pas actif.' };
  }
  if (duel.challenger.id !== user.id && duel.opponent.id !== user.id) {
    return { success: false, message: 'Vous ne participez pas à ce duel.' };
  }
  const qIndex = duel.currentRound - 1;
  const currentQ = duel.questions[qIndex];
  if (!currentQ || currentQ.answeredBy) {
    return { success: false, message: 'Ce round a déjà été résolu !' };
  }
  if (String(answer).trim() === currentQ.answer) {
    currentQ.answeredBy = user.id;
    if (user.id === duel.challenger.id) {
      duel.challenger.score++;
    } else {
      duel.opponent.score++;
    }
    if (duel.currentRound >= duel.roundsCount) {
      duel.status = 'finished';
      let winner = null;
      if (duel.challenger.score > duel.opponent.score) {
        winner = duel.challenger;
      } else if (duel.opponent.score > duel.challenger.score) {
        winner = duel.opponent;
      }
      duel.winner = winner;
      await saveDuel(duel);
      return {
        success: true,
        finished: true,
        correctUser: user,
        duel,
        winner,
        message: winner
          ? `🏆 **VICTOIRE !** ${winner.username} remporte le duel avec ${winner.score} point(s) !`
          : `🤝 **ÉGALITÉ PARFAITE !** Score final : ${duel.challenger.score} partout !`,
      };
    }
    duel.currentRound++;
    await saveDuel(duel);
    return {
      success: true,
      finished: false,
      correctUser: user,
      duel,
      nextQuestion: duel.questions[duel.currentRound - 1],
      message: `✨ ${user.username} marque le point sur le Round ${currentQ.roundNumber} !`,
    };
  }
  return { success: true, wrong: true, message: `❌ Mauvaise réponse ! Réessayez au plus vite !` };
}
