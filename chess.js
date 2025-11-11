<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Chess</title>
  <link rel="stylesheet" href="style.css" />
  <style>
    /* Toolbar (larger, softer buttons) */
    .toolbar {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 16px;
      padding: 14px;
      background: #14161f;
      border-bottom: 1px solid #222;
    }
    .toolbar button {
      background: linear-gradient(145deg, #222637, #181b28);
      color: #fff;
      border: 1px solid #2a3046;
      border-radius: 12px;
      padding: 12px 22px;
      font-size: 1rem;
      cursor: pointer;
      transition: 0.25s;
      font-weight: 600;
    }
    .toolbar button:hover {
      filter: brightness(1.2);
      transform: translateY(-2px);
      box-shadow: 0 0 10px rgba(100, 255, 100, 0.3);
    }
    .toolbar button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Layout grid: Captures – Board – Move List */
    .game-layout {
      display: grid;
      grid-template-columns: 120px 1fr 200px;
      gap: 16px;
      padding: 18px;
    }
    @media (max-width:950px){
      .game-layout {
        grid-template-columns: 1fr;
        justify-items: center;
      }
    }

    /* Captured pieces panel */
    .capture-panel {
      background: var(--panel);
      border: 1px solid #2a3046;
      border-radius: 12px;
      padding: 10px;
      text-align: center;
      font-size: 24px;
      min-height: 120px;
      color: #fff;
    }
    .capture-panel h3 {
      font-size: 15px;
      color: var(--muted);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Move list panel */
    .moves-panel {
      background: var(--panel);
      border: 1px solid #2a3046;
      border-radius: 12px;
      padding: 10px;
      max-height: 460px;
      overflow: auto;
      color: #e0e3ea;
    }
    .moves-panel h3 {
      text-align: center;
      margin-bottom: 6px;
    }
    .moves-panel ol {
      padding-left: 20px;
      font-size: 15px;
    }

    /* Turn indicator */
    .turn-indicator {
      display: inline-block;
      background: #222637;
      padding: 8px 22px;
      border-radius: 30px;
      color: #fff;
      font-weight: 600;
      font-size: 1rem;
      margin: 8px auto;
      text-align: center;
      transition: 0.3s;
    }
    .turn-white { box-shadow: 0 0 12px rgba(255,255,255,0.6); }
    .turn-black { box-shadow: 0 0 12px rgba(0,0,0,0.8); background: #111318; }

    /* Board styling */
    .chess-board {
      display: grid;
      grid-template-columns: repeat(8, minmax(40px, 9vw));
      grid-template-rows: repeat(8, minmax(40px, 9vw));
      border: 4px solid #2a3046;
      border-radius: 10px;
      box-shadow: 0 0 15px rgba(0,0,0,0.7);
      overflow: hidden;
      user-select: none;
      font-size: clamp(28px, 5vw, 48px);
    }

    .square {
      display: flex;
      justify-content: center;
      align-items: center;
      transition: 0.1s;
    }

    .square.light { background: #769656; }   /* Green squares (Chess.com style) */
    .square.dark { background: #4a7039; }

    .square:hover { filter: brightness(1.1); }

    /* Highlights */
    .square.highlight {
      box-shadow: inset 0 0 0 3px rgba(0,255,100,0.6);
    }
    .square.capture-highlight {
      box-shadow: inset 0 0 0 3px rgba(255,80,80,0.8);
    }
    .square.selected {
      box-shadow: 0 0 15px rgba(80,255,120,0.8);
    }

    /* Piece visibility (bright black pieces) */
    .square[title^="b"] {
      filter: brightness(1.4) contrast(1.1);
      color: #000;
    }
  </style>
</head>
<body>
<header class="header">
  <button class="back-btn" onclick="location.href='index.html'">← Back</button>
  <h1>Chess</h1>
</header>

<section class="toolbar">
  <button id="undoBtn">⏪ Undo</button>
  <button id="redoBtn">⏩ Redo</button>
  <button id="flipBtn">🔄 Flip Board</button>
  <button id="newBtn">♻️ New Game</button>
</section>

<section class="status-bar" style="flex-direction:column;text-align:center;">
  <span id="turnBadge" class="turn-indicator turn-white">White to move</span>
  <span id="infoBadge"></span>
</section>

<main class="game-layout">
  <div class="capture-panel">
    <h3>Black Captures</h3>
    <div id="lostBlack"></div>
  </div>

  <div class="chess-wrap" style="justify-content:center;">
    <div id="board" class="chess-board"></div>
  </div>

  <div class="moves-panel">
    <h3>Move List</h3>
    <ol id="moveList"></ol>
  </div>
</main>

<div class="capture-panel">
  <h3>White Captures</h3>
  <div id="lostWhite"></div>
</div>

<footer class="footer">♟ Chess • Chess.com inspired UI • Undo / Redo • Captures • Highlights • Flip Board</footer>
<script src="chess.js"></script>
</body>
</html>
