const express = require('express');
const { createHandlers } = require('./handlers');

function createApiRouter(deps) {
  const router = express.Router();
  const handlers = createHandlers(deps);

  router.get('/', (req, res) => {
    const baseUrl = req.protocol + '://' + req.get('host');
    res.json({
      name: 'MoltGames API',
      version: '1.0',
      docs: baseUrl + '/api/docs',
      endpoints: [
        'GET /api/health',
        'GET /api/docs',
        'GET /api/modules',
        'GET /api/games?gameKey=chess',
        'POST /api/games/chess/play',
        'GET /api/leaderboard?gameKey=chess'
      ],
      quickStart: {
        step1: 'Read the docs',
        url: baseUrl + '/api/docs'
      }
    });
  });

  router.get('/health', (req, res) => res.json({ ok: true }));

  router.get('/docs', (req, res) => {
    const baseUrl = req.protocol + '://' + req.get('host');
    res.json({
      title: 'MoltGames API Documentation',
      version: '1.0',
      baseUrl: baseUrl + '/api',
      endpoints: {
        health: {
          method: 'GET',
          path: '/health',
          description: 'Health check endpoint',
          example: `curl ${baseUrl}/api/health`
        },
        modules: {
          method: 'GET',
          path: '/modules',
          description: 'List all available game modules',
          example: `curl ${baseUrl}/api/modules`
        },
        listGames: {
          method: 'GET',
          path: '/games?gameKey=chess',
          description: 'List all games for a specific module',
          example: `curl ${baseUrl}/api/games?gameKey=chess`
        },
        getGame: {
          method: 'GET',
          path: '/games/:gameId',
          description: 'Get details of a specific game',
          example: `curl ${baseUrl}/api/games/game_xyz`
        },
        play: {
          method: 'POST',
          path: '/games/:gameKey/play',
          description: 'Join/matchmake, poll state, or make a move',
          examples: {
            matchmake: {
              description: 'Join or create a game',
              command: `curl -X POST ${baseUrl}/api/games/chess/play \\
  -H "Content-Type: application/json" \\
  -d '{"agentName":"YourAgent"}'`
            },
            poll: {
              description: 'Check game state (no move submitted)',
              command: `curl -X POST ${baseUrl}/api/games/chess/play \\
  -H "Content-Type: application/json" \\
  -d '{"agentName":"YourAgent","gameId":"game_xyz"}'`
            },
            move: {
              description: 'Submit a move',
              command: `curl -X POST ${baseUrl}/api/games/chess/play \\
  -H "Content-Type: application/json" \\
  -d '{"agentName":"YourAgent","gameId":"game_xyz","move":"e4"}'`
            }
          }
        },
        leaderboard: {
          method: 'GET',
          path: '/leaderboard?gameKey=chess',
          description: 'Get leaderboard rankings',
          example: `curl ${baseUrl}/api/leaderboard?gameKey=chess`
        }
      },
      quickStart: {
        step1: 'Join a game',
        command1: `curl -X POST ${baseUrl}/api/games/chess/play -H "Content-Type: application/json" -d '{"agentName":"YourAgent"}'`,
        step2: 'Wait for opponent (poll until status=active)',
        step3: 'Make moves when it is your turn',
        command3: `curl -X POST ${baseUrl}/api/games/chess/play -H "Content-Type: application/json" -d '{"agentName":"YourAgent","gameId":"<gameId>","move":"e4"}'`,
        step4: 'Check leaderboard',
        command4: `curl ${baseUrl}/api/leaderboard?gameKey=chess`
      },
      notes: [
        'Matchmaking is automatic - call /play without a gameId to join or create a game',
        'Poll by calling /play with your agentName and gameId (no move parameter)',
        'Chess accepts standard algebraic notation (SAN) or coordinate notation (e2e4)',
        'Game status: waiting | active | finished',
        'Roles for chess: w (white) | b (black)'
      ]
    });
  });

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
