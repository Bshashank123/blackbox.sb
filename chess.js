const boardEl = document.getElementById('board');
const turnBadge = document.getElementById('turnBadge');
const infoBadge = document.getElementById('infoBadge');

const LIGHT='light', DARK='dark';
const WHITE='w', BLACK='b';
let turn = WHITE;

// Simple piece set; Unicode symbols
const glyph = {
  wK:'♔', wQ:'♕', wR:'♖', wB:'♗', wN:'♘', wP:'♙',
  bK:'♚', bQ:'♛', bR:'♜', bB:'♝', bN:'♞', bP:'♟'
};

// Start position
let board = [
  ['bR','bN','bB','bQ','bK','bB','bN','bR'],
  ['bP','bP','bP','bP','bP','bP','bP','bP'],
  [ null, null, null, null, null, null, null, null ],
  [ null, null, null, null, null, null, null, null ],
  [ null, null, null, null, null, null, null, null ],
  [ null, null, null, null, null, null, null, null ],
  ['wP','wP','wP','wP','wP','wP','wP','wP'],
  ['wR','wN','wB','wQ','wK','wB','wN','wR'],
];

// Track castling rights
let castle = { wK: true, wR_a: true, wR_h: true, bK: true, bR_a: true, bR_h: true };

let selected = null;             // {r,c}
let legalTargets = [];           // [{r,c, special?}]
render();

function render() {
  boardEl.innerHTML = '';
  for (let r=0;r<8;r++){
    for (let c=0;c<8;c++){
      const sq = document.createElement('div');
      sq.className = 'square ' + ((r+c)%2===0?LIGHT:DARK);
      sq.dataset.r = r; sq.dataset.c = c;
      const piece = board[r][c];
      if (piece) sq.textContent = glyph[piece];
      if (selected && selected.r===r && selected.c===c) sq.classList.add('highlight');
      if (legalTargets.some(t=>t.r===r&&t.c===c)) sq.classList.add('highlight');
      if (inCheck(turn) && piece === (turn==='w'?'wK':'bK') ) sq.classList.add('king-in-check');
      sq.addEventListener('click', onSquareClick);
      boardEl.appendChild(sq);
    }
  }
  turnBadge.textContent = (turn===WHITE?'White':'Black') + ' to move';
}

function onSquareClick(e){
  const r = +e.currentTarget.dataset.r, c = +e.currentTarget.dataset.c;
  const piece = board[r][c];
  // If square is a legal target -> move
  const target = legalTargets.find(t=>t.r===r && t.c===c);
  if (selected && target){
    makeMove(selected.r, selected.c, r, c, target.special);
    selected = null; legalTargets=[]; render(); checkGameEnd(); return;
  }
  // Select friendly piece
  if (piece && piece[0]===turn){
    selected = {r,c};
    legalTargets = generateLegalMoves(r,c);
    render();
  } else { selected=null; legalTargets=[]; render(); }
}

