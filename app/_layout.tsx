import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { initLogging } from '../utils/devMode';
import { ArcadeTheme, DefaultTheme } from '../utils/theme';
import { useSettingsStore } from '../stores/settingsStore';

export default function RootLayout() {
  const useArcadeTheme = useSettingsStore(state => state.settings.useArcadeTheme);
  const loadSettings = useSettingsStore(state => state.loadSettings);
  const theme = useArcadeTheme ? ArcadeTheme : DefaultTheme;

  useEffect(() => {
    // Initialize app on startup
    initLogging();
    loadSettings(); // Load persisted settings from AsyncStorage
  }, [loadSettings]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <PaperProvider theme={theme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
