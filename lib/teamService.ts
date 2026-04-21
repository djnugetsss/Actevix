import leoProfanity from 'leo-profanity';

import { generateJoinCode } from './joinCode';
import { supabase } from './supabase';
import type { SessionLog } from '@/types/sessionLog';
import { computeScoresFromLogs, overallFatigue } from './wearTear';

export type MemberRole = 'owner' | 'captain' | 'member';

export type TeamRow = {
  id: string;
  name: string;
  code: string;
  owner_id: string;
  created_at: string;
};

export type MemberRow = {
  id: string;
  team_id: string;
  user_id: string;
  joined_at: string;
  role: MemberRole;
  name?: string;
  fatigueScore: number | null;
};

/** Normalise a raw session_logs row (snake_case DB cols) into the SessionLog shape. */
function toSessionLog(raw: Record<string, unknown>): SessionLog {
  return {
    sport: String(raw.sport ?? ''),
    position: String(raw.position ?? ''),
    workoutType: String(raw.workout_type ?? raw.workoutType ?? ''),
    duration: Number(raw.duration ?? 0),
    intensity: Number(raw.intensity ?? 0),
    muscles: Array.isArray(raw.muscles) ? (raw.muscles as string[]) : [],
    painAreas: Array.isArray(raw.pain_areas)
      ? (raw.pain_areas as string[])
      : Array.isArray(raw.painAreas)
        ? (raw.painAreas as string[])
        : [],
    painLevel: Number(raw.pain_level ?? raw.painLevel ?? 0),
    date: String(raw.date ?? ''),
    ts: Number(raw.ts ?? 0),
  };
}

export type TeamWithMembers = {
  team: TeamRow;
  members: MemberRow[];
  isOwner: boolean;
  isCaptain: boolean;
  userId: string;
};

export const TEAM_CAP = 25;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateTeamName(
  name: string
): { ok: true; cleaned: string } | { error: 'invalid' | 't_long' | 'profanity' } {
  const cleaned = name.trim();
  if (cleaned.length < 2 || /^\d+$/.test(cleaned)) return { error: 'invalid' };
  if (cleaned.length > 30) return { error: 't_long' };
  if (leoProfanity.check(cleaned)) return { error: 'profanity' };
  return { ok: true, cleaned };
}

// ---------------------------------------------------------------------------
// Create / Join / Leave
// ---------------------------------------------------------------------------

export async function createTeam(
  name: string
): Promise<{ data: TeamRow } | { error: 'already_owns_team' | 'not_authenticated' | string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log('[createTeam] auth user:', user?.id ?? 'NO SESSION');
  if (!user) return { error: 'not_authenticated' };

  const { data: existing, error: existingErr } = await supabase
    .from('teams')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();
  console.log('[createTeam] existing-team check:', { existing, existingErr });

  if (existing) return { error: 'already_owns_team' };

  const code = generateJoinCode(new Set<string>()).replace(/-/g, '');

  const { data: team, error: teamErr } = await supabase
    .from('teams')
    .insert({ name: name.trim(), owner_id: user.id, code })
    .select()
    .single();
  console.log('[createTeam] insert team:', { team, teamErr });

  if (teamErr || !team) return { error: teamErr?.message ?? 'Failed to create team' };

  const { error: memberErr } = await supabase
    .from('team_members')
    .insert({ team_id: team.id, user_id: user.id, role: 'owner' });
  console.log('[createTeam] insert member:', { memberErr });

  if (memberErr) return { error: memberErr.message };

  return { data: team };
}

export async function joinTeam(
  code: string
): Promise<
  | { data: TeamRow }
  | {
      error:
        | 'team_not_found'
        | 'already_in_team'
        | 'team_full'
        | 'not_authenticated'
        | string;
    }
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  const normalized = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('code', normalized)
    .maybeSingle();

  if (!team) return { error: 'team_not_found' };

  const { data: existing } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', team.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) return { error: 'already_in_team' };

  // Cap check
  const { count } = await supabase
    .from('team_members')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', team.id);

  if ((count ?? 0) >= TEAM_CAP) return { error: 'team_full' };

  const { error: memberErr } = await supabase
    .from('team_members')
    .insert({ team_id: team.id, user_id: user.id, role: 'member' });

  if (memberErr) return { error: memberErr.message };

  return { data: team };
}

