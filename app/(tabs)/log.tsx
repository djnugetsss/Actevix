import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useSessionLogs } from '@/context/SessionLogsContext';
import { MUSCLE_GROUPS, SPORTS, WORKOUT_TYPES } from '@/lib/wearTear';

const initialForm = {
  sport: 'Basketball',
  position: '',
  workoutType: 'Legs',
  duration: 60,
  intensity: 6,
  muscles: [] as string[],
  painAreas: [] as string[],
  painLevel: 3,
};

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

function SportWorkoutRow({
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

export default function LogScreen() {
  const { addLog } = useSessionLogs();
  const [form, setForm] = useState(initialForm);

  const toggleChip = (field: 'muscles' | 'painAreas', val: string) => {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(val) ? f[field].filter((x) => x !== val) : [...f[field], val],
    }));
  };

  const handleSubmit = () => {
    if (form.muscles.length === 0) {
      Alert.alert('Muscle groups', 'Please select at least one muscle group.');
      return;
    }
    addLog({
      sport: form.sport,
      position: form.position,
      workoutType: form.workoutType,
      duration: form.duration,
      intensity: form.intensity,
      muscles: form.muscles,
      painAreas: form.painAreas,
      painLevel: form.painLevel,
    });
    setForm({
      ...initialForm,
      sport: form.sport,
      workoutType: form.workoutType,
    });
    router.push('/');
  };

  return (
    <ScrollView
      className="flex-1 bg-actevix-bg"
      contentContainerClassName="px-4 pb-28 pt-4"
      keyboardShouldPersistTaps="handled">
      <Text className="font-heading text-2xl text-white">New session</Text>
      <Text className="font-body mt-1 text-sm text-white/60">
        Log a workout so your Dashboard heatmap and risk scores stay up to date.
      </Text>

      <View className="mt-4 rounded-2xl border border-actevix-border bg-actevix-surface p-4">
        <Text className="mb-4 font-heading-semibold text-lg text-white">Session details</Text>

        <SportWorkoutRow
          label="Sport"
          options={SPORTS}
          value={form.sport}
          onChange={(sport) => setForm((f) => ({ ...f, sport }))}
        />

        <Text className="mb-1 font-body-medium text-sm text-white/70">Position (optional)</Text>
        <TextInput
          className="mb-4 rounded-xl border border-actevix-border bg-actevix-bg px-3 py-3 font-body text-base text-white"
          placeholder="e.g. Point Guard, striker…"
          placeholderTextColor="#6B7280"
          value={form.position}
          onChangeText={(position) => setForm((f) => ({ ...f, position }))}
        />

        <SportWorkoutRow
          label="Workout type"
          options={WORKOUT_TYPES}
          value={form.workoutType}
          onChange={(workoutType) => setForm((f) => ({ ...f, workoutType }))}
        />

        <Text className="mb-1 font-body-medium text-sm text-white/70">
          Duration:{' '}
          <Text className="text-white">{Math.round(form.duration)} min</Text>
        </Text>
        <Slider
          minimumValue={10}
          maximumValue={240}
          step={5}
          value={form.duration}
          onValueChange={(duration) => setForm((f) => ({ ...f, duration }))}
          minimumTrackTintColor="#1D9E75"
          maximumTrackTintColor="#1E2A36"
          thumbTintColor="#38BDF8"
        />
        <View className="mb-4 flex-row justify-between">
          <Text className="font-body text-xs text-white/45">10m</Text>
          <Text className="font-body text-xs text-white/45">240m</Text>
        </View>

        <Text className="mb-1 font-body-medium text-sm text-white/70">
          Intensity: <Text className="text-white">{form.intensity}/10</Text>
        </Text>
        <Slider
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={form.intensity}
          onValueChange={(intensity) => setForm((f) => ({ ...f, intensity }))}
          minimumTrackTintColor="#1D9E75"
          maximumTrackTintColor="#1E2A36"
          thumbTintColor="#38BDF8"
        />
        <View className="mb-4 flex-row justify-between">
          <Text className="font-body text-xs text-white/45">Easy</Text>
          <Text className="font-body text-xs text-white/45">Max</Text>
        </View>

        <ChipRow
          label="Muscles worked"
          values={MUSCLE_GROUPS}
          selected={form.muscles}
          onToggle={(m) => toggleChip('muscles', m)}
        />

        <ChipRow
          label="Pain / soreness areas"
          values={MUSCLE_GROUPS}
          selected={form.painAreas}
          onToggle={(m) => toggleChip('painAreas', m)}
          danger
        />

        {form.painAreas.length > 0 && (
          <>
            <Text className="mb-1 font-body-medium text-sm text-white/70">
              Pain level:{' '}
              <Text className="text-red-400">{form.painLevel}/10</Text>
            </Text>
            <Slider
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={form.painLevel}
              onValueChange={(painLevel) => setForm((f) => ({ ...f, painLevel }))}
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

        <Pressable
          onPress={handleSubmit}
          className="mt-2 items-center rounded-xl bg-actevix-teal py-4 active:opacity-90">
          <Text className="font-heading-semibold text-base text-actevix-bg">Save session →</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
