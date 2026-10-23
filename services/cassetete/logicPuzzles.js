export function normalizeText(text) {
  if (!text) return '';
  return text
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}
export const MASTERMIND_COLORS = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'];
export const MASTERMIND_COLOR_NAMES = {
  rouge: '🔴',
  bleu: '🔵',
  vert: '🟢',
  jaune: '🟡',
  violet: '🟣',
  orange: '🟠',
  '1': '🔴',
  '2': '🔵',
  '3': '🟢',
  '4': '🟡',
  '5': '🟣',
  '6': '🟠',
};
export function createMastermindGame(length = 4, maxAttempts = 10) {
  const secret = [];
  for (let i = 0; i < length; i++) {
    secret.push(MASTERMIND_COLORS[Math.floor(Math.random() * MASTERMIND_COLORS.length)]);
  }
  return {
    secret,
    maxAttempts,
    attempts: [],
    isWon: false,
    isOver: false,
  };
}
export function evaluateMastermindGuess(secret, guess) {
  if (!Array.isArray(guess) || guess.length !== secret.length) {
    return { valid: false, reason: `Vous devez proposer exactement ${secret.length} couleurs.` };
  }
  let exact = 0;
  const secretRemaining = [];
  const guessRemaining = [];
  for (let i = 0; i < secret.length; i++) {
    if (guess[i] === secret[i]) {
      exact++;
    } else {
      secretRemaining.push(secret[i]);
      guessRemaining.push(guess[i]);
    }
  }
  let misplaced = 0;
  for (const g of guessRemaining) {
    const idx = secretRemaining.indexOf(g);
    if (idx !== -1) {
      misplaced++;
      secretRemaining.splice(idx, 1);
    }
  }
  return { valid: true, exact, misplaced };
}
export function createMorpionGame() {
  return {
    board: Array(9).fill(null), 
    turn: 'X', 
    isOver: false,
    winner: null, 
    movesCount: 0,
  };
}
const MORPION_WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], 
  [0, 3, 6], [1, 4, 7], [2, 5, 8], 
  [0, 4, 8], [2, 4, 6],           
];
export function checkMorpionWinner(board) {
  for (const [a, b, c] of MORPION_WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (board.every((cell) => cell !== null)) {
    return 'draw';
  }
  return null;
}
export function playMorpionMove(game, index) {
  if (game.isOver || index < 0 || index > 8 || game.board[index] !== null) {
    return { success: false, reason: 'Case invalide ou déjà occupée.' };
  }
  game.board[index] = game.turn;
  game.movesCount++;
  const outcome = checkMorpionWinner(game.board);
  if (outcome) {
    game.isOver = true;
    game.winner = outcome;
  } else {
    game.turn = game.turn === 'X' ? 'O' : 'X';
  }
  return { success: true, outcome };
}
export function getMorpionBestMoveAI(board) {
  function minimax(currentBoard, isMaximizing) {
    const outcome = checkMorpionWinner(currentBoard);
    if (outcome === 'O') return 10;
    if (outcome === 'X') return -10;
    if (outcome === 'draw') return 0;
    if (isMaximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
          currentBoard[i] = 'O';
          best = Math.max(best, minimax(currentBoard, false));
          currentBoard[i] = null;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
          currentBoard[i] = 'X';
          best = Math.min(best, minimax(currentBoard, true));
          currentBoard[i] = null;
        }
      }
      return best;
    }
  }
  let bestVal = -Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = 'O';
      const moveVal = minimax(board, false);
      board[i] = null;
      if (moveVal > bestVal) {
        bestVal = moveVal;
        bestMove = i;
      }
    }
  }
  return bestMove;
}
export function createPuissance4Game() {
  return {
    board: Array(6).fill(null).map(() => Array(7).fill(null)),
    turn: '🔴',
    isOver: false,
    winner: null, 
    movesCount: 0,
  };
}
export function dropPuissance4Piece(game, col) {
  if (game.isOver || col < 0 || col > 6) {
    return { success: false, reason: 'Colonne invalide (1 à 7).' };
  }
  let targetRow = -1;
  for (let r = 5; r >= 0; r--) {
    if (game.board[r][col] === null) {
      targetRow = r;
      break;
    }
  }
  if (targetRow === -1) {
    return { success: false, reason: `La colonne ${col + 1} est déjà pleine !` };
  }
  const piece = game.turn;
  game.board[targetRow][col] = piece;
  game.movesCount++;
  if (checkPuissance4Win(game.board, targetRow, col, piece)) {
    game.isOver = true;
    game.winner = piece;
  } else if (game.movesCount >= 42) {
    game.isOver = true;
    game.winner = 'draw';
  } else {
    game.turn = game.turn === '🔴' ? '🟡' : '🔴';
  }
  return { success: true, row: targetRow, col, isOver: game.isOver, winner: game.winner };
}
function checkPuissance4Win(board, r, c, piece) {
  const directions = [
    [0, 1],  
    [1, 0],  
    [1, 1],  
    [1, -1], 
  ];
  for (const [dr, dc] of directions) {
    let count = 1;
    let step = 1;
    while (true) {
      const nr = r + dr * step;
      const nc = c + dc * step;
      if (nr >= 0 && nr < 6 && nc >= 0 && nc < 7 && board[nr][nc] === piece) {
        count++;
        step++;
      } else {
        break;
      }
    }
    step = 1;
    while (true) {
      const nr = r - dr * step;
      const nc = c - dc * step;
      if (nr >= 0 && nr < 6 && nc >= 0 && nc < 7 && board[nr][nc] === piece) {
        count++;
        step++;
      } else {
        break;
      }
    }
    if (count >= 4) return true;
  }
  return false;
}
export function getPuissance4BestMoveAI(board, piece = '🟡') {
  const oppPiece = piece === '🔴' ? '🟡' : '🔴';
  for (let c = 0; c < 7; c++) {
    let r = -1;
    for (let row = 5; row >= 0; row--) {
      if (board[row][c] === null) {
        r = row;
        break;
      }
    }
    if (r !== -1) {
      board[r][c] = piece;
      const wins = checkPuissance4Win(board, r, c, piece);
      board[r][c] = null;
      if (wins) return c;
    }
  }
  for (let c = 0; c < 7; c++) {
    let r = -1;
    for (let row = 5; row >= 0; row--) {
      if (board[row][c] === null) {
        r = row;
        break;
      }
    }
    if (r !== -1) {
      board[r][c] = oppPiece;
      const oppWins = checkPuissance4Win(board, r, c, oppPiece);
      board[r][c] = null;
      if (oppWins) return c;
    }
  }
  const centerPref = [3, 2, 4, 1, 5, 0, 6];
  for (const c of centerPref) {
    if (board[0][c] === null) return c;
  }
  return 0;
}
export function create2048Game() {
  const grid = Array(4).fill(0).map(() => Array(4).fill(0));
  spawn2048Tile(grid);
  spawn2048Tile(grid);
  return {
    grid,
    score: 0,
    isWon: false,
    isGameOver: false,
    moves: 0,
  };
}

