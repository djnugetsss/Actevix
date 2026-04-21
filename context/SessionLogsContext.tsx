import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { SessionLog } from '@/types/sessionLog';

type SessionLogsContextValue = {
  logs: SessionLog[];
  addLog: (payload: Omit<SessionLog, 'id' | 'date' | 'ts'>) => void;
  deleteLog: (id: string) => void;
  ready: boolean;
};

const SessionLogsContext = createContext<SessionLogsContextValue | null>(null);

/** Map a raw session_logs row (snake_case) to the SessionLog shape. */
function rowToLog(row: Record<string, unknown>): SessionLog {
  return {
    id: String(row.id ?? ''),
    sport: String(row.sport ?? ''),
    position: String(row.position ?? ''),
    workoutType: String(row.workout_type ?? ''),
    duration: Number(row.duration ?? 0),
    intensity: Number(row.intensity ?? 0),
    muscles: Array.isArray(row.muscles) ? (row.muscles as string[]) : [],
    painAreas: Array.isArray(row.pain_areas) ? (row.pain_areas as string[]) : [],
    painLevel: Number(row.pain_level ?? 0),
    painTypes: Array.isArray(row.pain_types) ? (row.pain_types as string[]) : [],
    painNote: String(row.pain_note ?? ''),
    date: String(row.date ?? ''),
    ts: Number(row.ts ?? 0),
  };
}

export function SessionLogsProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [ready, setReady] = useState(false);

  // Load all logs for the current user on mount.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        setLogs([]);
        setReady(true);
        return;
      }

      const { data, error } = await supabase
        .from('session_logs')
        .select('id, sport, position, workout_type, duration, intensity, muscles, pain_areas, pain_level, pain_types, pain_note, date, ts')
        .eq('user_id', user.id)
        .order('ts', { ascending: false });

      if (cancelled) return;

      if (!error && data) {
        setLogs(data.map((r) => rowToLog(r as Record<string, unknown>)));
      }
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const addLog = useCallback((payload: Omit<SessionLog, 'id' | 'date' | 'ts'>) => {
    const ts = Date.now();
    const entry: SessionLog = {
      ...payload,
      date: new Date(ts).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      ts,
    };

    // Optimistic update — the row appears immediately in the list.
    setLogs((prev) => [entry, ...prev]);

    // Persist in the background; on success, backfill the real id.
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('session_logs')
        .insert({
          user_id: user.id,
          sport: entry.sport,
          position: entry.position,
          workout_type: entry.workoutType,
          duration: entry.duration,
          intensity: entry.intensity,
          muscles: entry.muscles,
          pain_areas: entry.painAreas,
          pain_level: entry.painLevel,
          pain_types: entry.painTypes ?? [],
          pain_note: entry.painNote ?? '',
          date: entry.date,
          ts: entry.ts,
        })
        .select('id')
        .single();

      if (!error && data) {
        setLogs((prev) =>
          prev.map((l) => (l.ts === ts && !l.id ? { ...l, id: String(data.id) } : l))
        );
      }
    })();
  }, []);

  const deleteLog = useCallback((id: string) => {
    // Optimistic removal.
    setLogs((prev) => prev.filter((l) => l.id !== id));

    // Persist in the background.
    (async () => {
      await supabase.from('session_logs').delete().eq('id', id);
    })();
  }, []);

  const value = useMemo(
    () => ({ logs, addLog, deleteLog, ready }),
    [logs, addLog, deleteLog, ready]
  );

  return (
    <SessionLogsContext.Provider value={value}>{children}</SessionLogsContext.Provider>
  );
}

export function useSessionLogs(): SessionLogsContextValue {
  const ctx = useContext(SessionLogsContext);
  if (!ctx) {
    throw new Error('useSessionLogs must be used within SessionLogsProvider');
  }
  return ctx;
}
