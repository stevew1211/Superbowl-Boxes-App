
export enum GameMode {
  TRADITIONAL = 'TRADITIONAL',
  MINUTE_BY_MINUTE = 'MINUTE_BY_MINUTE'
}

export interface Participant {
  id: string;
  name: string;
  color: string;
}

export interface Square {
  participantId: string | null;
}

export interface ScoreUpdate {
  minute: number; // 1 to 60
  homeScore: number;
  awayScore: number;
  quarter?: 1 | 2 | 3 | 4;
}

export interface GameState {
  mode: GameMode;
  homeTeam: string;
  awayTeam: string;
  pricePerBox: number;
  homeNumbers: number[];
  awayNumbers: number[];
  grid: Square[][];
  participants: Participant[];
  scoreHistory: ScoreUpdate[];
}

export interface PayoutSummary {
  participantId: string;
  participantName: string;
  totalOwed: number;
  winCount: number;
}
