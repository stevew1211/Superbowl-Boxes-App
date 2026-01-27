import React from 'react';
import { FirestoreGame, UserSession, ClaimStatus } from '../types';

interface BoxGridProps {
  game: FirestoreGame;
  session: UserSession;
  isCreator: boolean;
  onBoxClick: (row: number, col: number) => void;
}

const BoxGrid: React.FC<BoxGridProps> = ({ game, session, isCreator, onBoxClick }) => {
  const { grid, homeNumbers, awayNumbers, homeTeam, awayTeam, participants, pendingClaims } = game;

  // Find pending claim for a specific box
  const getPendingClaim = (row: number, col: number) => {
    return pendingClaims.find(
      (c) => c.row === row && c.col === col && c.status === ClaimStatus.PENDING
    );
  };

  // Check if current user has a pending claim on this box
  const isMyPendingClaim = (row: number, col: number) => {
    const claim = getPendingClaim(row, col);
    return claim?.participantId === session.id;
  };

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
        {Array(10).fill(0).map((_, i) => (
          <div key={`away-num-${i}`} className="h-10 flex items-center justify-center font-black text-xl text-indigo-400">
            {awayNumbers.length > 0 ? awayNumbers[i] : '?'}
          </div>
        ))}

        {grid.map((row, rowIndex) => (
          <React.Fragment key={`row-${rowIndex}`}>
            {/* Home Numbers Sidebar */}
            <div className="w-12 h-12 flex items-center justify-center font-black text-xl text-indigo-400">
              {homeNumbers.length > 0 ? homeNumbers[rowIndex] : '?'}
            </div>

            {row.map((square, colIndex) => {
              const participant = participants.find((p) => p.id === square.participantId);
              const pendingClaim = getPendingClaim(rowIndex, colIndex);
              const pendingParticipant = pendingClaim
                ? participants.find((p) => p.id === pendingClaim.participantId)
                : null;
              const isPending = !!pendingClaim;
              const isClaimed = !!participant;
              const isMyPending = isMyPendingClaim(rowIndex, colIndex);

              // Determine if box is clickable
              const canClick = isCreator
                ? true // Creator can always click to cycle participants
                : !isClaimed && !isPending; // Participants can only claim empty boxes

              // Determine visual state
              let boxStyle = {};
              let boxClasses = 'w-12 h-12 rounded-lg border-2 transition-all flex items-center justify-center text-[10px] font-bold overflow-hidden p-1';

              if (isClaimed && participant) {
                // Claimed box - solid color
                boxStyle = {
                  backgroundColor: participant.color + '33',
                  borderColor: participant.color,
                };
              } else if (isPending && pendingParticipant) {
                // Pending claim - pulsing animation
                boxStyle = {
                  backgroundColor: pendingParticipant.color + '20',
                  borderColor: pendingParticipant.color + '80',
                };
                boxClasses += ' animate-pulse';
              } else {
                // Empty box
                boxClasses += ' border-slate-800';
                if (canClick) {
                  boxClasses += ' hover:border-slate-600 bg-slate-900/50 cursor-pointer';
                } else {
                  boxClasses += ' bg-slate-900/30 cursor-not-allowed';
                }
              }

              return (
                <button
                  key={`cell-${rowIndex}-${colIndex}`}
                  onClick={() => canClick && onBoxClick(rowIndex, colIndex)}
                  disabled={!canClick}
                  className={boxClasses}
                  style={boxStyle}
                  title={
                    isPending
                      ? `Pending: ${pendingClaim?.participantName}`
                      : isClaimed
                      ? participant?.name
                      : 'Click to claim'
                  }
                >
                  {isClaimed && participant ? (
                    <span className="truncate w-full text-center leading-tight">{participant.name}</span>
                  ) : isPending ? (
                    <div className="text-center">
                      <span className="truncate w-full leading-tight block text-[8px] opacity-70">
                        {pendingClaim?.participantName}
                      </span>
                      <span className="text-[6px] uppercase text-amber-400 font-bold">Pending</span>
                    </div>
                  ) : canClick ? (
                    <span className="opacity-0 hover:opacity-100 text-slate-600">+</span>
                  ) : null}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-slate-800 bg-slate-900/50" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-amber-500/50 bg-amber-500/20 animate-pulse" />
          <span>Pending Approval</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-indigo-500 bg-indigo-500/30" />
          <span>Claimed</span>
        </div>
      </div>
    </div>
  );
};

export default BoxGrid;
