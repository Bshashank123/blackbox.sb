const boardEl = document.getElementById('board');
const turnBadge = document.getElementById('turnBadge');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const flipBtn = document.getElementById('flipBtn');
const newBtn = document.getElementById('newBtn');
const moveListEl = document.getElementById('moveList');
const lostWhiteEl = document.getElementById('lostWhite');
const lostBlackEl = document.getElementById('lostBlack');

let flipped = false;
let lostWhite = [], lostBlack = [];
let history = [], future = [];

const glyph = {
  wK:'♔', wQ:'♕', wR:'♖', wB:'♗', wN:'♘', wP:'♙',
  bK:'♚', bQ:'♛', bR:'♜', bB:'♝', bN:'♞', bP:'♟'
};

let board, turn, selected, legalTargets;

function newGame() {
  board = [
    ['bR','bN','bB','bQ','bK','bB','bN','bR'],
    ['bP','bP','bP','bP','bP','bP','bP','bP'],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ['wP','wP','wP','wP','wP','wP','wP','wP'],
    ['wR','wN','wB','wQ','wK','wB','wN','wR']
  ];
  turn = 'w';
  selected = null;
  legalTargets = [];
  lostWhite = [];
  lostBlack = [];
  history = [];
  future = [];
  render();
}

/* Render board */
function render() {
  boardEl.innerHTML = '';
  const ranks = flipped ? [...Array(8).keys()] : [...Array(8).keys()].reverse();
  const files = flipped ? [...Array(8).keys()].reverse() : [...Array(8).keys()];

  for (const r of ranks) {
    for (const c of files) {
      const sq = document.createElement('div');
      sq.className = 'square ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
      sq.dataset.r = r;
      sq.dataset.c = c;

      const piece = board[r][c];
      if (piece) {
        sq.textContent = glyph[piece];
        sq.style.color = piece[0] === 'w' ? '#f8f8ff' : '#111';
        sq.style.textShadow = piece[0] === 'b'
          ? '0 0 4px #fff8, 0 0 8px rgba(255,255,255,0.1)'
          : '0 0 6px rgba(255,255,255,0.4)';
      }

      if (selected && selected.r === r && selected.c === c)
        sq.classList.add('selected'); // soft green glow

      const target = legalTargets.find(t => t.r === r && t.c === c);
      if (target) {
        if (board[r][c] && board[r][c][0] !== turn)
          sq.classList.add('capture-highlight');
        else sq.classList.add('highlight');
      }

      sq.addEventListener('click', onSquareClick);
      boardEl.appendChild(sq);
    }
  }

  // Turn indicator
  const colorName = turn === 'w' ? 'White' : 'Black';
  turnBadge.textContent = colorName + ' to move';
  turnBadge.className = 'turn-indicator ' + (turn === 'w' ? 'turn-white' : 'turn-black');

  // Update captures
  lostWhiteEl.innerHTML = lostWhite.map(x => glyph[x]).join(' ');
  lostBlackEl.innerHTML = lostBlack.map(x => glyph[x]).join(' ');
}

/* Click handler */
function onSquareClick(e) {
  const r = +e.currentTarget.dataset.r;
  const c = +e.currentTarget.dataset.c;
  const piece = board[r][c];
  const target = legalTargets.find(t => t.r === r && t.c === c);

  if (selected && target) {
    makeMove(selected.r, selected.c, r, c);
    selected = null;
    legalTargets = [];
    render();
    return;
  }

  if (piece && piece[0] === turn) {
    selected = { r, c };
    legalTargets = generateMoves(r, c);
    render();
  } else {
    selected = null;
    legalTargets = [];
    render();
  }
}

/* Generate moves (simple rules) */
function generateMoves(r, c) {
  const p = board[r][c];
  if (!p) return [];
  const color = p[0];
  const type = p[1];
  const M = [];

  const add = (rr, cc) => { if (onBoard(rr, cc) && !friendly(rr, cc, color)) M.push({ r: rr, c: cc }); };
  const slide = dirs => { for (const [dr, dc] of dirs) {
    let rr = r + dr, cc = c + dc;
    while (onBoard(rr, cc) && !friendly(rr, cc, color)) {
      M.push({ r: rr, c: cc });
      if (board[rr][cc]) break;
      rr += dr; cc += dc;
    }
  }};

  if (type === 'P') {
    const dir = color === 'w' ? -1 : 1;
    const start = color === 'w' ? 6 : 1;
    if (!board[r + dir][c]) add(r + dir, c);
    if (r === start && !board[r + dir][c] && !board[r + 2 * dir][c]) add(r + 2 * dir, c);
    for (const dc of [-1, 1])
      if (onBoard(r + dir, c + dc) && enemy(r + dir, c + dc, color)) add(r + dir, c + dc);
  }

  if (type === 'N') [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]
    .forEach(([dr,dc]) => add(r+dr,c+dc));
  if (type === 'B') slide([[1,1],[1,-1],[-1,1],[-1,-1]]);
  if (type === 'R') slide([[1,0],[-1,0],[0,1],[0,-1]]);
  if (type === 'Q') slide([[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]);
  if (type === 'K') for (const dr of [-1,0,1]) for (const dc of [-1,0,1]) if (dr||dc) add(r+dr,c+dc);

  return M;
}

/* Helpers */
function onBoard(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
function friendly(r, c, color) { return board[r][c] && board[r][c][0] === color; }
function enemy(r, c, color) { return board[r][c] && board[r][c][0] !== color; }

/* Perform move */
function makeMove(r1, c1, r2, c2) {
  const piece = board[r1][c1];
  const captured = board[r2][c2];

  if (captured) {
    if (captured[0] === 'w') lostWhite.push(captured);
    else lostBlack.push(captured);
  }

  history.push(JSON.parse(JSON.stringify(board)));
  future = [];

  board[r2][c2] = piece;
  board[r1][c1] = null;

  // Promotion
  if (piece === 'wP' && r2 === 0) board[r2][c2] = 'wQ';
  if (piece === 'bP' && r2 === 7) board[r2][c2] = 'bQ';

  turn = turn === 'w' ? 'b' : 'w';
  updateMoveList(piece, r1, c1, r2, c2);
}

function updateMoveList(p, r1, c1, r2, c2) {
  const files = 'abcdefgh', ranks = '87654321';
  const move = glyph[p] + ' ' + files[c1] + ranks[r1] + ' → ' + files[c2] + ranks[r2];
  const li = document.createElement('li');
  li.textContent = move;
  moveListEl.appendChild(li);
  moveListEl.scrollTop = moveListEl.scrollHeight;
}

/* Undo / Redo / Flip / New */
undoBtn.onclick = () => {
  if (!history.length) return;
  const snap = history.pop();
  future.push(JSON.parse(JSON.stringify(board)));
  board = snap;
  turn = turn === 'w' ? 'b' : 'w';
  render();
};
redoBtn.onclick = () => {
  if (!future.length) return;
  const snap = future.pop();
  history.push(JSON.parse(JSON.stringify(board)));
  board = snap;
  turn = turn === 'w' ? 'b' : 'w';
  render();
};
flipBtn.onclick = () => { flipped = !flipped; render(); };
newBtn.onclick = newGame;

document.addEventListener('DOMContentLoaded', newGame);
