
import React, { useState } from 'react';
import { GameState, ScoreUpdate, GameMode } from '../types';

interface ScoreTrackerProps {
  gameState: GameState;
  onAddScore: (update: ScoreUpdate) => void;
}

const ScoreTracker: React.FC<ScoreTrackerProps> = ({ gameState, onAddScore }) => {
  const [minute, setMinute] = useState(1);
  const [awayScore, setAwayScore] = useState(0);
  const [homeScore, setHomeScore] = useState(0);
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddScore({ minute, homeScore, awayScore, quarter });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            {gameState.mode === GameMode.MINUTE_BY_MINUTE ? 'Game Minute (1-60)' : 'Current Quarter'}
          </label>
          {gameState.mode === GameMode.MINUTE_BY_MINUTE ? (
            <input 
              type="number"
              min="1" max="60"
              value={minute}
              onChange={e => setMinute(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 focus:outline-none"
            />
          ) : (
            <select 
              value={quarter}
              onChange={e => setQuarter(Number(e.target.value) as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 focus:outline-none"
            >
              <option value={1}>End of Q1</option>
              <option value={2}>Halftime (Q2)</option>
              <option value={3}>End of Q3</option>
              <option value={4}>Final (Q4)</option>
            </select>
          )}
        </div>

        <div className="flex-1 min-w-[100px]">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{gameState.awayTeam}</label>
          <input 
            type="number"
            value={awayScore}
            onChange={e => setAwayScore(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 focus:outline-none"
          />
        </div>

        <div className="flex-1 min-w-[100px]">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{gameState.homeTeam}</label>
          <input 
            type="number"
            value={homeScore}
            onChange={e => setHomeScore(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 focus:outline-none"
          />
        </div>

        <button 
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2 rounded-xl h-[42px] transition-all"
        >
          Add Log
        </button>
      </form>

      <div className="space-y-3">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Score History</h3>
        {gameState.scoreHistory.length === 0 ? (
          <div className="text-center py-12 text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl italic">
            No score updates logged yet...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...gameState.scoreHistory].reverse().map((s, i) => (
              <div key={i} className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 flex justify-between items-center group">
                <div>
                  <span className="text-xs font-bold text-indigo-400 block uppercase">
                    {gameState.mode === GameMode.MINUTE_BY_MINUTE ? `Minute ${s.minute}` : `End of Q${s.quarter}`}
                  </span>
                  <span className="text-lg font-black">{s.awayScore} - {s.homeScore}</span>
                </div>
                <div className="text-right">
                   <div className="text-[10px] text-slate-500 uppercase font-bold">Current Winner</div>
                   <div className="text-xs font-black text-emerald-400">
                     {getWinnerName(gameState, s.homeScore, s.awayScore)}
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const getWinnerName = (state: GameState, homeScore: number, awayScore: number) => {
  const homeLast = homeScore % 10;
  const awayLast = awayScore % 10;
  const rowIndex = state.homeNumbers.indexOf(homeLast);
  const colIndex = state.awayNumbers.indexOf(awayLast);
  if (rowIndex === -1 || colIndex === -1) return 'N/A';
  
  const square = state.grid[rowIndex][colIndex];
  if (!square?.participantId) return 'Unsold Box';
  
  return state.participants.find(p => p.id === square.participantId)?.name || 'Unknown';
};

export default ScoreTracker;
