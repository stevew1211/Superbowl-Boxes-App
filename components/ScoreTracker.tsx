import React, { useState, useEffect } from 'react';
import { FirestoreGame, ScoreUpdate, GameMode } from '../types';
import { useLiveScores } from '../hooks/useLiveScores';

interface ScoreTrackerProps {
  game: FirestoreGame;
  onAddScore: (update: ScoreUpdate) => void;
  isCreator: boolean;
}

const ScoreTracker: React.FC<ScoreTrackerProps> = ({ game, onAddScore, isCreator }) => {
  const [minute, setMinute] = useState(1);
  const [awayScore, setAwayScore] = useState(0);
  const [homeScore, setHomeScore] = useState(0);
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(1);
  const [liveEnabled, setLiveEnabled] = useState(false);

  const { liveScore, loading: liveLoading, error: liveError, lastFetched, refresh } = useLiveScores(
    liveEnabled && isCreator,
    {
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      intervalMs: 30000,
    }
  );

  // Auto-populate scores when live data arrives
  useEffect(() => {
    if (liveScore && liveEnabled) {
      setHomeScore(liveScore.homeScore);
      setAwayScore(liveScore.awayScore);
      if (liveScore.quarter) {
        setQuarter(liveScore.quarter);
      }
    }
  }, [liveScore, liveEnabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddScore({ minute, homeScore, awayScore, quarter });
  };

  const formatLastUpdated = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  return (
    <div className="space-y-6">
      {/* Score entry form - only for creator */}
      {isCreator ? (
        <div className="space-y-4">
          {/* Live Scoring Toggle */}
          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-slate-300 block">Live Scoring</label>
                <p className="text-xs text-slate-500">Auto-fetch scores from ESPN</p>
              </div>
              <button
                type="button"
                onClick={() => setLiveEnabled(!liveEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  liveEnabled ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    liveEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Live Status Indicator */}
            {liveEnabled && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {liveLoading ? (
                      <span className="text-amber-400">Fetching...</span>
                    ) : liveError ? (
                      <span className="text-red-400">Error: {liveError}</span>
                    ) : liveScore ? (
                      <span className="text-emerald-400">
                        Live: {liveScore.awayTeam} {liveScore.awayScore} - {liveScore.homeScore} {liveScore.homeTeam}
                        {liveScore.quarter && ` (Q${liveScore.quarter})`}
                      </span>
                    ) : (
                      <span className="text-slate-500">No game data found</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Updated: {formatLastUpdated(lastFetched)}</span>
                    <button
                      type="button"
                      onClick={refresh}
                      disabled={liveLoading}
                      className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Score Entry Form */}
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                {game.mode === GameMode.MINUTE_BY_MINUTE ? 'Game Minute (1-60)' : 'Current Quarter'}
              </label>
              {game.mode === GameMode.MINUTE_BY_MINUTE ? (
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={minute}
                  onChange={(e) => setMinute(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 focus:outline-none"
                />
              ) : (
                <select
                  value={quarter}
                  onChange={(e) => setQuarter(Number(e.target.value) as 1 | 2 | 3 | 4)}
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
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{game.awayTeam}</label>
              <input
                type="number"
                value={awayScore}
                onChange={(e) => setAwayScore(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 focus:outline-none"
              />
            </div>

            <div className="flex-1 min-w-[100px]">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{game.homeTeam}</label>
              <input
                type="number"
                value={homeScore}
                onChange={(e) => setHomeScore(Number(e.target.value))}
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
        </div>
      ) : (
        <div className="bg-slate-900/30 p-4 rounded-2xl border border-slate-800 text-center">
          <p className="text-sm text-slate-500">
            Only the host can add score updates. Watch for live updates below.
          </p>
        </div>
      )}

      {/* Score History */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Score History</h3>
        {game.scoreHistory.length === 0 ? (
          <div className="text-center py-12 text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl italic">
            No score updates logged yet...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...game.scoreHistory].reverse().map((s, i) => (
              <div
                key={i}
                className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 flex justify-between items-center group"
              >
                <div>
                  <span className="text-xs font-bold text-indigo-400 block uppercase">
                    {game.mode === GameMode.MINUTE_BY_MINUTE ? `Minute ${s.minute}` : `End of Q${s.quarter}`}
                  </span>
                  <span className="text-lg font-black">
                    {s.awayScore} - {s.homeScore}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Current Winner</div>
                  <div className="text-xs font-black text-emerald-400">
                    {getWinnerName(game, s.homeScore, s.awayScore)}
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

const getWinnerName = (game: FirestoreGame, homeScore: number, awayScore: number) => {
  const homeLast = homeScore % 10;
  const awayLast = awayScore % 10;
  const rowIndex = game.homeNumbers.indexOf(homeLast);
  const colIndex = game.awayNumbers.indexOf(awayLast);
  if (rowIndex === -1 || colIndex === -1) return 'N/A';

  const square = game.grid[rowIndex][colIndex];
  if (!square?.participantId) return 'Unsold Box';

  return game.participants.find((p) => p.id === square.participantId)?.name || 'Unknown';
};

export default ScoreTracker;
