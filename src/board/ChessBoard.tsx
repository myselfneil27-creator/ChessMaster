import { useState, useEffect } from 'react';
import { Chess, Move } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { getBestMove } from '../ai/ChessAI';

let audioCtx: any = null;
const playSynthSound = (type: 'move' | 'capture' | 'win' | 'fail', sfxVolume: number = 100) => {
  if (sfxVolume === 0) return;
  try {
    if (!audioCtx) { const AC = window.AudioContext || (window as any).webkitAudioContext; if (AC) audioCtx = new AC(); }
    if (audioCtx?.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const vol = sfxVolume / 100;
    
    if (type === 'move') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.5 * vol, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'capture') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(400, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.6 * vol, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'win') {
      osc.type = 'square'; osc.frequency.setValueAtTime(400, audioCtx.currentTime);
      osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.5 * vol, audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
      osc.start(); osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'fail') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, audioCtx.currentTime);
      osc.frequency.setValueAtTime(150, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.5 * vol, audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
      osc.start(); osc.stop(audioCtx.currentTime + 0.4);
    }
  } catch (e) {}
};

const safeClone = (game: any, initialFen?: string) => { 
  const clone = new Chess(initialFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const history = game.history();
  for (let i = 0; i < history.length; i++) { clone.move(history[i]); }
  return clone; 
};

const initChess = (fen?: string) => {
  try { return new Chess(fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'); } 
  catch (e) { return new Chess(); }
};

interface ChessBoardProps { 
  mode: 'ai' | 'online' | 'puzzle' | 'local'; 
  difficulty?: number; 
  initialFen?: string; 
  puzzleId?: number;
  sfxVolume?: number; 
  vibrationEnabled?: boolean; 
  onBack: () => void;
  onNextPuzzle?: () => void;
}

export const ChessBoard = ({ mode, difficulty = 3, initialFen, puzzleId, sfxVolume = 100, vibrationEnabled = true, onBack, onNextPuzzle }: ChessBoardProps) => {
  const [game, setGame] = useState(initChess(initialFen));
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{from: string, to: string} | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<{from: string, to: string} | null>(null);
  
  // NEW ANIMATION STATE: Tracks where a piece was captured to show a splash effect
  const [captureSquare, setCaptureSquare] = useState<string | null>(null);
  
  const [puzzleState, setPuzzleState] = useState<'playing' | 'failed' | 'solved'>('playing');
  const [playerTime, setPlayerTime] = useState(600);
  const [aiTime, setAiTime] = useState(600);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);

  const pieceSymbols: Record<string, string> = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };

  const triggerVibration = (type: 'move' | 'capture' | 'invalid' | 'click' | 'win' | 'fail') => {
    if (!vibrationEnabled) return;
    if (typeof window !== 'undefined' && navigator.vibrate) {
      if (type === 'move') navigator.vibrate(15); 
      else if (type === 'capture') navigator.vibrate([20, 30, 20]); 
      else if (type === 'win') navigator.vibrate([30, 50, 30, 50, 100]);
      else if (type === 'fail') navigator.vibrate([100, 50, 100]);
      else navigator.vibrate(50);
    }
  };

  useEffect(() => {
    if (isGameOver || pendingPromotion || puzzleState !== 'playing') return;
    const interval = setInterval(() => {
      if (game.turn() === 'w') setPlayerTime(t => t > 0 ? t - 1 : 0);
      else setAiTime(t => t > 0 ? t - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [game.turn(), isGameOver, pendingPromotion, puzzleState]);

  useEffect(() => {
    if (initialFen) {
      setGame(initChess(initialFen)); 
      setPuzzleState('playing');
      setLastMove(null);
      setSelectedSquare(null);
      setIsGameOver(false);
      setCaptureSquare(null);
    }
  }, [initialFen]);

  const executeMove = (moveDetails: any) => {
    try {
      const gameCopy = safeClone(game, initialFen);
      const moveResult = gameCopy.move(moveDetails);
      if (!moveResult) return null;
      
      setGame(gameCopy); 
      setLastMove({ from: moveResult.from, to: moveResult.to });
      
      // TRIGGER CAPTURE ANIMATION
      if (moveResult.captured) {
        setCaptureSquare(moveResult.to);
        setTimeout(() => setCaptureSquare(null), 300); // Clear explosion after 300ms
      }
      
      if (mode === 'puzzle') {
        if (gameCopy.isCheckmate()) {
          setPuzzleState('solved');
          playSynthSound('win', sfxVolume); triggerVibration('win');
        } else {
          setPuzzleState('failed');
          playSynthSound('fail', sfxVolume); triggerVibration('fail');
        }
        return gameCopy;
      }

      playSynthSound(moveResult.captured ? 'capture' : 'move', sfxVolume); triggerVibration(moveResult.captured ? 'capture' : 'move');
      if (gameCopy.isGameOver()) {
        setIsGameOver(true);
        if (gameCopy.isCheckmate()) setGameOverReason(`CHECKMATE! ${gameCopy.turn() === 'w' ? 'Black' : 'White'} Wins`);
        else setGameOverReason('DRAW / STALEMATE');
      }
      return gameCopy;
    } catch (e) { return null; }
  };

  useEffect(() => {
    if (mode === 'ai' && game.turn() === 'b' && !isGameOver && !pendingPromotion) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const aiMove = getBestMove(new Chess(game.fen()), difficulty);
        if (aiMove) executeMove(aiMove);
        setIsAiThinking(false);
      }, 400); // Slightly longer delay so human can see the piece land before AI moves
      return () => clearTimeout(timer);
    }
  }, [game.fen(), mode, isGameOver, pendingPromotion, difficulty]);

  const onSquareClick = (square: string) => {
    if (isAiThinking || isGameOver || pendingPromotion || puzzleState !== 'playing' || (mode === 'online' && game.turn() === 'b')) return;

    if (selectedSquare) {
      if (legalMoves.includes(square)) {
        const moves = game.moves({ square: selectedSquare as any, verbose: true }) as Move[];
        if (moves.find(m => m.to === square)?.promotion) { setPendingPromotion({ from: selectedSquare, to: square }); return; }
        const updated = executeMove({ from: selectedSquare, to: square });
        if (updated) { setSelectedSquare(null); setLegalMoves([]); return; }
      }
    }
    const piece = game.get(square as any);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square); setLegalMoves((game.moves({ square: square as any, verbose: true }) as Move[]).map(m => m.to));
    } else { setSelectedSquare(null); setLegalMoves([]); }
  };

  const handleRetryPuzzle = () => {
    triggerVibration('click');
    if (initialFen) setGame(initChess(initialFen));
    setPuzzleState('playing');
    setLastMove(null);
    setCaptureSquare(null);
  };

  const handleUndo = () => {
    if (game.history().length < 2 || isAiThinking || isGameOver || puzzleState !== 'playing') return;
    triggerVibration('click');
    const gameCopy = safeClone(game, initialFen); gameCopy.undo(); 
    if (mode === 'ai') gameCopy.undo(); 
    setGame(gameCopy); setLastMove(null); setSelectedSquare(null); setLegalMoves([]); setCaptureSquare(null);
  };

  const renderPieces = () => {
    const board = game.board(); const pieces = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const isKingInCheck = game.inCheck() && piece.type === 'k' && piece.color === game.turn();
          const square = `${String.fromCharCode(97 + c)}${8 - r}`;
          const isMoving = lastMove?.to === square;

          pieces.push(
            <motion.div key={`piece-${piece.type}-${piece.color}-${square}`} 
              initial={isMoving ? { scale: 1.5, opacity: 0 } : false}
              animate={{ left: `${c * 12.5}%`, top: `${r * 12.5}%`, scale: 1, opacity: 1 }} 
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`absolute w-[12.5%] h-[12.5%] flex justify-center items-center text-4xl sm:text-5xl pointer-events-none z-20 
              ${piece.color === 'w' ? 'text-white drop-shadow-md' : 'text-black'} 
              ${isKingInCheck ? 'bg-red-500/80 rounded-full shadow-[0_0_30px_rgba(239,68,68,1)] animate-pulse' : ''}`}>
              {pieceSymbols[piece.type]}
            </motion.div>
          );
        }
      }
    }
    return pieces;
  };

  const renderCaptureExplosions = () => {
    if (!captureSquare) return null;
    const c = captureSquare.charCodeAt(0) - 97;
    const r = 8 - parseInt(captureSquare[1]);
    return (
      <motion.div initial={{ scale: 0, opacity: 1 }} animate={{ scale: 2, opacity: 0 }} transition={{ duration: 0.3 }}
        className="absolute w-[12.5%] h-[12.5%] bg-red-500 rounded-full z-10 pointer-events-none"
        style={{ left: `${c * 12.5}%`, top: `${r * 12.5}%` }}
      />
    );
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-transparent p-2 text-white overflow-hidden font-sans">
      <div className="w-full max-w-[450px] flex flex-col gap-3 z-10">
        
        <div className="flex justify-between items-center px-1">
          <button onClick={() => { triggerVibration('click'); onBack(); }} className="text-gray-400 font-bold text-sm hover:text-white flex items-center gap-1 active:scale-95 transition-all">
            ← MENU
          </button>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {mode === 'ai' ? `VS BOT` : mode === 'puzzle' ? `LEVEL ${puzzleId}` : 'MULTIPLAYER'}
          </span>
        </div>

        {/* HUD */}
        <div className="flex justify-between items-center p-3 bg-slate-800/80 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg ${mode === 'ai' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : mode === 'puzzle' ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-gradient-to-br from-red-500 to-pink-500'}`}>
              {mode === 'ai' ? '🤖' : mode === 'puzzle' ? '🧩' : '👤'}
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-gray-200">{mode === 'ai' ? 'Stockfish AI' : mode === 'puzzle' ? 'Target: Checkmate' : 'Player Two'}</span>
              <span className="text-xs text-purple-400">{isAiThinking ? 'Thinking...' : mode === 'puzzle' ? 'Find the best move' : 'Waiting'}</span>
            </div>
          </div>
        </div>

        {/* CHESSBOARD */}
        <div className="relative w-full aspect-square bg-[#739552] rounded-lg shadow-2xl border-4 border-[#262421] overflow-hidden">
          <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
            {Array.from({ length: 64 }).map((_, i) => {
              const r = Math.floor(i / 8); const c = i % 8; const square = `${String.fromCharCode(97 + c)}${8 - r}`;
              return (
                <div key={square} onClick={() => onSquareClick(square)} className={`relative w-full h-full ${(r + c) % 2 !== 0 ? 'bg-[#739552]' : 'bg-[#ebecd0]'} ${selectedSquare === square ? 'after:absolute after:inset-0 after:bg-yellow-200/50' : ''}`}>
                  {legalMoves.includes(square) && <div className="absolute inset-0 m-auto w-3 h-3 bg-black/15 rounded-full" />}
                </div>
              );
            })}
          </div>
          {renderCaptureExplosions()}
          <div className="absolute inset-0 pointer-events-none">{renderPieces()}</div>
          
          <AnimatePresence>
            {/* NORMAL GAME OVER WITH DRAMATIC ANIMATION */}
            {isGameOver && mode !== 'puzzle' && (
              <motion.div initial={{ opacity: 0, scale: 0.2, rotate: -10 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 15 }} className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                <h2 className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] mb-2">GAME OVER</h2>
                <p className="text-2xl text-yellow-400 font-bold drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">{gameOverReason}</p>
              </motion.div>
            )}

            {/* PUZZLE FAILED */}
            {puzzleState === 'failed' && (
              <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 z-40 bg-red-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 shadow-inner">
                <h2 className="text-5xl font-black text-white drop-shadow-2xl mb-2">FAILED! ❌</h2>
                <p className="text-lg text-red-200 font-bold mb-6">That was not a Checkmate.</p>
                <div className="flex gap-3 w-full">
                  <button onClick={onBack} className="flex-1 py-3 bg-white/10 text-white font-bold rounded-xl active:scale-95 transition-all">EXIT</button>
                  <button onClick={handleRetryPuzzle} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-red-500/50">↻ RETRY</button>
                </div>
              </motion.div>
            )}

            {/* PUZZLE SOLVED */}
            {puzzleState === 'solved' && (
              <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 z-40 bg-green-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 shadow-inner">
                <h2 className="text-4xl font-black text-white drop-shadow-2xl mb-2">SOLVED! 🎉</h2>
                <p className="text-lg text-green-200 font-bold mb-6">Brilliant move!</p>
                <div className="flex gap-3 w-full">
                  <button onClick={onBack} className="flex-1 py-3 bg-white/10 text-white font-bold rounded-xl active:scale-95 transition-all">EXIT</button>
                  {onNextPuzzle && (
                    <button onClick={onNextPuzzle} className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-green-500/50">NEXT LEVEL ➡️</button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM HUD */}
        <div className="flex justify-between items-center p-3 bg-slate-800/80 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl mt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-xl shadow-lg">👤</div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-gray-200">Player One</span>
            </div>
          </div>
          <div className="flex gap-2">
            {mode === 'puzzle' ? (
              <button onClick={handleRetryPuzzle} className="bg-white/10 px-4 py-2 rounded-lg font-bold text-sm active:scale-95">↻ Retry Level</button>
            ) : (
              <button onClick={handleUndo} className="bg-white/10 px-4 py-2 rounded-lg font-bold text-sm active:scale-95">↩ Undo</button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
