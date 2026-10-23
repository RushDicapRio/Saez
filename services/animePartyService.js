import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { getDb } from '../database/mongo.js';
import { addQuizScore, getQuizLeaderboard } from './communityLeaderboardService.js';
import { config } from '../config.js';
export const EXTENDED_QUOTES = [
  { id: 'q1', quote: 'Si tu ne risques pas ta vie, tu ne peux pas créer un futur.', character: 'Monkey D. Luffy', anime: 'One Piece', year: 1999, context: 'Arc Enies Lobby', upvotes: 42 },
  { id: 'q2', quote: 'Ceux qui abandonnent leurs amis sont pires que des déchets.', character: 'Kakashi Hatake', anime: 'Naruto', year: 2002, context: 'Philosophie d\'Obito Uchiha', upvotes: 39 },
  { id: 'q3', quote: 'Si tu gagnes, tu vis. Si tu perds, tu meurs. Si tu ne te bats pas, tu ne peux pas gagner !', character: 'Eren Jaeger', anime: 'L\'Attaque des Titans', year: 2013, context: 'Entraînement de la 104ème brigade', upvotes: 56 },
  { id: 'q4', quote: 'Ne crois pas en toi ! Crois en moi qui crois en toi !', character: 'Kamina', anime: 'Gurren Lagann', year: 2007, context: 'Encouragement à Simon le foreur', upvotes: 35 },
  { id: 'q5', quote: 'L\'homme qui se relève après être tombé est bien plus fort que celui qui n\'est jamais tombé.', character: 'Goku', anime: 'Dragon Ball Z', year: 1989, context: 'Face aux guerriers de l\'univers', upvotes: 48 },
  { id: 'q6', quote: 'Dans ce monde, la force fait la loi. C\'est pour cela que je me battrai jusqu\'à devenir le plus fort.', character: 'Sung Jin-woo', anime: 'Solo Leveling', year: 2024, context: 'Éveil du Monarque des Ombres', upvotes: 51 },
  { id: 'q7', quote: 'L\'infini existe pour protéger ce qui compte le plus.', character: 'Satoru Gojo', anime: 'Jujutsu Kaisen', year: 2020, context: 'Affrontement contre Jogo', upvotes: 62 },
  { id: 'q8', quote: 'Une leçon apprise sans douleur n\'a pas de valeur.', character: 'Edward Elric', anime: 'Fullmetal Alchemist: Brotherhood', year: 2009, context: 'Principe de l\'Échange Équivalent', upvotes: 44 },
  { id: 'q9', quote: 'Je vais prendre une chips... et je vais la manger !', character: 'Light Yagami', anime: 'Death Note', year: 2006, context: 'Scène culte de surveillance sous caméra', upvotes: 75 },
  { id: 'q10', quote: 'Ce n\'est pas parce que quelqu\'un est fort qu\'il est respecté. C\'est parce qu\'il est respecté qu\'il devient fort.', character: 'Itachi Uchiha', anime: 'Naruto Shippuden', year: 2007, context: 'Conseil à Naruto concernant l\'Hokage', upvotes: 58 },
  { id: 'q11', quote: 'Peu importe le nombre de personnes que tu sauves, un jour tu feras face à quelqu\'un que tu ne pourras pas sauver.', character: 'Megumi Fushiguro', anime: 'Jujutsu Kaisen', year: 2020, context: 'Devant Yuji Itadori', upvotes: 29 },
  { id: 'q12', quote: 'Même si je dois mourir, je protégerai mon honneur et mes compagnons.', character: 'Roronoa Zoro', anime: 'One Piece', year: 1999, context: 'Rien ne s\'est passé (Thriller Bark)', upvotes: 64 },
  { id: 'q13', quote: 'Ce n\'est pas la mort que je crains, c\'est que ma rage s\'estompe avec le temps.', character: 'Kurapika', anime: 'Hunter x Hunter', year: 2011, context: 'Chasse à la Brigade Fantôme', upvotes: 38 },
  { id: 'q14', quote: 'Il n\'y a pas de honte à avoir peur. Ce qui compte, c\'est ce que l\'on fait de cette peur.', character: 'Gildarts Clive', anime: 'Fairy Tail', year: 2009, context: 'Conseil donné à Natsu Dragnir', upvotes: 27 },
  { id: 'q15', quote: 'Le monde est cruel, mais aussi très beau.', character: 'Mikasa Ackerman', anime: 'L\'Attaque des Titans', year: 2013, context: 'Survie à Trost', upvotes: 41 },
];
export const SOUNDBOARD_TRACKS = [
  { id: 'omae', title: 'Omae wa mou shindeiru', char: 'Kenshiro', anime: 'Fist of the North Star', line: 'お前はもう死んでいる (Tu es déjà mort)', emoji: '💥' },
  { id: 'gojo', title: 'Ryoiki Tenkai : Muryōkūsho', char: 'Satoru Gojo', anime: 'Jujutsu Kaisen', line: '領域展開 : 無量空処 (Extension du Territoire : Espace Infini)', emoji: '👁️' },
  { id: 'bankai', title: 'Bankai !', char: 'Ichigo Kurosaki', anime: 'Bleach', line: '卍解 ! (Bankai)', emoji: '🗡️' },
  { id: 'arise', title: 'Arise / Debout', char: 'Sung Jin-woo', anime: 'Solo Leveling', line: '일어나라... (Debout, mes ombres !)', emoji: '👑' },
  { id: 'dattebayo', title: 'Dattebayo !', char: 'Naruto Uzumaki', anime: 'Naruto', line: 'だってばよ ! (C\'est mon nindo !)', emoji: '🍥' },
  { id: 'za_warudo', title: 'Za Warudo ! Toki yo Tomare', char: 'Dio Brando', anime: 'JoJo\'s Bizarre Adventure', line: 'ザ・ワールド！時よ止まれ！ (Le Monde ! Que le temps s\'arrête !)', emoji: '⏳' },
  { id: 'plus_ultra', title: 'Plus Ultra !', char: 'All Might', anime: 'My Hero Academia', line: 'Plus Ultra ! Au-delà des limites !', emoji: '🦸' },
  { id: 'gear5', title: 'Joy Boy est de retour !', char: 'Luffy Gear 5', anime: 'One Piece', line: 'Hahaha ! Les tambours de la libération résonnent !', emoji: '🥁' },
  { id: 'shinei', title: 'Shineee !', char: 'Katsuki Bakugo', anime: 'My Hero Academia', line: 'SHINEEEEEE ! (Meurs !)', emoji: '💣' },
  { id: 'sasageyo', title: 'Shinzo wo Sasageyo !', char: 'Erwin Smith', anime: 'L\'Attaque des Titans', year: 2017, line: '心臓を捧げよ！ (Offrez vos cœurs !)', emoji: '🐎' },
];
export const EMOJI_CHALLENGES = [
  { emojis: '🏴‍☠️ 👒 🍖 🚢 ⚔️', answer: 'One Piece', options: ['One Piece', 'Bleach', 'Fairy Tail', 'Black Clover'] },
  { emojis: '📓 ✍️ 🍎 👁️ 💀', answer: 'Death Note', options: ['Death Note', 'Monster', 'Tokyo Ghoul', 'Psycho-Pass'] },
  { emojis: '🥋 ⚡ 👁️ 🤞 👹', answer: 'Jujutsu Kaisen', options: ['Jujutsu Kaisen', 'Chainsaw Man', 'Bleach', 'Naruto'] },
  { emojis: '🗡️ 🪓 🛡️ ⚔️ 🏰 ❄️', answer: 'Vinland Saga', options: ['Vinland Saga', 'Berserk', 'Kingdom', 'Claymore'] },
  { emojis: '🪚 🩸 🐶 😈 🍔', answer: 'Chainsaw Man', options: ['Chainsaw Man', 'Jujutsu Kaisen', 'Dorohedoro', 'Parasyte'] },
  { emojis: '🥷 🦊 🍥 🌀 🍜', answer: 'Naruto', options: ['Naruto', 'Dragon Ball', 'Hunter x Hunter', 'Boruto'] },
  { emojis: '🦾 🦿 ⚗️ 🧬 🪙', answer: 'Fullmetal Alchemist', options: ['Fullmetal Alchemist', 'Dr. Stone', 'Steins;Gate', 'Soul Eater'] },
  { emojis: '🏹 🧝‍♀️ ⏳ 💐 🪄', answer: 'Frieren: Beyond Journey\'s End', options: ['Frieren: Beyond Journey\'s End', 'Mushoku Tensei', 'Overlord', 'Re:Zero'] },
  { emojis: '🎮 🗡️ 👑 🌑 👥', answer: 'Solo Leveling', options: ['Solo Leveling', 'Sword Art Online', 'Log Horizon', 'Shangri-La Frontier'] },
  { emojis: '🦸 🥦 💥 🧤 🏫', answer: 'My Hero Academia', options: ['My Hero Academia', 'One Punch Man', 'Mob Psycho 100', 'Fire Force'] },
  { emojis: '🎸 📦 👧 👘 🎵', answer: 'Bocchi the Rock!', options: ['Bocchi the Rock!', 'K-On!', 'Your Lie in April', 'Given'] },
  { emojis: '🧪 🥼 🍌 ⏰ 📻', answer: 'Steins;Gate', options: ['Steins;Gate', 'Erased', 'Serial Experiments Lain', 'Code Geass'] },
];
export const ANIME_PENDU_WORDS = [
  { word: 'JUJUTSU KAISEN', hint: 'Exorcistes, énergie occulte et fléaux millénaires' },
  { word: 'ONE PIECE', hint: 'À la recherche du trésor ultime de Gol D. Roger' },
  { word: 'SOLO LEVELING', hint: 'Le chasseur le plus faible devenu le Monarque des Ombres' },
  { word: 'DEMON SLAYER', hint: 'Tanjiro et son sabre noir pour sauver Nezuko' },
  { word: 'DEATH NOTE', hint: 'Un cahier de mort et un duel d\'esprits légendaire' },
  { word: 'FULLMETAL ALCHEMIST', hint: 'Deux frères en quête de la Pierre Philosophale' },
  { word: 'CHAINSAW MAN', hint: 'Denji fusionné avec Pochita le démon tronçonneuse' },
  { word: 'ATTACK ON TITAN', hint: 'L\'humanité retranchée derrière trois murs immenses' },
  { word: 'HUNTER X HUNTER', hint: 'Gon recherche son père et passe l\'examen suprême' },
  { word: 'BLEACH', hint: 'Ichigo devient Shinigami remplaçant avec Zangetsu' },
  { word: 'DRAGON BALL', hint: 'La quête des 7 boules de cristal et du dragon Shenron' },
  { word: 'FRIEREN', hint: 'L\'elfe magicienne qui découvre le prix des souvenirs' },
];
export const VRAI_OU_FAUX_DATA = [
  {
    q: 'Dans Dragon Ball Z, Goku n\'a jamais éliminé Freezer sur Namek.',
    ans: true,
    expl: 'VRAI ! Goku a épargné Freezer après lui avoir donné un peu d\'énergie. C\'est Trunks du Futur qui découpe et détruit définitivement Freezer sur Terre.'
  },
  {
    q: 'Le créateur de One Piece, Eiichiro Oda, a révélé que Luffy trouvera le One Piece au chapitre 1000.',
    ans: false,
    expl: 'FAUX ! Le chapitre 1000 marquait l\'affrontement sur le toit d\'Onigashima, mais le One Piece n\'a pas encore été découvert.'
  },
  {
    q: 'Dans Death Note, le détective L sait dès le premier épisode que Kira habite au Japon dans la région du Kanto.',
    ans: true,
    expl: 'VRAI ! Grâce au piège de Lind L. Tailor diffusé uniquement dans la région du Kanto, L a immédiatement localisé Kira.'
  },
  {
    q: 'Dans Naruto, le Rasengan est une technique inventée par Jiraya.',
    ans: false,
    expl: 'FAUX ! Le Rasengan a été créé par Minato Namikaze (le 4ème Hokage) après trois ans de recherche sur les orbes des démons à queues.'
  },
  {
    q: 'Dans Jujutsu Kaisen, Satoru Gojo est né avec les Six Yeux ET le Sort de l\'Infini.',
    ans: true,
    expl: 'VRAI ! C\'est la première personne en plus de 400 ans dans le clan Gojo à naître avec les deux dons combinés.'
  },
  {
    q: 'L\'Attaque des Titans compte exactement 9 Titans primordiaux.',
    ans: true,
    expl: 'VRAI ! Assaillant, Colossal, Cuirassé, Féminin, Bestial, Mâchoire, Charrette, Marteau et Originel.'
  },
  {
    q: 'Dans Demon Slayer, Muzan Kibutsuji a été transformé en démon par un sortilège divin.',
    ans: false,
    expl: 'FAUX ! Muzan était un noble humain de l\'ère Heian malade, guéri par le remède expérimental à base de Lys Araignée Bleue d\'un médecin.'
  },
];
export const DEVINE_PERSO_DATA = [
  {
    perso: 'Satoru Gojo',
    anime: 'Jujutsu Kaisen',
    clues: [
      '1️⃣ Cheveux blancs étincelants et bandeau noir sur les yeux.',
      '2️⃣ Exorciste le plus puissant de l\'époque moderne.',
      '3️⃣ Possesseur des Six Yeux et de l\'Extension du Territoire : Espace Infini.',
      '4️⃣ Professeur fantasque à l\'école d\'exorcisme de Tokyo.'
    ],
    options: ['Satoru Gojo', 'Kakashi Hatake', 'Killua Zoldyck', 'Toji Fushiguro']
  },
  {
    perso: 'Levi Ackerman',
    anime: 'L\'Attaque des Titans',
    clues: [
      '1️⃣ Petite taille, regard glacial et passion obsessionnelle pour le nettoyage.',
      '2️⃣ Caporal-chef surnommé "Le soldat le plus fort de l\'humanité".',
      '3️⃣ Manie les doubles lames avec une rotation ultra-rapide meurtrière.',
      '4️⃣ A juré d\'éliminer le Titan Bestial sur ordre d\'Erwin Smith.'
    ],
    options: ['Levi Ackerman', 'Eren Jaeger', 'Erwin Smith', 'Jean Kirschtein']
  },
  {
    perso: 'Roronoa Zoro',
    anime: 'One Piece',
    clues: [
      '1️⃣ Cheveux verts (tête de marimo) et sens de l\'orientation catastrophique.',
      '2️⃣ Style de combat unique à 3 sabres (Santoryu).',
      '3️⃣ A encaissé toute la douleur et la fatigue de son capitaine à Thriller Bark.',
      '4️⃣ Son rêve est de vaincre Dracule Mihawk pour devenir le plus grand épéiste.'
    ],
    options: ['Roronoa Zoro', 'Sanji', 'Trafalgar Law', 'Dracule Mihawk']
  },
  {
    perso: 'Sung Jin-woo',
    anime: 'Solo Leveling',
    clues: [
      '1️⃣ Chasseur de rang E connu comme "le plus faible de l\'humanité".',
      '2️⃣ A survécu à l\'épreuve du double donjon et a reçu l\'accès au "Système".',
      '3️⃣ Commande une armée de chevaliers d\'ombres avec l\'ordre "Arise".',
      '4️⃣ Devenu le Monarque des Ombres capable de soloter des portails de rang S.'
    ],
    options: ['Sung Jin-woo', 'Cha Hae-in', 'Baek Yoonho', 'Choi Jong-in']
  },
];
export const BLINDTEST_DATA = [
  {
    title: 'Gurenge',
    artist: 'LiSA',
    anime: 'Demon Slayer (Kimetsu no Yaiba)',
    type: 'Opening 1',
    hint: 'Chanson d\'ouverture culte accompagnant Tanjiro coupant son premier rocher',
    options: ['Demon Slayer', 'Sword Art Online', 'Fate/Zero', 'My Hero Academia']
  },
  {
    title: 'Kaikai Kitan',
    artist: 'Eve',
    anime: 'Jujutsu Kaisen',
    type: 'Opening 1',
    hint: 'Rythme endiablé rock alternatif japonais lors de l\'introduction de Yuji et Gojo',
    options: ['Jujutsu Kaisen', 'Chainsaw Man', 'Tokyo Ghoul', 'Dororo']
  },
  {
    title: 'The Rumbling',
    artist: 'SiM',
    anime: 'L\'Attaque des Titans (Final Season)',
    type: 'Opening',
    hint: 'Morceau Metalcore puissant hurlant "RUMBLING, RUMBLING, IT\'S COMING !"',
    options: ['L\'Attaque des Titans', 'Death Note', 'Vinland Saga', 'Parasyte']
  },
  {
    title: 'We Are !',
    artist: 'Hiroshi Kitadani',
    anime: 'One Piece',
    type: 'Opening 1',
    hint: 'L\'hymne éternel de la piraterie voguant sur Grand Line avec le Vogue Merry',
    options: ['One Piece', 'Naruto', 'Dragon Ball', 'Hunter x Hunter']
  },
  {
    title: 'Unravel',
    artist: 'TK from Ling Tosite Sigure',
    anime: 'Tokyo Ghoul',
    type: 'Opening 1',
    hint: 'Oshiete oshiete yo... cri poignant de Ken Kaneki acceptant sa nature de goule',
    options: ['Tokyo Ghoul', 'Parasyte', 'Psycho-Pass', 'Death Parade']
  },
];
export const ASSOCIATION_SETS = [
  {
    title: 'Personnage ⚔️ Pouvoir / Capacité',
    items: [
      { key: 'Satoru Gojo', val: 'Infini & Muryōkūsho' },
      { key: 'Monkey D. Luffy', val: 'Fruit du Nika (Gear 5)' },
      { key: 'Naruto Uzumaki', val: 'Rasengan & Mode Ermite' },
      { key: 'Edward Elric', val: 'Alchimie sans cercle' },
    ]
  },
  {
    title: 'Anime 🎬 Studio d\'Animation',
    items: [
      { key: 'Jujutsu Kaisen', val: 'MAPPA' },
      { key: 'Demon Slayer', val: 'Ufotable' },
      { key: 'L\'Attaque des Titans (S1-S3)', val: 'Wit Studio' },
      { key: 'My Hero Academia', val: 'Bones' },
    ]
  },
  {
    title: 'Héros 💥 Rival Légendaire',
    items: [
      { key: 'Goku', val: 'Vegeta' },
      { key: 'Naruto', val: 'Sasuke' },
      { key: 'Midoriya (Deku)', val: 'Bakugo' },
      { key: 'Light Yagami', val: 'L Lawliet' },
    ]
  }
];
export const MOT_INTERDIT_CARDS = [
  {
    target: 'Goku (Dragon Ball)',
    forbidden: ['Saiyan', 'Kaméhaméha', 'Super', 'Queue', 'Dragon'],
    hint: 'Héros aux cheveux noirs puis dorés protégeant la Terre contre des envahisseurs extraterrestres.'
  },
  {
    target: 'Luffy (One Piece)',
    forbidden: ['Chapeau', 'Paille', 'Pirate', 'Élastique', 'Viande'],
    hint: 'Capitaine téméraire voulant naviguer sur toutes les mers pour trouver un trésor légendaire.'
  },
  {
    target: 'Tanjiro (Demon Slayer)',
    forbidden: ['Katana', 'Démon', 'Sœur', 'Respiration', 'Eau'],
    hint: 'Jeune marchand de charbon portant des boucles d\'oreilles Hanafuda parti en voyage initiatique.'
  },
  {
    target: 'L (Death Note)',
    forbidden: ['Sucre', 'Cahier', 'Light', 'Kira', 'Accroupi'],
    hint: 'Enquêteur génial et mystérieux mangeant des pâtisseries et tenant son téléphone du bout des doigts.'
  }
];
export const activeParties = new Map();
export function createParty(channelId, hostUser, gameType = 'quiz', options = {}) {
  const party = {
    id: `party_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    channelId,
    hostId: hostUser.id,
    hostTag: hostUser.tag || hostUser.username,
    gameType,
    status: 'lobby', 
    players: new Map([[hostUser.id, { id: hostUser.id, username: hostUser.username, score: 0 }]]),
    spectators: new Set(),
    round: 0,
    maxRounds: options.maxRounds || 5,
    difficulty: options.difficulty || 'medium',
    createdAt: Date.now(),
    lastActivity: Date.now(),
    data: {},
  };
  activeParties.set(channelId, party);
  return party;
}
export function getParty(channelId) {
  return activeParties.get(channelId) || null;
}
export function joinParty(channelId, user) {
  const party = activeParties.get(channelId);
  if (!party) return { success: false, message: 'Aucune partie en attente dans ce salon.' };
  if (party.status !== 'lobby') return { success: false, message: 'La partie a déjà commencé ou est terminée.' };
  if (party.players.has(user.id)) return { success: false, message: 'Vous êtes déjà inscrit dans cette partie !' };
  if (party.players.size >= 12) return { success: false, message: 'La partie a atteint le nombre maximum de 12 joueurs.' };
  party.players.set(user.id, { id: user.id, username: user.username, score: 0 });
  party.lastActivity = Date.now();
  return { success: true, party };
}
export function leaveParty(channelId, user) {
  const party = activeParties.get(channelId);
  if (!party) return { success: false, message: 'Aucune partie active.' };
  if (!party.players.has(user.id)) return { success: false, message: 'Vous ne faites pas partie de cette session.' };
  party.players.delete(user.id);
  party.lastActivity = Date.now();
  if (party.hostId === user.id) {
    if (party.players.size > 0) {
      const nextHost = Array.from(party.players.values())[0];
      party.hostId = nextHost.id;
      party.hostTag = nextHost.username;
      return { success: true, newHost: nextHost, party };
    } else {
      activeParties.delete(channelId);
      return { success: true, cancelled: true };
    }
  }
  return { success: true, party };
}
export function cancelParty(channelId, user) {
  const party = activeParties.get(channelId);
  if (!party) return { success: false, message: 'Aucune partie active à annuler.' };
  if (party.hostId !== user.id) return { success: false, message: 'Seul l\'hôte de la partie peut l\'annuler.' };
  activeParties.delete(channelId);
  return { success: true };
}
setInterval(() => {
  const now = Date.now();
  for (const [chanId, party] of activeParties.entries()) {
    if (now - party.lastActivity > 15 * 60 * 1000) {
      activeParties.delete(chanId);
    }
  }
}, 5 * 60 * 1000);
export async function getAnimePartyProfile(guildId, userId, username = 'Otaku') {
  try {
    const db = getDb();
    const col = db.collection('anime_party_stats');
    let doc = await col.findOne({ guildId, userId });
    if (!doc) {
      doc = {
        guildId,
        userId,
        username,
        points: 0,
        gamesPlayed: 0,
        wins: 0,
        streak: 0,
        bestStreak: 0,
        favoriteGame: 'Blindtest',
        badges: ['Néophyte Otaku'],
        dailyClaimedAt: null,
        updatedAt: new Date(),
      };
      await col.insertOne(doc);
    }
    return doc;
  } catch (err) {
    console.error('[AnimeParty] Erreur getAnimePartyProfile:', err.message);
    return {
      userId,
      username,
      points: 0,
      gamesPlayed: 0,
      wins: 0,
      streak: 0,
      badges: ['Otaku En Ligne'],
    };
  }
}
export async function recordPartyGameResult(guildId, userId, username, pointsEarned = 10, isWin = false, gameType = 'Jeu') {
  try {
    const db = getDb();
    const col = db.collection('anime_party_stats');
    const current = await getAnimePartyProfile(guildId, userId, username);
    const newStreak = isWin ? (current.streak || 0) + 1 : 0;
    const bestStreak = Math.max(newStreak, current.bestStreak || 0);
    const badges = new Set(current.badges || ['Néophyte Otaku']);
    if (current.gamesPlayed + 1 >= 5) badges.add('Habitué de la Party');
    if (current.gamesPlayed + 1 >= 25) badges.add('Vétéran Otaku');
    if (isWin && (current.wins + 1) >= 10) badges.add('Champion Anime Party');
    if (bestStreak >= 3) badges.add('Série Enflammée 🔥');
    await col.updateOne(
      { guildId, userId },
      {
        $inc: { points: pointsEarned, gamesPlayed: 1, wins: isWin ? 1 : 0 },
        $set: {
          username,
          streak: newStreak,
          bestStreak,
          favoriteGame: gameType,
          badges: Array.from(badges),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
    await addQuizScore(guildId, userId, username, pointsEarned, isWin);
    return { pointsEarned, newStreak, badges: Array.from(badges) };
  } catch (err) {
    console.error('[AnimeParty] Erreur recordPartyGameResult:', err.message);
    return { pointsEarned: 0 };
  }
}
export async function getAnimePartyLeaderboard(guildId, limit = 10) {
  try {
    const db = getDb();
    const col = db.collection('anime_party_stats');
    const docs = await col
      .find({ guildId })
      .sort({ points: -1, wins: -1 })
      .limit(limit)
      .toArray();
    return docs.map((d, i) => ({
      rank: i + 1,
      userId: d.userId,
      username: d.username || 'Joueur Otaku',
      points: d.points || 0,
      wins: d.wins || 0,
      gamesPlayed: d.gamesPlayed || 0,
      badgesCount: (d.badges || []).length,
    }));
  } catch {
    return [];
  }
}
export function getDailyChallenge() {
  const todayStr = new Date().toISOString().slice(0, 10); 
  let hash = 0;
  for (let i = 0; i < todayStr.length; i++) {
    hash = (hash << 5) - hash + todayStr.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const pool = [
    {
      title: 'Maître du Pendu Quotidien',
      task: 'Résoudre un titre d\'anime au pendu sans faire plus de 3 erreurs !',
      reward: '50 points Party + 200 XP',
      bonusPoints: 50,
      type: 'pendu',
    },
    {
      title: 'Devin des Emojis',
      task: 'Identifier 3 animes grâce à leurs combinaisons d\'emojis.',
      reward: '40 points Party + 150 XP',
      bonusPoints: 40,
      type: 'emoji',
    },
    {
      title: 'Duel au Sommet',
      task: 'Participer à au moins un duel anime contre un autre membre.',
      reward: '60 points Party + 300 XP',
      bonusPoints: 60,
      type: 'duel',
    },
    {
      title: 'Incollable sur les Répliques',
      task: 'Deviner l\'auteur de 2 citations d\'animes cultes.',
      reward: '45 points Party + 180 XP',
      bonusPoints: 45,
      type: 'replique',
    },
  ];
  const chosen = pool[positiveHash % pool.length];
  return { ...chosen, date: todayStr };
}
