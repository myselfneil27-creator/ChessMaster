import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChessBoard } from './board/ChessBoard';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'ai' | 'online' | 'puzzle' | 'local'>('menu');
  
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [showMultiplayerOptions, setShowMultiplayerOptions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showPuzzles, setShowPuzzles] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const [aiDifficulty, setAiDifficulty] = useState(3);
  const [currentPuzzleId, setCurrentPuzzleId] = useState<number | null>(null);
  const [puzzleFen, setPuzzleFen] = useState<string | undefined>(undefined);

  const [brightness, setBrightness] = useState(100);
  const [sfxVolume, setSfxVolume] = useState(100);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const puzzles = [
    { id: 1, title: 'Back Rank Mate', fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1' }, 
    { id: 2, title: 'Kiss of Death', fen: 'k7/2K5/8/8/8/8/8/1Q6 w - - 0 1' }, 
    { id: 3, title: 'Scholar\'s Trap', fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1' }, 
    { id: 4, title: 'Smothered Mate', fen: '6rk/6pp/7N/8/8/8/8/6K1 w - - 0 1' }, 
    { id: 5, title: 'Corner Box', fen: '4k3/8/4K3/8/8/8/8/R7 w - - 0 1' },
    { id: 6, title: 'Arabian Mate', fen: '7k/6p1/5N2/8/8/8/8/R6K w - - 0 1' },
    { id: 7, title: 'Fool\'s Mate', fen: 'rnbqkbnr/ppppp2p/5p2/6p1/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1' },
    { id: 8, title: 'Battery Power', fen: '4r1k1/5ppp/8/8/8/8/8/Q3R1K1 w - - 0 1' },
    { id: 9, title: 'Diagonal Snipe', fen: 'r1bqkb1r/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1' },
    { id: 10, title: 'Queen Sacrifice', fen: '1r5k/2p3pp/8/8/8/8/8/Q5RK w - - 0 1' } 
  ];

  const handleNextPuzzle = () => {
    const nextPuzzle = puzzles.find(p => p.id === (currentPuzzleId || 0) + 1);
    if (nextPuzzle) {
      setPuzzleFen(nextPuzzle.fen);
      setCurrentPuzzleId(nextPuzzle.id);
    } else {
      alert("Congratulations! You completed all current puzzles!");
      setCurrentScreen('menu');
    }
  };

  if (currentScreen !== 'menu') {
    return (
      <div style={{ filter: `brightness(${brightness}%)` }} className="w-full min-h-screen bg-[#161512]">
        <ChessBoard 
          mode={currentScreen} 
          difficulty={aiDifficulty} 
          initialFen={puzzleFen} 
          puzzleId={currentPuzzleId || undefined}
          sfxVolume={sfxVolume} 
          vibrationEnabled={vibrationEnabled} 
          onBack={() => setCurrentScreen('menu')} 
          onNextPuzzle={currentScreen === 'puzzle' ? handleNextPuzzle : undefined}
        />
      </div>
    );
  }

  const startAiGame = (level: number) => { setAiDifficulty(level); setPuzzleFen(undefined); setCurrentPuzzleId(null); setShowDifficulty(false); setCurrentScreen('ai'); };
  const startLocalGame = () => { setPuzzleFen(undefined); setCurrentPuzzleId(null); setShowMultiplayerOptions(false); setCurrentScreen('local'); };
  const startPuzzle = (id: number, fen: string) => { setCurrentPuzzleId(id); setPuzzleFen(fen); setShowPuzzles(false); setCurrentScreen('puzzle'); };

  const startOnlineMatch = () => { 
    setShowMultiplayerOptions(false);
    setIsSearchingOnline(true); 
    setTimeout(() => { setIsSearchingOnline(false); setPuzzleFen(undefined); setCurrentScreen('online'); }, 2500); 
  };

  const confirmExitGame = () => {
    try { window.close(); } catch (e) {}
    document.body.innerHTML = '<div style="display:flex;height:100vh;width:100vw;background:#0f172a;color:#fff;align-items:center;justify-content:center;font-family:sans-serif;flex-direction:column;gap:10px;"><h2 style="font-size:2rem;font-weight:bold;">Game Closed</h2><p style="color:#94a3b8;">You can now close this tab.</p></div>';
  };

  return (
    <div style={{ filter: `brightness(${brightness}%)` }} className="flex flex-col items-center justify-start w-full min-h-screen bg-[#F8FAFC] text-slate-800 p-6 font-sans select-none overflow-hidden relative transition-all duration-300">
      
      <div className="w-full max-w-[400px] flex justify-between items-center mb-8">
        <button onClick={() => setShowExitConfirm(true)} className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-lg text-slate-600 hover:text-red-500 transition-colors active:scale-90 z-10">✖</button>
        <div className="flex gap-3">
          <button onClick={() => setShowTutorial(true)} className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-lg text-slate-600 hover:text-indigo-600 transition-colors active:scale-90 z-10">❓</button>
          <button onClick={() => setShowSettings(true)} className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-lg text-slate-600 hover:text-indigo-600 transition-colors active:scale-90 z-10">⚙️</button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-[400px] flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-3">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 15, delay: 0.2 }} className="w-24 h-24 bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] rounded-3xl flex items-center justify-center text-6xl shadow-xl shadow-indigo-500/30 text-white">♞</motion.div>
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tighter mt-2 text-slate-900">GRANDMASTER</h1>
            <p className="text-indigo-500 font-bold tracking-widest text-xs uppercase mt-1">Mobile Edition</p>
          </div>
        </div>

        <div className="w-full flex flex-col gap-4">
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowDifficulty(true)} className="w-full bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-slate-100 transition-all hover:border-indigo-200">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl">🤖</div>
            <div className="flex flex-col items-start"><span className="font-bold text-lg text-slate-800">Single Player</span><span className="text-xs text-slate-500 font-medium">Challenge the AI Bot</span></div>
          </motion.button>

          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowMultiplayerOptions(true)} className="w-full bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-slate-100 transition-all hover:border-blue-200">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">🌍</div>
            <div className="flex flex-col items-start"><span className="font-bold text-lg text-slate-800">Multiplayer</span><span className="text-xs text-slate-500 font-medium">Local & Online Modes</span></div>
          </motion.button>

          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowPuzzles(true)} className="w-full bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-slate-100 transition-all hover:border-orange-200">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl">🧩</div>
            <div className="flex flex-col items-start"><span className="font-bold text-lg text-slate-800">Puzzles</span><span className="text-xs text-slate-500 font-medium">Train your tactics</span></div>
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {/* MULTIPLAYER OPTIONS */}
        {showMultiplayerOptions && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-[320px] rounded-3xl p-6 shadow-2xl flex flex-col gap-3">
              <h3 className="text-xl font-black text-center text-slate-800 mb-2">Multiplayer Mode</h3>
              <button onClick={startLocalGame} className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-xl active:scale-95 transition-all border border-red-100 flex flex-col items-center">
                <span className="text-lg">👤 Offline Pass & Play</span><span className="text-xs font-normal opacity-80 mt-1">Play together on this device</span>
              </button>
              <button disabled className="w-full py-4 bg-slate-50 text-slate-400 font-bold rounded-xl border border-slate-100 flex flex-col items-center opacity-60">
                <span className="text-lg">🌐 Online Matchmaking</span><span className="text-xs font-normal mt-1 uppercase tracking-widest">Coming Soon</span>
              </button>
              <button onClick={() => setShowMultiplayerOptions(false)} className="mt-3 text-slate-400 font-bold text-sm tracking-widest hover:text-slate-700">CANCEL</button>
            </motion.div>
          </motion.div>
        )}

        {/* EXIT CONFIRMATION */}
        {showExitConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-[320px] rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-center">
              <div className="text-5xl mb-2">🚪</div>
              <h3 className="text-2xl font-black text-slate-800">Exit Game?</h3>
              <p className="text-sm text-slate-500 font-medium">Are you sure you want to quit?</p>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl active:scale-95 transition-all">CANCEL</button>
                <button onClick={confirmExitGame} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-red-500/30">YES</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* PUZZLES LIST */}
        {showPuzzles && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-[320px] rounded-3xl p-5 shadow-2xl flex flex-col gap-3 text-center max-h-[80vh]">
              <div className="text-4xl">🧩</div>
              <div><h3 className="text-xl font-black text-slate-800">Tactics Training</h3><p className="text-xs text-slate-500 font-medium mb-2">Find the Checkmate in 1 move!</p></div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 border-y border-slate-100 py-2">
                {puzzles.map((p) => (
                  <button key={p.id} onClick={() => startPuzzle(p.id, p.fen)} className="w-full py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold rounded-xl active:scale-95 transition-all border border-orange-100 flex justify-between px-4 items-center shadow-sm">
                    <span>Level {p.id}</span><span className="text-xs opacity-70">{p.title}</span>
                  </button>
                ))}
                <div className="w-full py-4 bg-slate-50 text-slate-400 font-bold rounded-xl border border-slate-100 mt-4 opacity-70"><span className="text-sm">Levels 11+ Coming Soon...</span></div>
              </div>
              <button onClick={() => setShowPuzzles(false)} className="mt-1 text-slate-400 font-bold text-sm tracking-widest hover:text-slate-700">BACK</button>
            </motion.div>
          </motion.div>
        )}

        {/* RESTORED: DIFFICULTY MODAL */}
        {showDifficulty && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-[320px] rounded-3xl p-6 shadow-2xl flex flex-col gap-3">
              <h3 className="text-xl font-black text-center text-slate-800 mb-2">Select AI Level</h3>
              <button onClick={() => startAiGame(1)} className="w-full py-3 bg-green-100 text-green-700 font-bold rounded-xl active:scale-95 transition-all">Easy (High Blunders)</button>
              <button onClick={() => startAiGame(2)} className="w-full py-3 bg-blue-100 text-blue-700 font-bold rounded-xl active:scale-95 transition-all">Medium (Casual)</button>
              <button onClick={() => startAiGame(3)} className="w-full py-3 bg-orange-100 text-orange-700 font-bold rounded-xl active:scale-95 transition-all">Hard (Challenging)</button>
              <button onClick={() => startAiGame(4)} className="w-full py-3 bg-red-100 text-red-700 font-bold rounded-xl active:scale-95 transition-all">Master (No Mistakes)</button>
              <button onClick={() => setShowDifficulty(false)} className="mt-2 text-slate-400 font-bold text-sm tracking-widest hover:text-slate-700">CANCEL</button>
            </motion.div>
          </motion.div>
        )}

        {/* RESTORED: SETTINGS MODAL */}
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end justify-center">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full max-w-[450px] rounded-t-3xl p-6 shadow-2xl pb-10">
              <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black text-slate-800">Settings</h3><button onClick={() => setShowSettings(false)} className="w-8 h-8 bg-slate-100 rounded-full font-bold text-slate-500">✕</button></div>
              <div className="space-y-4">
                <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl"><div className="flex justify-between font-bold text-slate-700"><span>☀️ Brightness</span> <span>{brightness}%</span></div><input type="range" min="30" max="100" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full accent-indigo-600" /></div>
                <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl"><div className="flex justify-between font-bold text-slate-700"><span>🔊 SFX Volume</span> <span>{sfxVolume}%</span></div><input type="range" min="0" max="100" value={sfxVolume} onChange={(e) => setSfxVolume(Number(e.target.value))} className="w-full accent-indigo-600" /></div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl"><span className="font-bold text-slate-700">📳 Vibration</span><input type="checkbox" checked={vibrationEnabled} onChange={(e) => setVibrationEnabled(e.target.checked)} className="w-6 h-6 accent-indigo-600" /></div>
                <div className="flex justify-between items-center p-4 bg-indigo-50 border border-indigo-100 rounded-2xl opacity-60"><span className="font-bold text-indigo-700">🎨 Board Themes</span><span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Step 5 Update</span></div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* RESTORED: TUTORIAL MODAL */}
        {showTutorial && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end justify-center">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full h-[85vh] rounded-t-3xl p-6 shadow-2xl flex flex-col">
              <div className="flex justify-between items-center mb-4"><h3 className="text-2xl font-black text-slate-800">Complete Rulebook</h3><button onClick={() => setShowTutorial(false)} className="w-8 h-8 bg-slate-100 rounded-full font-bold text-slate-500">✕</button></div>
              <div className="flex-1 overflow-y-auto space-y-6 text-slate-600 pr-2 pb-10">
                <div><h4 className="font-bold text-lg text-slate-800 border-b pb-1 mb-2">The Goal</h4><p className="text-sm">The objective is to "Checkmate" the opponent's King. The King is never actually captured; the game ends immediately when it cannot escape an attack.</p></div>
                <div><h4 className="font-bold text-lg text-slate-800 border-b pb-1 mb-2">The Pieces</h4><ul className="text-sm space-y-2"><li><b>♟ Pawn:</b> Moves forward 1 square. Captures diagonally.</li><li><b>♞ Knight:</b> Moves in an 'L' shape. Can jump over pieces!</li><li><b>♝ Bishop:</b> Moves diagonally.</li><li><b>♜ Rook:</b> Moves in straight lines.</li><li><b>♛ Queen:</b> Moves straight and diagonally.</li><li><b>♚ King:</b> Moves 1 square in any direction.</li></ul></div>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
