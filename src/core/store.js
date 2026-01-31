const { nowIso, generateId } = require('./utils');

function createStore(db) {
  function createGame({ gameKey, players, state, status }) {
    const id = generateId('game');
    const game = {
      id,
      gameKey,
      status,
      players,
      state,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      result: null
    };
    db.get('games').set(id, game).write();
    return game;
  }

  function getGame(id) {
    return db.get('games').get(id).value();
  }

  function saveGame(game) {
    const updated = { ...game, updatedAt: nowIso() };
    db.get('games').set(game.id, updated).write();
    return updated;
  }

  function listGames({ gameKey } = {}) {
    const games = db.get('games').values().value() || [];
    if (!gameKey) return games;
    return games.filter(game => game.gameKey === gameKey || (!game.gameKey && gameKey === 'chess'));
  }

  function findWaitingGame(gameKey, excludeName) {
    const games = db.get('games').values().value() || [];
    return games.find(game => {
      if ((game.gameKey || 'chess') !== gameKey) return false;
      if (game.status !== 'waiting') return false;
      const players = Object.values(game.players || {});
      if (players.includes(excludeName)) return false;
      return players.some(player => !player);
    });
  }

  function findActiveGameForAgent(agentName) {
    const games = db.get('games').values().value() || [];
    return games.find(game => {
      if (game.status === 'finished') return false;
      const players = Object.values(game.players || {});
      return players.includes(agentName);
    });
  }

  function resetGames() {
    db.set('games', {}).write();
    return { cleared: true };
  }

  return {
    createGame,
    getGame,
    saveGame,
    listGames,
    findWaitingGame,
    findActiveGameForAgent,
    resetGames
  };
}

module.exports = {
  createStore
};
