import React from 'react';
import { BoxClaim, FirestoreGame } from '../types';

interface PendingClaimsPanelProps {
  game: FirestoreGame;
  onApprove: (claim: BoxClaim) => void;
  onApproveAll: () => void;
  onReject: (claim: BoxClaim) => void;
}

const PendingClaimsPanel: React.FC<PendingClaimsPanelProps> = ({
  game,
  onApprove,
  onApproveAll,
  onReject,
}) => {
  const pendingClaims = game.pendingClaims;

  if (pendingClaims.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
            Pending Claims ({pendingClaims.length})
          </h3>
        </div>
        <button
          onClick={onApproveAll}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
        >
          Approve All
        </button>
      </div>

      <div className="space-y-3">
        {pendingClaims.map((claim) => (
          <div
            key={claim.id}
            className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-800"
          >
            <div>
              <span className="font-bold text-white block">{claim.participantName}</span>
              <span className="text-xs text-slate-400">
                Row {claim.row + 1}, Col {claim.col + 1}
                <span className="mx-1">-</span>
                {game.homeNumbers[claim.row]} x {game.awayNumbers[claim.col]}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onApprove(claim)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => onReject(claim)}
                className="bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border border-red-600/30"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingClaimsPanel;