export async function getMyTeam(): Promise<TeamWithMembers | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberRow } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!memberRow) return null;

  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('id', memberRow.team_id)
    .single();

  if (!team) return null;

  const { data: members } = await supabase
    .from('team_members')
    .select('id, team_id, user_id, joined_at, role')
    .eq('team_id', team.id);

  const userIds = (members ?? []).map((m) => m.user_id);
  const profileMap: Record<string, string> = {};
  const logsMap: Record<string, SessionLog[]> = {};

  if (userIds.length > 0) {
    const [profilesResult, logsResult] = await Promise.all([
      supabase.from('profiles').select('id, name').in('id', userIds),
      supabase
        .from('session_logs')
        .select('*')
        .in('user_id', userIds)
        .order('ts', { ascending: false })
        .limit(50),
    ]);

    if (profilesResult.data) {
      for (const p of profilesResult.data) profileMap[p.id] = p.name ?? '';
    }
    if (logsResult.data) {
      for (const raw of logsResult.data) {
        const uid = String(raw.user_id);
        if (!logsMap[uid]) logsMap[uid] = [];
        logsMap[uid].push(toSessionLog(raw as Record<string, unknown>));
      }
    }
  }

  const enrichedMembers: MemberRow[] = (members ?? []).map((m) => {
    const memberLogs = logsMap[m.user_id] ?? [];
    let fatigueScore: number | null = null;
    if (memberLogs.length > 0) {
      const scores = computeScoresFromLogs(memberLogs);
      const raw = Math.round(overallFatigue(scores) * 10);
      fatigueScore = raw > 0 ? raw : null;
    }
    return {
      ...m,
      role: (m.role as MemberRole) ?? 'member',
      name: profileMap[m.user_id] || undefined,
      fatigueScore,
    };
  });

  const myRow = enrichedMembers.find((m) => m.user_id === user.id);

  return {
    team,
    members: enrichedMembers,
    isOwner: team.owner_id === user.id,
    isCaptain: myRow?.role === 'captain',
    userId: user.id,
  };
}

export async function leaveTeam(): Promise<{ error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  const { data: memberRow } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!memberRow) return {};

  const { data: team } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', memberRow.team_id)
    .single();

  if (team?.owner_id === user.id) {
    const { error } = await supabase.from('teams').delete().eq('id', memberRow.team_id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', memberRow.team_id)
      .eq('user_id', user.id);
    if (error) return { error: error.message };
  }

  return {};
}

// ---------------------------------------------------------------------------
// Member management
// ---------------------------------------------------------------------------

export async function kickMember(
  teamId: string,
  targetUserId: string
): Promise<{ error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  const { data: callerRow } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single();

  if (!callerRow) return { error: 'not_member' };

  const { data: targetRow } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', targetUserId)
    .single();

  if (!targetRow) return { error: 'target_not_found' };

  // Captains can only kick plain members
  if (callerRow.role === 'captain' && targetRow.role !== 'member') {
    return { error: 'not_authorized' };
  }
  if (callerRow.role === 'member') {
    return { error: 'not_authorized' };
  }

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', targetUserId);

  if (error) return { error: error.message };
  return {};
}

export async function promoteMember(
  teamId: string,
  targetUserId: string
): Promise<{ error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  const { data: team } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', teamId)
    .single();

  if (!team || team.owner_id !== user.id) return { error: 'not_owner' };

  const { error } = await supabase
    .from('team_members')
    .update({ role: 'captain' })
    .eq('team_id', teamId)
    .eq('user_id', targetUserId);

  if (error) return { error: error.message };
  return {};
}

export async function demoteMember(
  teamId: string,
  targetUserId: string
): Promise<{ error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  const { data: team } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', teamId)
    .single();

  if (!team || team.owner_id !== user.id) return { error: 'not_owner' };

  const { error } = await supabase
    .from('team_members')
    .update({ role: 'member' })
    .eq('team_id', teamId)
    .eq('user_id', targetUserId);

  if (error) return { error: error.message };
  return {};
}

// ---------------------------------------------------------------------------
// Code rotation
// ---------------------------------------------------------------------------

export async function rotateCode(
  teamId: string
): Promise<{ data: string } | { error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  const { data: team } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', teamId)
    .single();

  if (!team || team.owner_id !== user.id) return { error: 'not_owner' };

  const { error: rpcErr } = await supabase.rpc('rotate_team_code', { team_id: teamId });
  if (rpcErr) return { error: rpcErr.message };

  const { data: updated } = await supabase
    .from('teams')
    .select('code')
    .eq('id', teamId)
    .single();

  if (!updated) return { error: 'Failed to fetch new code' };
  return { data: updated.code };
}
