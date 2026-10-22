import assert from 'node:assert/strict';
import { PermissionFlagsBits } from 'discord.js';
import {
  getCommunitySettings,
  saveCommunitySettings,
  isCommunityEnabled,
  getCommunityOverviewStats,
  purgeUserData,
  submitApplication,
  getApplications,
  getApplicationById,
  saveApplicationDraft,
  getApplicationDraft,
  cancelApplication,
  updateApplicationStatus,
  getApplicationStats,
  canApplyAgain,
  APPLICATION_ROLES,
  setUserBirthday,
  getUserBirthday,
  deleteUserBirthday,
  getUpcomingBirthdays,
  getTodayBirthdays,
  sendBirthdayWish,
  getBirthdayWishes,
  giveReputation,
  getUserReputation,
  getTopReputation,
  getReputationHistory,
  reportReputation,
  revokeReputation,
  submitConfession,
  getConfessions,
  getConfessionById,
  reviewConfession,
  reactToConfession,
  deleteConfessionBySecret,
  reportConfession,
  createDebate,
  getDebate,
  voteDebate,
  addDebateArgument,
  closeDebate,
  getActiveDebates,
  registerMentorProfile,
  getMentorProfile,
  searchMentors,
  requestMentorship,
  respondMentorshipRequest,
  getMentorships,
  addMentorshipPrivateNote,
  createCommunityGoal,
  getCommunityGoals,
  contributeGoal,
  sendThankYou,
  getPublicThanks,
  reactToThankYou,
  saveUserProfile,
  getUserProfile,
  searchMembersByInterests,
  calculateCompatibility,
  getRandomIcebreaker,
  createHelpRequest,
  claimHelpRequest,
  resolveHelpRequest,
  getHelpRequests,
  addMilestone,
  getMilestones,
  addGuestbookEntry,
  getGuestbookEntries,
} from '../services/communityHubService.js';
console.log('🧪 ========================================================');
console.log('🧪 DÉBUT DE LA SUITE DE TESTS DU MODULE COMMUNAUTÉ (SAEZ BOT)');
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
async function main() {
  const GUILD_ID = 'guild_communaute_test_123';
  console.log('📌 Test 1 : Paramètres et Désactivation Modulaire');
  await runAsyncTest('Configuration par défaut et activation', async () => {
    const s = await getCommunitySettings(GUILD_ID);
    assert.equal(s.enabled, true, 'Le module doit être actif par défaut');
    await saveCommunitySettings(GUILD_ID, { enabled: false, reputation_cooldown_hours: 6 });
    const disabled = await isCommunityEnabled(GUILD_ID);
    assert.equal(disabled, false, 'Le module doit pouvoir être désactivé');
    await saveCommunitySettings(GUILD_ID, { enabled: true });
    const reenabled = await isCommunityEnabled(GUILD_ID);
    assert.equal(reenabled, true, 'Le module doit pouvoir être réactivé');
  });
  console.log('\n📌 Test 2 : Recrutement & Candidatures (Cycle complet)');
  await runAsyncTest('Dépôt, brouillons, examen et statistiques', async () => {
    await saveApplicationDraft(GUILD_ID, 'user_alice', { role: APPLICATION_ROLES.MODERATEUR, motivation: 'Mon brouillon' });
    const draft = await getApplicationDraft(GUILD_ID, 'user_alice');
    assert.equal(draft.motivation, 'Mon brouillon');
    const res = await submitApplication({
      guildId: GUILD_ID,
      userId: 'user_alice',
      username: 'Alice',
      role: APPLICATION_ROLES.MODERATEUR,
      experience: '2 ans sur Saez',
      motivation: 'Protéger la communauté et accueillir les nouveaux',
      availability: 'Tous les soirs',
    });
    assert.equal(res.success, true);
    const appId = res.application._id;
    const checkAgain = await canApplyAgain(GUILD_ID, 'user_alice');
    assert.equal(checkAgain.allowed, false, 'Une candidature en cours doit bloquer un nouveau dépôt');
    const reviewRes = await updateApplicationStatus(appId, 'accepted', { id: 'admin_bob', username: 'Bob' }, { note: 'Excellente motivation' });
    assert.equal(reviewRes.success, true);
    assert.equal(reviewRes.application.status, 'accepted');
    const stats = await getApplicationStats(GUILD_ID);
    assert.ok(stats.total >= 1);
    assert.ok(stats.accepted >= 1);
  });
  console.log('\n📌 Test 3 : Anniversaires & Vœux (Confidentialité et Dédoublonnage)');
  await runAsyncTest('Enregistrement, consultation et vœux', async () => {
    await setUserBirthday(GUILD_ID, 'user_charlie', 'Charlie', 15, 6, {
      year: 2000,
      showAge: false,
      visibility: 'public',
    });
    const b = await getUserBirthday(GUILD_ID, 'user_charlie');
    assert.equal(b.day, 15);
    assert.equal(b.month, 6);
    assert.equal(b.showAge, false, 'L\'âge ne doit pas être affiché si showAge est faux');
    const wishRes = await sendBirthdayWish(GUILD_ID, 'user_charlie', 'user_david', 'Joyeux anniversaire Charlie !');
    assert.equal(wishRes.success, true);
    const selfWish = await sendBirthdayWish(GUILD_ID, 'user_charlie', 'user_charlie', 'Auto-vœu');
    assert.equal(selfWish.success, false, 'On ne peut pas se souhaiter soi-même');
    const upcoming = await getUpcomingBirthdays(GUILD_ID, 5);
    assert.ok(upcoming.length > 0);
  });
  console.log('\n📌 Test 4 : Réputation, Anti-Abus & Multi-Périodes');
  await runAsyncTest('Attribution, rejet auto-réputation, cooldown et classement', async () => {
    const selfRes = await giveReputation(GUILD_ID, 'user_eva', 'user_eva', 'Auto-rep');
    assert.equal(selfRes.success, false);
    const give1 = await giveReputation(GUILD_ID, 'user_eva', 'user_frank', 'Merci pour ton aide');
    assert.equal(give1.success, true);
    assert.ok(give1.points >= 1);
    const give2 = await giveReputation(GUILD_ID, 'user_eva', 'user_george', 'Deuxième rep trop tôt');
    assert.equal(give2.success, false, 'Le donneur doit être sous cooldown');
    const topAll = await getTopReputation(GUILD_ID, 5, 'all');
    assert.ok(topAll.some((u) => u.userId === 'user_frank'));
    const topWeek = await getTopReputation(GUILD_ID, 5, 'week');
    assert.ok(topWeek.some((u) => u.userId === 'user_frank'));
  });
  console.log('\n📌 Test 5 : Confessions (Anonymat, Validation & Suppression Sécurisée)');
  await runAsyncTest('Flux de soumission, clé secrète et suppression', async () => {
    const res = await submitConfession(GUILD_ID, 'J\'adore le générique de Naruto en cachette !', 'chan_conf', {
      isAnonymous: true,
      authorId: 'user_helen',
      category: 'anecdote',
    });
    assert.ok(res.confession._id);
    assert.ok(res.secretKey, 'Une clé secrète doit être délivrée à l\'auteur');
    const confId = res.confession._id;
    const reactRes = await reactToConfession(confId, 'user_ian', 'love');
    assert.equal(reactRes.success, true);
    assert.equal(reactRes.reactions.love, 1);
    const badDel = await deleteConfessionBySecret(confId, 'user_helen', 'FAKECR');
    assert.equal(badDel.success, false);
    const goodDel = await deleteConfessionBySecret(confId, 'user_helen', res.secretKey);
    assert.equal(goodDel.success, true);
    const check = await getConfessionById(confId);
    assert.equal(check, null, 'La confession doit être effacée');
  });
  console.log('\n📌 Test 6 : Débats Structurés (Vote, Arguments et Clôture)');
  await runAsyncTest('Création, décompte sans doublon et clôture', async () => {
    const deb = await createDebate({
      guildId: GUILD_ID,
      authorId: 'user_jack',
      authorName: 'Jack',
      topic: 'VF vs VOSTFR en anime',
      options: ['VF 👍', 'VOSTFR 🎌', 'Les deux 🤝'],
    });
    assert.equal(deb.status, 'active');
    const v1 = await voteDebate(deb._id, 'user_kyle', 1); // VOSTFR
    assert.equal(v1.success, true);
    assert.equal(v1.counts[1], 1);
    assert.equal(v1.totalVotes, 1);
    const v2 = await voteDebate(deb._id, 'user_kyle', 0); // VF
    assert.equal(v2.success, true);
    assert.equal(v2.counts[0], 1);
    assert.equal(v2.counts[1], 0);
    assert.equal(v2.totalVotes, 1, 'Le nombre total de votants uniques doit rester 1');
    const argRes = await addDebateArgument(deb._id, {
      userId: 'user_kyle',
      username: 'Kyle',
      optionIndex: 0,
      argumentText: 'Les comédiens français font un travail formidable.',
    });
    assert.equal(argRes.success, true);
    const closed = await closeDebate(deb._id, 'user_jack');
    assert.equal(closed.debate.status, 'closed');
  });
  console.log('\n📌 Test 7 : Mentorat (Profils, Demandes et Notes Privées)');
  await runAsyncTest('Inscription mentor, recherche et note privée', async () => {
    await registerMentorProfile(GUILD_ID, 'user_leo', 'Leo', {
      domains: ['Programmation & Bot'],
      bio: 'Développeur passionné JS',
    });
    const mentors = await searchMentors(GUILD_ID, 'Programmation & Bot');
    assert.ok(mentors.some((m) => m.userId === 'user_leo'));
    const req = await requestMentorship({
      guildId: GUILD_ID,
      menteeId: 'user_max',
      menteeName: 'Max',
      mentorId: 'user_leo',
      domain: 'Programmation & Bot',
      goals: 'Apprendre Discord.js v14',
    });
    assert.equal(req.success, true);
    const resp = await respondMentorshipRequest(req.mentorship._id, 'user_leo', true);
    assert.equal(resp.success, true);
    assert.equal(resp.mentorship.status, 'active');
    const note = await addMentorshipPrivateNote(req.mentorship._id, 'user_leo', 'Max progresse vite');
    assert.equal(note.success, true);
  });
  console.log('\n📌 Test 8 : Objectifs Collectifs');
  await runAsyncTest('Création et contributions', async () => {
    const goal = await createCommunityGoal({
      guildId: GUILD_ID,
      title: 'Atteindre 1000 messages d\'entraide',
      target: 100,
      unit: 'messages',
    });
    const contrib = await contributeGoal(goal._id, 25, 'user_nina', 'Nina');
    assert.equal(contrib.success, true);
    assert.equal(contrib.goal.current, 25);
    assert.equal(contrib.isCompleted, false);
    const contrib2 = await contributeGoal(goal._id, 80, 'user_nina', 'Nina');
    assert.equal(contrib2.isCompleted, true);
    assert.equal(contrib2.goal.status, 'completed');
  });
  console.log('\n📌 Test 9 : Remerciements & Mur de Gratitude');
  await runAsyncTest('Envoi et réaction', async () => {
    const thx = await sendThankYou({
      guildId: GUILD_ID,
      fromUserId: 'user_oscar',
      fromUsername: 'Oscar',
      toUserId: 'user_paul',
      toUsername: 'Paul',
      message: 'Merci infiniment pour ton accueil chaleureux !',
      category: 'accueil',
    });
    assert.equal(thx.success, true);
    const react = await reactToThankYou(thx.thank._id, 'user_quinn');
    assert.equal(react.success, true);
    assert.equal(react.count, 1);
    const publicList = await getPublicThanks(GUILD_ID, 5);
    assert.ok(publicList.length > 0);
  });
  console.log('\n📌 Test 10 : Profils & Compatibilité Amicale');
  await runAsyncTest('Calcul des points communs et brise-glace', async () => {
    await saveUserProfile(GUILD_ID, 'user_rose', 'Rose', {
      bio: 'Fan de Shonen et de jeux vidéo',
      interests: ['Anime & Manga', 'Gaming (PC / Console)'],
    });
    await saveUserProfile(GUILD_ID, 'user_sam', 'Sam', {
      bio: 'Gamer et lecteur de mangas',
      interests: ['Gaming (PC / Console)', 'Dessin & Art Digital'],
    });
    const compat = await calculateCompatibility(GUILD_ID, 'user_rose', 'user_sam');
    assert.equal(compat.success, true);
    assert.ok(compat.commonInterests.includes('Gaming (PC / Console)'));
    assert.ok(compat.score > 0);
    const q = getRandomIcebreaker();
    assert.ok(typeof q === 'string' && q.length > 10);
  });
  console.log('\n📌 Test 11 : Entraide Communautaire');
  await runAsyncTest('Création, prise en charge et clôture', async () => {
    const req = await createHelpRequest({
      guildId: GUILD_ID,
      authorId: 'user_tina',
      authorName: 'Tina',
      title: 'Problème audio dans Saez Animes',
      domain: 'Technique',
      description: 'Pas de son sur l\'épisode 3',
    });
    assert.equal(req.status, 'open');
    const claim = await claimHelpRequest(req._id, 'user_ugo', 'Ugo');
    assert.equal(claim.success, true);
    assert.equal(claim.request.status, 'assigned');
    const resolve = await resolveHelpRequest(req._id, 'user_tina');
    assert.equal(resolve.success, true);
    assert.equal(resolve.request.status, 'resolved');
  });
  console.log('\n📌 Test 12 : Souvenirs & Jalons Historiques');
  await runAsyncTest('Ajout de jalon et livre d\'or', async () => {
    const m = await addMilestone({
      guildId: GUILD_ID,
      authorId: 'user_admin',
      title: 'Lancement officiel du bot Saez',
      description: 'Ouverture du serveur',
    });
    assert.ok(m._id);
    const gb = await addGuestbookEntry({
      guildId: GUILD_ID,
      authorId: 'user_victor',
      authorName: 'Victor',
      message: 'Longue vie à Saez Animes !',
    });
    assert.ok(gb._id);
    const listM = await getMilestones(GUILD_ID);
    assert.ok(listM.length > 0);
  });
  console.log('\n📌 Test 13 : Validation de la structure SlashCommandBuilder');
  await runAsyncTest('Respect de la limite des 25 sous-commandes Discord', async () => {
    const communauteMod = await import('../commands/communaute/communaute.js');
    const candMod = await import('../commands/communaute/candidature.js');
    const mentoratMod = await import('../commands/communaute/mentorat.js');
    const confMod = await import('../commands/communaute/confession.js');
    const entraideMod = await import('../commands/communaute/entraide.js');
    const debatMod = await import('../commands/communaute/debat.js');
    const cmdCommunaute = communauteMod.data.toJSON();
    const cmdCand = candMod.data.toJSON();
    const cmdMentorat = mentoratMod.data.toJSON();
    const cmdConf = confMod.data.toJSON();
    const cmdEntraide = entraideMod.data.toJSON();
    const cmdDebat = debatMod.data.toJSON();
    console.log(`     /communaute : ${cmdCommunaute.options.length} sous-commandes (max 25)`);
    console.log(`     /candidature : ${cmdCand.options.length} sous-commandes (max 25)`);
    console.log(`     /mentorat : ${cmdMentorat.options.length} sous-commandes (max 25)`);
    console.log(`     /confession : ${cmdConf.options.length} sous-commandes (max 25)`);
    console.log(`     /entraide : ${cmdEntraide.options.length} sous-commandes (max 25)`);
    console.log(`     /debat : ${cmdDebat.options.length} sous-commandes (max 25)`);
    assert.ok(cmdCommunaute.options.length <= 25, 'La commande /communaute ne doit pas dépasser 25 options Discord');
    assert.ok(cmdCand.options.length <= 25, 'La commande /candidature ne doit pas dépasser 25 options Discord');
    assert.ok(cmdMentorat.options.length <= 25, 'La commande /mentorat ne doit pas dépasser 25 options Discord');
    assert.ok(cmdConf.options.length <= 25, 'La commande /confession ne doit pas dépasser 25 options Discord');
    assert.ok(cmdEntraide.options.length <= 25, 'La commande /entraide ne doit pas dépasser 25 options Discord');
    assert.ok(cmdDebat.options.length <= 25, 'La commande /debat ne doit pas dépasser 25 options Discord');
  });
  console.log('\n📌 Test 14 : Exécution réelle de la commande /communaute');
  await runAsyncTest('Simulation d\'exécution avec Mock Interaction', async () => {
    const communauteMod = await import('../commands/communaute/communaute.js');
    let replyResult = null;
    let editReplyResult = null;
    const mockInteraction = {
      guild: { id: GUILD_ID, name: 'Serveur Test' },
      user: { id: 'user_test', username: 'TestUser' },
      member: {
        permissions: {
          has: () => true,
        },
      },
      options: {
        getSubcommand: () => 'aide',
      },
      deferReply: async () => {},
      reply: async (payload) => { replyResult = payload; },
      editReply: async (payload) => { editReplyResult = payload; },
    };
    await communauteMod.execute(mockInteraction);
    assert.ok(replyResult, 'Une réponse doit être émise pour /communaute aide');
    assert.ok(replyResult.embeds.length > 0, 'Un embed d\'aide doit être retourné');
  });
  console.log('\n📌 Test 15 : Droit à l\'oubli & Purge RGPD');
  await runAsyncTest('Suppression des données personnelles de l\'utilisateur', async () => {
    await setUserBirthday(GUILD_ID, 'user_purge', 'PurgeMe', 1, 1);
    await saveUserProfile(GUILD_ID, 'user_purge', 'PurgeMe', { bio: 'Mon secret' });
    assert.ok(await getUserBirthday(GUILD_ID, 'user_purge'));
    assert.ok(await getUserProfile(GUILD_ID, 'user_purge'));
    await purgeUserData(GUILD_ID, 'user_purge');
    assert.equal(await getUserBirthday(GUILD_ID, 'user_purge'), null);
    assert.equal(await getUserProfile(GUILD_ID, 'user_purge'), null);
  });
  console.log('\n========================================================');
  console.log(`🎯 BILAN DES TESTS : ${testsPassed} réussis, ${testsFailed} échoués sur ${testsPassed + testsFailed} tests.`);
  console.log('========================================================\n');
  if (testsFailed > 0) {
    process.exit(1);
  }
}
main().catch((err) => {
  console.error('Erreur critique pendant l\'exécution des tests :', err);
  process.exit(1);
});
