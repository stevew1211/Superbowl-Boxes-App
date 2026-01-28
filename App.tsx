import React, { useState, useMemo, useEffect } from 'react';
import { GameMode, ScoreUpdate, PayoutSummary, Participant, BoxClaim, PayoutDistribution } from './types';
import { generateUUID } from './utils';
import { GRID_SIZE, COLORS } from './constants';
import { useSession } from './hooks/useSession';
import { useFirestore } from './hooks/useFirestore';
import SetupForm from './components/SetupForm';
import JoinForm from './components/JoinForm';
import BoxGrid from './components/BoxGrid';
import ScoreTracker from './components/ScoreTracker';
import Dashboard from './components/Dashboard';
import ShareLink from './components/ShareLink';
import PendingClaimsPanel from './components/PendingClaimsPanel';

function getGameIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('game');
}

function setGameIdInUrl(gameId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('game', gameId);
  window.history.pushState({}, '', url.toString());
}

export default function App() {
  const [gameId, setGameId] = useState<string | null>(getGameIdFromUrl);
  const { session, createSession, clearSession } = useSession(gameId);
  const {
    game,
    loading,
    error,
    createGame,
    addParticipant,
    submitClaim,
    approveClaim,
    approveAllClaims,
    rejectClaim,
    updateBox,
    updateScore,
    randomizeNumbers,
  } = useFirestore(gameId, session);

  // Re-check URL on mount (handles cases where initial load misses the query string)
  useEffect(() => {
    const urlGameId = getGameIdFromUrl();
    if (urlGameId && !gameId) {
      setGameId(urlGameId);
    }
  }, []);

  // Listen for browser navigation
  useEffect(() => {
    const handlePopState = () => {
      setGameId(getGameIdFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isCreator = session?.isCreator ?? false;

  // Handle game creation
  const handleCreateGame = async (config: {
    creatorName: string;
    homeTeam: string;
    awayTeam: string;
    pricePerBox: number;
    mode: GameMode;
    payoutDistribution?: PayoutDistribution;
    instructions?: string;
  }) => {
    // Create session for the creator (with placeholder gameId, will update after)
    const creatorSession = {
      id: generateUUID(),
      name: config.creatorName,
      gameId: '', // Will be set after game creation
      isCreator: true,
    };

    // Create the game in Firestore first (before setting any state)
    const newGameId = await createGame({
      creatorSession,
      homeTeam: config.homeTeam,
      awayTeam: config.awayTeam,
      pricePerBox: config.pricePerBox,
      mode: config.mode,
      payoutDistribution: config.payoutDistribution,
      instructions: config.instructions,
    });

    // Update session with real game ID and save to localStorage
    creatorSession.gameId = newGameId;
    localStorage.setItem(`sbbox_session_${newGameId}`, JSON.stringify(creatorSession));

    // Update URL and navigate (this will reload with proper gameId)
    setGameIdInUrl(newGameId);
    window.location.reload();
  };

  // Handle participant joining
  const handleJoin = async (name: string) => {
    if (!game || !gameId) {
      console.error('handleJoin: No game or gameId');
      alert('Error: Game not loaded. Please refresh and try again.');
      return;
    }

    try {
      const newSession = createSession(name, false);
      if (!newSession) {
        console.error('handleJoin: Failed to create session');
        alert('Error: Could not create session. If using private browsing, try regular mode.');
        return;
      }

      // Add participant to game
      const newParticipant: Participant = {
        id: newSession.id,
        name: newSession.name,
        color: COLORS[game.participants.length % COLORS.length],
      };

      await addParticipant(newParticipant);
    } catch (err) {
      console.error('handleJoin error:', err);
      alert('Error joining game: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Handle box click
  const handleBoxClick = async (row: number, col: number) => {
    if (!game || !session) return;

    if (isCreator) {
      // Creator can cycle through participants directly
      const currentParticipantId = game.grid[row][col]?.participantId;
      const currentIndex = game.participants.findIndex((p) => p.id === currentParticipantId);
      const nextParticipant = game.participants[currentIndex + 1] || null;
      await updateBox(row, col, nextParticipant?.id || null);
    } else {
      // Participants submit claims
      await submitClaim(row, col);
    }
  };

  // Handle score update
  const handleAddScore = async (update: ScoreUpdate) => {
    await updateScore(update);
  };

  // Handle reset (leave game)
  const handleReset = () => {
    if (confirm('Are you sure you want to leave this game?')) {
      clearSession();
      window.history.pushState({}, '', window.location.pathname);
      setGameId(null);
    }
  };

  // Loading state
  if (loading && gameId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading game...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <button
            onClick={() => {
              window.history.pushState({}, '', window.location.pathname);
              setGameId(null);
            }}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  // No game ID - show setup form to create a new game
  if (!gameId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <SetupForm onSetup={handleCreateGame} />
      </div>
    );
  }

  // Game ID but no game found
  if (!game) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Game not found</p>
          <button
            onClick={() => {
              window.history.pushState({}, '', window.location.pathname);
              setGameId(null);
            }}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl"
          >
            Create New Game
          </button>
        </div>
      </div>
    );
  }

  // Game found but no session - show join form
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <JoinForm game={game} onJoin={handleJoin} />
      </div>
    );
  }

  // Main game view
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <header className="bg-slate-900/50 backdrop-blur-md sticky top-0 z-30 border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {/* Football shape */}
                <ellipse cx="12" cy="12" rx="9" ry="5" strokeWidth={2} transform="rotate(45 12 12)" />
                {/* Laces */}
                <line x1="12" y1="8" x2="12" y2="16" strokeWidth={2} strokeLinecap="round" />
                <line x1="10" y1="10" x2="14" y2="10" strokeWidth={1.5} strokeLinecap="round" />
                <line x1="10" y1="12" x2="14" y2="12" strokeWidth={1.5} strokeLinecap="round" />
                <line x1="10" y1="14" x2="14" y2="14" strokeWidth={1.5} strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SB Boxes 2026</h1>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
                {game.mode.replace(/_/g, ' ')}
                {isCreator && (
                  <span className="ml-2 text-indigo-400">(Host)</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center md:text-right">
              <span className="text-xs text-slate-400 block uppercase font-bold">Total Pot</span>
              <span className="text-2xl font-black text-emerald-400">
                ${(game.pricePerBox * game.grid.flat().filter(s => s.participantId !== null).length).toLocaleString()}
              </span>
            </div>
            <div className="text-center md:text-right">
              <span className="text-xs text-slate-400 block uppercase font-bold">You</span>
              <span className="text-sm font-bold text-white">{session.name}</span>
            </div>
            <button
              onClick={handleReset}
              className="text-slate-500 hover:text-red-400 transition-colors"
              title="Leave Game"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Share Link (creator only) */}
          {isCreator && (
            <section>
              <ShareLink gameId={gameId} />
            </section>
          )}

          {/* Pending Claims (creator only) */}
          {isCreator && game.pendingClaims.length > 0 && (
            <section>
              <PendingClaimsPanel
                game={game}
                onApprove={approveClaim}
                onApproveAll={approveAllClaims}
                onReject={rejectClaim}
              />
            </section>
          )}

          <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800 shadow-2xl overflow-x-auto">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
              The Grid
              {!isCreator && (
                <span className="text-xs text-slate-500 font-normal ml-2">
                  (Click to claim, click again to undo)
                </span>
              )}
            </h2>

            {/* Numbers not yet revealed message */}
            {game.homeNumbers.length === 0 && (
              <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-400 font-bold text-sm">Numbers Hidden</p>
                    <p className="text-xs text-slate-400">
                      {game.grid.flat().filter(s => s.participantId).length}/100 boxes claimed.
                      {isCreator
                        ? ' You can reveal numbers once all boxes are filled.'
                        : ' Numbers will be revealed when all boxes are claimed.'}
                    </p>
                  </div>
                  {isCreator && game.grid.flat().every(s => s.participantId) && (
                    <button
                      onClick={randomizeNumbers}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition-colors"
                    >
                      Reveal Numbers
                    </button>
                  )}
                </div>
              </div>
            )}

            <BoxGrid
              game={game}
              session={session}
              isCreator={isCreator}
              onBoxClick={handleBoxClick}
            />
          </section>

          <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800 shadow-2xl">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
              Live Game Tracking
              {!isCreator && (
                <span className="text-xs text-slate-500 font-normal ml-2">(View only)</span>
              )}
            </h2>
            <ScoreTracker game={game} onAddScore={handleAddScore} isCreator={isCreator} />
          </section>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800 shadow-2xl">
            <Dashboard game={game} session={session} isCreator={isCreator} />
          </section>
        </div>
      </main>
    </div>
  );
}
