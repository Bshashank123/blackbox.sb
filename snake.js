const SC = document.getElementById('sCanvas'), sctx = SC.getContext('2d');
const SCELL = 21, GRID = 20; // 20x20 grid
SC.width = SCELL*GRID; SC.height = SCELL*GRID;

let dir='R', next='R', snake, food, score=0, alive=true, last=0, speed=110, acc=0;

function reset(){
  snake=[{x:5,y:10},{x:4,y:10},{x:3,y:10}];
  spawnFood(); dir=next='R'; score=0; alive=true; last=0; acc=0;
  document.getElementById('sScore').textContent=score;
}
function spawnFood(){
  do{
    food={x:Math.floor(Math.random()*GRID),y:Math.floor(Math.random()*GRID)};
  }while(snake.some(p=>p.x===food.x && p.y===food.y));
}
function step(){
  dir = next;
  const head = {x:snake[0].x + (dir==='R') - (dir==='L'),
                y:snake[0].y + (dir==='D') - (dir==='U')};
  // wrap
  head.x = (head.x+GRID)%GRID; head.y = (head.y+GRID)%GRID;
  if(snake.some(p=>p.x===head.x&&p.y===head.y)){ alive=false; return; }
  snake.unshift(head);
  if(head.x===food.x && head.y===food.y){
    score+=10; document.getElementById('sScore').textContent=score; spawnFood();
  }else snake.pop();
}
function draw(){
  sctx.fillStyle="#13202d"; sctx.fillRect(0,0,SC.width,SC.height);
  // grid
  for(let y=0;y<GRID;y++)for(let x=0;x<GRID;x++){
    sctx.fillStyle = (x+y)%2? "#244a2c":"#2f6a37";
    sctx.fillRect(x*SCELL,y*SCELL,SCELL-1,SCELL-1);
  }
  // food
  sctx.fillStyle="#ff6b6b";
  sctx.fillRect(food.x*SCELL+3,food.y*SCELL+3,SCELL-6,SCELL-6);
  // snake
  for(let i=snake.length-1;i>=0;i--){
    sctx.fillStyle = i? "#9dff91" : "#6aa6ff";
    sctx.fillRect(snake[i].x*SCELL+1,snake[i].y*SCELL+1,SCELL-2,SCELL-2);
  }
}
function loop(ts){
  if(!alive){ draw(); return; }
  const dt = ts-last; last=ts; acc+=dt;
  if(acc>speed){ acc=0; step(); }
  draw();
  requestAnimationFrame(loop);
}

document.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if((k==='arrowup'||k==='w')&&dir!=='D') next='U';
  if((k==='arrowdown'||k==='s')&&dir!=='U') next='D';
  if((k==='arrowleft'||k==='a')&&dir!=='R') next='L';
  if((k==='arrowright'||k==='d')&&dir!=='L') next='R';
});
document.querySelectorAll('.d').forEach(b=>{
  b.addEventListener('click',()=>{ const d=b.dataset.d;
    if(d==='U'&&dir!=='D') next='U';
    if(d==='D'&&dir!=='U') next='D';
    if(d==='L'&&dir!=='R') next='L';
    if(d==='R'&&dir!=='L') next='R';
  });
});
document.getElementById('sNew').onclick=()=>{reset(); requestAnimationFrame(loop);};

reset(); requestAnimationFrame(loop);
