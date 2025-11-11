// ===== Blackboard Game (1–100) =====
// Rules implemented from the problem text you shared.  [oai_citation:2‡B.pdf](sediment://file_00000000b1487208bf34cc3b2fb700ee)

/* ---------- Utilities ---------- */
const byId = (id) => document.getElementById(id);

function primesUpTo(n = 100) {
  const sieve = Array(n + 1).fill(true);
  sieve[0] = sieve[1] = false;
  for (let p = 2; p * p <= n; p++) {
    if (sieve[p]) for (let k = p * p; k <= n; k += p) sieve[k] = false;
  }
  return [...Array(n + 1).keys()].filter((x) => sieve[x]);
}
const PRIMES = primesUpTo(100);

/* ---------- Game State ---------- */
const state = {
  numbers: [],           // [{value, erased, circled}]
  currentCircled: null,  // number value or null
  currentPlayer: 1,      // 1 or 2 ("Computer" takes 2)
  mode: "pvp",           // "pvp" | "cpu"
  moveCount: 0
};

/* ---------- DOM Elements ---------- */
const boardEl = byId("board");
const turnBadge = byId("turnBadge");
const circledInfo = byId("circledInfo");
const logList = byId("logList");
const newGameBtn = byId("newGameBtn");
const showRulesBtn = byId("showRulesBtn");
const modeSelect = byId("modeSelect");

/* ---------- Initialization ---------- */
function newGame() {
  state.numbers = Array.from({ length: 100 }, (_, i) => ({
    value: i + 1,
    erased: false,
    circled: false
  }));
  state.currentCircled = null;
  state.currentPlayer = 1;
  state.moveCount = 0;
  boardEl.innerHTML = "";
  logList.innerHTML = "";
  circledInfo.textContent = "No number circled yet";

  // Draw board
  state.numbers.forEach((num) => {
    const cell = document.createElement("button");
    cell.className = "cell";
    cell.textContent = num.value;
    cell.setAttribute("data-value", num.value);
    cell.addEventListener("click", () => onCellClick(num.value));
    boardEl.appendChild(cell);
  });

  updateInteractivity();
  updateTurnBadge();
}

function updateTurnBadge() {
  const who = state.mode === "cpu" && state.currentPlayer === 2 ? "Computer" : `Player ${state.currentPlayer}`;
  turnBadge.textContent = `${who}’s turn`;
}

function getCellEl(v) {
  return boardEl.querySelector(`.cell[data-value="${v}"]`);
}

function markCircled(v, isCircled) {
  const obj = state.numbers[v - 1];
  obj.circled = isCircled;
  const el = getCellEl(v);
  if (!el) return;
  el.classList.toggle("circled", isCircled);
  if (isCircled) circledInfo.textContent = `Circled: ${v}`;
}

function markErased(v) {
  const obj = state.numbers[v - 1];
  obj.erased = true;
  obj.circled = false;
  const el = getCellEl(v);
  if (!el) return;
  el.classList.add("erased");
  el.classList.remove("circled", "valid");
  el.disabled = true;
  el.setAttribute("aria-disabled", "true");
}

function isAvailable(v) {
  const o = state.numbers[v - 1];
  return o && !o.erased && !o.circled;
}

function validMovesFrom(c) {
  if (c == null) return [];
  const moves = new Set();

  // Multiply by primes
  for (const p of PRIMES) {
    const t = c * p;
    if (t > 100) break;
    if (isAvailable(t)) moves.add(t);
  }
  // Divide by primes
  for (const p of PRIMES) {
    if (c % p === 0) {
      const t = c / p;
      if (t >= 1 && t <= 100 && isAvailable(t)) moves.add(t);
    }
  }
  moves.delete(c); // (shouldn’t be possible anyway)
  return [...moves].sort((a, b) => a - b);
}

function highlightValidMoves(valids) {
  // Reset all
  boardEl.querySelectorAll(".cell").forEach((el) => el.classList.remove("valid"));
  // Mark valids
  valids.forEach((v) => {
    const el = getCellEl(v);
    if (el) el.classList.add("valid");
  });
}

function setClickable(enabledValues) {
  // Everything disabled by default unless in enabledValues
  boardEl.querySelectorAll(".cell").forEach((el) => {
    const val = Number(el.getAttribute("data-value"));
    const o = state.numbers[val - 1];
    const allowed = enabledValues.has(val) && !o.erased && !o.circled;
    el.disabled = !allowed;
    el.classList.toggle("disabled", !allowed);
  });
}

