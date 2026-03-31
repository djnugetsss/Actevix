import Slider from '@react-native-community/slider';
import * as Clipboard from 'expo-clipboard';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useTeam } from '@/context/TeamContext';
import { POSITIONS_BY_SPORT } from '@/lib/teamPositions';
import { getTeamLoadLabel, getTeamRisk } from '@/lib/teamMetrics';
import {
  computeScores,
  getScoreColor,
  MUSCLE_GROUPS,
  overallFatigue,
  SPORTS,
  topStressMuscle,
  WORKOUT_TYPES,
} from '@/lib/wearTear';
import type { Player } from '@/types/team';
import type { SessionLog } from '@/types/sessionLog';

function confirmAction(
  title: string,
  message: string,
  options: {
    confirmLabel: string;
    destructive?: boolean;
    onConfirm: () => void;
  }
) {
  const { confirmLabel, destructive, onConfirm } = options;
  if (Platform.OS === 'web') {
    const ok =
      typeof globalThis !== 'undefined' &&
      typeof window !== 'undefined' &&
      window.confirm(`${title}\n\n${message}`);
    if (ok) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: confirmLabel,
      style: destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
}

type FilterKey = 'all' | 'risk' | 'fresh';

function SheetModal({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0 bg-black/60"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close modal"
        />
        <View className="max-h-[90%] w-full rounded-t-3xl border-t border-actevix-border bg-actevix-surface px-4 pb-10 pt-2">
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-white/20" />
          {children}
        </View>
      </View>
    </Modal>
  );
}

function ChipRow({
  label,
  values,
  selected,
  onToggle,
  danger,
}: {
  label: string;
  values: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
  danger?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 font-body-medium text-sm text-white/70">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {values.map((v) => {
          const on = selected.includes(v);
          return (
            <Pressable
              key={v}
              onPress={() => onToggle(v)}
              className={`rounded-full border px-3 py-2 ${
                on
                  ? danger
                    ? 'border-red-500/80 bg-red-500/15'
                    : 'border-actevix-teal bg-actevix-teal/15'
                  : 'border-actevix-border bg-actevix-bg'
              }`}>
              <Text
                className={`font-body text-sm ${on ? (danger ? 'text-red-400' : 'text-actevix-teal') : 'text-white/60'}`}>
                {v}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SportPickerRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 font-body-medium text-sm text-white/70">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row flex-wrap gap-2 pr-2">
          {options.map((o) => {
            const on = value === o;
            return (
              <Pressable
                key={o}
                onPress={() => onChange(o)}
                className={`rounded-full border px-4 py-2 ${
                  on ? 'border-actevix-teal bg-actevix-teal/15' : 'border-actevix-border bg-actevix-surface'
                }`}>
                <Text
                  className={`font-body text-sm ${on ? 'text-actevix-teal' : 'text-white/70'}`}>
                  {o}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function PlayerSessionLogForm({
  playerName,
  defaultSport,
  onSave,
  onCancel,
}: {
  playerName: string;
  defaultSport: string;
  onSave: (payload: Omit<SessionLog, 'date' | 'ts'>) => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState({
    sport: defaultSport || 'Basketball',
    workoutType: 'Practice',
    duration: 60,
    intensity: 6,
    muscles: [] as string[],
    painAreas: [] as string[],
    painLevel: 3,
  });

  const toggle = (field: 'muscles' | 'painAreas', val: string) => {
    setF((prev) => ({
      ...prev,
      [field]: prev[field].includes(val)
        ? prev[field].filter((x) => x !== val)
        : [...prev[field], val],
    }));
  };

  const submit = () => {
    if (f.muscles.length === 0) {
      Alert.alert('Muscle groups', 'Select at least one muscle group.');
      return;
    }
    onSave({
      sport: f.sport,
      position: '',
      workoutType: f.workoutType,
      duration: f.duration,
      intensity: f.intensity,
      muscles: f.muscles,
      painAreas: f.painAreas,
      painLevel: f.painLevel,
    });
  };

  return (
    <View className="mt-4 border-t border-actevix-border pt-4">
      <Text className="mb-3 font-heading-semibold text-base text-actevix-teal">
        Log session · {playerName}
      </Text>

      <SportPickerRow label="Sport" options={SPORTS} value={f.sport} onChange={(sport) => setF((p) => ({ ...p, sport }))} />

      <SportPickerRow
        label="Workout type"
        options={WORKOUT_TYPES}
        value={f.workoutType}
        onChange={(workoutType) => setF((p) => ({ ...p, workoutType }))}
      />

      <Text className="mb-1 font-body-medium text-sm text-white/70">
        Duration: <Text className="text-white">{Math.round(f.duration)} min</Text>
      </Text>
      <Slider
        minimumValue={10}
        maximumValue={240}
        step={5}
        value={f.duration}
        onValueChange={(duration) => setF((p) => ({ ...p, duration }))}
        minimumTrackTintColor="#1D9E75"
        maximumTrackTintColor="#1E2A36"
        thumbTintColor="#38BDF8"
      />
      <View className="mb-4 flex-row justify-between">
        <Text className="font-body text-xs text-white/45">10m</Text>
        <Text className="font-body text-xs text-white/45">240m</Text>
      </View>

      <Text className="mb-1 font-body-medium text-sm text-white/70">
        Intensity: <Text className="text-white">{f.intensity}/10</Text>
      </Text>
      <Slider
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={f.intensity}
        onValueChange={(intensity) => setF((p) => ({ ...p, intensity }))}
        minimumTrackTintColor="#1D9E75"
        maximumTrackTintColor="#1E2A36"
        thumbTintColor="#38BDF8"
      />
      <View className="mb-4 flex-row justify-between">
        <Text className="font-body text-xs text-white/45">Easy</Text>
        <Text className="font-body text-xs text-white/45">Max</Text>
      </View>

      <ChipRow label="Muscles worked" values={MUSCLE_GROUPS} selected={f.muscles} onToggle={(m) => toggle('muscles', m)} />
      <ChipRow
        label="Pain / soreness"
        values={MUSCLE_GROUPS}
        selected={f.painAreas}
        onToggle={(m) => toggle('painAreas', m)}
        danger
      />

      {f.painAreas.length > 0 && (
        <>
          <Text className="mb-1 font-body-medium text-sm text-white/70">
            Pain level: <Text className="text-red-400">{f.painLevel}/10</Text>
          </Text>
          <Slider
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={f.painLevel}
            onValueChange={(painLevel) => setF((p) => ({ ...p, painLevel }))}
            minimumTrackTintColor="#ef4444"
            maximumTrackTintColor="#1E2A36"
            thumbTintColor="#f87171"
          />
          <View className="mb-4 flex-row justify-between">
            <Text className="font-body text-xs text-white/45">Mild</Text>
            <Text className="font-body text-xs text-white/45">Severe</Text>
          </View>
        </>
      )}

      <View className="mt-2 flex-row gap-3">
        <Pressable
          onPress={submit}
          className="flex-1 items-center rounded-xl bg-actevix-teal py-3 active:opacity-90">
          <Text className="font-heading-semibold text-actevix-bg">Save log</Text>
        </Pressable>
        <Pressable
          onPress={onCancel}
          className="rounded-xl border border-actevix-border px-5 py-3 active:opacity-80">
          <Text className="font-body text-white/80">Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TeamSetupScreen() {
  const { createTeam, joinTeamByCode, allTeams } = useTeam();
  const [teamName, setTeamName] = useState('');
  const [coachName, setCoachName] = useState('');
  const [sport, setSport] = useState<string>('Basketball');
  const [joinCodeInput, setJoinCodeInput] = useState('');

  return (
    <ScrollView
      className="flex-1 bg-actevix-bg"
      contentContainerClassName="px-5 pb-28 pt-8"
      keyboardShouldPersistTaps="handled">
      <View className="mb-8 items-center">
        <Text className="mb-2 text-4xl">🏆</Text>
        <Text className="text-center font-heading text-2xl text-white">Team</Text>
        <Text className="mt-2 text-center font-body text-sm text-white/55">
          Create a team and share a join code, or enter a code to open a team on this device.
        </Text>
      </View>

      <View className="mb-5 rounded-2xl border border-actevix-border bg-actevix-surface p-4">
        <Text className="mb-3 font-heading-semibold text-lg text-actevix-blue">Join with code</Text>
        <Text className="mb-2 font-body text-xs text-white/50">
          Like Google Classroom: enter the code your coach shared. (Works when that team already
          exists in this app on this device—for now.)
        </Text>
        <TextInput
          className="mb-3 rounded-xl border border-actevix-blue/40 bg-actevix-bg px-3 py-3 font-body text-base text-white"
          placeholder="e.g. ABC-8K2"
          placeholderTextColor="#6B7280"
          value={joinCodeInput}
          onChangeText={setJoinCodeInput}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Pressable
          onPress={() => {
            const result = joinTeamByCode(joinCodeInput);
            if (result.ok) {
              setJoinCodeInput('');
              Alert.alert('Welcome', 'You’re now viewing that team’s roster.');
            } else {
              Alert.alert('Couldn’t join', result.message);
            }
          }}
          className="items-center rounded-xl border border-actevix-blue/50 bg-actevix-blue/15 py-3 active:opacity-90">
          <Text className="font-heading-semibold text-actevix-blue">Join team</Text>
        </Pressable>
        {allTeams.length > 0 && (
          <Text className="mt-2 font-body text-[11px] text-white/40">
            {allTeams.length} team{allTeams.length !== 1 ? 's' : ''} saved on this device — join codes
            must match one of them until cloud sync exists.
          </Text>
        )}
      </View>

      <View className="rounded-2xl border border-actevix-border bg-actevix-surface p-4">
        <Text className="mb-3 font-heading-semibold text-lg text-white">Create a team</Text>
        <Text className="mb-1 font-body-medium text-sm text-white/70">Team name *</Text>
        <TextInput
          className="mb-4 rounded-xl border border-actevix-border bg-actevix-bg px-3 py-3 font-body text-base text-white"
          placeholder="e.g. Granada Hills JV Football"
          placeholderTextColor="#6B7280"
          value={teamName}
          onChangeText={setTeamName}
        />

        <Text className="mb-1 font-body-medium text-sm text-white/70">Coach / trainer</Text>
        <TextInput
          className="mb-4 rounded-xl border border-actevix-border bg-actevix-bg px-3 py-3 font-body text-base text-white"
          placeholder="Your name"
          placeholderTextColor="#6B7280"
          value={coachName}
          onChangeText={setCoachName}
        />

        <SportPickerRow label="Primary sport" options={SPORTS} value={sport} onChange={setSport} />

        <Pressable
          onPress={() => {
            if (!teamName.trim()) {
              Alert.alert('Team name', 'Please enter a team name.');
              return;
            }
            createTeam({ name: teamName.trim(), coachName: coachName.trim(), sport });
          }}
          className="mt-2 items-center rounded-xl bg-actevix-teal py-4 active:opacity-90">
          <Text className="font-heading-semibold text-base text-actevix-bg">Create team →</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function AddPlayerSheet({
  visible,
  teamSport,
  onClose,
}: {
  visible: boolean;
  teamSport: string;
  onClose: () => void;
}) {
  const { addPlayer } = useTeam();
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [sport, setSport] = useState(teamSport || 'Basketball');
  const [position, setPosition] = useState('');

  useEffect(() => {
    if (visible) {
      setSport(teamSport || 'Basketball');
      setPosition('');
    }
  }, [visible, teamSport]);

  const positions =
    POSITIONS_BY_SPORT[sport as keyof typeof POSITIONS_BY_SPORT] ?? POSITIONS_BY_SPORT.Other;

  const closeAndReset = () => {
    setName('');
    setNumber('');
    setSport(teamSport || 'Basketball');
    setPosition('');
    onClose();
  };

  return (
    <SheetModal visible={visible} onClose={closeAndReset}>
      <Text className="mb-4 font-heading-semibold text-lg text-white">Add player</Text>

      <Text className="mb-1 font-body-medium text-sm text-white/70">Name *</Text>
      <TextInput
        className="mb-4 rounded-xl border border-actevix-border bg-actevix-bg px-3 py-3 font-body text-base text-white"
        placeholder="e.g. Marcus Johnson"
        placeholderTextColor="#6B7280"
        value={name}
        onChangeText={setName}
      />

      <Text className="mb-1 font-body-medium text-sm text-white/70">Jersey #</Text>
      <TextInput
        className="mb-4 rounded-xl border border-actevix-border bg-actevix-bg px-3 py-3 font-body text-base text-white"
        placeholder="#"
        placeholderTextColor="#6B7280"
        value={number}
        onChangeText={setNumber}
        keyboardType="number-pad"
      />

      <SportPickerRow
        label="Sport"
        options={SPORTS}
        value={sport}
        onChange={(s) => {
          setSport(s);
          setPosition('');
        }}
      />

      <Text className="mb-2 font-body-medium text-sm text-white/70">Position</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 max-h-24">
        <View className="flex-row flex-wrap gap-2 pr-2">
          <Pressable
            onPress={() => setPosition('')}
            className={`rounded-full border px-3 py-2 ${position === '' ? 'border-actevix-teal bg-actevix-teal/15' : 'border-actevix-border bg-actevix-bg'}`}>
            <Text className={`font-body text-xs ${position === '' ? 'text-actevix-teal' : 'text-white/60'}`}>
              Select…
            </Text>
          </Pressable>
          {positions.map((p) => (
            <Pressable
              key={p}
              onPress={() => setPosition(p)}
              className={`rounded-full border px-3 py-2 ${position === p ? 'border-actevix-teal bg-actevix-teal/15' : 'border-actevix-border bg-actevix-bg'}`}>
              <Text
                className={`font-body text-xs ${position === p ? 'text-actevix-teal' : 'text-white/60'}`}>
                {p}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View className="flex-row gap-3">
        <Pressable
          onPress={() => {
            if (!name.trim()) {
              Alert.alert('Name', 'Enter a player name.');
              return;
            }
            addPlayer({
              name: name.trim(),
              sport,
              position,
              number: number.trim(),
            });
            closeAndReset();
          }}
          className="flex-1 items-center rounded-xl bg-actevix-teal py-3 active:opacity-90">
          <Text className="font-heading-semibold text-actevix-bg">Add</Text>
        </Pressable>
        <Pressable
          onPress={closeAndReset}
          className="rounded-xl border border-actevix-border px-6 py-3 active:opacity-80">
          <Text className="font-body text-white/80">Cancel</Text>
        </Pressable>
      </View>
    </SheetModal>
  );
}

function PlayerDetailSheet({
  visible,
  player,
  onClose,
}: {
  visible: boolean;
  player: Player | null;
  onClose: () => void;
}) {
  const { appendPlayerLog } = useTeam();
  const [showLogForm, setShowLogForm] = useState(false);

  useEffect(() => {
    if (!visible) setShowLogForm(false);
  }, [visible]);

  const latestLog = player?.logs?.[0] ?? null;
  const scores = useMemo(() => computeScores(latestLog), [latestLog]);
  const overall = overallFatigue(scores);
  const top = topStressMuscle(scores);
  const risk = getTeamRisk(overall);

  return (
    <SheetModal
      visible={visible && player != null}
      onClose={() => {
        setShowLogForm(false);
        onClose();
      }}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {player == null ? null : (
          <>
        <View className="mb-4 flex-row items-center gap-3">
          <View
            className="h-12 w-12 items-center justify-center rounded-full border-2"
            style={{ borderColor: risk.color, backgroundColor: `${risk.color}22` }}>
            <Text className="font-heading-semibold text-lg" style={{ color: risk.color }}>
              {player.number ? `#${player.number}` : player.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-heading-semibold text-lg text-white">{player.name}</Text>
            <Text className="font-body text-xs text-white/50">
              {player.position ? `${player.position} · ` : ''}
              {player.sport}
            </Text>
          </View>
          <View
            className="rounded-full border px-2 py-1"
            style={{ borderColor: `${risk.color}66`, backgroundColor: `${risk.color}22` }}>
            <Text className="font-body-medium text-xs" style={{ color: risk.color }}>
              {risk.label}
            </Text>
          </View>
        </View>

        <View className="mb-4 flex-row gap-2">
          {[
            { lbl: 'Fatigue', val: `${overall.toFixed(1)}/10`, color: getScoreColor(overall) },
            {
              lbl: 'Top stress',
              val: top && top.value > 0 ? top.muscle : '—',
              color: top && top.value > 0 ? getScoreColor(top.value) : '#6B7280',
            },
            { lbl: 'Sessions', val: `${player.logs?.length ?? 0}`, color: '#9ca3af' },
          ].map(({ lbl, val, color }) => (
            <View
              key={lbl}
              className="flex-1 rounded-xl border border-actevix-border bg-actevix-bg px-2 py-3">
              <Text className="text-center font-body text-[10px] uppercase tracking-wide text-white/45">
                {lbl}
              </Text>
              <Text
                className="text-center font-heading-semibold text-sm"
                style={{ color }}
                numberOfLines={1}>
                {val}
              </Text>
            </View>
          ))}
        </View>

        {MUSCLE_GROUPS.some((m) => scores[m] > 0) && (
          <View className="mb-4 rounded-xl border border-actevix-border bg-actevix-bg p-3">
            <Text className="mb-2 font-body-medium text-xs uppercase tracking-wider text-white/45">
              Muscle load
            </Text>
            {MUSCLE_GROUPS.filter((m) => scores[m] > 0).map((m) => (
              <View key={m} className="mb-2 flex-row items-center gap-2">
                <Text className="w-20 font-body text-xs text-white/60">{m}</Text>
                <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1e2130]">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(scores[m] * 10, 100)}%`,
                      backgroundColor: getScoreColor(scores[m]),
                    }}
                  />
                </View>
                <Text
                  className="w-14 text-right font-body text-[10px]"
                  style={{ color: getScoreColor(scores[m]) }}>
                  {getTeamLoadLabel(scores[m])}
                </Text>
              </View>
            ))}
          </View>
        )}

        {(player.logs?.length ?? 0) > 0 && (
          <View className="mb-4 rounded-xl border border-actevix-border bg-actevix-bg p-3">
            <Text className="mb-2 font-body-medium text-xs uppercase tracking-wider text-white/45">
              Recent sessions
            </Text>
            {player.logs.slice(0, 5).map((log, i) => {
              const sc = computeScores(log);
              const ov = overallFatigue(sc);
              const r = getTeamRisk(ov);
              return (
                <View
                  key={log.ts}
                  className={`flex-row items-center justify-between py-2 ${i < Math.min(player.logs.length, 5) - 1 ? 'border-b border-actevix-border' : ''}`}>
                  <View>
                    <Text className="font-body-medium text-sm text-white">
                      {log.sport} · {log.workoutType}
                    </Text>
                    <Text className="font-body text-xs text-white/45">
                      {log.date} · {log.duration}m · Int {log.intensity}/10
                    </Text>
                  </View>
                  <View
                    className="rounded-full border px-2 py-0.5"
                    style={{ borderColor: `${r.color}44` }}>
                    <Text className="font-body-medium text-[10px]" style={{ color: r.color }}>
                      {r.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {!showLogForm ? (
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => setShowLogForm(true)}
              className="flex-1 items-center rounded-xl bg-actevix-teal py-3 active:opacity-90">
              <Text className="font-heading-semibold text-actevix-bg">+ Log session</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              className="rounded-xl border border-actevix-border px-5 py-3 active:opacity-80">
              <Text className="font-body text-white/80">Close</Text>
            </Pressable>
          </View>
        ) : (
          <PlayerSessionLogForm
            playerName={player.name}
            defaultSport={player.sport}
            onSave={(payload) => {
              appendPlayerLog(player.id, payload);
              setShowLogForm(false);
            }}
            onCancel={() => setShowLogForm(false)}
          />
        )}
          </>
        )}
      </ScrollView>
    </SheetModal>
  );
}

export default function TeamTab() {
  const {
    team,
    ready,
    updateTeamName,
    removePlayer,
    resetTeam,
    regenerateJoinCode,
    leaveActiveTeam,
  } = useTeam();

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  const selectedPlayer = useMemo(
    () => (selectedPlayerId && team ? team.players.find((p) => p.id === selectedPlayerId) ?? null : null),
    [team, selectedPlayerId]
  );

  const playersWithRisk = useMemo(() => {
    if (!team) return [];
    return team.players.map((p) => {
      const latest = p.logs?.[0] ?? null;
      const sc = computeScores(latest);
      const overall = overallFatigue(sc);
      const risk = getTeamRisk(overall);
      const top = topStressMuscle(sc);
      return { ...p, overall, risk, top };
    });
  }, [team]);

  const sorted = useMemo(() => [...playersWithRisk].sort((a, b) => b.overall - a.overall), [playersWithRisk]);

  const filtered = useMemo(() => {
    return sorted.filter((p) => {
      if (filter === 'risk') return p.overall >= 5;
      if (filter === 'fresh') return p.overall < 3;
      return true;
    });
  }, [sorted, filter]);

  const atRisk = playersWithRisk.filter((p) => p.overall >= 6).length;
  const avgFatigue =
    playersWithRisk.length > 0
      ? (playersWithRisk.reduce((a, p) => a + p.overall, 0) / playersWithRisk.length).toFixed(1)
      : '—';

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-actevix-bg">
        <ActivityIndicator color="#1D9E75" />
      </View>
    );
  }

  if (!team) {
    return <TeamSetupScreen />;
  }

  const players = team.players;

  return (
    <View className="flex-1 bg-actevix-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-28 pt-4"
        keyboardShouldPersistTaps="handled">
        <View className="mb-4 rounded-2xl border border-actevix-border bg-actevix-surface p-4">
          {editingName ? (
            <View className="flex-row items-center gap-2">
              <TextInput
                className="flex-1 rounded-xl border border-actevix-border bg-actevix-bg px-3 py-2 font-body text-base text-white"
                value={tempName}
                onChangeText={setTempName}
                autoFocus
              />
              <Pressable
                onPress={() => {
                  if (tempName.trim()) updateTeamName(tempName.trim());
                  setEditingName(false);
                }}
                className="rounded-xl bg-actevix-teal px-4 py-2">
                <Text className="font-heading-semibold text-actevix-bg">✓</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => { setTempName(team.name); setEditingName(true); }}>
              <Text className="font-heading-semibold text-lg text-white">
                {team.name} <Text className="text-sm text-white/40">✏️</Text>
              </Text>
            </Pressable>
          )}
          <Text className="mt-1 font-body text-xs text-white/50">
            {team.coachName ? `Coach: ${team.coachName} · ` : ''}
            {team.sport} · {players.length} player{players.length !== 1 ? 's' : ''}
          </Text>

          {players.length > 0 && (
            <View className="mt-4 flex-row gap-2">
              {[
                { lbl: 'Roster', val: String(players.length), color: '#9ca3af' },
                {
                  lbl: 'Avg fatigue',
                  val: `${avgFatigue}/10`,
                  color: getScoreColor(Number.parseFloat(avgFatigue) || 0),
                },
                {
                  lbl: 'At risk',
                  val: String(atRisk),
                  color: atRisk > 0 ? '#fb923c' : '#4ade80',
                },
              ].map(({ lbl, val, color }) => (
                <View
                  key={lbl}
                  className="flex-1 rounded-xl border border-actevix-border bg-actevix-bg px-2 py-3">
                  <Text className="text-center font-body text-[9px] uppercase tracking-wide text-white/40">
                    {lbl}
                  </Text>
                  <Text
                    className="text-center font-heading-semibold text-base"
                    style={{ color }}>
                    {val}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="mb-4 rounded-2xl border border-actevix-blue/35 bg-actevix-bg/80 p-4">
          <Text className="mb-1 font-body-medium text-xs uppercase tracking-wider text-actevix-blue">
            Team join code
          </Text>
          <Text className="mb-3 font-body text-xs text-white/50">
            Classroom-style code: athletes enter it under Team → Join with code (on-device for now;
            cloud later).
          </Text>
          <Text
            selectable
            className="mb-4 text-center font-heading text-2xl tracking-[0.2em] text-white">
            {team.joinCode}
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={async () => {
                await Clipboard.setStringAsync(team.joinCode);
                Alert.alert('Copied', 'Join code copied to clipboard.');
              }}
              className="flex-1 items-center rounded-xl bg-actevix-teal py-3 active:opacity-90">
              <Text className="font-heading-semibold text-actevix-bg">Copy code</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Alert.alert(
                  'Generate new code?',
                  'The current code will stop working for anyone who only has the old one.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Regenerate', onPress: () => regenerateJoinCode() },
                  ]
                );
              }}
              className="flex-1 items-center rounded-xl border border-actevix-border bg-actevix-surface py-3 active:opacity-90">
              <Text className="font-body-medium text-white/85">New code</Text>
            </Pressable>
          </View>
        </View>

        <View className="mb-3 flex-row items-center gap-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
            <View className="flex-row gap-2">
              {(
                [
                  ['all', 'All'],
                  ['risk', 'At risk'],
                  ['fresh', 'Fresh'],
                ] as const
              ).map(([key, label]) => (
                <Pressable
                  key={key}
                  onPress={() => setFilter(key)}
                  className={`rounded-full border px-3 py-2 ${
                    filter === key
                      ? 'border-actevix-teal bg-actevix-teal/15'
                      : 'border-actevix-border bg-actevix-bg'
                  }`}>
                  <Text
                    className={`font-body text-xs ${filter === key ? 'text-actevix-teal' : 'text-white/55'}`}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <Pressable
            onPress={() => setShowAddPlayer(true)}
            className="rounded-full bg-actevix-teal px-4 py-2 active:opacity-90">
            <Text className="font-heading-semibold text-sm text-actevix-bg">+ Player</Text>
          </Pressable>
        </View>

        {players.length === 0 && (
          <View className="items-center rounded-2xl border border-actevix-border bg-actevix-surface px-6 py-10">
            <Text className="mb-2 text-4xl">👥</Text>
            <Text className="mb-1 text-center font-heading-semibold text-base text-white">
              No players yet
            </Text>
            <Text className="mb-6 text-center font-body text-sm text-white/50">
              Add your roster to track fatigue and injury risk.
            </Text>
            <Pressable
              onPress={() => setShowAddPlayer(true)}
              className="rounded-xl bg-actevix-teal px-6 py-3 active:opacity-90">
              <Text className="font-heading-semibold text-actevix-bg">Add first player</Text>
            </Pressable>
          </View>
        )}

        {filtered.map((player) => (
          <Pressable
            key={player.id}
            onPress={() => setSelectedPlayerId(player.id)}
            onLongPress={() => {
              Alert.alert(
                'Remove player',
                `Remove ${player.name} from the roster?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => removePlayer(player.id),
                  },
                ]
              );
            }}
            className="mb-3 flex-row items-center gap-3 rounded-2xl border bg-actevix-surface p-3 active:opacity-90"
            style={{ borderColor: `${player.risk.color}33` }}>
            <View
              className="h-11 w-11 items-center justify-center rounded-full border-2"
              style={{ borderColor: player.risk.color, backgroundColor: `${player.risk.color}22` }}>
              <Text className="font-heading-semibold text-sm" style={{ color: player.risk.color }}>
                {player.number ? `#${player.number}` : player.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center justify-between gap-2">
                <Text className="font-heading-semibold text-sm text-white" numberOfLines={1}>
                  {player.name}
                </Text>
                <View
                  className="rounded-full border px-2 py-0.5"
                  style={{ borderColor: `${player.risk.color}44` }}>
                  <Text className="font-body-medium text-[10px]" style={{ color: player.risk.color }}>
                    {player.risk.label}
                  </Text>
                </View>
              </View>
              <Text className="font-body text-[11px] text-white/45" numberOfLines={1}>
                {player.position ? `${player.position} · ` : ''}
                {player.sport}
                {player.logs?.[0] ? ` · Last: ${player.logs[0].date}` : ''}
              </Text>
              <View className="mt-2 h-1 overflow-hidden rounded-full bg-[#1e2130]">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(player.overall * 10, 100)}%`,
                    backgroundColor: player.risk.color,
                  }}
                />
              </View>
              {player.top && player.top.value > 0 && (
                <Text className="mt-1 font-body text-[10px] text-white/40">
                  Most stressed: {player.top.muscle}
                </Text>
              )}
            </View>
            <Text className="text-white/30">›</Text>
          </Pressable>
        ))}

        {filtered.length === 0 && players.length > 0 && (
          <Text className="py-6 text-center font-body text-sm text-white/45">
            No players match this filter.
          </Text>
        )}

        <View className="mt-4 items-center gap-3">
          <Pressable
            onPress={() => {
              confirmAction(
                'Leave team view?',
                'You can return later with the join code. Nothing is deleted.',
                {
                  confirmLabel: 'Leave',
                  onConfirm: () => {
                    setSelectedPlayerId(null);
                    setShowAddPlayer(false);
                    setEditingName(false);
                    leaveActiveTeam();
                  },
                }
              );
            }}
            className="rounded-lg border border-actevix-border px-4 py-2 active:opacity-80">
            <Text className="font-body-medium text-sm text-white/70">Leave team view</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              confirmAction(
                'Delete team from this device?',
                'Removes this roster and join code from this phone. Other saved teams stay.',
                {
                  confirmLabel: 'Delete',
                  destructive: true,
                  onConfirm: () => {
                    setSelectedPlayerId(null);
                    setShowAddPlayer(false);
                    setEditingName(false);
                    resetTeam();
                  },
                }
              );
            }}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 active:opacity-80">
            <Text className="font-body-medium text-sm text-red-400">Delete team from device</Text>
          </Pressable>
        </View>
      </ScrollView>

      <AddPlayerSheet
        visible={showAddPlayer}
        teamSport={team.sport}
        onClose={() => setShowAddPlayer(false)}
      />

      <PlayerDetailSheet
        visible={selectedPlayerId != null}
        player={selectedPlayer}
        onClose={() => setSelectedPlayerId(null)}
      />
    </View>
  );
}
