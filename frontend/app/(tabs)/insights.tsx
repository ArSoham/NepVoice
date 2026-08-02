import { useCallback, useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { Sparkles, Play, Pause, RefreshCw, FileStack, Camera as CameraIcon } from 'lucide-react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { colors, fontFamilies, radius, spacing, typography } from '@/constants/theme';
import { docTypeStyles } from '@/constants/docTypeStyles';
import { Waveform } from '@/components/Waveform';
import { useApp } from '@/context/AppContext';
import { fetchInsights, ApiError, InsightsResult } from '@/services/api';

export default function InsightsScreen() {
  const { scans } = useApp();
  const [data, setData] = useState<InsightsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchInsights();
      setData(result);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't load your summary — check the backend is reachable.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch whenever this tab gains focus (e.g. right after a new scan),
  // not on every render — keeps this cheap on both ends.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const player = useAudioPlayer(data?.audio_url ?? undefined);
  const status = useAudioPlayerStatus(player);
  const togglePlay = () => (status.playing ? player.pause() : player.play());

  if (scans.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer} edges={['top', 'bottom']}>
        <View style={styles.emptyCard}>
          <Sparkles size={72} color={colors.muted} strokeWidth={2} />
          <Text style={styles.emptyTitle}>Nothing to Summarize Yet</Text>
          <Text style={styles.emptyText}>
            Scan a few documents and NepVoice will pull them all together here.
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/')}
            style={({ pressed }) => [styles.emptyButton, { opacity: pressed ? 0.88 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Go to camera"
          >
            <CameraIcon size={22} color={colors.textOnPrimary} strokeWidth={2.5} />
            <Text style={styles.emptyButtonText}>Open Camera</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const byType = Object.entries(data?.by_type ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sparkles size={26} color={colors.textInverse} strokeWidth={2.5} />
          <Text style={styles.headerTitle}>Your Summary</Text>
        </View>
        <Pressable
          onPress={load}
          disabled={loading}
          style={({ pressed }) => [styles.refreshButton, { opacity: pressed || loading ? 0.6 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Refresh summary"
        >
          <RefreshCw size={24} color={colors.textInverse} strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
      >
        <View style={styles.statCard}>
          <FileStack size={36} color={colors.primary} strokeWidth={2.5} />
          <View>
            <Text style={styles.statNumber}>{data?.total ?? scans.length}</Text>
            <Text style={styles.statLabel}>documents scanned</Text>
          </View>
        </View>

        {byType.length > 0 && (
          <View style={styles.breakdownCard}>
            <Text style={styles.cardTitle}>By category</Text>
            {byType.map(([type, count]) => {
              const style = docTypeStyles[type] ?? docTypeStyles.other;
              return (
                <View key={type} style={styles.breakdownRow}>
                  <View style={[styles.dot, { backgroundColor: style.color }]} />
                  <Text style={styles.breakdownLabel}>{style.label}</Text>
                  <Text style={styles.breakdownCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!error && (
          <View style={styles.overviewCard}>
            <Text style={styles.cardTitle}>NepVoice's overview</Text>
            {loading && !data?.overview ? (
              <Text style={styles.overviewText}>Putting it all together...</Text>
            ) : (
              <Text style={styles.overviewText}>{data?.overview ?? 'No overview yet.'}</Text>
            )}

            {data?.audio_url && (
              <>
                <View style={styles.waveRow}>
                  <Waveform active={status.playing} color={colors.primary} maxBarHeight={64} barCount={6} />
                </View>
                <Pressable
                  onPress={togglePlay}
                  style={({ pressed }) => [styles.playButton, { opacity: pressed ? 0.88 : 1 }]}
                  accessibilityRole="button"
                  accessibilityLabel={status.playing ? 'Pause overview' : 'Play overview'}
                >
                  {status.playing ? (
                    <Pause size={32} color={colors.textOnPrimary} strokeWidth={2.5} fill={colors.textOnPrimary} />
                  ) : (
                    <Play size={32} color={colors.textOnPrimary} strokeWidth={2.5} fill={colors.textOnPrimary} />
                  )}
                  <Text style={styles.playLabel}>{status.playing ? 'Pause' : 'Play Overview'}</Text>
                </Pressable>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { ...typography.heading, fontFamily: fontFamilies.extraBold, color: colors.textInverse },
  refreshButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  scrollContent: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  statNumber: { ...typography.display, fontFamily: fontFamilies.extraBold, color: colors.text },
  statLabel: { ...typography.caption, fontFamily: fontFamilies.semiBold, color: colors.muted },
  breakdownCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.caption,
    fontFamily: fontFamilies.bold,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  dot: { width: 14, height: 14, borderRadius: 7 },
  breakdownLabel: { ...typography.body, fontFamily: fontFamilies.medium, color: colors.text, flex: 1 },
  breakdownCount: { ...typography.body, fontFamily: fontFamilies.extraBold, color: colors.text },
  overviewCard: {
    backgroundColor: colors.accentLight,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  overviewText: { ...typography.body, fontFamily: fontFamilies.semiBold, color: colors.text, lineHeight: 30 },
  waveRow: { height: 80, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 72,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
  },
  playLabel: { ...typography.bodyLarge, fontFamily: fontFamilies.extraBold, color: colors.textOnPrimary },
  errorCard: { backgroundColor: colors.error, borderRadius: radius.lg, padding: spacing.md },
  errorText: { ...typography.caption, fontFamily: fontFamilies.semiBold, color: colors.textInverse, textAlign: 'center' },
  emptyContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    gap: spacing.md,
  },
  emptyTitle: { ...typography.heading, fontFamily: fontFamilies.extraBold, color: colors.text, marginTop: spacing.sm },
  emptyText: { ...typography.body, fontFamily: fontFamilies.medium, color: colors.text, textAlign: 'center' },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 72,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  emptyButtonText: { ...typography.bodyLarge, fontFamily: fontFamilies.extraBold, color: colors.textOnPrimary },
});
