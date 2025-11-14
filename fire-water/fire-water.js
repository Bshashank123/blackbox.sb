// ======================
// BASIC CONSTANTS
// ======================
const TILE = 32;
const COLS = 25;
const ROWS = 18;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// HUD elements
const badgeLevel = document.getElementById("levelBadge");
const badgeTime  = document.getElementById("timeBadge");
const badgeLives = document.getElementById("livesBadge");
const badgeGems  = document.getElementById("gemsBadge");

const kF = document.getElementById("kF");
const kW = document.getElementById("kW");
const dF = document.getElementById("dF");
const dW = document.getElementById("dW");

let levelIndex = 0;
let playing = true;
let keys = {};
let map = [];
let entities = [];

let fireboy = null;
let watergirl = null;

let lives = 3;
let gems = 0;
let startTime = 0;

// KEY INPUT
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup",   e => keys[e.key.toLowerCase()] = false);

// ======================
// LOAD LEVEL FROM FILE
// ======================
async function loadLevel(n) {
  const url = `levels/level${n+1}.txt`;

  const res = await fetch(url);
  if (!res.ok) { alert("Level missing: "+url); return; }

  const text = await res.text();
  const rows = text.trim().split("\n");

  map = rows.map(r => r.padEnd(COLS,".").slice(0,COLS));
  entities = [];
  fireboy = null;
  watergirl = null;

  // find players + objects
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const ch = map[r][c];

      if (ch === "F") fireboy = makePlayer("fire", c*TILE+4, r*TILE+4);
      if (ch === "W") watergirl = makePlayer("water", c*TILE+4, r*TILE+4);

      if ("BWPT".includes(ch)) {
        entities.push({type:ch, x:c*TILE, y:r*TILE});
      }
    }
  }

  startTime = Date.now();
  updateUI();
}

// ======================
// PLAYER OBJECT
// ======================
function makePlayer(type, x, y) {
  return {
    type,
    x, y,
    w:24, h:28,
    vx:0, vy:0,
    onGround:false,
    alive:true
  };
}

// ======================
// UPDATE + DRAW LOOP
// ======================
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// ======================
// UPDATE GAME LOGIC
// ======================
function update() {
  if (!fireboy || !watergirl) return;

  movePlayer(fireboy, keys["a"], keys["d"], keys["w"]);
  movePlayer(watergirl, keys["arrowleft"], keys["arrowright"], keys["arrowup"]);

  if (!fireboy.alive || !watergirl.alive) {
    lives--; if (lives <= 0) lives = 3;
    loadLevel(levelIndex);
  }
}

function movePlayer(p, left, right, jump) {
  if (!p.alive) return;

  if (left)  p.vx -= 0.7;
  if (right) p.vx += 0.7;
  p.vx *= 0.9;

  if (jump && p.onGround) {
    p.vy = -10;
    p.onGround = false;
  }

  p.vy += 0.5;
  if (p.vy > 12) p.vy = 12;

  // Apply movement
  p.x += p.vx;
  p.y += p.vy;

  // Keep in bounds
  if (p.y > 550) p.alive = false;
}

// ======================
// DRAW EVERYTHING
// ======================
function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawMap();
  drawPlayer(fireboy);
  drawPlayer(watergirl);
}

function drawMap() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const ch = map[r][c];
      const x = c*TILE, y = r*TILE;

      if (ch === "#") {
        ctx.fillStyle = "#2f3a2f";
        ctx.fillRect(x,y,TILE,TILE);
      }
    }
  }
}

function drawPlayer(p) {
  if (!p) return;
  ctx.fillStyle = p.type === "fire" ? "#ff6a3d" : "#4cc7ff";
  ctx.fillRect(p.x, p.y, p.w, p.h);
}

// ======================
// HUD
// ======================
function updateUI() {
  badgeLevel.textContent = `Level ${levelIndex+1}/15`;
  badgeLives.textContent = `Lives: ${lives}`;
  badgeGems.textContent = `Gems: ${gems}`;
}

// ======================
// START GAME
// ======================
loadLevel(levelIndex);
loop();
