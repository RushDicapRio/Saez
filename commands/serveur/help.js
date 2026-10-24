import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
  MessageFlags,
} from 'discord.js';
export const CATEGORIES_CONFIG = {
  leaderboard: {
    label: 'Classements & Tops',
    emoji: '🏆',
    description: 'Tops des membres les plus actifs, vainqueurs de quiz, concours et équipes...',
    commands: [
      { name: '/top activite', desc: 'Classement des membres les plus actifs (messages et vocal).' },
      { name: '/top quiz', desc: 'Classement des meilleurs joueurs aux Quiz et Mini-Jeux.' },
      { name: '/top concours', desc: 'Classement des membres ayant remporté le plus de giveaways.' },
      { name: '/top equipes', desc: 'Classement officiel de toutes les équipes et clans du serveur.' },
    ],
  },
  schedule: {
    label: 'Planning & Activités Serveur',
    emoji: '📅',
    description: 'Organisation, calendrier et inscriptions aux activités de la communauté...',
    commands: [
      { name: '/schedule planning', desc: 'Consulter le calendrier complet des activités et soirées.' },
      { name: '/schedule ajouter', desc: 'Ajouter une nouvelle activité avec date, heure et salon.' },
      { name: '/schedule prochaines', desc: 'Affiche rapidement les 3 prochaines activités prévues.' },
      { name: '/schedule participer', desc: 'S\'inscrire ou se désinscrire d\'une activité.' },
      { name: '/schedule annuler', desc: 'Annuler ou retirer une activité programmée.' },
    ],
  },
  games: {
    label: 'Jeux & Duels Communautaires',
    emoji: '🎮',
    description: 'Quiz multijoueur, duel de stratégie au tour par tour, mot mystère et juste prix...',
    commands: [
      { name: '/jouer quiz', desc: 'Lance une session de quiz interactive avec boutons à choix multiples.' },
      { name: '/jouer duel <adversaire>', desc: 'Défie un joueur dans un combat tactique au tour par tour.' },
      { name: '/jouer mot-mystere', desc: 'Devine le mot caché lettre par lettre en direct dans le salon.' },
      { name: '/jouer justeprix', desc: 'Partie multijoueur du juste prix avec indices Plus / Moins.' },
    ],
  },
  news: {
    label: 'Actualités & Veille Externe',
    emoji: '📰',
    description: 'Flux d\'actualités en direct pour l\'univers Anime, Gaming et Technologie...',
    commands: [
      { name: '/news anime', desc: 'Dernières actualités, tendances et annonces de saisons anime.' },
      { name: '/news gaming', desc: 'Actualités du jeu vidéo, sorties Steam, consoles et PC.' },
      { name: '/news tech', desc: 'Actualités technologiques, intelligence artificielle et informatique.' },
      { name: '/news recherche <sujet>', desc: 'Recherche d\'actualités sur un mot-clé précis.' },
    ],
  },
  media: {
    label: 'Média & Créations Visuelles',
    emoji: '🖼️',
    description: 'Recherche d\'images HD, GIFs animés, générateur de mèmes et analyse média...',
    commands: [
      { name: '/media image <sujet>', desc: 'Recherche une image ou fond d\'écran haute définition.' },
      { name: '/media gif <sujet>', desc: 'Recherche un GIF animé pour illustrer un message.' },
      { name: '/media meme <haut> [bas]', desc: 'Génère un mème personnalisé prêt à partager.' },
      { name: '/media info <fichier>', desc: 'Analyse et affiche les métadonnées techniques d\'une image.' },
    ],
  },
  utility: {
    label: 'Utilitaires & Boîte à Outils',
    emoji: '🛠️',
    description: 'Calculatrice scientifique, convertisseur d\'unités, QR Code et fuseaux horaires...',
    commands: [
      { name: '/outil calculatrice <calcul>', desc: 'Effectue un calcul mathématique ou scientifique sécurisé.' },
      { name: '/outil convertir <valeur> <type>', desc: 'Convertisseur d\'unités (°C/°F, km/mi, devises, kg/lbs).' },
      { name: '/outil qrcode <contenu>', desc: 'Génère instantanément un QR code scannable.' },
      { name: '/outil fuseau [ville]', desc: 'Heure locale en direct dans les grandes villes du monde.' },
      { name: '/outil motdepasse [longueur]', desc: 'Génère un mot de passe ultra-sécurisé ou clé aléatoire.' },
    ],
  },
  languages: {
    label: 'Langues & Traduction',
    emoji: '🌐',
    description: 'Outils linguistiques : traducteur multilingue, dictionnaire et détection...',
    commands: [
      { name: '/langue traduire <texte> <vers>', desc: 'Traduit instantanément un texte dans la langue choisie.' },
      { name: '/langue detecter <texte>', desc: 'Détecte automatiquement la langue d\'un texte.' },
      { name: '/langue dictionnaire <mot>', desc: 'Définitions complètes, prononciation et exemples d\'un mot.' },
      { name: '/langue liste', desc: 'Liste des langues internationales prises en charge.' },
    ],
  },
  bookmarks: {
    label: 'Favoris & Marque-Pages',
    emoji: '🔖',
    description: 'Système complet de favoris : collections thématiques, tags, notes privées, export et partage...',
    commands: [
      { name: '/bookmark ajouter <titre> <url>', desc: 'Enregistre un lien avec collection, tags et note privée.' },
      { name: '/bookmark liste [collection] [filtre]', desc: 'Consulter vos favoris avec filtres et pagination.' },
      { name: '/bookmark collection <creer|liste|ajouter>', desc: 'Organiser vos liens dans des collections thématiques.' },
      { name: '/bookmark rechercher <terme>', desc: 'Recherche multi-critères dans vos liens, tags et notes.' },
      { name: '/bookmark favori <id>', desc: 'Basculer un lien en favori prioritaire ⭐.' },
      { name: '/bookmark tag <liste|ajouter|filtrer>', desc: 'Gérer vos tags et mots-clés de classement.' },
      { name: '/bookmark exporter [format]', desc: 'Télécharger tous vos marque-pages en JSON ou CSV.' },
      { name: '/bookmark verifier <id>', desc: 'Tester la disponibilité HTTP d\'un lien avec protection anti-SSRF.' },
      { name: '/bookmark partager <id>', desc: 'Partage un marque-page dans le salon ou avec un membre.' },
      { name: '/bookmark aide', desc: 'Guide complet et documentation de toutes les fonctionnalités.' },
    ],
  },
  tasks: {
    label: 'Gestion des Tâches (To-Do)',
    emoji: '📋',
    description: 'Espace d\'organisation personnelle avec priorités et suivi d\'échéances...',
    commands: [
      { name: '/task ajouter <titre>', desc: 'Ajoute une tâche à accomplir dans votre liste.' },
      { name: '/task liste', desc: 'Affiche la liste de vos tâches (En cours et Terminées).' },
      { name: '/task terminer <id>', desc: 'Marque une tâche comme terminée.' },
      { name: '/task supprimer <id>', desc: 'Supprime définitivement une tâche.' },
    ],
  },
  teams: {
    label: 'Équipes & Guildes',
    emoji: '🛡️',
    description: 'Système complet de clans : créez ou rejoignez une guilde et hissez-vous au sommet...',
    commands: [
      { name: '/team creer <nom> <tag>', desc: 'Fonder une nouvelle équipe officielle sur le serveur.' },
      { name: '/team rejoindre <nom>', desc: 'Rejoindre une équipe ou un clan existant.' },
      { name: '/team quitter', desc: 'Quitter votre équipe actuelle.' },
      { name: '/team info <nom>', desc: 'Fiche détaillée du clan, effectif et points.' },
      { name: '/team classement', desc: 'Classement de toutes les équipes du serveur.' },
    ],
  },
  information: {
    label: 'Informations & Profils',
    emoji: 'ℹ️',
    description: 'Profils des membres, serveur, salons, rôles, avatars, bannières et stats...',
    commands: [
      { name: '/info user [membre]', desc: 'Fiche complète d\'un membre : création du compte, arrivée, rôles, badges.' },
      { name: '/info serveur', desc: 'Fiche détaillée du serveur : membres, salons, rôles, niveau de boost.' },
      { name: '/info bot', desc: 'Statistiques en direct du bot : latence ping, consommation RAM, uptime et statut.' },
      { name: '/info salon [salon]', desc: 'Détails d\'un salon : type, sujet, restrictions.' },
      { name: '/info role <role>', desc: 'Informations sur un rôle : couleur, permissions accordées, membres.' },
      { name: '/info avatar [membre]', desc: 'Affiche et télécharge l\'avatar d\'un utilisateur en haute définition.' },
      { name: '/info banniere [membre]', desc: 'Affiche la bannière personnalisée d\'un membre.' },
    ],
  },
  communaute: {
    label: 'Vie Communautaire & Social',
    emoji: '🤝',
    description: 'Candidatures staff, anniversaires, réputation, confessions, débats, parrainage...',
    commands: [
      { name: '/communaute postuler', desc: 'Déposer une candidature de recrutement (Modérateur, Animateur, Helper...).' },
      { name: '/communaute candidatures', desc: 'Consulter les candidatures déposées (Staff).' },
      { name: '/communaute anniversaire', desc: 'Enregistrer sa date d\'anniversaire pour la fête du serveur.' },
      { name: '/communaute anniversaires', desc: 'Afficher les prochains anniversaires à fêter.' },
      { name: '/communaute reputation <membre>', desc: 'Donner 1 point de réputation à un membre pour son aide.' },
      { name: '/communaute top-reputation', desc: 'Classement des membres les plus réputés du serveur.' },
      { name: '/communaute confession <message>', desc: 'Publier une confession anonyme dans le salon dédié.' },
      { name: '/communaute debat <sujet>', desc: 'Lancer un débat interactif avec votes pour / contre.' },
      { name: '/communaute mentorat <type>', desc: 'Trouver un mentor ou proposer son aide aux débutants.' },
      { name: '/communaute objectifs', desc: 'Suivre la progression des objectifs collectifs du serveur.' },
      { name: '/communaute merci <membre> <message>', desc: 'Remercier publiquement un membre pour son soutien.' },
    ],
  },
  creativite: {
    label: 'Créativité, Livres & Arts',
    emoji: '🎨',
    description: 'Atelier complet : lectures, recettes, écriture, lettres, poésie, worldbuilding, collections et projets...',
    commands: [
      { name: '/creativite hub', desc: 'Ouvrir le menu interactif central et tableau de bord créatif.' },
      { name: '/creativite lecture <ajouter|liste|session|club>', desc: 'Suivi de lecture de tomes/pages et clubs de lecture.' },
      { name: '/creativite recette <ajouter|consulter|portions|courses>', desc: 'Livre de cuisine, portions proportionnelles et courses.' },
      { name: '/creativite histoire <creer|chapitre|lire|ecrire>', desc: 'Atelier de narration, chapitres et conte collaboratif.' },
      { name: '/creativite lettre <rediger|consulter|modeles|liste>', desc: 'Rédaction de lettres cachetées et correspondance soignée.' },
      { name: '/creativite poesie <creer|rimes|syllabes|liste>', desc: 'Haïkus, sonnets, rimes phonétiques et vers métriques.' },
      { name: '/creativite worldbuilding <univers|element|liste>', desc: 'Création d\'univers fictifs, lore, magie et factions.' },
      { name: '/creativite collection <ajouter|liste|stats>', desc: 'Gestionnaire de collections (figurines, cartes, tomes).' },
      { name: '/creativite inspiration <aleatoire|defi|carnet>', desc: 'Générateurs d\'idées, défis créatifs et carnet personnel.' },
      { name: '/creativite projet <creer|liste|rejoindre|tache>', desc: 'Projets créatifs collaboratifs en équipe sur le serveur.' },
      { name: '/creativite galerie <explorer|publier>', desc: 'Vitrine publique et galerie des créations partagées.' },
      { name: '/creativite statistiques', desc: 'Consulter votre bilan consolidé et progression créative.' },
      { name: '/creativite exporter [format]', desc: 'Télécharger vos créations au format JSON ou Markdown.' },
      { name: '/creativite importer <fichier>', desc: 'Importer des créations validées depuis un fichier JSON.' },
    ],
  },
  lifestyle: {
    label: 'Lifestyle, Santé & Bien-Être',
    emoji: '🌿',
    description: 'Fitness tracker, habitudes streaks, sessions focus, animaux, plantes, wishlist...',
    commands: [
      { name: '/lifestyle fitness <sport> <duree>', desc: 'Enregistrer une séance d\'entraînement et calories brûlées.' },
      { name: '/lifestyle habitude <nom>', desc: 'Valider son habitude quotidienne et maintenir sa série (streak).' },
      { name: '/lifestyle mes-habitudes', desc: 'Suivre ses séries de jours consécutifs.' },
      { name: '/lifestyle focus <minutes>', desc: 'Lancer un chronomètre de concentration Pomodoro.' },
      { name: '/lifestyle animal <nom> <espece>', desc: 'Créer la fiche profil de son animal de compagnie.' },
      { name: '/lifestyle plante <nom>', desc: 'Surveiller le calendrier d\'arrosage de ses plantes.' },
      { name: '/lifestyle voyage <destination>', desc: 'Préparer un carnet d\'itinéraire ou voyage de rêve.' },
      { name: '/lifestyle wishlist <article>', desc: 'Ajouter un cadeau ou un manga à sa liste d\'envies.' },
      { name: '/lifestyle journal <texte>', desc: 'Écrire une note dans son journal intime personnel privé.' },
    ],
  },
  etudes: {
    label: 'Études, Sciences & Savoirs',
    emoji: '🎓',
    description: 'Flashcards, comptes à rebours examens, math lab, géographie mondiale et sciences...',
    commands: [
      { name: '/etudes flashcard <question> <reponse>', desc: 'Créer une carte mémoire recto/verso pour réviser.' },
      { name: '/etudes reviser [paquet]', desc: 'Tirer une flashcard au sort pour s\'auto-évaluer.' },
      { name: '/etudes examen <nom> <date>', desc: 'Ajouter un compte à rebours pour une épreuve ou partiel.' },
      { name: '/etudes maths <operation>', desc: 'Résoudre racines, puissances, Pythagore et factorielles.' },
      { name: '/etudes geographie <pays>', desc: 'Fiche pays avec capitale, continent, monnaie et drapeau.' },
      { name: '/etudes sciences <element>', desc: 'Constantes physiques fondamentales et éléments chimiques.' },
      { name: '/etudes frappe', desc: 'Mesurer sa vitesse et sa précision de frappe au clavier (WPM).' },
    ],
  },
  cassetete: {
    label: 'Casse-Têtes, Échecs & Jeux de Réflexion',
    emoji: '🧩',
    description: 'Échecs Minimax, Sudoku unique, Mastermind, Morpion, Puissance 4, 2048, Hanoï, Compte est Bon...',
    commands: [
      { name: '/cassetete aide', desc: 'Guide complet et règles de tous les jeux de réflexion.' },
      { name: '/cassetete liste', desc: 'Afficher la liste de tous les 11 jeux disponibles.' },
      { name: '/cassetete echecs [action] [coup_texte]', desc: 'Partie d\'échecs (1v1, contre IA Minimax, ou tactique du jour).' },
      { name: '/cassetete sudoku [action] [difficulte]', desc: 'Sudoku à solution unique : remplir, notes, indices progressifs.' },
      { name: '/cassetete mots [mode] [reponse]', desc: 'Anagrammes, Mot Mystère (Wordle / Motus) et Pendu.' },
      { name: '/cassetete logique [action] [reponse]', desc: 'Énigmes logiques avec indices et vérification intelligente.' },
      { name: '/cassetete mastermind [action] [prop]', desc: 'Déchiffrer la combinaison secrète de 4 couleurs (10 essais).' },
      { name: '/cassetete puissance4 [action] [adversaire]', desc: 'Puissance 4 interactif à boutons (1v1 ou contre l\'IA).' },
      { name: '/cassetete morpion [adversaire]', desc: 'Morpion 3x3 interactif à boutons avec IA Minimax imbattable.' },
      { name: '/cassetete 2048', desc: 'Jeu 2048 interactif avec boutons directionnels.' },
      { name: '/cassetete hanoi [action]', desc: 'Résoudre la Tour de Hanoï en déplaçant les disques.' },
      { name: '/cassetete calcul [mode] [formule]', desc: 'Le Compte est Bon et calcul mental chronométré.' },
      { name: '/cassetete demineur [action] [coord]', desc: 'Grille de démineur classique avec propagation sans explosion.' },
      { name: '/cassetete duel <action> <jeu> <adversaire>', desc: 'Lancer ou gérer un duel de réflexion avec un autre membre.' },
      { name: '/cassetete partie <action>', desc: 'Consulter l\'état de sa session en cours ou abandonner.' },
      { name: '/cassetete quotidien [reponse]', desc: 'Défi casse-tête du jour avec récompenses d\'XP et séries.' },
      { name: '/cassetete classement', desc: 'Top 10 des meilleurs joueurs selon le score Elo officiel.' },
      { name: '/cassetete profil [membre]', desc: 'Statistiques stratégiques, taux de victoires et séries consécutives.' },
    ],
  },
  devlab: {
    label: 'DevLab & Outils Développeur',
    emoji: '💻',
    description: 'Snippets de code, regex lab, tests d\'API HTTP, hachage, palettes et QR WiFi...',
    commands: [
      { name: '/devlab snippet <langage> <code>', desc: 'Partager un extrait de code coloré et formaté.' },
      { name: '/devlab regex <motif> <texte>', desc: 'Tester et déboguer une expression régulière en direct.' },
      { name: '/devlab api <url>', desc: 'Envoyer une requête HTTP GET et analyser la réponse REST.' },
      { name: '/devlab hash <texte>', desc: 'Générer les empreintes SHA-256 et MD5 d\'un texte.' },
      { name: '/devlab couleur <hex>', desc: 'Inspecter un code couleur HEX, RGB et prévisualiser la teinte.' },
      { name: '/devlab qrstudio <ssid> <pass>', desc: 'Générer un QR Code de connexion WiFi instantané.' },
      { name: '/devlab convertisseur <json>', desc: 'Valider et indenter proprement du JSON.' },
    ],
  },
  roleplay: {
    label: 'Jeu de Rôle (JDR / RPG)',
    emoji: '🎲',
    description: 'Lancers de dés de JDR, fiches de héros et jets d\'actions scénarisées...',
    commands: [
      { name: '/roleplay des <formule>', desc: 'Lancer des dés de JDR (ex: 1d20, 3d6+2, 1d100) avec critiques.' },
      { name: '/roleplay fiche <nom> <classe>', desc: 'Créer une fiche de personnage RPG (PV, niveau, classe).' },
      { name: '/roleplay action <description>', desc: 'Tenter une action risquée avec un jet sous tension.' },
    ],
  },
  animeparty: {
    label: 'Anime Party & Ambiance',
    emoji: '🎉',
    description: 'Citations cultes de héros, roulette d\'animes et punchlines sonores légendaires...',
    commands: [
      { name: '/animeparty citation', desc: 'Tirer au sort une citation inoubliable du monde des animes.' },
      { name: '/animeparty roulette', desc: 'Tirer au sort une pépite anime recommandée pour ce soir.' },
      { name: '/animeparty soundboard <replique>', desc: 'Punchlines cultes (Omae wa mou shindeiru, Ryoiki Tenkai...).' },
    ],
  },
  starboard: {
    label: 'Tableau d\'Honneur (Starboard)',
    emoji: '⭐',
    description: 'Archive automatique des messages cultes du serveur votés par la communauté...',
    commands: [
      { name: '/starboard salon <cible>', desc: 'Définir le salon de republication des messages étoilés.' },
      { name: '/starboard seuil <nombre>', desc: 'Nombre d\'étoiles requis pour entrer au tableau d\'honneur.' },
      { name: '/starboard emoji <symbole>', desc: 'Personnaliser l\'emoji de vote (⭐, 🌟, ❤️...).' },
      { name: '/starboard statut <actif>', desc: 'Activer ou désactiver le Starboard.' },
      { name: '/starboard infos', desc: 'Consulter la configuration et le top des messages étoilés.' },
    ],
  },
  tournament: {
    label: 'Tournois & Compétitions',
    emoji: '🏆',
    description: 'Gestion des tournois gaming, e-sport, inscriptions et podiums...',
    commands: [
      { name: '/tournoi creer <titre> <jeu>', desc: 'Créer un tournoi avec inscriptions ouvertes.' },
      { name: '/tournoi inscrire <tournoi_id>', desc: 'Rejoindre la liste des participants d\'un tournoi.' },
      { name: '/tournoi liste', desc: 'Afficher les tournois actifs et les joueurs inscrits.' },
      { name: '/tournoi cloturer <tournoi_id> <vainqueur>', desc: 'Déclarer le grand vainqueur et archiver.' },
    ],
  },
  timezone: {
    label: 'Horloge Mondiale & Fuseaux',
    emoji: '🕒',
    description: 'Heures locales, fuseaux horaires mondiaux et timestamps Discord dynamiques...',
    commands: [
      { name: '/fuseau definir <zone>', desc: 'Enregistrer votre zone horaire (Paris, Montréal, etc.).' },
      { name: '/fuseau heure [membre]', desc: 'Consulter l\'heure locale actuelle d\'un membre.' },
      { name: '/fuseau timestamp <date_heure>', desc: 'Générer des balises Discord de temps dynamique (<t:...>).' },
    ],
  },
  tags: {
    label: 'Tags & Macros d\'Entraide',
    emoji: '📌',
    description: 'Bibliothèque de raccourcis textuels et réponses instantanées du serveur...',
    commands: [
      { name: '/tag afficher <nom>', desc: 'Afficher le contenu complet d\'un tag.' },
      { name: '/tag creer <nom> <contenu>', desc: 'Créer une macro de réponse prédéfinie.' },
      { name: '/tag liste', desc: 'Consulter l\'annuaire des tags et leur popularité.' },
      { name: '/tag supprimer <nom>', desc: 'Supprimer un tag existant.' },
    ],
  },
  counting: {
    label: 'Comptage & Logique Numérique',
    emoji: '🔢',
    description: 'Comptage communautaire, 25 types d\'énigmes logiques, mini-jeux et duels 1v1...',
    commands: [
      { name: '/counting actuel', desc: 'Consulter rapidement le nombre en cours et le record.' },
      { name: '/counting partie status', desc: 'État complet, prochain attendu et règles actives.' },
      { name: '/counting logique start [difficulte]', desc: 'Énigmes logiques procédurales avec indices.' },
      { name: '/counting logique daily', desc: 'Défi mathématique quotidien avec bonus x2.' },
      { name: '/counting jeu [mystere|calcul|duel]', desc: 'Mini-jeux numériques et duels 1v1 de calcul.' },
      { name: '/counting score perso / classement', desc: 'Fiche joueur, succès, streak et top 10 serveur.' },
      { name: '/counting config [salon|mode|regles]', desc: '[Admin] Configurer salons, modes et variantes.' },
      { name: '/counting reset [compteur|record|annuler]', desc: '[Admin] Réinitialisation sécurisée avec audit.' },
    ],
  },
  gamestats: {
    label: 'Stats & Profils de Jeux Vidéo',
    emoji: '🎮',
    description: 'Statistiques de joueurs sur Minecraft, Valorant, Apex Legends...',
    commands: [
      { name: '/gamestats minecraft <pseudo>', desc: 'Fiche officielle avec skin 3D et UUID Mojang.' },
      { name: '/gamestats valorant <pseudo>', desc: 'Rang compétitif, ratio K/D et agent favori.' },
      { name: '/gamestats apex <pseudo>', desc: 'Rang saisonnier, frags totaux et légende favorite.' },
      { name: '/gamestats lier <jeu> <pseudo>', desc: 'Lier ses identifiants de jeu à son profil Discord.' },
    ],
  },
  stockmarket: {
    label: 'Bourse & Investissement Virtuel',
    emoji: '📈',
    description: 'Simulation boursière et cryptos connectée à l\'économie Saez...',
    commands: [
      { name: '/bourse cours [actif]', desc: 'Consulter les cotations en direct (BTC, ETH, AAPL, NVDA, SONY).' },
      { name: '/bourse acheter <actif> <montant>', desc: 'Investir vos pièces Saez dans un actif financier.' },
      { name: '/bourse vendre <actif> <unites>', desc: 'Revendre vos parts et empocher les bénéfices.' },
      { name: '/bourse portefeuille', desc: 'Consulter votre patrimoine net et vos investissements.' },
    ],
  },
  transcripts: {
    label: 'Transcripts & Archives de Salons',
    emoji: '📜',
    description: 'Archivage et génération de transcripts de messages sous forme de fichiers...',
    commands: [
      { name: '/transcript salon [nombre]', desc: 'Exporter l\'historique des messages du salon en fichier texte propre.' },
    ],
  },
  radio: {
    label: 'Web-Radios 24/7 en Continu',
    emoji: '📻',
    description: 'Stations radio thématiques sans interruption dans les salons vocaux...',
    commands: [
      { name: '/radio stations', desc: 'Catalogue des radios (Lofi Chill, Anime J-Pop, Synthwave, Jazz...).' },
      { name: '/radio ecouter <station>', desc: 'Lancer un flux radio continu dans votre salon vocal.' },
      { name: '/radio arreter', desc: 'Couper la radio et libérer le salon vocal.' },
    ],
  },
  servergrowth: {
    label: 'Partenariats & Croissance',
    emoji: '🤝',
    description: 'Gestion des partenariats inter-serveurs et alertes de vote/bump...',
    commands: [
      { name: '/croissance partenariat-ajouter', desc: 'Enregistrer une communauté partenaire officielle.' },
      { name: '/croissance partenariats', desc: 'Consulter le répertoire des partenaires du serveur.' },
      { name: '/croissance bump-rappel <salon>', desc: 'Configurer le salon des alertes de bump toutes les 2h.' },
    ],
  },
  musique: {
    label: 'Musique & Streaming',
    emoji: '🎵',
    description: 'Lecture YouTube, Spotify, SoundCloud, Deezer, file d\'attente, volume...',
    commands: [
      { name: '/play <titre_ou_lien>', desc: 'Lance un titre ou playlist depuis YouTube, Spotify, Deezer, SoundCloud.' },
      { name: '/pause', desc: 'Met la lecture audio en pause.' },
      { name: '/resume', desc: 'Reprend la lecture en pause.' },
      { name: '/skip', desc: 'Passe à la piste suivante dans la file d\'attente.' },
      { name: '/stop', desc: 'Arrête la musique, vide la file et déconnecte le bot.' },
      { name: '/queue', desc: 'Affiche la file d\'attente actuelle et le titre en cours.' },
      { name: '/nowplaying', desc: 'Affiche les informations détaillées du morceau en cours de lecture.' },
      { name: '/volume <niveau>', desc: 'Règle le volume de sortie audio (1 à 150%).' },
      { name: '/loop <mode>', desc: 'Active la répétition (Désactivé, Titre en cours, File entière).' },
      { name: '/shuffle', desc: 'Mélange aléatoirement les pistes dans la file.' },
      { name: '/music-help', desc: 'Affiche le guide complet de toutes les commandes musicales.' },
    ],
  },
  embed: {
    label: 'Créateur d\'Embeds',
    emoji: '🎨',
    description: 'Création de messages riches, prévisualisation, modèles et boutons...',
    commands: [
      { name: '/embed creer', desc: 'Ouvre le créateur interactif d\'embed (titre, description, bannières, couleur).' },
      { name: '/embed previsualiser', desc: 'Affiche un aperçu en direct de votre embed avant sa publication.' },
      { name: '/embed envoyer <salon>', desc: 'Publie l\'embed configuré dans le salon de votre choix.' },
      { name: '/embed modeles', desc: 'Charge un modèle pré-conçu (Annonce anime, Règlement, Événement).' },
      { name: '/embed bouton', desc: 'Ajoute des boutons cliquables interactifs ou liens sous votre embed.' },
      { name: '/embed help', desc: 'Affiche le guide d\'utilisation du constructeur d\'embeds.' },
    ],
  },
  voice: {
    label: 'Salons Vocaux Temporaires',
    emoji: '🔊',
    description: 'Salons personnalisés créés automatiquement à la connexion...',
    commands: [
      { name: '/voice nom <nouveau_nom>', desc: 'Renomme votre salon vocal temporaire.' },
      { name: '/voice limite <nombre>', desc: 'Modifie la limite de membres (0 = illimité).' },
      { name: '/voice verrouiller', desc: 'Rend votre salon vocal totalement privé.' },
      { name: '/voice deverrouiller', desc: 'Ouvre votre salon vocal à tous les membres.' },
      { name: '/voice autoriser <membre>', desc: 'Donne l\'accès à un membre précis dans votre salon privé.' },
      { name: '/voice bloquer <membre>', desc: 'Expulse et interdit l\'accès à un membre indésirable.' },
      { name: '/voice transferer <membre>', desc: 'Transfère la propriété de votre salon à un autre membre.' },
      { name: '/voice stats', desc: 'Consulte les statistiques de vocal globales du serveur.' },
      { name: '/voice setup', desc: 'Configure le hub de déclenchement (Réservé aux Administrateurs).' },
      { name: '/voice help', desc: 'Affiche le guide complet des salons vocaux.' },
    ],
  },
  evenements: {
    label: 'Événements Communautaires',
    emoji: '📅',
    description: 'Soirées anime, jeux, karaoké, inscriptions et rappels auto...',
    commands: [
      { name: '/event-creer', desc: 'Créer un événement avec date, description, bannières et rappels auto.' },
      { name: '/event-liste', desc: 'Voir la liste des prochains événements programmés.' },
      { name: '/event-participants <id>', desc: 'Liste de tous les membres inscrits à un événement.' },
      { name: '/event-historique', desc: 'Voir les anciens événements déjà passés.' },
      { name: '/event-annuler <id>', desc: 'Annuler un événement programmé (Organisateurs/Staff).' },
      { name: '/event-help', desc: 'Guide et aide pour organiser vos événements.' },
    ],
  },
  level: {
    label: 'Niveaux & XP Anime',
    emoji: '🏆',
    description: 'Gain d\'XP textuel et vocal, paliers 10 à 50 et cartes de rang...',
    commands: [
      { name: '/level [membre]', desc: 'Affiche votre carte de niveau ou celle d\'un membre avec palier anime.' },
      { name: '/classement-level', desc: 'Top 10 des membres les plus actifs du serveur.' },
      { name: '/level-roles', desc: 'Aperçu des 5 paliers et rôles anime déblocables (Genin à Légende).' },
      { name: '/level-manage donner-xp', desc: 'Ajouter des points d\'XP à un membre (Staff/Admin).' },
      { name: '/level-manage retirer-xp', desc: 'Retirer des points d\'XP à un membre.' },
      { name: '/level-manage definir-niveau', desc: 'Définir directement le niveau d\'un membre.' },
      { name: '/level-manage config', desc: 'Consulter et ajuster les taux de gain d\'XP textuel et vocal.' },
    ],
  },
  moderation: {
    label: 'Modération & Sanctions',
    emoji: '🛡️',
    description: 'Bannissements, expulsions, mutes, avertissements et nettoyages...',
    commands: [
      { name: '/ban <membre> [raison]', desc: 'Bannir définitivement un utilisateur du serveur.' },
      { name: '/unban <id>', desc: 'Débannir un utilisateur via son identifiant Discord.' },
      { name: '/kick <membre> [raison]', desc: 'Expulser un membre du serveur.' },
      { name: '/timeout <membre> <duree>', desc: 'Mettre un membre en sourdine temporaire (1m à 28j).' },
      { name: '/untimeout <membre>', desc: 'Retirer l\'exclusion temporaire d\'un membre.' },
      { name: '/warn <membre> <raison>', desc: 'Attribuer un avertissement officiel enregistré dans les logs.' },
      { name: '/warnings <membre>', desc: 'Consulter la liste de tous les avertissements d\'un utilisateur.' },
      { name: '/clear <nombre>', desc: 'Supprimer massivement des messages dans le salon (1 à 100).' },
      { name: '/slowmode <secondes>', desc: 'Activer le mode ralenti dans un salon.' },
      { name: '/lock [salon]', desc: 'Verrouiller un salon pour empêcher les membres d\'écrire.' },
      { name: '/unlock [salon]', desc: 'Déverrouiller un salon précédemment fermé.' },
    ],
  },
  support: {
    label: 'Support & Assistance',
    emoji: '🎫',
    description: 'Système de tickets privés, FAQ interactive et signalement de bugs...',
    commands: [
      { name: '/support hub', desc: 'Ouvre le centre complet d\'assistance interactive.' },
      { name: '/support panel [salon]', desc: 'Déploie le panneau fixe de création de tickets.' },
      { name: '/support diag', desc: 'Lance un diagnostic complet des services et de l\'API.' },
      { name: '/support contact <message>', desc: 'Envoie un signal d\'urgence aux helpers et modérateurs.' },
      { name: '/ticket creer [sujet]', desc: 'Ouvre un ticket d\'assistance avec salon privé.' },
      { name: '/faq [question]', desc: 'Consulte les réponses aux questions les plus fréquentes.' },
      { name: '/bug <description>', desc: 'Signale un problème technique aux développeurs de Saez Animes.' },
    ],
  },
  serveur: {
    label: 'Serveur & Statistiques',
    emoji: '⚙️',
    description: 'Informations du serveur, stats live, suggestions et logs...',
    commands: [
      { name: '/serverinfo', desc: 'Consulter toutes les informations détaillées du serveur.' },
      { name: '/serverstats', desc: 'Afficher les compteurs de membres, salons et statistiques.' },
      { name: '/suggest <proposition>', desc: 'Proposer une idée anime, logiciel ou serveur soumise aux votes.' },
      { name: '/config', desc: 'Panneau de configuration général du bot.' },
      { name: '/logs', desc: 'Consulter les derniers journaux d\'audit du serveur.' },
    ],
  },
  giveaways: {
    label: 'Giveaways & Concours',
    emoji: '🎉',
    description: 'Tirages au sort, rôles requis et récompenses communautaires...',
    commands: [
      { name: '/giveaway start', desc: 'Lancer un nouveau giveaway avec durée, gagnants et lot.' },
      { name: '/giveaway end <id>', desc: 'Terminer immédiatement un giveaway en cours.' },
      { name: '/giveaway reroll <id>', desc: 'Relancer le tirage au sort pour choisir un nouveau gagnant.' },
      { name: '/giveaway list', desc: 'Lister les giveaways actifs sur le serveur.' },
    ],
  },
  securite: {
    label: 'Sécurité & Anti-Raid',
    emoji: '🔒',
    description: 'Protection contre les raids, bots frauduleux et spams...',
    commands: [
      { name: '/antiraid on/off', desc: 'Active ou désactive le mode protection renforcée anti-raid.' },
      { name: '/antispam', desc: 'Configure la détection et punition automatique du spam.' },
      { name: '/verification', desc: 'Système de vérification des nouveaux membres (Captcha / Clic).' },
    ],
  },
  backup: {
    label: 'Sauvegardes & Restauration',
    emoji: '💾',
    description: 'Sauvegarde complète, archivage, clonage et restauration du serveur...',
    commands: [
      { name: '/backup create [nom] [type]', desc: 'Créer une sauvegarde configurable du serveur.' },
      { name: '/backup list', desc: 'Consulter l\'historique et la liste des sauvegardes enregistrées.' },
      { name: '/backup info <id>', desc: 'Afficher les détails techniques et statistiques d\'un snapshot.' },
      { name: '/backup restore <id>', desc: 'Restaurer les rôles, salons et permissions depuis un backup.' },
      { name: '/backup export <id>', desc: 'Exporter une sauvegarde sous forme de fichier JSON sécurisé.' },
      { name: '/backup import <fichier>', desc: 'Importer une sauvegarde externe sur le serveur.' },
      { name: '/backup verify <id>', desc: 'Contrôler l\'intégrité des données d\'une sauvegarde.' },
      { name: '/backup compare <id1> <id2>', desc: 'Comparer deux sauvegardes et détecter les changements.' },
      { name: '/backup auto [action]', desc: 'Planificateur automatique de sauvegardes récurrentes.' },
      { name: '/backup delete <id>', desc: 'Supprimer définitivement une sauvegarde archivée.' },
    ],
  },
  bookmarks: {
    label: 'Marque-Pages & Favoris',
    emoji: '🔖',
    description: 'Gestion avancée de marque-pages, collections, favoris et partage...',
    commands: [
      { name: '/bookmark ajouter <titre> <url>', desc: 'Enregistrer un nouveau marque-page avec tags et note.' },
      { name: '/bookmark liste [collection]', desc: 'Consulter et explorer vos marque-pages enregistrés.' },
      { name: '/bookmark collection <action> [nom]', desc: 'Créer, renommer ou organiser vos dossiers de collections.' },
      { name: '/bookmark favoris', desc: 'Accéder rapidement à vos marque-pages favoris prioritaires.' },
      { name: '/bookmark partager <id> [salon]', desc: 'Partager une ressource ou un lien utile avec le serveur.' },
      { name: '/bookmark stats', desc: 'Statistiques sur vos liens, visites, tags et espace de stockage.' },
      { name: '/bookmark export', desc: 'Exporter vos marque-pages au format HTML/JSON universel.' },
    ],
  },
  welcome: {
    label: 'Bienvenue & Salons',
    emoji: '👋',
    description: 'Messages de bienvenue, cartes graphiques et attribution de rôles...',
    commands: [
      { name: '/welcome setup', desc: 'Configure le salon et le modèle de message de bienvenue.' },
      { name: '/welcome test', desc: 'Simule l\'arrivée d\'un nouveau membre pour tester la configuration.' },
      { name: '/autorole', desc: 'Définit les rôles attribués automatiquement aux nouveaux arrivants.' },
    ],
  },
  logiciel: {
    label: 'Logiciel Saez Animes',
    emoji: '💻',
    description: 'Connexion de l\'application de bureau, streaming et statut...',
    commands: [
      { name: '/saez connect', desc: 'Lie votre compte Discord à votre logiciel Saez Animes.' },
      { name: '/saez profil', desc: 'Affiche votre profil anime, niveau karaoké et jeux synchronisés.' },
      { name: '/saez presence', desc: 'Met à jour votre statut Rich Presence Discord.' },
    ],
  },
  economie: {
    label: 'Économie Virtuelle',
    emoji: '🪙',
    description: 'Monnaie Saez Coins, boutique de 50 objets, daily, weekly, inventaire...',
    commands: [
      { name: '/balance [membre]', desc: 'Consulter votre solde de pièces ou celui d\'un autre membre.' },
      { name: '/daily', desc: 'Récupérer votre récompense quotidienne (toutes les 24h).' },
      { name: '/weekly', desc: 'Récupérer votre méga bonus hebdomadaire (tous les 7 jours).' },
      { name: '/shop [categorie] [page]', desc: 'Parcourir la boutique officielle (50 rôles, badges, auras).' },
      { name: '/buy <item_id>', desc: 'Acheter un article ou un badge dans la boutique.' },
      { name: '/inventory [membre]', desc: 'Consulter l\'inventaire des objets et badges possédés.' },
      { name: '/leaderboard-eco', desc: 'Top 10 des membres les plus riches du serveur.' },
      { name: '/eco-manage <donner|retirer>', desc: 'Gérer les soldes de pièces des membres (Admin).' },
    ],
  },
  onboarding: {
    label: 'Onboarding & Parcours',
    emoji: '🌸',
    description: 'Questionnaire interactif d\'arrivée et attribution de rôles selon passions...',
    commands: [
      { name: '/onboarding start', desc: 'Lancer le questionnaire interactif et choisir ses rôles.' },
      { name: '/onboarding panel', desc: 'Déployer le panneau fixe d\'accueil dans un salon (Admin).' },
    ],
  },
  polls: {
    label: 'Sondages Avancés',
    emoji: '📊',
    description: 'Votes communautaires avec barres de progression et options anonymes...',
    commands: [
      { name: '/poll creer', desc: 'Créer un sondage interactif avec 2 à 4 choix et mode anonyme/public.' },
      { name: '/poll help', desc: 'Guide des fonctionnalités de vote communautaire.' },
    ],
  },
  profil: {
    label: 'Profils & Badges',
    emoji: '👤',
    description: 'Cartes de profil complètes, badges obtenus, date d\'arrivée et niveau...',
    commands: [
      { name: '/profile [membre]', desc: 'Afficher la fiche de profil anime complète d\'un utilisateur.' },
    ],
  },
  tempchannels: {
    label: 'Salons Éphémères',
    emoji: '⏳',
    description: 'Salons textuels temporaires créés à la demande avec gestion des accès...',
    commands: [
      { name: '/tempchannel creer <nom> [prive]', desc: 'Créer un salon textuel temporaire éphémère.' },
      { name: '/tempchannel inviter <membre>', desc: 'Inviter un ami dans votre salon temporaire privé.' },
      { name: '/tempchannel fermer', desc: 'Fermer et supprimer immédiatement le salon temporaire.' },
    ],
  },
  traduction: {
    label: 'Traduction Instantanée',
    emoji: '🌐',
    description: 'Traduction multi-langues instantanée dans les salons de discussion...',
    commands: [
      { name: '/translate <texte> [langue]', desc: 'Traduire un texte en français, anglais, japonais, etc.' },
    ],
  },
  automation: {
    label: 'Automatisation & Règles',
    emoji: '⚡',
    description: 'Moteur unifié d\'automatisation, réponses intelligentes, alertes orchestrées et listes...',
    commands: [
      { name: '/automation <creer|details|tester|modeles>', desc: 'Moteur central : scénarios déclencheur ➔ conditions ➔ actions.' },
      { name: '/automation <activer|desactiver|pause|reprendre>', desc: 'Gestion du cycle de vie et statut des règles.' },
      { name: '/automation <historique|dupliquer|export|import|nettoyer>', desc: 'Audit, duplication, sauvegarde et maintenance des logs.' },
      { name: '/reponse <creer|liste|tester|details|modifier>', desc: 'Réponses automatiques avec modes exact/partiel/regex et variables.' },
      { name: '/orchestral-alert <creer|liste|declencher|acquitter>', desc: 'Alertes staff orchestrées avec priorités, relances et escalades.' },
      { name: '/liste <creer|voir|ajouter|retirer|hasard|doublons>', desc: 'Listes dynamiques pour mots-clés, réponses, ressources et tirages.' },
    ],
  },
  invites: {
    label: 'Suivi des Invitations',
    emoji: '📨',
    description: 'Compteur de membres invités et statistiques des recruteurs du serveur...',
    commands: [
      { name: '/invites [membre]', desc: 'Afficher le nombre de membres recrutés par un utilisateur.' },
    ],
  },
  knowledge: {
    label: 'Base de Connaissances',
    emoji: '📚',
    description: 'FAQ officielle, guides et articles d\'assistance par mots-clés...',
    commands: [
      { name: '/kb search <mots_cles>', desc: 'Rechercher un guide ou un tutoriel dans la base.' },
      { name: '/kb article <id>', desc: 'Consulter un article d\'aide par son identifiant.' },
      { name: '/kb categories', desc: 'Lister toutes les rubriques disponibles.' },
    ],
  },
  backup: {
    label: 'Sauvegarde & Backup',
    emoji: '💾',
    description: 'Sauvegardes complètes/partielles, restauration sécurisée, exports/imports, simulation et auto-backup...',
    commands: [
      { name: '/backup create [nom] [type]', desc: 'Créer une sauvegarde complète ou sélective du serveur.' },
      { name: '/backup list [type] [tri]', desc: 'Liste interactive et paginée des sauvegardes disponibles.' },
      { name: '/backup restore <id> [mode]', desc: 'Restauration contrôlée avec confirmation et sauvegarde préalable.' },
      { name: '/backup test-restore <id>', desc: 'Simulation sans risque de restauration (Dry-Run).' },
      { name: '/backup verify <id>', desc: 'Contrôle d\'intégrité cryptographique SHA-256 et validation.' },
      { name: '/backup compare <id>', desc: 'Comparaison différentielle entre la sauvegarde et le serveur en direct.' },
      { name: '/backup export <id>', desc: 'Exporter une sauvegarde sous forme de fichier JSON certifié.' },
      { name: '/backup import <fichier>', desc: 'Importer une sauvegarde externe avec validation stricte.' },
      { name: '/backup schedule <frequence>', desc: 'Planification des sauvegardes automatiques récurrentes.' },
      { name: '/backup status', desc: 'État de santé et diagnostic du système de sauvegarde.' },
    ],
  },
  fun: {
    label: 'Fun & Jeux Anime',
    emoji: '🎮',
    description: 'Mini-jeux, devinettes anime, quiz et interactions amusantes...',
    commands: [
      { name: '/anime-quote', desc: 'Affiche une citation mémorable d\'un personnage d\'anime.' },
      { name: '/roll [faces]', desc: 'Lance un dé aléatoire.' },
      { name: '/8ball <question>', desc: 'Pose une question à la boule magique.' },
      { name: '/pile-ou-face', desc: 'Joue à pile ou face.' },
    ],
  },
};
export function buildCategoryEmbed(catKey, guild) {
  const cat = CATEGORIES_CONFIG[catKey];
  if (!cat) return null;
  const embed = new EmbedBuilder()
    .setTitle(`${cat.emoji} Catégorie : ${cat.label}`)
    .setDescription(`${cat.description}\n\n**Liste des commandes disponibles :**`)
    .setColor(0x00e5ff)
    .setFooter({
      text: `Codé avec ❤️ par Saez | Saez Animes • ${cat.commands.length} commandes répertoriées`,
      iconURL: guild?.iconURL() || undefined,
    });
  for (const cmd of cat.commands) {
    embed.addFields({
      name: `\`${cmd.name}\``,
      value: `↳ ${cmd.desc}`,
      inline: false,
    });
  }
  return embed;
}
export function buildOverviewEmbed(guild) {
  const embed = new EmbedBuilder()
    .setTitle('✨ Annuaire des Commandes — Bot Saez Animes')
    .setDescription(
      'Bienvenue dans le centre d\'aide interactif officiel du bot **Saez Animes** !\n' +
      'Utilisez le menu déroulant ci-dessous pour explorer chaque catégorie de commandes, leurs arguments et leurs fonctionnalités en détail.'
    )
    .setColor(0x00e5ff)
    .setThumbnail(guild?.iconURL({ dynamic: true }) || 'https://raw.githubusercontent.com/saezanimes/assets/main/logo.png')
    .setFooter({
      text: 'Codé avec ❤️ par Saez | Saez Animes • Sélectionnez une catégorie ci-dessous',
      iconURL: guild?.iconURL() || undefined,
    });
  let totalCmds = 0;
  for (const [key, data] of Object.entries(CATEGORIES_CONFIG)) {
    totalCmds += data.commands.length;
    embed.addFields({
      name: `${data.emoji} ${data.label}`,
      value: `> *${data.description}*\n> \`/help ${key}\` • **${data.commands.length} commandes**`,
      inline: true,
    });
  }
  embed.addFields({
    name: '📊 Statistiques globales',
    value: `🤖 **${Object.keys(CATEGORIES_CONFIG).length} catégories** • ⚡ **${totalCmds} commandes slash disponibles**`,
    inline: false,
  });
  return embed;
}
export function buildSelectMenuRow(selectedKey = null) {
  return buildSelectMenuRows(selectedKey);
}
export function buildSelectMenuRows(selectedKey = null) {
  const entries = Object.entries(CATEGORIES_CONFIG);
  const rows = [];
  const chunkSize = 25;
  for (let idx = 0; idx < entries.length; idx += chunkSize) {
    const chunk = entries.slice(idx, idx + chunkSize);
    const partNum = Math.floor(idx / chunkSize) + 1;
    const totalParts = Math.ceil(entries.length / chunkSize);
    const customId = `saez_help_select_cat_${partNum}`;
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(
        totalParts > 1
          ? `🔽 Catégories (${partNum}/${totalParts}) : ${chunk[0][1].label} ...`
          : '🔽 Choisissez une catégorie de commandes à explorer...'
      );
    for (const [key, data] of chunk) {
      selectMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(data.label)
          .setDescription(data.description.substring(0, 95))
          .setValue(key)
          .setEmoji(data.emoji)
          .setDefault(selectedKey === key)
      );
    }
    rows.push(new ActionRowBuilder().addComponents(selectMenu));
  }
  return rows;
}
export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Centre d\'aide interactif de toutes les commandes du bot')
    .addStringOption((opt) =>
      opt
        .setName('categorie')
        .setDescription('Catégorie spécifique à consulter directement')
        .setRequired(false)
        .addChoices(
          { name: '🪙 Économie Virtuelle', value: 'economie' },
          { name: '🎵 Musique & Streaming', value: 'musique' },
          { name: '🎨 Créateur d\'Embeds', value: 'embed' },
          { name: '🔊 Salons Vocaux', value: 'voice' },
          { name: '📅 Événements', value: 'evenements' },
          { name: '🏆 Niveaux & XP', value: 'level' },
          { name: '🌸 Onboarding & Parcours', value: 'onboarding' },
          { name: '📊 Sondages Avancés', value: 'polls' },
          { name: '👤 Profils & Badges', value: 'profil' },
          { name: '⏳ Salons Éphémères', value: 'tempchannels' },
          { name: '🌐 Traduction', value: 'traduction' },
          { name: '⚡ Automatisation', value: 'automation' },
          { name: '📨 Invitations', value: 'invites' },
          { name: '📚 Base de Connaissances', value: 'knowledge' },
          { name: '💾 Sauvegarde & Backup', value: 'backup' },
          { name: '🛡️ Modération', value: 'moderation' },
          { name: '🎫 Support & Tickets', value: 'support' },
          { name: '⚙️ Serveur & Stats', value: 'serveur' },
          { name: '🎉 Giveaways', value: 'giveaways' },
          { name: '🔒 Sécurité', value: 'securite' },
          { name: '👋 Bienvenue', value: 'welcome' },
          { name: '💻 Logiciel Saez', value: 'logiciel' },
          { name: '🎮 Fun & Jeux', value: 'fun' }
        )
    ),
  async execute(interaction) {
    const directCat = interaction.options.getString('categorie');
    if (directCat && CATEGORIES_CONFIG[directCat]) {
      const catEmbed = buildCategoryEmbed(directCat, interaction.guild);
      const rows = buildSelectMenuRows(directCat);
      return await interaction.reply({
        embeds: [catEmbed],
        components: rows,
        flags: MessageFlags.Ephemeral,
      });
    }
    const overviewEmbed = buildOverviewEmbed(interaction.guild);
    const rows = buildSelectMenuRows();
    const response = await interaction.reply({
      embeds: [overviewEmbed],
      components: rows,
      flags: MessageFlags.Ephemeral,
    });
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 300_000,
    });
    collector.on('collect', async (i) => {
      if (!i.customId.startsWith('saez_help_select_cat')) return;
      const selectedValue = i.values[0];
      const newEmbed = buildCategoryEmbed(selectedValue, i.guild);
      const newRows = buildSelectMenuRows(selectedValue);
      await i.update({
        embeds: [newEmbed],
        components: newRows,
      });
    });
  },
};
