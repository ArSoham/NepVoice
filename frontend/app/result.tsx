import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Mic, Play, Pause, ArrowLeft, Volume2, RotateCcw, Square } from 'lucide-react-native';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  RecordingPresets,
  AudioModule,
} from 'expo-audio';
import { colors, fontFamilies, radius, spacing, typography } from '@/constants/theme';
import { Waveform } from '@/components/Waveform';
import { useApp } from '@/context/AppContext';
import { askQuestionAudio, ApiError } from '@/services/api';

export default function ResultScreen() {
  const { scans } = useApp();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const latest = (id ? scans.find((s) => s.id === id) : undefined) ?? scans[0];

  const [followUpState, setFollowUpState] = useState<
    'idle' | 'recording' | 'processing' | 'error'
  >('idle');
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<{ text: string; audioUrl: string | null } | null>(null);

  // Main summary audio player.
  const mainPlayer = useAudioPlayer(latest?.audioUrl ?? undefined);
  const mainStatus = useAudioPlayerStatus(mainPlayer);

  // Follow-up answer audio player (separate instance, only has a source
  // once a question has been answered).
  const answerPlayer = useAudioPlayer(answer?.audioUrl ?? undefined);
  const answerStatus = useAudioPlayerStatus(answerPlayer);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // Auto-play the summary once, when it's ready.
  useEffect(() => {
    if (latest?.audioUrl) {
      mainPlayer.play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest?.audioUrl]);

  if (!latest) {
    return (
      <SafeAreaView style={styles.emptyContainer} edges={['top', 'bottom']}>
        <Text style={styles.emptyText}>No scan yet. Go back and snap a photo.</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back to Camera</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const toggleMainPlay = () => {
    if (mainStatus.playing) {
      mainPlayer.pause();
    } else {
      mainPlayer.play();
    }
  };

  const toggleAnswerPlay = () => {
    if (answerStatus.playing) {
      answerPlayer.pause();
    } else {
      answerPlayer.play();
    }
  };

  const startRecording = async () => {
    setFollowUpError(null);
    setAnswer(null);
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setFollowUpState('error');
      setFollowUpError('Microphone permission is needed to ask a question.');
      return;
    }
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setFollowUpState('recording');
    } catch {
      setFollowUpState('error');
      setFollowUpError("Couldn't start the microphone. Try again.");
    }
  };

  const stopRecordingAndAsk = async () => {
    setFollowUpState('processing');
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('No recording captured.');

      const result = await askQuestionAudio(uri);
      setAnswer({ text: result.answer, audioUrl: result.audio_url });
      setFollowUpState('idle');
    } catch (err) {
      setFollowUpState('error');
      if (err instanceof ApiError) {
        setFollowUpError(err.message);
      } else {
        setFollowUpError(
          "Couldn't get an answer — check the backend is reachable and try again.",
        );
      }
    }
  };

  const handleAskButtonPress = () => {
    if (followUpState === 'recording') {
      stopRecordingAndAsk();
    } else {
      startRecording();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Back to camera"
        >
          <ArrowLeft size={28} color={colors.textInverse} strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.headerTitle}>Result</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.thumbnailWrap}>
          <View style={[styles.thumbnail, { backgroundColor: latest.color }]}>
            <View style={styles.thumbnailInner}>
              <Volume2 size={56} color={colors.textInverse} strokeWidth={2} />
            </View>
          </View>
          <Text style={styles.thumbnailLabel}>Your Photo</Text>
        </View>

        <View style={styles.playerCard}>
          <Text style={styles.cardTitle}>NepVoice says:</Text>
          <Text style={styles.summaryText}>{latest.summary}</Text>

          <View style={styles.waveRow}>
            <Waveform active={mainStatus.playing} color={colors.primary} maxBarHeight={80} />
          </View>

          <Pressable
            onPress={toggleMainPlay}
            style={({ pressed }) => [styles.playButton, { opacity: pressed ? 0.88 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel={mainStatus.playing ? 'Pause audio' : 'Play audio'}
          >
            {mainStatus.playing ? (
              <Pause size={40} color={colors.textOnPrimary} strokeWidth={2.5} fill={colors.textOnPrimary} />
            ) : (
              <Play size={40} color={colors.textOnPrimary} strokeWidth={2.5} fill={colors.textOnPrimary} />
            )}
            <Text style={styles.playLabel}>{mainStatus.playing ? 'Pause' : 'Play Again'}</Text>
          </Pressable>
        </View>

        {followUpState === 'recording' && (
          <View style={styles.followUpIndicator}>
            <Waveform active color={colors.accent} maxBarHeight={60} barCount={5} />
            <Text style={styles.followUpText}>Listening to your question... tap to stop</Text>
          </View>
        )}

        {followUpState === 'processing' && (
          <View style={styles.followUpIndicator}>
            <Text style={styles.followUpText}>Thinking about your question...</Text>
          </View>
        )}

        {followUpState === 'error' && followUpError && (
          <View style={styles.errorCard}>
            <Text style={styles.errorCardText}>{followUpError}</Text>
          </View>
        )}

        {answer && (
          <View style={styles.answerCard}>
            <Text style={styles.cardTitle}>Answer:</Text>
            <Text style={styles.summaryText}>{answer.text}</Text>
            {answer.audioUrl && (
              <Pressable
                onPress={toggleAnswerPlay}
                style={({ pressed }) => [styles.playButton, { opacity: pressed ? 0.88 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel={answerStatus.playing ? 'Pause answer' : 'Play answer'}
              >
                {answerStatus.playing ? (
                  <Pause size={32} color={colors.textOnPrimary} strokeWidth={2.5} fill={colors.textOnPrimary} />
                ) : (
                  <Play size={32} color={colors.textOnPrimary} strokeWidth={2.5} fill={colors.textOnPrimary} />
                )}
                <Text style={styles.playLabel}>{answerStatus.playing ? 'Pause' : 'Play Answer'}</Text>
              </Pressable>
            )}
          </View>
        )}

        <Pressable
          onPress={handleAskButtonPress}
          disabled={followUpState === 'processing'}
          style={({ pressed }) => [
            styles.askButton,
            {
              opacity: pressed || followUpState === 'processing' ? 0.7 : 1,
              backgroundColor: followUpState === 'recording' ? colors.error : colors.accent,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={followUpState === 'recording' ? 'Stop and send question' : 'Ask a question'}
        >
          <View style={styles.askIconWrap}>
            {followUpState === 'recording' ? (
              <Square size={32} color={colors.textOnPrimary} strokeWidth={2.5} fill={colors.textOnPrimary} />
            ) : (
              <Mic size={36} color={colors.textOnPrimary} strokeWidth={2.5} />
            )}
          </View>
          <Text style={styles.askLabel}>
            {followUpState === 'recording' ? 'Tap to Send' : 'Ask a Question'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.newScanButton, { opacity: pressed ? 0.88 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Take a new photo"
        >
          <RotateCcw size={28} color={colors.primary} strokeWidth={2.5} />
          <Text style={styles.newScanLabel}>Take Another Photo</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    gap: spacing.md,
  },
  backBtn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.title, fontFamily: fontFamilies.extraBold, color: colors.textInverse },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  thumbnailWrap: { alignItems: 'center', paddingTop: spacing.lg },
  thumbnail: {
    width: 180,
    height: 180,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  thumbnailInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailLabel: { ...typography.caption, fontFamily: fontFamilies.semiBold, color: colors.muted, marginTop: spacing.md },
  playerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  answerCard: {
    backgroundColor: colors.accentLight,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: { ...typography.caption, fontFamily: fontFamilies.semiBold, color: colors.muted, marginBottom: spacing.sm },
  summaryText: { ...typography.bodyLarge, fontFamily: fontFamilies.bold, color: colors.text, textAlign: 'center', marginBottom: spacing.lg },
  waveRow: { height: 100, alignItems: 'center', justifyContent: 'center', marginVertical: spacing.md },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 72,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    width: '100%',
  },
  playLabel: { ...typography.bodyLarge, fontFamily: fontFamilies.extraBold, color: colors.textOnPrimary },
  followUpIndicator: {
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  followUpText: { ...typography.caption, fontFamily: fontFamilies.bold, color: colors.accentDark },
  errorCard: {
    backgroundColor: colors.error,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  errorCardText: { ...typography.caption, fontFamily: fontFamilies.semiBold, color: colors.textInverse, textAlign: 'center' },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    minHeight: 84,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    shadowColor: colors.accentDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  askIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  askLabel: { ...typography.heading, fontFamily: fontFamilies.extraBold, color: colors.textOnPrimary },
  newScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 72,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingHorizontal: spacing.xl,
  },
  newScanLabel: { ...typography.bodyLarge, fontFamily: fontFamilies.bold, color: colors.primary },
  emptyContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  emptyText: { ...typography.bodyLarge, fontFamily: fontFamilies.bold, color: colors.text, textAlign: 'center' },
  backButton: { minHeight: 72, backgroundColor: colors.primary, borderRadius: radius.lg, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  backButtonText: { ...typography.bodyLarge, fontFamily: fontFamilies.bold, color: colors.textOnPrimary },
});
