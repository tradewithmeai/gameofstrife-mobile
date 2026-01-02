import { View, StyleSheet } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSocketStore } from '../../stores/socketStore';
import { GameOfStrife } from '../../components/GameOfStrife';

export default function GameScreen() {
  const router = useRouter();
  const {
    inMatch,
    matchState,
    mySeat,
    isConnected,
    claimSquare,
    requestRematch,
    leaveRoom
  } = useSocketStore();

  // Get isMyTurn from matchState
  const isMyTurn = matchState?.currentTurn === mySeat;

  // Debug logging for turn state
  console.log('[GameScreen] Turn state:', {
    mySeat,
    currentTurn: matchState?.currentTurn,
    isMyTurn,
    matchStateExists: !!matchState
  });

  // Handle game action (token placement)
  const handleGameAction = (position: number, superpowerType?: number) => {
    claimSquare(position, superpowerType);
  };

  // Handle rematch
  const handleRematch = () => {
    requestRematch();
  };

  // Handle leave game
  const handleLeaveGame = () => {
    leaveRoom();
    router.push('/');
  };

  // Handle return to lobby from results modal
  const handleReturnToLobby = () => {
    leaveRoom();
    router.push('/');
  };

  // Show game if in match, otherwise show waiting message
  if (inMatch && matchState) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.leaveButtonContainer}>
          <Button
            mode="text"
            onPress={handleLeaveGame}
            icon="arrow-left"
            textColor="#EF4444"
            compact
          >
            Leave Game
          </Button>
        </View>
        <GameOfStrife
          matchState={matchState}
          mySeat={mySeat}
          isMyTurn={isMyTurn}
          onAction={handleGameAction}
          onRematch={handleRematch}
          onReturnToLobby={handleReturnToLobby}
        />
      </View>
    );
  }

  // Waiting for match
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            No Active Match
          </Text>
          <Text variant="bodyMedium" style={styles.text}>
            {isConnected
              ? 'Create or join a room from the Lobby tab to start playing!'
              : 'Connecting to server...'}
          </Text>
          <Text variant="bodySmall" style={styles.note}>
            Phase 4: Game UI Complete ✓
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  gameContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  leaveButtonContainer: {
    paddingHorizontal: 8,
    paddingTop: 8,
    backgroundColor: '#111827',
  },
  container: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#1F2937',
  },
  title: {
    color: '#F3F4F6',
    marginBottom: 12,
  },
  text: {
    color: '#D1D5DB',
    marginBottom: 16,
  },
  note: {
    color: '#6B7280',
  },
});
