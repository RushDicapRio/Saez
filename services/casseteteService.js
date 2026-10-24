import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getDb } from '../database/mongo.js';
import { addXp } from './discordLevelService.js';
import * as Chess from './cassetete/chessEngine.js';
import * as Sudoku from './cassetete/sudokuEngine.js';
import * as Puzzles from './cassetete/logicPuzzles.js';
export { Chess, Sudoku, Puzzles };
let inMemoryStore = null;
function getStore() {
  try {
    const db = getDb();
    if (db) return { type: 'mongo', db };
  } catch {}
  if (!inMemoryStore) {
    inMemoryStore = {
      sessions: new Map(),
      stats: new Map(),
      daily: new Map(),
      duels: new Map(),
    };
  }
  return { type: 'memory', store: inMemoryStore };
}
export function resetMemoryStore() {
  inMemoryStore = {
    sessions: new Map(),
    stats: new Map(),
    daily: new Map(),
    duels: new Map(),
  };
}
export async function createSession(data) {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const session = {
    _id: sessionId,
    id: sessionId,
    gameType: data.gameType, 
    channelId: data.channelId,
    guildId: data.guildId,
    hostUserId: data.hostUserId,
    opponentUserId: data.opponentUserId || null,
    isVsAI: !!data.isVsAI,
    gameState: data.gameState,
    difficulty: data.difficulty || 'normal',
    status: 'active', 
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('puzzle_sessions').insertOne(session);
  } else {
    store.store.sessions.set(sessionId, session);
  }
  return session;
}
export async function getSession(sessionId) {
  const store = getStore();
  if (store.type === 'mongo') {
    return await store.db.collection('puzzle_sessions').findOne({ _id: sessionId });
  }
  return store.store.sessions.get(sessionId) || null;
}
export async function getUserActiveSession(userId, channelId = null) {
  const store = getStore();
  if (store.type === 'mongo') {
    const query = {
      $or: [{ hostUserId: userId }, { opponentUserId: userId }],
      status: 'active',
    };
    if (channelId) query.channelId = channelId;
    return await store.db.collection('puzzle_sessions').findOne(query);
  }
  for (const s of store.store.sessions.values()) {
    if (s.status === 'active' && (s.hostUserId === userId || s.opponentUserId === userId)) {
      if (!channelId || s.channelId === channelId) return s;
    }
  }
  return null;
}
export async function saveSession(session) {
  session.updatedAt = new Date();
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('puzzle_sessions').updateOne(
      { _id: session._id || session.id },
      { $set: session },
      { upsert: true }
    );
  } else {
    store.store.sessions.set(session.id, session);
  }
  return session;
}
export async function closeSession(sessionId, outcome = 'abandoned') {
  const session = await getSession(sessionId);
  if (!session) return null;
  session.status = outcome;
  session.updatedAt = new Date();
  await saveSession(session);
  return session;
}
export async function createDuelInvitation({ guildId, channelId, hostUser, targetUser, gameType, options = {} }) {
  if (hostUser.id === targetUser.id) {
    return { success: false, reason: 'Vous ne pouvez pas vous défier vous-même !' };
  }
  if (targetUser.bot) {
    return { success: false, reason: 'Pour jouer contre le bot, choisissez le mode Entraînement / Solo IA !' };
  }
  const duelId = `duel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const duel = {
    _id: duelId,
    id: duelId,
    guildId,
    channelId,
    hostUserId: hostUser.id,
    hostUsername: hostUser.username,
    targetUserId: targetUser.id,
    targetUsername: targetUser.username,
    gameType, 
    options,
    status: 'pending', 
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), 
  };
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('puzzle_duels').insertOne(duel);
  } else {
    store.store.duels.set(duelId, duel);
  }
  return { success: true, duel };
}
export async function getDuel(duelId) {
  const store = getStore();
  if (store.type === 'mongo') {
    return await store.db.collection('puzzle_duels').findOne({ _id: duelId });
  }
  return store.store.duels.get(duelId) || null;
}
export async function acceptDuel(duelId, targetUserId) {
  const duel = await getDuel(duelId);
  if (!duel) return { success: false, reason: 'Ce duel n\'existe pas ou a expiré.' };
  if (duel.targetUserId !== targetUserId) {
    return { success: false, reason: 'Seul le joueur défié peut accepter cette invitation !' };
  }
  if (duel.status !== 'pending') {
    return { success: false, reason: `Ce duel a déjà été ${duel.status}.` };
  }
  if (new Date() > new Date(duel.expiresAt)) {
    duel.status = 'expired';
    return { success: false, reason: 'L\'invitation a expiré.' };
  }
  duel.status = 'accepted';
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('puzzle_duels').updateOne({ _id: duelId }, { $set: duel });
  } else {
    store.store.duels.set(duelId, duel);
  }
  let gameState;
  if (duel.gameType === 'echecs') {
    gameState = Chess.createChessState();
  } else if (duel.gameType === 'morpion') {
    gameState = Puzzles.createMorpionGame();
  } else if (duel.gameType === 'puissance4') {
    gameState = Puzzles.createPuissance4Game();
  }
  const session = await createSession({
    gameType: duel.gameType,
    guildId: duel.guildId,
    channelId: duel.channelId,
    hostUserId: duel.hostUserId,
    opponentUserId: duel.targetUserId,
    isVsAI: false,
    gameState,
  });
  return { success: true, duel, session };
}
export async function declineDuel(duelId, targetUserId) {
  const duel = await getDuel(duelId);
  if (!duel) return { success: false, reason: 'Ce duel n\'existe pas.' };
  if (duel.targetUserId !== targetUserId) {
    return { success: false, reason: 'Vous n\'êtes pas le destinataire de cette invitation.' };
  }
  duel.status = 'declined';
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('puzzle_duels').updateOne({ _id: duelId }, { $set: duel });
  } else {
    store.store.duels.set(duelId, duel);
  }
  return { success: true, duel };
}
export async function cancelDuel(duelId, hostUserId) {
  const duel = await getDuel(duelId);
  if (!duel) return { success: false, reason: 'Ce duel n\'existe pas.' };
  if (duel.hostUserId !== hostUserId) {
    return { success: false, reason: 'Seul l\'auteur du défi peut l\'annuler.' };
  }
  duel.status = 'cancelled';
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('puzzle_duels').updateOne({ _id: duelId }, { $set: duel });
  } else {
    store.store.duels.set(duelId, duel);
  }
  return { success: true, duel };
}
export async function getUserStats(userId) {
  const store = getStore();
  let stats = null;
  if (store.type === 'mongo') {
    stats = await store.db.collection('puzzle_stats').findOne({ _id: userId });
  } else {
    stats = store.store.stats.get(userId) || null;
  }
  if (!stats) {
    stats = {
      _id: userId,
      userId,
      elo: 1000,
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      gamesDrawn: 0,
      dailyStreak: 0,
      lastDailyDate: null,
      byGame: {
        echecs: { played: 0, won: 0 },
        sudoku: { played: 0, won: 0 },
        morpion: { played: 0, won: 0 },
        puissance4: { played: 0, won: 0 },
        mastermind: { played: 0, won: 0 },
        '2048': { played: 0, won: 0, bestScore: 0 },
        hanoi: { played: 0, won: 0 },
        demineur: { played: 0, won: 0 },
        compte: { played: 0, won: 0 },
        mots: { played: 0, won: 0 },
      },
      updatedAt: new Date(),
    };
  }
  return stats;
}
export async function recordGameResult(userId, gameType, outcome, pointsEarned = 15, guild = null, user = null) {
  const stats = await getUserStats(userId);
  stats.gamesPlayed++;
  if (!stats.byGame[gameType]) {
    stats.byGame[gameType] = { played: 0, won: 0 };
  }
  stats.byGame[gameType].played++;
  if (outcome === 'win') {
    stats.gamesWon++;
    stats.byGame[gameType].won++;
    stats.elo += pointsEarned;
  } else if (outcome === 'loss') {
    stats.gamesLost++;
    stats.elo = Math.max(800, stats.elo - Math.floor(pointsEarned / 2));
  } else if (outcome === 'draw') {
    stats.gamesDrawn++;
  }
  stats.updatedAt = new Date();
  const store = getStore();
  if (store.type === 'mongo') {
    await store.db.collection('puzzle_stats').updateOne({ _id: userId }, { $set: stats }, { upsert: true });
  } else {
    store.store.stats.set(userId, stats);
  }
  if (guild && user && outcome === 'win') {
    try {
      await addXp(guild, user, pointsEarned * 2);
    } catch {}
  }
  return stats;
}
export async function getLeaderboard(limit = 10) {
  const store = getStore();
  if (store.type === 'mongo') {
    return await store.db.collection('puzzle_stats')
      .find({})
      .sort({ elo: -1, gamesWon: -1 })
      .limit(limit)
      .toArray();
  }
  const list = Array.from(store.store.stats.values());
  list.sort((a, b) => b.elo - a.elo || b.gamesWon - a.gamesWon);
  return list.slice(0, limit);
}
export function getTodayDateString() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
export async function getDailyPuzzle(dateStr = getTodayDateString()) {
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const dayIndex = new Date(dateStr).getDay();
  let type = 'sudoku';
  if (dayIndex % 4 === 0) type = 'echecs';
  else if (dayIndex % 4 === 1) type = 'sudoku';
  else if (dayIndex % 4 === 2) type = 'compte';
  else type = 'logique';
  let puzzleData;
  if (type === 'echecs') {
    puzzleData = Chess.TACTICAL_PUZZLES[dayIndex % Chess.TACTICAL_PUZZLES.length];
  } else if (type === 'sudoku') {
    puzzleData = Sudoku.generateDailySudoku(dateStr);
  } else if (type === 'compte') {
    puzzleData = Puzzles.generateCompteEstBon();
  } else {
    puzzleData = Puzzles.LOGIC_RIDDLES[dayIndex % Puzzles.LOGIC_RIDDLES.length];
  }
  return {
    date: dateStr,
    type,
    puzzle: puzzleData,
  };
}
export async function hasCompletedDaily(userId, dateStr = getTodayDateString()) {
  const store = getStore();
  const key = `${userId}_${dateStr}`;
  if (store.type === 'mongo') {
    const doc = await store.db.collection('puzzle_daily').findOne({ _id: key });
    return !!doc;
  }
  return store.store.daily.has(key);
}
export async function markDailyCompleted(userId, dateStr = getTodayDateString(), guild = null, user = null) {
  const store = getStore();
  const key = `${userId}_${dateStr}`;
  const doc = { _id: key, userId, date: dateStr, completedAt: new Date() };
  if (store.type === 'mongo') {
    await store.db.collection('puzzle_daily').insertOne(doc);
  } else {
    store.store.daily.set(key, doc);
  }
  const stats = await getUserStats(userId);
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yStr = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterday.getUTCDate()).padStart(2, '0')}`;
  if (stats.lastDailyDate === yStr) {
    stats.dailyStreak++;
  } else {
    stats.dailyStreak = 1;
  }
  stats.lastDailyDate = dateStr;
  stats.elo += 25; 
  if (store.type === 'mongo') {
    await store.db.collection('puzzle_stats').updateOne({ _id: userId }, { $set: stats }, { upsert: true });
  } else {
    store.store.stats.set(userId, stats);
  }
  if (guild && user) {
    try {
      await addXp(guild, user, 50); 
    } catch {}
  }
  return { streak: stats.dailyStreak, elo: stats.elo };
}
export function buildChessEmbed(session) {
  const state = session.gameState;
  const boardAscii = Chess.renderChessAscii(state.board, state.turn);
  const turnText = state.turn === 'w' ? '⚪ Blancs' : '⚫ Noirs';
  const player1 = `<@${session.hostUserId}> (Blancs ⚪)`;
  const player2 = session.isVsAI ? '🤖 IA Minimax (Noirs ⚫)' : `<@${session.opponentUserId}> (Noirs ⚫)`;
  const embed = new EmbedBuilder()
    .setTitle('♟️ Partie d\'Échecs Saez')
    .setColor(state.turn === 'w' ? 0x00e5ff : 0x10b981)
    .setDescription(
      `⚔️ **Joueurs :** ${player1} vs ${player2}\n` +
      `⏱️ **Au trait :** **${turnText}**\n\n` +
      `\`\`\`\n${boardAscii}\n\`\`\`\n` +
      `*Jouez votre coup avec \`/cassetete echecs action:coup coup_texte:e2e4\` ou \`O-O\`.*`
    )
    .setFooter({ text: `Codé avec ❤️ par Saez | Coup n°${state.fullmoveNumber} • Échecs & Mat : ${state.isGameOver ? 'Partie terminée' : 'En cours'}` });
  if (state.inCheck) {
    embed.addFields({ name: '⚠️ Échec au Roi !', value: 'Le roi est attaqué et doit parer l\'échec.' });
  }
  if (state.isGameOver) {
    const winMsg = state.winner === 'draw' ? '🤝 Match nul !' : `🏆 Victoire des ${state.winner === 'w' ? 'Blancs' : 'Noirs'} ! (${state.reason})`;
    embed.setTitle('🏁 Fin de la Partie d\'Échecs');
    embed.addFields({ name: 'Résultat final', value: winMsg });
  }
  return embed;
}
export function buildSudokuEmbed(session) {
  const grid = session.gameState.currentGrid;
  const ascii = Sudoku.renderSudokuAscii(grid);
  const embed = new EmbedBuilder()
    .setTitle(`🔢 Grille de Sudoku [Niveau : ${session.difficulty.toUpperCase()}]`)
    .setColor(0x38bdf8)
    .setDescription(
      `Complétez les cases avec les chiffres 1 à 9 sans répétition par ligne, colonne et bloc 3x3 :\n\n` +
      `\`\`\`\n${ascii}\n\`\`\`\n` +
      `📝 **Commandes :**\n` +
      `• Remplir : \`/cassetete sudoku action:remplir coord:B5 valeur:7\`\n` +
      `• Effacer : \`/cassetete sudoku action:effacer coord:B5\`\n` +
      `• Indice : \`/cassetete sudoku action:indice\`\n` +
      `• Vérifier : \`/cassetete sudoku action:verifier\``
    )
    .setFooter({ text: `Codé avec ❤️ par Saez | Indices utilisés : ${session.gameState.hintsUsed} • Erreurs : ${session.gameState.mistakes}` });
  if (session.gameState.isCompleted) {
    embed.setTitle('🎉 Félicitations ! Sudoku Résolu avec Succès !');
    embed.setColor(0x10b981);
  }
  return embed;
}
export function buildMorpionComponents(session) {
  const rows = [];
  const board = session.gameState.board;
  for (let r = 0; r < 3; r++) {
    const row = new ActionRowBuilder();
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const cell = board[idx];
      let label = ' ';
      let style = ButtonStyle.Secondary;
      if (cell === 'X') {
        label = '❌';
        style = ButtonStyle.Primary;
      } else if (cell === 'O') {
        label = '⭕';
        style = ButtonStyle.Danger;
      }
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`cassetete_morpion_${session.id}_${idx}`)
          .setLabel(label)
          .setStyle(style)
          .setDisabled(session.gameState.isOver || cell !== null)
      );
    }
    rows.push(row);
  }
  return rows;
}
export function buildPuissance4Components(session) {
  const row = new ActionRowBuilder();
  for (let c = 0; c < 7; c++) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`cassetete_p4_${session.id}_${c}`)
        .setLabel(`${c + 1}`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(session.gameState.isOver || session.gameState.board[0][c] !== null)
    );
  }
  return [row];
}
export function buildPuissance4Embed(session) {
  const board = session.gameState.board;
  let display = '';
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 7; c++) {
      display += (board[r][c] || '⚪') + ' ';
    }
    display += '\n';
  }
  display += '1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣';
  const turnPlayer = session.gameState.turn === '🔴'
    ? `<@${session.hostUserId}>`
    : (session.isVsAI ? '🤖 IA' : `<@${session.opponentUserId}>`);
  const embed = new EmbedBuilder()
    .setTitle('🔴 Puissance 4 🟡')
    .setColor(session.gameState.turn === '🔴' ? 0xef4444 : 0xfbbf24)
    .setDescription(
      `Au tour de : **${turnPlayer}** (${session.gameState.turn})\n\n${display}\n\n*Cliquez sur un bouton 1-7 pour laisser tomber votre jeton !*`
    )
    .setFooter({ text: 'Codé avec ❤️ par Saez' });
  if (session.gameState.isOver) {
    if (session.gameState.winner === 'draw') {
      embed.addFields({ name: '🤝 Match Nul !', value: 'La grille est pleine.' });
    } else {
      embed.addFields({ name: '🏆 Victoire !', value: `Félicitations au joueur ${session.gameState.winner} !` });
      embed.setColor(0x10b981);
    }
  }
  return embed;
}
export function build2048Components(session) {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`cassetete_2048_${session.id}_up`).setLabel('⬆️ Haut').setStyle(ButtonStyle.Primary).setDisabled(session.gameState.isGameOver)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`cassetete_2048_${session.id}_left`).setLabel('⬅️ Gauche').setStyle(ButtonStyle.Primary).setDisabled(session.gameState.isGameOver),
    new ButtonBuilder().setCustomId(`cassetete_2048_${session.id}_down`).setLabel('⬇️ Bas').setStyle(ButtonStyle.Primary).setDisabled(session.gameState.isGameOver),
    new ButtonBuilder().setCustomId(`cassetete_2048_${session.id}_right`).setLabel('➡️ Droite').setStyle(ButtonStyle.Primary).setDisabled(session.gameState.isGameOver)
  );
  return [row1, row2];
}
export function build2048Embed(session) {
  const ascii = Puzzles.render2048Ascii(session.gameState.grid);
  const embed = new EmbedBuilder()
    .setTitle('🕹️ Jeu 2048 Saez')
    .setColor(0xf59e0b)
    .setDescription(
      `Score actuel : **${session.gameState.score}** • Coups : **${session.gameState.moves}**\n\n` +
      `\`\`\`\n${ascii}\n\`\`\`\n` +
      `*Utilisez les touches directionnelles ci-dessous pour faire glisser et fusionner les tuiles.*`
    )
    .setFooter({ text: 'Codé avec ❤️ par Saez' });
  if (session.gameState.isWon) {
    embed.addFields({ name: '🏆 Tuile 2048 Débloquée !', value: 'Vous avez atteint 2048 ! Vous pouvez continuer à jouer pour le meilleur score.' });
  }
  if (session.gameState.isGameOver) {
    embed.setTitle('💀 Game Over - Jeu 2048');
    embed.setColor(0xef4444);
    embed.addFields({ name: 'Partie terminée', value: `Score final : **${session.gameState.score}** points.` });
  }
  return embed;
}
export function buildMorpionEmbed(session) {
  const turnPlayer = session.gameState.turn === 'X'
    ? `<@${session.hostUserId}> (❌)`
    : (session.isVsAI ? '🤖 IA Minimax (⭕)' : `<@${session.opponentUserId}> (⭕)`);
  const embed = new EmbedBuilder()
    .setTitle('❌ Morpion (Tic-Tac-Toe) ⭕')
    .setColor(session.gameState.turn === 'X' ? 0x00e5ff : 0xec4899)
    .setDescription(
      `Partie : <@${session.hostUserId}> vs ${session.isVsAI ? '🤖 IA' : `<@${session.opponentUserId}>`}\n` +
      `Au tour de : **${turnPlayer}**\n\n` +
      `*Cliquez sur une case libre de la grille ci-dessous pour placer votre symbole !*`
    )
    .setFooter({ text: 'Codé avec ❤️ par Saez' });
  if (session.gameState.isOver) {
    if (session.gameState.winner === 'draw') {
      embed.setTitle('🤝 Match Nul au Morpion !');
      embed.addFields({ name: 'Fin de partie', value: 'Égalité parfaite entre les joueurs.' });
      embed.setColor(0x94a3b8);
    } else {
      const winnerName = session.gameState.winner === 'X'
        ? `<@${session.hostUserId}>`
        : (session.isVsAI ? '🤖 L\'IA' : `<@${session.opponentUserId}>`);
      embed.setTitle('🏆 Victoire au Morpion !');
      embed.addFields({ name: 'Vainqueur', value: `Bravo à ${winnerName} pour sa victoire éclatante !` });
      embed.setColor(0x10b981);
    }
  }
  return embed;
}
export function buildDuelInvitationComponents(duelId) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`cassetete_duel_accept_${duelId}`)
      .setLabel('⚔️ Accepter le Défi')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`cassetete_duel_decline_${duelId}`)
      .setLabel('❌ Refuser')
      .setStyle(ButtonStyle.Danger)
  );
  return [row];
}
export async function handleCasseteteButton(interaction) {
  const { customId, user, guild } = interaction;
  if (customId.startsWith('cassetete_duel_accept_')) {
    const duelId = customId.replace('cassetete_duel_accept_', '');
    const res = await acceptDuel(duelId, user.id);
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.reason}`, ephemeral: true });
    }
    const { session } = res;
    let embed;
    let components = [];
    if (session.gameType === 'echecs') {
      embed = buildChessEmbed(session);
    } else if (session.gameType === 'morpion') {
      embed = buildMorpionEmbed(session);
      components = buildMorpionComponents(session);
    } else if (session.gameType === 'puissance4') {
      embed = buildPuissance4Embed(session);
      components = buildPuissance4Components(session);
    }
    return await interaction.update({
      content: `⚔️ **Défi accepté !** La partie de **${session.gameType}** entre <@${session.hostUserId}> et <@${session.opponentUserId}> commence !`,
      embeds: [embed],
      components,
    });
  }
  if (customId.startsWith('cassetete_duel_decline_')) {
    const duelId = customId.replace('cassetete_duel_decline_', '');
    const res = await declineDuel(duelId, user.id);
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.reason}`, ephemeral: true });
    }
    return await interaction.update({
      content: `❌ Le défi a été refusé par <@${user.id}>.`,
      components: [],
    });
  }
  if (customId.startsWith('cassetete_morpion_')) {
    const parts = customId.split('_');
    const sessionId = parts[2];
    const cellIdx = parseInt(parts[3], 10);
    const session = await getSession(sessionId);
    if (!session || session.status !== 'active') {
      return await interaction.reply({ content: '❌ Cette partie n\'est plus active.', ephemeral: true });
    }
    const isPlayerX = user.id === session.hostUserId;
    const isPlayerO = user.id === session.opponentUserId;
    if (session.gameState.turn === 'X' && !isPlayerX) {
      return await interaction.reply({ content: `⏳ Ce n'est pas votre tour ! Attendez <@${session.hostUserId}>.`, ephemeral: true });
    }
    if (session.gameState.turn === 'O' && !isPlayerO && !session.isVsAI) {
      return await interaction.reply({ content: `⏳ Ce n'est pas votre tour ! Attendez <@${session.opponentUserId}>.`, ephemeral: true });
    }
    if (!isPlayerX && !isPlayerO) {
      return await interaction.reply({ content: '👀 Vous êtes simple spectateur de cette partie !', ephemeral: true });
    }
    const moveRes = Puzzles.playMorpionMove(session.gameState, cellIdx);
    if (!moveRes.success) {
      return await interaction.reply({ content: `❌ ${moveRes.reason}`, ephemeral: true });
    }
    if (!session.gameState.isOver && session.isVsAI && session.gameState.turn === 'O') {
      const aiMove = Puzzles.getMorpionBestMoveAI(session.gameState.board);
      if (aiMove !== -1) {
        Puzzles.playMorpionMove(session.gameState, aiMove);
      }
    }
    if (session.gameState.isOver) {
      session.status = 'finished';
      if (session.gameState.winner === 'X') {
        await recordGameResult(session.hostUserId, 'morpion', 'win', 15, guild, interaction.member?.user);
        if (session.opponentUserId) await recordGameResult(session.opponentUserId, 'morpion', 'loss', 15);
      } else if (session.gameState.winner === 'O') {
        if (session.opponentUserId) await recordGameResult(session.opponentUserId, 'morpion', 'win', 15);
        await recordGameResult(session.hostUserId, 'morpion', 'loss', 15);
      } else {
        await recordGameResult(session.hostUserId, 'morpion', 'draw', 5);
        if (session.opponentUserId) await recordGameResult(session.opponentUserId, 'morpion', 'draw', 5);
      }
    }
    await saveSession(session);
    const embed = buildMorpionEmbed(session);
    const components = buildMorpionComponents(session);
    return await interaction.update({ embeds: [embed], components });
  }
  if (customId.startsWith('cassetete_p4_')) {
    const parts = customId.split('_');
    const sessionId = parts[2];
    const colIdx = parseInt(parts[3], 10);
    const session = await getSession(sessionId);
    if (!session || session.status !== 'active') {
      return await interaction.reply({ content: '❌ Cette partie n\'est plus active.', ephemeral: true });
    }
    const isPlayerRed = user.id === session.hostUserId;
    const isPlayerYellow = user.id === session.opponentUserId;
    if (session.gameState.turn === '🔴' && !isPlayerRed) {
      return await interaction.reply({ content: `⏳ Ce n'est pas votre tour ! Attendez <@${session.hostUserId}>.`, ephemeral: true });
    }
    if (session.gameState.turn === '🟡' && !isPlayerYellow && !session.isVsAI) {
      return await interaction.reply({ content: `⏳ Ce n'est pas votre tour ! Attendez <@${session.opponentUserId}>.`, ephemeral: true });
    }
    if (!isPlayerRed && !isPlayerYellow) {
      return await interaction.reply({ content: '👀 Vous êtes spectateur de cette partie !', ephemeral: true });
    }
    const dropRes = Puzzles.dropPuissance4Piece(session.gameState, colIdx);
    if (!dropRes.success) {
      return await interaction.reply({ content: `❌ ${dropRes.reason}`, ephemeral: true });
    }
    if (!session.gameState.isOver && session.isVsAI && session.gameState.turn === '🟡') {
      const aiCol = Puzzles.getPuissance4BestMoveAI(session.gameState.board, '🟡');
      Puzzles.dropPuissance4Piece(session.gameState, aiCol);
    }
    if (session.gameState.isOver) {
      session.status = 'finished';
      if (session.gameState.winner === '🔴') {
        await recordGameResult(session.hostUserId, 'puissance4', 'win', 20, guild, interaction.member?.user);
        if (session.opponentUserId) await recordGameResult(session.opponentUserId, 'puissance4', 'loss', 20);
      } else if (session.gameState.winner === '🟡') {
        if (session.opponentUserId) await recordGameResult(session.opponentUserId, 'puissance4', 'win', 20);
        await recordGameResult(session.hostUserId, 'puissance4', 'loss', 20);
      } else {
        await recordGameResult(session.hostUserId, 'puissance4', 'draw', 10);
        if (session.opponentUserId) await recordGameResult(session.opponentUserId, 'puissance4', 'draw', 10);
      }
    }
    await saveSession(session);
    const embed = buildPuissance4Embed(session);
    const components = buildPuissance4Components(session);
    return await interaction.update({ embeds: [embed], components });
  }
  if (customId.startsWith('cassetete_2048_')) {
    const parts = customId.split('_');
    const sessionId = parts[2];
    const dir = parts[3];
    const session = await getSession(sessionId);
    if (!session || session.status !== 'active') {
      return await interaction.reply({ content: '❌ Cette partie n\'est plus active.', ephemeral: true });
    }
    if (user.id !== session.hostUserId) {
      return await interaction.reply({ content: '❌ Seul le joueur ayant lancé cette session peut jouer ses tuiles !', ephemeral: true });
    }
    const slideRes = Puzzles.slide2048(session.gameState, dir);
    if (session.gameState.isGameOver) {
      session.status = 'finished';
      await recordGameResult(session.hostUserId, '2048', 'win', Math.floor(session.gameState.score / 100), guild, interaction.member?.user);
    }
    await saveSession(session);
    const embed = build2048Embed(session);
    const components = build2048Components(session);
    return await interaction.update({ embeds: [embed], components });
  }
}
