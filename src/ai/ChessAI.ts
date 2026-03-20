import { Chess } from 'chess.js';

// Piece values
const pieceValues: Record<string, number> = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };

// Positional bonuses: Encourages AI to move toward the center and prevents repetitive edge loops
const centerBonus = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  1,  1,  1,  1,  1,  1,  0],
  [ 0,  1,  2,  3,  3,  2,  1,  0],
  [ 0,  1,  3,  4,  4,  3,  1,  0],
  [ 0,  1,  3,  4,  4,  3,  1,  0],
  [ 0,  1,  2,  3,  3,  2,  1,  0],
  [ 0,  1,  1,  1,  1,  1,  1,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0]
];

export const evaluateBoard = (game: Chess): number => {
  let totalEvaluation = 0;
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        // Add piece value + positional center bonus
        let val = pieceValues[piece.type] + centerBonus[r][c];
        totalEvaluation += piece.color === 'w' ? val : -val;
      }
    }
  }
  return totalEvaluation;
};

export const minimax = (game: Chess, depth: number, alpha: number, beta: number, isMaximizing: boolean): number => {
  if (depth === 0 || game.isGameOver()) return evaluateBoard(game);
  const moves = game.moves();
  
  if (isMaximizing) {
    let bestVal = -Infinity;
    for (let i = 0; i < moves.length; i++) {
      game.move(moves[i]);
      bestVal = Math.max(bestVal, minimax(game, depth - 1, alpha, beta, !isMaximizing));
      game.undo();
      alpha = Math.max(alpha, bestVal);
      if (beta <= alpha) break;
    }
    return bestVal;
  } else {
    let bestVal = Infinity;
    for (let i = 0; i < moves.length; i++) {
      game.move(moves[i]);
      bestVal = Math.min(bestVal, minimax(game, depth - 1, alpha, beta, !isMaximizing));
      game.undo();
      beta = Math.min(beta, bestVal);
      if (beta <= alpha) break;
    }
    return bestVal;
  }
};

export const getBestMove = (game: Chess, difficulty: number = 3): string | null => {
  let moves = game.moves();
  if (moves.length === 0) return null;

  // DIFFICULTY HANDICAPS: Force the AI to make random "human" mistakes on lower levels
  // Easy: 50% chance to play a completely random move
  if (difficulty === 1 && Math.random() < 0.5) return moves[Math.floor(Math.random() * moves.length)];
  // Medium: 20% chance to play a random move
  if (difficulty === 2 && Math.random() < 0.2) return moves[Math.floor(Math.random() * moves.length)];

  let searchDepth = difficulty >= 4 ? 3 : difficulty; // Cap depth at 3 for mobile performance

  let bestMove = null;
  let bestValue = game.turn() === 'w' ? -Infinity : Infinity;
  
  // SHUFFLE MOVES: This permanently fixes the "left-to-right" infinite loop bug
  moves.sort(() => Math.random() - 0.5);

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    game.move(move);
    const boardValue = minimax(game, searchDepth - 1, -Infinity, Infinity, game.turn() === 'w');
    game.undo();

    if (game.turn() === 'w') {
      if (boardValue > bestValue) { bestValue = boardValue; bestMove = move; }
    } else {
      if (boardValue < bestValue) { bestValue = boardValue; bestMove = move; }
    }
  }
  return bestMove || moves[0];
};
