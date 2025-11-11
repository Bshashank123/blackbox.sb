const boardEl = document.getElementById("connectBoard");
const turnBadge = document.getElementById("turnBadge");
const newGameBtn = document.getElementById("newGameBtn");
const modeSelect = document.getElementById("modeSelect");

const ROWS = 6, COLS = 7;
let board = [], currentPlayer = 1, playerCount = 2, mode = "bot", gameOver = false;

function newGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  gameOver = false;
  mode = modeSelect.value;
  playerCount = mode === "pvp3" ? 3 : 2;
  currentPlayer = 1;
  drawBoard();
  updateTurnBadge();
}

function drawBoard() {
  boardEl.innerHTML = "";
  boardEl.style.display = "grid";
  boardEl.style.gridTemplateColumns = `repeat(${COLS}, minmax(40px, 10vw))`;
  boardEl.style.gap = "4px";

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("div");
      cell.className = "slot";
      cell.dataset.col = c;
      const val = board[r][c];
      if (val === 1) cell.classList.add("red");
      if (val === 2) cell.classList.add("yellow");
      if (val === 3) cell.classList.add("green");
      cell.addEventListener("click", () => handleMove(c));
      boardEl.appendChild(cell);
    }
  }
}

function handleMove(col) {
  if (gameOver) return;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) {
      board[r][col] = currentPlayer;
      drawBoard();
      if (checkWin(r, col)) {
        const color = colorName(currentPlayer);
        turnBadge.textContent = `${color} player wins! 🎉`;
        gameOver = true;
        return;
      }
      switchPlayer();
      updateTurnBadge();
      if (mode === "bot" && currentPlayer === 2 && !gameOver) {
        setTimeout(botMove, 500);
      }
      return;
    }
  }
}

function switchPlayer() {
  if (mode === "pvp3") currentPlayer = currentPlayer % 3 + 1;
  else currentPlayer = currentPlayer === 1 ? 2 : 1;
}

function updateTurnBadge() {
  const color = emojiColor(currentPlayer);
  const who = mode === "bot" && currentPlayer === 2 ? "Bot" : `Player ${currentPlayer}`;
  turnBadge.textContent = `${who}’s turn (${color})`;
}

function emojiColor(p) {
  return p === 1 ? "🔴" : p === 2 ? "🟡" : "🟢";
}
function colorName(p) {
  return p === 1 ? "Red" : p === 2 ? "Yellow" : "Green";
}

function botMove() {
  const valid = [];
  for (let c = 0; c < COLS; c++) if (board[0][c] === 0) valid.push(c);
  const choice = valid[Math.floor(Math.random() * valid.length)];
  handleMove(choice);
}

function checkWin(r, c) {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dr,dc] of dirs) {
    let count = 1;
    count += countDir(r, c, dr, dc);
    count += countDir(r, c, -dr, -dc);
    if (count >= 4) return true;
  }
  return false;
}

function countDir(r, c, dr, dc) {
  let cnt = 0, player = board[r][c];
  for (let i = 1; i < 4; i++) {
    const nr = r + dr * i, nc = c + dc * i;
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
    if (board[nr][nc] === player) cnt++; else break;
  }
  return cnt;
}

newGameBtn.addEventListener("click", newGame);
modeSelect.addEventListener("change", newGame);
newGame();
