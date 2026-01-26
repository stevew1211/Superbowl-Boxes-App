
import React, { useState, useMemo, useEffect } from 'react';
import { GameMode, GameState, Square, Participant, ScoreUpdate, PayoutSummary } from './types';
import { GRID_SIZE, COLORS } from './constants';
import SetupForm from './components/SetupForm';
import BoxGrid from './components/BoxGrid';
import ScoreTracker from './components/ScoreTracker';
import Dashboard from './components/Dashboard';

const STORAGE_KEY = 'super_bowl_boxes_state';

const generateInitialGrid = (): Square[][] => {
  return Array(GRID_SIZE).fill(null).map(() => 
    Array(GRID_SIZE).fill(null).map(() => ({ participantId: null }))
  );
};

const shuffle = (array: number[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (gameState) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }
  }, [gameState]);

  const handleSetup = (config: { homeTeam: string, awayTeam: string, pricePerBox: number, mode: GameMode }) => {
    const newState: GameState = {
      ...config,
      homeNumbers: shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
      awayNumbers: shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
      grid: generateInitialGrid(),
      participants: [],
      scoreHistory: []
    };
    setGameState(newState);
  };

  const handleUpdateGrid = (row: number, col: number, participantId: string | null) => {
    if (!gameState) return;
    const newGrid = [...gameState.grid];
    newGrid[row][col] = { participantId };
    setGameState({ ...gameState, grid: newGrid });
  };

  const handleAddParticipant = (name: string) => {
    if (!gameState) return;
    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      name,
      color: COLORS[gameState.participants.length % COLORS.length]
    };
    setGameState({
      ...gameState,
      participants: [...gameState.participants, newParticipant]
    });
  };

  const handleAddScore = (update: ScoreUpdate) => {
    if (!gameState) return;
    // Remove existing update for same minute if any
    const filteredHistory = gameState.scoreHistory.filter(s => s.minute !== update.minute);
    setGameState({
      ...gameState,
      scoreHistory: [...filteredHistory, update].sort((a, b) => a.minute - b.minute)
    });
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset everything?")) {
      localStorage.removeItem(STORAGE_KEY);
      setGameState(null);
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <SetupForm onSetup={handleSetup} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <header className="bg-slate-900/50 backdrop-blur-md sticky top-0 z-30 border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Super Bowl Box Master</h1>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">{gameState.mode.replace(/_/g, ' ')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="text-center md:text-right">
                <span className="text-xs text-slate-400 block uppercase font-bold">Total Pot</span>
                <span className="text-2xl font-black text-emerald-400">${(gameState.pricePerBox * 100).toLocaleString()}</span>
             </div>
             <button 
               onClick={handleReset}
               className="text-slate-500 hover:text-red-400 transition-colors"
               title="Reset Game"
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
               </svg>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800 shadow-2xl overflow-x-auto">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
              The Grid
            </h2>
            <BoxGrid 
              gameState={gameState} 
              onUpdateSquare={handleUpdateGrid} 
            />
          </section>

          <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800 shadow-2xl">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
              Live Game Tracking
            </h2>
            <ScoreTracker 
              gameState={gameState} 
              onAddScore={handleAddScore} 
            />
          </section>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800 shadow-2xl">
             <Dashboard 
               gameState={gameState} 
               onAddParticipant={handleAddParticipant}
             />
          </section>
        </div>
      </main>
    </div>
  );
}
