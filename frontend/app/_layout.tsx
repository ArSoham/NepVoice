import { useEffect } from 'react';
import { Stack, useRouter, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AppProvider, useApp } from '@/context/AppContext';
import { colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-Medium': Nunito_500Medium,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-Bold': Nunito_700Bold,
    'Nunito-ExtraBold': Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppProvider>
      <RootNavigator />
      <StatusBar style="light" />
    </AppProvider>
  );
}

function RootNavigator() {
  const { hasOnboarded } = useApp();
  const router = useRouter();
  const navState = useRootNavigationState();

  useEffect(() => {
    if (!navState?.key) return;
    if (hasOnboarded) {
      router.replace('/(tabs)');
    } else {
      router.replace('/onboarding');
    }
  }, [hasOnboarded, navState?.key]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="result" options={{ presentation: 'modal' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