function updateInteractivity() {
  // First move: any even, not erased
  if (state.currentCircled === null) {
    const enabled = new Set();
    for (let v = 2; v <= 100; v += 2) {
      if (isAvailable(v)) enabled.add(v);
    }
    setClickable(enabled);
    highlightValidMoves([...enabled]);
    return;
  }

  // Subsequent moves
  const valids = validMovesFrom(state.currentCircled);
  const allowed = new Set(valids);
  setClickable(allowed);
  highlightValidMoves(valids);
}

function logMove(text) {
  const li = document.createElement("li");
  li.textContent = text;
  logList.appendChild(li);
  logList.scrollTop = logList.scrollHeight;
}

function switchPlayer() {
  state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
  updateTurnBadge();
}

/* ---------- Move Handling ---------- */
function onCellClick(target) {
  // First move
  if (state.currentCircled === null) {
    if (target % 2 !== 0) return; // guard
    state.currentCircled = target;
    markCircled(target, true);
    state.moveCount += 1;
    logMove(`P1 circled ${target} (opening move)`);
    switchPlayer();
    postMoveCheck();
    maybeComputerTurn();
    return;
  }

  // Subsequent move: erase previously circled, circle new
  const from = state.currentCircled;
  const valids = validMovesFrom(from);
  if (!valids.includes(target)) return; // invalid click guard

  markErased(from);
  markCircled(from, false);

  state.currentCircled = target;
  markCircled(target, true);
  state.moveCount += 1;

  const who = state.mode === "cpu" && state.currentPlayer === 2 ? "Computer" : `P${state.currentPlayer}`;
  logMove(`${who} moved ${from} → ${target}`);

  switchPlayer();
  postMoveCheck();
  maybeComputerTurn();
}

function postMoveCheck() {
  updateTurnBadge();
  updateInteractivity();

  // If next player has no moves, they lose.
  if (state.currentCircled !== null) {
    const valids = validMovesFrom(state.currentCircled);
    if (valids.length === 0) {
      const loser = state.mode === "cpu" && state.currentPlayer === 2 ? "Computer" : `Player ${state.currentPlayer}`;
      const winner = loser === "Computer" ? "Player 1" :
                     (state.currentPlayer === 1 ? (state.mode === "cpu" ? "Computer" : "Player 2") : "Player 1");

      highlightValidMoves([]); // clear
      boardEl.querySelectorAll(".cell").forEach((el)=>{ el.disabled = true; el.classList.add("disabled"); });

      logMove(`No valid moves for ${loser}. ${winner} wins!`);
      turnBadge.textContent = `${winner} wins!`;
      return true;
    }
  }
  return false;
}

/* ---------- Simple Computer Player ---------- */
function maybeComputerTurn() {
  if (state.mode !== "cpu" || state.currentPlayer !== 2) return;
  // Delay slightly for UX
  setTimeout(() => {
    if (state.currentCircled === null) {
      // Computer can’t start; opening move is always P1
      return;
    }
    const from = state.currentCircled;
    const valids = validMovesFrom(from);
    if (valids.length === 0) return; // postMoveCheck() will catch loss

    // Naive tactic:
    // 1) If any move immediately leaves no moves for P1, take it.
    // 2) Else prefer smallest valid move (stable/simple).
    let pick = null;
    for (const v of valids) {
      // simulate
      const wasCircled = from;
      const tempErased = wasCircled;
      // Apply hypothetical:
      // - erase 'from'
      const savedErased = state.numbers[tempErased - 1].erased;
      state.numbers[tempErased - 1].erased = true;

      // - 'v' becomes circled (but availability check only cares about erased & circled flags)
      const savedCircledFlags = {
        fromCircled: state.numbers[wasCircled - 1].circled,
        vCircled: state.numbers[v - 1].circled
      };
      state.numbers[wasCircled - 1].circled = false;
      state.numbers[v - 1].circled = true;

      const nextMoves = validMovesFrom(v);

      // revert simulation
      state.numbers[tempErased - 1].erased = savedErased;
      state.numbers[wasCircled - 1].circled = savedCircledFlags.fromCircled;
      state.numbers[v - 1].circled = savedCircledFlags.vCircled;

      if (nextMoves.length === 0) { pick = v; break; }
    }
    if (pick == null) pick = valids[0];

    onCellClick(pick);
  }, 420);
}

/* ---------- Events ---------- */
newGameBtn.addEventListener("click", newGame);
showRulesBtn.addEventListener("click", () => {
  const box = document.getElementById("rulesBox");
  box.open = !box.open;
});
modeSelect.addEventListener("change", (e) => {
  state.mode = e.target.value;
  updateTurnBadge();
});

/* ---------- Start ---------- */
newGame();
