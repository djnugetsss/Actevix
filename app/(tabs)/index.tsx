import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useSessionLogs } from '@/context/SessionLogsContext';
import { queryAI } from '@/lib/aiService';
import { supabase } from '@/lib/supabase';
import {
  computeScores,
  getRiskLabel,
  getScoreColor,
  getScoreLabel,
  MUSCLE_GROUPS,
  overallFatigue,
  RECOVERY_TIPS,
} from '@/lib/wearTear';

// ─── Suggested prompts ────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  'How is my body recovering?',
  'Am I at risk of injury?',
  'What should I avoid today?',
  'Should I train or rest?',
];

// ─── Sport emoji map ──────────────────────────────────────────────────────────

const SPORT_EMOJI: Record<string, string> = {
  Tennis: '🎾',
  Basketball: '🏀',
  Soccer: '⚽',
  Football: '🏈',
  Baseball: '⚾',
  Swimming: '🏊',
  Running: '🏃',
  Cycling: '🚴',
  Volleyball: '🏐',
  Golf: '⛳',
  Hockey: '🏒',
  Wrestling: '🤼',
  Gymnastics: '🤸',
  CrossFit: '🏋️',
  Weightlifting: '🏋️',
  'Weight Training': '🏋️',
  'Strength Training': '🏋️',
  MMA: '🥊',
  Boxing: '🥊',
  Yoga: '🧘',
  Lacrosse: '🥍',
  Rugby: '🏉',
  Track: '🏃',
};

// ─── Intensity color ──────────────────────────────────────────────────────────

function intensityColor(intensity: number): string {
  if (intensity <= 3) return '#4ade80';
  if (intensity <= 6) return '#facc15';
  if (intensity <= 8) return '#fb923c';
  return '#ef4444';
}

function intensityLabel(intensity: number): string {
  if (intensity <= 3) return 'Easy';
  if (intensity <= 6) return 'Moderate';
  if (intensity <= 8) return 'Hard';
  return 'Max';
}

// ─── Today's Activity Log Widget ─────────────────────────────────────────────

