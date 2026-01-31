const { matchOrCreate } = require('../core/matchmaking');

function createHandlers({ registry, store, leaderboard, defaultGameKey }) {
  function resolveModule(gameKey) {
    const module = registry.get(gameKey);
    if (!module) {
      return { error: `unknown game module: ${gameKey}` };
    }
    return { module };
  }

  function normalizeLegacyGame(game, gameKey) {
    if (!game) return game;
    if (game.gameKey && game.state) return game;
    if (!game.state && game.fen) {
      return {
        ...game,
        gameKey: game.gameKey || gameKey,
        state: {
          fen: game.fen,
          history: game.history || []
        }
      };
    }
    return { ...game, gameKey: game.gameKey || gameKey };
  }

  function buildGameView(game) {
    const module = registry.get(game.gameKey || defaultGameKey);
    const state = module ? module.getPublicState(game.state || {}) : game.state;
    const view = {
      id: game.id,
      gameKey: game.gameKey || defaultGameKey,
      status: game.status,
      players: game.players,
      state,
      updatedAt: game.updatedAt,
      result: game.result
    };

    if (state && state.fen) view.fen = state.fen;
    if (state && state.history) view.history = state.history;
    return view;
  }

  function handlePlay(gameKey, req, res) {
    const { gameId, move, agentName } = req.body || {};

    if (!agentName || typeof agentName !== 'string') {
      return res.status(400).json({ error: 'agentName is required' });
    }

    const { module, error } = resolveModule(gameKey);
    if (error) return res.status(404).json({ error });

    if (!gameId) {
      // Check if agent already has an active game
      const existingGame = store.findActiveGameForAgent(agentName);
      if (existingGame) {
        const role = Object.keys(existingGame.players || {}).find(key => existingGame.players[key] === agentName);
        return res.json({
          matched: true,
          gameId: existingGame.id,
          gameKey: existingGame.gameKey || gameKey,
          role,
          status: existingGame.status,
          players: existingGame.players,
          state: module.getPublicState(existingGame.state),
          fen: existingGame.state && existingGame.state.fen,
          existing: true
        });
      }

      const { game, role } = matchOrCreate({
        gameKey,
        module,
        store,
        agentName
      });

      return res.json({
        matched: true,
        gameId: game.id,
        gameKey,
        role,
        status: game.status,
        players: game.players,
        state: module.getPublicState(game.state),
        fen: game.state && game.state.fen
      });
    }

    let game = normalizeLegacyGame(store.getGame(gameId), gameKey);
    if (!game) return res.status(404).json({ error: 'game not found' });

    if (!move) {
      return res.json(buildGameView(game));
    }

    if (game.status === 'finished') {
      return res.status(400).json({ error: 'game already finished', result: game.result });
    }

    const role = Object.keys(game.players || {}).find(key => game.players[key] === agentName);
    if (!role) return res.status(400).json({ error: 'agent is not part of this game' });

    if (game.status === 'waiting') {
      return res.status(400).json({ error: 'waiting for opponent' });
    }

    const turn = module.getCurrentTurn(game.state);
    if (turn !== role) {
      return res.status(400).json({ error: 'not your turn', turn });
    }

    const moveResult = module.applyMove({
      state: game.state,
      move,
      playerRole: role,
      playerName: agentName,
      players: game.players
    });

    if (moveResult.error) return res.status(400).json({ error: moveResult.error });

    game.state = moveResult.state;

    const evaluation = module.evaluate({ state: game.state, players: game.players });
    if (evaluation.isGameOver) {
      game.status = 'finished';
      game.result = evaluation.result;

      if (evaluation.result) {
        if (evaluation.result.isDraw) {
          const a = game.players[module.roles[0]];
          const b = game.players[module.roles[1]];
          if (a && b) leaderboard.recordResult(gameKey, a, b, true);
        } else if (evaluation.result.winner) {
          const winner = evaluation.result.winner;
          const winnerRole = Object.keys(game.players).find(role => game.players[role] === winner);
          const loserRole = module.roles.find(r => r !== winnerRole);
          const loser = loserRole ? game.players[loserRole] : null;
          if (loser) leaderboard.recordResult(gameKey, winner, loser, false);
        }
      }
    } else {
      game.status = 'active';
    }

    game = store.saveGame(game);
    return res.json(buildGameView(game));
  }

  function handleListGames(gameKey, req, res) {
    const games = store.listGames({ gameKey });
    const normalized = games.map(game => buildGameView(normalizeLegacyGame(game, gameKey)));
    res.json({ games: normalized });
  }

  function handleGetGame(req, res) {
    const game = store.getGame(req.params.gameId);
    if (!game) return res.status(404).json({ error: 'game not found' });
    const normalized = normalizeLegacyGame(game, game.gameKey || defaultGameKey);
    return res.json(buildGameView(normalized));
  }

  function handleLeaderboard(gameKey, req, res) {
    const board = leaderboard.listLeaderboard(gameKey);
    res.json({ leaderboard: board });
  }

  function handleReset(req, res) {
    const result = store.resetGames();
    res.json({ reset: true, ...result });
  }

  return {
    handlePlay,
    handleListGames,
    handleGetGame,
    handleLeaderboard,
    handleReset
  };
}

module.exports = {
  createHandlers
};