function spawn2048Tile(grid) {
  const empty = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return false;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return true;
}
export function slide2048(game, direction) {
  if (game.isGameOver) return { moved: false };
  const prev = game.grid.map((r) => [...r]);
  let moved = false;
  let gainedScore = 0;
  function operateLine(line) {
    const filtered = line.filter((x) => x !== 0);
    const result = [];
    for (let i = 0; i < filtered.length; i++) {
      if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
        const merged = filtered[i] * 2;
        result.push(merged);
        gainedScore += merged;
        if (merged === 2048) game.isWon = true;
        i++; 
      } else {
        result.push(filtered[i]);
      }
    }
    while (result.length < 4) result.push(0);
    return result;
  }
  if (direction === 'left') {
    for (let r = 0; r < 4; r++) {
      game.grid[r] = operateLine(game.grid[r]);
    }
  } else if (direction === 'right') {
    for (let r = 0; r < 4; r++) {
      game.grid[r] = operateLine(game.grid[r].reverse()).reverse();
    }
  } else if (direction === 'up') {
    for (let c = 0; c < 4; c++) {
      const col = [game.grid[0][c], game.grid[1][c], game.grid[2][c], game.grid[3][c]];
      const res = operateLine(col);
      for (let r = 0; r < 4; r++) game.grid[r][c] = res[r];
    }
  } else if (direction === 'down') {
    for (let c = 0; c < 4; c++) {
      const col = [game.grid[3][c], game.grid[2][c], game.grid[1][c], game.grid[0][c]];
      const res = operateLine(col);
      for (let r = 0; r < 4; r++) game.grid[3 - r][c] = res[r];
    }
  }
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (prev[r][c] !== game.grid[r][c]) {
        moved = true;
        break;
      }
    }
  }
  if (moved) {
    game.score += gainedScore;
    game.moves++;
    spawn2048Tile(game.grid);
    game.isGameOver = check2048GameOver(game.grid);
  }
  return { moved, score: game.score, isWon: game.isWon, isGameOver: game.isGameOver };
}
function check2048GameOver(grid) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) return false;
      if (c < 3 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < 3 && grid[r][c] === grid[r + 1][c]) return false;
    }
  }
  return true;
}
export function render2048Ascii(grid) {
  let out = '+------+------+------+------+\n';
  for (let r = 0; r < 4; r++) {
    out += '|';
    for (let c = 0; c < 4; c++) {
      const val = grid[r][c];
      const str = val === 0 ? ' .' : String(val);
      out += ` ${str.padStart(4, ' ')} |`;
    }
    out += '\n+------+------+------+------+\n';
  }
  return out;
}
export function createHanoiGame(discsCount = 3) {
  const count = Math.max(3, Math.min(6, discsCount));
  const pegA = [];
  for (let i = count; i >= 1; i--) pegA.push(i);
  return {
    discsCount: count,
    pegs: {
      A: pegA,
      B: [],
      C: [],
    },
    moves: 0,
    optimalMoves: Math.pow(2, count) - 1,
    isWon: false,
  };
}
export function moveHanoiDisc(game, fromPeg, toPeg) {
  const from = fromPeg.toUpperCase();
  const to = toPeg.toUpperCase();
  if (!['A', 'B', 'C'].includes(from) || !['A', 'B', 'C'].includes(to) || from === to) {
    return { success: false, reason: 'Piquets invalides (A, B ou C).' };
  }
  if (game.pegs[from].length === 0) {
    return { success: false, reason: `Le piquet ${from} est vide !` };
  }
  const disc = game.pegs[from][game.pegs[from].length - 1];
  const destTop = game.pegs[to][game.pegs[to].length - 1];
  if (destTop && destTop < disc) {
    return { success: false, reason: `Coup illégal : le disque (${disc}) ne peut pas reposer sur un disque plus petit (${destTop}) !` };
  }
  game.pegs[from].pop();
  game.pegs[to].push(disc);
  game.moves++;
  if (game.pegs.C.length === game.discsCount) {
    game.isWon = true;
  }
  return { success: true, isWon: game.isWon, moves: game.moves };
}
export function renderHanoiAscii(game) {
  const maxDiscs = game.discsCount;
  let out = '';
  for (let lvl = maxDiscs - 1; lvl >= 0; lvl--) {
    const dA = game.pegs.A[lvl] ? `[${game.pegs.A[lvl]}]` : ' | ';
    const dB = game.pegs.B[lvl] ? `[${game.pegs.B[lvl]}]` : ' | ';
    const dC = game.pegs.C[lvl] ? `[${game.pegs.C[lvl]}]` : ' | ';
    out += `  ${dA.padStart(5, ' ')}    ${dB.padStart(5, ' ')}    ${dC.padStart(5, ' ')}\n`;
  }
  out += '  =====    =====    =====\n';
  out += '    A        B        C  ';
  return out;
}
export function createDemineurGame(rows = 6, cols = 6, mines = 5) {
  const grid = Array(rows).fill(0).map(() => Array(cols).fill(0));
  const revealed = Array(rows).fill(false).map(() => Array(cols).fill(false));
  const flagged = Array(rows).fill(false).map(() => Array(cols).fill(false));
  return {
    rows,
    cols,
    minesCount: mines,
    grid, 
    revealed,
    flagged,
    initialized: false,
    isWon: false,
    isLost: false,
  };
}
function initDemineurMines(game, safeR, safeC) {
  let placed = 0;
  while (placed < game.minesCount) {
    const r = Math.floor(Math.random() * game.rows);
    const c = Math.floor(Math.random() * game.cols);
    if ((r !== safeR || c !== safeC) && game.grid[r][c] !== -1) {
      game.grid[r][c] = -1;
      placed++;
    }
  }
  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      if (game.grid[r][c] === -1) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < game.rows && nc >= 0 && nc < game.cols && game.grid[nr][nc] === -1) {
            count++;
          }
        }
      }
      game.grid[r][c] = count;
    }
  }
  game.initialized = true;
}
export function revealDemineurCell(game, r, c) {
  if (game.isLost || game.isWon || r < 0 || r >= game.rows || c < 0 || c >= game.cols) {
    return { success: false, reason: 'Case invalide.' };
  }
  if (game.flagged[r][c]) {
    return { success: false, reason: 'Cette case est protégée par un drapeau 🚩.' };
  }
  if (!game.initialized) {
    initDemineurMines(game, r, c);
  }
  if (game.grid[r][c] === -1) {
    game.isLost = true;
    game.revealed[r][c] = true;
    return { success: true, isLost: true };
  }
  function flood(cr, cc) {
    if (cr < 0 || cr >= game.rows || cc < 0 || cc >= game.cols) return;
    if (game.revealed[cr][cc] || game.flagged[cr][cc]) return;
    game.revealed[cr][cc] = true;
    if (game.grid[cr][cc] === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) flood(cr + dr, cc + dc);
        }
      }
    }
  }
  flood(r, c);
  let safeCellsLeft = 0;
  for (let i = 0; i < game.rows; i++) {
    for (let j = 0; j < game.cols; j++) {
      if (game.grid[i][j] !== -1 && !game.revealed[i][j]) {
        safeCellsLeft++;
      }
    }
  }
  if (safeCellsLeft === 0) {
    game.isWon = true;
  }
  return { success: true, isWon: game.isWon, isLost: false };
}
export function toggleDemineurFlag(game, r, c) {
  if (game.isLost || game.isWon || r < 0 || r >= game.rows || c < 0 || c >= game.cols) {
    return { success: false };
  }
  if (game.revealed[r][c]) return { success: false, reason: 'Case déjà révélée.' };
  game.flagged[r][c] = !game.flagged[r][c];
  return { success: true, flagged: game.flagged[r][c] };
}
export function generateCompteEstBon() {
  const PLAQUES_POOL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 25, 50, 75, 100];
  const shuffled = [...PLAQUES_POOL].sort(() => Math.random() - 0.5);
  const plaques = shuffled.slice(0, 6).sort((a, b) => a - b);
  const target = Math.floor(Math.random() * 899) + 101; // 101 à 999
  return {
    plaques,
    target,
  };
}
export function evaluateCompteSolution(plaques, expression) {
  if (!expression || typeof expression !== 'string') {
    return { valid: false, reason: 'Expression invalide.' };
  }
  const clean = expression.replace(/\s+/g, '');
  if (!/^[\d\+\-\*\/\(\)]+$/.test(clean)) {
    return { valid: false, reason: 'Caractères non autorisés. Seuls les chiffres et +, -, *, /, (, ) sont permis.' };
  }
  const usedNumbers = clean.match(/\d+/g)?.map(Number) || [];
  const availablePlaques = [...plaques];
  for (const n of usedNumbers) {
    const idx = availablePlaques.indexOf(n);
    if (idx === -1) {
      return { valid: false, reason: `Le nombre **${n}** ne fait pas partie de vos plaques tirées ou a été utilisé trop de fois !` };
    }
    availablePlaques.splice(idx, 1);
  }
  try {
    const tokens = tokenizeMath(clean);
    const result = parseMathExpression(tokens);
    if (!Number.isInteger(result) || result <= 0) {
      return { valid: false, reason: 'Les résultats doivent être des nombres entiers strictement positifs.' };
    }
    return { valid: true, result };
  } catch (err) {
    return { valid: false, reason: `Erreur dans la formule : ${err.message}` };
  }
}
function tokenizeMath(str) {
  const regex = /\d+|[\+\-\*\/\(\)]/g;
  return str.match(regex) || [];
}
function parseMathExpression(tokens) {
  let index = 0;
  function parsePrimary() {
    const token = tokens[index++];
    if (token === '(') {
      const val = parseAddSub();
      if (tokens[index++] !== ')') throw new Error('Parenthèse non fermée');
      return val;
    }
    const num = Number(token);
    if (isNaN(num)) throw new Error(`Token inattendu : ${token}`);
    return num;
  }
  function parseMulDiv() {
    let left = parsePrimary();
    while (index < tokens.length && (tokens[index] === '*' || tokens[index] === '/')) {
      const op = tokens[index++];
      const right = parsePrimary();
      if (op === '*') left *= right;
      else {
        if (right === 0) throw new Error('Division par zéro');
        if (left % right !== 0) throw new Error('Les divisions doivent être exactes (résultat entier)');
        left = left / right;
      }
    }
    return left;
  }
  function parseAddSub() {
    let left = parseMulDiv();
    while (index < tokens.length && (tokens[index] === '+' || tokens[index] === '-')) {
      const op = tokens[index++];
      const right = parseMulDiv();
      if (op === '+') left += right;
      else {
        if (left < right) throw new Error('Résultat négatif non permis au Compte est Bon');
        left -= right;
      }
    }
    return left;
  }
  const result = parseAddSub();
  if (index < tokens.length) throw new Error('Caractères en surplus');
  return result;
}
export const ANAGRAMS_DATA = [
  { word: 'ANIME', scrambled: 'MANIE', hint: 'Animation japonaise populaire' },
  { word: 'MANGA', scrambled: 'MAGAN', hint: 'Bande dessinée nippone' },
  { word: 'SHONEN', scrambled: 'NENOSH', hint: 'Genre destiné aux jeunes héros combatifs' },
  { word: 'OTAKU', scrambled: 'KOUTA', hint: 'Passionné de culture pop japonaise' },
  { word: 'DISCORD', scrambled: 'DROCSID', hint: 'Plateforme communautaire de discussion' },
  { word: 'REFLEXION', scrambled: 'LEXFONIRE', hint: 'Action de faire fonctionner ses neurones' },
  { word: 'STRATEGIE', scrambled: 'GETISATRE', hint: 'Plan d\'action militaire ou aux échecs' },
  { word: 'PUZZLE', scrambled: 'ZZLPUE', hint: 'Casse-tête par assemblage de pièces' },
  { word: 'ENIGME', scrambled: 'MINGEE', hint: 'Mystère à résoudre par déduction' },
  { word: 'LABYRINTHE', scrambled: 'THENLABYRI', hint: 'Dédale complexe dont il faut trouver la sortie' },
];
export const MOTUS_WORDS = [
  { word: 'SAEZ', hint: 'Plateforme multimédia d\'animes' },
  { word: 'ECHEC', hint: 'Jeu des rois sur 64 cases' },
  { word: 'ROQUE', hint: 'Coup spécial du roi et de la tour' },
  { word: 'PION', hint: 'La pièce la plus nombreuse' },
  { word: 'DAME', hint: 'La pièce la plus puissante' },
  { word: 'FOU', hint: 'Se déplace en diagonale' },
  { word: 'TOUR', hint: 'Se déplace en ligne droite' },
  { word: 'NINJA', hint: 'Guerrier de l\'ombre' },
  { word: 'TITAN', hint: 'Colosse légendaire' },
  { word: 'KAIJU', hint: 'Monstre géant japonais' },
];
export const LOGIC_RIDDLES = [
  {
    id: 'riddle_01',
    question: 'Plus j\'ai de gardiens, moins je suis en sécurité. Moins j\'ai de gardiens, plus je suis en sécurité. Que suis-je ?',
    answer: 'secret',
    acceptable: ['secret', 'un secret', 'le secret'],
    hint: 'Quand tout le monde le sait, ce n\'en est plus un.',
    explanation: 'Un secret n\'est véritablement protégé que s\'il est partagé par le moins de personnes possible.',
  },
  {
    id: 'riddle_02',
    question: 'Je commence la nuit et je termine le matin. J\'apparais deux fois dans l\'année. Que suis-je ?',
    answer: 'n',
    acceptable: ['la lettre n', 'lettre n', 'n'],
    hint: 'Examinez l\'orthographe des mots de l\'énoncé !',
    explanation: 'La lettre N commence le mot "Nuit", termine "matiN" et apparaît deux fois dans "aNNée".',
  },
  {
    id: 'riddle_03',
    question: 'Je suis toujours devant vous, mais vous ne pouvez jamais me voir ni me toucher. Que suis-je ?',
    answer: 'futur',
    acceptable: ['futur', 'le futur', 'avenir', 'l\'avenir', 'demain'],
    hint: 'Ce qui arrivera dans les heures ou les années à venir.',
    explanation: 'Le futur est toujours devant nous par rapport au flux temporel.',
  },
  {
    id: 'riddle_04',
    question: 'Sans voix je crie, sans ailes je voltige, sans dents je mords, sans bouche je murmure. Que suis-je ?',
    answer: 'vent',
    acceptable: ['le vent', 'vent'],
    hint: 'Élément naturel invisible qui souffle dehors.',
    explanation: 'Le vent souffle, hurle et fait bruisser les feuilles sans posséder de corps organique.',
  },
  {
    id: 'riddle_05',
    question: 'Qu\'est-ce qui devient de plus en plus mouillé à mesure qu\'il sèche ?',
    answer: 'serviette',
    acceptable: ['serviette', 'une serviette', 'la serviette'],
    hint: 'Vous l\'utilisez tous les jours en sortant de la douche.',
    explanation: 'Une serviette absorbe l\'eau pour vous sécher, donc elle devient elle-même mouillée.',
  },
];
export function evaluateWordleGuess(secretWord, guess) {
  const secret = secretWord.toUpperCase();
  const cleanGuess = guess.toUpperCase();
  if (cleanGuess.length !== secret.length) {
    return { valid: false, reason: `Le mot doit faire exactement ${secret.length} lettres.` };
  }
  const feedback = Array(secret.length).fill('⬛');
  const secretLetters = secret.split('');
  const guessLetters = cleanGuess.split('');
  for (let i = 0; i < secret.length; i++) {
    if (guessLetters[i] === secretLetters[i]) {
      feedback[i] = '🟩';
      secretLetters[i] = null;
      guessLetters[i] = null;
    }
  }
  for (let i = 0; i < secret.length; i++) {
    if (guessLetters[i] !== null) {
      const idx = secretLetters.indexOf(guessLetters[i]);
      if (idx !== -1) {
        feedback[i] = '🟨';
        secretLetters[idx] = null;
      }
    }
  }
  const isWon = cleanGuess === secret;
  return { valid: true, feedback: feedback.join(''), isWon, guess: cleanGuess };
}
