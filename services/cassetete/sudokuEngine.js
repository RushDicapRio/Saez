export function createEmptyGrid() {
  return Array(9).fill(0).map(() => Array(9).fill(0));
}
export function cloneGrid(grid) {
  return grid.map((row) => [...row]);
}
export function isValidPlacement(grid, row, col, num) {
  for (let c = 0; c < 9; c++) {
    if (grid[row][c] === num && c !== col) return false;
  }
  for (let r = 0; r < 9; r++) {
    if (grid[r][col] === num && r !== row) return false;
  }
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cr = startRow + r;
      const cc = startCol + c;
      if (grid[cr][cc] === num && (cr !== row || cc !== col)) return false;
    }
  }
  return true;
}
function findEmptyCell(grid) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) return [r, c];
    }
  }
  return null;
}
export function solveSudoku(grid) {
  const empty = findEmptyCell(grid);
  if (!empty) return true; 
  const [row, col] = empty;
  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(grid, row, col, num)) {
      grid[row][col] = num;
      if (solveSudoku(grid)) return true;
      grid[row][col] = 0;
    }
  }
  return false;
}
export function countSolutions(grid, limit = 2) {
  let count = 0;
  function backtrack(g) {
    const empty = findEmptyCell(g);
    if (!empty) {
      count++;
      return;
    }
    const [row, col] = empty;
    for (let num = 1; num <= 9; num++) {
      if (isValidPlacement(g, row, col, num)) {
        g[row][col] = num;
        backtrack(g);
        g[row][col] = 0;
        if (count >= limit) return;
      }
    }
  }
  const copy = cloneGrid(grid);
  backtrack(copy);
  return count;
}
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function fillRandomCompleteGrid(grid) {
  const empty = findEmptyCell(grid);
  if (!empty) return true;
  const [r, c] = empty;
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (const num of digits) {
    if (isValidPlacement(grid, r, c, num)) {
      grid[r][c] = num;
      if (fillRandomCompleteGrid(grid)) return true;
      grid[r][c] = 0;
    }
  }
  return false;
}
/**
 * @param {'facile'|'moyen'|'difficile'|'expert'} difficulty
 */
