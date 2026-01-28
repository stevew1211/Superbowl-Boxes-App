import React, { useMemo } from 'react';
import { FirestoreGame, GameMode, PayoutSummary, UserSession } from '../types';
import { TRADITIONAL_DISTRIBUTION, FINAL_SCORE_PROBABILITIES } from '../constants';

interface DashboardProps {
  game: FirestoreGame;
  session: UserSession;
  isCreator: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ game, session, isCreator }) => {
  const calculatePayouts = useMemo((): PayoutSummary[] => {
    const potSize = game.pricePerBox * 100;
    const payouts: Record<string, { total: number; wins: number }> = {};

    // Initialize for all participants
    game.participants.forEach((p) => {
      payouts[p.id] = { total: 0, wins: 0 };
    });

    const getWinnerId = (home: number, away: number) => {
      const hLast = home % 10;
      const aLast = away % 10;
      const r = game.homeNumbers.indexOf(hLast);
      const c = game.awayNumbers.indexOf(aLast);
      return game.grid[r]?.[c]?.participantId;
    };

    if (game.mode === GameMode.TRADITIONAL) {
      // Use custom distribution if set, otherwise fall back to default
      const dist = game.payoutDistribution || TRADITIONAL_DISTRIBUTION;

      const q1 = game.scoreHistory.find((s) => s.quarter === 1);
      const q2 = game.scoreHistory.find((s) => s.quarter === 2);
      const q3 = game.scoreHistory.find((s) => s.quarter === 3);
      const q4 = game.scoreHistory.find((s) => s.quarter === 4);

      if (q1) {
        const wid = getWinnerId(q1.homeScore, q1.awayScore);
        if (wid && payouts[wid]) {
          payouts[wid].total += potSize * dist.Q1;
          payouts[wid].wins += 1;
        }
      }
      if (q2) {
        const wid = getWinnerId(q2.homeScore, q2.awayScore);
        if (wid && payouts[wid]) {
          payouts[wid].total += potSize * dist.HALFTIME;
          payouts[wid].wins += 1;
        }
      }
      if (q3) {
        const wid = getWinnerId(q3.homeScore, q3.awayScore);
        if (wid && payouts[wid]) {
          payouts[wid].total += potSize * dist.Q3;
          payouts[wid].wins += 1;
        }
      }
      if (q4) {
        const wid = getWinnerId(q4.homeScore, q4.awayScore);
        if (wid && payouts[wid]) {
          payouts[wid].total += potSize * dist.FINAL;
          payouts[wid].wins += 1;
        }
      }
    } else {
      // Minute-by-minute: each minute (0-59) pays 1%, final score pays 40%
      const perMin = potSize * 0.01; // 1% per minute
      const finalPayout = potSize * 0.40; // 40% for final score

      game.scoreHistory.forEach((s) => {
        const wid = getWinnerId(s.homeScore, s.awayScore);
        if (wid && payouts[wid]) {
          if (s.minute === 60) {
            // Final score entry
            payouts[wid].total += finalPayout;
          } else {
            // Regular minute (0-59)
            payouts[wid].total += perMin;
          }
          payouts[wid].wins += 1;
        }
      });
    }

    return game.participants
      .map((p) => ({
        participantId: p.id,
        participantName: p.name,
        totalOwed: payouts[p.id]?.total || 0,
        winCount: payouts[p.id]?.wins || 0,
      }))
      .sort((a, b) => b.totalOwed - a.totalOwed);
  }, [game]);

  // Count boxes for current user
  const myBoxCount = useMemo(() => {
    return game.grid.flat().filter((s) => s.participantId === session.id).length;
  }, [game, session]);

  // Count pending claims for current user
  const myPendingCount = useMemo(() => {
    return game.pendingClaims.filter((c) => c.participantId === session.id).length;
  }, [game, session]);

  const boxesClaimed = game.grid.flat().filter((s) => s.participantId !== null).length;

  // Calculate win probabilities for each player (Traditional mode only, after numbers are assigned)
  const winProbabilities = useMemo(() => {
    if (game.mode !== GameMode.TRADITIONAL) return [];
    if (game.homeNumbers.length === 0 || game.awayNumbers.length === 0) return [];

    const probabilities: Record<string, number> = {};

    // Initialize for all participants
    game.participants.forEach((p) => {
      probabilities[p.id] = 0;
    });

    // Sum probabilities for each player's boxes
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const square = game.grid[row]?.[col];
        if (square?.participantId) {
          // Get the actual digit values for this position
          const homeDigit = game.homeNumbers[row];
          const awayDigit = game.awayNumbers[col];
          // Look up probability (row = home digit, col = away digit)
          const prob = FINAL_SCORE_PROBABILITIES[homeDigit]?.[awayDigit] || 0;
          probabilities[square.participantId] += prob;
        }
      }
    }

    return game.participants
      .map((p) => ({
        participantId: p.id,
        participantName: p.name,
        probability: probabilities[p.id] || 0,
        boxCount: game.grid.flat().filter((s) => s.participantId === p.id).length,
      }))
      .filter((p) => p.boxCount > 0)
      .sort((a, b) => b.probability - a.probability);
  }, [game]);

  return (
    <div className="space-y-8">
      {/* Your Status (for non-creators) */}
      {!isCreator && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wide mb-3">Your Status</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <span className="text-2xl font-black text-white">{myBoxCount}</span>
              <span className="text-xs text-slate-400 block">Boxes Owned</span>
            </div>
            <div>
              <span className="text-2xl font-black text-amber-400">{myPendingCount}</span>
              <span className="text-xs text-slate-400 block">Pending Claims</span>
            </div>
          </div>
        </div>
      )}

      {/* Creator Stats */}
      {isCreator && (
        <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Game Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-2xl font-black text-white">{game.participants.length}</span>
              <span className="text-xs text-slate-400 block">Players</span>
            </div>
            <div>
              <span className="text-2xl font-black text-white">{boxesClaimed}</span>
              <span className="text-xs text-slate-400 block">Sold</span>
            </div>
            <div>
              <span className="text-2xl font-black text-amber-400">{game.pendingClaims.length}</span>
              <span className="text-xs text-slate-400 block">Pending</span>
            </div>
          </div>
        </div>
      )}

      {/* Win Probability (Traditional mode, host only, after numbers assigned) */}
      {isCreator && game.mode === GameMode.TRADITIONAL && winProbabilities.length > 0 && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wide mb-3">
            Final Score Win Probability
          </h3>
          <p className="text-[10px] text-slate-500 mb-3">
            Based on historical Super Bowl final score patterns
          </p>
          <div className="space-y-2">
            {winProbabilities.map((p) => {
              const percentage = (p.probability * 100).toFixed(1);
              return (
                <div
                  key={p.participantId}
                  className="flex items-center justify-between bg-slate-900/50 p-2 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-6 rounded-full"
                      style={{
                        backgroundColor: game.participants.find((u) => u.id === p.participantId)?.color,
                      }}
                    />
                    <span className="text-sm font-medium">{p.participantName}</span>
                    <span className="text-[10px] text-slate-500">({p.boxCount} boxes)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${Math.min(p.probability * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-purple-400 w-14 text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
          <span>Leaderboard</span>
          <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-1 rounded-md">
            {boxesClaimed}/100 Boxes Sold
          </span>
        </h2>

        <div className="space-y-3">
          {calculatePayouts.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No participants yet...</p>
          ) : (
            calculatePayouts.map((p) => {
              const isMe = p.participantId === session.id;
              return (
                <div
                  key={p.participantId}
                  className={`flex items-center justify-between p-4 rounded-2xl border ${
                    isMe
                      ? 'bg-indigo-500/10 border-indigo-500/30'
                      : 'bg-slate-800/30 border-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-8 rounded-full"
                      style={{
                        backgroundColor: game.participants.find((u) => u.id === p.participantId)?.color,
                      }}
                    />
                    <div>
                      <span className="font-bold block">
                        {p.participantName}
                        {isMe && <span className="text-indigo-400 text-xs ml-1">(You)</span>}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-black">
                        {p.winCount} Wins
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xl font-black ${
                        p.totalOwed > 0 ? 'text-emerald-400' : 'text-slate-600'
                      }`}
                    >
                      ${p.totalOwed.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Players List */}
      <div className="pt-6 border-t border-slate-800">
        <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">Players</h3>
        <div className="flex flex-wrap gap-2">
          {game.participants.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 bg-slate-800/30 px-3 py-1.5 rounded-full"
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-sm">
                {p.name}
                {p.id === game.creatorSessionId && (
                  <span className="text-xs text-indigo-400 ml-1">(Host)</span>
                )}
                {p.id === session.id && p.id !== game.creatorSessionId && (
                  <span className="text-xs text-slate-500 ml-1">(You)</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Host Instructions */}
      {game.instructions && (
        <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
          <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Host Instructions</div>
          <p className="text-xs text-amber-100/70 leading-relaxed whitespace-pre-wrap">
            {game.instructions}
          </p>
        </div>
      )}

      {/* How it works */}
      <div className="bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20">
        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">How it works</div>
        <p className="text-xs text-indigo-100/70 leading-relaxed">
          {game.mode === GameMode.TRADITIONAL
            ? `Winners are calculated based on the last digit of the score at the end of each quarter. Payout: Q1 ${Math.round((game.payoutDistribution?.Q1 || TRADITIONAL_DISTRIBUTION.Q1) * 100)}% / Half ${Math.round((game.payoutDistribution?.HALFTIME || TRADITIONAL_DISTRIBUTION.HALFTIME) * 100)}% / Q3 ${Math.round((game.payoutDistribution?.Q3 || TRADITIONAL_DISTRIBUTION.Q3) * 100)}% / Final ${Math.round((game.payoutDistribution?.FINAL || TRADITIONAL_DISTRIBUTION.FINAL) * 100)}%`
            : 'Each minute (0-59) pays 1% of the pot. Final score pays the remaining 40%. Minute 0 starts with 0-0 score.'}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
