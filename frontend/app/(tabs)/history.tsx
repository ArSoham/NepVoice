import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Trash2, Volume2, Inbox } from 'lucide-react-native';
import { colors, fontFamilies, radius, spacing, typography } from '@/constants/theme';
import { useApp, ScanRecord } from '@/context/AppContext';
import { router } from 'expo-router';

export default function HistoryScreen() {
  const { scans, clearHistory } = useApp();
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    clearHistory();
    setConfirmClear(false);
  };

  if (scans.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer} edges={['top', 'bottom']}>
        <View style={styles.emptyCard}>
          <Inbox size={72} color={colors.muted} strokeWidth={2} />
          <Text style={styles.emptyTitle}>No Scans Yet</Text>
          <Text style={styles.emptyText}>
            Take a photo and NepVoice will describe it for you here.
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/')}
            style={({ pressed }) => [styles.emptyButton, { opacity: pressed ? 0.88 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Go to camera"
          >
            <Text style={styles.emptyButtonText}>Open Camera</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Scans</Text>
        <Pressable
          onPress={handleClear}
          style={({ pressed }) => [styles.clearButton, { opacity: pressed ? 0.7 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel={confirmClear ? 'Tap again to confirm clear' : 'Clear all scans'}
        >
          <Trash2 size={26} color={confirmClear ? colors.error : colors.textInverse} strokeWidth={2.5} />
          <Text style={[styles.clearText, { color: confirmClear ? colors.error : colors.textInverse }]}>
            {confirmClear ? 'Tap Again' : 'Clear'}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={scans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ScanRow scan={item} />}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function ScanRow({ scan }: { scan: ScanRecord }) {
  const timeAgo = formatTimeAgo(scan.timestamp);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/result', params: { id: scan.id } })}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.92 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={`Scan: ${scan.summary}. Tap to open.`}
    >
      <View style={[styles.thumbnail, { backgroundColor: scan.color }]}>
        <Volume2 size={32} color={colors.textInverse} strokeWidth={2.5} />
      </View>

      <View style={styles.rowText}>
        <Text style={styles.rowSummary} numberOfLines={2}>
          {scan.summary}
        </Text>
        <Text style={styles.rowTime}>{timeAgo}</Text>
      </View>

      <View style={styles.playBtn}>
        <Play size={28} color={colors.textOnPrimary} strokeWidth={2.5} fill={colors.textOnPrimary} />
      </View>
    </Pressable>
  );
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.heading,
    fontFamily: fontFamilies.extraBold,
    color: colors.textInverse,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  clearText: {
    ...typography.caption,
    fontFamily: fontFamilies.bold,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  separator: {
    height: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 96,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
  },
  rowSummary: {
    ...typography.body,
    fontFamily: fontFamilies.semiBold,
    color: colors.text,
  },
  rowTime: {
    ...typography.caption,
    fontFamily: fontFamilies.medium,
    color: colors.muted,
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  // Empty
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.heading,
    fontFamily: fontFamilies.extraBold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    fontFamily: fontFamilies.medium,
    color: colors.text,
    textAlign: 'center',
  },
  emptyButton: {
    minHeight: 72,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  emptyButtonText: {
    ...typography.bodyLarge,
    fontFamily: fontFamilies.extraBold,
    color: colors.textOnPrimary,
  },
});
