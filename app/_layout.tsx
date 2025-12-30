import { Stack } from 'expo-router';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#3B82F6', // Blue (P1)
    secondary: '#10B981', // Green (P2)
    background: '#111827',
    surface: '#1F2937',
  },
};

export default function RootLayout() {
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
