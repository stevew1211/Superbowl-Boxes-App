
import React from 'react';
import { GameState, Participant } from '../types';

interface BoxGridProps {
  gameState: GameState;
  onUpdateSquare: (row: number, col: number, participantId: string | null) => void;
}

const BoxGrid: React.FC<BoxGridProps> = ({ gameState, onUpdateSquare }) => {
  const { grid, homeNumbers, awayNumbers, homeTeam, awayTeam, participants } = gameState;

  return (
    <div className="relative inline-block min-w-full">
      {/* Away Team Label (Vertical) */}
      <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 origin-center whitespace-nowrap">
        <span className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">{awayTeam}</span>
      </div>

      {/* Home Team Label (Horizontal) */}
      <div className="text-center mb-4">
        <span className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">{homeTeam}</span>
      </div>

      <div className="grid grid-cols-[3rem_repeat(10,1fr)] gap-2">
        {/* Top Spacer */}
        <div className="h-10"></div>
        {/* Away Numbers Header */}
        {awayNumbers.map((num, i) => (
          <div key={`away-num-${i}`} className="h-10 flex items-center justify-center font-black text-xl text-indigo-400">
            {num}
          </div>
        ))}

        {grid.map((row, rowIndex) => (
          <React.Fragment key={`row-${rowIndex}`}>
            {/* Home Numbers Sidebar */}
            <div className="w-12 h-12 flex items-center justify-center font-black text-xl text-indigo-400">
              {homeNumbers[rowIndex]}
            </div>
            
            {row.map((square, colIndex) => {
              const participant = participants.find(p => p.id === square.participantId);
              
              return (
                <button
                  key={`cell-${rowIndex}-${colIndex}`}
                  onClick={() => {
                    // Logic to cycle participants or clear
                    const currentIndex = participants.findIndex(p => p.id === square.participantId);
                    const nextParticipant = participants[currentIndex + 1] || null;
                    onUpdateSquare(rowIndex, colIndex, nextParticipant?.id || null);
                  }}
                  className={`w-12 h-12 rounded-lg border-2 border-slate-800 transition-all flex items-center justify-center text-[10px] font-bold overflow-hidden p-1
                    ${participant ? '' : 'hover:border-slate-600 bg-slate-900/50'}`}
                  style={participant ? { backgroundColor: participant.color + '33', borderColor: participant.color } : {}}
                >
                  {participant ? (
                    <span className="truncate w-full text-center leading-tight">{participant.name}</span>
                  ) : (
                    <span className="opacity-0 hover:opacity-100 text-slate-600">+</span>
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default BoxGrid;
