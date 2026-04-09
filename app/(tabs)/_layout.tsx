import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { theme } from '@/constants/theme';
import { SessionLogsProvider } from '@/context/SessionLogsContext';
import { TeamProvider } from '@/context/TeamContext';
import { supabase } from '@/lib/supabase';

// ─── Settings Modal ───────────────────────────────────────────────────────────

function SettingsModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<{
    name: string;
    sport: string;
    height_feet: number;
    height_inches: number;
    weight_lbs: number;
    gender: string | null;
  } | null>(null);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (!visible) return;
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserEmail(session.user.email ?? '');
      const { data } = await supabase
        .from('profiles')
        .select('name, sport, height_feet, height_inches, weight_lbs, gender')
        .eq('id', session.user.id)
        .single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [visible]);

  const handleLogout = async () => {
    const confirm = () => new Promise<boolean>((resolve) => {
      if (Platform.OS === 'web') {
        resolve(window.confirm('Are you sure you want to log out?'));
      } else {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Log Out', style: 'destructive', onPress: () => resolve(true) },
        ]);
      }
    });

    const ok = await confirm();
    if (!ok) return;
    await supabase.auth.signOut();
    onClose();
    setTimeout(() => router.replace('/login'), 100);
  };

  const handleDeleteAccount = async () => {
    const confirm = () => new Promise<boolean>((resolve) => {
      if (Platform.OS === 'web') {
        resolve(window.confirm('Delete your account? This cannot be undone. All your data will be permanently removed.'));
      } else {
        Alert.alert(
          'Delete Account',
          'This will permanently delete your account and all your data. This cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Delete Forever', style: 'destructive', onPress: () => resolve(true) },
          ]
        );
      }
    });

    const ok = await confirm();
    if (!ok) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Delete all user data
      await supabase.from('session_logs').delete().eq('user_id', session.user.id);
      await supabase.from('ai_requests').delete().eq('user_id', session.user.id);
      await supabase.from('profiles').delete().eq('id', session.user.id);

      // Sign out
      await supabase.auth.signOut();
      onClose();
      setTimeout(() => router.replace('/login'), 100);
    } catch (e: any) {
      Alert.alert('Error', 'Could not delete account. Please try again or contact support.');
    }
  };

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
          accessibilityLabel="Close settings"
        />
        <View className="max-h-[92%] w-full rounded-t-3xl border-t border-actevix-border bg-actevix-surface px-5 pb-10 pt-3">
          {/* Handle */}
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-white/20" />

          <Text className="mb-1 font-heading text-2xl text-white">Settings</Text>
          <Text className="mb-6 font-body text-sm text-white/45">{userEmail}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Profile Summary */}
            {profile && (
              <View className="mb-4 rounded-2xl border border-actevix-border bg-actevix-bg p-4">
                <Text className="mb-3 font-body-medium text-xs uppercase tracking-wider text-white/40">
                  Your Profile
                </Text>
                {[
                  ['Name', profile.name],
                  ['Sport', profile.sport],
                  ['Height', `${profile.height_feet}' ${profile.height_inches}"`],
                  ['Weight', `${profile.weight_lbs} lbs`],
                  ['Gender', profile.gender ?? 'Not specified'],
                ].map(([label, value], i, arr) => (
                  <View
                    key={label}
                    className={`flex-row items-center justify-between py-2.5 ${i < arr.length - 1 ? 'border-b border-actevix-border' : ''}`}>
                    <Text className="font-body text-sm text-white/50">{label}</Text>
                    <Text className="font-body-medium text-sm text-white">{value}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Medical Disclaimer */}
            <View className="mb-4 rounded-2xl border border-yellow-500/25 bg-yellow-500/5 p-4">
              <Text className="mb-2 font-body-medium text-xs uppercase tracking-wider text-yellow-400">
                ⚠️ Medical Disclaimer
              </Text>
              <Text className="font-body text-sm leading-relaxed text-white/60">
                Actevix is not a medical device and is not intended to diagnose, treat, cure, or prevent any injury or medical condition. AI-generated insights are for informational purposes only.{'\n\n'}
                Always consult a qualified sports medicine professional or physician before making decisions about your health or training. If you experience severe pain, stop activity immediately and seek medical attention.
              </Text>
            </View>

            {/* Links */}
            <View className="mb-4 rounded-2xl border border-actevix-border bg-actevix-bg p-4">
              <Text className="mb-3 font-body-medium text-xs uppercase tracking-wider text-white/40">
                Legal
              </Text>
              <Pressable
                onPress={() => Linking.openURL('https://glow-moustache-df3.notion.site/Actevix-Privacy-Policy-088eadd9468149aba0d7054364c1c233?pvs=143')}
                className="flex-row items-center justify-between py-2.5 border-b border-actevix-border active:opacity-70">
                <Text className="font-body text-sm text-white">Privacy Policy</Text>
                <FontAwesome name="chevron-right" size={12} color="#4B5563" />
              </Pressable>
              <Pressable
                onPress={() => Linking.openURL('https://glow-moustache-df3.notion.site/Terms-of-Service-Actevix-b721bf3341b1483db9c148fcb72beb36?pvs=143')}
                className="flex-row items-center justify-between py-2.5 active:opacity-70">
                <Text className="font-body text-sm text-white">Terms of Service</Text>
                <FontAwesome name="chevron-right" size={12} color="#4B5563" />
              </Pressable>
            </View>

            {/* App Info */}
            <View className="mb-4 rounded-2xl border border-actevix-border bg-actevix-bg p-4">
              <Text className="mb-3 font-body-medium text-xs uppercase tracking-wider text-white/40">
                About
              </Text>
              <View className="flex-row items-center justify-between py-2.5 border-b border-actevix-border">
                <Text className="font-body text-sm text-white/50">Version</Text>
                <Text className="font-body text-sm text-white">1.0.0</Text>
              </View>
              <View className="flex-row items-center justify-between py-2.5">
                <Text className="font-body text-sm text-white/50">Made with ❤️ for athletes</Text>
              </View>
            </View>

            {/* Account Actions */}
            <View className="mb-4 rounded-2xl border border-actevix-border bg-actevix-bg p-4">
              <Text className="mb-3 font-body-medium text-xs uppercase tracking-wider text-white/40">
                Account
              </Text>
              <Pressable
                onPress={handleLogout}
                className="flex-row items-center justify-between py-2.5 border-b border-actevix-border active:opacity-70">
                <Text className="font-body text-sm text-white">Log Out</Text>
                <FontAwesome name="sign-out" size={14} color="#6B7280" />
              </Pressable>
              <Pressable
                onPress={handleDeleteAccount}
                className="flex-row items-center justify-between py-2.5 active:opacity-70">
                <Text className="font-body text-sm text-red-400">Delete Account</Text>
                <FontAwesome name="trash" size={14} color="#ef4444" />
              </Pressable>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Settings Button ──────────────────────────────────────────────────────────

function SettingsButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="mr-4 active:opacity-70">
      <FontAwesome name="user-circle" size={22} color={theme.colors.text} />
    </Pressable>
  );
}

// ─── Tab Layout ───────────────────────────────────────────────────────────────

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  const [settingsVisible, setSettingsVisible] = useState(false);

  const headerRight = () => (
    <SettingsButton onPress={() => setSettingsVisible(true)} />
  );

  return (
    <SessionLogsProvider>
      <TeamProvider>
        <SettingsModal
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
        />
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: theme.colors.teal,
            tabBarInactiveTintColor: '#6B7280',
            tabBarStyle: {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
            headerTitleStyle: { fontFamily: 'Syne_600SemiBold' },
            headerShown: useClientOnlyValue(false, true),
            headerRight,
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ color }) => <TabBarIcon name="dashboard" color={color} />,
            }}
          />
          <Tabs.Screen
            name="log"
            options={{
              title: 'Log',
              tabBarIcon: ({ color }) => <TabBarIcon name="pencil" color={color} />,
            }}
          />
          <Tabs.Screen
            name="team"
            options={{
              title: 'Team',
              tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
            }}
          />
        </Tabs>
      </TeamProvider>
    </SessionLogsProvider>
  );
}