function TodayActivityLog({ logs }: { logs: any[] }) {
  const today = new Date().toDateString();

  const todayLogs = logs.filter((log) => {
    // ts is a Unix ms timestamp — compare by date string
    const logDate = log.ts ? new Date(log.ts).toDateString() : '';
    return logDate === today;
  });

  return (
    <View className="mb-1">
      <Text className="px-5 pb-2 pt-5 font-body-medium text-xs uppercase tracking-wider text-white/40">
        Today's Activity
      </Text>

      {todayLogs.length === 0 ? (
        <View className="mx-4 flex-row items-center gap-3 rounded-2xl border border-dashed border-actevix-border bg-actevix-surface px-4 py-4">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-actevix-bg">
            <Text style={{ fontSize: 18 }}>🏃</Text>
          </View>
          <View>
            <Text className="font-body-medium text-sm text-white/50">No sessions yet today</Text>
            <Text className="font-body text-xs text-white/25">Log a session to track your activity</Text>
          </View>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4 gap-3 pr-6">
          {todayLogs.map((log, i) => {
            const emoji = SPORT_EMOJI[log.sport] ?? '💪';
            const iColor = intensityColor(log.intensity ?? 5);
            const iLabel = intensityLabel(log.intensity ?? 5);

            return (
              <View
                key={log.id ?? i}
                className="w-44 rounded-2xl border border-actevix-border bg-actevix-surface p-3">

                {/* Sport row */}
                <View className="mb-2.5 flex-row items-center gap-2">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-actevix-bg">
                    <Text style={{ fontSize: 18 }}>{emoji}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-heading-semibold text-sm text-white" numberOfLines={1}>
                      {log.sport ?? 'Workout'}
                    </Text>
                    <Text className="font-body text-[11px] text-white/40" numberOfLines={1}>
                      {log.workoutType ?? 'General'}
                    </Text>
                  </View>
                </View>

                {/* Divider */}
                <View className="mb-2.5 h-px bg-actevix-border" />

                {/* Stats row */}
                <View className="flex-row items-center justify-between">
                  {/* Duration */}
                  <View className="items-center">
                    <Text className="font-heading-semibold text-sm text-white">
                      {log.duration ?? '—'}
                      <Text className="font-body text-[10px] text-white/40">m</Text>
                    </Text>
                    <Text className="font-body text-[10px] uppercase tracking-wide text-white/30">
                      Duration
                    </Text>
                  </View>

                  {/* Divider */}
                  <View className="h-6 w-px bg-actevix-border" />

                  {/* Intensity */}
                  <View className="items-center">
                    <View className="flex-row items-center gap-1">
                      <View
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: iColor }}
                      />
                      <Text
                        className="font-heading-semibold text-sm"
                        style={{ color: iColor }}>
                        {log.intensity ?? '—'}
                        <Text className="font-body text-[10px]">/10</Text>
                      </Text>
                    </View>
                    <Text className="font-body text-[10px] uppercase tracking-wide text-white/30">
                      {iLabel}
                    </Text>
                  </View>

                  {/* Divider */}
                  <View className="h-6 w-px bg-actevix-border" />

                  {/* Muscles */}
                  <View className="items-center">
                    <Text className="font-heading-semibold text-sm text-white">
                      {Array.isArray(log.muscles) ? log.muscles.length : '—'}
                    </Text>
                    <Text className="font-body text-[10px] uppercase tracking-wide text-white/30">
                      Muscles
                    </Text>
                  </View>
                </View>

                {/* Muscle chips (up to 3) */}
                {Array.isArray(log.muscles) && log.muscles.length > 0 && (
                  <View className="mt-2.5 flex-row flex-wrap gap-1">
                    {log.muscles.slice(0, 3).map((m: string) => (
                      <View
                        key={m}
                        className="rounded-full border border-actevix-border bg-actevix-bg px-2 py-0.5">
                        <Text className="font-body text-[10px] text-white/40">{m}</Text>
                      </View>
                    ))}
                    {log.muscles.length > 3 && (
                      <View className="rounded-full border border-actevix-border bg-actevix-bg px-2 py-0.5">
                        <Text className="font-body text-[10px] text-white/40">
                          +{log.muscles.length - 3}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          {/* Log another CTA card */}
          {todayLogs.length > 0 && (
            <View className="w-32 items-center justify-center rounded-2xl border border-dashed border-actevix-border bg-actevix-surface p-3">
              <Text style={{ fontSize: 20 }}>➕</Text>
              <Text className="mt-1.5 text-center font-body text-xs text-white/30">
                Log another session
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardTab() {
  const { logs } = useSessionLogs();
  const [bodyView, setBodyView] = useState<'front' | 'back'>('front');
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileSport, setProfileSport] = useState<string | undefined>();
  const [remaining, setRemaining] = useState<number>(12);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('profiles')
        .select('name, sport')
        .eq('id', session.user.id)
        .single();
      if (data?.name) setProfileName(data.name.split(' ')[0]);
      if (data?.sport) setProfileSport(data.sport);
    };
    fetchProfile();
  }, []);

  const latestLog = logs[0] ?? null;
  const scores = computeScores(latestLog);
  const overall = overallFatigue(scores);
  const risk = getRiskLabel(overall);
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1]).filter(([, v]) => v > 0);
  const recoveryMuscles = top.filter(([, v]) => v >= 5).map(([m]) => m);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleAiSend = async (query?: string) => {
    const q = query ?? aiInput;
    if (!q.trim()) return;
    setAiLoading(true);
    setAiResponse(null);
    setAiInput('');

    const result = await queryAI(q, scores, overall, risk, profileSport);

    setAiResponse(result.success ? result.response : result.error);
    if ('remaining' in result && result.remaining !== undefined) {
      setRemaining(result.remaining);
    }
    setAiLoading(false);
  };

  return (
    <ScrollView
      className="flex-1 bg-actevix-bg"
      contentContainerClassName="pb-28 pt-4"
      keyboardShouldPersistTaps="handled">

      {/* ── Greeting ────────────────────────────────────────────────────── */}
      <View className="px-5 pb-2 pt-2">
        <Text className="font-body text-xs uppercase tracking-wider text-white/40">{dateStr}</Text>
        <Text className="mt-1 font-heading text-3xl text-white">
          {greeting}{profileName ? `, ${profileName}` : ''} 👋
        </Text>
        <Text className="mt-1 font-body text-sm text-white/45">
          {latestLog
            ? `Last logged: ${(latestLog as any).date} · ${(latestLog as any).sport}`
            : 'No sessions logged yet — start in the Log tab'}
        </Text>
      </View>

      {/* ── TODAY'S ACTIVITY LOG ────────────────────────────────────────── */}
      <TodayActivityLog logs={logs} />

      {/* ── 1. AI INSIGHT ───────────────────────────────────────────────── */}
      <Text className="px-5 pb-2 pt-5 font-body-medium text-xs uppercase tracking-wider text-white/40">
        AI Insight
      </Text>

      <View className="mx-4 rounded-2xl border border-actevix-teal/20 bg-actevix-surface p-4">
        {/* Header */}
        <View className="mb-4 flex-row items-center gap-2">
          <View className="h-2 w-2 rounded-full bg-actevix-teal" />
          <Text className="font-body-medium text-xs uppercase tracking-wider text-actevix-teal">
            Actevix AI
          </Text>
          <View className="ml-auto rounded-full border border-actevix-teal/25 bg-actevix-teal/10 px-2 py-0.5">
            <Text className="font-body text-[10px] text-actevix-teal">
              {remaining}/12 left today
            </Text>
          </View>
        </View>

        {/* Prompt chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          <View className="flex-row gap-2 pr-2">
            {SUGGESTED_PROMPTS.map((p) => (
              <Pressable
                key={p}
                onPress={() => handleAiSend(p)}
                disabled={aiLoading || remaining === 0}
                className="rounded-full border border-actevix-teal/20 bg-actevix-teal/5 px-3 py-2 active:opacity-70">
                <Text className="font-body text-xs text-white/55">{p}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Input */}
        <TextInput
          className="rounded-xl border border-actevix-border bg-actevix-bg px-4 py-3 font-body text-sm text-white"
          placeholder="Ask about your recovery, risk, or readiness..."
          placeholderTextColor="#4B5563"
          value={aiInput}
          onChangeText={setAiInput}
          multiline
          numberOfLines={3}
          editable={!aiLoading && remaining > 0}
        />

        <Pressable
          onPress={() => handleAiSend()}
          disabled={aiLoading || remaining === 0}
          className={`mt-3 items-center rounded-xl py-3 ${remaining === 0 ? 'bg-actevix-border' : 'bg-actevix-teal active:opacity-90'}`}>
          <Text className={`font-heading-semibold text-sm ${remaining === 0 ? 'text-white/30' : 'text-actevix-bg'}`}>
            {aiLoading ? 'Thinking...' : remaining === 0 ? 'Limit reached — resets tomorrow' : 'Ask AI →'}
          </Text>
        </Pressable>

        {aiResponse !== null && (
          <View className="mt-4 rounded-xl border border-actevix-teal/15 bg-actevix-teal/5 p-4">
            <Text className="mb-2 font-body-medium text-[10px] uppercase tracking-wider text-actevix-teal">
              Response
            </Text>
            <Text className="font-body text-sm leading-relaxed text-white/80">{aiResponse}</Text>
          </View>
        )}
      </View>

      {/* ── 2. DAILY SUMMARY ────────────────────────────────────────────── */}
      <Text className="px-5 pb-2 pt-5 font-body-medium text-xs uppercase tracking-wider text-white/40">
        Daily Summary
      </Text>

      <View className="mx-4 rounded-2xl border border-actevix-border bg-actevix-surface p-4">
        <View className="mb-4 flex-row gap-2">
          {[
            {
              label: 'Fatigue',
              value: overall > 0 ? `${overall.toFixed(1)}/10` : '—',
              color: getScoreColor(overall),
            },
            {
              label: 'Risk Level',
              value: overall > 0 ? risk.label : '—',
              color: risk.color,
            },
            {
              label: 'Most Stressed',
              value: top[0] ? top[0][0] : '—',
              color: top[0] ? getScoreColor(top[0][1]) : '#4B5563',
            },
          ].map(({ label, value, color }) => (
            <View
              key={label}
              className="flex-1 rounded-xl border border-actevix-border bg-actevix-bg px-2 py-3">
              <Text
                className="text-center font-heading-semibold text-base"
                style={{ color }}
                numberOfLines={1}>
                {value}
              </Text>
              <Text className="mt-1 text-center font-body text-[10px] uppercase tracking-wide text-white/40">
                {label}
              </Text>
            </View>
          ))}
        </View>

        {top.length > 0 ? (
          top.map(([m, v]) => (
            <View key={m} className="mb-2 flex-row items-center gap-2">
              <Text className="w-24 font-body text-xs text-white/60">{m}</Text>
              <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-actevix-border">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(v * 10, 100)}%`,
                    backgroundColor: getScoreColor(v),
                  }}
                />
              </View>
              <Text
                className="w-16 text-right font-body text-[10px]"
                style={{ color: getScoreColor(v) }}>
                {getScoreLabel(v)}
              </Text>
            </View>
          ))
        ) : (
          <Text className="py-4 text-center font-body text-sm text-white/30">
            Log a session to see your fatigue breakdown →
          </Text>
        )}
      </View>

      {/* ── Recovery Suggestions ─────────────────────────────────────────── */}
      {recoveryMuscles.length > 0 && (
        <View className="mx-4 mt-3 rounded-2xl border border-actevix-border bg-actevix-surface p-4">
          <Text className="mb-3 font-body-medium text-xs uppercase tracking-wider text-white/40">
            💊 Recovery Suggestions
          </Text>
          {recoveryMuscles.map((m) => (
            <View key={m} className="mb-4">
              <Text
                className="mb-2 font-body-medium text-sm"
                style={{ color: getScoreColor(scores[m]) }}>
                {m}{' '}
                <Text className="font-body text-xs text-white/40">
                  · {getScoreLabel(scores[m])}
                </Text>
              </Text>
              {(RECOVERY_TIPS[m] ?? ['Rest and monitor', 'Stay hydrated']).map((tip, i) => (
                <View key={i} className="mb-1.5 flex-row gap-2">
                  <View className="mt-1.5 h-1.5 w-1.5 rounded-full bg-actevix-border" />
                  <Text className="flex-1 font-body text-xs text-white/55">{tip}</Text>
                </View>
              ))}
            </View>
          ))}
          <View className="mt-1 rounded-xl bg-actevix-bg px-3 py-2">
            <Text className="font-body text-xs text-white/40">
              💧 Hydrate · 😴 8hrs sleep · 🧘 10min mobility daily
            </Text>
          </View>
        </View>
      )}

      {/* ── 3. HEATMAP ──────────────────────────────────────────────────── */}
      <Text className="px-5 pb-2 pt-5 font-body-medium text-xs uppercase tracking-wider text-white/40">
        Heatmap
      </Text>

      <View className="mx-4 rounded-2xl border border-actevix-border bg-actevix-surface p-4">
        <View className="mb-4 flex-row justify-center gap-3">
          {(['front', 'back'] as const).map((v) => (
            <Pressable
              key={v}
              onPress={() => setBodyView(v)}
              className={`rounded-full border px-5 py-2 ${
                bodyView === v
                  ? 'border-actevix-teal bg-actevix-teal/15'
                  : 'border-actevix-border bg-actevix-bg'
              }`}>
              <Text
                className={`font-body-medium text-sm capitalize ${
                  bodyView === v ? 'text-actevix-teal' : 'text-white/50'
                }`}>
                {v}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="gap-2">
          {MUSCLE_GROUPS.filter((m) => {
            const front = ['Quads', 'Chest', 'Shoulders', 'Arms', 'Knees', 'Calves', 'Ankles'];
            const back = ['Hamstrings', 'Back', 'Shoulders', 'Arms', 'Knees', 'Calves', 'Ankles'];
            return (bodyView === 'front' ? front : back).includes(m);
          }).map((m) => {
            const score = scores[m] ?? 0;
            const color = getScoreColor(score);
            return (
              <View key={m} className="flex-row items-center gap-3">
                <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                <Text className="w-24 font-body text-xs text-white/60">{m}</Text>
                <View className="h-2 flex-1 overflow-hidden rounded-full bg-actevix-border">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(score * 10, 100)}%`,
                      backgroundColor: color,
                    }}
                  />
                </View>
                <Text
                  className="w-16 text-right font-body text-[10px]"
                  style={{ color }}>
                  {getScoreLabel(score)}
                </Text>
              </View>
            );
          })}
        </View>

        <View className="mt-4 flex-row flex-wrap justify-center gap-3">
          {[
            ['#2a2d3a', 'Normal'],
            ['#4ade80', 'Light'],
            ['#facc15', 'Moderate'],
            ['#fb923c', 'High'],
            ['#ef4444', 'Risk'],
          ].map(([color, label]) => (
            <View key={label} className="flex-row items-center gap-1.5">
              <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <Text className="font-body text-[11px] text-white/45">{label}</Text>
            </View>
          ))}
        </View>

        {!latestLog && (
          <Text className="mt-3 text-center font-body text-xs text-white/30">
            Log a session to see heatmap colors
          </Text>
        )}
      </View>

    </ScrollView>
  );
}