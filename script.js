const byId = id => document.getElementById(id);
const PRIMES = (() => {
  const a = Array(101).fill(true); a[0]=a[1]=false;
  for(let i=2;i*i<=100;i++) if(a[i]) for(let j=i*i;j<=100;j+=i) a[j]=false;
  return a.map((v,i)=>v?i:null).filter(Boolean);
})();

const state = {
  numbers: [],
  currentCircled: null,
  currentPlayer: 1,
  playerCount: 3
};

const board = byId("board");
const turnBadge = byId("turnBadge");
const circledInfo = byId("circledInfo");
const logList = byId("logList");
const newBtn = byId("newGameBtn");
const sel = byId("playerCountSelect");

function newGame(){
  state.playerCount = +sel.value;
  state.currentPlayer = 1;
  state.currentCircled = null;
  state.numbers = Array.from({length:100},(_,i)=>({v:i+1,erased:false,circled:false}));
  board.innerHTML = ""; logList.innerHTML = "";
  for(let i=1;i<=100;i++){
    const b=document.createElement("button");
    b.className="cell"; b.textContent=i; b.dataset.v=i;
    b.onclick=()=>onClick(i);
    board.appendChild(b);
  }
  updateUI();
}

function updateUI(){
  turnBadge.textContent=`Player ${state.currentPlayer}’s turn`;
  circledInfo.textContent= state.currentCircled ? `Circled: ${state.currentCircled}` : "No number circled yet";
  highlight();
}

function highlight(){
  const valids = state.currentCircled===null
    ? Array.from({length:50},(_,i)=>(i+1)*2)
    : validMoves(state.currentCircled);

  board.querySelectorAll(".cell").forEach(btn=>{
    const val=+btn.dataset.v;
    const obj=state.numbers[val-1];
    btn.disabled=obj.erased;
    btn.classList.remove("valid");
    if(!obj.erased && valids.includes(val)) btn.classList.add("valid");
  });
}

function validMoves(c){
  const res=[];
  for(const p of PRIMES){
    const mul=c*p, div=c/p;
    if(mul<=100 && isAvail(mul)) res.push(mul);
    if(Number.isInteger(div) && div>=1 && isAvail(div)) res.push(div);
  }
  return [...new Set(res)];
}

function isAvail(v){ const o=state.numbers[v-1]; return o && !o.erased && !o.circled; }

function onClick(v){
  if(state.currentCircled===null){
    if(v%2!==0) return;
    circle(v); log(`P1 starts with ${v}`); nextPlayer();
  } else {
    const from=state.currentCircled;
    if(!validMoves(from).includes(v)) return;
    erase(from); unCircle(from); circle(v);
    log(`P${state.currentPlayer} moved ${from} → ${v}`);
    nextPlayer();
  }
}

function circle(v){
  state.currentCircled=v;
  state.numbers[v-1].circled=true;
  getBtn(v).classList.add("circled");
  updateUI();
}

function unCircle(v){ state.numbers[v-1].circled=false; getBtn(v).classList.remove("circled"); }
function erase(v){ state.numbers[v-1].erased=true; const el=getBtn(v); el.classList.add("erased"); el.disabled=true; }
function getBtn(v){ return board.querySelector(`[data-v="${v}"]`); }

function nextPlayer(){
  state.currentPlayer++;
  if(state.currentPlayer>state.playerCount) state.currentPlayer=1;

  const valids=validMoves(state.currentCircled);
  if(!valids.length){
    const loser=state.currentPlayer;
    const winner = loser===1? state.playerCount : loser-1;
    log(`No moves for Player ${loser}. Player ${winner} wins!`);
    turnBadge.textContent=`Player ${winner} wins! 🎉`;
    board.querySelectorAll(".cell").forEach(b=>b.disabled=true);
    return;
  }
  updateUI();
}

function log(msg){
  const li=document.createElement("li");
  li.textContent=msg;
  logList.appendChild(li);
  logList.scrollTop=logList.scrollHeight;
}

newBtn.onclick=newGame;
sel.onchange=newGame;
newGame();
