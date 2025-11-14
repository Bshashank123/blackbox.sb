const B = document.getElementById('mBoard');
const movesEl = id=>document.getElementById(id);
const EMOJIS = ['🐶','🐱','🐭','🐹','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐤','🦄','🐙','🐬','🦋','🌸','🍀','🍓','🍇','🍒'];

let first=null, lock=false, moves=0, pairs=0, totalPairs=8, timer=null, secs=0;

function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }

function build(size='4x4'){
  const [cols,rows]=size.split('x').map(Number);
  totalPairs = (cols*rows)/2;
  const pool = shuffle(EMOJIS.slice()).slice(0,totalPairs);
  const deck = shuffle(pool.concat(pool));
  B.style.gridTemplateColumns = `repeat(${cols},80px)`;
  B.innerHTML='';
  deck.forEach((e,i)=>{
    const d=document.createElement('button');
    d.className='card'; d.dataset.i=i; d.dataset.v=e; d.textContent='?';
    d.onclick=()=>flip(d);
    B.appendChild(d);
  });
  first=null; lock=false; moves=0; pairs=0; secs=0;
  movesEl('mMoves').textContent=moves;
  movesEl('mPairs').textContent=pairs;
  movesEl('mTime').textContent='0s';
  if(timer) clearInterval(timer);
  timer=setInterval(()=>{secs++; movesEl('mTime').textContent=`${secs}s`;},1000);
}

function flip(card){
  if(lock || card.classList.contains('matched') || card===first) return;
  card.classList.add('flipped'); card.textContent=card.dataset.v;
  if(!first){ first=card; return; }
  moves++; movesEl('mMoves').textContent=moves;
  if(card.dataset.v===first.dataset.v){
    card.classList.add('matched'); first.classList.add('matched');
    pairs++; movesEl('mPairs').textContent=pairs;
    first=null;
    if(pairs===totalPairs){ clearInterval(timer); }
  }else{
    lock=true;
    setTimeout(()=>{
      card.classList.remove('flipped'); first.classList.remove('flipped');
      card.textContent='?'; first.textContent='?'; first=null; lock=false;
    },650);
  }
}

document.getElementById('mNew').onclick=()=>build(document.getElementById('mSize').value);
document.getElementById('mSize').onchange=e=>build(e.target.value);

build();
