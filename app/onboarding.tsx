import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

const SPORTS = [
  'Football', 'Basketball', 'Soccer', 'Track',
  'Swimming', 'Cricket', 'Baseball', 'Gymnastics',
  'Working Out', 'Tennis', 'Hockey', 'Volleyball',
];

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const FEET_OPTIONS = [4, 5, 6, 7];
const INCHES_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

type Step = 'name' | 'body' | 'sport' | 'review';
const STEPS: Step[] = ['name', 'body', 'sport', 'review'];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('name');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [feet, setFeet] = useState(5);
  const [inches, setInches] = useState(10);
  const [weight, setWeight] = useState(170);
  const [sport, setSport] = useState('');

  const stepIndex = STEPS.indexOf(step);

  const canContinue = () => {
    if (step === 'name') return name.trim().length >= 2;
    if (step === 'sport') return sport !== '';
    return true;
  };

  const next = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const back = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const finish = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Session expired. Please log in again.');
        setLoading(false);
        return;
      }
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: session.user.id,
        name,
        gender: gender || null,
        height_feet: feet,
        height_inches: inches,
        weight_lbs: weight,
        sport,
        onboarded: true,
        updated_at: new Date().toISOString(),
      });
      if (upsertError) { setError(upsertError.message); return; }
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-actevix-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerClassName="px-5 pb-16 pt-14"
        keyboardShouldPersistTaps="handled">

        {/* Progress bar */}
        <View className="mb-8 flex-row gap-2">
          {STEPS.map((s, i) => (
            <View
              key={s}
              className="h-1 flex-1 rounded-full"
              style={{
                backgroundColor:
                  i < stepIndex ? '#1D9E7588' : i === stepIndex ? '#1D9E75' : '#1E2A36',
              }}
            />
          ))}
        </View>

        {/* Error */}
        {error !== '' && (
          <View className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3">
            <Text className="font-body text-sm text-red-400">⚠️ {error}</Text>
          </View>
        )}

        {/* ── STEP 1: Name & Gender ── */}
        {step === 'name' && (
          <View>
            <Text className="mb-1 font-heading-semibold text-xs uppercase tracking-wider text-actevix-teal">
              Step 1 of 4
            </Text>
            <Text className="mb-1 font-heading text-3xl text-white">What's your name?</Text>
            <Text className="mb-8 font-body text-sm text-white/50">
              This is how we'll greet you in the app.
            </Text>

            <Text className="mb-2 font-body-medium text-xs uppercase tracking-wider text-white/50">
              Full Name
            </Text>
            <TextInput
              className="mb-6 rounded-xl border border-actevix-border bg-actevix-surface px-4 py-3 font-body text-base text-white"
              placeholder="e.g. Marcus Johnson"
              placeholderTextColor="#4B5563"
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <Text className="mb-3 font-body-medium text-xs uppercase tracking-wider text-white/50">
              Gender <Text className="font-body normal-case text-white/25">(optional)</Text>
            </Text>
            <View className="mb-8 flex-row flex-wrap gap-2">
              {GENDERS.map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGender(gender === g ? '' : g)}
                  className={`rounded-full border px-4 py-2 ${gender === g ? 'border-actevix-teal bg-actevix-teal/15' : 'border-actevix-border bg-actevix-surface'}`}>
                  <Text className={`font-body text-sm ${gender === g ? 'text-actevix-teal' : 'text-white/60'}`}>
                    {g}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={next}
              disabled={!canContinue()}
              className={`items-center rounded-xl py-4 ${canContinue() ? 'bg-actevix-teal active:opacity-90' : 'bg-actevix-surface'}`}>
              <Text className={`font-heading-semibold text-base ${canContinue() ? 'text-actevix-bg' : 'text-white/25'}`}>
                Continue →
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── STEP 2: Height & Weight ── */}
        {step === 'body' && (
          <View>
            <Text className="mb-1 font-heading-semibold text-xs uppercase tracking-wider text-actevix-teal">
              Step 2 of 4
            </Text>
            <Text className="mb-1 font-heading text-3xl text-white">Body measurements</Text>
            <Text className="mb-8 font-body text-sm text-white/50">
              Used to calculate training load and injury risk more accurately.
            </Text>

            <Text className="mb-2 font-body-medium text-xs uppercase tracking-wider text-white/50">
              Height — Feet
            </Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {FEET_OPTIONS.map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setFeet(f)}
                  className={`rounded-xl border px-5 py-3 ${feet === f ? 'border-actevix-teal bg-actevix-teal/15' : 'border-actevix-border bg-actevix-surface'}`}>
                  <Text className={`font-body text-sm ${feet === f ? 'text-actevix-teal' : 'text-white/60'}`}>
                    {f} ft
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text className="mb-2 font-body-medium text-xs uppercase tracking-wider text-white/50">
              Inches
            </Text>
            <View className="mb-6 flex-row flex-wrap gap-2">
              {INCHES_OPTIONS.map((i) => (
                <Pressable
                  key={i}
                  onPress={() => setInches(i)}
                  className={`rounded-xl border px-4 py-3 ${inches === i ? 'border-actevix-teal bg-actevix-teal/15' : 'border-actevix-border bg-actevix-surface'}`}>
                  <Text className={`font-body text-sm ${inches === i ? 'text-actevix-teal' : 'text-white/60'}`}>
                    {i}"
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text className="mb-2 font-body-medium text-xs uppercase tracking-wider text-white/50">
              Weight — {weight} lbs
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
              <View className="flex-row gap-2 pr-4">
                {Array.from({ length: 33 }, (_, i) => 80 + i * 10).map((w) => (
                  <Pressable
                    key={w}
                    onPress={() => setWeight(w)}
                    className={`rounded-xl border px-4 py-3 ${weight === w ? 'border-actevix-teal bg-actevix-teal/15' : 'border-actevix-border bg-actevix-surface'}`}>
                    <Text className={`font-body text-sm ${weight === w ? 'text-actevix-teal' : 'text-white/60'}`}>
                      {w}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Pressable
              onPress={next}
              className="mb-3 items-center rounded-xl bg-actevix-teal py-4 active:opacity-90">
              <Text className="font-heading-semibold text-base text-actevix-bg">Continue →</Text>
            </Pressable>
            <Pressable onPress={back} className="items-center py-3">
              <Text className="font-body text-sm text-white/40">← Back</Text>
            </Pressable>
          </View>
        )}

        {/* ── STEP 3: Sport ── */}
        {step === 'sport' && (
          <View>
            <Text className="mb-1 font-heading-semibold text-xs uppercase tracking-wider text-actevix-teal">
              Step 3 of 4
            </Text>
            <Text className="mb-1 font-heading text-3xl text-white">Primary sport</Text>
            <Text className="mb-8 font-body text-sm text-white/50">
              We'll tailor recovery tips and injury risk tracking to your sport.
            </Text>

            <View className="mb-8 flex-row flex-wrap gap-2">
              {SPORTS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setSport(s)}
                  className={`rounded-full border px-4 py-2 ${sport === s ? 'border-actevix-teal bg-actevix-teal/15' : 'border-actevix-border bg-actevix-surface'}`}>
                  <Text className={`font-body text-sm ${sport === s ? 'text-actevix-teal' : 'text-white/60'}`}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={next}
              disabled={!canContinue()}
              className={`mb-3 items-center rounded-xl py-4 ${canContinue() ? 'bg-actevix-teal active:opacity-90' : 'bg-actevix-surface'}`}>
              <Text className={`font-heading-semibold text-base ${canContinue() ? 'text-actevix-bg' : 'text-white/25'}`}>
                Continue →
              </Text>
            </Pressable>
            <Pressable onPress={back} className="items-center py-3">
              <Text className="font-body text-sm text-white/40">← Back</Text>
            </Pressable>
          </View>
        )}

        {/* ── STEP 4: Review ── */}
        {step === 'review' && (
          <View>
            <Text className="mb-1 font-heading-semibold text-xs uppercase tracking-wider text-actevix-teal">
              Step 4 of 4
            </Text>
            <Text className="mb-1 font-heading text-3xl text-white">
              Looking good, {name.split(' ')[0]}.
            </Text>
            <Text className="mb-8 font-body text-sm text-white/50">
              Review your profile before jumping in.
            </Text>

            <View className="mb-6 items-center">
              <View className="h-20 w-20 items-center justify-center rounded-full border-2 border-actevix-teal bg-actevix-teal/15">
                <Text className="font-heading text-3xl text-actevix-teal">
                  {name.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>

            <View className="mb-8 rounded-2xl border border-actevix-border bg-actevix-surface p-4">
              {[
                ['Name', name],
                ['Gender', gender || 'Not specified'],
                ['Height', `${feet}' ${inches}"`],
                ['Weight', `${weight} lbs`],
                ['Primary Sport', sport],
              ].map(([label, value], i, arr) => (
                <View
                  key={label}
                  className={`flex-row items-center justify-between py-3 ${i < arr.length - 1 ? 'border-b border-actevix-border' : ''}`}>
                  <Text className="font-body text-sm text-white/50">{label}</Text>
                  <Text className="font-body-medium text-sm text-white">{value}</Text>
                </View>
              ))}
            </View>

            <Pressable
              onPress={finish}
              disabled={loading}
              className="mb-3 items-center rounded-xl bg-actevix-teal py-4 active:opacity-90">
              <Text className="font-heading-semibold text-base text-actevix-bg">
                {loading ? 'Saving...' : "Let's Go 🚀"}
              </Text>
            </Pressable>
            <Pressable onPress={back} className="items-center py-3">
              <Text className="font-body text-sm text-white/40">← Edit</Text>
            </Pressable>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}