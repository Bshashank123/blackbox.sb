const byId = (id) => document.getElementById(id);
const PRIMES = (() => {
  const a = Array(101).fill(true); a[0]=a[1]=false;
  for (let i=2;i*i<=100;i++) if (a[i]) for (let j=i*i;j<=100;j+=i) a[j]=false;
  return a.map((v,i)=>v?i:null).filter(Boolean);
})();

const state = {
  numbers: [], current: null, player: 1, mode: "bot", players: 2, moveCount: 0
};

const boardEl = byId("board"), turnBadge = byId("turnBadge"),
      circledInfo = byId("circledInfo"), logList = byId("logList"),
      newGameBtn = byId("newGameBtn"), modeSelect = byId("modeSelect");

function newGame(){
  state.mode = modeSelect.value;
  state.players = state.mode === "pvp3" ? 3 : 2;
  state.player = 1; state.current = null; state.moveCount = 0;
  state.numbers = Array.from({length:100},(_,i)=>({v:i+1, erased:false, circled:false}));
  boardEl.innerHTML=""; logList.innerHTML=""; circledInfo.textContent="No number circled yet";

  for(let i=1;i<=100;i++){
    const b = document.createElement("button");
    b.className="cell"; b.textContent=i; b.dataset.v=i;
    b.onclick = () => onClick(i);
    boardEl.appendChild(b);
  }
  updateUI();
}

function getBtn(v){return boardEl.querySelector(`[data-v="${v}"]`)}
function isFree(v){const o=state.numbers[v-1]; return o && !o.erased && !o.circled}

function validMoves(from){
  if(from==null) return [];
  const set=new Set();
  for(const p of PRIMES){
    const m=from*p, d=from/p;
    if(m<=100 && isFree(m)) set.add(m);
    if(Number.isInteger(d) && d>=1 && isFree(d)) set.add(d);
  }
  set.delete(from);
  return [...set].sort((a,b)=>a-b);
}

function highlight(){
  const valids = state.current===null ? Array.from({length:50},(_,i)=>(i+1)*2) : validMoves(state.current);
  boardEl.querySelectorAll(".cell").forEach(b=>{
    const v=+b.dataset.v, o=state.numbers[v-1];
    b.disabled = o.erased || (state.current===null ? v%2!==0 : !valids.includes(v));
    b.classList.toggle("valid", !b.disabled && !o.erased);
  });
}

function markCircled(v, yes){
  state.numbers[v-1].circled = yes;
  getBtn(v).classList.toggle("circled", yes);
  circledInfo.textContent = yes ? `Circled: ${v}` : "No number circled yet";
}
function erase(v){
  state.numbers[v-1].erased = true;
  const el=getBtn(v); el.classList.add("erased"); el.disabled=true; el.classList.remove("valid","circled");
}

function log(msg){ const li=document.createElement("li"); li.textContent=msg; logList.appendChild(li); logList.scrollTop=logList.scrollHeight; }

function updateTurn(){
  const who = state.mode==="bot" && state.player===2 ? "Bot" : `Player ${state.player}`;
  turnBadge.textContent = `${who}’s turn`;
}

function switchPlayer(){
  state.player++; if(state.player>state.players) state.player=1;
  updateTurn();
}

function updateUI(){ updateTurn(); highlight(); }

function onClick(v){
  if(state.current===null){
    if(v%2!==0) return;
    state.current = v; markCircled(v, true); state.moveCount++; log(`P1 starts with ${v}`);
    switchPlayer(); postMove(); if(state.mode==="bot" && state.player===2) setTimeout(botTurn, 420);
    return;
  }
  const from=state.current; const valids=validMoves(from); if(!valids.includes(v)) return;

  erase(from); markCircled(from,false);
  state.current = v; markCircled(v,true); state.moveCount++;
  const who = state.mode==="bot" && state.player===2 ? "Bot" : `P${state.player}`;
  log(`${who} moved ${from} → ${v}`);

  switchPlayer(); postMove(); if(state.mode==="bot" && state.player===2) setTimeout(botTurn, 420);
}

function postMove(){
  highlight();
  const vm = validMoves(state.current);
  if(vm.length===0){
    const loser = state.mode==="bot" && state.player===2 ? "Bot" : `Player ${state.player}`;
    const winner = loser==="Bot" ? "Player 1" :
                   (state.player===1 ? (state.mode==="bot"?"Bot":"Player "+(state.players)) : `Player ${state.player-1}`);
    turnBadge.textContent = `${winner} wins! 🎉`;
    log(`No moves for ${loser}. ${winner} wins!`);
    boardEl.querySelectorAll(".cell").forEach(b=>b.disabled=true);
  }
}

function botTurn(){
  if(state.current===null) return; // bot never starts
  const from = state.current; const valids = validMoves(from); if(!valids.length) return;
  // Simple tactic: if any move leaves opponent with no moves, take it; else smallest.
  let pick=null;
  for(const v of valids){
    state.numbers[from-1].erased=true;
    state.numbers[from-1].circled=false;
    state.numbers[v-1].circled=true;
    const nm = validMoves(v);
    state.numbers[from-1].erased=false;
    state.numbers[v-1].circled=false;
    if(nm.length===0){ pick=v; break; }
  }
  if(pick==null) pick=valids[0];
  onClick(pick);
}

newGameBtn.addEventListener("click", newGame);
modeSelect.addEventListener("change", newGame);
newGame();
