import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { SessionLog } from '@/types/sessionLog';

const STORAGE_KEY = 'actevix_logs';

type SessionLogsContextValue = {
  logs: SessionLog[];
  addLog: (payload: Omit<SessionLog, 'date' | 'ts'>) => void;
  ready: boolean;
};

const SessionLogsContext = createContext<SessionLogsContextValue | null>(null);

export function SessionLogsProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as SessionLog[];
          if (Array.isArray(parsed)) setLogs(parsed);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs)).catch(() => {});
  }, [logs, ready]);

  const addLog = useCallback((payload: Omit<SessionLog, 'date' | 'ts'>) => {
    const entry: SessionLog = {
      ...payload,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      ts: Date.now(),
    };
    setLogs((prev) => [entry, ...prev].slice(0, 30));
  }, []);

  const value = useMemo(
    () => ({ logs, addLog, ready }),
    [logs, addLog, ready]
  );

  return <SessionLogsContext.Provider value={value}>{children}</SessionLogsContext.Provider>;
}

export function useSessionLogs(): SessionLogsContextValue {
  const ctx = useContext(SessionLogsContext);
  if (!ctx) {
    throw new Error('useSessionLogs must be used within SessionLogsProvider');
  }
  return ctx;
}
