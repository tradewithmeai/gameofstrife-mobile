import { View, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { Text, Button, Card, Chip, TextInput } from 'react-native-paper';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSocketStore } from '../../stores/socketStore';
import { useSettingsStore } from '../../stores/settingsStore';

export default function LobbyScreen() {
  const router = useRouter();
  const {
    isConnected,
    connectionStatus,
    playerId,
    currentRoom,
    inMatch,
    connect,
    disconnect,
    createRoom,
    joinRoom
  } = useSocketStore();

  const { settings } = useSettingsStore();

  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  // Connect to server on mount
  useEffect(() => {
    console.log('[LobbyScreen] Connecting to server...');
    connect();

    return () => {
      console.log('[LobbyScreen] Disconnecting from server...');
      disconnect();
    };
  }, []);

  // Navigate to game tab when match starts
  useEffect(() => {
    if (inMatch) {
      console.log('[LobbyScreen] Match started, navigating to game tab');
      router.push('/game');
    }
  }, [inMatch]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#10B981'; // Green
      case 'connecting': return '#F59E0B'; // Yellow
      case 'error': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };

  const handleCreateRoom = () => {
    console.log('[LobbyScreen] Creating private room with settings:', settings);
    createRoom(false, settings);
  };

  const handleJoinRoom = () => {
    if (joinCode.trim().length >= 4) {
      console.log('[LobbyScreen] Joining room with code:', joinCode);
      joinRoom(joinCode.trim().toUpperCase());
      setJoinCode('');
      setShowJoinInput(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>
            Game of Strife
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Conway's Game of Life Battle
          </Text>

          {/* Connection Status */}
          <View style={styles.statusContainer}>
            <Chip
              icon={isConnected ? 'check-circle' : 'alert-circle'}
              style={[styles.statusChip, { backgroundColor: getStatusColor() }]}
              textStyle={{ color: '#FFFFFF' }}
            >
              {connectionStatus.toUpperCase()}
            </Chip>
            {playerId && (
              <Text variant="bodySmall" style={styles.playerId}>
                ID: {playerId.slice(-6)}
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Current Room Display */}
      {currentRoom && !inMatch && (
        <Card style={styles.roomCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.textWhite}>
              Room Created!
            </Text>
            <Text variant="bodyMedium" style={styles.textGray}>
              Share this code with your opponent:
            </Text>
            <Text variant="displaySmall" style={styles.roomCode}>
              {currentRoom.code}
            </Text>
            <Text variant="bodySmall" style={styles.textGray}>
              Waiting for player to join... ({currentRoom.players.length}/{currentRoom.maxPlayers})
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Lobby Actions */}
      {!currentRoom && (
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={handleCreateRoom}
            style={styles.button}
            disabled={!isConnected}
            icon="plus-circle"
          >
            Create Private Room
          </Button>

          {!showJoinInput ? (
            <Button
              mode="outlined"
              onPress={() => setShowJoinInput(true)}
              style={styles.button}
              disabled={!isConnected}
              icon="login"
            >
              Join Room
            </Button>
          ) : (
            <Card style={styles.joinCard}>
              <Card.Content>
                <Text variant="titleSmall" style={styles.textWhite}>
                  Enter Room Code
                </Text>
                <TextInput
                  mode="outlined"
                  placeholder="ABCD"
                  value={joinCode}
                  onChangeText={(text) => setJoinCode(text.toUpperCase())}
                  maxLength={6}
                  autoCapitalize="characters"
                  style={styles.input}
                  textColor="#FFFFFF"
                />
                <View style={styles.joinButtons}>
                  <Button
                    mode="text"
                    onPress={() => {
                      setShowJoinInput(false);
                      setJoinCode('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleJoinRoom}
                    disabled={joinCode.trim().length < 4}
                  >
                    Join
                  </Button>
                </View>
              </Card.Content>
            </Card>
          )}
        </View>
      )}

      {/* Game Settings Info */}
      <Card style={styles.settingsInfoCard}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.textWhite}>
            Current Settings
          </Text>
          <Text variant="bodySmall" style={styles.textGray}>
            Board: {settings.boardSize}x{settings.boardSize} | Tokens: {settings.tokensPerPlayer} each
          </Text>
          <Text variant="bodySmall" style={styles.textGray}>
            Superpowers: {settings.superpowerPercentage}% chance
          </Text>
          <Button
            mode="text"
            onPress={() => router.push('/settings')}
            compact
            icon="cog"
          >
            Change Settings
          </Button>
        </Card.Content>
      </Card>

      <Text variant="bodySmall" style={styles.footer}>
        Phase 4: Full Multiplayer Lobby ✓
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 16,
  },
  card: {
    marginTop: 32,
    backgroundColor: '#1F2937',
  },
  title: {
    color: '#F3F4F6',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
  statusContainer: {
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  statusChip: {
    alignSelf: 'center',
  },
  playerId: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
  roomCard: {
    marginTop: 24,
    backgroundColor: '#065F46',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  roomCode: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
    marginVertical: 12,
    letterSpacing: 4,
  },
  actions: {
    marginTop: 32,
    gap: 12,
  },
  button: {
    borderRadius: 8,
  },
  joinCard: {
    backgroundColor: '#1F2937',
    padding: 8,
  },
  input: {
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: '#374151',
  },
  joinButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  settingsInfoCard: {
    marginTop: 24,
    backgroundColor: '#374151',
  },
  textWhite: {
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textGray: {
    color: '#9CA3AF',
  },
  footer: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 'auto',
    marginBottom: 32,
  },
});
