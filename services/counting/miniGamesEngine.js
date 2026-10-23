function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function isPrime(n) {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}
export const MINI_GAMES = {
  MYSTERE: 'mystere',
  CALCUL: 'calcul',
  SUITE: 'suite',
  PLUS_PROCHE: 'plus_proche',
  MULTIPLES: 'multiples',
  PARITE: 'parite',
  HILO: 'hilo',
  EQUATION: 'equation',
  DIVISEURS: 'diviseurs',
  PREMIERS: 'premiers',
  OBJECTIF: 'objectif',
  VRAI_FAUX: 'vrai_faux',
  CODE_SECRET: 'code_secret',
  OPERATIONS: 'operations',
  ESTIMATION: 'estimation',
};
export function createMiniGame(gameType, options = {}) {
  const type = Object.values(MINI_GAMES).includes(gameType) ? gameType : MINI_GAMES.MYSTERE;
  const gameId = `mg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  switch (type) {
    case MINI_GAMES.MYSTERE: {
      const max = options.max || 100;
      const secret = randomInt(1, max);
      return {
        id: gameId,
        type,
        title: '🎯 Nombre Mystère',
        description: `Trouvez le nombre secret compris entre **1** et **${max}** !`,
        secret,
        max,
        attempts: 0,
        maxAttempts: options.maxAttempts || 8,
        history: [],
        status: 'active',
        points: 25,
        xp: 30,
        coins: 15,
      };
    }
    case MINI_GAMES.CALCUL: {
      const a = randomInt(10, 50);
      const b = randomInt(3, 12);
      const op = Math.random() > 0.5 ? '+' : '*';
      const result = op === '+' ? a + b : a * b;
      return {
        id: gameId,
        type,
        title: '⚡ Calcul Éclair',
        description: `Calculez en moins de 30 secondes :\n\`${a} ${op} ${b} = ?\``,
        expected: String(result),
        timeoutSeconds: 30,
        status: 'active',
        points: 20,
        xp: 25,
        coins: 10,
      };
    }
    case MINI_GAMES.SUITE: {
      const start = randomInt(2, 10);
      const step = randomInt(3, 7);
      const terms = [start, start + step, start + 2 * step, start + 3 * step];
      const nextTerm = start + 4 * step;
      return {
        id: gameId,
        type,
        title: '🧩 Suite Mystère',
        description: `Découvrez la règle et donnez le terme manquant :\n\`${terms.join(', ')}, ?\``,
        expected: String(nextTerm),
        rule: `Pas constant de +${step}`,
        status: 'active',
        points: 20,
        xp: 25,
        coins: 10,
      };
    }
    case MINI_GAMES.PLUS_PROCHE: {
      const target = randomInt(150, 600);
      return {
        id: gameId,
        type,
        title: '🎯 Le Plus Proche',
        description: `Proposez un nombre le plus proche possible de la cible secrète : **${target}** !`,
        target,
        bestGuess: null,
        bestDiff: Infinity,
        bestUser: null,
        status: 'active',
        points: 30,
        xp: 40,
        coins: 20,
      };
    }
    case MINI_GAMES.MULTIPLES: {
      const base = randomInt(4, 9);
      const sample = [
        base * randomInt(2, 4),
        base * randomInt(5, 7),
        base * randomInt(8, 10) + 1, 
        base * randomInt(11, 13),
      ].sort(() => Math.random() - 0.5);
      const correctMultiples = sample.filter(n => n % base === 0);
      return {
        id: gameId,
        type,
        title: '🔢 Défi des Multiples',
        description: `Identifiez l'intrus qui **n'est PAS** un multiple de **${base}** parmi :\n\`${sample.join(', ')}\``,
        expected: String(sample.find(n => n % base !== 0)),
        status: 'active',
        points: 25,
        xp: 30,
        coins: 15,
      };
    }
    case MINI_GAMES.PARITE: {
      const a = randomInt(10, 99);
      const b = randomInt(10, 99);
      const isEven = (a * b) % 2 === 0;
      const expected = isEven ? 'pair' : 'impair';
      return {
        id: gameId,
        type,
        title: '⚖️ Pair ou Impair',
        description: `Le produit **${a} × ${b}** est-il **pair** ou **impair** ?`,
        expected,
        status: 'active',
        points: 15,
        xp: 20,
        coins: 10,
      };
    }
    case MINI_GAMES.HILO: {
      const current = randomInt(20, 80);
      const next = randomInt(1, 100);
      const expected = next > current ? 'plus' : next < current ? 'moins' : 'egal';
      return {
        id: gameId,
        type,
        title: '📈 Plus Grand ou Plus Petit',
        description: `Le nombre actuel est **${current}**.\nLe nombre secret suivant (entre 1 et 100) est-il **plus** ou **moins** élevé ?`,
        current,
        next,
        expected,
        status: 'active',
        points: 15,
        xp: 20,
        coins: 10,
      };
    }
    case MINI_GAMES.EQUATION: {
      const x = randomInt(3, 12);
      const mult = randomInt(2, 6);
      const res = mult * x;
      return {
        id: gameId,
        type,
        title: '📐 Équation Mystère',
        description: `Trouvez la valeur de **x** dans :\n\`${mult}x = ${res}\``,
        expected: String(x),
        status: 'active',
        points: 20,
        xp: 25,
        coins: 10,
      };
    }
    case MINI_GAMES.DIVISEURS: {
      const n = randomInt(12, 36);
      const count = getDivisorsCount(n);
      return {
        id: gameId,
        type,
        title: '🔍 Défi des Diviseurs',
        description: `Combien de diviseurs positifs possède le nombre **${n}** ? (Exemple pour 6 : 1, 2, 3, 6 = 4 diviseurs)`,
        expected: String(count),
        status: 'active',
        points: 30,
        xp: 35,
        coins: 20,
      };
    }
    case MINI_GAMES.PREMIERS: {
      const candidates = [
        randomInt(10, 50),
        randomInt(10, 50),
        randomInt(10, 50),
      ];
      const primesPool = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
      const primeChoice = primesPool[randomInt(0, primesPool.length - 1)];
      const nonPrimes = [12, 14, 15, 16, 18, 20, 21, 22, 24, 25, 27, 28, 30].sort(() => Math.random() - 0.5).slice(0, 3);
      const pool = [...nonPrimes, primeChoice].sort(() => Math.random() - 0.5);
      return {
        id: gameId,
        type,
        title: '⭐ Défi des Nombres Premiers',
        description: `Trouvez le seul **nombre premier** parmi cette liste :\n\`${pool.join(', ')}\``,
        expected: String(primeChoice),
        status: 'active',
        points: 25,
        xp: 30,
        coins: 15,
      };
    }
    case MINI_GAMES.OBJECTIF: {
      const plates = [2, 3, 5, 10, 25].sort(() => Math.random() - 0.5).slice(0, 4);
      const target = plates[0] * plates[1] + plates[2];
      return {
        id: gameId,
        type,
        title: '🎯 Objectif Mathématique',
        description: `Atteignez la cible exacte de **${target}** en combinant les plaques :\n\`[ ${plates.join(' ] [ ')} ]\` avec des opérations basiques (+, -, *).\nEnvoyez votre calcul complet (ex: \`2 * 25 + 5\`).`,
        plates,
        target,
        status: 'active',
        points: 35,
        xp: 50,
        coins: 25,
      };
    }
    case MINI_GAMES.VRAI_FAUX: {
      const a = randomInt(2, 9);
      const b = randomInt(2, 9);
      const actual = a * b;
      const isCorrect = Math.random() > 0.5;
      const presented = isCorrect ? actual : actual + (Math.random() > 0.5 ? 2 : -2);
      return {
        id: gameId,
        type,
        title: '❓ Vrai ou Faux Math',
        description: `Affirmation : \`${a} × ${b} = ${presented}\`\nEst-ce **vrai** ou **faux** ?`,
        expected: isCorrect ? 'vrai' : 'faux',
        status: 'active',
        points: 15,
        xp: 20,
        coins: 10,
      };
    }
    case MINI_GAMES.CODE_SECRET: {
      const d1 = randomInt(1, 9);
      let d2 = randomInt(1, 9);
      while (d2 === d1) d2 = randomInt(1, 9);
      let d3 = randomInt(1, 9);
      while (d3 === d1 || d3 === d2) d3 = randomInt(1, 9);
      const code = `${d1}${d2}${d3}`;
      return {
        id: gameId,
        type,
        title: '🔐 Code Secret (Crack the Code)',
        description: `Découvrez le code à 3 chiffres distincts !\nIndice 1 : La somme des chiffres vaut **${d1 + d2 + d3}**.\nIndice 2 : Le premier chiffre est **${d1 % 2 === 0 ? 'pair' : 'impair'}**.`,
        code,
        attempts: 0,
        maxAttempts: 5,
        status: 'active',
        points: 40,
        xp: 55,
        coins: 30,
      };
    }
    case MINI_GAMES.OPERATIONS: {
      const a = randomInt(20, 80);
      const b = randomInt(5, 15);
      const diff = a - b;
      return {
        id: gameId,
        type,
        title: '➕ Défi des Opérations',
        description: `Trouvez le nombre manquant :\n\`${a} - [ ? ] = ${diff}\``,
        expected: String(b),
        status: 'active',
        points: 20,
        xp: 25,
        coins: 10,
      };
    }
    case MINI_GAMES.ESTIMATION: {
      const target = randomInt(500, 2000);
      return {
        id: gameId,
        type,
        title: '📊 Estimation Numérique',
        description: `Estimez le résultat sans calculatrice ! La réponse la plus proche remportera la victoire.\nCible : Estimation de \`${Math.round(target / 17)} × 17\` !`,
        target,
        status: 'active',
        points: 25,
        xp: 30,
        coins: 15,
      };
    }
    default:
      return null;
  }
}
function getDivisorsCount(n) {
  let count = 0;
  for (let i = 1; i <= Math.sqrt(n); i++) {
    if (n % i === 0) {
      count += i * i === n ? 1 : 2;
    }
  }
  return count;
}
export function processMiniGameGuess(game, userId, username, guess) {
  if (!game || game.status !== 'active') {
    return { success: false, message: 'Cette partie n\'est plus active.' };
  }
  const raw = String(guess).trim().toLowerCase();
  switch (game.type) {
    case MINI_GAMES.MYSTERE: {
      const num = parseInt(raw, 10);
      if (isNaN(num)) {
        return { success: false, message: 'Veuillez saisir un nombre valide.' };
      }
      game.attempts++;
      const diff = Math.abs(num - game.secret);
      if (num === game.secret) {
        game.status = 'won';
        game.winner = { userId, username };
        return {
          success: true,
          status: 'won',
          message: `🎉 **VICTOIRE !** ${username} a trouvé le nombre secret : **${game.secret}** en ${game.attempts} tentative(s) !`,
          points: game.points,
          xp: game.xp,
          coins: game.coins,
        };
      }
      const hint = num < game.secret ? 'Plus grand 📈' : 'Plus petit 📉';
      const proximity = diff <= 5 ? '🔥 Tu brûles !' : diff <= 15 ? '⛅ C\'est tiède !' : '❄️ C\'est glacial...';
      if (game.attempts >= game.maxAttempts) {
        game.status = 'lost';
        return {
          success: true,
          status: 'lost',
          message: `💀 **PERDU !** Nombre maximal de tentatives atteint (${game.maxAttempts}). Le nombre secret était **${game.secret}**.`,
        };
      }
      return {
        success: true,
        status: 'continue',
        message: `${num} ➔ **${hint}** (${proximity}) — Essai ${game.attempts}/${game.maxAttempts}`,
      };
    }
    case MINI_GAMES.CALCUL:
    case MINI_GAMES.SUITE:
    case MINI_GAMES.MULTIPLES:
    case MINI_GAMES.EQUATION:
    case MINI_GAMES.DIVISEURS:
    case MINI_GAMES.PREMIERS:
    case MINI_GAMES.OPERATIONS: {
      if (raw === game.expected.toLowerCase()) {
        game.status = 'won';
        game.winner = { userId, username };
        return {
          success: true,
          status: 'won',
          message: `🎯 **EXCELLENT !** ${username} a donné la bonne réponse : **${game.expected}** !`,
          points: game.points,
          xp: game.xp,
          coins: game.coins,
        };
      }
      return {
        success: true,
        status: 'wrong',
        message: `❌ Mauvaise réponse ! Réessayez.`,
      };
    }
    case MINI_GAMES.PARITE:
    case MINI_GAMES.VRAI_FAUX: {
      if (raw === game.expected) {
        game.status = 'won';
        game.winner = { userId, username };
        return {
          success: true,
          status: 'won',
          message: `✨ **EXACT !** ${username} a trouvé la bonne parité/valeur : **${game.expected.toUpperCase()}** !`,
          points: game.points,
          xp: game.xp,
          coins: game.coins,
        };
      }
      return {
        success: true,
        status: 'wrong',
        message: `❌ Faux ! Ce n'était pas la réponse attendue.`,
      };
    }
    case MINI_GAMES.HILO: {
      if (raw === game.expected) {
        game.status = 'won';
        game.winner = { userId, username };
        return {
          success: true,
          status: 'won',
          message: `🎉 **BRAVO !** Le nombre suivant était **${game.next}** (${game.expected.toUpperCase()} que ${game.current}) !`,
          points: game.points,
          xp: game.xp,
          coins: game.coins,
        };
      }
      return {
        success: true,
        status: 'lost',
        message: `❌ Perdu ! Le nombre était **${game.next}**.`,
      };
    }
    case MINI_GAMES.CODE_SECRET: {
      if (raw === game.code) {
        game.status = 'won';
        game.winner = { userId, username };
        return {
          success: true,
          status: 'won',
          message: `🔓 **CODE DÉVERROUILLÉ !** ${username} a percé le coffre avec le code **${game.code}** !`,
          points: game.points,
          xp: game.xp,
          coins: game.coins,
        };
      }
      game.attempts++;
      if (game.attempts >= game.maxAttempts) {
        game.status = 'lost';
        return {
          success: true,
          status: 'lost',
          message: `🚨 Alarme déclenchée ! Le code secret était **${game.code}**.`,
        };
      }
      return {
        success: true,
        status: 'continue',
        message: `❌ Code incorrect. Tentative ${game.attempts}/${game.maxAttempts}`,
      };
    }
    default:
      return { success: false, message: 'Type de mini-jeu non géré.' };
  }
}
