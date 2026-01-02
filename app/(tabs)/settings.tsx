import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput, Chip } from 'react-native-paper';
import { useState, useEffect } from 'react';
import { useSettingsStore, DEFAULT_GAME_SETTINGS } from '../../stores/settingsStore';
import { getLogs, clearLogs, getLogFileInfo, DEV_MODE } from '../../utils/devMode';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const { settings, setSettings, resetToDefaults, isLoading } = useSettingsStore();

  const [boardSize, setBoardSize] = useState(settings.boardSize);
  const [tokensPerPlayer, setTokensPerPlayer] = useState(settings.tokensPerPlayer);
  const [birthRules, setBirthRules] = useState(settings.birthRules.join(','));
  const [survivalRules, setSurvivalRules] = useState(settings.survivalRules.join(','));
  const [superpowerPercentage, setSuperpowerPercentage] = useState(settings.superpowerPercentage);
  const [enabledSuperpowers, setEnabledSuperpowers] = useState(settings.enabledSuperpowers);
  const [logFileInfo, setLogFileInfo] = useState<{ exists: boolean; sizeKB: string; sizeMB: string; path: string } | null>(null);

  // Load log file info when component mounts
  useEffect(() => {
    if (DEV_MODE) {
      loadLogFileInfo();
    }
  }, []);

  const loadLogFileInfo = async () => {
    const info = await getLogFileInfo();
    setLogFileInfo(info);
  };

  const handleUploadLogs = async () => {
    try {
      const logs = await getLogs();

      if (!logs || logs === 'No logs yet') {
        Alert.alert('No Logs', 'No log data to upload yet. Play a game first.');
        return;
      }

      // Get server URL from app config
      const wsUrl = Constants.expoConfig?.extra?.wsUrl || 'https://gameofstrife-mobile-production.up.railway.app';
      const serverUrl = wsUrl.replace(/^wss?:\/\//, 'https://');

      const response = await fetch(`${serverUrl}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs }),
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      Alert.alert(
        'Logs Uploaded',
        `Session ID: ${data.sessionId}\n\nGive this ID to Claude to analyze the logs.\n\nExpires: ${new Date(data.expiresAt).toLocaleString()}`,
        [{ text: 'OK' }]
      );

      console.log('📤 Logs uploaded:', data);
    } catch (error) {
      console.error('Failed to upload logs:', error);
      Alert.alert('Upload Failed', `Could not upload logs: ${error}`);
    }
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
    };
    await setSettings(newSettings);
  };

  const handleReset = async () => {
    await resetToDefaults();
    setBoardSize(DEFAULT_GAME_SETTINGS.boardSize);
    setTokensPerPlayer(DEFAULT_GAME_SETTINGS.tokensPerPlayer);
    setBirthRules(DEFAULT_GAME_SETTINGS.birthRules.join(','));
    setSurvivalRules(DEFAULT_GAME_SETTINGS.survivalRules.join(','));
    setSuperpowerPercentage(DEFAULT_GAME_SETTINGS.superpowerPercentage);
    setEnabledSuperpowers(DEFAULT_GAME_SETTINGS.enabledSuperpowers);
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

        {/* Debug Logs (DEV only) */}
        {DEV_MODE && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Debug Logs
              </Text>
              <Text variant="bodySmall" style={styles.helpText}>
                All console output is automatically saved to file.
                Upload logs to let Claude analyze them.
              </Text>

              {/* Log File Info */}
              {logFileInfo && (
                <View style={styles.logInfo}>
                  <Text variant="bodySmall" style={styles.logInfoText}>
                    Status: {logFileInfo.exists ? '✅ Active' : '❌ Not created yet'}
                  </Text>
                  {logFileInfo.exists && (
                    <Text variant="bodySmall" style={styles.logInfoText}>
                      Size: {logFileInfo.sizeKB} ({logFileInfo.sizeMB})
                    </Text>
                  )}
                </View>
              )}

              <View style={styles.logButtons}>
                <Button
                  mode="contained"
                  onPress={handleUploadLogs}
                  icon="cloud-upload"
                  style={styles.uploadButton}
                >
                  Upload for Claude
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleClearLogs}
                  icon="delete"
                  style={styles.clearButton}
                >
                  Clear Logs
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
  uploadButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
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
    marginBottom: 4,
  },
  logInfoText: {
    color: '#D1D5DB',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  marginTop: {
    marginTop: 16,
  },
  footer: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
  },
});
