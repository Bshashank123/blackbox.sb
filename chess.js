const boardEl = document.getElementById('board');
const turnBadge = document.getElementById('turnBadge');
const infoBadge = document.getElementById('infoBadge');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const flipBtn = document.getElementById('flipBtn');
const moveListEl = document.getElementById('moveList');

let flipped = false;

// Unicode chess symbols
const glyph = {
  wK:'♔', wQ:'♕', wR:'♖', wB:'♗', wN:'♘', wP:'♙',
  bK:'♚', bQ:'♛', bR:'♜', bB:'♝', bN:'♞', bP:'♟'
};

// Initial board
let board = [
  ['bR','bN','bB','bQ','bK','bB','bN','bR'],
  ['bP','bP','bP','bP','bP','bP','bP','bP'],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ['wP','wP','wP','wP','wP','wP','wP','wP'],
  ['wR','wN','wB','wQ','wK','wB','wN','wR']
];

let turn = 'w';
let selected = null;
let legalTargets = [];
let castle = {wK:true,wR_a:true,wR_h:true,bK:true,bR_a:true,bR_h:true};
let history = [], future = [];

function render() {
  boardEl.innerHTML = "";
  const ranks = flipped ? [...Array(8).keys()] : [...Array(8).keys()].reverse();
  const files = flipped ? [...Array(8).keys()].reverse() : [...Array(8).keys()];
  for (const r of ranks) {
    for (const c of files) {
      const sq = document.createElement('div');
      sq.className = 'square ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
      sq.dataset.r = r; sq.dataset.c = c;
      const piece = board[r][c];
      if (piece) sq.textContent = glyph[piece];
      if (selected && selected.r===r && selected.c===c) sq.classList.add('highlight');
      const target = legalTargets.find(t=>t.r===r && t.c===c);
      if (target) {
        if (board[r][c] && board[r][c][0]!==turn) sq.classList.add('capture-highlight');
        else sq.classList.add('highlight');
      }
      if (inCheck(turn) && piece === (turn==='w'?'wK':'bK')) sq.classList.add('king-in-check');
      sq.addEventListener('click', onSquareClick);
      boardEl.appendChild(sq);
    }
  }
  turnBadge.textContent = (turn==='w'?'White':'Black') + ' to move';
  undoBtn.disabled = !history.length;
  redoBtn.disabled = !future.length;
}

function onSquareClick(e) {
  const r = +e.currentTarget.dataset.r, c = +e.currentTarget.dataset.c;
  const piece = board[r][c];
  const target = legalTargets.find(t=>t.r===r && t.c===c);
  if (selected && target) {
    makeMove(selected.r, selected.c, r, c, target.special);
    selected=null; legalTargets=[]; render(); checkGameEnd(); return;
  }
  if (piece && piece[0]===turn) {
    selected={r,c}; legalTargets=generateLegalMoves(r,c); render();
  } else { selected=null; legalTargets=[]; render(); }
}

