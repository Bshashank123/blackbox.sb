// ===== Blackboard Game (3 Players) =====

const byId = (id) => document.getElementById(id);

function primesUpTo(n=100){
  const sieve = Array(n+1).fill(true);
  sieve[0]=sieve[1]=false;
  for(let p=2;p*p<=n;p++) if(sieve[p]) for(let k=p*p;k<=n;k+=p) sieve[k]=false;
  return [...Array(n+1).keys()].filter(x=>sieve[x]);
}
const PRIMES = primesUpTo(100);

const state = {
  numbers: [],
  currentCircled: null,
  currentPlayer: 1,
  playerCount: 3,
  moveCount: 0
};

const boardEl = byId("board");
const turnBadge = byId("turnBadge");
const circledInfo = byId("circledInfo");
const logList = byId("logList");
const newGameBtn = byId("newGameBtn");
const playerCountSelect = byId("playerCountSelect");

function newGame(){
  state.numbers = Array.from({length:100},(_,i)=>({value:i+1,erased:false,circled:false}));
  state.currentCircled = null;
  state.currentPlayer = 1;
  state.moveCount = 0;
  state.playerCount = parseInt(playerCountSelect.value);
  boardEl.innerHTML = "";
  logList.innerHTML = "";
  circledInfo.textContent = "No number circled yet";

  state.numbers.forEach(num=>{
    const cell=document.createElement("button");
    cell.className="cell";
    cell.textContent=num.value;
    cell.dataset.value=num.value;
    cell.addEventListener("click",()=>onCellClick(num.value));
    boardEl.appendChild(cell);
  });

  updateTurnBadge();
  updateInteractivity();
}

function updateTurnBadge(){
  turnBadge.textContent = `Player ${state.currentPlayer}’s turn`;
}

function getCellEl(v){ return boardEl.querySelector(`.cell[data-value="${v}"]`); }

function markCircled(v,on){
  const obj=state.numbers[v-1];
  obj.circled=on;
  const el=getCellEl(v);
  if(el) el.classList.toggle("circled",on);
  if(on) circledInfo.textContent=`Circled: ${v}`;
}

function markErased(v){
  const obj=state.numbers[v-1];
  obj.erased=true; obj.circled=false;
  const el=getCellEl(v);
  if(el){ el.classList.add("erased"); el.disabled=true; }
}

function isAvailable(v){ const o=state.numbers[v-1]; return o && !o.erased && !o.circled; }

function validMovesFrom(c){
  if(!c) return [];
  const moves=new Set();
  for(const p of PRIMES){
    const mul=c*p, div=c/p;
    if(mul<=100 && isAvailable(mul)) moves.add(mul);
    if(Number.isInteger(div) && div>=1 && isAvailable(div)) moves.add(div);
  }
  moves.delete(c);
  return [...moves].sort((a,b)=>a-b);
}

function highlightValidMoves(valids){
  boardEl.querySelectorAll(".cell").forEach(el=>el.classList.remove("valid"));
  valids.forEach(v=>{ const el=getCellEl(v); if(el) el.classList.add("valid"); });
}

function setClickable(enabled){
  boardEl.querySelectorAll(".cell").forEach(el=>{
    const val=+el.dataset.value;
    const allowed=enabled.has(val);
    const obj=state.numbers[val-1];
    el.disabled = !allowed || obj.erased || obj.circled;
    el.classList.toggle("disabled",el.disabled);
  });
}

function updateInteractivity(){
  if(state.currentCircled===null){
    const evens=new Set();
    for(let v=2;v<=100;v+=2) if(isAvailable(v)) evens.add(v);
    setClickable(evens);
    highlightValidMoves([...evens]);
  } else {
    const valids=validMovesFrom(state.currentCircled);
    setClickable(new Set(valids));
    highlightValidMoves(valids);
  }
}

function logMove(msg){
  const li=document.createElement("li");
  li.textContent=msg;
  logList.appendChild(li);
  logList.scrollTop=logList.scrollHeight;
}

function switchPlayer(){
  state.currentPlayer++;
  if(state.currentPlayer > state.playerCount) state.currentPlayer=1;
  updateTurnBadge();
}

function onCellClick(target){
  if(state.currentCircled===null){
    if(target%2!==0) return;
    state.currentCircled=target;
    markCircled(target,true);
    logMove(`Player 1 circled ${target} (start)`);
    switchPlayer();
    postMoveCheck();
    return;
  }

  const from=state.currentCircled;
  const valids=validMovesFrom(from);
  if(!valids.includes(target)) return;

  markErased(from);
  markCircled(from,false);
  state.currentCircled=target;
  markCircled(target,true);
  logMove(`Player ${state.currentPlayer} moved ${from} → ${target}`);
  switchPlayer();
  postMoveCheck();
}

function postMoveCheck(){
  updateInteractivity();

  if(state.currentCircled!==null){
    const valids=validMovesFrom(state.currentCircled);
    if(valids.length===0){
      const loser=state.currentPlayer;
      const winner = loser===1 ? state.playerCount : loser-1;
      highlightValidMoves([]);
      boardEl.querySelectorAll(".cell").forEach(el=>el.disabled=true);
      logMove(`No valid moves for Player ${loser}. Player ${winner} wins!`);
      turnBadge.textContent=`Player ${winner} wins! 🎉`;
    }
  }
}

newGameBtn.addEventListener("click",newGame);
playerCountSelect.addEventListener("change",newGame);

newGame();
