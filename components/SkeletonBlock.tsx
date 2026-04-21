import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import type { DimensionValue } from 'react-native';

type Props = {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
};

export function SkeletonBlock({ width, height, borderRadius = 8 }: Props) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <View style={{ width }}>
      <Animated.View
        className="bg-actevix-surface"
        style={{ height, borderRadius, opacity }}
      />
    </View>
  );
}