function generateLegalMoves(r,c){
  const piece = board[r][c]; if(!piece) return [];
  const color = piece[0], type = piece[1];
  const moves = [];
  const add = (rr,cc) => { if(onBoard(rr,cc) && !friendly(rr,cc,color)) moves.push({r:rr,c:cc}); };
  const slide = (dirs) => {
    for(const [dr,dc] of dirs){
      let rr=r+dr, cc=c+dc;
      while(onBoard(rr,cc) && !friendly(rr,cc,color)){
        moves.push({r:rr,c:cc});
        if(board[rr][cc]) break;
        rr+=dr; cc+=dc;
      }
    }
  };
  if(type==='P'){
    const dir = color===WHITE ? -1 : 1;
    const startRank = color===WHITE?6:1;
    if(!board[r+dir][c]) add(r+dir,c);
    if(r===startRank && !board[r+dir][c] && !board[r+2*dir][c]) add(r+2*dir,c);
    for(const dc of [-1,1]) if(onBoard(r+dir,c+dc) && enemy(r+dir,c+dc,color)) add(r+dir,c+dc);
  }
  if(type==='N'){
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>add(r+dr,c+dc));
  }
  if(type==='B') slide([[1,1],[1,-1],[-1,1],[-1,-1]]);
  if(type==='R') slide([[1,0],[-1,0],[0,1],[0,-1]]);
  if(type==='Q') slide([[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]);
  if(type==='K'){
    for(const dr of [-1,0,1]) for(const dc of [-1,0,1]) if(dr||dc) add(r+dr,c+dc);
    // Castling
    if(!inCheck(color)){
      if(color===WHITE && castle.wK){
        // king side: squares (7,5) and (7,6) empty and not attacked; rook at (7,7) and right available
        if(castle.wR_h && !board[7][5] && !board[7][6] && !attacked(7,5,BLACK) && !attacked(7,6,BLACK) && r===7 && c===4 && board[7][7]==='wR'){
          moves.push({r:7,c:6,special:'wO-O'});
        }
        if(castle.wR_a && !board[7][3] && !board[7][2] && !board[7][1] && !attacked(7,3,BLACK) && !attacked(7,2,BLACK) && r===7 && c===4 && board[7][0]==='wR'){
          moves.push({r:7,c:2,special:'wO-O-O'});
        }
      }
      if(color===BLACK && castle.bK){
        if(castle.bR_h && !board[0][5] && !board[0][6] && !attacked(0,5,WHITE) && !attacked(0,6,WHITE) && r===0 && c===4 && board[0][7]==='bR'){
          moves.push({r:0,c:6,special:'bO-O'});
        }
        if(castle.bR_a && !board[0][3] && !board[0][2] && !board[0][1] && !attacked(0,3,WHITE) && !attacked(0,2,WHITE) && r===0 && c===4 && board[0][0]==='bR'){
          moves.push({r:0,c:2,special:'bO-O-O'});
        }
      }
    }
  }
  // Filter out moves leaving own king in check
  return moves.filter(m=>{
    const snapshot = deepCopy(board), cc = deepCopy(castle);
    simulateMove(snapshot, cc, r,c, m.r,m.c, m.special);
    return !kingInCheckAfter(snapshot, color);
  });
}

function makeMove(r1,c1,r2,c2,special){
  const piece = board[r1][c1];
  // Update castling rights on moving pieces
  if(piece==='wK'){ castle.wK=false; castle.wR_a=false; castle.wR_h=false; }
  if(piece==='bK'){ castle.bK=false; castle.bR_a=false; castle.bR_h=false; }
  if(piece==='wR' && r1===7 && c1===0) castle.wR_a=false;
  if(piece==='wR' && r1===7 && c1===7) castle.wR_h=false;
  if(piece==='bR' && r1===0 && c1===0) castle.bR_a=false;
  if(piece==='bR' && r1===0 && c1===7) castle.bR_h=false;

  if(special){
    // Perform castling
    if(special==='wO-O'){ board[7][4]=null; board[7][6]='wK'; board[7][7]=null; board[7][5]='wR'; }
    else if(special==='wO-O-O'){ board[7][4]=null; board[7][2]='wK'; board[7][0]=null; board[7][3]='wR'; }
    else if(special==='bO-O'){ board[0][4]=null; board[0][6]='bK'; board[0][7]=null; board[0][5]='bR'; }
    else if(special==='bO-O-O'){ board[0][4]=null; board[0][2]='bK'; board[0][0]=null; board[0][3]='bR'; }
  } else {
    board[r2][c2] = piece;
    board[r1][c1] = null;
  }

  // Promotion (auto-queen)
  for(let c=0;c<8;c++){
    if(board[0][c]==='wP') board[0][c]='wQ';
    if(board[7][c]==='bP') board[7][c]='bQ';
  }

  turn = (turn===WHITE?BLACK:WHITE);
  infoBadge.textContent = '';
}

function onBoard(r,c){ return r>=0 && r<8 && c>=0 && c<8; }
function friendly(r,c,color){ return board[r][c] && board[r][c][0]===color; }
function enemy(r,c,color){ return board[r][c] && board[r][c][0]!==color; }

