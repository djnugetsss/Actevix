export type SessionLog = {
  /** Supabase row UUID — present after the row is persisted, absent on optimistic entries. */
  id?: string;
  sport: string;
  position: string;
  workoutType: string;
  duration: number;
  intensity: number;
  muscles: string[];
  painAreas: string[];
  painLevel: number;
  painTypes?: string[];
  painNote?: string;
  date: string;
  ts: number;
};
