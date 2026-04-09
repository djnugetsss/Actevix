import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useSessionLogs } from '@/context/SessionLogsContext';

// ─── Expanded Data ────────────────────────────────────────────────────────────

const ALL_SPORTS = [
  'Basketball', 'Football', 'Soccer', 'Baseball', 'Softball',
  'Tennis', 'Swimming', 'Track & Field', 'Volleyball', 'Wrestling',
  'MMA / Boxing', 'Lacrosse', 'Hockey', 'Rugby', 'Golf',
  'Cycling', 'CrossFit', 'Gymnastics', 'Dance', 'Cheerleading',
  'Rowing', 'Working Out', 'Other',
] as const;

const ALL_MUSCLES = [
  // Lower Body
  'Quads', 'Hamstrings', 'Glutes', 'Hip Flexors', 'Groin',
  'Calves', 'Shins', 'IT Band', 'Achilles',
  // Joints
  'Knees', 'Ankles', 'Hips',
  // Upper Body
  'Chest', 'Shoulders', 'Rotator Cuff', 'Upper Back', 'Lower Back',
  'Traps', 'Arms', 'Forearms', 'Wrists', 'Elbow',
  // Core / Neck
  'Core', 'Neck',
] as const;

const ALL_WORKOUT_TYPES = [
  'Legs', 'Upper Body', 'Full Body', 'Push', 'Pull',
  'Cardio', 'HIIT', 'Strength', 'Mobility / Stretching',
  'Recovery', 'Practice', 'Game', 'Scrimmage',
  'Speed & Agility', 'Weight Room', 'Film / Rest',
] as const;

// ─── Sport Presets (D: auto-suggest) ─────────────────────────────────────────

const SPORT_PRESETS: Record<string, { muscles: string[]; workoutTypes: string[] }> = {
  Basketball: {
    muscles: ['Quads', 'Hamstrings', 'Knees', 'Ankles', 'Calves'],
    workoutTypes: ['Practice', 'Game', 'Legs', 'Speed & Agility'],
  },
  Football: {
    muscles: ['Quads', 'Hamstrings', 'Shoulders', 'Knees', 'Lower Back'],
    workoutTypes: ['Practice', 'Game', 'Strength', 'Speed & Agility', 'Weight Room'],
  },
  Soccer: {
    muscles: ['Quads', 'Hamstrings', 'Calves', 'Knees', 'Ankles', 'Hip Flexors'],
    workoutTypes: ['Practice', 'Game', 'Cardio', 'Legs', 'Speed & Agility'],
  },
  Baseball: {
    muscles: ['Shoulders', 'Rotator Cuff', 'Forearms', 'Elbow', 'Upper Back'],
    workoutTypes: ['Practice', 'Game', 'Upper Body', 'Strength'],
  },
  Softball: {
    muscles: ['Shoulders', 'Rotator Cuff', 'Forearms', 'Elbow', 'Upper Back'],
    workoutTypes: ['Practice', 'Game', 'Upper Body', 'Strength'],
  },
  Tennis: {
    muscles: ['Shoulders', 'Forearms', 'Elbow', 'Knees', 'Calves'],
    workoutTypes: ['Practice', 'Game', 'Upper Body', 'Cardio'],
  },
  Swimming: {
    muscles: ['Shoulders', 'Rotator Cuff', 'Upper Back', 'Arms', 'Core'],
    workoutTypes: ['Practice', 'Cardio', 'Full Body'],
  },
  'Track & Field': {
    muscles: ['Quads', 'Hamstrings', 'Calves', 'Achilles', 'Hip Flexors'],
    workoutTypes: ['Cardio', 'Speed & Agility', 'Practice', 'Strength'],
  },
  Volleyball: {
    muscles: ['Shoulders', 'Knees', 'Ankles', 'Quads', 'Upper Back'],
    workoutTypes: ['Practice', 'Game', 'Upper Body', 'Legs'],
  },
  Wrestling: {
    muscles: ['Neck', 'Shoulders', 'Core', 'Hips', 'Quads'],
    workoutTypes: ['Practice', 'Strength', 'Full Body', 'Weight Room'],
  },
  'MMA / Boxing': {
    muscles: ['Shoulders', 'Arms', 'Core', 'Neck', 'Hips'],
    workoutTypes: ['Practice', 'HIIT', 'Strength', 'Cardio', 'Full Body'],
  },
  Lacrosse: {
    muscles: ['Shoulders', 'Quads', 'Hamstrings', 'Knees', 'Ankles'],
    workoutTypes: ['Practice', 'Game', 'Speed & Agility', 'Strength'],
  },
  Hockey: {
    muscles: ['Groin', 'Hip Flexors', 'Quads', 'Knees', 'Lower Back'],
    workoutTypes: ['Practice', 'Game', 'Legs', 'Strength'],
  },
  Rugby: {
    muscles: ['Quads', 'Shoulders', 'Neck', 'Lower Back', 'Knees'],
    workoutTypes: ['Practice', 'Game', 'Strength', 'Full Body'],
  },
  Golf: {
    muscles: ['Lower Back', 'Forearms', 'Shoulders', 'Core', 'Hips'],
    workoutTypes: ['Practice', 'Mobility / Stretching', 'Strength'],
  },
  Cycling: {
    muscles: ['Quads', 'Hamstrings', 'Calves', 'Knees', 'Lower Back'],
    workoutTypes: ['Cardio', 'Strength', 'Recovery'],
  },
  CrossFit: {
    muscles: ['Shoulders', 'Lower Back', 'Quads', 'Core', 'Arms'],
    workoutTypes: ['HIIT', 'Strength', 'Full Body', 'Weight Room'],
  },
  Gymnastics: {
    muscles: ['Shoulders', 'Wrists', 'Core', 'Ankles', 'Upper Back'],
    workoutTypes: ['Practice', 'Strength', 'Mobility / Stretching', 'Full Body'],
  },
  Dance: {
    muscles: ['Ankles', 'Knees', 'Hip Flexors', 'Core', 'Calves'],
    workoutTypes: ['Practice', 'Cardio', 'Mobility / Stretching'],
  },
  Cheerleading: {
    muscles: ['Shoulders', 'Core', 'Ankles', 'Knees', 'Quads'],
    workoutTypes: ['Practice', 'Strength', 'Cardio'],
  },
  Rowing: {
    muscles: ['Upper Back', 'Lower Back', 'Arms', 'Core', 'Quads'],
    workoutTypes: ['Cardio', 'Strength', 'Full Body', 'Practice'],
  },
  'Working Out': {
    muscles: ['Quads', 'Chest', 'Shoulders', 'Back', 'Arms'],
    workoutTypes: ['Strength', 'HIIT', 'Upper Body', 'Legs', 'Full Body'],
  },
  Other: {
    muscles: [],
    workoutTypes: ['Full Body', 'Cardio', 'Strength'],
  },
};

