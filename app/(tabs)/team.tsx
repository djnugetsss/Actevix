import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { SkeletonBlock } from '@/components/SkeletonBlock';
import { formatJoinCodeDisplay } from '@/lib/joinCode';
import {
  createTeam,
  demoteMember,
  getMyTeam,
  joinTeam,
  kickMember,
  leaveTeam,
  promoteMember,
  rotateCode,
  TEAM_CAP,
  validateTeamName,
} from '@/lib/teamService';
import type { MemberRole, MemberRow, TeamWithMembers } from '@/lib/teamService';

type SubView = 'empty' | 'create' | 'join';

function fatigueColor(score: number): string {
  if (score < 40) return '#1D9E75'; // fresh → actevix-teal
  if (score < 70) return '#F59E0B'; // moderate → amber
  return '#ef4444';                 // high risk → red
}

function RoleBadge({ role }: { role: MemberRole }) {
  if (role === 'owner') {
    return (
      <View className="self-start rounded-full border border-actevix-teal/50 bg-actevix-teal/10 px-2 py-0.5">
        <Text className="font-body-medium text-[10px] text-actevix-teal">Owner</Text>
      </View>
    );
  }
  if (role === 'captain') {
    return (
      <View className="self-start rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5">
        <Text className="font-body-medium text-[10px] text-amber-400">Captain</Text>
      </View>
    );
  }
  return null;
}

