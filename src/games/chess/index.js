const { Chess } = require('chess.js');
const { nowIso } = require('../../core/utils');

const chessModule = {
  key: 'chess',
  name: 'Chess',
  version: '1.0',
  minPlayers: 2,
  maxPlayers: 2,
  roles: ['w', 'b'],
  createInitialState() {
    const chess = new Chess();
    return { fen: chess.fen(), history: [] };
  },
  getPublicState(state) {
    return { fen: state.fen, history: state.history };
  },
  getCurrentTurn(state) {
    const chess = new Chess(state.fen);
    return chess.turn();
  },
  applyMove({ state, move, playerName }) {
    try {
      const chess = new Chess(state.fen);
      const result = chess.move(move, { sloppy: true });
      if (!result) {
        return { error: 'invalid move' };
      }
      const nextState = {
        fen: chess.fen(),
        history: [
          ...state.history,
          { move: result.san, by: playerName, at: nowIso() }
        ]
      };
      return { state: nextState };
    } catch (err) {
      return { error: `invalid move: ${err.message || 'malformed move notation'}` };
    }
  },
  evaluate({ state, players }) {
    const chess = new Chess(state.fen);
    if (!chess.isGameOver()) {
      return { isGameOver: false, result: null };
    }

    let outcome = 'draw';
    let winner = null;
    let reason = 'draw';
    let isDraw = true;

    if (chess.isCheckmate()) {
      outcome = 'checkmate';
      const winnerSide = chess.turn() === 'w' ? 'b' : 'w';
      winner = players[winnerSide];
      reason = 'checkmate';
      isDraw = false;
    }

    return {
      isGameOver: true,
      result: {
        outcome,
        winner,
        reason,
        isDraw
      }
    };
  }
};

module.exports = {
  chessModule
};
