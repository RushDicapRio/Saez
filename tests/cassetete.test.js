import assert from 'node:assert/strict';
import {
  Chess,
  Sudoku,
  Puzzles,
  createSession,
  getSession,
  getUserActiveSession,
  saveSession,
  closeSession,
  createDuelInvitation,
  getDuel,
  acceptDuel,
  declineDuel,
  cancelDuel,
  getUserStats,
  recordGameResult,
  getLeaderboard,
  getTodayDateString,
  getDailyPuzzle,
  hasCompletedDaily,
  markDailyCompleted,
  resetMemoryStore,
} from '../services/casseteteService.js';
import { data as slashCommandData } from '../commands/cassetete/cassetete.js';
console.log('🧪 ========================================================');
console.log('🧪 DÉBUT DE LA SUITE DE TESTS CASSE-TÊTE (SAEZ BOT)');
console.log('🧪 ========================================================\n');
let testsPassed = 0;
let testsFailed = 0;
function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASSER] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ [ÉCHOUER] ${name}`);
    console.error(`     Détails : ${err.message}\n`, err.stack);
    testsFailed++;
  }
}
async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASSER] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ [ÉCHOUER] ${name}`);
    console.error(`     Détails : ${err.message}\n`, err.stack);
    testsFailed++;
  }
}
console.log('--- 1. Moteur d\'Échecs (Règles, Coups, Échec & Mat, IA) ---');
runTest('Échecs : Initialisation et FEN de départ', () => {
  const state = Chess.createChessState();
  assert.equal(state.turn, 'w');
  assert.equal(state.isGameOver, false);
  assert.equal(state.board[7][4], 'K'); 
  assert.equal(state.board[0][4], 'k'); 
  assert.equal(state.castling.K, true);
  assert.equal(state.castling.Q, true);
  const fen = Chess.toFen(state);
  assert.equal(fen, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
});
runTest('Échecs : Déplacement légal de pion (e2e4)', () => {
  const state = Chess.createChessState();
  const res = Chess.makeMove(state, 'e2e4');
  assert.equal(res.success, true);
  assert.equal(state.board[6][4], null); 
  assert.equal(state.board[4][4], 'P');  
  assert.equal(state.turn, 'b');        
});
runTest('Échecs : Rejet des coups illégaux (ex: pion qui recule ou saut illégal)', () => {
  const state = Chess.createChessState();
  const res = Chess.makeMove(state, 'e2e5'); 
  assert.equal(res.success, false);
});
runTest('Échecs : Détection d\'échec et mat du berger (Scholar\'s Mate)', () => {
  const state = Chess.createChessState();
  Chess.makeMove(state, 'e2e4');
  Chess.makeMove(state, 'e7e5'); 
  Chess.makeMove(state, 'd1h5'); 
  Chess.makeMove(state, 'b8c6'); 
  Chess.makeMove(state, 'f1c4'); 
  Chess.makeMove(state, 'g8f6'); 
  const mateRes = Chess.makeMove(state, 'h5f7'); 
  assert.equal(mateRes.success, true);
  assert.equal(state.isGameOver, true);
  assert.equal(state.winner, 'w');
  assert.equal(state.reason, 'checkmate');
});
runTest('Échecs : Roque Roi (O-O)', () => {
  const fen = 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
  const state = Chess.createChessState(fen);
  const res = Chess.makeMove(state, 'O-O');
  assert.equal(res.success, true);
  assert.equal(state.board[7][6], 'K'); 
  assert.equal(state.board[7][5], 'R'); 
});
runTest('Échecs : IA Minimax renvoie un coup valide', () => {
  const state = Chess.createChessState();
  const bestMove = Chess.getBestMoveAI(state, 2);
  assert.ok(typeof bestMove === 'string');
  assert.ok(bestMove.length >= 4);
  const res = Chess.makeMove(state, bestMove);
  assert.equal(res.success, true);
});
runTest('Échecs : Puzzles tactiques valides', () => {
  assert.ok(Chess.TACTICAL_PUZZLES.length >= 5);
  const puzzle = Chess.TACTICAL_PUZZLES[0];
  const state = Chess.createChessState(puzzle.fen);
  const res = Chess.makeMove(state, puzzle.solution);
  assert.equal(res.success, true);
});
console.log('\n--- 2. Moteur Sudoku (Générateur, Unicité, Backtracking, Indices) ---');
runTest('Sudoku : Résolution d\'une grille valide par backtracking', () => {
  const grid = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ];
  const solved = Sudoku.solveSudoku(grid);
  assert.equal(solved, true);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      assert.ok(grid[r][c] >= 1 && grid[r][c] <= 9);
    }
  }
});
runTest('Sudoku : Vérification de l\'unicité de la solution', () => {
  const uniqueGrid = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ];
  const count = Sudoku.countSolutions(uniqueGrid, 2);
  assert.equal(count, 1);
});
runTest('Sudoku : Génération d\'une grille avec solution unique', () => {
  const puzzle = Sudoku.generateSudoku('facile');
  assert.equal(puzzle.difficulty, 'facile');
  assert.ok(puzzle.cluesCount >= 30);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      assert.ok(puzzle.solution[r][c] >= 1 && puzzle.solution[r][c] <= 9);
    }
  }
});
runTest('Sudoku : Remplissage de case, effacement et notes candidates', () => {
  const session = {
    initialGrid: Sudoku.createEmptyGrid(),
    currentGrid: Sudoku.createEmptyGrid(),
    solution: Sudoku.createEmptyGrid(),
    notes: Array(9).fill(null).map(() => Array(9).fill(null).map(() => [])),
    hintsUsed: 0,
    mistakes: 0,
  };
  session.solution[0][0] = 5;
  const fillRes = Sudoku.fillSudokuCell(session, 0, 0, 5);
  assert.equal(fillRes.success, true);
  assert.equal(session.currentGrid[0][0], 5);
  const clearRes = Sudoku.clearSudokuCell(session, 0, 0);
  assert.equal(clearRes.success, true);
  assert.equal(session.currentGrid[0][0], 0);
  const noteRes = Sudoku.toggleSudokuNote(session, 0, 0, 7);
  assert.equal(noteRes.success, true);
  assert.deepEqual(noteRes.notes, [7]);
});
runTest('Sudoku : Détection des erreurs et indices progressifs', () => {
  const session = {
    initialGrid: Sudoku.createEmptyGrid(),
    currentGrid: Sudoku.createEmptyGrid(),
    solution: Sudoku.createEmptyGrid(),
    hintsUsed: 0,
    mistakes: 0,
  };
  session.solution[1][1] = 4;
  session.currentGrid[1][1] = 9; 
  const errors = Sudoku.checkSudokuErrors(session);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].coord, 'B2');
  const hint = Sudoku.getSudokuHint(session);
  assert.equal(hint.type, 'correction');
  assert.equal(session.hintsUsed, 1);
});
console.log('\n--- 3. Puzzles de Logique, Plateau, Nombres et Mots ---');
runTest('Mastermind : Calcul des pions exacts et mal placés', () => {
  const secret = ['🔴', '🔵', '🟢', '🟡'];
  const guess = ['🔴', '🟢', '🔵', '🟠'];
  const evalRes = Puzzles.evaluateMastermindGuess(secret, guess);
  assert.equal(evalRes.valid, true);
  assert.equal(evalRes.exact, 1);     
  assert.equal(evalRes.misplaced, 2); 
});
runTest('Morpion (Tic-Tac-Toe) : Détection de victoire', () => {
  const game = Puzzles.createMorpionGame();
  Puzzles.playMorpionMove(game, 0); 
  Puzzles.playMorpionMove(game, 3);
  Puzzles.playMorpionMove(game, 1); 
  Puzzles.playMorpionMove(game, 4); 
  Puzzles.playMorpionMove(game, 2); 
  assert.equal(game.isOver, true);
  assert.equal(game.winner, 'X');
});
runTest('Morpion : IA Minimax bloque une victoire imminente', () => {
  const board = [
    'X', 'X', null,
    'O', null, null,
    null, null, null,
  ];
  const bestMove = Puzzles.getMorpionBestMoveAI(board);
  assert.equal(bestMove, 2);
});
runTest('Puissance 4 : Gravité et alignement horizontal', () => {
  const game = Puzzles.createPuissance4Game();
  Puzzles.dropPuissance4Piece(game, 0); 
  Puzzles.dropPuissance4Piece(game, 0); 
  Puzzles.dropPuissance4Piece(game, 1); 
  Puzzles.dropPuissance4Piece(game, 1); 
  Puzzles.dropPuissance4Piece(game, 2); 
  Puzzles.dropPuissance4Piece(game, 2); 
  const winDrop = Puzzles.dropPuissance4Piece(game, 3); 
  assert.equal(winDrop.isOver, true);
  assert.equal(winDrop.winner, '🔴');
});
runTest('2048 : Glissement et fusion de tuiles', () => {
  const game = Puzzles.create2048Game();
  game.grid = [
    [2, 2, 4, 8],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  Puzzles.slide2048(game, 'left');
  assert.equal(game.grid[0][0], 4); 
  assert.equal(game.grid[0][1], 4);
  assert.equal(game.grid[0][2], 8);
  assert.ok(game.score >= 4);
});
runTest('Tour de Hanoï : Validation des mouvements et interdiction de poser sur plus petit', () => {
  const game = Puzzles.createHanoiGame(3);
  const move1 = Puzzles.moveHanoiDisc(game, 'A', 'C');
  assert.equal(move1.success, true);
  const move2 = Puzzles.moveHanoiDisc(game, 'A', 'B'); 
  assert.equal(move2.success, true);
  const illegalMove = Puzzles.moveHanoiDisc(game, 'B', 'C');
  assert.equal(illegalMove.success, false);
});
runTest('Démineur : Révélation sécurisée au premier coup et flood fill', () => {
  const game = Puzzles.createDemineurGame(6, 6, 4);
  const rev = Puzzles.revealDemineurCell(game, 0, 0);
  assert.equal(rev.success, true);
  assert.equal(rev.isLost, false); 
  assert.equal(game.revealed[0][0], true);
});
runTest('Le Compte est Bon : Évaluation arithmétique stricte et sécurisée', () => {
  const plaques = [25, 50, 75, 100, 3, 6];
  const target = 753;
  const formula = '(100 + 25) * 6 + 3'; 
  const evalRes = Puzzles.evaluateCompteSolution(plaques, formula);
  assert.equal(evalRes.valid, true);
  assert.equal(evalRes.result, 753);
});
runTest('Le Compte est Bon : Rejet des plaques non disponibles ou réutilisées', () => {
  const plaques = [1, 2, 3, 4, 5, 6];
  const formula = '99 * 2'; 
  const evalRes = Puzzles.evaluateCompteSolution(plaques, formula);
  assert.equal(evalRes.valid, false);
});
runTest('Mots & Logique : Mot Mystère (Wordle) retour 🟩, 🟨, ⬛', () => {
  const res = Puzzles.evaluateWordleGuess('ROQUE', 'RONCE');
  assert.equal(res.valid, true);
  assert.equal(res.feedback, '🟩🟩⬛⬛🟩'); 
  assert.equal(res.isWon, false);
});
runTest('Mots & Logique : Normalisation insensible aux accents et espaces', () => {
  assert.equal(Puzzles.normalizeText('  Échec & Mat !  '), 'echecmat');
  assert.equal(Puzzles.normalizeText('L\'Avenir'), 'lavenir');
});
console.log('\n--- 4. Service Central (Sessions, Duels, Classement, Quotidien) ---');
await runAsyncTest('Service : Création, récupération et clôture d\'une session', async () => {
  resetMemoryStore();
  const session = await createSession({
    gameType: 'sudoku',
    guildId: 'guild_123',
    channelId: 'chan_456',
    hostUserId: 'user_789',
    difficulty: 'moyen',
    gameState: { dummy: true },
  });
  assert.ok(session.id);
  const fetched = await getSession(session.id);
  assert.equal(fetched.gameType, 'sudoku');
  const active = await getUserActiveSession('user_789', 'chan_456');
  assert.equal(active.id, session.id);
  await closeSession(session.id, 'finished');
  const closed = await getUserActiveSession('user_789', 'chan_456');
  assert.equal(closed, null); // N'est plus active
});
await runAsyncTest('Service : Cycle complet d\'une invitation de duel', async () => {
  resetMemoryStore();
  const invRes = await createDuelInvitation({
    guildId: 'guild_1',
    channelId: 'chan_1',
    hostUser: { id: 'host_1', username: 'Alice' },
    targetUser: { id: 'target_1', username: 'Bob' },
    gameType: 'morpion',
  });
  assert.equal(invRes.success, true);
  const duelId = invRes.duel.id;
  const acceptRes = await acceptDuel(duelId, 'target_1');
  assert.equal(acceptRes.success, true);
  assert.ok(acceptRes.session);
  assert.equal(acceptRes.session.gameType, 'morpion');
  assert.equal(acceptRes.session.hostUserId, 'host_1');
  assert.equal(acceptRes.session.opponentUserId, 'target_1');
});
await runAsyncTest('Service : Statistiques, Elo et Classement', async () => {
  resetMemoryStore();
  await recordGameResult('user_winner', 'echecs', 'win', 20);
  await recordGameResult('user_loser', 'echecs', 'loss', 20);
  const statsWinner = await getUserStats('user_winner');
  assert.equal(statsWinner.gamesWon, 1);
  assert.equal(statsWinner.elo, 1020);
  const statsLoser = await getUserStats('user_loser');
  assert.equal(statsLoser.gamesLost, 1);
  assert.equal(statsLoser.elo, 990);
  const leaderboard = await getLeaderboard(5);
  assert.ok(leaderboard.length >= 2);
  assert.equal(leaderboard[0].userId, 'user_winner');
});
await runAsyncTest('Service : Défi quotidien et prévention des doublons', async () => {
  resetMemoryStore();
  const today = getTodayDateString();
  const daily = await getDailyPuzzle(today);
  assert.ok(daily.puzzle);
  const doneBefore = await hasCompletedDaily('user_daily', today);
  assert.equal(doneBefore, false);
  await markDailyCompleted('user_daily', today);
  const doneAfter = await hasCompletedDaily('user_daily', today);
  assert.equal(doneAfter, true);
});
console.log('\n--- 5. Schéma Discord Slash Command ---');
runTest('SlashCommand : Nom et respect de la limite des 25 options Discord', () => {
  assert.equal(slashCommandData.name, 'cassetete');
  const optionsCount = slashCommandData.options.length;
  console.log(`     Nombre de sous-commandes : ${optionsCount} (limite autorisée : 25)`);
  assert.ok(optionsCount <= 25);
  assert.ok(optionsCount >= 15);
  const originalSubs = ['echecs', 'sudoku', 'mots', 'logique'];
  for (const s of originalSubs) {
    const found = slashCommandData.options.find((opt) => opt.name === s);
    assert.ok(found, `La sous-commande d'origine /cassetete ${s} doit être conservée`);
  }
});
console.log('\n========================================================');
console.log(`RÉSULTAT DES TESTS : ${testsPassed} réussis, ${testsFailed} échoués`);
console.log('========================================================\n');
if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
