import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput, Chip, Switch } from 'react-native-paper';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSettingsStore, DEFAULT_GAME_SETTINGS } from '../../stores/settingsStore';
import { getLogs, clearLogs, getLogFileInfo, DEV_MODE } from '../../utils/devMode';
import Constants from 'expo-constants';
import Slider from '@react-native-community/slider';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, setSettings, resetToDefaults, isLoading, logSessions, loadLogSessions, clearLogSessions } = useSettingsStore();

  const [boardSize, setBoardSize] = useState(settings.boardSize);
  const [tokensPerPlayer, setTokensPerPlayer] = useState(settings.tokensPerPlayer);
  const [birthRules, setBirthRules] = useState(settings.birthRules.join(','));
  const [survivalRules, setSurvivalRules] = useState(settings.survivalRules.join(','));
  const [superpowerPercentage, setSuperpowerPercentage] = useState(settings.superpowerPercentage);
  const [enabledSuperpowers, setEnabledSuperpowers] = useState(settings.enabledSuperpowers);
  const [useArcadeTheme, setUseArcadeTheme] = useState(settings.useArcadeTheme);
  const [animationSpeed, setAnimationSpeed] = useState(settings.animationSpeed);
  const [enableToroidalBoard, setEnableToroidalBoard] = useState(settings.enableToroidalBoard);
  const [enableSuperpowerAnimations, setEnableSuperpowerAnimations] = useState(settings.enableSuperpowerAnimations);
  const [logFileInfo, setLogFileInfo] = useState<{ exists: boolean; sizeKB: string; sizeMB: string; path: string } | null>(null);

  // Load log file info and sessions when component mounts
  useEffect(() => {
    if (DEV_MODE) {
      loadLogFileInfo();
      loadLogSessions();
    }
  }, [loadLogSessions]);

  const loadLogFileInfo = async () => {
    const info = await getLogFileInfo();
    setLogFileInfo(info);
  };

  const handleClearSessions = () => {
    Alert.alert(
      'Clear Log Sessions?',
      'This will clear the history of uploaded log sessions (logs remain on server until expiry).',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearLogSessions();
            Alert.alert('Success', 'Log session history cleared');
          }
        }
      ]
    );
  };

  const superpowerTypes = [
    { id: 1, name: 'Tank', color: '#FFFFFF' },
    { id: 2, name: 'Spreader', color: '#A3A3A3' },
    { id: 3, name: 'Survivor', color: '#FBBF24' },
    { id: 4, name: 'Ghost', color: '#9CA3AF' },
    { id: 5, name: 'Replicator', color: '#A3A3A3' },
    { id: 6, name: 'Destroyer', color: '#EF4444' },
    { id: 7, name: 'Hybrid', color: '#A855F7' },
  ];

  const toggleSuperpower = (id: number) => {
    if (enabledSuperpowers.includes(id)) {
      setEnabledSuperpowers(enabledSuperpowers.filter(sp => sp !== id));
    } else {
      setEnabledSuperpowers([...enabledSuperpowers, id].sort());
    }
  };

  const handleSave = async () => {
    const newSettings = {
      boardSize,
      tokensPerPlayer,
      birthRules: birthRules.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)),
      survivalRules: survivalRules.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)),
      superpowerPercentage,
      enabledSuperpowers,
      useArcadeTheme,
      animationSpeed,
      enableToroidalBoard,
      superpowerLives: settings.superpowerLives, // Keep current lives config
      enableSuperpowerAnimations,
    };
    await setSettings(newSettings);
    // Navigate back to lobby after saving
    router.push('/');
  };

  const handleReset = async () => {
    await resetToDefaults();
    setBoardSize(DEFAULT_GAME_SETTINGS.boardSize);
    setTokensPerPlayer(DEFAULT_GAME_SETTINGS.tokensPerPlayer);
    setBirthRules(DEFAULT_GAME_SETTINGS.birthRules.join(','));
    setSurvivalRules(DEFAULT_GAME_SETTINGS.survivalRules.join(','));
    setSuperpowerPercentage(DEFAULT_GAME_SETTINGS.superpowerPercentage);
    setEnabledSuperpowers(DEFAULT_GAME_SETTINGS.enabledSuperpowers);
    setUseArcadeTheme(DEFAULT_GAME_SETTINGS.useArcadeTheme);
    setAnimationSpeed(DEFAULT_GAME_SETTINGS.animationSpeed);
    setEnableToroidalBoard(DEFAULT_GAME_SETTINGS.enableToroidalBoard);
    setEnableSuperpowerAnimations(DEFAULT_GAME_SETTINGS.enableSuperpowerAnimations);
  };

  const handleClearLogs = async () => {
    Alert.alert(
      'Clear Logs?',
      'This will delete all stored log data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearLogs();
            await loadLogFileInfo(); // Refresh file info
            Alert.alert('Success', 'Logs cleared');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              Game Settings
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              Configure your Game of Strife match
            </Text>
          </Card.Content>
        </Card>

        {/* Board Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Board Configuration
            </Text>

            <Text variant="bodyMedium" style={styles.label}>
              Board Size: {boardSize}x{boardSize}
            </Text>
            <View style={styles.sizeButtons}>
              {[10, 15, 20, 25, 30].map(size => (
                <Button
                  key={size}
                  mode={boardSize === size ? 'contained' : 'outlined'}
                  onPress={() => setBoardSize(size)}
                  style={styles.sizeButton}
                  compact
                >
                  {size}
                </Button>
              ))}
            </View>

            <Text variant="bodyMedium" style={[styles.label, styles.marginTop]}>
              Tokens Per Player: {tokensPerPlayer}
            </Text>
            <View style={styles.sizeButtons}>
              {[10, 15, 20, 25, 30, 40, 50].map(tokens => (
                <Button
                  key={tokens}
                  mode={tokensPerPlayer === tokens ? 'contained' : 'outlined'}
                  onPress={() => setTokensPerPlayer(tokens)}
                  style={styles.sizeButton}
                  compact
                >
                  {tokens}
                </Button>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Conway Rules */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Conway's Game of Life Rules
            </Text>

            <TextInput
              mode="outlined"
              label="Birth Rules (neighbors for birth)"
              value={birthRules}
              onChangeText={setBirthRules}
              placeholder="3"
              keyboardType="numeric"
              style={styles.input}
              textColor="#FFFFFF"
            />

            <TextInput
              mode="outlined"
              label="Survival Rules (neighbors to survive)"
              value={survivalRules}
              onChangeText={setSurvivalRules}
              placeholder="2,3"
              keyboardType="numeric"
              style={styles.input}
              textColor="#FFFFFF"
            />

            <Text variant="bodySmall" style={styles.helpText}>
              Standard Conway's rule: Birth on 3, Survive on 2 or 3
            </Text>
          </Card.Content>
        </Card>

        {/* Superpowers */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Superpowers
            </Text>

            <Text variant="bodyMedium" style={styles.label}>
              Superpower Chance: {superpowerPercentage}%
            </Text>
            <View style={styles.sizeButtons}>
              {[0, 10, 20, 30, 50, 75, 100].map(percentage => (
                <Button
                  key={percentage}
                  mode={superpowerPercentage === percentage ? 'contained' : 'outlined'}
                  onPress={() => setSuperpowerPercentage(percentage)}
                  style={styles.sizeButton}
                  compact
                >
                  {percentage}%
                </Button>
              ))}
            </View>

            <Text variant="bodyMedium" style={[styles.label, styles.marginTop]}>
              Enabled Superpowers:
            </Text>
            <View style={styles.chipContainer}>
              {superpowerTypes.map(sp => (
                <Chip
                  key={sp.id}
                  selected={enabledSuperpowers.includes(sp.id)}
                  onPress={() => toggleSuperpower(sp.id)}
                  style={[
                    styles.chip,
                    enabledSuperpowers.includes(sp.id) && { backgroundColor: sp.color + '40' }
                  ]}
                  textStyle={styles.chipText}
                >
                  {sp.name}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Visual & Animation Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Visual & Animation
            </Text>

            {/* Theme Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium" style={styles.label}>
                  {useArcadeTheme ? "🎮 80's Arcade Theme" : "📊 Classic Theme"}
                </Text>
                <Text variant="bodySmall" style={styles.helpText}>
                  Toggle between neon arcade and professional themes
                </Text>
              </View>
              <Switch
                value={useArcadeTheme}
                onValueChange={setUseArcadeTheme}
              />
            </View>

            {/* Animation Speed Slider */}
            <View style={styles.marginTop}>
              <Text variant="bodyMedium" style={styles.label}>
                Animation Speed: {animationSpeed}ms per frame
              </Text>
              <Text variant="bodySmall" style={styles.helpText}>
                Lower = faster, Higher = slower
              </Text>
              <Slider
                minimumValue={10}
                maximumValue={500}
                step={10}
                value={animationSpeed}
                onValueChange={setAnimationSpeed}
                minimumTrackTintColor="#3B82F6"
                maximumTrackTintColor="#374151"
                thumbTintColor="#3B82F6"
                style={styles.slider}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>Fast</Text>
                <Text style={styles.sliderLabel}>Slow</Text>
              </View>
            </View>

            {/* Superpower Animations Toggle */}
            <View style={[styles.settingRow, styles.marginTop]}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium" style={styles.label}>
                  Animate Superpower Cells
                </Text>
                <Text variant="bodySmall" style={styles.helpText}>
                  Disable on large boards for better performance
                </Text>
              </View>
              <Switch
                value={enableSuperpowerAnimations}
                onValueChange={setEnableSuperpowerAnimations}
              />
            </View>

            {/* Toroidal Board Toggle */}
            <View style={[styles.settingRow, styles.marginTop]}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium" style={styles.label}>
                  Wraparound Board Edges
                </Text>
                <Text variant="bodySmall" style={styles.helpText}>
                  Board edges connect to opposite sides (standard Conway rules)
                </Text>
              </View>
              <Switch
                value={enableToroidalBoard}
                onValueChange={setEnableToroidalBoard}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Debug Logs (DEV only) */}
        {DEV_MODE && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Debug Logs (Auto-Upload)
              </Text>
              <Text variant="bodySmall" style={styles.helpText}>
                Logs are automatically uploaded when each game ends.
                Share the session ID with Claude for analysis.
              </Text>

              {/* Log File Info */}
              {logFileInfo && (
                <View style={styles.logInfo}>
                  <Text variant="bodySmall" style={styles.logInfoText}>
                    Status: {logFileInfo.exists ? '✅ Logging active' : '❌ No logs yet'}
                  </Text>
                  {logFileInfo.exists && (
                    <Text variant="bodySmall" style={styles.logInfoText}>
                      Size: {logFileInfo.sizeKB}
                    </Text>
                  )}
                </View>
              )}

              {/* Uploaded Sessions List */}
              {logSessions.length > 0 ? (
                <View style={styles.sessionsList}>
                  <Text variant="bodyMedium" style={[styles.label, { marginBottom: 8 }]}>
                    Uploaded Sessions (Last 20):
                  </Text>
                  {logSessions.map((session, index) => (
                    <View key={session.sessionId} style={styles.sessionItem}>
                      <Text variant="bodySmall" style={styles.sessionId}>
                        {session.sessionId}
                      </Text>
                      <Text variant="bodySmall" style={styles.sessionTime}>
                        {new Date(session.timestamp).toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text variant="bodySmall" style={styles.helpText}>
                  No sessions uploaded yet. Play a game to auto-upload logs.
                </Text>
              )}

              <View style={styles.logButtons}>
                <Button
                  mode="outlined"
                  onPress={handleClearSessions}
                  icon="delete"
                  style={styles.clearButton}
                  disabled={logSessions.length === 0}
                >
                  Clear History
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleClearLogs}
                  icon="file-remove"
                  style={styles.clearButton}
                >
                  Clear Log File
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            disabled={isLoading}
            loading={isLoading}
            icon="content-save"
          >
            Save Settings
          </Button>
          <Button
            mode="outlined"
            onPress={handleReset}
            style={styles.resetButton}
            disabled={isLoading}
            icon="restore"
          >
            Reset to Defaults
          </Button>
        </View>

        <Text variant="bodySmall" style={styles.footer}>
          Phase 4: UI Components Complete ✓
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#1F2937',
  },
  title: {
    color: '#F3F4F6',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9CA3AF',
  },
  sectionTitle: {
    color: '#F3F4F6',
    marginBottom: 12,
  },
  label: {
    color: '#D1D5DB',
    marginBottom: 8,
  },
  sizeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  sizeButton: {
    minWidth: 50,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#374151',
  },
  helpText: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    backgroundColor: '#374151',
  },
  chipText: {
    color: '#FFFFFF',
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  resetButton: {
    borderColor: '#6B7280',
  },
  logButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  clearButton: {
    flex: 1,
    borderColor: '#EF4444',
  },
  logInfo: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  logInfoText: {
    color: '#D1D5DB',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  sessionsList: {
    marginTop: 12,
    marginBottom: 8,
  },
  sessionItem: {
    backgroundColor: '#374151',
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionId: {
    color: '#3B82F6',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sessionTime: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  marginTop: {
    marginTop: 16,
  },
  footer: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});
