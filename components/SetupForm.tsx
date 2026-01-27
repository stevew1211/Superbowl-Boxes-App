import React, { useState } from 'react';
import { GameMode } from '../types';

interface SetupFormProps {
  onSetup: (config: {
    creatorName: string;
    homeTeam: string;
    awayTeam: string;
    pricePerBox: number;
    mode: GameMode;
  }) => void;
}

const SetupForm: React.FC<SetupFormProps> = ({ onSetup }) => {
  const [creatorName, setCreatorName] = useState('');
  const [homeTeam, setHomeTeam] = useState('Patriots');
  const [awayTeam, setAwayTeam] = useState('Seahawks');
  const [price, setPrice] = useState(10);
  const [mode, setMode] = useState<GameMode>(GameMode.TRADITIONAL);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!creatorName.trim()) return;
    setIsSubmitting(true);
    try {
      await onSetup({
        creatorName: creatorName.trim(),
        homeTeam,
        awayTeam,
        pricePerBox: price,
        mode,
      });
    } catch (err) {
      console.error('Failed to create game:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-8 rounded-[2rem] shadow-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-white mb-2 italic">SUPER BOWL BOXES</h1>
        <p className="text-slate-400">Set up your game rules to start the party.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Your Name (Host)</label>
          <input
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            placeholder="Enter your name..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Away Team</label>
            <input
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Home Team</label>
            <input
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Price Per Box ($)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Payout Structure</label>
          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => setMode(GameMode.TRADITIONAL)}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                mode === GameMode.TRADITIONAL
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700 bg-slate-900/50'
              }`}
            >
              <div className="font-bold text-white">Traditional Scoring</div>
              <div className="text-xs text-slate-400">Payouts at 1st Q, Halftime, 3rd Q, and Final.</div>
            </button>
            <button
              type="button"
              onClick={() => setMode(GameMode.MINUTE_BY_MINUTE)}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                mode === GameMode.MINUTE_BY_MINUTE
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700 bg-slate-900/50'
              }`}
            >
              <div className="font-bold text-white">Minute-by-Minute</div>
              <div className="text-xs text-slate-400">
                High octane! Pot split evenly across all 60 minutes of game clock.
              </div>
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!creatorName.trim() || isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-600/20 transform active:scale-95 transition-all mt-4 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating Game...
            </>
          ) : (
            'Create Game Board'
          )}
        </button>
      </div>
    </div>
  );
};

export default SetupForm;
