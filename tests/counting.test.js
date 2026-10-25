import assert from 'node:assert/strict';
import {
  LogicEngine,
  MiniGamesEngine,
  StatsEngine,
  DuelEngine,
  AdminEngine,
  CountingEngine,
  getCountingConfig,
  saveCountingConfig,
  resetCountingMemoryStore,
} from '../services/countingService.js';
import { data as comptageCommandData } from '../commands/counting/comptage.js';
console.log('🧪 ========================================================');
console.log('🧪 DÉBUT DE LA SUITE DE TESTS COUNTING (SAEZ BOT)');
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
console.log('--- 1. Moteur de Logique Numérique & 25 Énigmes Procédurales ---');
const puzzleTypes = [
  'arithmetic_sequence',
  'geometric_sequence',
  'hidden_rule_sequence',
  'missing_number',
  'multiples_divisors',
  'parity_alternation',
  'mental_math',
  'simple_equations',
  'number_comparison',
  'number_ordering',
  'complete_operation',
  'missing_symbols',
  'digit_puzzles',
  'constraint_logic',
  'odd_one_out',
  'magic_square',
  'math_balance',
  'combinatorics',
  'elementary_probability',
  'speed_challenge',
  'numeric_mastermind',
  'secret_number',
  'math_propositions',
  'order_of_operations',
  'multistep_logic',
];
runTest('Logique : Tous les 25 types d\'énigmes sont implémentés', () => {
  const available = LogicEngine.getAvailablePuzzleTypes();
  assert.equal(available.length, 25);
  for (const t of puzzleTypes) {
    assert.ok(available.some(a => a.type === t), `Type manquant : ${t}`);
  }
});
runTest('Logique : Génération valide et solution auto-vérifiée pour chaque type', () => {
  for (const t of puzzleTypes) {
    const puzzle = LogicEngine.generatePuzzle(t, 'facile');
    assert.ok(puzzle.id, `ID manquant pour ${t}`);
    assert.ok(puzzle.question, `Question manquante pour ${t}`);
    assert.ok(puzzle.answer, `Réponse manquante pour ${t}`);
    assert.ok(Array.isArray(puzzle.hints), `Indices manquants pour ${t}`);
    assert.ok(puzzle.explanation, `Explication manquante pour ${t}`);
    const isValid = LogicEngine.checkAnswer(puzzle, puzzle.answer);
    assert.equal(isValid, true, `La solution pour ${t} (${puzzle.answer}) n'est pas validée.`);
  }
});
runTest('Logique : Normalisation insensible aux majuscules, espaces et accents', () => {
  assert.equal(LogicEngine.normalizeAnswer('  Pair '), 'pair');
  assert.equal(LogicEngine.normalizeAnswer('Égalité'), 'egalite');
  assert.equal(LogicEngine.normalizeAnswer(' 42 '), '42');
});
runTest('Logique : Défi quotidien déterministe avec récompenses doublées', () => {
  const daily1 = LogicEngine.getDailyLogicPuzzle('2026-10-20');
  const daily2 = LogicEngine.getDailyLogicPuzzle('2026-10-20');
  assert.equal(daily1.type, daily2.type);
  assert.equal(daily1.isDaily, true);
  assert.ok(daily1.points >= 40);
});
console.log('\n--- 2. Moteur de Mini-Jeux Numériques ---');
runTest('Mini-Jeux : Nombre Mystère (logique plus grand/plus petit et victoire)', () => {
  const game = MiniGamesEngine.createMiniGame(MiniGamesEngine.MINI_GAMES.MYSTERE, { max: 100 });
  assert.equal(game.status, 'active');
  const resWrong = MiniGamesEngine.processMiniGameGuess(game, 'u1', 'Testeur', game.secret === 1 ? 2 : 1);
  assert.equal(resWrong.status, 'continue');
  const resWin = MiniGamesEngine.processMiniGameGuess(game, 'u1', 'Testeur', game.secret);
  assert.equal(resWin.status, 'won');
  assert.equal(game.status, 'won');
});
runTest('Mini-Jeux : Calcul Éclair', () => {
  const game = MiniGamesEngine.createMiniGame(MiniGamesEngine.MINI_GAMES.CALCUL);
  assert.ok(game.expected);
  const res = MiniGamesEngine.processMiniGameGuess(game, 'u1', 'User', game.expected);
  assert.equal(res.status, 'won');
});
runTest('Mini-Jeux : Code Secret (Crack the Code)', () => {
  const game = MiniGamesEngine.createMiniGame(MiniGamesEngine.MINI_GAMES.CODE_SECRET);
  assert.equal(game.code.length, 3);
  const res = MiniGamesEngine.processMiniGameGuess(game, 'u1', 'User', game.code);
  assert.equal(res.status, 'won');
});
console.log('\n--- 3. Moteur de Comptage et Validation de Salon ---');
runTest('Comptage : Validation classique incrémentale (+1)', () => {
  const cfg = { current_count: 5, mode: 'classique', variant: 'none', step: 1 };
  const v1 = CountingEngine.validatePlayerInput('6', cfg);
  assert.equal(v1.isValid, true);
  assert.equal(v1.nextCount, 6);
  const vWrong = CountingEngine.validatePlayerInput('7', cfg);
  assert.equal(vWrong.isValid, false);
});
runTest('Comptage : Variante FizzBuzz', () => {
  const cfg3 = { current_count: 2, mode: 'classique', variant: 'fizzbuzz', step: 1 };
  const vFizz = CountingEngine.validatePlayerInput('fizz', cfg3);
  assert.equal(vFizz.isValid, true);
  const cfg5 = { current_count: 4, mode: 'classique', variant: 'fizzbuzz', step: 1 };
  const vBuzz = CountingEngine.validatePlayerInput('buzz', cfg5);
  assert.equal(vBuzz.isValid, true);
  const cfg15 = { current_count: 14, mode: 'classique', variant: 'fizzbuzz', step: 1 };
  const vFizzBuzz = CountingEngine.validatePlayerInput('fizzbuzz', cfg15);
  assert.equal(vFizzBuzz.isValid, true);
});
runTest('Comptage : Variante Chiffre Interdit', () => {
  const cfg = { current_count: 6, mode: 'classique', variant: 'banned_digit', banned_digit: 7, step: 1 };
  const vSkip = CountingEngine.validatePlayerInput('skip', cfg);
  assert.equal(vSkip.isValid, true);
  assert.equal(vSkip.expectedDisplay, 'skip');
});
runTest('Comptage : Mode Inversé (compte à rebours)', () => {
  const cfg = { current_count: 50, mode: 'inverse', variant: 'none', step: 1 };
  const v = CountingEngine.validatePlayerInput('49', cfg);
  assert.equal(v.isValid, true);
  assert.equal(v.nextCount, 49);
});
console.log('\n--- 4. Statistiques, Profils, Succès & Classements ---');
await runAsyncTest('Stats : Enregistrement de count valide, série et succès', async () => {
  resetCountingMemoryStore();
  const mockGuild = { id: 'guild_1' };
  const mockUser = { id: 'user_1', username: 'SaezPlayer' };
  await StatsEngine.recordValidCount(mockGuild, mockUser, 1);
  const stats = await StatsEngine.getPlayerStats('guild_1', 'user_1');
  assert.equal(stats.counts_valid, 1);
  assert.equal(stats.current_streak, 1);
  assert.ok(stats.achievements.includes('first_count'));
  await StatsEngine.recordInvalidCount(mockGuild, mockUser);
  const statsAfterErr = await StatsEngine.getPlayerStats('guild_1', 'user_1');
  assert.equal(statsAfterErr.counts_invalid, 1);
  assert.equal(statsAfterErr.current_streak, 0);
  assert.equal(statsAfterErr.best_streak, 1);
});
await runAsyncTest('Stats : Classement et Comparaison de joueurs', async () => {
  const mockGuild = { id: 'guild_1' };
  const u1 = { id: 'user_a', username: 'Alice' };
  const u2 = { id: 'user_b', username: 'Bob' };
  await StatsEngine.recordValidCount(mockGuild, u1, 10);
  await StatsEngine.recordValidCount(mockGuild, u2, 5);
  const leaderboard = await StatsEngine.getCountingLeaderboard('guild_1', 'global', 5);
  assert.ok(leaderboard.length >= 2);
  const comp = await StatsEngine.comparePlayers('guild_1', u1, u2);
  assert.equal(comp.player1.user.username, 'Alice');
  assert.equal(comp.player2.user.username, 'Bob');
});
console.log('\n--- 5. Moteur de Duels Multijoueurs ---');
await runAsyncTest('Duels : Création, acceptation et résolution de rounds', async () => {
  const challenger = { id: 'c1', username: 'Challenger' };
  const opponent = { id: 'o1', username: 'Opponent' };
  const duel = await DuelEngine.createDuelInvitation('guild_1', 'channel_1', challenger, opponent, 2);
  assert.equal(duel.status, 'pending');
  const acceptRes = await DuelEngine.acceptDuel(duel.id, 'o1');
  assert.equal(acceptRes.success, true);
  assert.equal(acceptRes.duel.status, 'active');
  const q1 = duel.questions[0];
  const ansRes1 = await DuelEngine.submitDuelAnswer(duel.id, challenger, q1.answer);
  assert.equal(ansRes1.finished, false);
  assert.equal(duel.challenger.score, 1);
  const q2 = duel.questions[1];
  const ansRes2 = await DuelEngine.submitDuelAnswer(duel.id, challenger, q2.answer);
  assert.equal(ansRes2.finished, true);
  assert.equal(ansRes2.winner.id, 'c1');
});
console.log('\n--- 6. Administration, Diagnostic et Reset Sécurisé ---');
await runAsyncTest('Admin : Reset avec Snapshot préventif et Annulation (Undo)', async () => {
  const guildId = 'guild_reset_test';
  const adminUser = { id: 'admin_1', tag: 'Admin#0001' };
  await saveCountingConfig(guildId, { current_count: 84, high_score: 120 });
  const resetRes = await AdminEngine.resetCurrentCount(guildId, adminUser);
  assert.equal(resetRes.previousCount, 84);
  const cfgAfterReset = await getCountingConfig(guildId);
  assert.equal(cfgAfterReset.current_count, 0);
  assert.equal(cfgAfterReset.high_score, 120); 
  const restoreRes = await AdminEngine.restoreLastSnapshot(guildId, adminUser);
  assert.equal(restoreRes.success, true);
  assert.equal(restoreRes.restoredCount, 84);
  const cfgRestored = await getCountingConfig(guildId);
  assert.equal(cfgRestored.current_count, 84);
  const logs = await AdminEngine.getAuditLogs(guildId);
  assert.ok(logs.length >= 2);
  assert.equal(logs[0].action, 'RESTORE_SNAPSHOT');
});
console.log('\n--- 7. Schéma Discord Slash Command ---');
runTest('SlashCommand : /comptage respecte la limite de 25 options de Discord', () => {
  const json = comptageCommandData.toJSON();
  assert.equal(json.name, 'comptage');
  assert.ok(json.options.length <= 25, `Trop d'options au niveau 1 : ${json.options.length}`);
});
runTest('SlashCommand : /comptage conserve les sous-commandes salon, score et reset', () => {
  const json = comptageCommandData.toJSON();
  assert.equal(json.name, 'comptage');
  const subs = json.options.map(o => o.name);
  assert.ok(subs.includes('salon'));
  assert.ok(subs.includes('score'));
  assert.ok(subs.includes('reset'));
});
console.log('\n========================================================');
console.log(`RÉSULTAT DES TESTS : ${testsPassed} réussis, ${testsFailed} échoués`);
console.log('========================================================\n');
if (testsFailed > 0) {
  process.exit(1);
}
