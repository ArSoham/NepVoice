import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'nepvoice_session_id_v1';

// Not cryptographically strong, and doesn't need to be — this only groups
// a device's scans/follow-ups together server-side, it's not an auth token.
function generateId(): string {
  return 'sess-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

let cached: string | null = null;

export async function getSessionId(): Promise<string> {
  if (cached) return cached;
  try {
    const existing = await AsyncStorage.getItem(SESSION_KEY);
    if (existing) {
      cached = existing;
      return existing;
    }
  } catch {
    // fall through and generate a fresh one for this run
  }
  const fresh = generateId();
  cached = fresh;
  AsyncStorage.setItem(SESSION_KEY, fresh).catch(() => {});
  return fresh;
}