function attacked(r,c,byColor){
  // quick attack test (used for castling & checks)
  // generate pseudo moves for opponent and see if any target (r,c)
  for(let i=0;i<8;i++) for(let j=0;j<8;j++){
    const p=board[i][j]; if(!p || p[0]!==byColor) continue;
    const moves = pseudoMoves(i,j,true);
    if(moves.some(m=>m.r===r && m.c===c)) return true;
  }
  return false;
}

function pseudoMoves(r,c,forAttack=false){
  const piece = board[r][c]; if(!piece) return [];
  const color = piece[0], type = piece[1];
  const M=[]; const add=(rr,cc)=>{ if(onBoard(rr,cc) && !friendly(rr,cc,color)) M.push({r:rr,c:cc}); };
  const slide=(dirs)=>{ for(const[dr,dc] of dirs){ let rr=r+dr, cc=c+dc;
    while(onBoard(rr,cc) && !friendly(rr,cc,color)){ M.push({r:rr,c:cc}); if(board[rr][cc]) break; rr+=dr; cc+=dc; } } };
  if(type==='P'){
    const dir = color===WHITE?-1:1; // for attack consider diagonals only
    for(const dc of [-1,1]) if(onBoard(r+dir,c+dc)) M.push({r:r+dir,c:c+dc});
    if(!forAttack){ // push/2 not needed for attack detection
      if(!board[r+dir]?.[c]) add(r+dir,c);
      const sr = color===WHITE?6:1; if(r===sr && !board[r+dir]?.[c] && !board[r+2*dir]?.[c]) add(r+2*dir,c);
    }
    return M;
  }
  if(type==='N'){ [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>add(r+dr,c+dc)); return M; }
  if(type==='B'){ slide([[1,1],[1,-1],[-1,1],[-1,-1]]); return M; }
  if(type==='R'){ slide([[1,0],[-1,0],[0,1],[0,-1]]); return M; }
  if(type==='Q'){ slide([[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]); return M; }
  if(type==='K'){ for(const dr of [-1,0,1]) for(const dc of [-1,0,1]) if(dr||dc) add(r+dr,c+dc); return M; }
  return M;
}

function kingSquare(color){
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(board[r][c]===color+'K') return {r,c};
  return null;
}
function inCheck(color){ const k=kingSquare(color); return attacked(k.r, k.c, color===WHITE?BLACK:WHITE); }
function kingInCheckAfter(b,color){
  // with snapshot board b
  const k = (()=>{ for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(b[r][c]===color+'K') return {r,c}; })();
  const opp = color===WHITE?BLACK:WHITE;
  // brute force attacks
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const p=b[r][c]; if(!p || p[0]!==opp) continue;
    // reuse current pseudoMoves by temporarily switching global board (safe enough here)
    const save=board; board=b;
    const ms=pseudoMoves(r,c,true);
    board=save;
    if(ms.some(m=>m.r===k.r && m.c===k.c)) return true;
  }
  return false;
}

function simulateMove(b, cr, r1,c1, r2,c2, special){
  const p=b[r1][c1];
  if(special){
    if(special==='wO-O'){ b[7][4]=null; b[7][6]='wK'; b[7][7]=null; b[7][5]='wR'; }
    else if(special==='wO-O-O'){ b[7][4]=null; b[7][2]='wK'; b[7][0]=null; b[7][3]='wR'; }
    else if(special==='bO-O'){ b[0][4]=null; b[0][6]='bK'; b[0][7]=null; b[0][5]='bR'; }
    else if(special==='bO-O-O'){ b[0][4]=null; b[0][2]='bK'; b[0][0]=null; b[0][3]='bR'; }
  }else{ b[r2][c2]=p; b[r1][c1]=null; }
  // promotions not necessary for check test
}

function deepCopy(x){ return JSON.parse(JSON.stringify(x)); }

function checkGameEnd(){
  // no legal moves available
  let any=false;
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const p=board[r][c]; if(!p || p[0]!==turn) continue;
    if(generateLegalMoves(r,c).length){ any=true; break; }
  }
  if(!any){
    if(inCheck(turn)){ infoBadge.textContent = 'Checkmate! ' + (turn===WHITE?'Black':'White') + ' wins.'; }
    else { infoBadge.textContent = 'Stalemate.'; }
  }
}

