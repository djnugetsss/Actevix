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

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email.trim()) return 'Please enter your email.';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Enter a valid email address.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (mode === 'signup' && password !== confirmPassword) return "Passwords don't match.";
    return null;
  };

  const handleSubmit = async () => {
    setError('');
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) { setError(signUpError.message); return; }
        router.replace('/onboarding');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) { setError(signInError.message); return; }

        // Check if onboarded
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setError('Something went wrong. Try again.'); return; }

        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarded')
          .eq('id', session.user.id)
          .single();

        router.replace(profile?.onboarded ? '/(tabs)' : '/onboarding');
      }
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
        contentContainerClassName="flex-grow justify-center px-5 py-12"
        keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View className="mb-10 items-center">
          <Text className="font-heading text-4xl text-white">
            <Text className="text-actevix-teal">Acte</Text>vix
          </Text>
          <Text className="mt-1 font-body text-sm text-white/45">
            Wear & Tear — Athlete Dashboard
          </Text>
        </View>

        {/* Card */}
        <View className="rounded-2xl border border-actevix-border bg-actevix-surface p-6">

          {/* Mode toggle */}
          <View className="mb-6 flex-row gap-1 rounded-xl bg-actevix-bg p-1">
            {(['login', 'signup'] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => { setMode(m); setError(''); }}
                className={`flex-1 items-center rounded-lg py-3 ${mode === m ? 'bg-actevix-teal' : 'bg-transparent'}`}>
                <Text className={`font-heading-semibold text-sm ${mode === m ? 'text-actevix-bg' : 'text-white/45'}`}>
                  {m === 'login' ? 'Log In' : 'Sign Up'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Error */}
          {error !== '' && (
            <View className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3">
              <Text className="font-body text-sm text-red-400">⚠️ {error}</Text>
            </View>
          )}

          {/* Email */}
          <Text className="mb-2 font-body-medium text-xs uppercase tracking-wider text-white/50">
            Email
          </Text>
          <TextInput
            className="mb-4 rounded-xl border border-actevix-border bg-actevix-bg px-4 py-3 font-body text-base text-white"
            placeholder="you@example.com"
            placeholderTextColor="#4B5563"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Password */}
          <Text className="mb-2 font-body-medium text-xs uppercase tracking-wider text-white/50">
            Password
          </Text>
          <TextInput
            className="mb-4 rounded-xl border border-actevix-border bg-actevix-bg px-4 py-3 font-body text-base text-white"
            placeholder="••••••••"
            placeholderTextColor="#4B5563"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Confirm password */}
          {mode === 'signup' && (
            <>
              <Text className="mb-2 font-body-medium text-xs uppercase tracking-wider text-white/50">
                Confirm Password
              </Text>
              <TextInput
                className="mb-4 rounded-xl border border-actevix-border bg-actevix-bg px-4 py-3 font-body text-base text-white"
                placeholder="••••••••"
                placeholderTextColor="#4B5563"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </>
          )}

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className="mt-2 items-center rounded-xl bg-actevix-teal py-4 active:opacity-90">
            <Text className="font-heading-semibold text-base text-actevix-bg">
              {loading ? 'Loading...' : mode === 'login' ? 'Log In →' : 'Create Account →'}
            </Text>
          </Pressable>
        </View>

        <Text className="mt-6 text-center font-body text-xs text-white/25">
          By continuing you agree to Actevix's Terms of Service and Privacy Policy.
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}