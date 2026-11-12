import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useNight } from '../state/theme';

export default function RootLayout() {
  const night = useNight();
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style={night ? 'light' : 'dark'} />
    </>
  );
}
