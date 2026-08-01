import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Mic } from 'lucide-react-native';
import { colors } from '@/constants/theme';

interface PulsingMicProps {
  size?: number;
  color?: string;
  active?: boolean;
}

export function PulsingMic({ size = 32, color = colors.textOnPrimary, active = true }: PulsingMicProps) {
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);
  const ring3 = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      cancelAnimation(ring1);
      cancelAnimation(ring2);
      cancelAnimation(ring3);
      ring1.value = 0;
      ring2.value = 0;
      ring3.value = 0;
      return;
    }
    ring1.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }), -1, false);
    ring2.value = withDelay(600, withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }), -1, false));
    ring3.value = withDelay(1200, withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }), -1, false));
  }, [active]);

  const ringStyle = (sv: typeof ring1, max: number) =>
    useAnimatedStyle(() => ({
      opacity: 0.5 * (1 - sv.value),
      transform: [{ scale: 1 + sv.value * max }],
    }));

  const r1 = ringStyle(ring1, 1.4);
  const r2 = ringStyle(ring2, 1.4);
  const r3 = ringStyle(ring3, 1.4);

  const ringSize = size * 2.4;

  return (
    <View style={styles.container}>
      <View style={[styles.ringBase, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}>
        <Animated.View style={[styles.ring, { borderRadius: ringSize / 2 }, r1]} />
        <Animated.View style={[styles.ring, { borderRadius: ringSize / 2 }, r2]} />
        <Animated.View style={[styles.ring, { borderRadius: ringSize / 2 }, r3]} />
      </View>
      <View style={[styles.core, { width: size * 1.6, height: size * 1.6, borderRadius: size * 0.8 }]}>
        <Mic size={size} color={color} strokeWidth={2.5} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringBase: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: colors.accent,
  },
  core: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accentDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
