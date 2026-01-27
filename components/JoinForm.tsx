import React, { useState } from 'react';
import { FirestoreGame } from '../types';

interface JoinFormProps {
  game: FirestoreGame;
  onJoin: (name: string) => void;
}

const JoinForm: React.FC<JoinFormProps> = ({ game, onJoin }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name.trim());
    }
  };

  return (
    <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-8 rounded-[2rem] shadow-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-white mb-2 italic">SUPER BOWL BOXES</h1>
        <p className="text-slate-400">You've been invited to join a game!</p>
      </div>

      <div className="bg-slate-900/50 rounded-2xl p-6 mb-6 border border-slate-800">
        <div className="text-center mb-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Matchup</span>
          <div className="text-xl font-black text-white mt-1">
            {game.awayTeam} vs {game.homeTeam}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase block">Price/Box</span>
            <span className="text-lg font-bold text-emerald-400">${game.pricePerBox}</span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase block">Total Pot</span>
            <span className="text-lg font-bold text-emerald-400">${game.pricePerBox * 100}</span>
          </div>
        </div>

        <div className="text-center mt-4 pt-4 border-t border-slate-800">
          <span className="text-xs font-bold text-slate-500 uppercase block">Hosted by</span>
          <span className="text-sm font-semibold text-white">{game.creatorName}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Your Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-600/20 transform active:scale-95 transition-all"
        >
          Join Game
        </button>
      </form>
    </div>
  );
};

export default JoinForm;