export default function TeamTab() {
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<TeamWithMembers | null>(null);
  const [subView, setSubView] = useState<SubView>('empty');

  // Create form
  const [teamName, setTeamName] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // Join form
  const [codeInput, setCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  const loadTeam = useCallback(async () => {
    setLoading(true);
    const data = await getMyTeam();
    setTeamData(data);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => {
    loadTeam();
  }, [loadTeam]));

  // Validate team name and set error message, returns cleaned name or null
  const runNameValidation = useCallback((raw: string): string | null => {
    if (!raw.trim()) {
      setCreateError('Enter a team name.');
      return null;
    }
    const result = validateTeamName(raw);
    if ('error' in result) {
      if (result.error === 't_long') setCreateError('Name must be 30 characters or fewer.');
      else if (result.error === 'profanity') setCreateError('Please choose a different name.');
      else setCreateError('Name must be 2–30 characters and not all numbers.');
      return null;
    }
    setCreateError('');
    return result.cleaned;
  }, []);

  const handleCreate = useCallback(async () => {
    const cleaned = runNameValidation(teamName);
    if (!cleaned) return;
    setCreating(true);
    const result = await createTeam(cleaned);
    setCreating(false);
    if ('error' in result) {
      setCreateError(
        result.error === 'already_owns_team'
          ? 'You already own a team. Leave it first.'
          : `Error: ${result.error}`
      );
      return;
    }
    setTeamName('');
    await loadTeam();
  }, [teamName, runNameValidation, loadTeam]);

  const handleJoin = useCallback(async () => {
    if (!codeInput.trim()) {
      setJoinError('Enter the join code.');
      return;
    }
    setJoining(true);
    const result = await joinTeam(codeInput.trim());
    setJoining(false);
    if ('error' in result) {
      if (result.error === 'team_not_found') setJoinError('No team found with that code.');
      else if (result.error === 'already_in_team') setJoinError("You're already a member of this team.");
      else if (result.error === 'team_full') setJoinError(`This team is full (${TEAM_CAP} members max).`);
      else setJoinError('Something went wrong. Try again.');
      return;
    }
    setCodeInput('');
    await loadTeam();
  }, [codeInput, loadTeam]);

  const handleLeave = useCallback(async () => {
    const { error } = await leaveTeam();
    if (error) {
      Alert.alert('Error', 'Could not complete. Try again.');
      return;
    }
    setTeamData(null);
  }, []);

  const confirmLeave = useCallback(
    (isOwner: boolean) => {
      const title = isOwner ? 'Delete team?' : 'Leave team?';
      const message = isOwner
        ? 'This will permanently delete the team and remove all members.'
        : 'You will be removed from this team.';
      const label = isOwner ? 'Delete' : 'Leave';
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) {
          handleLeave();
        }
        return;
      }
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: label, style: 'destructive', onPress: handleLeave },
      ]);
    },
    [handleLeave]
  );

  const openMemberMenu = useCallback(
    (member: MemberRow, teamId: string, isOwner: boolean) => {
      const displayName = member.name ?? 'this member';
      const buttons: { text: string; style?: 'cancel' | 'destructive' | 'default'; onPress?: () => void }[] = [];

      if (isOwner) {
        if (member.role === 'member') {
          buttons.push({
            text: 'Promote to Captain',
            onPress: async () => {
              const { error } = await promoteMember(teamId, member.user_id);
              if (error) Alert.alert('Error', 'Could not promote. Try again.');
              else await loadTeam();
            },
          });
        }
        if (member.role === 'captain') {
          buttons.push({
            text: 'Demote to Member',
            onPress: async () => {
              const { error } = await demoteMember(teamId, member.user_id);
              if (error) Alert.alert('Error', 'Could not demote. Try again.');
              else await loadTeam();
            },
          });
        }
      }

      buttons.push({
        text: 'Kick',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            `Kick ${displayName}?`,
            'They will be removed from the team.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Kick',
                style: 'destructive',
                onPress: async () => {
                  const { error } = await kickMember(teamId, member.user_id);
                  if (error) Alert.alert('Error', 'Could not kick member. Try again.');
                  else await loadTeam();
                },
              },
            ]
          );
        },
      });

      buttons.push({ text: 'Cancel', style: 'cancel' });

      Alert.alert(member.name ?? 'Member', undefined, buttons);
    },
    [loadTeam]
  );

  const handleRotateCode = useCallback(
    (teamId: string) => {
      Alert.alert(
        'Rotate join code?',
        'The current code will stop working. Share the new one with your team.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Rotate',
            onPress: async () => {
              const result = await rotateCode(teamId);
              if ('error' in result) {
                Alert.alert('Error', 'Could not rotate code. Try again.');
                return;
              }
              await loadTeam();
            },
          },
        ]
      );
    },
    [loadTeam]
  );

  // Loading skeleton
  if (loading) {
    return (
      <ScrollView
        className="flex-1 bg-actevix-bg"
        contentContainerClassName="px-4 pb-28 pt-4"
        scrollEnabled={false}>
        <View className="mb-4 rounded-2xl border border-actevix-border bg-actevix-surface p-4">
          <SkeletonBlock width="55%" height={24} borderRadius={8} />
          <View className="mt-2">
            <SkeletonBlock width="38%" height={14} borderRadius={6} />
          </View>
        </View>
        {[0, 1, 2].map((i) => (
          <View key={i} className="mb-3">
            <SkeletonBlock width="100%" height={64} borderRadius={12} />
          </View>
        ))}
      </ScrollView>
    );
  }

  // Create form
  if (!teamData && subView === 'create') {
    return (
      <ScrollView
        className="flex-1 bg-actevix-bg"
        contentContainerClassName="px-5 pb-28 pt-8"
        keyboardShouldPersistTaps="handled">
        <Pressable
          onPress={() => {
            setSubView('empty');
            setTeamName('');
            setCreateError('');
          }}
          className="mb-6 self-start">
          <Text className="font-body text-sm text-actevix-teal">← Back</Text>
        </Pressable>
        <Text className="mb-6 font-heading text-2xl text-white">Create a Team</Text>

        <Text className="mb-1 font-body-medium text-sm text-white/70">Team name *</Text>
        <TextInput
          className={`rounded-xl border bg-actevix-surface px-3 py-3 font-body text-base text-white ${
            createError ? 'border-red-500/60' : 'border-actevix-border'
          }`}
          placeholder="e.g. Granada Hills JV"
          placeholderTextColor="#6B7280"
          value={teamName}
          onChangeText={(t) => {
            setTeamName(t);
            if (createError) setCreateError('');
          }}
          onBlur={() => {
            if (teamName.trim()) runNameValidation(teamName);
          }}
        />
        {!!createError && (
          <Text className="mt-2 font-body text-sm text-red-400">{createError}</Text>
        )}

        <Pressable
          disabled={creating}
          onPress={handleCreate}
          className="mt-5 items-center rounded-xl bg-actevix-teal py-4 active:opacity-90">
          <Text className="font-heading-semibold text-base text-actevix-bg">
            {creating ? 'Creating…' : 'Create team →'}
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  // Join form
  if (!teamData && subView === 'join') {
    return (
      <ScrollView
        className="flex-1 bg-actevix-bg"
        contentContainerClassName="px-5 pb-28 pt-8"
        keyboardShouldPersistTaps="handled">
        <Pressable
          onPress={() => {
            setSubView('empty');
            setCodeInput('');
            setJoinError('');
          }}
          className="mb-6 self-start">
          <Text className="font-body text-sm text-actevix-teal">← Back</Text>
        </Pressable>
        <Text className="mb-6 font-heading text-2xl text-white">Join a Team</Text>

        <Text className="mb-1 font-body-medium text-sm text-white/70">6-character join code</Text>
        <TextInput
          className={`rounded-xl border bg-actevix-surface px-3 py-3 font-body text-base text-white tracking-widest ${
            joinError ? 'border-red-500/60' : 'border-actevix-border'
          }`}
          placeholder="ABC-123"
          placeholderTextColor="#6B7280"
          value={codeInput}
          onChangeText={(t) => {
            setCodeInput(t.toUpperCase());
            setJoinError('');
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={7}
        />
        {!!joinError && (
          <Text className="mt-2 font-body text-sm text-red-400">{joinError}</Text>
        )}

        <Pressable
          disabled={joining}
          onPress={handleJoin}
          className="mt-5 items-center rounded-xl border border-actevix-blue/50 bg-actevix-blue/15 py-4 active:opacity-90">
          <Text className="font-heading-semibold text-base text-actevix-blue">
            {joining ? 'Joining…' : 'Join team →'}
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  // Empty state
  if (!teamData) {
    return (
      <View className="flex-1 bg-actevix-bg">
        <EmptyState
          icon="👥"
          title="No team yet"
          subtitle="Create a team and share the join code, or enter a code from your coach."
          actionLabel="Create a Team"
          onAction={() => setSubView('create')}
        />
        <Pressable onPress={() => setSubView('join')} className="mt-2 self-center px-6 py-2">
          <Text className="font-body text-sm text-actevix-blue">Join with a code</Text>
        </Pressable>
      </View>
    );
  }

  // On a team
  const { team, members, isOwner, isCaptain, userId } = teamData;
  const displayCode = formatJoinCodeDisplay(team.code);
  const canSeeCode = isOwner || isCaptain;

  const sortedMembers = [...members].sort((a, b) => {
    if (a.fatigueScore === null && b.fatigueScore === null) return 0;
    if (a.fatigueScore === null) return 1;
    if (b.fatigueScore === null) return -1;
    return b.fatigueScore - a.fatigueScore;
  });

  return (
    <ScrollView className="flex-1 bg-actevix-bg" contentContainerClassName="px-4 pb-28 pt-4">
      {/* Header */}
      <View className="mb-4 rounded-2xl border border-actevix-border bg-actevix-surface p-4">
        <Text className="font-heading-semibold text-xl text-white">{team.name}</Text>
        <Text className="mt-1 font-body text-xs text-white/50">
          {members.length} / {TEAM_CAP} members
          {isOwner ? ' · Owner' : isCaptain ? ' · Captain' : ''}
        </Text>
      </View>

      {/* Join code — visible to owner and captains */}
      {canSeeCode && (
        <View className="mb-4 rounded-2xl border border-actevix-blue/35 bg-actevix-bg/80 p-4">
          <Text className="mb-1 font-body-medium text-xs uppercase tracking-wider text-actevix-blue">
            Team join code
          </Text>
          <Text className="mb-3 font-body text-xs text-white/50">
            Share this with teammates so they can join.
          </Text>
          <Text className="mb-3 text-center font-heading text-2xl tracking-[0.2em] text-white">
            {displayCode}
          </Text>
          <Pressable
            onPress={async () => {
              await Clipboard.setStringAsync(displayCode);
              Alert.alert('Copied', 'Join code copied to clipboard.');
            }}
            className="mb-2 items-center rounded-xl bg-actevix-teal py-3 active:opacity-90">
            <Text className="font-heading-semibold text-actevix-bg">Copy code</Text>
          </Pressable>
          {isOwner && (
            <Pressable
              onPress={() => handleRotateCode(team.id)}
              className="items-center rounded-xl border border-actevix-border bg-actevix-surface py-3 active:opacity-80">
              <Text className="font-body-medium text-sm text-white/70">Rotate code</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Fatigue cards */}
      <Text className="mb-3 font-heading-semibold text-base text-white">Roster</Text>
      {sortedMembers.map((member) => {
        const isSelf = member.user_id === userId;
        const canManage =
          !isSelf && (isOwner || (isCaptain && member.role === 'member'));
        const score = member.fatigueScore;
        const color = score !== null ? fatigueColor(score) : '#6B7280';

        return (
          <View
            key={member.id}
            className="mb-3 rounded-xl border border-actevix-border bg-actevix-surface p-4">
            {/* Main row */}
            <View className="mb-3 flex-row items-center gap-3">
              {/* Avatar */}
              <View
                className="h-11 w-11 items-center justify-center rounded-full border-2"
                style={{ borderColor: color, backgroundColor: `${color}22` }}>
                <Text className="font-heading-semibold text-base" style={{ color }}>
                  {(member.name ?? 'U').charAt(0).toUpperCase()}
                </Text>
              </View>

              {/* Name + role badge */}
              <View className="min-w-0 flex-1 gap-1">
                <Text className="font-body-medium text-sm text-white" numberOfLines={1}>
                  {member.name ?? 'Team member'}
                  {isSelf ? ' (you)' : ''}
                </Text>
                <RoleBadge role={member.role} />
              </View>

              {/* Fatigue score */}
              <View className="items-end">
                {score !== null ? (
                  <>
                    <Text
                      className="font-heading-semibold text-2xl"
                      style={{ color }}>
                      {score}
                    </Text>
                    <Text className="font-body text-[10px] text-white/40">/ 100</Text>
                  </>
                ) : (
                  <Text className="font-body text-sm text-white/35">No data</Text>
                )}
              </View>

              {/* Management "..." button */}
              {canManage && (
                <Pressable
                  onPress={() => openMemberMenu(member, team.id, isOwner)}
                  className="ml-1 px-2 py-1 active:opacity-60">
                  <Text className="font-body-medium text-base text-white/40">···</Text>
                </Pressable>
              )}
            </View>

            {/* Progress bar */}
            <View className="h-1.5 overflow-hidden rounded-full bg-actevix-border">
              {score !== null && (
                <View
                  className="h-full rounded-full"
                  style={{ width: `${score}%`, backgroundColor: color }}
                />
              )}
            </View>
          </View>
        );
      })}

      {/* Leave / Delete */}
      <View className="items-center">
        <Pressable
          onPress={() => confirmLeave(isOwner)}
          className={`rounded-lg border px-8 py-3 active:opacity-80 ${
            isOwner ? 'border-red-500/30 bg-red-500/10' : 'border-actevix-border'
          }`}>
          <Text
            className={`font-body-medium text-sm ${isOwner ? 'text-red-400' : 'text-white/70'}`}>
            {isOwner ? 'Delete team' : 'Leave team'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
