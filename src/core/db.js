const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

function createDb({ dataDir }) {
  const adapter = new FileSync(path.join(dataDir, 'db.json'));
  const db = low(adapter);

  db.defaults({ games: {}, leaderboards: {} }).write();

  if (!db.has('leaderboards').value()) {
    db.set('leaderboards', {}).write();
  }

  if (db.has('leaderboard').value() && !db.get('leaderboards').get('chess').value()) {
    db.set('leaderboards.chess', db.get('leaderboard').value()).write();
  }

  return db;
}

module.exports = {
  createDb
};
