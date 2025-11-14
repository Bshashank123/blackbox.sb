const C = document.getElementById('tCanvas'), ctx = C.getContext('2d');
const N = document.getElementById('tNext'), nctx = N.getContext('2d');
const sEl = id => document.getElementById(id);
const W = 10, H = 20, SZ = C.height / H; // 30x30 cell default
C.width = W * SZ; C.height = H * SZ;

const COLORS = {
  I:'#5ee7ff', J:'#6aa6ff', L:'#ffb84d', O:'#ffe26a',
  S:'#9dff91', T:'#d79bff', Z:'#ff7b7b', G:'#1b2130'
};
const SHAPES = {
  I:[[1,1,1,1]],
  J:[[1,0,0],[1,1,1]],
  L:[[0,0,1],[1,1,1]],
  O:[[1,1],[1,1]],
  S:[[0,1,1],[1,1,0]],
  T:[[0,1,0],[1,1,1]],
  Z:[[1,1,0],[0,1,1]],
};
const BAG = () => ['I','J','L','O','S','T','Z']
  .sort(()=>Math.random()-0.5);

let grid, cur, nx, x=3, y=0, t=0, drop=0, speed=800, score=0, lines=0, level=1, run=false, bag= BAG();

function empty(){ grid = Array.from({length:H},()=>Array(W).fill('')); }
function newPiece(){
  if(bag.length===0) bag= BAG();
  const type = bag.pop();
  cur = SHAPES[type].map(r=>r.slice());
  x = Math.floor((W - cur[0].length)/2); y = 0;
  if(collide(x,y,cur)) { run=false; }
}
function nextGen(){
  if(bag.length===0) bag= BAG();
  nx = bag[bag.length-1];
  drawNext();
}
function rotate(m){
  const r = m[0].map((_,i)=>m.map(row=>row[i]).reverse());
  return r;
}
function collide(px,py,shape){
  for(let r=0;r<shape.length;r++)
    for(let c=0;c<shape[r].length;c++)
      if(shape[r][c] &&
         (py+r<0 || px+c<0 || px+c>=W || py+r>=H || grid[py+r][px+c])) return true;
  return false;
}
function merge(){
  const type = getType();
  for(let r=0;r<cur.length;r++)
    for(let c=0;c<cur[r].length;c++)
      if(cur[r][c]) grid[y+r][x+c]=type;
}
function clearLines(){
  let cleared=0;
  for(let r=H-1;r>=0;r--){
    if(grid[r].every(v=>v)){
      grid.splice(r,1);
      grid.unshift(Array(W).fill(''));
      cleared++; r++;
    }
  }
  if(cleared){
    lines+=cleared;
    score += [0,40,100,300,1200][cleared]*level;
    level = Math.floor(lines/10)+1;
    speed = Math.max(120, 800 - (level-1)*60);
    sEl('tScore').textContent=score;
    sEl('tLines').textContent=lines;
    sEl('tLevel').textContent=level;
  }
}
function getType(){
  // find key by comparing to a shape (approx)
  for(const k in SHAPES){
    if(SHAPES[k][0].length===cur[0].length && SHAPES[k].length===cur.length) return k;
  }
  return 'T';
}
function draw(){
  ctx.clearRect(0,0,C.width,C.height);
  // board
  for(let r=0;r<H;r++){
    for(let c=0;c<W;c++){
      if(grid[r][c]){
        ctx.fillStyle = COLORS[grid[r][c]];
        ctx.fillRect(c*SZ, r*SZ, SZ-1, SZ-1);
      } else {
        ctx.fillStyle = '#1a2433';
        ctx.fillRect(c*SZ, r*SZ, SZ-1, SZ-1);
      }
    }
  }
  // current
  const type = getType();
  ctx.fillStyle = COLORS[type];
  for(let r=0;r<cur.length;r++)
    for(let c=0;c<cur[r].length;c++)
      if(cur[r][c]) ctx.fillRect((x+c)*SZ, (y+r)*SZ, SZ-1,SZ-1);
}
function drawNext(){
  nctx.clearRect(0,0,N.width,N.height);
  const shape = SHAPES[nx];
  const cell = Math.min(N.width/(shape[0].length+1), N.height/(shape.length+1));
  nctx.fillStyle = COLORS[nx];
  for(let r=0;r<shape.length;r++)
    for(let c=0;c<shape[r].length;c++)
      if(shape[r][c]) nctx.fillRect((c+0.5)*cell,(r+0.5)*cell,cell-4,cell-4);
}
function hardDrop(){
  while(!collide(x,y+1,cur)) y++;
  tick(); // lock quickly
}
function tick(){
  if(collide(x,y+1,cur)){ merge(); clearLines(); newPiece(); nextGen(); }
  else y++;
}
let last=0;
function loop(ts){
  if(!run){ draw(); return; }
  const dt = ts - last; last = ts;
  drop += dt;
  if(drop>speed){ drop=0; tick(); }
  draw();
  requestAnimationFrame(loop);
}

function start(){
  empty(); score=lines=0; level=1; speed=800;
  sEl('tScore').textContent=0; sEl('tLines').textContent=0; sEl('tLevel').textContent=1;
  newPiece(); nextGen(); run=true; last=0; drop=0; requestAnimationFrame(loop);
}
function pause(){ run=!run; if(run) requestAnimationFrame(loop); }

document.addEventListener('keydown',e=>{
  if(!cur) return;
  if(e.key==='ArrowLeft'||e.key==='a'){ if(!collide(x-1,y,cur)) x--; }
  if(e.key==='ArrowRight'||e.key==='d'){ if(!collide(x+1,y,cur)) x++; }
  if(e.key==='ArrowDown'||e.key==='s'){ if(!collide(x,y+1,cur)) y++; drop=0; }
  if(e.key==='ArrowUp'||e.key==='w'||e.key.toLowerCase()==='x'){
    const r = rotate(cur); if(!collide(x,y,r)) cur=r;
  }
  if(e.code==='Space'){ hardDrop(); }
  if(e.key.toLowerCase()==='p'){ pause(); }
});
sEl('tNew').onclick=start;
sEl('tPause').onclick=pause;

start();
