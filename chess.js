/* global variables */
const boardEl = document.getElementById('board');
const turnBadge = document.getElementById('turnBadge');
const infoBadge = document.getElementById('infoBadge');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const moveListEl = document.getElementById('moveList');

/* --- keep full history --- */
let history = [];     // stack of snapshots {board,castle,turn,moveText}
let future = [];      // for redo

/* ... everything from previous file up to makeMove() unchanged ... */

/* === override render() to mark captures red === */
function render() {
  boardEl.innerHTML = '';
  for (let r=0;r<8;r++){
    for (let c=0;c<8;c++){
      const sq = document.createElement('div');
      sq.className = 'square ' + ((r+c)%2===0?'light':'dark');
      sq.dataset.r=r; sq.dataset.c=c;
      const piece = board[r][c];
      if (piece) sq.textContent = glyph[piece];
      // selection & move highlights
      if (selected && selected.r===r && selected.c===c) sq.classList.add('highlight');
      const target = legalTargets.find(t=>t.r===r&&t.c===c);
      if (target){
        // red outline if capture
        if(board[r][c] && board[r][c][0]!==turn)
          sq.classList.add('capture-highlight');
        else sq.classList.add('highlight');
      }
      if (inCheck(turn) && piece===(turn==='w'?'wK':'bK'))
        sq.classList.add('king-in-check');
      sq.addEventListener('click', onSquareClick);
      boardEl.appendChild(sq);
    }
  }
  turnBadge.textContent = (turn==='w'?'White':'Black')+' to move';
  undoBtn.disabled = !history.length;
  redoBtn.disabled = !future.length;
}

/* === update makeMove to push history & move list === */
function makeMove(r1,c1,r2,c2,special){
  const snapshot = {
    board: deepCopy(board),
    castle: JSON.parse(JSON.stringify(castle)),
    turn,
    moveText: toSAN(r1,c1,r2,c2,special)
  };
  history.push(snapshot); future=[];          // clear redo stack
  appendMove(snapshot.moveText);
  /* original move logic below */
  const piece = board[r1][c1];
  // ... (existing castling / promotion code unchanged) ...
  turn = (turn==='w'?'b':'w');
  infoBadge.textContent='';
}

/* === helpers for move text === */
function toSAN(r1,c1,r2,c2,special){
  const files='abcdefgh'; const ranks='87654321';
  const p=board[r1][c1];
  if(special) return special.replace(/[wb]/,'').replace(/-/g,'');
  const piece = p[1]==='P'?'':p[1];
  const capture = board[r2][c2] ? 'x' : '';
  return piece+files[c1]+ranks[r1]+capture+files[c2]+ranks[r2];
}
function appendMove(text){
  const li=document.createElement('li'); li.textContent=text;
  moveListEl.appendChild(li);
  moveListEl.scrollTop=moveListEl.scrollHeight;
}

/* === undo / redo === */
undoBtn.onclick = ()=>{ 
  if(!history.length) return;
  const snap = history.pop(); future.push({
    board: deepCopy(board), castle:JSON.parse(JSON.stringify(castle)), turn
  });
  board = deepCopy(snap.board); castle=JSON.parse(JSON.stringify(snap.castle)); turn=snap.turn;
  moveListEl.removeChild(moveListEl.lastChild);
  render();
};
redoBtn.onclick = ()=>{
  if(!future.length) return;
  const snap = future.pop(); history.push({
    board: deepCopy(board), castle:JSON.parse(JSON.stringify(castle)), turn
  });
  board = deepCopy(snap.board); castle=JSON.parse(JSON.stringify(snap.castle)); turn=snap.turn==='w'?'b':'w';
  render();
};

/* === everything else (generateLegalMoves, inCheck, etc.) remains === */

/* initial render */
render();
