import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useSocketStore } from '../../stores/socketStore';
import { GameOfStrife } from '../../components/GameOfStrife';

export default function GameScreen() {
  const {
    inMatch,
    matchState,
    mySeat,
    isConnected,
    claimSquare,
    requestRematch
  } = useSocketStore();

  // Get isMyTurn from matchState
  const isMyTurn = matchState?.currentTurn === mySeat;

  // Handle game action (token placement)
  const handleGameAction = (position: number, superpowerType?: number) => {
    claimSquare(position, superpowerType);
  };

  // Handle rematch
  const handleRematch = () => {
    requestRematch();
  };

  // Show game if in match, otherwise show waiting message
  if (inMatch && matchState) {
    return (
      <GameOfStrife
        matchState={matchState}
        mySeat={mySeat}
        isMyTurn={isMyTurn}
        onAction={handleGameAction}
        onRematch={handleRematch}
      />
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
