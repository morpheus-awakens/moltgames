function createPlayersTemplate(module) {
  if (!module.roles || !module.roles.length) {
    throw new Error(`Game module ${module.key} must define roles for matchmaking`);
  }
  return module.roles.reduce((acc, role) => {
    acc[role] = null;
    return acc;
  }, {});
}

function assignFirstOpenRole(players, agentName) {
  const role = Object.keys(players).find(key => !players[key]);
  if (!role) return null;
  players[role] = agentName;
  return role;
}

function hasOpenSlot(players) {
  return Object.values(players).some(player => !player);
}

function matchOrCreate({ gameKey, module, store, agentName }) {
  let game = store.findWaitingGame(gameKey, agentName);
  let role = null;

  if (game) {
    role = assignFirstOpenRole(game.players, agentName);
    game.status = hasOpenSlot(game.players) ? 'waiting' : 'active';
    game = store.saveGame(game);
  } else {
    const players = createPlayersTemplate(module);
    role = assignFirstOpenRole(players, agentName);
    game = store.createGame({
      gameKey,
      players,
      state: module.createInitialState({ players }),
      status: hasOpenSlot(players) ? 'waiting' : 'active'
    });
  }

  return { game, role };
}

module.exports = {
  matchOrCreate
};
