import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScanRecord {
  id: string;
  summary: string;
  timestamp: number;
  color: string;
  emoji: string;
  audioUrl: string | null;
  docType: string;
}

interface AddScanInput {
  id: string;
  summary: string;
  audioUrl: string | null;
  docType: string;
  color: string;
  emoji: string;
}

interface AppState {
  hasOnboarded: boolean;
  completeOnboarding: () => void;
  scans: ScanRecord[];
  addScan: (input: AddScanInput) => void;
  clearHistory: () => void;
}

const AppContext = createContext<AppState | null>(null);

const ONBOARDED_KEY = 'nepvoice_onboarded_v1';
const SCANS_KEY = 'nepvoice_scans_v2'; // bumped: shape changed (added audioUrl/docType)

export function AppProvider({ children }: { children: ReactNode }) {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const onboarded = await AsyncStorage.getItem(ONBOARDED_KEY);
        const storedScans = await AsyncStorage.getItem(SCANS_KEY);
        setHasOnboarded(onboarded === 'true');
        setScans(storedScans ? JSON.parse(storedScans) : []);
      } catch {
        setScans([]);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const completeOnboarding = useCallback(() => {
    setHasOnboarded(true);
    AsyncStorage.setItem(ONBOARDED_KEY, 'true').catch(() => {});
  }, []);

  const addScan = useCallback((input: AddScanInput) => {
    setScans((prev) => {
      const next = [
        {
          id: input.id,
          summary: input.summary,
          timestamp: Date.now(),
          color: input.color,
          emoji: input.emoji,
          audioUrl: input.audioUrl,
          docType: input.docType,
        },
        ...prev,
      ];
      AsyncStorage.setItem(SCANS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setScans([]);
    AsyncStorage.setItem(SCANS_KEY, JSON.stringify([])).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ hasOnboarded, completeOnboarding, scans, addScan, clearHistory }),
    [hasOnboarded, completeOnboarding, scans, addScan, clearHistory],
  );

  if (!loaded) {
    return null;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
