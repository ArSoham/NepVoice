import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Pressable, useWindowDimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Mic, Camera, AlertCircle, RotateCcw, Zap } from 'lucide-react-native';
import { colors, fontFamilies, radius, spacing, typography } from '@/constants/theme';
import { styleForDocType } from '@/constants/docTypeStyles';
import { useScanFlow } from '@/hooks/useScanFlow';
import { scanDocument, ApiError } from '@/services/api';

export default function CameraScreen() {
  const { goToResult } = useScanFlow();
  // Scales with the actual screen width and re-derives on rotation/foldables,
  // instead of a one-off Dimensions.get() snapshot taken at import time.
  const { width: screenWidth } = useWindowDimensions();
  const BUTTON_SIZE = Math.min(96, Math.max(76, screenWidth * 0.24));
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState(false);
  const [listening, setListening] = useState(false);
  const [captureFlash, setCaptureFlash] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pulseAnim = useState(new Animated.Value(0))[0];
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (listening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [listening]);

  const handleSnap = async () => {
    if (processing) return; // ignore double-taps while a scan is in flight

    setCaptureFlash(true);
    setTimeout(() => setCaptureFlash(false), 250);
    setErrorMessage(null);

    if (!cameraRef.current) return;

    setProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo?.uri) throw new Error('Camera did not return a photo.');

      // This call can take a few seconds (Gemini OCR + simplify + TTS all
      // run before responding) — the UI should show a clear "thinking"
      // state rather than looking frozen. See the loading text below.
      const result = await scanDocument(photo.uri);
      const style = styleForDocType(result.doc_type);

      goToResult({
        id: result.id,
        summary: result.summary,
        audioUrl: result.audio_url,
        docType: result.doc_type,
        color: style.color,
        emoji: style.emoji,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(
          err.message.includes('Network request failed')
            ? "Can't reach the server — check that the backend is running and the address in constants/api.ts is correct."
            : err.message,
        );
      } else {
        setErrorMessage('Something went wrong taking that photo. Try again.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleVoiceCommand = () => {
    // Hands-free capture trigger only (a short "listening" beat, then
    // takes the photo) — not full voice-command parsing. Wiring an actual
    // wake-word/voice-navigation layer is future scope, tracked in the
    // original README's useVoiceCommands hook, not built here.
    setListening(true);
    setTimeout(() => {
      setListening(false);
      handleSnap();
    }, 1200);
  };

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer} edges={['top', 'bottom']}>
        <View style={styles.permissionCard}>
          <AlertCircle size={64} color={colors.primary} strokeWidth={2.5} />
          <Text style={styles.permissionTitle}>Camera Needed</Text>
          <Text style={styles.permissionText}>
            NepVoice needs your camera to take photos and describe them to you.
          </Text>
          <Pressable
            onPress={requestPermission}
            style={({ pressed }) => [styles.permissionButton, { opacity: pressed ? 0.88 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Allow camera access"
          >
            <Text style={styles.permissionButtonText}>Allow Camera</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.cameraWrap}>
        <CameraView ref={cameraRef} style={styles.camera} facing={facing} />

        {captureFlash && <View style={styles.captureFlash} />}

        <View style={styles.topBar}>
          <View style={styles.topLeftBadge}>
            <Camera size={24} color={colors.textInverse} strokeWidth={2.5} />
            <Text style={styles.topBadgeText}>NepVoice</Text>
          </View>

          <View style={styles.topRightControls}>
            <Pressable
              onPress={() => setFlash(!flash)}
              style={({ pressed }) => [styles.topButton, { opacity: pressed ? 0.7 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Toggle flash"
            >
              <Zap size={26} color={flash ? colors.warning : colors.textInverse} strokeWidth={2.5} />
            </Pressable>
            <Pressable
              onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
              style={({ pressed }) => [styles.topButton, { opacity: pressed ? 0.7 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Flip camera"
            >
              <RotateCcw size={26} color={colors.textInverse} strokeWidth={2.5} />
            </Pressable>
            <Pressable
              onPress={handleVoiceCommand}
              style={({ pressed }) => [styles.topButtonMic, { opacity: pressed ? 0.85 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Voice command"
            >
              <Animated.View
                style={[
                  styles.micPulseRing,
                  {
                    opacity: listening ? pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }) : 0,
                    transform: [
                      {
                        scale: listening ? pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) : 1,
                      },
                    ],
                  },
                ]}
              />
              <Mic size={30} color={colors.textInverse} strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>

        {listening && (
          <View style={styles.listeningOverlay}>
            <View style={styles.listeningBadge}>
              <Text style={styles.listeningText}>Listening...</Text>
            </View>
          </View>
        )}

        {processing && (
          <View style={styles.listeningOverlay}>
            <View style={styles.listeningBadge}>
              <Text style={styles.listeningText}>Reading your photo...</Text>
            </View>
          </View>
        )}

        {errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.bottomArea}>
          <Text style={styles.hintText}>Point at something and tap the button</Text>
          <Pressable
            onPress={handleSnap}
            disabled={processing}
            style={({ pressed }) => [
              styles.snapOuter,
              {
                width: BUTTON_SIZE + 12,
                height: BUTTON_SIZE + 12,
                borderRadius: (BUTTON_SIZE + 12) / 2,
                transform: [{ scale: pressed ? 0.92 : 1 }],
                opacity: processing ? 0.6 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Snap photo"
          >
            <View
              style={[
                styles.snapInner,
                { width: BUTTON_SIZE, height: BUTTON_SIZE, borderRadius: BUTTON_SIZE / 2 },
              ]}
            />
          </Pressable>
          <Text style={styles.snapLabel}>Snap Photo</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraWrap: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  captureFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    opacity: 0.6,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  permissionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  permissionTitle: {
    ...typography.heading,
    fontFamily: fontFamilies.extraBold,
    color: colors.text,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  permissionText: {
    ...typography.body,
    fontFamily: fontFamilies.medium,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  permissionButton: {
    minHeight: 72,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionButtonText: {
    ...typography.bodyLarge,
    fontFamily: fontFamilies.extraBold,
    color: colors.textOnPrimary,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  topLeftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  topBadgeText: {
    ...typography.caption,
    fontFamily: fontFamilies.bold,
    color: colors.textInverse,
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topButtonMic: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accentDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  micPulseRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: colors.accent,
  },
  listeningOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  listeningBadge: {
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  listeningText: {
    ...typography.bodyLarge,
    fontFamily: fontFamilies.bold,
    color: colors.textInverse,
  },
  errorBanner: {
    position: 'absolute',
    top: '55%',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorBannerText: {
    ...typography.caption,
    fontFamily: fontFamilies.semiBold,
    color: colors.textInverse,
    textAlign: 'center',
  },
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  hintText: {
    ...typography.caption,
    fontFamily: fontFamilies.semiBold,
    color: colors.textInverse,
    marginBottom: spacing.md,
  },
  snapOuter: {
    borderWidth: 5,
    borderColor: colors.textInverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapInner: {
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.surface,
  },
  snapLabel: {
    ...typography.bodyLarge,
    fontFamily: fontFamilies.extraBold,
    color: colors.textInverse,
    marginTop: spacing.md,
  },
});
