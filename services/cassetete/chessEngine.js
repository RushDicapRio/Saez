export const CHESS_PIECES = {
  K: { name: 'Roi Blanc', symbol: '♔', val: 20000, color: 'w' },
  Q: { name: 'Dame Blanche', symbol: '♕', val: 900, color: 'w' },
  R: { name: 'Tour Blanche', symbol: '♖', val: 500, color: 'w' },
  B: { name: 'Fou Blanc', symbol: '♗', val: 330, color: 'w' },
  N: { name: 'Cavalier Blanc', symbol: '♘', val: 320, color: 'w' },
  P: { name: 'Pion Blanc', symbol: '♙', val: 100, color: 'w' },
  k: { name: 'Roi Noir', symbol: '♚', val: 20000, color: 'b' },
  q: { name: 'Dame Noire', symbol: '♛', val: 900, color: 'b' },
  r: { name: 'Tour Noire', symbol: '♜', val: 500, color: 'b' },
  b: { name: 'Fou Noir', symbol: '♝', val: 330, color: 'b' },
  n: { name: 'Cavalier Noir', symbol: '♞', val: 320, color: 'b' },
  p: { name: 'Pion Noir', symbol: '♟', val: 100, color: 'b' },
};
export const TACTICAL_PUZZLES = [
  {
    id: 'tactic_01',
    title: 'Mat de Legal - Les Blancs jouent et matent',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4',
    solution: 'c4f7',
    solutionSan: 'Bxf7#',
    hint: 'Regardez le fou en c4 qui vise la case faible f7.',
    explanation: 'Le sacrifice du fou en f7 force le roi à sortir ou mène au mat imparable.',
    difficulty: 'facile',
  },
  {
    id: 'tactic_02',
    title: 'Fourchette Royale - Les Blancs jouent',
    fen: 'r1b1k2r/pppp1ppp/8/4q3/1bP5/2N1P3/PP3PPP/R2QKB1R w KQkq - 0 10',
    solution: 'd1d4',
    solutionSan: 'Qd4',
    hint: 'Centralisez votre dame pour attaquer deux cibles en même temps.',
    explanation: 'La dame en d4 attaque à la fois la dame noire et le fou b4.',
    difficulty: 'moyen',
  },
  {
    id: 'tactic_03',
    title: 'Mat du Couloir - Les Blancs jouent et matent en 1 coup',
    fen: '6k1/5ppp/8/8/8/8/5PPP/1R4K1 w - - 0 1',
    solution: 'b1b8',
    solutionSan: 'Rb8#',
    hint: 'La première rangée adverse est complètement sans protection.',
    explanation: 'La tour b1 monte en b8 et assène le mat du couloir.',
    difficulty: 'facile',
  },
  {
    id: 'tactic_04',
    title: 'Clouage Absolu - Les Blancs jouent',
    fen: 'rnbqk2r/ppp2ppp/4pn2/3p4/1bPP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 5',
    solution: 'c1d2',
    solutionSan: 'Bd2',
    hint: 'Déclouez votre cavalier en interposant une pièce.',
    explanation: 'Le fou en d2 brise le clouage du cavalier c3 sur le roi.',
    difficulty: 'facile',
  },
  {
    id: 'tactic_05',
    title: 'Mat de Boden - Attaque foudroyante',
    fen: '2kr1b1r/pp1n1ppp/2p1pn2/8/5B2/2NP1B1P/PPP2PP1/R4RK1 w - - 0 1',
    solution: 'f3c6',
    solutionSan: 'Bxc6',
    hint: 'Sacrifiez une pièce pour ouvrir la diagonale blanche mortelle vers le roi.',
    explanation: 'Bxc6 ouvre la voie au fou f4 pour asséner le mat de Boden.',
    difficulty: 'difficile',
  },
];
export function createChessState(fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
  const parsed = parseFen(fen);
  return {
    board: parsed.board,
    turn: parsed.turn, 
    castling: parsed.castling, 
    enPassant: parsed.enPassant, 
    halfmoveClock: parsed.halfmoveClock,
    fullmoveNumber: parsed.fullmoveNumber,
    history: [],
    captured: { w: [], b: [] },
    isGameOver: false,
    winner: null, 
    reason: null, 
  };
}
export function parseFen(fen) {
  const parts = fen.trim().split(/\s+/);
  const rows = parts[0].split('/');
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  for (let r = 0; r < 8; r++) {
    const rowStr = rows[r];
    let c = 0;
    for (const ch of rowStr) {
      if (/\d/.test(ch)) {
        c += parseInt(ch, 10);
      } else {
        board[r][c] = ch;
        c++;
      }
    }
  }
  const turn = parts[1] || 'w';
  const castlingStr = parts[2] || 'KQkq';
  const castling = {
    K: castlingStr.includes('K'),
    Q: castlingStr.includes('Q'),
    k: castlingStr.includes('k'),
    q: castlingStr.includes('q'),
  };
  let enPassant = null;
  if (parts[3] && parts[3] !== '-') {
    enPassant = coordToPos(parts[3]);
  }
  const halfmoveClock = parseInt(parts[4] || '0', 10);
  const fullmoveNumber = parseInt(parts[5] || '1', 10);
  return { board, turn, castling, enPassant, halfmoveClock, fullmoveNumber };
}
export function toFen(state) {
  const rows = [];
  for (let r = 0; r < 8; r++) {
    let empty = 0;
    let rowStr = '';
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c];
      if (!p) {
        empty++;
      } else {
        if (empty > 0) {
          rowStr += empty;
          empty = 0;
        }
        rowStr += p;
      }
    }
    if (empty > 0) rowStr += empty;
    rows.push(rowStr);
  }
  const fenBoard = rows.join('/');
  let castlingStr = '';
  if (state.castling.K) castlingStr += 'K';
  if (state.castling.Q) castlingStr += 'Q';
  if (state.castling.k) castlingStr += 'k';
  if (state.castling.q) castlingStr += 'q';
  if (!castlingStr) castlingStr = '-';
  const epStr = state.enPassant ? posToCoord(state.enPassant[0], state.enPassant[1]) : '-';
  return `${fenBoard} ${state.turn} ${castlingStr} ${epStr} ${state.halfmoveClock} ${state.fullmoveNumber}`;
}
export function coordToPos(coord) {
  if (!coord || coord.length < 2) return null;
  const colChar = coord[0].toLowerCase();
  const rowChar = coord[1];
  const c = colChar.charCodeAt(0) - 97;
  const r = 8 - parseInt(rowChar, 10);
  if (r < 0 || r > 7 || c < 0 || c > 7) return null;
  return [r, c];
}
export function posToCoord(r, c) {
  const colChar = String.fromCharCode(97 + c);
  const rowNum = 8 - r;
  return `${colChar}${rowNum}`;
}
export function cloneChessState(state) {
  return {
    board: state.board.map((row) => [...row]),
    turn: state.turn,
    castling: { ...state.castling },
    enPassant: state.enPassant ? [...state.enPassant] : null,
    halfmoveClock: state.halfmoveClock,
    fullmoveNumber: state.fullmoveNumber,
    history: [...state.history],
    captured: { w: [...state.captured.w], b: [...state.captured.b] },
    isGameOver: state.isGameOver,
    winner: state.winner,
    reason: state.reason,
  };
}
function isOnBoard(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}
function getPieceColor(p) {
  if (!p) return null;
  return p === p.toUpperCase() ? 'w' : 'b';
}
export function findKing(board, color) {
  const target = color === 'w' ? 'K' : 'k';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === target) return [r, c];
    }
  }
  return null;
}
export function isSquareAttacked(board, targetR, targetC, attackerColor) {
  const pawnDir = attackerColor === 'w' ? 1 : -1;
  const pawnPiece = attackerColor === 'w' ? 'P' : 'p';
  for (const dc of [-1, 1]) {
    const pr = targetR + pawnDir;
    const pc = targetC + dc;
    if (isOnBoard(pr, pc) && board[pr][pc] === pawnPiece) return true;
  }
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ];
  const knightPiece = attackerColor === 'w' ? 'N' : 'n';
  for (const [dr, dc] of knightMoves) {
    const kr = targetR + dr;
    const kc = targetC + dc;
    if (isOnBoard(kr, kc) && board[kr][kc] === knightPiece) return true;
  }
  const kingMoves = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];
  const kingPiece = attackerColor === 'w' ? 'K' : 'k';
  for (const [dr, dc] of kingMoves) {
    const kr = targetR + dr;
    const kc = targetC + dc;
    if (isOnBoard(kr, kc) && board[kr][kc] === kingPiece) return true;
  }
  const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const bishopPiece = attackerColor === 'w' ? 'B' : 'b';
  const queenPiece = attackerColor === 'w' ? 'Q' : 'q';
  for (const [dr, dc] of diagDirs) {
    let currR = targetR + dr;
    let currC = targetC + dc;
    while (isOnBoard(currR, currC)) {
      const p = board[currR][currC];
      if (p) {
        if (p === bishopPiece || p === queenPiece) return true;
        break;
      }
      currR += dr;
      currC += dc;
    }
  }
  const orthoDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const rookPiece = attackerColor === 'w' ? 'R' : 'r';
  for (const [dr, dc] of orthoDirs) {
    let currR = targetR + dr;
    let currC = targetC + dc;
    while (isOnBoard(currR, currC)) {
      const p = board[currR][currC];
      if (p) {
        if (p === rookPiece || p === queenPiece) return true;
        break;
      }
      currR += dr;
      currC += dc;
    }
  }
  return false;
}
export function isKingInCheck(board, color) {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const opponentColor = color === 'w' ? 'b' : 'w';
  return isSquareAttacked(board, kingPos[0], kingPos[1], opponentColor);
}
function getPseudoLegalMoves(state, r, c) {
  const piece = state.board[r][c];
  if (!piece) return [];
  const color = getPieceColor(piece);
  if (color !== state.turn) return [];
  const moves = [];
  const pType = piece.toUpperCase();
  if (pType === 'P') {
    const fwd = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;
    const promoRow = color === 'w' ? 0 : 7;
    const r1 = r + fwd;
    if (isOnBoard(r1, c) && !state.board[r1][c]) {
      if (r1 === promoRow) {
        ['Q', 'R', 'B', 'N'].forEach((promo) => {
          moves.push({ from: [r, c], to: [r1, c], promotion: promo });
        });
      } else {
        moves.push({ from: [r, c], to: [r1, c] });
      }
      const r2 = r + fwd * 2;
      if (r === startRow && isOnBoard(r2, c) && !state.board[r2][c]) {
        moves.push({ from: [r, c], to: [r2, c], isPawnDouble: true });
      }
    }
    for (const dc of [-1, 1]) {
      const capC = c + dc;
      if (isOnBoard(r1, capC)) {
        const target = state.board[r1][capC];
        if (target && getPieceColor(target) !== color) {
          if (r1 === promoRow) {
            ['Q', 'R', 'B', 'N'].forEach((promo) => {
              moves.push({ from: [r, c], to: [r1, capC], promotion: promo });
            });
          } else {
            moves.push({ from: [r, c], to: [r1, capC] });
          }
        } else if (state.enPassant && state.enPassant[0] === r1 && state.enPassant[1] === capC) {
          moves.push({ from: [r, c], to: [r1, capC], isEnPassant: true });
        }
      }
    }
  }
  if (pType === 'N') {
    const deltas = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    for (const [dr, dc] of deltas) {
      const nr = r + dr;
      const nc = c + dc;
      if (isOnBoard(nr, nc)) {
        const dest = state.board[nr][nc];
        if (!dest || getPieceColor(dest) !== color) {
          moves.push({ from: [r, c], to: [nr, nc] });
        }
      }
    }
  }
  if (pType === 'B' || pType === 'Q') {
    const diag = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dr, dc] of diag) {
      let nr = r + dr;
      let nc = c + dc;
      while (isOnBoard(nr, nc)) {
        const dest = state.board[nr][nc];
        if (!dest) {
          moves.push({ from: [r, c], to: [nr, nc] });
        } else {
          if (getPieceColor(dest) !== color) {
            moves.push({ from: [r, c], to: [nr, nc] });
          }
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
  }
  if (pType === 'R' || pType === 'Q') {
    const ortho = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of ortho) {
      let nr = r + dr;
      let nc = c + dc;
      while (isOnBoard(nr, nc)) {
        const dest = state.board[nr][nc];
        if (!dest) {
          moves.push({ from: [r, c], to: [nr, nc] });
        } else {
          if (getPieceColor(dest) !== color) {
            moves.push({ from: [r, c], to: [nr, nc] });
          }
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
  }
  if (pType === 'K') {
    const deltas = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1],
    ];
    for (const [dr, dc] of deltas) {
      const nr = r + dr;
      const nc = c + dc;
      if (isOnBoard(nr, nc)) {
        const dest = state.board[nr][nc];
        if (!dest || getPieceColor(dest) !== color) {
          moves.push({ from: [r, c], to: [nr, nc] });
        }
      }
    }
    const enemyColor = color === 'w' ? 'b' : 'w';
    if (!isSquareAttacked(state.board, r, c, enemyColor)) {
      const canKingside = color === 'w' ? state.castling.K : state.castling.k;
      if (canKingside && !state.board[r][5] && !state.board[r][6]) {
        if (!isSquareAttacked(state.board, r, 5, enemyColor) && !isSquareAttacked(state.board, r, 6, enemyColor)) {
          moves.push({ from: [r, c], to: [r, 6], isCastling: 'K' });
        }
      }
      const canQueenside = color === 'w' ? state.castling.Q : state.castling.q;
      if (canQueenside && !state.board[r][1] && !state.board[r][2] && !state.board[r][3]) {
        if (!isSquareAttacked(state.board, r, 3, enemyColor) && !isSquareAttacked(state.board, r, 2, enemyColor)) {
          moves.push({ from: [r, c], to: [r, 2], isCastling: 'Q' });
        }
      }
    }
  }
  return moves;
}
function applyMoveOnBoard(board, move, state = null) {
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  const piece = board[fr][fc];
  const color = getPieceColor(piece);
  board[fr][fc] = null;
  if (move.isEnPassant) {
    const capRow = color === 'w' ? tr + 1 : tr - 1;
    board[capRow][tc] = null;
  }
  if (move.isCastling === 'K') {
    board[fr][5] = board[fr][7];
    board[fr][7] = null;
  } else if (move.isCastling === 'Q') {
    board[fr][3] = board[fr][0];
    board[fr][0] = null;
  }
  if (move.promotion) {
    board[tr][tc] = color === 'w' ? move.promotion.toUpperCase() : move.promotion.toLowerCase();
  } else {
    board[tr][tc] = piece;
  }
}
export function getLegalMoves(state) {
  const legalMoves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = state.board[r][c];
      if (piece && getPieceColor(piece) === state.turn) {
        const pseudos = getPseudoLegalMoves(state, r, c);
        for (const move of pseudos) {
          // Simuler le coup
          const testBoard = state.board.map((row) => [...row]);
          applyMoveOnBoard(testBoard, move, state);
          if (!isKingInCheck(testBoard, state.turn)) {
            legalMoves.push(move);
          }
        }
      }
    }
  }
  return legalMoves;
}
export function makeMove(state, moveInput) {
  if (state.isGameOver) {
    return { success: false, reason: 'La partie est déjà terminée.' };
  }
  const cleanInput = (moveInput || '').trim().replace(/[\s\-_]/g, '');
  const legalMoves = getLegalMoves(state);
  let matchedMove = null;
  if (cleanInput.length >= 4) {
    const fromCoord = cleanInput.slice(0, 2);
    const toCoord = cleanInput.slice(2, 4);
    const promo = cleanInput.length >= 5 ? cleanInput[4].toUpperCase() : null;
    const fromPos = coordToPos(fromCoord);
    const toPos = coordToPos(toCoord);
    if (fromPos && toPos) {
      matchedMove = legalMoves.find((m) => {
        const samePos = m.from[0] === fromPos[0] && m.from[1] === fromPos[1] &&
                        m.to[0] === toPos[0] && m.to[1] === toPos[1];
        if (!samePos) return false;
        if (promo) return m.promotion === promo;
        return true;
      });
    }
  }
  if (!matchedMove) {
    const upper = cleanInput.toUpperCase();
    if (upper === 'O-O' || upper === '0-0' || upper === 'OO') {
      matchedMove = legalMoves.find((m) => m.isCastling === 'K');
    } else if (upper === 'O-O-O' || upper === '0-0-0' || upper === 'OOO') {
      matchedMove = legalMoves.find((m) => m.isCastling === 'Q');
    }
  }
  if (!matchedMove) {
    const targetCoord = cleanInput.slice(-2);
    const targetPos = coordToPos(targetCoord);
    if (targetPos) {
      const pieceIndicator = cleanInput.length === 3 ? cleanInput[0].toUpperCase() : (cleanInput.length === 2 ? 'P' : null);
      if (pieceIndicator) {
        matchedMove = legalMoves.find((m) => {
          if (m.to[0] !== targetPos[0] || m.to[1] !== targetPos[1]) return false;
          const movingPiece = state.board[m.from[0]][m.from[1]].toUpperCase();
          return movingPiece === pieceIndicator;
        });
      }
    }
  }
  if (!matchedMove) {
    return {
      success: false,
      reason: `Coup invalide ou illégal : "${moveInput}". Utilisez la notation coordonnée (ex: \`e2e4\`, \`g1f3\`, \`e7e8q\`, \`O-O\`).`,
    };
  }
  const [fr, fc] = matchedMove.from;
  const [tr, tc] = matchedMove.to;
  const movingPiece = state.board[fr][fc];
  const targetPiece = state.board[tr][tc];
  const isPawn = movingPiece.toUpperCase() === 'P';
  if (targetPiece) {
    state.captured[state.turn].push(targetPiece);
  } else if (matchedMove.isEnPassant) {
    const enemyPawn = state.turn === 'w' ? 'p' : 'P';
    state.captured[state.turn].push(enemyPawn);
  }
  applyMoveOnBoard(state.board, matchedMove, state);
  if (movingPiece === 'K') {
    state.castling.K = false;
    state.castling.Q = false;
  } else if (movingPiece === 'k') {
    state.castling.k = false;
    state.castling.q = false;
  } else if (movingPiece === 'R') {
    if (fr === 7 && fc === 0) state.castling.Q = false;
    if (fr === 7 && fc === 7) state.castling.K = false;
  } else if (movingPiece === 'r') {
    if (fr === 0 && fc === 0) state.castling.q = false;
    if (fr === 0 && fc === 7) state.castling.k = false;
  }
  if (matchedMove.isPawnDouble) {
    state.enPassant = [state.turn === 'w' ? fr - 1 : fr + 1, fc];
  } else {
    state.enPassant = null;
  }
  if (isPawn || targetPiece) {
    state.halfmoveClock = 0;
  } else {
    state.halfmoveClock++;
  }
  if (state.turn === 'b') {
    state.fullmoveNumber++;
  }
  const moveStr = `${posToCoord(fr, fc)}${posToCoord(tr, tc)}${matchedMove.promotion ? matchedMove.promotion.toLowerCase() : ''}`;
  state.history.push(moveStr);
  const nextTurn = state.turn === 'w' ? 'b' : 'w';
  state.turn = nextTurn;
  const opponentLegalMoves = getLegalMoves(state);
  const inCheck = isKingInCheck(state.board, nextTurn);
  if (opponentLegalMoves.length === 0) {
    state.isGameOver = true;
    if (inCheck) {
      state.winner = nextTurn === 'w' ? 'b' : 'w';
      state.reason = 'checkmate';
    } else {
      state.winner = 'draw';
      state.reason = 'stalemate';
    }
  } else if (state.halfmoveClock >= 100) {
    state.isGameOver = true;
    state.winner = 'draw';
    state.reason = '50_moves_rule';
  }
  return {
    success: true,
    move: moveStr,
    inCheck,
    isGameOver: state.isGameOver,
    winner: state.winner,
    reason: state.reason,
    fen: toFen(state),
  };
}
export function renderChessAscii(board, perspective = 'w') {
  const isWhite = perspective === 'w';
  let out = '    a   b   c   d   e   f   g   h\n';
  out += '  +---+---+---+---+---+---+---+---+\n';
  const rows = isWhite ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const cols = isWhite ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  for (const r of rows) {
    const rankNum = 8 - r;
    out += `${rankNum} |`;
    for (const c of cols) {
      const piece = board[r][c];
      const sym = piece ? CHESS_PIECES[piece].symbol : ' ';
      out += ` ${sym} |`;
    }
    out += ` ${rankNum}\n  +---+---+---+---+---+---+---+---+\n`;
  }
  out += '    a   b   c   d   e   f   g   h';
  return out;
}
export function getBestMoveAI(state, depth = 2) {
  const legalMoves = getLegalMoves(state);
  if (legalMoves.length === 0) return null;
  let bestMove = legalMoves[0];
  let bestScore = state.turn === 'w' ? -Infinity : Infinity;
  legalMoves.sort((a, b) => {
    const targetA = state.board[a.to[0]][a.to[1]];
    const targetB = state.board[b.to[0]][b.to[1]];
    const valA = targetA ? CHESS_PIECES[targetA].val : 0;
    const valB = targetB ? CHESS_PIECES[targetB].val : 0;
    return valB - valA;
  });
  for (const move of legalMoves) {
    const clone = cloneChessState(state);
    applyMoveOnBoard(clone.board, move, clone);
    clone.turn = state.turn === 'w' ? 'b' : 'w';
    const score = minimax(clone, depth - 1, -Infinity, Infinity, clone.turn === 'w');
    if (state.turn === 'w') {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }
  const [fr, fc] = bestMove.from;
  const [tr, tc] = bestMove.to;
  return `${posToCoord(fr, fc)}${posToCoord(tr, tc)}${bestMove.promotion ? bestMove.promotion.toLowerCase() : ''}`;
}
function minimax(state, depth, alpha, beta, isMaximizing) {
  if (depth === 0) {
    return evaluateBoard(state.board);
  }
  const legalMoves = getLegalMoves(state);
  if (legalMoves.length === 0) {
    if (isKingInCheck(state.board, state.turn)) {
      return isMaximizing ? -100000 : 100000;
    }
    return 0; 
  }
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of legalMoves) {
      const clone = cloneChessState(state);
      applyMoveOnBoard(clone.board, move, clone);
      clone.turn = 'b';
      const score = minimax(clone, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of legalMoves) {
      const clone = cloneChessState(state);
      applyMoveOnBoard(clone.board, move, clone);
      clone.turn = 'w';
      const score = minimax(clone, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}
function evaluateBoard(board) {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const val = CHESS_PIECES[p].val;
      const isW = p === p.toUpperCase();
      let centerBonus = 0;
      if ((r === 3 || r === 4) && (c === 3 || c === 4)) {
        centerBonus = 20;
      } else if ((r >= 2 && r <= 5) && (c >= 2 && c <= 5)) {
        centerBonus = 10;
      }
      const totalVal = val + centerBonus;
      score += isW ? totalVal : -totalVal;
    }
  }
  return score;
}
