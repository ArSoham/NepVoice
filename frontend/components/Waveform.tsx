import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';

interface WaveformProps {
  active?: boolean;
  barCount?: number;
  color?: string;
  maxBarHeight?: number;
}

export function Waveform({
  active = true,
  barCount = 7,
  color = colors.primary,
  maxBarHeight = 96,
}: WaveformProps) {
  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <View style={styles.container}>
      {bars.map((i) => (
        <WaveBar key={i} index={i} active={active} color={color} maxBarHeight={maxBarHeight} />
      ))}
    </View>
  );
}

function WaveBar({
  index,
  active,
  color,
  maxBarHeight,
}: {
  index: number;
  active: boolean;
  color: string;
  maxBarHeight: number;
}) {
  const h = useSharedValue(0.25);

  useEffect(() => {
    if (!active) {
      cancelAnimation(h);
      h.value = 0.25;
      return;
    }
    const duration = 600 + (index % 3) * 220;
    const delay = index * 110;
    h.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    );
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: Math.max(12, h.value * maxBarHeight),
    opacity: 0.55 + h.value * 0.45,
  }));

  return <Animated.View style={[styles.bar, { backgroundColor: color }, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 120,
  },
  bar: {
    width: 12,
    borderRadius: 6,
  },
});
