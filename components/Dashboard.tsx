
import React, { useState, useMemo } from 'react';
import { GameState, GameMode, PayoutSummary } from '../types';
import { TRADITIONAL_DISTRIBUTION } from '../constants';

interface DashboardProps {
  gameState: GameState;
  onAddParticipant: (name: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ gameState, onAddParticipant }) => {
  const [newName, setNewName] = useState('');

  const calculatePayouts = useMemo((): PayoutSummary[] => {
    const potSize = gameState.pricePerBox * 100;
    const payouts: Record<string, { total: number, wins: number }> = {};
    
    // Initialize for all participants
    gameState.participants.forEach(p => {
      payouts[p.id] = { total: 0, wins: 0 };
    });

    const getWinnerId = (home: number, away: number) => {
      const hLast = home % 10;
      const aLast = away % 10;
      const r = gameState.homeNumbers.indexOf(hLast);
      const c = gameState.awayNumbers.indexOf(aLast);
      return gameState.grid[r]?.[c]?.participantId;
    };

    if (gameState.mode === GameMode.TRADITIONAL) {
      // Find scores for Q1, Q2 (Half), Q3, Q4 (Final)
      const q1 = gameState.scoreHistory.find(s => s.quarter === 1);
      const q2 = gameState.scoreHistory.find(s => s.quarter === 2);
      const q3 = gameState.scoreHistory.find(s => s.quarter === 3);
      const q4 = gameState.scoreHistory.find(s => s.quarter === 4);

      if (q1) {
        const wid = getWinnerId(q1.homeScore, q1.awayScore);
        if (wid && payouts[wid]) {
          payouts[wid].total += potSize * TRADITIONAL_DISTRIBUTION.Q1;
          payouts[wid].wins += 1;
        }
      }
      if (q2) {
        const wid = getWinnerId(q2.homeScore, q2.awayScore);
        if (wid && payouts[wid]) {
          payouts[wid].total += potSize * TRADITIONAL_DISTRIBUTION.HALFTIME;
          payouts[wid].wins += 1;
        }
      }
      if (q3) {
        const wid = getWinnerId(q3.homeScore, q3.awayScore);
        if (wid && payouts[wid]) {
          payouts[wid].total += potSize * TRADITIONAL_DISTRIBUTION.Q3;
          payouts[wid].wins += 1;
        }
      }
      if (q4) {
        const wid = getWinnerId(q4.homeScore, q4.awayScore);
        if (wid && payouts[wid]) {
          payouts[wid].total += potSize * TRADITIONAL_DISTRIBUTION.FINAL;
          payouts[wid].wins += 1;
        }
      }
    } else {
      // Minute-by-minute
      // We assume each minute logged pays out pot/60. 
      // If gaps exist, we could interpolate, but simplest is pot/60 for each logged minute up to 60.
      const perMin = potSize / 60;
      gameState.scoreHistory.forEach(s => {
        const wid = getWinnerId(s.homeScore, s.awayScore);
        if (wid && payouts[wid]) {
          payouts[wid].total += perMin;
          payouts[wid].wins += 1;
        }
      });
    }

    return gameState.participants.map(p => ({
      participantId: p.id,
      participantName: p.name,
      totalOwed: payouts[p.id]?.total || 0,
      winCount: payouts[p.id]?.wins || 0
    })).sort((a, b) => b.totalOwed - a.totalOwed);
  }, [gameState]);

  const boxesClaimed = gameState.grid.flat().filter(s => s.participantId !== null).length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
          <span>Leaderboard</span>
          <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-1 rounded-md">{boxesClaimed}/100 Boxes Sold</span>
        </h2>
        
        <div className="space-y-3">
          {calculatePayouts.length === 0 ? (
            <p className="text-sm text-slate-500 italic">Add participants to track earnings...</p>
          ) : (
            calculatePayouts.map(p => (
              <div key={p.participantId} className="flex items-center justify-between bg-slate-800/30 p-4 rounded-2xl border border-slate-800/50">
                <div className="flex items-center gap-3">
                   <div 
                    className="w-2 h-8 rounded-full" 
                    style={{ backgroundColor: gameState.participants.find(u => u.id === p.participantId)?.color }}
                   />
                   <div>
                     <span className="font-bold block">{p.participantName}</span>
                     <span className="text-[10px] text-slate-500 uppercase font-black">{p.winCount} Wins</span>
                   </div>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-black ${p.totalOwed > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                    ${p.totalOwed.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-slate-800">
        <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">Add Player</h3>
        <div className="flex gap-2">
          <input 
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Name..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 focus:outline-none"
            onKeyDown={e => e.key === 'Enter' && (onAddParticipant(newName), setNewName(''))}
          />
          <button 
            onClick={() => {
              if (newName.trim()) {
                onAddParticipant(newName);
                setNewName('');
              }
            }}
            className="bg-indigo-600 p-2 rounded-xl text-white hover:bg-indigo-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20">
         <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">How it works</div>
         <p className="text-xs text-indigo-100/70 leading-relaxed">
           {gameState.mode === GameMode.TRADITIONAL 
             ? "Winners are calculated based on the last digit of the score at the end of each quarter. Standard 20/30/20/30 distribution."
             : "Pot is split into 60 equal parts. Each game minute is a new chance to win. Log the score at specific minute marks to assign payouts."
           }
         </p>
      </div>
    </div>
  );
};

export default Dashboard;
