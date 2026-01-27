import { useEffect, useState, useCallback } from 'react';
import {
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  FirestoreGame,
  GameMode,
  GameStatus,
  Square,
  Participant,
  BoxClaim,
  ClaimStatus,
  ScoreUpdate,
  UserSession,
} from '../types';
import { GRID_SIZE, COLORS } from '../constants';
import { generateUUID } from '../utils';

const GAMES_COLLECTION = 'games';

const generateInitialGrid = (): Square[][] => {
  return Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(null).map(() => ({ participantId: null })));
};

// Firestore doesn't support nested arrays, so we flatten/unflatten the grid
const flattenGrid = (grid: Square[][]): Square[] => {
  return grid.flat();
};

const unflattenGrid = (flat: Square[]): Square[][] => {
  const grid: Square[][] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    grid.push(flat.slice(i * GRID_SIZE, (i + 1) * GRID_SIZE));
  }
  return grid;
};

const shuffle = (array: number[]): number[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export function useFirestore(gameId: string | null, session: UserSession | null) {
  const [game, setGame] = useState<FirestoreGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to game document
  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, GAMES_COLLECTION, gameId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          // Unflatten the grid from Firestore
          const game: FirestoreGame = {
            id: snapshot.id,
            ...data,
            grid: data.grid ? unflattenGrid(data.grid) : generateInitialGrid(),
          } as FirestoreGame;
          setGame(game);
        } else {
          setGame(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [gameId]);

  // Create a new game
  const createGame = useCallback(
    async (config: {
      creatorSession: UserSession;
      homeTeam: string;
      awayTeam: string;
      pricePerBox: number;
      mode: GameMode;
    }): Promise<string> => {
      console.log('createGame: Starting...');
      const newGameId = generateUUID().slice(0, 8);
      const now = Date.now();

      const creatorParticipant: Participant = {
        id: config.creatorSession.id,
        name: config.creatorSession.name,
        color: COLORS[0],
      };

      const newGame = {
        creatorSessionId: config.creatorSession.id,
        creatorName: config.creatorSession.name,
        mode: config.mode,
        homeTeam: config.homeTeam,
        awayTeam: config.awayTeam,
        pricePerBox: config.pricePerBox,
        homeNumbers: [], // Numbers hidden until all boxes claimed
        awayNumbers: [], // Numbers hidden until all boxes claimed
        grid: flattenGrid(generateInitialGrid()), // Flatten for Firestore
        participants: [creatorParticipant],
        scoreHistory: [],
        pendingClaims: [],
        status: GameStatus.OPEN,
        createdAt: now,
        updatedAt: now,
      };

      try {
        console.log('createGame: Writing to Firestore...', newGameId);
        const docRef = doc(db, GAMES_COLLECTION, newGameId);
        await setDoc(docRef, newGame);
        console.log('createGame: Success!');
        return newGameId;
      } catch (err) {
        console.error('createGame: Firestore error:', err);
        throw err;
      }
    },
    []
  );

  // Add participant to game
  const addParticipant = useCallback(
    async (participant: Participant) => {
      if (!gameId || !game) return;

      const docRef = doc(db, GAMES_COLLECTION, gameId);
      await updateDoc(docRef, {
        participants: arrayUnion(participant),
        updatedAt: Date.now(),
      });
    },
    [gameId, game]
  );

  // Submit a box claim (for participants)
  const submitClaim = useCallback(
    async (row: number, col: number) => {
      if (!gameId || !session || !game) return;

      // Check if box is already claimed or has pending claim
      const existingClaim = game.pendingClaims.find(
        (c) => c.row === row && c.col === col && c.status === ClaimStatus.PENDING
      );
      if (existingClaim) return;

      const square = game.grid[row]?.[col];
      if (square?.participantId) return;

      const claim: BoxClaim = {
        id: generateUUID(),
        gameId,
        participantId: session.id,
        participantName: session.name,
        row,
        col,
        status: ClaimStatus.PENDING,
        createdAt: Date.now(),
      };

      const docRef = doc(db, GAMES_COLLECTION, gameId);
      await updateDoc(docRef, {
        pendingClaims: arrayUnion(claim),
        updatedAt: Date.now(),
      });
    },
    [gameId, session, game]
  );

  // Approve a claim (for creator)
  const approveClaim = useCallback(
    async (claim: BoxClaim) => {
      if (!gameId || !game || !session?.isCreator) return;

      // Update grid with the participant
      const newGrid = game.grid.map((row) => row.map((sq) => ({ ...sq })));
      newGrid[claim.row][claim.col] = { participantId: claim.participantId };

      // Remove from pending claims
      const updatedClaims = game.pendingClaims.filter((c) => c.id !== claim.id);

      const docRef = doc(db, GAMES_COLLECTION, gameId);
      await updateDoc(docRef, {
        grid: flattenGrid(newGrid), // Flatten for Firestore
        pendingClaims: updatedClaims,
        updatedAt: Date.now(),
      });
    },
    [gameId, game, session]
  );

  // Reject a claim (for creator)
  const rejectClaim = useCallback(
    async (claim: BoxClaim) => {
      if (!gameId || !game || !session?.isCreator) return;

      const docRef = doc(db, GAMES_COLLECTION, gameId);
      await updateDoc(docRef, {
        pendingClaims: arrayRemove(claim),
        updatedAt: Date.now(),
      });
    },
    [gameId, game, session]
  );

  // Approve all pending claims (for creator)
  const approveAllClaims = useCallback(
    async () => {
      if (!gameId || !game || !session?.isCreator) return;
      if (game.pendingClaims.length === 0) return;

      // Update grid with all pending claims
      const newGrid = game.grid.map((row) => row.map((sq) => ({ ...sq })));
      game.pendingClaims.forEach((claim) => {
        newGrid[claim.row][claim.col] = { participantId: claim.participantId };
      });

      const docRef = doc(db, GAMES_COLLECTION, gameId);
      await updateDoc(docRef, {
        grid: flattenGrid(newGrid),
        pendingClaims: [],
        updatedAt: Date.now(),
      });
    },
    [gameId, game, session]
  );

  // Direct box update (for creator to assign boxes directly)
  const updateBox = useCallback(
    async (row: number, col: number, participantId: string | null) => {
      if (!gameId || !game || !session?.isCreator) return;

      const newGrid = game.grid.map((r) => r.map((sq) => ({ ...sq })));
      newGrid[row][col] = { participantId };

      const docRef = doc(db, GAMES_COLLECTION, gameId);
      await updateDoc(docRef, {
        grid: flattenGrid(newGrid), // Flatten for Firestore
        updatedAt: Date.now(),
      });
    },
    [gameId, game, session]
  );

  // Add/update score (for creator)
  const updateScore = useCallback(
    async (scoreUpdate: ScoreUpdate) => {
      if (!gameId || !game || !session?.isCreator) return;

      // Mode-aware deduplication: by quarter in Traditional mode, by minute in Minute-by-Minute
      const filteredHistory = game.scoreHistory.filter((s) => {
        if (game.mode === GameMode.TRADITIONAL) {
          return s.quarter !== scoreUpdate.quarter;
        } else {
          return s.minute !== scoreUpdate.minute;
        }
      });
      const newHistory = [...filteredHistory, scoreUpdate].sort(
        (a, b) => a.minute - b.minute
      );

      const docRef = doc(db, GAMES_COLLECTION, gameId);
      await updateDoc(docRef, {
        scoreHistory: newHistory,
        status: GameStatus.IN_PROGRESS,
        updatedAt: Date.now(),
      });
    },
    [gameId, game, session]
  );

  // Update game status
  const updateGameStatus = useCallback(
    async (status: GameStatus) => {
      if (!gameId || !session?.isCreator) return;

      const docRef = doc(db, GAMES_COLLECTION, gameId);
      await updateDoc(docRef, {
        status,
        updatedAt: Date.now(),
      });
    },
    [gameId, session]
  );

  // Randomize numbers (called when grid is full)
  const randomizeNumbers = useCallback(
    async () => {
      if (!gameId || !game || !session?.isCreator) return;
      if (game.homeNumbers.length > 0) return; // Already randomized

      const docRef = doc(db, GAMES_COLLECTION, gameId);
      await updateDoc(docRef, {
        homeNumbers: shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
        awayNumbers: shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
        status: GameStatus.LOCKED,
        updatedAt: Date.now(),
      });
    },
    [gameId, game, session]
  );

  return {
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
    updateGameStatus,
    randomizeNumbers,
  };
}
