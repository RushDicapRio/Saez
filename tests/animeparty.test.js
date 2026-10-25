import assert from 'node:assert/strict';
import { data as slashCommandData } from '../commands/animeparty/animeparty.js';
import {
  EXTENDED_QUOTES,
  SOUNDBOARD_TRACKS,
  CHARACTER_ROULETTE,
  POWER_ROULETTE,
  BLINDTEST_DATA,
  EMOJI_CHALLENGES,
  ANIME_PENDU_WORDS,
  VRAI_OU_FAUX_DATA,
  DEVINE_PERSO_DATA,
  ASSOCIATION_SETS,
  ANAGRAMMES_DATA,
  INTRUS_DATA,
  MOT_INTERDIT_CARDS,
  SCENARIO_STORIES,
  getAnimePartyProfile,
  recordPartyGameResult,
  getAnimePartyLeaderboard,
  addQuoteFavorite,
  getUserQuoteFavorites,
  getDailyChallenge,
  getWeeklyChallenge,
  createParty,
  joinParty,
  leaveParty,
  cancelParty,
  getParty,
  getGuildAnimePartyConfig,
  saveGuildAnimePartyConfig,
  submitContribution,
  getGuildContributions,
} from '../services/animePartyService.js';
console.log('🧪 ========================================================');
console.log('🧪 DÉBUT DE LA SUITE DE TESTS ANIME PARTY (SAEZ BOT)');
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
console.log('--- 1. Conformité Slash Command Discord (/animeparty) ---');
runTest('SlashCommand : Nom et description racine valides', () => {
  const json = slashCommandData.toJSON();
  assert.equal(json.name, 'animeparty');
  assert.ok(json.description && json.description.length <= 100);
  assert.ok(/^[a-z0-9_-]{1,32}$/.test(json.name));
});
runTest('SlashCommand : Respect strict de la limite Discord de 25 options de premier niveau', () => {
  const json = slashCommandData.toJSON();
  const options = json.options || [];
  assert.ok(options.length <= 25, `Options racine : ${options.length} <= 25`);
  assert.ok(options.length >= 7, `Options racine complètes : ${options.length} >= 7`);
});
runTest('SlashCommand : Sous-commandes et groupes conformes aux règles de nommage et descriptions', () => {
  const json = slashCommandData.toJSON();
  for (const opt of json.options) {
    assert.ok(/^[a-z0-9_-]{1,32}$/.test(opt.name), `Nom invalide : ${opt.name}`);
    assert.ok(opt.description && opt.description.length <= 100, `Description trop longue pour ${opt.name}`);
    if (opt.type === 2) {
      const subs = opt.options || [];
      assert.ok(subs.length <= 25, `Trop de sous-commandes dans le groupe ${opt.name} : ${subs.length}`);
      for (const sub of subs) {
        assert.ok(/^[a-z0-9_-]{1,32}$/.test(sub.name), `Sous-commande invalide : ${sub.name}`);
        assert.ok(sub.description && sub.description.length <= 100);
      }
    }
  }
});
runTest('SlashCommand : Sous-commandes historiques et attendues présentes', () => {
  const json = slashCommandData.toJSON();
  const rootNames = json.options.map((o) => o.name);
  assert.ok(rootNames.includes('citation'), 'Manque sous-commande citation');
  assert.ok(rootNames.includes('roulette'), 'Manque sous-commande roulette');
  assert.ok(rootNames.includes('scoreboard'), 'Manque sous-commande scoreboard');
  assert.ok(rootNames.includes('stat'), 'Manque sous-commande stat');
  assert.ok(rootNames.includes('party'), 'Manque sous-commande party');
  assert.ok(rootNames.includes('jeu'), 'Manque groupe jeu');
  assert.ok(rootNames.includes('multi'), 'Manque groupe multi');
  assert.ok(rootNames.includes('soundboard'), 'Manque soundboard');
  assert.ok(rootNames.includes('contribution'), 'Manque contribution');
  assert.ok(rootNames.includes('config'), 'Manque config');
});
runTest('SlashCommand : Groupe jeu contient le catalogue et tous les mini-jeux majeurs', () => {
  const json = slashCommandData.toJSON();
  const jeuGroup = json.options.find((o) => o.name === 'jeu');
  assert.ok(jeuGroup, 'Groupe jeu absent');
  const subNames = (jeuGroup.options || []).map((s) => s.name);
  assert.ok(subNames.includes('catalogue'), 'Manque catalogue interactif');
  assert.ok(subNames.includes('blindtest'), 'Manque blindtest');
  assert.ok(subNames.includes('devine-anime'), 'Manque devine-anime');
  assert.ok(subNames.includes('devine-personnage'), 'Manque devine-personnage');
  assert.ok(subNames.includes('devine-replique'), 'Manque devine-replique');
  assert.ok(subNames.includes('emoji-challenge'), 'Manque emoji-challenge');
  assert.ok(subNames.includes('anime-pendu'), 'Manque anime-pendu');
  assert.ok(subNames.includes('vrai-ou-faux'), 'Manque vrai-ou-faux');
  assert.ok(subNames.includes('morpion'), 'Manque morpion');
  assert.ok(subNames.includes('puissance4'), 'Manque puissance4');
  assert.ok(subNames.includes('anagramme'), 'Manque anagramme');
  assert.ok(subNames.includes('intrus'), 'Manque intrus');
  assert.ok(subNames.includes('arcade'), 'Manque arcade');
  assert.ok(subNames.includes('scenario'), 'Manque scenario');
});
console.log('\n--- 2. Intégrité des Données Anime Party ---');
runTest('Données : Citations complètes et authentiques', () => {
  assert.ok(Array.isArray(EXTENDED_QUOTES) && EXTENDED_QUOTES.length >= 25);
  for (const q of EXTENDED_QUOTES) {
    assert.ok(q.id && q.quote && q.character && q.anime, `Citation invalide : ${JSON.stringify(q)}`);
  }
});
runTest('Données : Blindtest audio et openings', () => {
  assert.ok(Array.isArray(BLINDTEST_DATA) && BLINDTEST_DATA.length >= 10);
  for (const b of BLINDTEST_DATA) {
    assert.ok(b.title && b.anime && b.options.length === 4);
    assert.ok(b.options.includes(b.anime), `La bonne réponse doit figurer dans les options : ${b.anime}`);
  }
});
runTest('Données : Mots de pendu et indices', () => {
  assert.ok(Array.isArray(ANIME_PENDU_WORDS) && ANIME_PENDU_WORDS.length >= 15);
  for (const p of ANIME_PENDU_WORDS) {
    assert.ok(p.word && p.hint && p.word.length >= 3);
  }
});
runTest('Données : Anecdotes Vrai ou Faux avec explications', () => {
  assert.ok(Array.isArray(VRAI_OU_FAUX_DATA) && VRAI_OU_FAUX_DATA.length >= 10);
  for (const v of VRAI_OU_FAUX_DATA) {
    assert.ok(typeof v.q === 'string' && typeof v.ans === 'boolean' && typeof v.expl === 'string');
  }
});
runTest('Données : Anagrammes et Intrus', () => {
  assert.ok(Array.isArray(ANAGRAMMES_DATA) && ANAGRAMMES_DATA.length >= 5);
  assert.ok(Array.isArray(INTRUS_DATA) && INTRUS_DATA.length >= 4);
  for (const i of INTRUS_DATA) {
    assert.ok(i.options.includes(i.intrus), `L'intrus doit figurer dans ses options : ${i.intrus}`);
  }
});
console.log('\n--- 3. Stats, Progression, Badges et Leaderboard ---');
await runAsyncTest('Service : Profil par défaut et persistance', async () => {
  const p = await getAnimePartyProfile('guild_test_1', 'user_test_1', 'OtakuTesteur');
  assert.equal(p.userId, 'user_test_1');
  assert.equal(p.username, 'OtakuTesteur');
  assert.equal(p.points, 0);
  assert.equal(p.wins, 0);
  assert.ok(Array.isArray(p.badges));
  assert.ok(p.badges.includes('Néophyte Otaku'));
});
await runAsyncTest('Service : Enregistrement de résultat et déblocage de badges', async () => {
  const res1 = await recordPartyGameResult('guild_test_1', 'user_test_1', 'OtakuTesteur', 15, true, 'Blindtest');
  assert.equal(res1.pointsEarned, 15);
  assert.equal(res1.newStreak, 1);
  const res2 = await recordPartyGameResult('guild_test_1', 'user_test_1', 'OtakuTesteur', 20, true, 'Anime-Pendu');
  assert.equal(res2.newStreak, 2);
  const res3 = await recordPartyGameResult('guild_test_1', 'user_test_1', 'OtakuTesteur', 25, true, 'Réflexe');
  assert.equal(res3.newStreak, 3);
  assert.ok(res3.badges.includes('Série Enflammée 🔥'), 'Doit débloquer le badge Série Enflammée');
  const updatedProfile = await getAnimePartyProfile('guild_test_1', 'user_test_1');
  assert.equal(updatedProfile.points, 60);
  assert.equal(updatedProfile.wins, 3);
  assert.equal(updatedProfile.gamesPlayed, 3);
  assert.equal(updatedProfile.streak, 3);
  assert.equal(updatedProfile.bestStreak, 3);
});
await runAsyncTest('Service : Scoreboard et classement ordonné', async () => {
  await recordPartyGameResult('guild_test_1', 'user_rival', 'RivalTesteur', 100, true, 'Duel');
  const lb = await getAnimePartyLeaderboard('guild_test_1', 10);
  assert.ok(lb.length >= 2);
  assert.equal(lb[0].username, 'RivalTesteur');
  assert.equal(lb[0].rank, 1);
  assert.equal(lb[1].username, 'OtakuTesteur');
  assert.equal(lb[1].rank, 2);
});
console.log('\n--- 4. Favoris, Défis Quotidiens & Hebdomadaires ---');
await runAsyncTest('Service : Ajout et consultation des favoris de citations', async () => {
  const qId = EXTENDED_QUOTES[0].id;
  const res = await addQuoteFavorite('user_test_1', qId);
  assert.equal(res.success, true);
  const favs = await getUserQuoteFavorites('user_test_1');
  assert.ok(favs.length >= 1);
  assert.equal(favs[0].id, qId);
});
runTest('Service : Défi quotidien déterministe et mesurable', () => {
  const d1 = getDailyChallenge();
  const d2 = getDailyChallenge();
  assert.equal(d1.title, d2.title);
  assert.ok(d1.bonusPoints >= 30);
  assert.ok(d1.reward.includes('points'));
});
runTest('Service : Défi hebdomadaire déterministe', () => {
  const w1 = getWeeklyChallenge();
  const w2 = getWeeklyChallenge();
  assert.equal(w1.title, w2.title);
  assert.ok(w1.bonusPoints >= 100);
});
console.log('\n--- 5. Lobbies Multijoueurs & Gestion des Sessions ---');
runTest('Lobby : Cycle de vie complet (Création, Inscription, Sortie, Annulation)', () => {
  const chanId = 'channel_lobby_test';
  const host = { id: 'host_1', username: 'HostUser' };
  const player2 = { id: 'player_2', username: 'PlayerTwo' };
  const party = createParty(chanId, host, 'quiz', { maxRounds: 5 });
  assert.equal(party.hostId, host.id);
  assert.equal(party.status, 'lobby');
  assert.equal(party.players.size, 1);
  const joinRes = joinParty(chanId, player2);
  assert.equal(joinRes.success, true);
  assert.equal(party.players.size, 2);
  const doubleJoin = joinParty(chanId, player2);
  assert.equal(doubleJoin.success, false);
  const leaveRes = leaveParty(chanId, player2);
  assert.equal(leaveRes.success, true);
  assert.equal(party.players.size, 1);
  const cancelRes = cancelParty(chanId, host);
  assert.equal(cancelRes.success, true);
  assert.equal(getParty(chanId), null);
});
console.log('\n--- 6. Configurations Serveur & Contributions ---');
await runAsyncTest('Config : Sauvegarde et lecture de la configuration guilde', async () => {
  const gId = 'guild_config_test';
  const cfg = await getGuildAnimePartyConfig(gId);
  assert.equal(cfg.guildId, gId);
  await saveGuildAnimePartyConfig(gId, {
    allowedChannelIds: ['chan_123'],
    cooldownSeconds: 5,
  });
  const updated = await getGuildAnimePartyConfig(gId);
  assert.deepEqual(updated.allowedChannelIds, ['chan_123']);
  assert.equal(updated.cooldownSeconds, 5);
});
await runAsyncTest('Contributions : Soumission et récupération', async () => {
  const res = await submitContribution('guild_test_1', 'user_test_1', 'OtakuTesteur', 'citation', 'Une belle citation.');
  assert.equal(res.success, true);
  assert.ok(res.contribution.id);
  const contribs = await getGuildContributions('guild_test_1', 'en_attente');
  assert.ok(contribs.length >= 1);
  assert.equal(contribs[0].type, 'citation');
});
console.log('\n========================================================');
console.log(`📊 BILAN DES TESTS : ${testsPassed} réussis, ${testsFailed} échoués`);
console.log('========================================================\n');
if (testsFailed > 0) {
  process.exit(1);
}
