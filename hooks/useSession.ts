import { useState, useCallback } from 'react';
import { UserSession } from '../types';
import { generateUUID } from '../utils';

const getStorageKey = (gameId: string) => `sbbox_session_${gameId}`;

export function useSession(gameId: string | null) {
  const [session, setSession] = useState<UserSession | null>(() => {
    if (!gameId) return null;
    const stored = localStorage.getItem(getStorageKey(gameId));
    return stored ? JSON.parse(stored) : null;
  });

  const createSession = useCallback((name: string, isCreator: boolean) => {
    if (!gameId) return null;

    const newSession: UserSession = {
      id: generateUUID(),
      name,
      gameId,
      isCreator,
    };

    localStorage.setItem(getStorageKey(gameId), JSON.stringify(newSession));
    setSession(newSession);
    return newSession;
  }, [gameId]);

  const clearSession = useCallback(() => {
    if (gameId) {
      localStorage.removeItem(getStorageKey(gameId));
    }
    setSession(null);
  }, [gameId]);

  return { session, createSession, clearSession };
}
