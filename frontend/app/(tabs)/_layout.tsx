import { Tabs } from 'expo-router';
import { Camera, History, Home } from 'lucide-react-native';
import { colors, fontFamilies } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontFamily: fontFamilies.bold,
          fontSize: 14,
        },
        tabBarStyle: {
          minHeight: 72,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceDim,
          borderTopWidth: 2,
        },
        tabBarItemStyle: {
          minHeight: 64,
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Camera',
          tabBarIcon: ({ size, color }) => <Camera size={size + 4} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ size, color }) => <History size={size + 4} color={color} strokeWidth={2.5} />,
        }}
      />
    </Tabs>
  );
}