export function generateSudoku(difficulty = 'facile') {
  const full = createEmptyGrid();
  fillRandomCompleteGrid(full);
  const solution = cloneGrid(full);
  let cluesTarget;
  switch (difficulty) {
    case 'expert':
      cluesTarget = 24;
      break;
    case 'difficile':
      cluesTarget = 28;
      break;
    case 'moyen':
      cluesTarget = 32;
      break;
    case 'facile':
    default:
      cluesTarget = 38;
      break;
  }
  const puzzle = cloneGrid(solution);
  const positions = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  const shuffledPositions = shuffle(positions);
  let cluesLeft = 81;
  for (const [r, c] of shuffledPositions) {
    if (cluesLeft <= cluesTarget) break;
    const temp = puzzle[r][c];
    puzzle[r][c] = 0;
    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[r][c] = temp; 
    } else {
      cluesLeft--;
    }
  }
  return {
    initialGrid: cloneGrid(puzzle),
    currentGrid: cloneGrid(puzzle),
    solution: cloneGrid(solution),
    difficulty,
    cluesCount: cluesLeft,
    notes: Array(9).fill(null).map(() => Array(9).fill(null).map(() => [])),
    mistakes: 0,
    hintsUsed: 0,
    startTime: Date.now(),
    isCompleted: false,
  };
}
export function generateDailySudoku(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const seededRandom = () => {
    hash = (hash * 9301 + 49297) % 233280;
    return (hash < 0 ? -hash : hash) / 233280;
  };
  const dailyPuzzles = [
    {
      initial: [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
      ],
      difficulty: 'moyen',
    },
    {
      initial: [
        [0, 0, 0, 2, 6, 0, 7, 0, 1],
        [6, 8, 0, 0, 7, 0, 0, 9, 0],
        [1, 9, 0, 0, 0, 4, 5, 0, 0],
        [8, 2, 0, 1, 0, 0, 0, 4, 0],
        [0, 0, 4, 6, 0, 2, 9, 0, 0],
        [0, 5, 0, 0, 0, 3, 0, 2, 8],
        [0, 0, 9, 3, 0, 0, 0, 7, 4],
        [0, 4, 0, 0, 5, 0, 0, 3, 6],
        [7, 0, 3, 0, 1, 8, 0, 0, 0],
      ],
      difficulty: 'difficile',
    },
    {
      initial: [
        [1, 0, 0, 4, 8, 9, 0, 0, 6],
        [7, 3, 0, 0, 0, 0, 0, 4, 0],
        [0, 0, 0, 0, 0, 1, 2, 9, 5],
        [0, 0, 7, 1, 2, 0, 6, 0, 0],
        [5, 0, 0, 7, 0, 3, 0, 0, 8],
        [0, 0, 6, 0, 9, 5, 7, 0, 0],
        [9, 1, 4, 6, 0, 0, 0, 0, 0],
        [0, 2, 0, 0, 0, 0, 0, 3, 7],
        [8, 0, 0, 5, 1, 2, 0, 0, 4],
      ],
      difficulty: 'facile',
    },
  ];
  const selected = dailyPuzzles[Math.abs(hash) % dailyPuzzles.length];
  const puzzle = cloneGrid(selected.initial);
  const solution = cloneGrid(selected.initial);
  solveSudoku(solution);
  return {
    initialGrid: cloneGrid(puzzle),
    currentGrid: cloneGrid(puzzle),
    solution: cloneGrid(solution),
    difficulty: selected.difficulty,
    cluesCount: puzzle.flat().filter((x) => x > 0).length,
    notes: Array(9).fill(null).map(() => Array(9).fill(null).map(() => [])),
    mistakes: 0,
    hintsUsed: 0,
    startTime: Date.now(),
    isCompleted: false,
    dailyDate: dateStr,
  };
}
export function fillSudokuCell(session, row, col, value) {
  if (row < 0 || row > 8 || col < 0 || col > 8) {
    return { success: false, reason: 'Coordonnées invalides (ligne 1-9, colonne A-I).' };
  }
  if (value < 1 || value > 9) {
    return { success: false, reason: 'Le chiffre doit être compris entre 1 et 9.' };
  }
  if (session.initialGrid[row][col] !== 0) {
    return { success: false, reason: 'Vous ne pouvez pas modifier un chiffre de départ !' };
  }
  session.currentGrid[row][col] = value;
  if (session.notes?.[row]?.[col]) {
    session.notes[row][col] = [];
  }
  const isComplete = checkVictory(session);
  return {
    success: true,
    isComplete,
    isCorrect: session.solution[row][col] === value,
  };
}
export function clearSudokuCell(session, row, col) {
  if (row < 0 || row > 8 || col < 0 || col > 8) {
    return { success: false, reason: 'Coordonnées invalides.' };
  }
  if (session.initialGrid[row][col] !== 0) {
    return { success: false, reason: 'Impossible d\'effacer un chiffre initial.' };
  }
  session.currentGrid[row][col] = 0;
  return { success: true };
}
export function toggleSudokuNote(session, row, col, num) {
  if (row < 0 || row > 8 || col < 0 || col > 8 || num < 1 || num > 9) {
    return { success: false, reason: 'Valeur ou coordonnées invalides.' };
  }
  if (session.initialGrid[row][col] !== 0 || session.currentGrid[row][col] !== 0) {
    return { success: false, reason: 'Impossible d\'annoter une case déjà remplie.' };
  }
  if (!session.notes) {
    session.notes = Array(9).fill(null).map(() => Array(9).fill(null).map(() => []));
  }
  const currentNotes = session.notes[row][col] || [];
  const idx = currentNotes.indexOf(num);
  if (idx >= 0) {
    currentNotes.splice(idx, 1);
  } else {
    currentNotes.push(num);
    currentNotes.sort((a, b) => a - b);
  }
  session.notes[row][col] = currentNotes;
  return { success: true, notes: currentNotes };
}
export function checkSudokuErrors(session) {
  const errors = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = session.currentGrid[r][c];
      if (val !== 0 && val !== session.solution[r][c]) {
        const colLetter = String.fromCharCode(65 + c);
        const rowNum = r + 1;
        errors.push({ coord: `${colLetter}${rowNum}`, row: r, col: c, value: val });
      }
    }
  }
  session.mistakes += errors.length;
  return errors;
}
export function getSudokuHint(session) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = session.currentGrid[r][c];
      if (val !== 0 && val !== session.solution[r][c]) {
        const colLetter = String.fromCharCode(65 + c);
        const rowNum = r + 1;
        session.hintsUsed++;
        return {
          type: 'correction',
          coord: `${colLetter}${rowNum}`,
          message: `💡 **Attention :** Le chiffre en **${colLetter}${rowNum}** (${val}) est incorrect !`,
        };
      }
    }
  }
  const emptyCoords = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (session.currentGrid[r][c] === 0) {
        emptyCoords.push([r, c]);
      }
    }
  }
  if (emptyCoords.length === 0) {
    return { type: 'complete', message: 'La grille est déjà entièrement remplie !' };
  }
  const [hr, hc] = emptyCoords[Math.floor(Math.random() * emptyCoords.length)];
  const correctVal = session.solution[hr][hc];
  session.currentGrid[hr][hc] = correctVal;
  session.hintsUsed++;
  const colLetter = String.fromCharCode(65 + hc);
  const rowNum = hr + 1;
  const isComplete = checkVictory(session);
  return {
    type: 'reveal',
    coord: `${colLetter}${rowNum}`,
    value: correctVal,
    isComplete,
    message: `💡 **Indice :** La case **${colLetter}${rowNum}** contient le chiffre **${correctVal}** !`,
  };
}
export function checkVictory(session) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (session.currentGrid[r][c] !== session.solution[r][c]) {
        return false;
      }
    }
  }
  session.isCompleted = true;
  return true;
}
export function renderSudokuAscii(grid, initialGrid = null) {
  let out = '    A B C   D E F   G H I\n';
  out += '  +-------+-------+-------+\n';
  for (let r = 0; r < 9; r++) {
    const rowNum = r + 1;
    out += `${rowNum} | `;
    for (let c = 0; c < 9; c++) {
      const val = grid[r][c];
      const char = val === 0 ? '.' : String(val);
      out += char + ' ';
      if (c === 2 || c === 5) {
        out += '| ';
      }
    }
    out += `| ${rowNum}\n`;
    if (r === 2 || r === 5) {
      out += '  +-------+-------+-------+\n';
    }
  }
  out += '  +-------+-------+-------+\n';
  out += '    A B C   D E F   G H I';
  return out;
}
export function parseSudokuCoord(input) {
  if (!input) return null;
  const clean = input.trim().toUpperCase().replace(/[\s\-_]/g, '');
  const m1 = clean.match(/^([A-I])([1-9])$/);
  if (m1) {
    const col = m1[1].charCodeAt(0) - 65;
    const row = parseInt(m1[2], 10) - 1;
    return { row, col, coord: `${m1[1]}${m1[2]}` };
  }
  const m2 = clean.match(/^([1-9])([A-I])$/);
  if (m2) {
    const row = parseInt(m2[1], 10) - 1;
    const col = m2[2].charCodeAt(0) - 65;
    return { row, col, coord: `${m2[2]}${m2[1]}` };
  }
  return null;
}