/* ================== move generation / validation =================== */
function generateLegalMoves(r,c){
  const piece=board[r][c]; if(!piece) return [];
  const color=piece[0], type=piece[1];
  const M=[];
  const add=(rr,cc)=>{if(onBoard(rr,cc)&&!friendly(rr,cc,color))M.push({r:rr,c:cc});};
  const slide=(dirs)=>{for(const[dr,dc]of dirs){let rr=r+dr,cc=c+dc;
    while(onBoard(rr,cc)&&!friendly(rr,cc,color)){M.push({r:rr,c:cc}); if(board[rr][cc])break; rr+=dr; cc+=dc;}}};
  if(type==='P'){
    const dir=color==='w'?-1:1; const start=color==='w'?6:1;
    if(!board[r+dir][c])add(r+dir,c);
    if(r===start&&!board[r+dir][c]&&!board[r+2*dir][c])add(r+2*dir,c);
    for(const dc of [-1,1]) if(onBoard(r+dir,c+dc)&&enemy(r+dir,c+dc,color))add(r+dir,c+dc);
  }
  if(type==='N'){ [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>add(r+dr,c+dc)); }
  if(type==='B')slide([[1,1],[1,-1],[-1,1],[-1,-1]]);
  if(type==='R')slide([[1,0],[-1,0],[0,1],[0,-1]]);
  if(type==='Q')slide([[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]);
  if(type==='K'){
    for(const dr of [-1,0,1])for(const dc of [-1,0,1])if(dr||dc)add(r+dr,c+dc);
    if(!inCheck(color)){
      if(color==='w'&&castle.wK){
        if(castle.wR_h&&!board[7][5]&&!board[7][6]&&!attacked(7,5,'b')&&!attacked(7,6,'b')&&r===7&&c===4&&board[7][7]==='wR')
          M.push({r:7,c:6,special:'wO-O'});
        if(castle.wR_a&&!board[7][3]&&!board[7][2]&&!board[7][1]&&!attacked(7,3,'b')&&!attacked(7,2,'b')&&r===7&&c===4&&board[7][0]==='wR')
          M.push({r:7,c:2,special:'wO-O-O'});
      }
      if(color==='b'&&castle.bK){
        if(castle.bR_h&&!board[0][5]&&!board[0][6]&&!attacked(0,5,'w')&&!attacked(0,6,'w')&&r===0&&c===4&&board[0][7]==='bR')
          M.push({r:0,c:6,special:'bO-O'});
        if(castle.bR_a&&!board[0][3]&&!board[0][2]&&!board[0][1]&&!attacked(0,3,'w')&&!attacked(0,2,'w')&&r===0&&c===4&&board[0][0]==='bR')
          M.push({r:0,c:2,special:'bO-O-O'});
      }
    }
  }
  return M.filter(m=>{
    const b=deepCopy(board), cr=JSON.parse(JSON.stringify(castle));
    simulateMove(b,cr,r,c,m.r,m.c,m.special);
    return !kingInCheckAfter(b,color);
  });
}

function onBoard(r,c){return r>=0&&r<8&&c>=0&&c<8;}
function friendly(r,c,color){return board[r][c]&&board[r][c][0]===color;}
function enemy(r,c,color){return board[r][c]&&board[r][c][0]!==color;}

function attacked(r,c,byColor){
  for(let i=0;i<8;i++)for(let j=0;j<8;j++){
    const p=board[i][j]; if(!p||p[0]!==byColor)continue;
    const moves=pseudoMoves(i,j,true);
    if(moves.some(m=>m.r===r&&m.c===c))return true;
  } return false;
}

function pseudoMoves(r,c,forAttack=false){
  const p=board[r][c]; if(!p)return[]; const color=p[0], type=p[1];
  const M=[]; const add=(rr,cc)=>{if(onBoard(rr,cc)&&!friendly(rr,cc,color))M.push({r:rr,c:cc});};
  const slide=(dirs)=>{for(const[dr,dc]of dirs){let rr=r+dr,cc=c+dc;
    while(onBoard(rr,cc)&&!friendly(rr,cc,color)){M.push({r:rr,c:cc});if(board[rr][cc])break;rr+=dr;cc+=dc;}}};
  if(type==='P'){
    const dir=color==='w'?-1:1; for(const dc of[-1,1])if(onBoard(r+dir,c+dc))M.push({r:r+dir,c:c+dc});
    if(!forAttack&&!board[r+dir]?.[c])add(r+dir,c);
    return M;
  }
  if(type==='N'){ [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>add(r+dr,c+dc)); return M;}
  if(type==='B'){slide([[1,1],[1,-1],[-1,1],[-1,-1]]);return M;}
  if(type==='R'){slide([[1,0],[-1,0],[0,1],[0,-1]]);return M;}
  if(type==='Q'){slide([[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]);return M;}
  if(type==='K'){for(const dr of[-1,0,1])for(const dc of[-1,0,1])if(dr||dc)add(r+dr,c+dc);return M;}
  return M;
}

function simulateMove(b,cr,r1,c1,r2,c2,special){
  const p=b[r1][c1];
  if(special){
    if(special==='wO-O'){b[7][4]=null;b[7][6]='wK';b[7][7]=null;b[7][5]='wR';}
    else if(special==='wO-O-O'){b[7][4]=null;b[7][2]='wK';b[7][0]=null;b[7][3]='wR';}
    else if(special==='bO-O'){b[0][4]=null;b[0][6]='bK';b[0][7]=null;b[0][5]='bR';}
    else if(special==='bO-O-O'){b[0][4]=null;b[0][2]='bK';b[0][0]=null;b[0][3]='bR';}
  } else { b[r2][c2]=p; b[r1][c1]=null; }
}

function deepCopy(x){return JSON.parse(JSON.stringify(x));}
function kingSquare(color){for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]===color+'K')return{r,c};}
function inCheck(color){const k=kingSquare(color);return attacked(k.r,k.c,color==='w'?'b':'w');}
function kingInCheckAfter(b,color){
  const k=(()=>{for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(b[r][c]===color+'K')return{r,c};})();
  const opp=color==='w'?'b':'w';
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const p=b[r][c];if(!p||p[0]!==opp)continue;
    const save=board;board=b;const ms=pseudoMoves(r,c,true);board=save;
    if(ms.some(m=>m.r===k.r&&m.c===k.c))return true;
  } return false;
}

