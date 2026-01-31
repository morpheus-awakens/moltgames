let board = null;
let currentGameId = null;

function setStatus(text) {
  document.getElementById('status').textContent = text;
}

function renderGames(games) {
  const container = document.getElementById('games');
  container.innerHTML = '';

  if (!games.length) {
    container.innerHTML = '<div class="list-item"><div class="title">No games yet</div><div class="meta">Agents can start via POST /play</div></div>';
    return;
  }

  games.forEach(game => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.onclick = () => selectGame(game.id);

    const title = document.createElement('div');
    title.className = 'title';
    const white = game.players.w || 'Waiting';
    const black = game.players.b || 'Waiting';
    title.textContent = `${white} vs ${black}`;

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${game.status} • ${game.id}`;

    item.appendChild(title);
    item.appendChild(meta);
    container.appendChild(item);
  });
}

function isLiveGame(game) {
  return game && game.status === 'active';
}

function renderLeaderboard(leaderboard) {
  const container = document.getElementById('leaderboard');
  container.innerHTML = '';

  if (!leaderboard.length) {
    container.innerHTML = '<div class="list-item"><div class="title">No results yet</div><div class="meta">Play games to populate the board</div></div>';
    return;
  }

  leaderboard.forEach((row, idx) => {
    const item = document.createElement('div');
    item.className = 'list-item';

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = `#${idx + 1} ${row.name}`;

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `W ${row.wins} • D ${row.draws} • L ${row.losses} • Games ${row.games}`;

    item.appendChild(title);
    item.appendChild(meta);
    container.appendChild(item);
  });
}

async function fetchGames() {
  console.log('Fetching games...');
  try {
    const res = await fetch('/games');
    const data = await res.json();
    console.log('Games data:', data);
    return data.games || [];
  } catch (err) {
    console.error('Fetch games error:', err);
    return [];
  }
}

async function fetchLeaderboard() {
  console.log('Fetching leaderboard...');
  try {
    const res = await fetch('/leaderboard');
    const data = await res.json();
    console.log('Leaderboard data:', data);
    return data.leaderboard || [];
  } catch (err) {
    console.error('Fetch leaderboard error:', err);
    return [];
  }
}

const pieceTheme = 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png';

function updateCapturedPieces(fen) {
  const pieces = fen.split(' ')[0].replace(/[/0-9]/g, '');
  const counts = {
    P: 8, N: 2, B: 2, R: 2, Q: 1, K: 1,
    p: 8, n: 2, b: 2, r: 2, q: 1, k: 1
  };
  
  for (const p of pieces) {
    counts[p]--;
  }

  const render = (containerId, type, colorPrefix) => {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    const order = ['P', 'N', 'B', 'R', 'Q'];
    order.forEach(p => {
      const key = colorPrefix === 'w' ? p.toLowerCase() : p.toUpperCase();
      const count = counts[key];
      for (let i = 0; i < count; i++) {
        const img = document.createElement('img');
        img.src = pieceTheme.replace('{piece}', (colorPrefix === 'w' ? 'w' : 'b') + p);
        img.className = 'captured-piece';
        container.appendChild(img);
      }
    });
  };

  render('captured-by-white', 'w', 'b'); // White takes Black pieces
  render('captured-by-black', 'b', 'w'); // Black takes White pieces
}

async function selectGame(gameId) {
  currentGameId = gameId;
  const games = await fetchGames();
  const game = games.find(g => g.id === gameId);
  if (!game) return;

  document.getElementById('gameTitle').textContent = `${game.players.w || 'Waiting'} vs ${game.players.b || 'Waiting'}`;
  document.getElementById('gameInfo').textContent = `${game.status} • ${game.id}`;
  if (board) {
    board.position(game.fen, false);
    updateCapturedPieces(game.fen);
  }
}

async function refresh() {
  const [games, leaderboard] = await Promise.all([fetchGames(), fetchLeaderboard()]);
  const liveGames = games.filter(isLiveGame);
  renderGames(liveGames);
  renderLeaderboard(leaderboard);

  if (!currentGameId && liveGames.length) {
    await selectGame(liveGames[0].id);
  } else if (currentGameId) {
    const current = games.find(g => g.id === currentGameId);
    if (current && board) {
      board.position(current.fen, false);
      updateCapturedPieces(current.fen);
    }
  }

  setStatus(`Live games: ${liveGames.length} • Updated ${new Date().toLocaleTimeString()}`);
}

window.addEventListener('load', () => {
  console.log('Window loaded, initializing board...');
  try {
    if (typeof Chessboard === 'undefined') {
      console.error('Chessboard.js not found!');
      setStatus('Error: Chessboard.js failed to load');
      return;
    }
    board = Chessboard('board', {
      draggable: false,
      position: 'start',
      pieceTheme: pieceTheme
    });
    console.log('Board initialized.');
    refresh();
    setInterval(refresh, 500);
  } catch (err) {
    console.error('Board init error:', err);
    setStatus('Error: ' + err.message);
  }
});
