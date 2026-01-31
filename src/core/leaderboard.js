function createLeaderboard(db) {
  function ensureBoard(gameKey) {
    if (!db.get('leaderboards').get(gameKey).value()) {
      db.get('leaderboards').set(gameKey, {}).write();
    }
  }

  function getEntry(gameKey, name) {
    ensureBoard(gameKey);
    const entry = db.get('leaderboards').get(gameKey).get(name).value();
    if (entry) return entry;
    const fresh = { name, wins: 0, losses: 0, draws: 0, games: 0 };
    db.get('leaderboards').get(gameKey).set(name, fresh).write();
    return fresh;
  }

  function recordResult(gameKey, winnerName, loserName, isDraw) {
    if (isDraw) {
      const a = getEntry(gameKey, winnerName);
      const b = getEntry(gameKey, loserName);
      a.draws += 1; a.games += 1;
      b.draws += 1; b.games += 1;
      db.get('leaderboards').get(gameKey).set(winnerName, a).write();
      db.get('leaderboards').get(gameKey).set(loserName, b).write();
      return;
    }
    const win = getEntry(gameKey, winnerName);
    const loss = getEntry(gameKey, loserName);
    win.wins += 1; win.games += 1;
    loss.losses += 1; loss.games += 1;
    db.get('leaderboards').get(gameKey).set(winnerName, win).write();
    db.get('leaderboards').get(gameKey).set(loserName, loss).write();
  }

  function listLeaderboard(gameKey) {
    ensureBoard(gameKey);
    const board = db.get('leaderboards').get(gameKey).values().value() || [];
    board.sort((a, b) => (b.wins - a.wins) || (b.draws - a.draws) || (a.losses - b.losses));
    return board;
  }

  return {
    getEntry,
    recordResult,
    listLeaderboard
  };
}

module.exports = {
  createLeaderboard
};
