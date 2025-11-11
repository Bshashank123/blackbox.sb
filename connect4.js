const boardEl = document.getElementById("connectBoard");
const turnBadge = document.getElementById("turnBadge");
const newGameBtn = document.getElementById("newGameBtn");
const modeSelect = document.getElementById("modeSelect");

const ROWS = 6, COLS = 7;
let board = [], currentPlayer = 1, mode = "bot", gameOver = false;

// Initialize
function newGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  currentPlayer = 1;
  gameOver = false;
  mode = modeSelect.value;
  drawBoard();
  updateTurnBadge();
}

function drawBoard() {
  boardEl.innerHTML = "";
  boardEl.style.display = "grid";
  boardEl.style.gridTemplateColumns = `repeat(${COLS}, 60px)`;
  boardEl.style.gap = "6px";

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("div");
      cell.className = "slot";
      cell.dataset.col = c;
      const val = board[r][c];
      if (val === 1) cell.classList.add("red");
      if (val === 2) cell.classList.add("yellow");
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
        turnBadge.textContent = `Player ${currentPlayer} Wins! 🎉`;
        gameOver = true;
        return;
      }
      switchPlayer();
      updateTurnBadge();
      if (mode === "bot" && currentPlayer === 2 && !gameOver) {
        setTimeout(botMove, 600);
      }
      return;
    }
  }
}

function switchPlayer() {
  currentPlayer = currentPlayer === 1 ? 2 : 1;
}

function updateTurnBadge() {
  const color = currentPlayer === 1 ? "🔴" : "🟡";
  const who = mode === "bot" && currentPlayer === 2 ? "Bot" : `Player ${currentPlayer}`;
  turnBadge.textContent = `${who}’s Turn (${color})`;
}

function botMove() {
  // simple random bot, picks a non-full column
  const validCols = [];
  for (let c = 0; c < COLS; c++) if (board[0][c] === 0) validCols.push(c);
  const pick = validCols[Math.floor(Math.random() * validCols.length)];
  handleMove(pick);
}

// check if last move wins
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
function countDir(r,c,dr,dc) {
  let cnt=0, player=board[r][c];
  for(let i=1;i<4;i++){
    const nr=r+dr*i, nc=c+dc*i;
    if(nr<0||nr>=ROWS||nc<0||nc>=COLS) break;
    if(board[nr][nc]===player) cnt++; else break;
  }
  return cnt;
}

newGameBtn.addEventListener("click", newGame);
modeSelect.addEventListener("change", newGame);
newGame();