/* ================== moving =================== */
function makeMove(r1,c1,r2,c2,special){
  const snapshot={board:deepCopy(board),castle:JSON.parse(JSON.stringify(castle)),turn,moveText:toSAN(r1,c1,r2,c2,special)};
  history.push(snapshot); future=[];
  appendMove(snapshot.moveText);
  const p=board[r1][c1];
  if(p==='wK'){castle.wK=false;castle.wR_a=false;castle.wR_h=false;}
  if(p==='bK'){castle.bK=false;castle.bR_a=false;castle.bR_h=false;}
  if(p==='wR'&&r1===7&&c1===0)castle.wR_a=false;
  if(p==='wR'&&r1===7&&c1===7)castle.wR_h=false;
  if(p==='bR'&&r1===0&&c1===0)castle.bR_a=false;
  if(p==='bR'&&r1===0&&c1===7)castle.bR_h=false;
  if(special){
    if(special==='wO-O'){board[7][4]=null;board[7][6]='wK';board[7][7]=null;board[7][5]='wR';}
    else if(special==='wO-O-O'){board[7][4]=null;board[7][2]='wK';board[7][0]=null;board[7][3]='wR';}
    else if(special==='bO-O'){board[0][4]=null;board[0][6]='bK';board[0][7]=null;board[0][5]='bR';}
    else if(special==='bO-O-O'){board[0][4]=null;board[0][2]='bK';board[0][0]=null;board[0][3]='bR';}
  } else {board[r2][c2]=p;board[r1][c1]=null;}
  for(let c=0;c<8;c++){if(board[0][c]==='wP')board[0][c]='wQ';if(board[7][c]==='bP')board[7][c]='bQ';}
  turn=(turn==='w'?'b':'w'); infoBadge.textContent='';
}

function toSAN(r1,c1,r2,c2,special){
  const files='abcdefgh', ranks='87654321';
  const p=board[r1][c1];
  if(special) return special.replace(/[wb]/,'').replace(/-/g,'');
  const piece=p[1]==='P'?'':p[1];
  const capture=board[r2][c2]?'x':'';
  return piece+files[c1]+ranks[r1]+capture+files[c2]+ranks[r2];
}

function appendMove(t){
  const li=document.createElement('li'); li.textContent=t;
  moveListEl.append