// ─── Initial Form ─────────────────────────────────────────────────────────────

const initialForm = {
  sport: 'Basketball',
  position: '',
  workoutType: 'Practice',
  duration: 60,
  intensity: 6,
  muscles: [] as string[],
  painAreas: [] as string[],
  painLevel: 3,
};

// ─── Searchable Chip Row ──────────────────────────────────────────────────────

function SearchableChipRow({
  label,
  values,
  suggested,
  selected,
  onToggle,
  danger,
}: {
  label: string;
  values: readonly string[];
  suggested: string[];
  selected: string[];
  onToggle: (v: string) => void;
  danger?: boolean;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    return values.filter((v) => v.toLowerCase().includes(search.toLowerCase()));
  }, [search, values]);

  const displayValues = filtered ?? suggested;
  const showingSuggested = !filtered;

  return (
    <View className="mb-4">
      <Text className="mb-2 font-body-medium text-sm text-white/70">{label}</Text>

      {/* Search input */}
      <TextInput
        className="mb-2 rounded-xl border border-actevix-border bg-actevix-bg px-3 py-2 font-body text-sm text-white"
        placeholder="Search muscles..."
        placeholderTextColor="#4B5563"
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
      />

      {/* Suggested label */}
      {showingSuggested && suggested.length > 0 && (
        <Text className="mb-2 font-body text-xs text-white/35">
          Suggested for your sport
        </Text>
      )}

      {/* Chips */}
      <View className="flex-row flex-wrap gap-2">
        {displayValues.map((v) => {
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
                className={`font-body text-sm ${
                  on ? (danger ? 'text-red-400' : 'text-actevix-teal') : 'text-white/60'
                }`}>
                {v}
              </Text>
            </Pressable>
          );
        })}
        {displayValues.length === 0 && (
          <Text className="font-body text-sm text-white/30">No muscles found</Text>
        )}
      </View>

      {/* Selected count if any selected outside suggestions */}
      {selected.length > 0 && (
        <Text className="mt-2 font-body text-xs text-actevix-teal">
          {selected.length} selected: {selected.join(', ')}
        </Text>
      )}
    </View>
  );
}

// ─── Sport Picker ─────────────────────────────────────────────────────────────

function SportPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return ALL_SPORTS;
    return ALL_SPORTS.filter((s) => s.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  return (
    <View className="mb-4">
      <Text className="mb-2 font-body-medium text-sm text-white/70">Sport</Text>
      <TextInput
        className="mb-2 rounded-xl border border-actevix-border bg-actevix-bg px-3 py-2 font-body text-sm text-white"
        placeholder="Search sport..."
        placeholderTextColor="#4B5563"
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 pr-2">
          {filtered.map((s) => {
            const on = value === s;
            return (
              <Pressable
                key={s}
                onPress={() => onChange(s)}
                className={`rounded-full border px-4 py-2 ${
                  on ? 'border-actevix-teal bg-actevix-teal/15' : 'border-actevix-border bg-actevix-surface'
                }`}>
                <Text className={`font-body text-sm ${on ? 'text-actevix-teal' : 'text-white/70'}`}>
                  {s}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Workout Type Picker ──────────────────────────────────────────────────────

function WorkoutTypePicker({
  value,
  onChange,
  suggested,
}: {
  value: string;
  onChange: (v: string) => void;
  suggested: string[];
}) {
  const [showAll, setShowAll] = useState(false);
  const options = showAll ? ALL_WORKOUT_TYPES : suggested.length > 0 ? suggested : ALL_WORKOUT_TYPES;

  return (
    <View className="mb-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="font-body-medium text-sm text-white/70">Workout type</Text>
        <Pressable onPress={() => setShowAll((v) => !v)}>
          <Text className="font-body text-xs text-actevix-teal">
            {showAll ? 'Show suggested' : 'Show all'}
          </Text>
        </Pressable>
      </View>
      {!showAll && suggested.length > 0 && (
        <Text className="mb-2 font-body text-xs text-white/35">Suggested for your sport</Text>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 pr-2">
          {options.map((o) => {
            const on = value === o;
            return (
              <Pressable
                key={o}
                onPress={() => onChange(o)}
                className={`rounded-full border px-4 py-2 ${
                  on ? 'border-actevix-teal bg-actevix-teal/15' : 'border-actevix-border bg-actevix-surface'
                }`}>
                <Text className={`font-body text-sm ${on ? 'text-actevix-teal' : 'text-white/70'}`}>
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LogScreen() {
  const { addLog } = useSessionLogs();
  const [form, setForm] = useState(initialForm);

  const preset = SPORT_PRESETS[form.sport] ?? SPORT_PRESETS.Other;

  const handleSportChange = (sport: string) => {
    const newPreset = SPORT_PRESETS[sport] ?? SPORT_PRESETS.Other;
    setForm((f) => ({
      ...f,
      sport,
      workoutType: newPreset.workoutTypes[0] ?? 'Full Body',
      // Keep existing selections, just update sport
    }));
  };

  const toggleChip = (field: 'muscles' | 'painAreas', val: string) => {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(val)
        ? f[field].filter((x) => x !== val)
        : [...f[field], val],
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

        {/* Sport */}
        <SportPicker value={form.sport} onChange={handleSportChange} />

        {/* Position */}
        <Text className="mb-1 font-body-medium text-sm text-white/70">Position (optional)</Text>
        <TextInput
          className="mb-4 rounded-xl border border-actevix-border bg-actevix-bg px-3 py-3 font-body text-base text-white"
          placeholder="e.g. Point Guard, striker…"
          placeholderTextColor="#6B7280"
          value={form.position}
          onChangeText={(position) => setForm((f) => ({ ...f, position }))}
        />

        {/* Workout Type */}
        <WorkoutTypePicker
          value={form.workoutType}
          onChange={(workoutType) => setForm((f) => ({ ...f, workoutType }))}
          suggested={preset.workoutTypes}
        />

        {/* Duration */}
        <Text className="mb-1 font-body-medium text-sm text-white/70">
          Duration: <Text className="text-white">{Math.round(form.duration)} min</Text>
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

        {/* Intensity */}
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

        {/* Muscles Worked */}
        <SearchableChipRow
          label="Muscles worked"
          values={ALL_MUSCLES}
          suggested={preset.muscles}
          selected={form.muscles}
          onToggle={(m) => toggleChip('muscles', m)}
        />

        {/* Pain Areas */}
        <SearchableChipRow
          label="Pain / soreness areas"
          values={ALL_MUSCLES}
          suggested={preset.muscles}
          selected={form.painAreas}
          onToggle={(m) => toggleChip('painAreas', m)}
          danger
        />

        {/* Pain Level */}
        {form.painAreas.length > 0 && (
          <>
            <Text className="mb-1 font-body-medium text-sm text-white/70">
              Pain level: <Text className="text-red-400">{form.painLevel}/10</Text>
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