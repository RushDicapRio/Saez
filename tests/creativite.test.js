import assert from 'node:assert/strict';
import {
  resetMemoryStore,
  addReadingBook,
  getReadingBookById,
  updateReadingBook,
  deleteReadingBook,
  getUserReadingBooks,
  recordReadingSession,
  addReadingQuote,
  toggleReadingBookFavorite,
  toggleReadingBookArchive,
  getReadingStats,
  createBookClub,
  joinBookClub,
  leaveBookClub,
  suggestBookToClub,
  voteClubBook,
  addRecipe,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  searchRecipes,
  getRandomRecipe,
  calculateRecipePortions,
  generateGroceryList,
  convertCookingUnits,
  duplicateRecipe,
  addStorySentence,
  getStorySentences,
  createStory,
  getStoryById,
  updateStory,
  deleteStory,
  getUserStories,
  addOrUpdateChapter,
  addStoryCharacter,
  analyzeWritingText,
  createLetter,
  getLetterById,
  getUserLetters,
  deleteLetter,
  LETTER_TEMPLATES,
  createPoem,
  getPoemById,
  getUserPoems,
  deletePoem,
  estimateSyllables,
  checkHaikuStructure,
  findFrenchRhymes,
  addWorldBuildingElement,
  getWorldBuildingElements,
  createUniverse,
  getUserUniverses,
  addUniverseElement,
  getUniverseElements,
  checkUniverseConsistency,
  addCollectionItem,
  getUserCollection,
  deleteCollectionItem,
  getCollectionStats,
  getCreativeChallenge,
  getRandomInspiration,
  addCreativeIdea,
  getUserIdeas,
  deleteCreativeIdea,
  createCreativeProject,
  getUserProjects,
  joinCreativeProject,
  addProjectTask,
  publishToGallery,
  getGalleryItems,
  likeGalleryItem,
  searchAllUserCreations,
  getUserConsolidatedStats,
  exportUserCreations,
  validateAndImportUserCreations,
} from '../services/creativeHubService.js';
import { data as creativiteCommandData } from '../commands/creativite/creativite.js';
console.log('🧪 ========================================================');
console.log('🧪 DÉBUT DE LA SUITE DE TESTS DU MODULE CRÉATIVITÉ (SAEZ BOT)');
console.log('🧪 ========================================================\n');
let testsPassed = 0;
let testsFailed = 0;
async function test(name, fn) {
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
async function runAllTests() {
  resetMemoryStore();
  const USER_A = 'user_111111111111111111';
  const USER_B = 'user_222222222222222222';
  const GUILD_1 = 'guild_999999999999999999';
  await test('0.1 - Structure SlashCommandBuilder de /creativite valide pour Discord', () => {
    const json = creativiteCommandData.toJSON();
    assert.equal(json.name, 'creativite', 'Le nom de commande doit être creativite');
    assert(json.description.length > 5, 'La description doit être présente');
    assert.equal(json.options.length, 25, 'Doit contenir exactement 25 options à la racine (limite Discord)');
    const subNames = json.options.filter(o => o.type === 1).map(o => o.name);
    assert(subNames.includes('lecture-suivi'), 'Doit inclure lecture-suivi');
    assert(subNames.includes('mes-lectures'), 'Doit inclure mes-lectures');
    assert(subNames.includes('chercher-recette'), 'Doit inclure chercher-recette');
    assert(subNames.includes('lire-histoire'), 'Doit inclure lire-histoire');
    assert(subNames.includes('ma-collection'), 'Doit inclure ma-collection');
    const groupNames = json.options.filter(o => o.type === 2).map(o => o.name);
    assert.equal(groupNames.length, 10, 'Doit contenir 10 groupes d\'ateliers');
    assert(groupNames.includes('lecture'));
    assert(groupNames.includes('recette'));
    assert(groupNames.includes('histoire'));
    assert(groupNames.includes('lettre'));
    assert(groupNames.includes('poesie'));
    assert(groupNames.includes('worldbuilding'));
    assert(groupNames.includes('collection'));
    assert(groupNames.includes('inspiration'));
    assert(groupNames.includes('projet'));
    assert(groupNames.includes('galerie'));
  });
  let book1, book2;
  await test('1.1 - addReadingBook : ajout d\'un manga avec tomes', async () => {
    book1 = await addReadingBook(USER_A, {
      title: 'Chainsaw Man',
      author: 'Tatsuki Fujimoto',
      category: 'Manga',
      currentVolume: 5,
      totalVolumes: 15,
      rating: 5,
      tags: ['Action', 'Démons', 'Shonen'],
    });
    assert(book1._id.startsWith('book_'), 'ID doit être préfixé par book_');
    assert.equal(book1.title, 'Chainsaw Man');
    assert.equal(book1.currentVolume, 5);
    assert.equal(book1.totalVolumes, 15);
    assert.equal(book1.status, 'En cours');
  });
  await test('1.2 - addReadingBook : ajout d\'un roman terminé automatiquement', async () => {
    book2 = await addReadingBook(USER_A, {
      title: 'L\'Étranger',
      author: 'Albert Camus',
      category: 'Roman',
      currentVolume: 1,
      totalVolumes: 1,
    });
    assert.equal(book2.status, 'Terminé', 'Doit être marqué terminé car currentVolume >= totalVolumes');
  });
  await test('1.3 - recordReadingSession : progression de lecture', async () => {
    const updated = await recordReadingSession(USER_A, book1._id, {
      volumesRead: 2,
      pagesRead: 380,
      minutes: 45,
      note: 'Combat incroyable !',
    });
    assert.equal(updated.currentVolume, 7, 'Le tome actuel doit être 7');
    assert.equal(updated.sessions.length, 1, 'Une session doit être enregistrée');
    assert.equal(updated.sessions[0].minutes, 45);
  });
  await test('1.4 - addReadingQuote & toggleReadingBookFavorite', async () => {
    const quoted = await addReadingQuote(USER_A, book1._id, {
      quote: 'Les rêves simples sont parfois les plus précieux.',
      page: 124,
    });
    assert.equal(quoted.quotes.length, 1);
    assert.equal(quoted.quotes[0].page, 124);
    const fav = await toggleReadingBookFavorite(USER_A, book1._id);
    assert.equal(fav.isFavorite, true);
  });
  await test('1.5 - getUserReadingBooks & getReadingStats', async () => {
    const list = await getUserReadingBooks(USER_A);
    assert.equal(list.length, 2);
    const stats = await getReadingStats(USER_A);
    assert.equal(stats.total, 2);
    assert.equal(stats.finished, 1);
    assert.equal(stats.inProgress, 1);
    assert.equal(stats.totalVolumesRead, 8); 
  });
  await test('1.6 - Clubs de lecture : création, adhésion et vote', async () => {
    const club = await createBookClub(GUILD_1, USER_A, 'SaezReader', {
      name: 'Club Manga & Shonen',
      currentBook: 'Jujutsu Kaisen',
    });
    assert.equal(club.name, 'Club Manga & Shonen');
    assert.equal(club.members.length, 1);
    await joinBookClub(club._id, USER_B, 'OtakuB');
    const updatedClub = await createBookClub; // verify through suggestion
    const sug = await suggestBookToClub(club._id, USER_B, 'OtakuB', 'Frieren');
    assert.equal(sug.title, 'Frieren');
    const voteRes = await voteClubBook(club._id, USER_A, sug.id);
    assert.equal(voteRes.voted, true);
    assert.equal(voteRes.votesCount, 2);
  });
  let rec1;
  await test('2.1 - addRecipe : création d\'une recette complète', async () => {
    rec1 = await addRecipe({
      title: 'Ramen Tonkotsu Ichiraku',
      description: 'Le bouillon réconfortant préféré de Naruto',
      category: 'Anime Food',
      ingredients: ['400g nouilles ramen', '4 tranches de porc chashu', '2 œufs mollets marinés', '1L bouillon de porc', '2 oignons verts'],
      steps: ['Cuire les nouilles 3 minutes.', 'Verser le bouillon brûlant.', 'Dresser le porc, les œufs et les oignons.'],
      prepTime: '30 min',
      cookTime: '15 min',
      servings: 2,
      difficulty: 'Moyen',
      authorId: USER_A,
      authorName: 'ChefSaez',
    });
    assert(rec1._id.startsWith('rec_'));
    assert.equal(rec1.ingredients.length, 5);
    assert.equal(rec1.servings, 2);
  });
  await test('2.2 - calculateRecipePortions : calcul précis des portions proportionnelles', () => {
    const scaled = calculateRecipePortions(rec1, 4);
    assert.equal(scaled.ratio, 2);
    assert(scaled.scaledIngredients[0].includes('800 g') || scaled.scaledIngredients[0].includes('800g'), '400g * 2 = 800g');
    assert(scaled.scaledIngredients[1].includes('8 tranches'), '4 tranches * 2 = 8 tranches');
    assert(scaled.scaledIngredients[2].includes('4 œufs'), '2 œufs * 2 = 4 œufs');
  });
  await test('2.3 - convertCookingUnits : conversions métriques et culinaires', () => {
    assert.equal(convertCookingUnits(2500, 'g', 'kg'), '2.5 kg');
    assert.equal(convertCookingUnits(1.5, 'kg', 'g'), '1500 g');
    assert.equal(convertCookingUnits(750, 'ml', 'cl'), '75 cl');
    assert.equal(convertCookingUnits(2, 'l', 'ml'), '2000 ml');
    assert.equal(convertCookingUnits(180, 'c', 'f'), '356 °F');
    assert.equal(convertCookingUnits(350, 'f', 'c'), '177 °C');
  });
  await test('2.4 - generateGroceryList & duplicateRecipe', async () => {
    const list = generateGroceryList([rec1]);
    assert.equal(list.length, 5);
    assert(list[0].startsWith('[ ]'));
    const dup = await duplicateRecipe(rec1._id, USER_B, 'GourmetB');
    assert.equal(dup.authorId, USER_B);
    assert(dup.title.includes('GourmetB'));
  });
  let story1;
  await test('3.1 - addStorySentence & getStorySentences (conte collectif)', async () => {
    await addStorySentence(GUILD_1, USER_A, 'AuteurA', 'Au commencement, il n\'y avait qu\'une étincelle.');
    await addStorySentence(GUILD_1, USER_B, 'AuteurB', 'Puis l\'étincelle embrasa le grand arbre monde.');
    const sentences = await getStorySentences(GUILD_1);
    assert.equal(sentences.length, 2);
    assert(sentences[0].text.includes('étincelle'));
  });
  await test('3.2 - createStory & addOrUpdateChapter', async () => {
    story1 = await createStory(USER_A, 'SaezRomancier', GUILD_1, {
      title: 'Les Chroniques d\'Astralis',
      genre: 'Fantasy',
      summary: 'Une quête à travers les constellations déchues.',
      wordGoal: 20000,
    });
    const chap1Content = 'Le vent soufflait sur les crêtes d\'Obsidienne. Valen ajusta sa cape et observa la comète traverser la voûte céleste avec fracas.';
    const updated = await addOrUpdateChapter(story1._id, USER_A, {
      chapterNumber: 1,
      title: 'L\'Étoile Tombee',
      content: chap1Content,
    });
    assert.equal(updated.chapters.length, 1);
    assert.equal(updated.chapters[0].title, 'L\'Étoile Tombee');
    assert(updated.totalWords > 15, 'Doit compter les mots du chapitre');
  });
  await test('3.3 - analyzeWritingText : comptage de mots et métriques', () => {
    const sample = 'Premier paragraphe avec plusieurs mots intéressants.\n\nDeuxième paragraphe pour le test métrique.';
    const res = analyzeWritingText(sample);
    assert.equal(res.paragraphs, 2);
    assert.equal(res.words, 12);
    assert(res.characters > 50);
  });
  let letter1;
  await test('4.1 - createLetter & getLetterById avec protection de confidentialité', async () => {
    letter1 = await createLetter(USER_A, 'SaezAuteur', {
      title: 'Remerciements pour le tournoi',
      recipient: 'Maître de Guilde',
      tone: 'Chaleureuse',
      template: 'remerciements',
      content: 'Merci infiniment pour l\'organisation impeccable de cet événement.',
      isPrivate: true,
    });
    assert(letter1._id.startsWith('let_'));
    assert.equal(letter1.isPrivate, true);
    const viewAuthor = await getLetterById(letter1._id, USER_A);
    assert.equal(viewAuthor.title, 'Remerciements pour le tournoi');
    await assert.rejects(
      async () => await getLetterById(letter1._id, USER_B),
      /protégée par son auteur/,
      'Un tiers ne doit pas pouvoir lire une lettre privée'
    );
  });
  await test('4.2 - Modèles de lettres intégrés', () => {
    assert(LETTER_TEMPLATES.remerciements);
    assert(LETTER_TEMPLATES.anniversaire);
    assert(LETTER_TEMPLATES.futur);
    assert(LETTER_TEMPLATES.fictif);
  });
  let poem1;
  await test('5.1 - createPoem & checkHaikuStructure', async () => {
    const haikuText = 'Feuille qui s\'envole\nDans le souffle du grand vent\nL\'automne s\'éveille';
    poem1 = await createPoem(USER_A, 'PoeteSaez', GUILD_1, {
      title: 'Souffle d\'Automne',
      form: 'Haïku',
      content: haikuText,
      theme: 'Saisons',
    });
    assert.equal(poem1.verses.length, 3);
    const haikuRes = checkHaikuStructure(haikuText);
    assert.equal(haikuRes.isHaiku, true, 'Doit valider la structure classique 5-7-5');
  });
  await test('5.2 - estimateSyllables & findFrenchRhymes', () => {
    const syl1 = estimateSyllables('Dans le souffle du grand vent');
    assert(syl1 >= 6 && syl1 <= 8, 'Doit estimer environ 7 syllabes');
    const rhymesFleur = findFrenchRhymes('fleur');
    assert(rhymesFleur.includes('cœur') || rhymesFleur.includes('bonheur'), 'Doit proposer cœur ou bonheur');
    const rhymesVent = findFrenchRhymes('vent');
    assert(rhymesVent.includes('temps') || rhymesVent.includes('moment'), 'Doit proposer des rimes en -ent/-ant');
  });
  let uni1;
  await test('6.1 - createUniverse & addUniverseElement', async () => {
    uni1 = await createUniverse(USER_A, 'WorldCrafter', GUILD_1, {
      name: 'Néovalia',
      genre: 'Aetherpunk & Magie',
      description: 'Archipel d\'îles flottantes alimentées par des cristaux d\'éther.',
    });
    const el1 = await addUniverseElement(uni1._id, USER_A, 'WorldCrafter', GUILD_1, {
      title: 'Guilde des Navigateurs Célestes',
      category: 'Faction',
      description: 'Ordre de pilotes qui cartographient les courants d\'éther.',
    });
    const el2 = await addUniverseElement(uni1._id, USER_A, 'WorldCrafter', GUILD_1, {
      title: 'L\'Archipel Suspendu',
      category: 'Géographie',
      description: 'Trois cents îles maintenues en lévitation au-dessus du vortex.',
    });
    const elements = await getUniverseElements(uni1._id);
    assert.equal(elements.length, 2);
  });
  await test('6.2 - checkUniverseConsistency : rapport de complétude', async () => {
    const report = await checkUniverseConsistency(uni1._id);
    assert.equal(report.checklist.hasGeography, true);
    assert.equal(report.checklist.hasFactions, true);
    assert.equal(report.checklist.hasMagicOrTech, false);
    assert(report.suggestions.length > 0);
  });
  await test('7.1 - addCollectionItem & getCollectionStats', async () => {
    await addCollectionItem(USER_A, {
      name: 'Figurine Gojo Satoru 1/7',
      category: 'Figurine',
      rarity: 'Édition Limitée',
      condition: 'Neuf',
      estimatedValue: '180 €',
    });
    await addCollectionItem(USER_A, {
      name: 'One Piece Tome 100 Collector',
      category: 'Manga',
      rarity: 'Collector',
      condition: 'Excellent',
      estimatedValue: '35€',
    });
    const stats = await getCollectionStats(USER_A);
    assert.equal(stats.total, 2);
    assert.equal(stats.categories['Figurine'], 1);
    assert.equal(stats.categories['Manga'], 1);
    assert(stats.totalEstimatedValue.includes('215'), '180 + 35 = 215€');
  });
  await test('8.1 - getCreativeChallenge & addCreativeIdea', async () => {
    const chalDaily = getCreativeChallenge('daily');
    assert(chalDaily.title);
    assert(chalDaily.prompt);
    const chalWeekly = getCreativeChallenge('weekly');
    assert(chalWeekly.title);
    const idea = await addCreativeIdea(USER_A, {
      text: 'Un arbre millénaire qui fleurit quand quelqu\'un réalise son rêve.',
      domain: 'Worldbuilding',
      tags: ['Magie', 'Nature'],
    });
    const userIdeas = await getUserIdeas(USER_A);
    assert.equal(userIdeas.length, 1);
    assert.equal(userIdeas[0].text, idea.text);
  });
  await test('9.1 - Projets : création, adhésion et assignation de tâches', async () => {
    const proj = await createCreativeProject(USER_A, 'LeaderSaez', GUILD_1, {
      title: 'Anthologie des Brumes',
      type: 'Recueil de recettes',
      description: 'Livre de cuisine collaboratif du serveur.',
    });
    await joinCreativeProject(proj._id, USER_B, 'CoChefB', 'Illustrateur');
    const task = await addProjectTask(proj._id, USER_A, {
      title: 'Dessiner les illustrations des bentos',
      assignedTo: 'CoChefB',
    });
    assert.equal(task.title, 'Dessiner les illustrations des bentos');
    const userProjects = await getUserProjects(USER_B, GUILD_1);
    assert.equal(userProjects.length, 1);
  });
  await test('10.1 - publishToGallery & likeGalleryItem', async () => {
    const pub = await publishToGallery(USER_A, 'ArtisteA', GUILD_1, {
      creationType: 'poeme',
      creationId: poem1._id,
      title: 'Haïku d\'Automne Partagé',
      previewContent: poem1.content,
    });
    assert(pub._id.startsWith('gal_'));
    const galleryItems = await getGalleryItems(GUILD_1);
    assert.equal(galleryItems.length, 1);
    const likeRes = await likeGalleryItem(pub._id, USER_B);
    assert.equal(likeRes.liked, true);
    assert.equal(likeRes.totalLikes, 1);
    const unlikeRes = await likeGalleryItem(pub._id, USER_B);
    assert.equal(unlikeRes.liked, false);
    assert.equal(unlikeRes.totalLikes, 0);
  });
  await test('11.1 - searchAllUserCreations & getUserConsolidatedStats', async () => {
    const searchRes = await searchAllUserCreations(USER_A, 'Chainsaw');
    assert.equal(searchRes.books.length, 1);
    const consolidated = await getUserConsolidatedStats(USER_A);
    assert(consolidated.grandTotal >= 8, 'Doit cumuler les différentes créations de l\'utilisateur');
    assert.equal(consolidated.booksCount, 2);
    assert.equal(consolidated.recipesCount, 1);
    assert.equal(consolidated.storiesCount, 1);
    assert.equal(consolidated.lettersCount, 1);
    assert.equal(consolidated.collectionsCount, 2);
  });
  await test('12.1 - Export JSON et Markdown', async () => {
    const jsonExp = await exportUserCreations(USER_A, 'json');
    assert(jsonExp.filename.endsWith('.json'));
    const parsed = JSON.parse(jsonExp.content);
    assert.equal(parsed.userId, USER_A);
    assert(parsed.data.books.length >= 2);
    const mdExp = await exportUserCreations(USER_A, 'markdown');
    assert(mdExp.filename.endsWith('.md'));
    assert(mdExp.content.includes('# 🎨 ATELIER CRÉATIF SAEZ'));
    assert(mdExp.content.includes('Chainsaw Man'));
  });
  await test('12.2 - Import JSON sécurisé avec validation et tolérance aux erreurs', async () => {
    const payload = JSON.stringify({
      version: '1.0.0',
      data: {
        books: [
          { title: 'Death Note', author: 'Tsugumi Ohba', category: 'Manga', totalVolumes: 12, currentVolume: 12 },
          { title: 'Tokyo Ghoul', author: 'Sui Ishida', category: 'Manga', totalVolumes: 14, currentVolume: 10 },
        ],
        recipes: [
          { title: 'Dorayaki Doremon', category: 'Dessert', ingredients: ['farine', 'aneth'], steps: ['cuire'] },
        ],
        poems: [
          { title: 'Lune Blanche', form: 'Haïku', content: 'Lune dans le ciel\nBrille dans la douce nuit\nPaix sur le monde' },
        ],
      },
    });
    const res = await validateAndImportUserCreations(USER_B, 'ImportUserB', payload);
    assert.equal(res.success, true);
    assert.equal(res.importedCount, 4, 'Doit importer 2 livres + 1 recette + 1 poème');
    await assert.rejects(
      async () => await validateAndImportUserCreations(USER_B, 'UserB', 'Format Invalide Non JSON'),
      /Format de fichier invalide/
    );
  });
  console.log('\n========================================================');
  console.log(`🏁 FIN DES TESTS : ${testsPassed} passés, ${testsFailed} échoués.`);
  console.log('========================================================\n');
  if (testsFailed > 0) {
    process.exit(1);
  }
}
runAllTests();
