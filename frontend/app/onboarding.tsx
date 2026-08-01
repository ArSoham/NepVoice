import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Dimensions, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkipForward, ArrowRight, Volume2 } from 'lucide-react-native';
import { colors, fontFamilies, radius, spacing, typography } from '@/constants/theme';
import {
  OnboardingIllustration1,
  OnboardingIllustration2,
  OnboardingIllustration3,
} from '@/components/OnboardingIllustrations';
import { useApp } from '@/context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const slides = [
  {
    illustration: <OnboardingIllustration1 />,
    title: 'Snap a Photo',
    subtitle: 'Point your camera at anything. Tap the big button to take a photo.',
  },
  {
    illustration: <OnboardingIllustration2 />,
    title: 'Listen to the Answer',
    subtitle: 'NepVoice reads it out loud in clear, simple words. No reading needed.',
  },
  {
    illustration: <OnboardingIllustration3 />,
    title: 'Ask Again Anytime',
    subtitle: 'Tap the microphone to ask questions about anything you see.',
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useApp();
  const [index, setIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const goNext = () => {
    if (index < slides.length - 1) {
      Animated.timing(translateX, { toValue: -(index + 1) * SCREEN_WIDTH, duration: 300, useNativeDriver: true }).start();
      setIndex(index + 1);
    } else {
      completeOnboarding();
    }
  };

  const skip = () => {
    completeOnboarding();
  };

  const slide = slides[index];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.skipRow}>
        <Pressable
          onPress={skip}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          style={({ pressed }) => [styles.skipButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={styles.skipText}>Skip</Text>
          <SkipForward size={24} color={colors.primary} strokeWidth={2.5} />
        </Pressable>
      </View>

      <Animated.View style={[styles.slides, { transform: [{ translateX }] }]}>
        {slides.map((s, i) => (
          <View key={i} style={styles.slide}>
            {s.illustration}
            <View style={styles.textWrap}>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.subtitle}>{s.subtitle}</Text>
            </View>
          </View>
        ))}
      </Animated.View>

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === index ? styles.dotActive : null]} />
        ))}
      </View>

      <View style={styles.voiceCue}>
        <Volume2 size={24} color={colors.muted} strokeWidth={2.5} />
        <Text style={styles.voiceCueText}>Tap to hear this out loud</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={goNext}
          accessibilityRole="button"
          accessibilityLabel={index === slides.length - 1 ? 'Get started' : 'Next'}
          style={({ pressed }) => [styles.nextButton, { opacity: pressed ? 0.88 : 1 }]}
        >
          <Text style={styles.nextLabel}>{index === slides.length - 1 ? 'Get Started' : 'Next'}</Text>
          <ArrowRight size={28} color={colors.textOnPrimary} strokeWidth={2.5} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  alignItems: 'center',
  justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  overflow: 'hidden',
  position: 'relative',
  width: '100%',
  height: '100%',
  minHeight: '100%',
  minWidth: '100%',
  maxWidth: '100%',
  maxHeight: '100%',
  flexBasis: '100%',
    flexGrow: 1,
    flexShrink: 1,
  },
  skipRow: {
    width: '100%',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 64,
    minWidth: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipText: {
    ...typography.bodyLarge,
    fontFamily: fontFamilies.bold,
    color: colors.primary,
  },
  slides: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * slides.length,
  },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  textWrap: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  title: {
    ...typography.display,
    fontFamily: fontFamilies.extraBold,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    fontFamily: fontFamilies.medium,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.surfaceDim,
  },
  dotActive: {
    width: 36,
    borderRadius: 7,
    backgroundColor: colors.primary,
  },
  voiceCue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  voiceCueText: {
    ...typography.caption,
    fontFamily: fontFamilies.semiBold,
    color: colors.muted,
  },
  actions: {
    width: '100%',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  nextButton: {
    minHeight: 80,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  nextLabel: {
    ...typography.bodyLarge,
    fontSize: 24,
    fontFamily: fontFamilies.extraBold,
    color: colors.textOnPrimary,
  },
});
