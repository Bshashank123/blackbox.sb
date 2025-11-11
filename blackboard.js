const byId=id=>document.getElementById(id);
const PRIMES=(()=>{const a=Array(101).fill(true);a[0]=a[1]=false;
for(let i=2;i*i<=100;i++)if(a[i])for(let j=i*i;j<=100;j+=i)a[j]=false;
return a.map((v,i)=>v?i:null).filter(Boolean)})();

const state={numbers:[],current:null,player:1,count:3};
const board=byId("board"),turn=byId("turnBadge"),info=byId("circledInfo"),
logList=byId("logList"),btn=byId("newGameBtn"),sel=byId("playerCountSelect");

function newGame(){
  state.count=+sel.value;state.player=1;state.current=null;
  state.numbers=Array.from({length:100},(_,i)=>({v:i+1,erased:false,circled:false}));
  board.innerHTML="";logList.innerHTML="";
  for(let i=1;i<=100;i++){const b=document.createElement("button");
    b.className="cell";b.textContent=i;b.dataset.v=i;b.onclick=()=>onClick(i);
    board.appendChild(b);}
  updateUI();
}
function updateUI(){
  turn.textContent=`Player ${state.player}’s turn`;
  info.textContent=state.current?`Circled: ${state.current}`:"No number circled yet";
  highlight();
}
function highlight(){
  const valids=state.current===null?Array.from({length:50},(_,i)=>(i+1)*2):validMoves(state.current);
  board.querySelectorAll(".cell").forEach(b=>{
    const v=+b.dataset.v,o=state.numbers[v-1];
    b.disabled=o.erased; b.classList.remove("valid");
    if(!o.erased&&valids.includes(v)) b.classList.add("valid");
  });
}
function validMoves(c){
  const res=[];for(const p of PRIMES){
    const m=c*p,d=c/p;
    if(m<=100&&isFree(m))res.push(m);
    if(Number.isInteger(d)&&d>=1&&isFree(d))res.push(d);
  }return[...new Set(res)];
}
function isFree(v){const o=state.numbers[v-1];return o&&!o.erased&&!o.circled;}
function onClick(v){
  if(state.current===null){
    if(v%2!==0)return;circle(v);log(`P1 starts with ${v}`);next();
  }else{
    const from=state.current;if(!validMoves(from).includes(v))return;
    erase(from);unCircle(from);circle(v);log(`P${state.player} moved ${from} → ${v}`);next();
  }
}
function circle(v){state.current=v;state.numbers[v-1].circled=true;getBtn(v).classList.add("circled");updateUI();}
function unCircle(v){state.numbers[v-1].circled=false;getBtn(v).classList.remove("circled");}
function erase(v){state.numbers[v-1].erased=true;getBtn(v).classList.add("erased");}
function getBtn(v){return board.querySelector(`[data-v="${v}"]`);}
function next(){
  state.player++;if(state.player>state.count)state.player=1;
  const moves=validMoves(state.current);
  if(!moves.length){
    const loser=state.player,winner=loser===1?state.count:loser-1;
    log(`No moves for Player ${loser}. Player ${winner} wins!`);
    turn.textContent=`Player ${winner} wins! 🎉`;
    board.querySelectorAll(".cell").forEach(b=>b.disabled=true);
    return;
  }updateUI();
}
function log(m){const li=document.createElement("li");li.textContent=m;logList.appendChild(li);}
btn.onclick=newGame;sel.onchange=newGame;newGame();
