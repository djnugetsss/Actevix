import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { formatJoinCodeDisplay, generateJoinCode, normalizeJoinCode } from '@/lib/joinCode';
import type { Player, Team } from '@/types/team';
import type { SessionLog } from '@/types/sessionLog';

const REGISTRY_KEY = 'actevix_team_registry';
const LEGACY_KEY = 'actevix_team';

type Registry = {
  teams: Team[];
  activeTeamId: string | null;
};

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseLegacyTeam(raw: string | null): Team | null {
  if (!raw) return null;
  try {
    const t = JSON.parse(raw) as Team & { joinCode?: string };
    if (t && typeof t === 'object' && Array.isArray(t.players)) {
      const taken = new Set<string>();
      const joinCode =
        t.joinCode && normalizeJoinCode(t.joinCode)
          ? formatJoinCodeDisplay(normalizeJoinCode(t.joinCode))
          : generateJoinCode(taken);
      return { ...t, joinCode };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function ensureJoinCodes(teams: Team[]): Team[] {
  const taken = new Set<string>();
  for (const t of teams) {
    const n = t.joinCode ? normalizeJoinCode(t.joinCode) : '';
    if (n.length >= 5) taken.add(n);
  }
  return teams.map((t) => {
    const n = t.joinCode ? normalizeJoinCode(t.joinCode) : '';
    if (n.length >= 5) return { ...t, joinCode: formatJoinCodeDisplay(n) };
    return { ...t, joinCode: generateJoinCode(taken) };
  });
}

function parseRegistry(raw: string | null): Registry | null {
  if (!raw) return null;
  try {
    const r = JSON.parse(raw) as Registry;
    if (r && Array.isArray(r.teams)) {
      const teams = ensureJoinCodes(r.teams);
      const active =
        r.activeTeamId && teams.some((t) => t.id === r.activeTeamId)
          ? r.activeTeamId
          : teams[0]?.id ?? null;
      return { teams, activeTeamId: active };
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function loadRegistry(): Promise<Registry> {
  const regRaw = await AsyncStorage.getItem(REGISTRY_KEY);
  const parsed = parseRegistry(regRaw);
  if (parsed) return parsed;

  const legacy = await AsyncStorage.getItem(LEGACY_KEY);
  const legacyTeam = parseLegacyTeam(legacy);
  if (legacyTeam) {
    const reg: Registry = { teams: [legacyTeam], activeTeamId: legacyTeam.id };
    await AsyncStorage.setItem(REGISTRY_KEY, JSON.stringify(reg));
    await AsyncStorage.removeItem(LEGACY_KEY);
    return reg;
  }

  return { teams: [], activeTeamId: null };
}

type JoinResult = { ok: true } | { ok: false; message: string };

type TeamContextValue = {
  /** Currently selected team (roster you’re viewing). */
  team: Team | null;
  allTeams: Team[];
  ready: boolean;
  createTeam: (payload: { name: string; coachName: string; sport: string }) => void;
  joinTeamByCode: (code: string) => JoinResult;
  regenerateJoinCode: () => void;
  /** Stop viewing this team; roster stays on device (re-open with join code). */
  leaveActiveTeam: () => void;
  updateTeamName: (name: string) => void;
  addPlayer: (player: Omit<Player, 'id' | 'logs'> & { id?: string; logs?: SessionLog[] }) => void;
  removePlayer: (id: string) => void;
  appendPlayerLog: (playerId: string, payload: Omit<SessionLog, 'date' | 'ts'>) => void;
  /** Remove the active team from this device entirely. */
  resetTeam: () => void;
};

const TeamContext = createContext<TeamContextValue | null>(null);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [registry, setRegistry] = useState<Registry>({ teams: [], activeTeamId: null });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const reg = await loadRegistry();
      if (!cancelled) setRegistry(reg);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      try {
        if (registry.teams.length === 0) {
          await AsyncStorage.removeItem(REGISTRY_KEY);
        } else {
          await AsyncStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
        }
      } catch {
        /* ignore */
      }
    })();
  }, [registry, ready]);

  const team = useMemo(() => {
    if (!registry.activeTeamId) return null;
    return registry.teams.find((t) => t.id === registry.activeTeamId) ?? null;
  }, [registry]);

  const createTeam = useCallback((payload: { name: string; coachName: string; sport: string }) => {
    setRegistry((r) => {
      const taken = new Set(r.teams.map((t) => normalizeJoinCode(t.joinCode)));
      const joinCode = generateJoinCode(taken);
      const newTeam: Team = {
        id: makeId(),
        name: payload.name.trim(),
        coachName: payload.coachName.trim(),
        sport: payload.sport,
        players: [],
        joinCode,
        createdAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      };
      return { teams: [...r.teams, newTeam], activeTeamId: newTeam.id };
    });
  }, []);

  const joinTeamByCode = useCallback((code: string): JoinResult => {
    const norm = normalizeJoinCode(code);
    if (norm.length < 5) {
      return { ok: false, message: 'Enter the full join code (e.g. ABC-8K2).' };
    }
    let matched = false;
    setRegistry((r) => {
      const found = r.teams.find((t) => normalizeJoinCode(t.joinCode) === norm);
      if (!found) return r;
      matched = true;
      return { ...r, activeTeamId: found.id };
    });
    if (matched) return { ok: true };
    return {
      ok: false,
      message:
        'No team with that code is on this device yet. The coach must create the team here first, or you’ll need sync when we add accounts.',
    };
  }, []);

  const regenerateJoinCode = useCallback(() => {
    setRegistry((r) => {
      const id = r.activeTeamId;
      if (!id) return r;
      const taken = new Set(
        r.teams.filter((t) => t.id !== id).map((t) => normalizeJoinCode(t.joinCode))
      );
      const joinCode = generateJoinCode(taken);
      return {
        ...r,
        teams: r.teams.map((t) => (t.id === id ? { ...t, joinCode } : t)),
      };
    });
  }, []);

  const leaveActiveTeam = useCallback(() => {
    setRegistry((r) => ({ ...r, activeTeamId: null }));
  }, []);

  const updateTeamName = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setRegistry((r) => {
      const id = r.activeTeamId;
      if (!id) return r;
      return {
        ...r,
        teams: r.teams.map((t) => (t.id === id ? { ...t, name: trimmed } : t)),
      };
    });
  }, []);

  const addPlayer = useCallback(
    (player: Omit<Player, 'id' | 'logs'> & { id?: string; logs?: SessionLog[] }) => {
      setRegistry((r) => {
        const id = r.activeTeamId;
        if (!id) return r;
        const p: Player = {
          id: player.id ?? makeId(),
          name: player.name.trim(),
          sport: player.sport,
          position: player.position,
          number: player.number,
          logs: player.logs ?? [],
        };
        return {
          ...r,
          teams: r.teams.map((t) => (t.id === id ? { ...t, players: [...t.players, p] } : t)),
        };
      });
    },
    []
  );

  const removePlayer = useCallback((pid: string) => {
    setRegistry((r) => {
      const id = r.activeTeamId;
      if (!id) return r;
      return {
        ...r,
        teams: r.teams.map((t) =>
          t.id === id ? { ...t, players: t.players.filter((p) => p.id !== pid) } : t
        ),
      };
    });
  }, []);

  const appendPlayerLog = useCallback((playerId: string, payload: Omit<SessionLog, 'date' | 'ts'>) => {
    const entry: SessionLog = {
      ...payload,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      ts: Date.now(),
    };
    setRegistry((r) => {
      const id = r.activeTeamId;
      if (!id) return r;
      return {
        ...r,
        teams: r.teams.map((t) =>
          t.id === id
            ? {
                ...t,
                players: t.players.map((p) =>
                  p.id === playerId
                    ? { ...p, logs: [entry, ...(p.logs || [])].slice(0, 30) }
                    : p
                ),
              }
            : t
        ),
      };
    });
  }, []);

  const resetTeam = useCallback(() => {
    setRegistry((r) => {
      const id = r.activeTeamId;
      if (!id) return r;
      const rest = r.teams.filter((t) => t.id !== id);
      return {
        teams: rest,
        activeTeamId: rest[0]?.id ?? null,
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      team,
      allTeams: registry.teams,
      ready,
      createTeam,
      joinTeamByCode,
      regenerateJoinCode,
      leaveActiveTeam,
      updateTeamName,
      addPlayer,
      removePlayer,
      appendPlayerLog,
      resetTeam,
    }),
    [
      team,
      registry.teams,
      ready,
      createTeam,
      joinTeamByCode,
      regenerateJoinCode,
      leaveActiveTeam,
      updateTeamName,
      addPlayer,
      removePlayer,
      appendPlayerLog,
      resetTeam,
    ]
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam(): TeamContextValue {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
}
