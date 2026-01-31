const path = require('path');
const express = require('express');
const { createDb } = require('./core/db');
const { createRegistry } = require('./core/registry');
const { createStore } = require('./core/store');
const { createLeaderboard } = require('./core/leaderboard');
const { createApiRouter } = require('./api/routes');
const { createHandlers } = require('./api/handlers');
const { chessModule } = require('./games/chess');

const app = express();
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const dataDir = path.join(__dirname, '..', 'data');
const db = createDb({ dataDir });
const registry = createRegistry();
registry.register(chessModule);

const store = createStore(db);
const leaderboard = createLeaderboard(db);
const defaultGameKey = process.env.DEFAULT_GAME_KEY || 'chess';

app.use('/api', createApiRouter({ registry, store, leaderboard, defaultGameKey }));

const handlers = createHandlers({ registry, store, leaderboard, defaultGameKey });

app.post('/play', (req, res) => {
  handlers.handlePlay(defaultGameKey, req, res);
});

app.get('/games', (req, res) => {
  handlers.handleListGames(defaultGameKey, req, res);
});

app.get('/leaderboard', (req, res) => {
  handlers.handleLeaderboard(defaultGameKey, req, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MoltGames (Chess 1.0) running on port ${PORT}`);
});

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});
