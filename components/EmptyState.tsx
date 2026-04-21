import { Pressable, Text, View } from 'react-native';

type Props = {
  icon: string;
  title: string;
  subtitle: string;
  onAction?: () => void;
  actionLabel?: string;
};

export function EmptyState({ icon, title, subtitle, onAction, actionLabel }: Props) {
  return (
    <View className="items-center justify-center px-6 py-10">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl border border-actevix-border bg-actevix-surface">
        <Text style={{ fontSize: 32 }}>{icon}</Text>
      </View>
      <Text className="mb-2 text-center font-heading-semibold text-lg text-white">{title}</Text>
      <Text className="mb-6 text-center font-body text-sm leading-relaxed text-white/45">
        {subtitle}
      </Text>
      {onAction && actionLabel && (
        <Pressable
          onPress={onAction}
          className="rounded-xl bg-actevix-teal px-6 py-3 active:opacity-90">
          <Text className="font-heading-semibold text-sm text-actevix-bg">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
