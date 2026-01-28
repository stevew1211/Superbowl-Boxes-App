
export enum GameMode {
  TRADITIONAL = 'TRADITIONAL',
  MINUTE_BY_MINUTE = 'MINUTE_BY_MINUTE'
}

export enum ClaimStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum GameStatus {
  SETUP = 'SETUP',
  OPEN = 'OPEN',
  LOCKED = 'LOCKED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
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

export interface PayoutDistribution {
  Q1: number;
  HALFTIME: number;
  Q3: number;
  FINAL: number;
}

export interface BoxClaim {
  id: string;
  gameId: string;
  participantId: string;
  participantName: string;
  row: number;
  col: number;
  status: ClaimStatus;
  createdAt: number;
}

export interface UserSession {
  id: string;
  name: string;
  gameId: string;
  isCreator: boolean;
}

export interface FirestoreGame {
  id: string;
  creatorSessionId: string;
  creatorName: string;
  mode: GameMode;
  homeTeam: string;
  awayTeam: string;
  pricePerBox: number;
  payoutDistribution?: PayoutDistribution; // Custom payout % for Traditional mode
  instructions?: string; // Custom instructions from host (e.g., payment info)
  homeNumbers: number[];
  awayNumbers: number[];
  grid: Square[][];
  participants: Participant[];
  scoreHistory: ScoreUpdate[];
  pendingClaims: BoxClaim[];
  status: GameStatus;
  createdAt: number;
  updatedAt: number;
}
