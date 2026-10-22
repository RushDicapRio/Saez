import assert from 'node:assert/strict';
import {
  addBookmark,
  getUserBookmarks,
  getBookmarkById,
  updateBookmark,
  deleteBookmark,
  toggleFavorite,
  togglePin,
  toggleArchive,
  recordBookmarkVisit,
  duplicateBookmark,
  createCollection,
  getUserCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  moveBookmark,
  getUserTags,
  addTagToBookmark,
  removeTagFromBookmark,
  findDuplicateByUrl,
  findAllDuplicates,
  getRandomBookmarks,
  isUrlSafe,
  exportUserBookmarks,
  importUserBookmarks,
  getUserBookmarkStats,
  getUserBookmarkQuota,
  resetMemoryStore,
} from '../services/bookmarkService.js';
console.log('🧪 ========================================================');
console.log('🧪 DÉBUT DE LA SUITE DE TESTS DU MODULE BOOKMARK (SAEZ BOT)');
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
  resetMemoryStore();
  const USER_ALICE = 'user_alice_123';
  const USER_BOB = 'user_bob_456';
  console.log('📌 Test 1 : Ajout de marque-page et rétrocompatibilité ascendante');
  await runAsyncTest('Ajout avec titre, URL, tags et note privée', async () => {
    const bm = await addBookmark(USER_ALICE, {
      title: 'Documentation Saez',
      url: 'https://saez-animes.com/docs',
      tags: ['doc', 'officiel'],
      note: 'Note ultra secrète pour Alice',
      isFavorite: true,
    });
    assert.ok(bm._id.startsWith('bm_'));
    assert.equal(bm.title, 'Documentation Saez');
    assert.equal(bm.url, 'https://saez-animes.com/docs');
    assert.equal(bm.content, 'https://saez-animes.com/docs', 'Le champ legacy content doit être renseigné');
    assert.equal(bm.isFavorite, true);
    assert.equal(bm.tags.length, 2);
    assert.equal(bm.note, 'Note ultra secrète pour Alice');
  });
  await runAsyncTest('Ajout selon la signature historique (args séparés)', async () => {
    const legacy = await addBookmark(USER_ALICE, 'Lien GitHub', 'https://github.com/saez/anistream', 'Dev');
    assert.equal(legacy.title, 'Lien GitHub');
    assert.equal(legacy.url, 'https://github.com/saez/anistream');
    assert.equal(legacy.category, 'Dev');
  });
  console.log('\n📌 Test 2 : Détection intelligente des doublons d\'URLs');
  await runAsyncTest('Rejet des doublons d\'URL identiques', async () => {
    let duplicateErrorThrown = false;
    try {
      await addBookmark(USER_ALICE, {
        title: 'Doublon Saez Docs',
        url: 'https://saez-animes.com/docs/',
      });
    } catch (err) {
      if (err.code === 'DUPLICATE_URL') {
        duplicateErrorThrown = true;
      }
    }
    assert.equal(duplicateErrorThrown, true, 'Un doublon d\'URL doit déclencher DUPLICATE_URL');
  });
  await runAsyncTest('Autorisation de doublon volontaire avec allowDuplicate', async () => {
    const dup = await addBookmark(USER_ALICE, {
      title: 'Doublon Volontaire',
      url: 'https://saez-animes.com/docs',
      allowDuplicate: true,
    });
    assert.ok(dup._id, 'Le doublon volontaire doit être accepté');
  });
  console.log('\n📌 Test 3 : Modification et suppression de marque-pages');
  await runAsyncTest('Mise à jour partielle des champs', async () => {
    const bm = await addBookmark(USER_ALICE, {
      title: 'Titre Original',
      url: 'https://example.com/test',
    });
    const res = await updateBookmark(USER_ALICE, bm._id, {
      title: 'Titre Modifié',
      description: 'Super description',
    });
    assert.equal(res.success, true);
    assert.equal(res.bookmark.title, 'Titre Modifié');
    assert.equal(res.bookmark.description, 'Super description');
  });
  await runAsyncTest('Suppression d\'un marque-page', async () => {
    const bm = await addBookmark(USER_ALICE, {
      title: 'À supprimer',
      url: 'https://example.com/delete-me',
    });
    const deleted = await deleteBookmark(USER_ALICE, bm._id);
    assert.equal(deleted, true);
    const check = await getBookmarkById(USER_ALICE, bm._id);
    assert.equal(check, null, 'Le marque-page supprimé doit être introuvable');
  });
  console.log('\n📌 Test 4 : Création, gestion et suppression de collections');
  let testColId = null;
  await runAsyncTest('Création d\'une collection thématique', async () => {
    const col = await createCollection(USER_ALICE, {
      name: 'Animes Favoris',
      description: 'Ma sélection d\'animes de la saison',
      emoji: '🎬',
    });
    assert.ok(col._id.startsWith('col_'));
    assert.equal(col.name, 'Animes Favoris');
    assert.equal(col.emoji, '🎬');
    testColId = col._id;
    const list = await getUserCollections(USER_ALICE);
    assert.ok(list.some((c) => c._id === testColId));
  });
  await runAsyncTest('Déplacement d\'un marque-page vers une collection', async () => {
    const bm = await addBookmark(USER_ALICE, {
      title: 'Frieren Streaming',
      url: 'https://saez.com/frieren',
    });
    const moveRes = await moveBookmark(USER_ALICE, bm._id, testColId);
    assert.equal(moveRes.success, true);
    const updatedBm = await getBookmarkById(USER_ALICE, bm._id);
    assert.equal(updatedBm.collectionId, testColId);
  });
  await runAsyncTest('Suppression de collection avec préservation des liens orphelins', async () => {
    const colTemp = await createCollection(USER_ALICE, { name: 'Temp Col' });
    const bm = await addBookmark(USER_ALICE, {
      title: 'Lien Temp',
      url: 'https://example.com/temp',
      collectionId: colTemp._id,
    });
    await deleteCollection(USER_ALICE, colTemp._id, false); // Conserver les liens
    const checkBm = await getBookmarkById(USER_ALICE, bm._id);
    assert.ok(checkBm);
    assert.equal(checkBm.collectionId, null, 'Le lien orphelin doit avoir collectionId réinitialisé à null');
  });
  console.log('\n📌 Test 5 : Recherche multi-critères et pagination');
  await runAsyncTest('Recherche par mot-clé dans les titres et URLs', async () => {
    await addBookmark(USER_ALICE, {
      title: 'Apprendre VueJS et Vite',
      url: 'https://vuejs.org',
      tags: ['frontend', 'javascript'],
    });
    const searchRes = await getUserBookmarks(USER_ALICE, { search: 'vuejs' });
    assert.ok(searchRes.length >= 1);
    assert.ok(searchRes.some((b) => b.title.includes('VueJS')));
    const tagSearch = await getUserBookmarks(USER_ALICE, { tag: 'frontend' });
    assert.ok(tagSearch.some((b) => b.title.includes('VueJS')));
  });
  console.log('\n📌 Test 6 : Confidentialité des notes privées et partage sécurisé');
  await runAsyncTest('Le partage ne doit JAMAIS exposer la note personnelle secrète', async () => {
    const bmPrivate = await addBookmark(USER_ALICE, {
      title: 'Compte Personnel',
      url: 'https://myaccount.com',
      note: 'Mon mot de passe ultra confidentiel ne doit jamais fuiter !',
      isPrivate: false, 
    });
    const viewAlice = await getBookmarkById(USER_ALICE, bmPrivate._id, true);
    assert.equal(viewAlice.note, 'Mon mot de passe ultra confidentiel ne doit jamais fuiter !');
    const viewBob = await getBookmarkById(USER_BOB, bmPrivate._id, true);
    assert.ok(viewBob, 'Bob doit pouvoir consulter le lien partagé');
    assert.equal(viewBob.note, null, 'La note privée doit être strictement masquée pour Bob');
  });
  console.log('\n📌 Test 7 : Isolation stricte des données entre utilisateurs');
  await runAsyncTest('Bob ne peut pas supprimer ni modifier un marque-page privé d\'Alice', async () => {
    const bmAlice = await addBookmark(USER_ALICE, {
      title: 'Projet Secret Alice',
      url: 'https://secret.alice.com',
      isPrivate: true,
    });
    const viewBob = await getBookmarkById(USER_BOB, bmAlice._id, true);
    assert.equal(viewBob, null, 'Un tiers ne doit pas pouvoir lire un favori privé');
    const editBob = await updateBookmark(USER_BOB, bmAlice._id, { title: 'Hack' });
    assert.equal(editBob.success, false);
    const delBob = await deleteBookmark(USER_BOB, bmAlice._id);
    assert.equal(delBob, false);
    const checkAlice = await getBookmarkById(USER_ALICE, bmAlice._id);
    assert.equal(checkAlice.title, 'Projet Secret Alice');
  });
  console.log('\n📌 Test 8 : Sécurité réseau et protection anti-SSRF (isUrlSafe)');
  runTest('Rejet des URLs privées, localhost et protocoles non autorisés', () => {
    assert.equal(isUrlSafe('http://localhost:8080/admin').safe, false);
    assert.equal(isUrlSafe('http://127.0.0.1/secret').safe, false);
    assert.equal(isUrlSafe('http://192.168.1.1/router').safe, false);
    assert.equal(isUrlSafe('http://10.0.0.1/internal').safe, false);
    assert.equal(isUrlSafe('http://169.254.169.254/latest/meta-data/').safe, false);
    assert.equal(isUrlSafe('file:///etc/passwd').safe, false);
    assert.equal(isUrlSafe('ftp://serveur.com').safe, false);
    assert.equal(isUrlSafe('https://google.com').safe, true);
    assert.equal(isUrlSafe('http://saez-animes.com/anime/123').safe, true);
  });
  console.log('\n📌 Test 9 : Exportation et Importation (JSON & CSV)');
  await runAsyncTest('Export JSON complet avec manifeste et données valides', async () => {
    const exportedJson = await exportUserBookmarks(USER_ALICE, { format: 'json' });
    assert.equal(exportedJson.format, 'json');
    assert.ok(exportedJson.data.length > 0);
    const parsed = JSON.parse(exportedJson.data.toString('utf-8'));
    assert.ok(parsed.manifest);
    assert.equal(parsed.manifest.userId, USER_ALICE);
    assert.ok(Array.isArray(parsed.bookmarks));
    assert.ok(parsed.bookmarks.length > 0);
  });
  await runAsyncTest('Export CSV conforme', async () => {
    const exportedCsv = await exportUserBookmarks(USER_ALICE, { format: 'csv' });
    assert.equal(exportedCsv.format, 'csv');
    const text = exportedCsv.data.toString('utf-8');
    assert.ok(text.includes('ID,Titre,URL,Tags,Collection,Favori,Date_Creation'));
  });
  await runAsyncTest('Importation JSON avec détection et évitement des doublons', async () => {
    const payload = {
      bookmarks: [
        { title: 'Nouveau Lien Importé', url: 'https://imported-site.com', tags: ['test'] },
        { title: 'Autre Lien', url: 'https://saez-animes.com/docs' }, // déjà existant
      ],
    };
    const importRes = await importUserBookmarks(USER_ALICE, JSON.stringify(payload), { onDuplicate: 'ignore' });
    assert.equal(importRes.importedCount, 1, 'Seul le lien non-doublon doit être importé');
    assert.equal(importRes.skippedCount, 1, 'Le doublon doit être ignoré');
  });
  await runAsyncTest('Rejet d\'un fichier importé malformé', async () => {
    let errorThrown = false;
    try {
      await importUserBookmarks(USER_ALICE, 'not a json file !!!');
    } catch {
      errorThrown = true;
    }
    assert.equal(errorThrown, true, 'Un JSON invalide doit être rejeté');
  });
  console.log('\n📌 Test 10 : Statistiques, Quotas et Tirage Aléatoire');
  await runAsyncTest('Calcul des statistiques d\'utilisation', async () => {
    const stats = await getUserBookmarkStats(USER_ALICE);
    assert.ok(stats.total > 0);
    assert.ok(stats.favorites >= 1);
    assert.ok(stats.collectionsCount >= 1);
  });
  await runAsyncTest('Calcul du quota utilisateur', async () => {
    const quota = await getUserBookmarkQuota(USER_ALICE);
    assert.equal(quota.maxBookmarks, 500);
    assert.equal(quota.maxCollections, 50);
    assert.ok(quota.usedBookmarks > 0);
    assert.ok(quota.percentBookmarks <= 100);
  });
  await runAsyncTest('Tirage aléatoire de marque-pages', async () => {
    const randoms = await getRandomBookmarks(USER_ALICE, 2);
    assert.equal(randoms.length, 2);
    assert.ok(randoms[0].url);
  });
  console.log('\n📌 Test 11 : Enregistrement de consultation et compteur de vues');
  await runAsyncTest('Incrémentation des visites avec /bookmark ouvrir', async () => {
    const bm = await addBookmark(USER_ALICE, {
      title: 'Lien Fréquent',
      url: 'https://frequent.com',
    });
    const v1 = await recordBookmarkVisit(USER_ALICE, bm._id);
    const v2 = await recordBookmarkVisit(USER_ALICE, bm._id);
    assert.equal(v1, 1);
    assert.equal(v2, 2);
    const check = await getBookmarkById(USER_ALICE, bm._id);
    assert.equal(check.viewCount, 2);
    assert.ok(check.lastVisitedAt);
  });
  console.log('\n📌 Test 12 : Vérification de la commande SlashCommandBuilder de /bookmark');
  await runAsyncTest('Validation de la structure de commande /bookmark et autocomplétion', async () => {
    const cmdModule = await import('../commands/bookmarks/bookmark.js');
    const cmd = cmdModule.default || cmdModule;
    assert.ok(cmd.data, 'La commande doit posséder data');
    assert.equal(cmd.data.name, 'bookmark');
    assert.equal(typeof cmd.execute, 'function');
    assert.equal(typeof cmd.autocomplete, 'function', 'Autocomplétion requise');
    const topOptions = cmd.data.options.map((o) => o.name);
    console.log(`     Options enregistrées sur /bookmark (${topOptions.length}) :`, topOptions.join(', '));
    const legacySubs = ['ajouter', 'liste', 'partager', 'supprimer'];
    for (const s of legacySubs) {
      assert.ok(topOptions.includes(s), `La sous-commande originale "${s}" doit être conservée`);
    }
    assert.ok(topOptions.includes('collection'), 'Le groupe collection doit être présent');
    assert.ok(topOptions.includes('tag'), 'Le groupe tag doit être présent');
    const expectedSubs = [
      'modifier', 'details', 'rechercher', 'ouvrir', 'favori', 'archiver',
      'epingler', 'deplacer', 'dupliquer', 'aleatoire', 'note', 'exporter',
      'importer', 'statistiques', 'verifier', 'doublons', 'historique', 'parametres', 'aide'
    ];
    for (const s of expectedSubs) {
      assert.ok(topOptions.includes(s), `La sous-commande "${s}" doit être présente`);
    }
    assert.ok(topOptions.length <= 25, 'Le total d\'options ne doit pas dépasser 25 (limite Discord)');
  });
  console.log('\n========================================================');
  console.log(`🎯 BILAN DES TESTS : ${testsPassed} réussis, ${testsFailed} échoués sur ${testsPassed + testsFailed} tests.`);
  console.log('========================================================\n');
  if (testsFailed > 0) {
    process.exit(1);
  }
}
main().catch((err) => {
  console.error('Erreur critique test bookmark :', err);
  process.exit(1);
});
