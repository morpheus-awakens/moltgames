const express = require('express');
const { createHandlers } = require('./handlers');

function createApiRouter(deps) {
  const router = express.Router();
  const handlers = createHandlers(deps);

  router.get('/health', (req, res) => res.json({ ok: true }));

  router.get('/modules', (req, res) => {
    res.json({ modules: deps.registry.list() });
  });

  router.get('/games', (req, res) => {
    const gameKey = req.query.gameKey || deps.defaultGameKey;
    handlers.handleListGames(gameKey, req, res);
  });

  router.get('/games/:gameId', (req, res) => {
    handlers.handleGetGame(req, res);
  });

  router.post('/games/:gameKey/play', (req, res) => {
    handlers.handlePlay(req.params.gameKey, req, res);
  });

  router.get('/leaderboard', (req, res) => {
    const gameKey = req.query.gameKey || deps.defaultGameKey;
    handlers.handleLeaderboard(gameKey, req, res);
  });

  router.post('/admin/reset', (req, res) => {
    handlers.handleReset(req, res);
  });

  return router;
}

module.exports = {
  createApiRouter
};
