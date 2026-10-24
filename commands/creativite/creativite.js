import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  MessageFlags,
} from 'discord.js';
import {
  addReadingBook,
  getReadingBookById,
  updateReadingBook,
  deleteReadingBook,
  getUserReadingBooks,
  recordReadingSession,
  toggleReadingBookFavorite,
  toggleReadingBookArchive,
  getReadingStats,
  createBookClub,
  getUserBookClubs,
  joinBookClub,
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
  getUniverseById,
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
  getProjectById,
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
} from '../../services/creativeHubService.js';
import {
  buildAtelierSelectMenu,
  buildHubActionRow,
  buildHubEmbed,
} from '../../services/creativiteInteractionHandler.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('creativite')
  .setDescription('Atelier de création Saez : livres, recettes, écriture, lettres, poésie, univers et collections')
  .addSubcommandGroup((grp) =>
    grp
      .setName('lecture')
      .setDescription('Bibliothèque personnelle, suivi de tomes, sessions & clubs de lecture')
      .addSubcommand((sub) =>
        sub
          .setName('ajouter')
          .setDescription('Enregistrer un livre, manga, webtoon ou roman dans sa bibliothèque')
          .addStringOption((opt) => opt.setName('titre').setDescription('Titre de l\'œuvre').setRequired(true))
          .addStringOption((opt) => opt.setName('auteur').setDescription('Auteur ou mangaka').setRequired(false))
          .addStringOption((opt) =>
            opt
              .setName('categorie')
              .setDescription('Format de l\'œuvre')
              .setRequired(false)
              .addChoices(
                { name: 'Manga 📖', value: 'Manga' },
                { name: 'Light Novel 📜', value: 'Light Novel' },
                { name: 'Webtoon 📱', value: 'Webtoon' },
                { name: 'Roman 📚', value: 'Roman' },
                { name: 'Comics 🦸', value: 'Comics' },
                { name: 'Bande Dessinée 🎨', value: 'BD' }
              )
          )
          .addIntegerOption((opt) => opt.setName('tome_actuel').setDescription('Tome ou chapitre actuel lu').setRequired(false))
          .addIntegerOption((opt) => opt.setName('total_tomes').setDescription('Nombre total de tomes parus').setRequired(false))
          .addIntegerOption((opt) => opt.setName('note').setDescription('Note personnelle (0 à 5)').setMinValue(0).setMaxValue(5).setRequired(false))
          .addStringOption((opt) => opt.setName('tags').setDescription('Tags séparés par virgules (ex: Shonen, Isekai)').setRequired(false))
      )
      .addSubcommand((sub) =>
        sub
          .setName('liste')
          .setDescription('Afficher la liste de vos livres et mangas')
          .addStringOption((opt) =>
            opt
              .setName('statut')
              .setDescription('Filtrer par statut de lecture')
              .setRequired(false)
              .addChoices(
                { name: 'En cours', value: 'En cours' },
                { name: 'Terminé', value: 'Terminé' },
                { name: 'À lire', value: 'À lire' },
                { name: 'En pause', value: 'En pause' },
                { name: 'Favoris ⭐', value: 'favoris' }
              )
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName('session')
          .setDescription('Enregistrer une session de lecture (pages ou tomes)')
          .addStringOption((opt) => opt.setName('id').setDescription('Identifiant du livre').setRequired(true).setAutocomplete(true))
          .addIntegerOption((opt) => opt.setName('tomes_lus').setDescription('Nombre de tomes lus lors de la session').setRequired(false))
          .addIntegerOption((opt) => opt.setName('pages_lues').setDescription('Nombre de pages lues').setRequired(false))
          .addIntegerOption((opt) => opt.setName('minutes').setDescription('Temps passé en minutes').setRequired(false))
          .addStringOption((opt) => opt.setName('note').setDescription('Impression ou commentaire rapide').setRequired(false))
      )
      .addSubcommand((sub) =>
        sub
          .setName('consulter')
          .setDescription('Fiche détaillée d\'un livre de votre bibliothèque')
          .addStringOption((opt) => opt.setName('id').setDescription('Identifiant du livre').setRequired(true).setAutocomplete(true))
      )
      .addSubcommand((sub) =>
        sub
          .setName('supprimer')
          .setDescription('Retirer un livre de sa bibliothèque')
          .addStringOption((opt) => opt.setName('id').setDescription('Identifiant du livre').setRequired(true).setAutocomplete(true))
      )
      .addSubcommand((sub) =>
        sub
          .setName('club')
          .setDescription('Rejoindre, créer ou proposer un livre dans un club de lecture')
          .addStringOption((opt) =>
            opt
              .setName('action')
              .setDescription('Action club')
              .setRequired(true)
              .addChoices(
                { name: 'Mes clubs', value: 'list' },
                { name: 'Créer un club', value: 'create' },
                { name: 'Proposer un livre', value: 'suggest' }
              )
          )
          .addStringOption((opt) => opt.setName('nom_ou_titre').setDescription('Nom du club ou Titre du livre suggéré').setRequired(false))
      )
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('recette')
      .setDescription('Livre de cuisine gourmand, portions proportionnelles & courses')
      .addSubcommand((sub) =>
        sub
          .setName('ajouter')
          .setDescription('Partager une nouvelle recette de cuisine')
          .addStringOption((opt) => opt.setName('titre').setDescription('Nom du plat (ex: Ramen Ichiraku)').setRequired(true))
          .addStringOption((opt) => opt.setName('ingredients').setDescription('Ingrédients séparés par virgules (ex: 200g nouilles, 2 œufs)').setRequired(true))
          .addStringOption((opt) => opt.setName('etapes').setDescription('Étapes de préparation (séparées par des points ou retours)').setRequired(true))
          .addStringOption((opt) =>
            opt
              .setName('categorie')
              .setDescription('Catégorie culinaire')
              .setRequired(false)
              .addChoices(
                { name: 'Anime Food 🎌', value: 'Anime Food' },
                { name: 'Plat Chaud 🍲', value: 'Plat Chaud' },
                { name: 'Dessert & Pâtisserie 🍰', value: 'Dessert' },
                { name: 'Entrée & Snack 🥟', value: 'Entrée' },
                { name: 'Boisson & Cocktail 🍹', value: 'Boisson' },
                { name: 'Végétarien 🥗', value: 'Végétarien' }
              )
          )
          .addIntegerOption((opt) => opt.setName('portions').setDescription('Nombre de portions (défaut : 4)').setRequired(false))
          .addStringOption((opt) => opt.setName('temps').setDescription('Temps de préparation (ex: 25 min)').setRequired(false))
          .addStringOption((opt) => opt.setName('difficulte').setDescription('Facile, Moyen, Difficile').setRequired(false))
      )
      .addSubcommand((sub) =>
        sub
          .setName('consulter')
          .setDescription('Afficher la fiche complète d\'une recette')
          .addStringOption((opt) => opt.setName('id').setDescription('Identifiant de la recette').setRequired(true).setAutocomplete(true))
      )
      .addSubcommand((sub) =>
        sub
          .setName('rechercher')
          .setDescription('Rechercher une recette par nom ou ingrédient')
          .addStringOption((opt) => opt.setName('terme').setDescription('Nom du plat ou ingrédient').setRequired(true))
      )
      .addSubcommand((sub) =>
        sub
          .setName('portions')
          .setDescription('Recalculer les quantités d\'ingrédients pour X convives')
          .addStringOption((opt) => opt.setName('id').setDescription('Identifiant de la recette').setRequired(true).setAutocomplete(true))
          .addIntegerOption((opt) => opt.setName('personnes').setDescription('Nombre de convives souhaité').setMinValue(1).setMaxValue(50).setRequired(true))
      )
      .addSubcommand((sub) =>
        sub
          .setName('courses')
          .setDescription('Générer une liste de courses à cocher depuis une recette')
          .addStringOption((opt) => opt.setName('id').setDescription('Identifiant de la recette').setRequired(true).setAutocomplete(true))
      )
      .addSubcommand((sub) =>
        sub
          .setName('aleatoire')
          .setDescription('Tirer au sort une délicieuse recette de la communauté')
          .addStringOption((opt) => opt.setName('categorie').setDescription('Catégorie spécifique').setRequired(false))
      )
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('histoire')
      .setDescription('Atelier d\'écriture, chapitres, contes collaboratifs et personnages')
      .addSubcommand((sub) =>
        sub
          .setName('creer')
          .setDescription('Créer une nouvelle histoire ou roman personnel')
          .addStringOption((opt) => opt.setName('titre').setDescription('Titre de l\'histoire').setRequired(true))
          .addStringOption((opt) =>
            opt
              .setName('genre')
              .setDescription('Genre littéraire')
              .setRequired(false)
              .addChoices(
                { name: 'Fantasy & Magie 🧙', value: 'Fantasy' },
                { name: 'Science-Fiction 🚀', value: 'Sci-Fi' },
                { name: 'Shonen / Aventure ⚔️', value: 'Shonen' },
                { name: 'Tranche de vie ☕', value: 'Tranche de vie' },
                { name: 'Romance 🌸', value: 'Romance' },
                { name: 'Horreur / Thriller 👻', value: 'Horreur' },
                { name: 'Policier 🕵️', value: 'Policier' }
              )
          )
          .addStringOption((opt) => opt.setName('resume').setDescription('Court résumé de l\'intrigue').setRequired(false))
          .addIntegerOption((opt) => opt.setName('objectif_mots').setDescription('Objectif de mots (ex: 15000)').setRequired(false))
      )
      .addSubcommand((sub) =>
        sub
          .setName('chapitre')
          .setDescription('Rédiger ou ajouter un chapitre à votre histoire')
          .addStringOption((opt) => opt.setName('histoire_id').setDescription('Identifiant de l\'histoire').setRequired(true).setAutocomplete(true))
          .addStringOption((opt) => opt.setName('titre_chapitre').setDescription('Titre du chapitre').setRequired(true))
          .addStringOption((opt) => opt.setName('contenu').setDescription('Texte du chapitre').setRequired(true))
          .addIntegerOption((opt) => opt.setName('numero').setDescription('Numéro du chapitre (facultatif)').setRequired(false))
      )
      .addSubcommand((sub) =>
        sub
          .setName('lire')
          .setDescription('Lire les chapitres d\'une histoire')
          .addStringOption((opt) => opt.setName('histoire_id').setDescription('Identifiant de l\'histoire').setRequired(true).setAutocomplete(true))
          .addIntegerOption((opt) => opt.setName('chapitre').setDescription('Numéro du chapitre à lire').setRequired(false))
      )
      .addSubcommand((sub) =>
        sub
          .setName('ecrire')
          .setDescription('Ajouter une phrase au conte collectif du serveur (Legacy)')
          .addStringOption((opt) => opt.setName('phrase').setDescription('Votre phrase ou paragraphe de suite').setRequired(true))
      )
      .addSubcommand((sub) =>
        sub
          .setName('personnage')
          .setDescription('Ajouter une fiche de personnage à votre histoire')
          .addStringOption((opt) => opt.setName('histoire_id').setDescription('Identifiant de l\'histoire').setRequired(true).setAutocomplete(true))
          .addStringOption((opt) => opt.setName('nom').setDescription('Nom du personnage').setRequired(true))
          .addStringOption((opt) => opt.setName('role').setDescription('Protagoniste, Antagoniste, Allié, Mentor...').setRequired(true))
          .addStringOption((opt) => opt.setName('description').setDescription('Apparence, histoire et motivations').setRequired(true))
      )
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('lettre')
      .setDescription('Rédaction de lettres cachetées, messages soignés et modèles de correspondance')
      .addSubcommand((sub) =>
        sub
          .setName('rediger')
          .setDescription('Rédiger une lettre personnelle ou officielle')
          .addStringOption((opt) => opt.setName('titre').setDescription('Titre ou objet de la lettre').setRequired(true))
          .addStringOption((opt) => opt.setName('contenu').setDescription('Texte de la lettre').setRequired(true))
          .addStringOption((opt) => opt.setName('destinataire').setDescription('Nom du destinataire (facultatif)').setRequired(false))
          .addStringOption((opt) =>
            opt
              .setName('tonalite')
              .setDescription('Tonalité générale')
              .setRequired(false)
              .addChoices(
                { name: 'Amicale & Chaleureuse', value: 'Amicale' },
                { name: 'Formelle & Respectueuse', value: 'Formelle' },
                { name: 'Poétique & Éloquente', value: 'Poétique' },
                { name: 'Humoristique & Légère', value: 'Humoristique' },
                { name: 'Fictive (Jeu de rôle / Lore)', value: 'Fictive' },
                { name: 'Lettre à soi-même dans le futur', value: 'Futur' }
              )
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName('consulter')
          .setDescription('Consulter une de vos lettres cachetées')
          .addStringOption((opt) => opt.setName('id').setDescription('Identifiant de la lettre').setRequired(true).setAutocomplete(true))
      )
      .addSubcommand((sub) =>
        sub
          .setName('modeles')
          .setDescription('Découvrir les modèles de lettres prédéfinis prêts à l\'emploi')
      )
      .addSubcommand((sub) =>
        sub
          .setName('liste')
          .setDescription('Consulter vos lettres rédigées et brouillons')
      )
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('poesie')
      .setDescription('Atelier poésie : haïkus, sonnets, rimes phonétiques & vers métriques')
      .addSubcommand((sub) =>
        sub
          .setName('creer')
          .setDescription('Composer et enregistrer un poème ou haïku')
          .addStringOption((opt) => opt.setName('titre').setDescription('Titre du poème').setRequired(true))
          .addStringOption((opt) => opt.setName('texte').setDescription('Vers du poème (utilisez des retours à la ligne)').setRequired(true))
          .addStringOption((opt) =>
            opt
              .setName('forme')
              .setDescription('Forme poétique')
              .setRequired(false)
              .addChoices(
                { name: 'Haïku (5-7-5) 🎋', value: 'Haïku' },
                { name: 'Sonnet (14 vers) 📜', value: 'Sonnet' },
                { name: 'Quatrain (4 vers) 🪶', value: 'Quatrain' },
                { name: 'Poésie libre ✨', value: 'Poésie libre' },
                { name: 'Poème en prose 📖', value: 'Poème en prose' },
                { name: 'Acrostiche 🔤', value: 'Acrostiche' }
              )
          )
          .addStringOption((opt) => opt.setName('theme').setDescription('Thème (ex: Amour, Nature, Mélancolie)').setRequired(false))
      )
      .addSubcommand((sub) =>
        sub
          .setName('rimes')
          .setDescription('Dictionnaire de suggestions de rimes françaises fiables')
          .addStringOption((opt) => opt.setName('mot').setDescription('Mot à faire rimer').setRequired(true))
      )
      .addSubcommand((sub) =>
        sub
          .setName('syllabes')
          .setDescription('Estimer le nombre de syllabes métriques d\'un vers')
          .addStringOption((opt) => opt.setName('vers').setDescription('Vers à analyser').setRequired(true))
      )
      .addSubcommand((sub) =>
        sub
          .setName('liste')
          .setDescription('Consulter vos poèmes et créations littéraires')
      )
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('worldbuilding')
      .setDescription('Conception d\'univers fictifs complets : géographie, lore, magie et factions')
      .addSubcommand((sub) =>
        sub
          .setName('univers')
          .setDescription('Créer un univers fictif complet')
          .addStringOption((opt) => opt.setName('nom').setDescription('Nom du monde imaginaire').setRequired(true))
          .addStringOption((opt) => opt.setName('genre').setDescription('Genre (High Fantasy, Cyberpunk, Dark Fantasy...)').setRequired(true))
          .addStringOption((opt) => opt.setName('description').setDescription('Présentation du monde et de son ambiance').setRequired(true))
      )
      .addSubcommand((sub) =>
        sub
          .setName('element')
          .setDescription('Ajouter une faction, système de magie, lieu ou règle de lore')
          .addStringOption((opt) => opt.setName('titre').setDescription('Nom de l\'élément').setRequired(true))
          .addStringOption((opt) =>
            opt
              .setName('categorie')
              .setDescription('Catégorie d\'élément')
              .setRequired(true)
              .addChoices(
                { name: '🏰 Faction / Guilde', value: 'Faction' },
                { name: '✨ Système de Magie', value: 'Magie' },
                { name: '🗺️ Géographie / Lieu', value: 'Géographie' },
                { name: '📜 Lore & Histoire', value: 'Lore' },
                { name: '⚙️ Technologie / Relique', value: 'Technologie' },
                { name: '👤 Personnage Clé', value: 'Personnage' }
              )
          )
          .addStringOption((opt) => opt.setName('description').setDescription('Explications et caractéristiques').setRequired(true))
          .addStringOption((opt) => opt.setName('univers_id').setDescription('ID de l\'univers (facultatif si serveur)').setRequired(false).setAutocomplete(true))
      )
      .addSubcommand((sub) =>
        sub
          .setName('liste')
          .setDescription('Explorer les éléments de lore et factions de l\'univers')
          .addStringOption((opt) => opt.setName('univers_id').setDescription('ID de l\'univers').setRequired(false).setAutocomplete(true))
      )
      .addSubcommand((sub) =>
        sub
          .setName('coherence')
          .setDescription('Vérifier la complétude et cohérence de votre univers')
          .addStringOption((opt) => opt.setName('univers_id').setDescription('ID de l\'univers').setRequired(true).setAutocomplete(true))
      )
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('collection')
      .setDescription('Gestionnaire d\'inventaire de collectionneur (figurines, mangas, cartes, goodies)')
      .addSubcommand((sub) =>
        sub
          .setName('ajouter')
          .setDescription('Ajouter un objet à votre collection')
          .addStringOption((opt) => opt.setName('nom').setDescription('Nom de l\'objet (ex: Nendoroid Gojo Satoru)').setRequired(true))
          .addStringOption((opt) =>
            opt
              .setName('categorie')
              .setDescription('Catégorie de l\'objet')
              .setRequired(true)
              .addChoices(
                { name: 'Figurine / Statue', value: 'Figurine' },
                { name: 'Manga / Tome rare', value: 'Manga' },
                { name: 'Carte à Jouer / TCG', value: 'Carte' },
                { name: 'Artbook / Livre d\'art', value: 'Artbook' },
                { name: 'Goodies / Vêtement', value: 'Goodies' },
                { name: 'Autre collection', value: 'Autre' }
              )
          )
          .addStringOption((opt) => opt.setName('rarete').setDescription('Commune, Rare, Ultra-Rare, Édition Limitée').setRequired(false))
          .addStringOption((opt) => opt.setName('etat').setDescription('Neuf sous scellé, Excellent, Bon état').setRequired(false))
          .addStringOption((opt) => opt.setName('valeur').setDescription('Valeur estimée (ex: 60€)').setRequired(false))
      )
      .addSubcommand((sub) =>
        sub
          .setName('liste')
          .setDescription('Consulter votre inventaire de collectionneur')
          .addStringOption((opt) => opt.setName('categorie').setDescription('Filtrer par catégorie').setRequired(false))
      )
      .addSubcommand((sub) =>
        sub
          .setName('stats')
          .setDescription('Statistiques d\'inventaire et estimation de valeur totale')
      )
      .addSubcommand((sub) =>
        sub
          .setName('supprimer')
          .setDescription('Retirer un objet de sa collection')
          .addStringOption((opt) => opt.setName('id').setDescription('Identifiant de la pièce').setRequired(true).setAutocomplete(true))
      )
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('inspiration')
      .setDescription('Générateurs d\'idées, défis d\'écriture & carnet de notes personnel')
      .addSubcommand((sub) =>
        sub
          .setName('aleatoire')
          .setDescription('Générer une idée créative aléatoire pour débloquer l\'inspiration')
          .addStringOption((opt) =>
            opt
              .setName('domaine')
              .setDescription('Domaine d\'inspiration')
              .setRequired(false)
              .addChoices(
                { name: 'Intrigue d\'histoire 📜', value: 'histoire' },
                { name: 'Idée de personnage 👤', value: 'personnage' },
                { name: 'Lieu mystérieux 🏰', value: 'lieu' },
                { name: 'Recette gourmande 🍜', value: 'recette' }
              )
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName('defi')
          .setDescription('Découvrir le défi créatif du jour ou de la semaine')
          .addStringOption((opt) =>
            opt
              .setName('frequence')
              .setDescription('Quotidien ou Hebdomadaire')
              .setRequired(false)
              .addChoices(
                { name: 'Défi Quotidien (Rapide) ☀️', value: 'daily' },
                { name: 'Défi Hebdomadaire (Approfondi) 📅', value: 'weekly' }
              )
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName('carnet')
          .setDescription('Consulter ou ajouter une note dans son carnet d\'idées personnel')
          .addStringOption((opt) => opt.setName('texte').setDescription('Nouvelle idée à enregistrer (laisser vide pour lister)').setRequired(false))
          .addStringOption((opt) => opt.setName('domaine').setDescription('Domaine de l\'idée').setRequired(false))
      )
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('projet')
      .setDescription('Projets créatifs collaboratifs en équipe (romans, univers, fanzines)')
      .addSubcommand((sub) =>
        sub
          .setName('creer')
          .setDescription('Lancer un nouveau projet créatif d\'équipe')
          .addStringOption((opt) => opt.setName('titre').setDescription('Titre du projet collaboratif').setRequired(true))
          .addStringOption((opt) =>
            opt
              .setName('type')
              .setDescription('Type de projet')
              .setRequired(false)
              .addChoices(
                { name: 'Roman collectif 📖', value: 'Roman collectif' },
                { name: 'Univers partagé 🌍', value: 'Univers partagé' },
                { name: 'Recueil de recettes 🍲', value: 'Recueil de recettes' },
                { name: 'Anthologie poétique 🌸', value: 'Anthologie poétique' },
                { name: 'Fanzine communautaire 📰', value: 'Fanzine' }
              )
          )
          .addStringOption((opt) => opt.setName('description').setDescription('Objectif et synopsis du projet').setRequired(false))
      )
      .addSubcommand((sub) =>
        sub
          .setName('liste')
          .setDescription('Consulter les projets créatifs actifs sur le serveur')
      )
      .addSubcommand((sub) =>
        sub
          .setName('rejoindre')
          .setDescription('Rejoindre un projet créatif collaboratif')
          .addStringOption((opt) => opt.setName('id').setDescription('Identifiant du projet').setRequired(true).setAutocomplete(true))
          .addStringOption((opt) => opt.setName('role').setDescription('Votre rôle (Auteur, Illustrateur, Relecteur...)').setRequired(false))
      )
      .addSubcommand((sub) =>
        sub
          .setName('tache')
          .setDescription('Ajouter une tâche créative à un projet')
          .addStringOption((opt) => opt.setName('id').setDescription('Identifiant du projet').setRequired(true).setAutocomplete(true))
          .addStringOption((opt) => opt.setName('titre').setDescription('Description de la tâche').setRequired(true))
          .addStringOption((opt) => opt.setName('assigne_a').setDescription('Membre assigné ou Tous').setRequired(false))
      )
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('galerie')
      .setDescription('Vitrine publique et galerie de partage des œuvres du serveur')
      .addSubcommand((sub) =>
        sub
          .setName('explorer')
          .setDescription('Parcourir les créations partagées par les membres')
          .addStringOption((opt) =>
            opt
              .setName('type')
              .setDescription('Filtrer par type')
              .setRequired(false)
              .addChoices(
                { name: 'Recettes 🍜', value: 'recette' },
                { name: 'Histoires 📜', value: 'histoire' },
                { name: 'Poèmes 🌸', value: 'poeme' },
                { name: 'Univers 🌍', value: 'univers' }
              )
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName('publier')
          .setDescription('Publier une de vos créations dans la galerie publique')
          .addStringOption((opt) =>
            opt
              .setName('type')
              .setDescription('Type d\'œuvre')
              .setRequired(true)
              .addChoices(
                { name: 'Recette', value: 'recette' },
                { name: 'Histoire', value: 'histoire' },
                { name: 'Poème', value: 'poeme' }
              )
          )
          .addStringOption((opt) => opt.setName('id').setDescription('Identifiant de votre création').setRequired(true).setAutocomplete(true))
          .addStringOption((opt) => opt.setName('titre').setDescription('Titre affiché dans la galerie').setRequired(true))
          .addStringOption((opt) => opt.setName('description').setDescription('Petite présentation pour les lecteurs').setRequired(false))
      )
  )
  .addSubcommand((sub) =>
    sub.setName('hub').setDescription('Ouvrir le menu interactif principal de l\'espace créatif')
  )
  .addSubcommand((sub) =>
    sub.setName('explorer').setDescription('Découvrir les ateliers, outils et fonctionnalités créatives')
  )
  .addSubcommand((sub) =>
    sub.setName('statistiques').setDescription('Consulter votre bilan créatif complet et progression')
  )
  .addSubcommand((sub) =>
    sub.setName('aide').setDescription('Guide d\'utilisation interactif de tous les ateliers')
  )
  .addSubcommand((sub) =>
    sub
      .setName('exporter')
      .setDescription('Télécharger vos créations au format JSON ou Markdown lisible')
      .addStringOption((opt) =>
        opt
          .setName('format')
          .setDescription('Format du fichier')
          .setRequired(false)
          .addChoices({ name: 'Fichier JSON structuré', value: 'json' }, { name: 'Document Markdown lisible', value: 'markdown' })
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('importer')
      .setDescription('Importer des créations validées depuis un fichier JSON')
      .addAttachmentOption((opt) => opt.setName('fichier').setDescription('Fichier JSON à importer').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('rechercher')
      .setDescription('Recherche transversale dans toutes vos créations personnelles')
      .addStringOption((opt) => opt.setName('terme').setDescription('Mot-clé à rechercher').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub.setName('favoris').setDescription('Consulter vos lectures, recettes et créations favorites')
  )
  .addSubcommand((sub) =>
    sub.setName('brouillons').setDescription('Afficher vos écrits et lettres en cours de rédaction')
  )
  .addSubcommand((sub) =>
    sub.setName('recents').setDescription('Consulter vos créations modifiées récemment')
  )
  .addSubcommand((sub) =>
    sub
      .setName('lecture-suivi')
      .setDescription('[Legacy] Enregistrer ou suivre un livre, manga ou webtoon lu')
      .addStringOption((opt) => opt.setName('titre').setDescription('Nom de l\'œuvre').setRequired(true))
      .addIntegerOption((opt) => opt.setName('tome_actuel').setDescription('Tome ou chapitre actuel').setRequired(true))
      .addIntegerOption((opt) => opt.setName('total_tomes').setDescription('Nombre total de tomes parus').setRequired(false))
      .addStringOption((opt) =>
        opt
          .setName('type')
          .setDescription('Type d\'œuvre')
          .addChoices(
            { name: 'Manga 📖', value: 'Manga' },
            { name: 'Light Novel 📜', value: 'Light Novel' },
            { name: 'Webtoon 📱', value: 'Webtoon' },
            { name: 'Roman 📚', value: 'Roman' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub.setName('mes-lectures').setDescription('[Legacy] Afficher la liste de vos mangas et livres en cours')
  )
  .addSubcommand((sub) =>
    sub
      .setName('chercher-recette')
      .setDescription('[Legacy] Rechercher une recette dans le livre culinaire')
      .addStringOption((opt) => opt.setName('plat').setDescription('Nom du plat ou ingrédient').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub.setName('lire-histoire').setDescription('[Legacy] Lire l\'histoire collective rédigée par les membres')
  )
  .addSubcommand((sub) =>
    sub.setName('ma-collection').setDescription('[Legacy] Consulter votre inventaire de collectionneur')
  );
export async function autocomplete(interaction) {
  try {
    const focused = interaction.options.getFocused(true);
    const userId = interaction.user.id;
    const query = focused.value?.toLowerCase() || '';
    if (focused.name === 'id' || focused.name === 'histoire_id' || focused.name === 'univers_id') {
      const books = await getUserReadingBooks(userId, { limit: 15 });
      const stories = await getUserStories(userId, { limit: 15 });
      const recipes = await searchRecipes('', { authorId: userId, limit: 15 });
      const letters = await getUserLetters(userId, { limit: 15 });
      const choices = [];
      for (const b of books) {
        if (b._id.includes(query) || b.title.toLowerCase().includes(query)) {
          choices.push({ name: `📚 [Livre] ${b.title}`.slice(0, 95), value: b._id });
        }
      }
      for (const s of stories) {
        if (s._id.includes(query) || s.title.toLowerCase().includes(query)) {
          choices.push({ name: `📜 [Histoire] ${s.title}`.slice(0, 95), value: s._id });
        }
      }
      for (const r of recipes) {
        if (r._id.includes(query) || r.title.toLowerCase().includes(query)) {
          choices.push({ name: `🍜 [Recette] ${r.title}`.slice(0, 95), value: r._id });
        }
      }
      for (const l of letters) {
        if (l._id.includes(query) || l.title.toLowerCase().includes(query)) {
          choices.push({ name: `✉️ [Lettre] ${l.title}`.slice(0, 95), value: l._id });
        }
      }
      return await interaction.respond(choices.slice(0, 25));
    }
  } catch {}
}
export async function execute(interaction) {
  const group = interaction.options.getSubcommandGroup(false);
  const sub = interaction.options.getSubcommand();
  const userId = interaction.user.id;
  const username = interaction.user.username;
  const guildId = interaction.guild?.id || 'dm';
  if (!group) {
    if (sub === 'hub') {
      const embed = await buildHubEmbed(interaction.user);
      const select = buildAtelierSelectMenu();
      const row = buildHubActionRow();
      return await interaction.reply({ embeds: [embed], components: [select, row] });
    }
    if (sub === 'explorer') {
      const embed = new EmbedBuilder()
        .setTitle('🗺️ Explorer l\'Espace Créatif Saez')
        .setDescription('Découvrez les 10 ateliers mis à votre disposition pour exprimer vos talents :')
        .setColor(0x8b5cf6)
        .addFields(
          { name: '📚 1. Bibliothèque & Suivi', value: 'Suivi de tomes lus, chapitres, listes de lecture et clubs de lecture partagés.', inline: true },
          { name: '🍜 2. Recettes & Cuisine', value: 'Plats gourmands d\'anime, portions proportionnelles et listes de courses.', inline: true },
          { name: '📜 3. Histoires & Narration', value: 'Romans, chapitres avec analyse métrique et conte collaboratif du serveur.', inline: true },
          { name: '✉️ 4. Lettres Cachetées', value: 'Modèles de courriers, tonalités expressives et messages personnels.', inline: true },
          { name: '🌸 5. Atelier Poésie', value: 'Haïkus, sonnets, rimes phonétiques françaises et compteur de syllabes.', inline: true },
          { name: '🌍 6. World Building', value: 'Factions, lore, systèmes magiques, géographie et chronologies complètes.', inline: true },
          { name: '📦 7. Collections', value: 'Inventaire de figurines, mangas rares, cartes TCG et estimation de valeur.', inline: true },
          { name: '💡 8. Inspirations & Défis', value: 'Défis quotidiens, générateurs d\'idées folles et carnet personnel.', inline: true },
          { name: '🤝 9. Projets en Équipe', value: 'Écriture collective, répartition de tâches créatives et documents partagés.', inline: true },
          { name: '🖼️ 10. Vitrine Galerie', value: 'Partagez vos meilleures œuvres et explorez les créations de la communauté.', inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Tapez /creativite <atelier> pour démarrer votre chef-d\'œuvre !' });
      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
    if (sub === 'statistiques') {
      await interaction.deferReply();
      const stats = await getUserConsolidatedStats(userId);
      const embed = new EmbedBuilder()
        .setTitle(`📊 Bilan Créatif de ${username}`)
        .setColor(0x06b6d4)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '📖 Lectures', value: `• Total : **${stats.booksCount}**\n• Terminés : **${stats.booksFinished}**`, inline: true },
          { name: '🍜 Cuisine', value: `• Recettes : **${stats.recipesCount}**`, inline: true },
          { name: '📜 Écriture', value: `• Récits : **${stats.storiesCount}**\n• Mots : **${stats.totalWordsInStories}**`, inline: true },
          { name: '🌸 Poésie', value: `• Poèmes : **${stats.poemsCount}**\n• Vers : **${stats.totalVerses}**`, inline: true },
          { name: '✉️ Lettres', value: `• Rédigées : **${stats.lettersCount}**`, inline: true },
          { name: '📦 Collections', value: `• Objets : **${stats.collectionsCount}**`, inline: true }
        )
        .setFooter({ text: `Codé avec ❤️ par Saez | Total de ${stats.grandTotal} réalisations créatives enregistrées.` })
        .setTimestamp();
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'aide') {
      const select = buildAtelierSelectMenu();
      const embed = new EmbedBuilder()
        .setTitle('📖 Guide d\'Utilisation des Outils Créatifs')
        .setDescription(
          `Sélectionnez un atelier dans le menu déroulant ci-dessous pour afficher toutes les commandes et astuces correspondantes.\n\n` +
          `• Toutes vos créations personnelles restent **sécurisées et modifiables** par vous seul.\n` +
          `• Vous pouvez à tout moment exporter vos données avec \`/creativite exporter\` !`
        )
        .setColor(0x3b82f6)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.reply({ embeds: [embed], components: [select], flags: MessageFlags.Ephemeral });
    }
    if (sub === 'exporter') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const format = interaction.options.getString('format') || 'json';
      const fileData = await exportUserCreations(userId, format);
      const attachment = new AttachmentBuilder(Buffer.from(fileData.content, 'utf-8'), {
        name: fileData.filename,
      });
      return await interaction.editReply({
        content: `📁 **Votre export créatif (${format.toUpperCase()}) est prêt !** Conservez ce fichier en lieu sûr.`,
        files: [attachment],
      });
    }
    if (sub === 'importer') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const fileAttachment = interaction.options.getAttachment('fichier');
      if (!fileAttachment.name.endsWith('.json')) {
        return await interaction.editReply({ content: '❌ Seuls les fichiers au format `.json` sont autorisés pour l\'importation.' });
      }
      try {
        const response = await fetch(fileAttachment.url);
        const text = await response.text();
        const res = await validateAndImportUserCreations(userId, username, text);
        return await interaction.editReply({
          content: `✅ **Importation réussie !** ${res.importedCount} élément(s) ont été intégrés dans votre espace créatif.\n` +
            (res.errors.length > 0 ? `⚠️ *Note : ${res.errors.length} élément(s) ont été ignorés pour non-conformité.*` : ''),
        });
      } catch (err) {
        return await interaction.editReply({ content: `❌ Échec de l'importation : ${err.message}` });
      }
    }
    if (sub === 'rechercher') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const query = interaction.options.getString('terme');
      const results = await searchAllUserCreations(userId, query);
      const embed = new EmbedBuilder()
        .setTitle(`🔍 Résultats de recherche pour « ${query} »`)
        .setColor(0x8b5cf6)
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      const lines = [];
      if (results.books.length > 0) lines.push(`📚 **Lectures (${results.books.length}) :** ${results.books.map(b => b.title).join(', ')}`);
      if (results.recipes.length > 0) lines.push(`🍜 **Recettes (${results.recipes.length}) :** ${results.recipes.map(r => r.title).join(', ')}`);
      if (results.stories.length > 0) lines.push(`📜 **Histoires (${results.stories.length}) :** ${results.stories.map(s => s.title).join(', ')}`);
      if (results.poems.length > 0) lines.push(`🌸 **Poèmes (${results.poems.length}) :** ${results.poems.map(p => p.title).join(', ')}`);
      if (results.letters.length > 0) lines.push(`✉️ **Lettres (${results.letters.length}) :** ${results.letters.map(l => l.title).join(', ')}`);
      if (results.collections.length > 0) lines.push(`📦 **Collections (${results.collections.length}) :** ${results.collections.map(c => c.name).join(', ')}`);
      embed.setDescription(lines.length > 0 ? lines.join('\n\n') : '*Aucun résultat trouvé dans vos créations.*');
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'favoris') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const favBooks = await getUserReadingBooks(userId, { isFavorite: true, limit: 15 });
      const favCollections = await getUserCollection(userId, { isFavorite: true });
      const embed = new EmbedBuilder()
        .setTitle('⭐ Vos Créations & Lectures Favorites')
        .setColor(0xfbbf24)
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      const lines = [];
      if (favBooks.length > 0) {
        lines.push('📚 **Lectures Coup de Cœur :**\n' + favBooks.map(b => `• **${b.title}** [${b.category}] — ${b.rating}⭐`).join('\n'));
      }
      if (favCollections.length > 0) {
        lines.push('📦 **Pièces de Collection Favorites :**\n' + favCollections.map(c => `• **${c.name}** (${c.rarity})`).join('\n'));
      }
      embed.setDescription(lines.length > 0 ? lines.join('\n\n') : '*Vous n\'avez aucun favori enregistré.*');
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'brouillons') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const [draftStories, draftLetters] = await Promise.all([
        getUserStories(userId, { status: 'Brouillon', limit: 10 }),
        getUserLetters(userId, { isDraft: true, limit: 10 }),
      ]);
      const embed = new EmbedBuilder()
        .setTitle('📝 Vos Brouillons en Cours')
        .setColor(0xec4899)
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      let desc = '';
      if (draftStories.length > 0) {
        desc += '**📜 Histoires :**\n' + draftStories.map(s => `• **${s.title}** (${s.genre})`).join('\n') + '\n\n';
      }
      if (draftLetters.length > 0) {
        desc += '**✉️ Lettres :**\n' + draftLetters.map(l => `• **${l.title}** (pour ${l.recipient})`).join('\n');
      }
      embed.setDescription(desc || '*Aucun brouillon en attente.*');
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'recents') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const books = await getUserReadingBooks(userId, { limit: 5 });
      const stories = await getUserStories(userId, { limit: 5 });
      const embed = new EmbedBuilder()
        .setTitle('⏱️ Vos Créations Récentes')
        .setColor(0x10b981)
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      const lines = [];
      if (books.length > 0) lines.push('**Lectures récentes :**\n' + books.map(b => `• ${b.title} (${b.status})`).join('\n'));
      if (stories.length > 0) lines.push('**Histoires récentes :**\n' + stories.map(s => `• ${s.title} (${s.genre})`).join('\n'));
      embed.setDescription(lines.length > 0 ? lines.join('\n\n') : '*Aucune activité récente enregistrée.*');
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'lecture-suivi') {
      const title = interaction.options.getString('titre');
      const current = interaction.options.getInteger('tome_actuel');
      const total = interaction.options.getInteger('total_tomes') || current;
      const cat = interaction.options.getString('type') || 'Manga';
      const item = await addReadingBook(userId, {
        title,
        currentVolume: current,
        totalVolumes: total,
        category: cat,
      });
      const embed = new EmbedBuilder()
        .setTitle(`📚 Suivi de Lecture : ${title}`)
        .setDescription(`Progression enregistrée : **Tome ${current} / ${total}** (${item.status})`)
        .setColor(0x00e5ff)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Consultez votre liste avec /creativite mes-lectures' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
    if (sub === 'mes-lectures') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const books = await getUserReadingBooks(userId);
      const embed = new EmbedBuilder()
        .setTitle(`📚 Vos Lectures & Mangas en Cours (${books.length})`)
        .setColor(0x00e5ff)
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (books.length === 0) {
        embed.setDescription('Aucun titre enregistré. Utilisez `/creativite lecture ajouter` pour suivre vos lectures !');
      } else {
        const lines = books.map((b) => `📖 **${b.title}** (${b.category}) — Tome **${b.currentVolume} / ${b.totalVolumes}** [${b.status}]`);
        embed.setDescription(lines.join('\n\n'));
      }
      return interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'chercher-recette') {
      await interaction.deferReply();
      const query = interaction.options.getString('plat') || '';
      const recipes = await searchRecipes(query);
      const embed = new EmbedBuilder()
        .setTitle('📖 Livre de Recettes Gourmandes')
        .setColor(0xf59e0b)
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (recipes.length === 0) {
        embed.setDescription('Aucune recette trouvée. Proposez la vôtre avec `/creativite recette ajouter` !');
      } else {
        recipes.slice(0, 5).forEach((r) => {
          embed.addFields({
            name: `🍴 ${r.title} (⏱️ ${r.prepTime})`,
            value: `🧂 Ingrédients : *${r.ingredients.join(', ')}*\n👩‍🍳 ${r.steps.slice(0, 100)}...`,
            inline: false,
          });
        });
      }
      return interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'lire-histoire') {
      await interaction.deferReply();
      const sentences = await getStorySentences(guildId, 25);
      const embed = new EmbedBuilder()
        .setTitle('📜 Conte Collaboratif du Serveur')
        .setColor(0xa855f7)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Écrivez la suite avec /creativite histoire ecrire <texte>' })
        .setTimestamp();
      if (sentences.length === 0) {
        embed.setDescription('L\'histoire n\'a pas encore commencé. Soyez le premier à poser une phrase !');
      } else {
        const text = sentences.map((s) => s.text).join(' ');
        embed.setDescription(text);
      }
      return interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'ma-collection') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const items = await getUserCollection(userId);
      const embed = new EmbedBuilder()
        .setTitle(`🏆 Votre Collection Physique (${items.length} objets)`)
        .setColor(0xfbbf24)
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (items.length === 0) {
        embed.setDescription('Votre collection est vide. Ajoutez vos figurines ou tomes avec `/creativite collection ajouter` !');
      } else {
        const lines = items.map((it) => `✨ **${it.name}** (${it.category})`);
        embed.setDescription(lines.join('\n'));
      }
      return interaction.editReply({ embeds: [embed] });
    }
  }
  if (group === 'lecture') {
    if (sub === 'ajouter') {
      const title = interaction.options.getString('titre');
      const author = interaction.options.getString('auteur') || 'Inconnu';
      const category = interaction.options.getString('categorie') || 'Manga';
      const current = interaction.options.getInteger('tome_actuel') || 1;
      const total = interaction.options.getInteger('total_tomes') || current;
      const rating = interaction.options.getInteger('note') || 0;
      const tags = interaction.options.getString('tags') || '';
      const book = await addReadingBook(userId, {
        title,
        author,
        category,
        currentVolume: current,
        totalVolumes: total,
        rating,
        tags,
      });
      const embed = new EmbedBuilder()
        .setTitle(`📚 Livre Ajouté : ${book.title}`)
        .setDescription(`• Auteur : **${book.author}**\n• Format : **${book.category}**\n• Progression : **Tome ${book.currentVolume}/${book.totalVolumes}** [${book.status}]\n• Identifiant : \`${book._id}\``)
        .setColor(0x00e5ff)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Enregistrez vos sessions de lecture avec : /creativite lecture session' })
        .setTimestamp();
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'liste') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const filterStatut = interaction.options.getString('statut');
      const isFav = filterStatut === 'favoris' ? true : null;
      const statusParam = filterStatut === 'favoris' ? null : filterStatut;
      const books = await getUserReadingBooks(userId, { status: statusParam, isFavorite: isFav });
      const embed = new EmbedBuilder()
        .setTitle(`📚 Votre Bibliothèque Personnelle (${books.length})`)
        .setColor(0x00e5ff)
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (books.length === 0) {
        embed.setDescription('Aucun livre correspondant dans votre bibliothèque.');
      } else {
        const lines = books.slice(0, 15).map(b =>
          `• **${b.title}** (${b.category}) — Tome **${b.currentVolume}/${b.totalVolumes}** [${b.status}] ${b.isFavorite ? '⭐' : ''} (ID: \`${b._id}\`)`
        );
        embed.setDescription(lines.join('\n'));
      }
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'session') {
      const bookId = interaction.options.getString('id');
      const tomes = interaction.options.getInteger('tomes_lus') || 0;
      const pages = interaction.options.getInteger('pages_lues') || 0;
      const minutes = interaction.options.getInteger('minutes') || 0;
      const note = interaction.options.getString('note') || '';
      try {
        const updated = await recordReadingSession(userId, bookId, {
          volumesRead: tomes,
          pagesRead: pages,
          minutes,
          note,
        });
        const embed = new EmbedBuilder()
          .setTitle(`📖 Session Enregistrée : ${updated.title}`)
          .setDescription(`Progression actuelle : **Tome ${updated.currentVolume} / ${updated.totalVolumes}** [${updated.status}]\n⏱️ Temps passé : **${minutes} min**`)
          .setColor(0x10b981)
          .setTimestamp()
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        return await interaction.reply({ embeds: [embed] });
      } catch (e) {
        return await interaction.reply({ content: `❌ ${e.message}`, flags: MessageFlags.Ephemeral });
      }
    }
    if (sub === 'consulter') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const bookId = interaction.options.getString('id');
      const book = await getReadingBookById(userId, bookId);
      if (!book) {
        return await interaction.editReply({ content: '❌ Livre introuvable.' });
      }
      const percent = book.totalVolumes > 0 ? Math.round((book.currentVolume / book.totalVolumes) * 100) : 0;
      const embed = new EmbedBuilder()
        .setTitle(`📖 Fiche de Lecture : ${book.title}`)
        .setColor(0x00e5ff)
        .addFields(
          { name: '✍️ Auteur', value: book.author || 'Inconnu', inline: true },
          { name: '🏷️ Catégorie', value: book.category, inline: true },
          { name: '📊 Progression', value: `Tome **${book.currentVolume} / ${book.totalVolumes}** (${percent}%)`, inline: true },
          { name: '📌 Statut', value: book.status, inline: true },
          { name: '⭐ Note', value: book.rating > 0 ? `${book.rating}/5` : 'Non noté', inline: true },
          { name: '⏱️ Sessions', value: `${(book.sessions || []).length} session(s) enregistrée(s)`, inline: true }
        )
        .setFooter({ text: `Codé avec ❤️ par Saez | ID : ${book._id}` })
        .setTimestamp();
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'supprimer') {
      const bookId = interaction.options.getString('id');
      try {
        await deleteReadingBook(userId, bookId);
        return await interaction.reply({ content: `🗑️ Le livre \`${bookId}\` a été supprimé de votre bibliothèque.`, flags: MessageFlags.Ephemeral });
      } catch (e) {
        return await interaction.reply({ content: `❌ ${e.message}`, flags: MessageFlags.Ephemeral });
      }
    }
    if (sub === 'club') {
      const action = interaction.options.getString('action');
      const arg = interaction.options.getString('nom_ou_titre');
      if (action === 'create') {
        if (!arg) return await interaction.reply({ content: '❌ Précisez le nom du club de lecture.', flags: MessageFlags.Ephemeral });
        const club = await createBookClub(guildId, userId, username, { name: arg });
        return await interaction.reply({ content: `🎉 Club de lecture **${club.name}** créé avec succès ! (ID: \`${club._id}\`)` });
      }
      if (action === 'list') {
        const clubs = await getUserBookClubs(guildId, userId);
        const embed = new EmbedBuilder()
          .setTitle('📚 Vos Clubs de Lecture')
          .setColor(0x00e5ff)
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        if (clubs.length === 0) {
          embed.setDescription('Vous n\'êtes membre d\'aucun club de lecture sur ce serveur. Créez-en un avec `/creativite lecture club create <nom>` !');
        } else {
          embed.setDescription(clubs.map(c => `• **${c.name}** — Livre actuel : *${c.currentBook}* (${c.members.length} membres)`).join('\n'));
        }
        return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      }
      if (action === 'suggest') {
        if (!arg) return await interaction.reply({ content: '❌ Précisez le titre du livre à suggérer.', flags: MessageFlags.Ephemeral });
        const clubs = await getUserBookClubs(guildId, userId);
        if (clubs.length === 0) return await interaction.reply({ content: '❌ Rejoignez d\'abord un club de lecture.', flags: MessageFlags.Ephemeral });
        await suggestBookToClub(clubs[0]._id, userId, username, arg);
        return await interaction.reply({ content: `📖 Livre **${arg}** suggéré au club **${clubs[0].name}** !` });
      }
    }
  }
  if (group === 'recette') {
    if (sub === 'ajouter') {
      const title = interaction.options.getString('titre');
      const ingredients = interaction.options.getString('ingredients');
      const steps = interaction.options.getString('etapes');
      const cat = interaction.options.getString('categorie') || 'Anime Food';
      const portions = interaction.options.getInteger('portions') || 4;
      const temps = interaction.options.getString('temps') || '20 min';
      const diff = interaction.options.getString('difficulte') || 'Facile';
      const rec = await addRecipe({
        title,
        ingredients,
        steps,
        category: cat,
        servings: portions,
        prepTime: temps,
        difficulty: diff,
        authorId: userId,
        authorName: username,
      });
      const embed = new EmbedBuilder()
        .setTitle(`🍜 Recette Enregistrée : ${rec.title}`)
        .setDescription(`Partagée par <@${userId}>\n⏱️ Temps : **${temps}** | 🍽️ Portions : **${portions} pers.**\n\n🧂 **Ingrédients :**\n${rec.ingredients.join('\n')}\n\n👩‍🍳 **Préparation :**\n${rec.steps.join('\n')}`)
        .setColor(0xf59e0b)
        .setFooter({ text: `Codé avec ❤️ par Saez | ID : ${rec._id}` })
        .setTimestamp();
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'consulter') {
      await interaction.deferReply();
      const recId = interaction.options.getString('id');
      const rec = await getRecipeById(recId);
      if (!rec) return await interaction.editReply({ content: '❌ Recette introuvable.' });
      const embed = new EmbedBuilder()
        .setTitle(`🍴 Recette : ${rec.title}`)
        .setDescription(`Auteur : **${rec.authorName}** | 🏷️ ${rec.category}\n⏱️ Préparation : **${rec.prepTime}** | 🍽️ **${rec.servings} pers.**`)
        .setColor(0xf59e0b)
        .addFields(
          { name: '🧂 Ingrédients', value: rec.ingredients.map(i => `• ${i}`).join('\n').slice(0, 1024), inline: false },
          { name: '👩‍🍳 Étapes', value: rec.steps.map((s, idx) => `**${idx + 1}.** ${s}`).join('\n').slice(0, 1024), inline: false }
        )
        .setFooter({ text: `Codé avec ❤️ par Saez | ID : ${rec._id}` })
        .setTimestamp();
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'rechercher') {
      await interaction.deferReply();
      const term = interaction.options.getString('terme');
      const recipes = await searchRecipes(term);
      const embed = new EmbedBuilder()
        .setTitle(`🍜 Recettes trouvées pour « ${term} » (${recipes.length})`)
        .setColor(0xf59e0b)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (recipes.length === 0) {
        embed.setDescription('Aucune recette trouvée avec ce mot-clé.');
      } else {
        recipes.slice(0, 5).forEach(r => {
          embed.addFields({
            name: `🍴 ${r.title} (⏱️ ${r.prepTime}) [ID: \`${r._id}\`]`,
            value: `*Ingrédients :* ${r.ingredients.slice(0, 4).join(', ')}...`,
          });
        });
      }
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'portions') {
      const recId = interaction.options.getString('id');
      const target = interaction.options.getInteger('personnes');
      const rec = await getRecipeById(recId);
      if (!rec) return await interaction.reply({ content: '❌ Recette introuvable.', flags: MessageFlags.Ephemeral });
      const scaled = calculateRecipePortions(rec, target);
      const embed = new EmbedBuilder()
        .setTitle(`⚖️ Portions Recalculées : ${rec.title}`)
        .setDescription(`Ajustement pour **${target} convives** (recette originale : ${rec.servings} pers.) :`)
        .setColor(0xf59e0b)
        .addFields({
          name: '🧂 Ingrédients Ajustés',
          value: scaled.scaledIngredients.map(i => `• ${i}`).join('\n').slice(0, 1024),
        })
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'courses') {
      const recId = interaction.options.getString('id');
      const rec = await getRecipeById(recId);
      if (!rec) return await interaction.reply({ content: '❌ Recette introuvable.', flags: MessageFlags.Ephemeral });
      const list = generateGroceryList([rec]);
      const embed = new EmbedBuilder()
        .setTitle(`🛒 Liste de Courses : ${rec.title}`)
        .setDescription(list.join('\n').slice(0, 2000))
        .setColor(0x10b981)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Cochez vos ingrédients au fur et à mesure de vos achats !' });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'aleatoire') {
      const cat = interaction.options.getString('categorie');
      const rec = await getRandomRecipe(cat);
      if (!rec) return await interaction.reply({ content: '❌ Aucune recette disponible.', flags: MessageFlags.Ephemeral });
      const embed = new EmbedBuilder()
        .setTitle(`🎲 Recette Mystère : ${rec.title}`)
        .setDescription(`Une délicieuse idée proposée par **${rec.authorName}** !\n⏱️ Temps : **${rec.prepTime}** | Catégorie : **${rec.category}**\n\n🧂 Ingrédients : *${rec.ingredients.slice(0, 5).join(', ')}...*`)
        .setColor(0xf59e0b)
        .setFooter({ text: `Codé avec ❤️ par Saez | ID : ${rec._id} • Consulter avec /creativite recette consulter ${rec._id}` });
      return await interaction.reply({ embeds: [embed] });
    }
  }
  if (group === 'histoire') {
    if (sub === 'creer') {
      const title = interaction.options.getString('titre');
      const genre = interaction.options.getString('genre') || 'Fantasy';
      const summary = interaction.options.getString('resume') || '';
      const goal = interaction.options.getInteger('objectif_mots') || 10000;
      const story = await createStory(userId, username, guildId, {
        title,
        genre,
        summary,
        wordGoal: goal,
      });
      const embed = new EmbedBuilder()
        .setTitle(`📜 Histoire Créée : ${story.title}`)
        .setDescription(`> *${story.summary || 'Aucun résumé défini.'}*\n\n• Genre : **${story.genre}**\n• Objectif : **${story.wordGoal} mots**\n• Identifiant : \`${story._id}\``)
        .setColor(0xa855f7)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Rédigez votre premier chapitre avec : /creativite histoire chapitre' })
        .setTimestamp();
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'chapitre') {
      await interaction.deferReply();
      const storyId = interaction.options.getString('histoire_id');
      const chapTitle = interaction.options.getString('titre_chapitre');
      const content = interaction.options.getString('contenu');
      const num = interaction.options.getInteger('numero');
      try {
        const story = await addOrUpdateChapter(storyId, userId, {
          chapterNumber: num,
          title: chapTitle,
          content,
        });
        const metric = analyzeWritingText(content);
        const embed = new EmbedBuilder()
          .setTitle(`🖋️ Chapitre Enregistré : ${chapTitle}`)
          .setDescription(`Histoire : **${story.title}**\n• Mots du chapitre : **${metric.words}** (Temps de lecture estimé : ${metric.estimatedReadingTime})\n• Total histoire : **${story.totalWords} / ${story.wordGoal} mots**`)
          .setColor(0xa855f7)
          .setTimestamp()
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        return await interaction.editReply({ embeds: [embed] });
      } catch (e) {
        return await interaction.editReply({ content: `❌ ${e.message}` });
      }
    }
    if (sub === 'lire') {
      await interaction.deferReply();
      const storyId = interaction.options.getString('histoire_id');
      const chapNum = interaction.options.getInteger('chapitre') || 1;
      const story = await getStoryById(storyId);
      if (!story) return await interaction.editReply({ content: '❌ Histoire introuvable.' });
      const chapter = (story.chapters || []).find(c => c.number === chapNum);
      if (!chapter) {
        return await interaction.editReply({ content: `❌ Chapitre ${chapNum} introuvable dans cette histoire.` });
      }
      const embed = new EmbedBuilder()
        .setTitle(`📜 ${story.title} — Chapitre ${chapter.number} : ${chapter.title}`)
        .setDescription(chapter.content.slice(0, 4000))
        .setColor(0xa855f7)
        .setFooter({ text: `Codé avec ❤️ par Saez | Par ${story.authorName} • ${chapter.wordCount} mots` })
        .setTimestamp();
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'ecrire') {
      const phrase = interaction.options.getString('phrase');
      await addStorySentence(guildId, userId, username, phrase);
      return await interaction.reply({
        content: `🖋️ **<@${userId}>** a ajouté une suite au conte collectif du serveur !\nTapez \`/creativite lire-histoire\` pour lire le récit complet.`,
      });
    }
    if (sub === 'personnage') {
      const storyId = interaction.options.getString('histoire_id');
      const name = interaction.options.getString('nom');
      const role = interaction.options.getString('role');
      const desc = interaction.options.getString('description');
      try {
        await addStoryCharacter(storyId, userId, { name, role, appearance: desc });
        return await interaction.reply({ content: `👤 Fiche de personnage **${name}** (${role}) ajoutée à votre histoire !` });
      } catch (e) {
        return await interaction.reply({ content: `❌ ${e.message}`, flags: MessageFlags.Ephemeral });
      }
    }
  }
  if (group === 'lettre') {
    if (sub === 'rediger') {
      const title = interaction.options.getString('titre');
      const content = interaction.options.getString('contenu');
      const recipient = interaction.options.getString('destinataire') || '';
      const tone = interaction.options.getString('tonalite') || 'Amicale';
      const letter = await createLetter(userId, username, {
        title,
        content,
        recipient,
        tone,
      });
      const embed = new EmbedBuilder()
        .setTitle(`✉️ Lettre Cachetée : ${letter.title}`)
        .setDescription(`Destinataire : **${letter.recipient}** | Tonalité : **${letter.tone}**\n\n> *${letter.content.slice(0, 300)}...*\n\n🔒 **Statut :** Lettre confidentielle enregistrée dans vos archives privées.`)
        .setColor(0x3b82f6)
        .setFooter({ text: `Codé avec ❤️ par Saez | ID : ${letter._id} • Consulter avec /creativite lettre consulter` })
        .setTimestamp();
      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
    if (sub === 'consulter') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const letterId = interaction.options.getString('id');
      try {
        const letter = await getLetterById(letterId, userId);
        if (!letter) return await interaction.editReply({ content: '❌ Lettre introuvable.' });
        const embed = new EmbedBuilder()
          .setTitle(`✉️ ${letter.title}`)
          .setDescription(`*À l'attention de :* **${letter.recipient}**\n*Tonalité :* \`${letter.tone}\`\n\n${letter.content}`)
          .setColor(0x3b82f6)
          .setFooter({ text: `Codé avec ❤️ par Saez | Rédigée par ${letter.authorName} • ${letter.wordCount} mots` })
          .setTimestamp();
        return await interaction.editReply({ embeds: [embed] });
      } catch (e) {
        return await interaction.editReply({ content: `❌ ${e.message}` });
      }
    }
    if (sub === 'modeles') {
      const embed = new EmbedBuilder()
        .setTitle('📬 Modèles de Correspondance Disponibles')
        .setDescription('Utilisez ces trames inspirantes pour vos lettres avec `/creativite lettre rediger` :')
        .setColor(0x3b82f6)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      for (const [key, val] of Object.entries(LETTER_TEMPLATES)) {
        embed.addFields({
          name: `✉️ ${val.name} (${val.tone})`,
          value: `\`\`\`${val.template.slice(0, 150)}...\`\`\``,
        });
      }
      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
    if (sub === 'liste') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const letters = await getUserLetters(userId);
      const embed = new EmbedBuilder()
        .setTitle(`✉️ Vos Lettres & Correspondances (${letters.length})`)
        .setColor(0x3b82f6)
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (letters.length === 0) {
        embed.setDescription('Aucune lettre rédigée. Utilisez `/creativite lettre rediger` pour écrire votre premier courrier !');
      } else {
        embed.setDescription(letters.map(l => `• **${l.title}** (pour *${l.recipient}*) [${l.tone}] — \`${l._id}\``).join('\n'));
      }
      return await interaction.editReply({ embeds: [embed] });
    }
  }
  if (group === 'poesie') {
    if (sub === 'creer') {
      const title = interaction.options.getString('titre');
      const text = interaction.options.getString('texte');
      const form = interaction.options.getString('forme') || 'Poésie libre';
      const theme = interaction.options.getString('theme') || 'Général';
      const poem = await createPoem(userId, username, guildId, {
        title,
        content: text,
        form,
        theme,
      });
      const haikuCheck = form === 'Haïku' ? checkHaikuStructure(text) : null;
      const embed = new EmbedBuilder()
        .setTitle(`🌸 Poème & Création : ${poem.title}`)
        .setDescription(`*"${poem.content.replace(/\\n/g, '\n')}"*`)
        .setColor(0xec4899)
        .addFields(
          { name: 'Forme', value: poem.form, inline: true },
          { name: 'Métrique estimée', value: `${poem.verseCount} vers (~${poem.syllableEstimate} syllabes)`, inline: true }
        )
        .setAuthor({ name: username, iconURL: interaction.user.displayAvatarURL() })
        .setFooter({ text: haikuCheck ? `Codé avec ❤️ par Saez | Analyse Haïku : ${haikuCheck.structure} (${haikuCheck.isHaiku ? 'Parfait 5-7-5 !' : 'Structure libre'})` : 'Coin Poésie Saez' })
        .setTimestamp();
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'rimes') {
      const mot = interaction.options.getString('mot');
      const rhymes = findFrenchRhymes(mot);
      const embed = new EmbedBuilder()
        .setTitle(`🪶 Suggestions de Rimes pour « ${mot} »`)
        .setColor(0xec4899)
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (rhymes.length === 0) {
        embed.setDescription(`Aucune rime immédiate trouvée dans le dictionnaire pour **${mot}**. Essayez une forme ou terminaison proche !`);
      } else {
        embed.setDescription(`Voici des mots rimant harmonieusement :\n\n✨ **${rhymes.join('**, **')}**`);
      }
      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
    if (sub === 'syllabes') {
      const vers = interaction.options.getString('vers');
      const count = estimateSyllables(vers);
      return await interaction.reply({
        content: `📏 **Analyse métrique :** Le vers *« ${vers} »* compte environ **${count} syllabe(s)** poétique(s).`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (sub === 'liste') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const poems = await getUserPoems(userId);
      const embed = new EmbedBuilder()
        .setTitle(`🌸 Vos Poèmes & Haïkus (${poems.length})`)
        .setColor(0xec4899)
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par saez' });
      if (poems.length === 0) {
        embed.setDescription('Aucun poème composé pour le moment. Composez-en un avec `/creativite poesie creer` !');
      } else {
        embed.setDescription(poems.map(p => `• **${p.title}** [${p.form}] (${p.verseCount} vers) — ID: \`${p._id}\``).join('\n'));
      }
      return await interaction.editReply({ embeds: [embed] });
    }
  }
  if (group === 'worldbuilding') {
    if (sub === 'univers') {
      const name = interaction.options.getString('nom');
      const genre = interaction.options.getString('genre');
      const desc = interaction.options.getString('description');
      const uni = await createUniverse(userId, username, guildId, { name, genre, description: desc });
      const embed = new EmbedBuilder()
        .setTitle(`🌍 Univers Fictif Fondé : ${uni.name}`)
        .setDescription(`> *${uni.description}*\n\n• Genre : **${uni.genre}**\n• Identifiant : \`${uni._id}\``)
        .setColor(0x38bdf8)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Enrichissez-le avec /creativite worldbuilding element' })
        .setTimestamp();
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'element') {
      const title = interaction.options.getString('titre');
      const category = interaction.options.getString('categorie');
      const desc = interaction.options.getString('description');
      const uniId = interaction.options.getString('univers_id');
      if (uniId) {
        try {
          const el = await addUniverseElement(uniId, userId, username, guildId, { title, category, description: desc });
          return await interaction.reply({ content: `✅ Élément **[${category}] ${title}** ajouté avec succès à l'univers ! (ID: \`${el._id}\`)` });
        } catch (e) {
          return await interaction.reply({ content: `❌ ${e.message}`, flags: MessageFlags.Ephemeral });
        }
      }
      await addWorldBuildingElement({ guildId, title, category, description: desc, authorName: username });
      const embed = new EmbedBuilder()
        .setTitle(`🌍 Lore & Univers : [${category}] ${title}`)
        .setDescription(desc)
        .setColor(0x38bdf8)
        .setFooter({ text: `Codé avec ❤️ par Saez | Imaginé par ${username}` })
        .setTimestamp();
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'liste') {
      await interaction.deferReply();
      const uniId = interaction.options.getString('univers_id');
      if (uniId) {
        const elements = await getUniverseElements(uniId);
        const embed = new EmbedBuilder()
          .setTitle(`🌍 Lore & Éléments de l'Univers (${elements.length})`)
          .setColor(0x38bdf8)
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        if (elements.length === 0) embed.setDescription('Aucun élément dans cet univers.');
        else embed.setDescription(elements.slice(0, 15).map(e => `• **[${e.category}]** ${e.title} — *${e.description.slice(0, 80)}...*`).join('\n'));
        return await interaction.editReply({ embeds: [embed] });
      }
      const items = await getWorldBuildingElements(guildId);
      const embed = new EmbedBuilder()
        .setTitle(`🌍 Univers Collaboratif du Serveur (${items.length})`)
        .setColor(0x38bdf8)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (items.length === 0) embed.setDescription('Aucun concept enregistré pour ce serveur.');
      else embed.setDescription(items.map(it => `• **[${it.category}]** ${it.title} *(par ${it.authorName})*`).join('\n'));
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'coherence') {
      const uniId = interaction.options.getString('univers_id');
      try {
        const report = await checkUniverseConsistency(uniId);
        const embed = new EmbedBuilder()
          .setTitle(`⚖️ Rapport de Cohérence de l'Univers`)
          .setColor(0x10b981)
          .setDescription(`Score de complétude : **${report.score}%** (${report.totalElements} éléments documentés)`)
          .addFields({
            name: '💡 Pistes pour approfondir votre monde',
            value: report.suggestions.length > 0 ? report.suggestions.map(s => `• ${s}`).join('\n') : '✨ Votre univers est remarquablement complet et équilibré !',
          })
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      } catch (e) {
        return await interaction.reply({ content: `❌ ${e.message}`, flags: MessageFlags.Ephemeral });
      }
    }
  }
  if (group === 'collection') {
    if (sub === 'ajouter') {
      const name = interaction.options.getString('nom');
      const category = interaction.options.getString('categorie');
      const rarity = interaction.options.getString('rarete') || 'Commune';
      const condition = interaction.options.getString('etat') || 'Neuf';
      const value = interaction.options.getString('valeur') || 'N/A';
      const item = await addCollectionItem(userId, { name, category, rarity, condition, estimatedValue: value });
      const embed = new EmbedBuilder()
        .setTitle('📦 Pièce Ajoutée à votre Collection !')
        .setDescription(`**${item.name}** a rejoint votre inventaire dans la catégorie **${item.category}** !\n• Rareté : **${item.rarity}**\n• Valeur estimée : **${item.estimatedValue}**\n• Identifiant : \`${item._id}\``)
        .setColor(0x10b981)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Consulter : /creativite collection liste' });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'liste') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const cat = interaction.options.getString('categorie');
      const items = await getUserCollection(userId, { category: cat });
      const embed = new EmbedBuilder()
        .setTitle(`🏆 Votre Collection (${items.length} objets)`)
        .setColor(0xfbbf24)
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (items.length === 0) {
        embed.setDescription('Votre collection est vide.');
      } else {
        embed.setDescription(items.slice(0, 20).map(it => `• **${it.name}** (${it.category}) — *${it.rarity}* [${it.estimatedValue}] (ID: \`${it._id}\`)`).join('\n'));
      }
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'stats') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const stats = await getCollectionStats(userId);
      const embed = new EmbedBuilder()
        .setTitle('📊 Statistiques de votre Collection')
        .setColor(0xfbbf24)
        .addFields(
          { name: '📦 Total de pièces', value: `**${stats.total}** objets`, inline: true },
          { name: '💎 Valeur estimée', value: `**${stats.totalEstimatedValue}**`, inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'supprimer') {
      const itemId = interaction.options.getString('id');
      const deleted = await deleteCollectionItem(itemId, userId);
      return await interaction.reply({
        content: deleted ? `🗑️ Pièce \`${itemId}\` retirée de votre collection.` : '❌ Objet introuvable ou non autorisé.',
        flags: MessageFlags.Ephemeral,
      });
    }
  }
  if (group === 'inspiration') {
    if (sub === 'aleatoire') {
      const domain = interaction.options.getString('domaine') || 'histoire';
      const text = getRandomInspiration(domain);
      const embed = new EmbedBuilder()
        .setTitle(`✨ Inspiration Aléatoire [${domain.toUpperCase()}]`)
        .setDescription(`> *« ${text} »*`)
        .setColor(0x6366f1)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Transformez cette idée en œuvre avec nos ateliers créatifs !' })
        .setTimestamp();
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'defi') {
      const freq = interaction.options.getString('frequence') || 'daily';
      const chal = getCreativeChallenge(freq);
      const embed = new EmbedBuilder()
        .setTitle(`🎯 Défi Créatif [${freq === 'daily' ? 'QUOTIDIEN' : 'HEBDOMADAIRE'}] : ${chal.title}`)
        .setDescription(`**Domaine :** \`${chal.domain}\`\n\n> **Votre mission créative :**\n> *${chal.prompt}*`)
        .setColor(0x10b981)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Relevez le défi et partagez votre création !' });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'carnet') {
      const text = interaction.options.getString('texte');
      const domain = interaction.options.getString('domaine') || 'Général';
      if (text) {
        const idea = await addCreativeIdea(userId, { text, domain });
        return await interaction.reply({ content: `💡 Idée enregistrée dans votre carnet personnel ! (ID: \`${idea._id}\`)`, flags: MessageFlags.Ephemeral });
      }
      const ideas = await getUserIdeas(userId);
      const embed = new EmbedBuilder()
        .setTitle(`💡 Votre Carnet d'Idées (${ideas.length})`)
        .setColor(0x6366f1)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (ideas.length === 0) embed.setDescription('Votre carnet est vide. Notez une idée avec `/creativite inspiration carnet texte:<votre idée>` !');
      else embed.setDescription(ideas.map(i => `• [${i.domain}] *« ${i.text} »* (\`${i._id}\`)`).join('\n'));
      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  }
  if (group === 'projet') {
    if (sub === 'creer') {
      const title = interaction.options.getString('titre');
      const type = interaction.options.getString('type') || 'Roman collectif';
      const desc = interaction.options.getString('description') || '';
      const proj = await createCreativeProject(userId, username, guildId, { title, type, description: desc });
      const embed = new EmbedBuilder()
        .setTitle(`🤝 Projet Collaboratif Créé : ${proj.title}`)
        .setDescription(`> *${proj.description || 'Aucune description définie.'}*\n\n• Type : **${proj.type}**\n• Fondateur : <@${userId}>\n• Identifiant : \`${proj._id}\``)
        .setColor(0x14b8a6)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Invitez vos amis à rejoindre avec : /creativite projet rejoindre' });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'liste') {
      await interaction.deferReply();
      const projects = await getUserProjects(userId, guildId);
      const embed = new EmbedBuilder()
        .setTitle(`🤝 Projets Créatifs Actifs (${projects.length})`)
        .setColor(0x14b8a6)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (projects.length === 0) embed.setDescription('Aucun projet en cours. Fondez le premier avec `/creativite projet creer` !');
      else embed.setDescription(projects.map(p => `• **${p.title}** [${p.type}] (${p.members.length} membres) — \`${p._id}\``).join('\n'));
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'rejoindre') {
      const projId = interaction.options.getString('id');
      const role = interaction.options.getString('role') || 'Contributeur';
      try {
        const proj = await joinCreativeProject(projId, userId, username, role);
        return await interaction.reply({ content: `🎉 Vous avez rejoint le projet **${proj.title}** en tant que **${role}** !` });
      } catch (e) {
        return await interaction.reply({ content: `❌ ${e.message}`, flags: MessageFlags.Ephemeral });
      }
    }
    if (sub === 'tache') {
      const projId = interaction.options.getString('id');
      const title = interaction.options.getString('titre');
      const assigned = interaction.options.getString('assigne_a') || 'Tous';
      try {
        await addProjectTask(projId, userId, { title, assignedTo: assigned });
        return await interaction.reply({ content: `📋 Tâche **${title}** ajoutée au projet !` });
      } catch (e) {
        return await interaction.reply({ content: `❌ ${e.message}`, flags: MessageFlags.Ephemeral });
      }
    }
  }
  if (group === 'galerie') {
    if (sub === 'explorer') {
      await interaction.deferReply();
      const type = interaction.options.getString('type');
      const items = await getGalleryItems(guildId, { type });
      const embed = new EmbedBuilder()
        .setTitle('🖼️ Galerie Communautaire Saez')
        .setDescription('Découvrez les œuvres partagées par les membres du serveur :')
        .setColor(0xd946ef)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (items.length === 0) {
        embed.setDescription('La galerie est encore vide. Soyez le premier à publier une œuvre avec `/creativite galerie publier` !');
      } else {
        items.slice(0, 5).forEach(it => {
          embed.addFields({
            name: `${it.title} *(par ${it.authorName})* — ❤️ ${it.likes} likes`,
            value: `> ${it.previewContent.slice(0, 200)}...\n\`ID: ${it._id}\``,
          });
        });
      }
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'publier') {
      const type = interaction.options.getString('type');
      const creationId = interaction.options.getString('id');
      const title = interaction.options.getString('titre');
      const desc = interaction.options.getString('description') || '';
      let preview = '';
      if (type === 'recette') {
        const r = await getRecipeById(creationId);
        if (!r || r.authorId !== userId) return await interaction.reply({ content: '❌ Vous n\'êtes pas l\'auteur de cette recette.', flags: MessageFlags.Ephemeral });
        preview = `Recette : ${r.title}\nIngrédients : ${r.ingredients.join(', ')}`;
      } else if (type === 'histoire') {
        const s = await getStoryById(creationId);
        if (!s || s.userId !== userId) return await interaction.reply({ content: '❌ Vous n\'êtes pas l\'auteur de cette histoire.', flags: MessageFlags.Ephemeral });
        preview = s.summary || s.title;
      } else if (type === 'poeme') {
        const p = await getPoemById(creationId);
        if (!p || p.userId !== userId) return await interaction.reply({ content: '❌ Vous n\'êtes pas l\'auteur de ce poème.', flags: MessageFlags.Ephemeral });
        preview = p.content;
      }
      const item = await publishToGallery(userId, username, guildId, {
        creationType: type,
        creationId,
        title,
        description: desc,
        previewContent: preview,
      });
      return await interaction.reply({
        content: `🎉 **${title}** a été publié avec succès dans la galerie communautaire ! (ID: \`${item._id}\`)`,
      });
    }
  }
}
