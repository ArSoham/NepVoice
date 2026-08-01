import { StyleSheet, View } from 'react-native';
import { colors } from '@/constants/theme';

// Simple, bold geometric illustrations drawn with View shapes
// so they render on web and native without external image assets.

export function OnboardingIllustration1() {
  // Camera + voice waves theme
  return (
    <View style={styles.stage}>
      <View style={[styles.circle, { backgroundColor: colors.accentLight }]}>
        <View style={[styles.cameraBody, { backgroundColor: colors.accent }]}>
          <View style={styles.cameraLens} />
          <View style={styles.cameraFlash} />
        </View>
        <View style={styles.waveRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: 18 + (i % 3) * 22,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export function OnboardingIllustration2() {
  // Ear / listening theme
  return (
    <View style={styles.stage}>
      <View style={[styles.circle, { backgroundColor: colors.primaryLight }]}>
        <View style={[styles.earOuter, { backgroundColor: colors.primary }]}>
          <View style={[styles.earInner, { backgroundColor: colors.primaryLight }]} />
        </View>
        <View style={styles.soundWaves}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.soundArc,
                {
                  width: 56 + i * 40,
                  height: 56 + i * 40,
                  borderRadius: 28 + i * 20,
                  borderWidth: 6 - i * 1,
                  opacity: 0.7 - i * 0.2,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export function OnboardingIllustration3() {
  // Friendly helper / checkmark theme
  return (
    <View style={styles.stage}>
      <View style={[styles.circle, { backgroundColor: colors.accentLight }]}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
            <View style={styles.checkStem} />
            <View style={styles.checkFoot} />
          </View>
        </View>
        <View style={styles.sparkles}>
          <View style={[styles.sparkle, { top: 10, left: 20 }]} />
          <View style={[styles.sparkle, { top: 30, right: 16 }]} />
          <View style={[styles.sparkle, { bottom: 24, left: 30 }]} />
        </View>
      </View>
    </View>
  );
}

const stageSize = 280;

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  circle: {
    width: stageSize,
    height: stageSize,
    borderRadius: stageSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Illustration 1
  cameraBody: {
    width: 120,
    height: 90,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  cameraLens: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 8,
    borderColor: colors.surface,
  },
  cameraFlash: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.surface,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  waveBar: {
    width: 12,
    borderRadius: 6,
  },
  // Illustration 2
  earOuter: {
    width: 90,
    height: 110,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earInner: {
    width: 44,
    height: 64,
    borderRadius: 24,
  },
  soundWaves: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundArc: {
    position: 'absolute',
    borderColor: colors.primary,
    borderStyle: 'solid',
  },
  // Illustration 3
  card: {
    width: 130,
    height: 130,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkStem: {
    position: 'absolute',
    width: 8,
    height: 30,
    backgroundColor: colors.surface,
    borderRadius: 4,
    transform: [{ rotate: '45deg' }, { translateY: -4 }],
  },
  checkFoot: {
    position: 'absolute',
    width: 8,
    height: 16,
    backgroundColor: colors.surface,
    borderRadius: 4,
    transform: [{ rotate: '-45deg' }, { translateX: -10 }, { translateY: 8 }],
  },
  sparkles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  sparkle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
});
