import type { SessionLog } from '@/types/sessionLog';

export type Player = {
  id: string;
  name: string;
  sport: string;
  position: string;
  number: string;
  logs: SessionLog[];
};

export type Team = {
  id: string;
  name: string;
  coachName: string;
  sport: string;
  players: Player[];
  createdAt: string;
  /** Classroom-style code (e.g. ABC-8K2). Normalized for matching without hyphens. */
  joinCode: string;
};
