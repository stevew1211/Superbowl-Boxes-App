import { useState, useEffect, useCallback } from 'react';
import { fetchLiveScores, LiveGameScore } from '../services/nflScoreService';

interface UseLiveScoresOptions {
  homeTeam?: string;
  awayTeam?: string;
  intervalMs?: number;
}

interface UseLiveScoresResult {
  liveScore: LiveGameScore | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  refresh: () => Promise<void>;
}

export function useLiveScores(
  enabled: boolean,
  options: UseLiveScoresOptions = {}
): UseLiveScoresResult {
  const { homeTeam, awayTeam, intervalMs = 30000 } = options;

  const [liveScore, setLiveScore] = useState<LiveGameScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const fetchScores = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const score = await fetchLiveScores(homeTeam, awayTeam);
      setLiveScore(score);
      setLastFetched(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scores');
    } finally {
      setLoading(false);
    }
  }, [enabled, homeTeam, awayTeam]);

  // Initial fetch when enabled
  useEffect(() => {
    if (enabled) {
      fetchScores();
    } else {
      setLiveScore(null);
      setLastFetched(null);
    }
  }, [enabled, fetchScores]);

  // Polling interval
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(fetchScores, intervalMs);
    return () => clearInterval(interval);
  }, [enabled, intervalMs, fetchScores]);

  return {
    liveScore,
    loading,
    error,
    lastFetched,
    refresh: fetchScores,
  };
}
