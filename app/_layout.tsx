// app/_layout.tsx
// Root layout — wraps everything in RunProvider + GamificationProvider.

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RunProvider } from '../src/context/RunContext';
import { GamificationProvider } from '../src/context/GamificationContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RunProvider>
        <GamificationProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0A0A1A' },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="run" />
            <Stack.Screen name="summary" />
            <Stack.Screen name="badges" />
          </Stack>
        </GamificationProvider>
      </RunProvider>
    </SafeAreaProvider>
  );
}
