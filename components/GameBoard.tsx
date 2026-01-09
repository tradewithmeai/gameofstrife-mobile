// Game of Strife GameBoard for React Native
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { View, Pressable, StyleSheet, useWindowDimensions, GestureResponderEvent, Text, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Cell, MEMORY_FLAGS, GameStage } from '../utils/gameTypes';
import { devLog } from '../utils/devMode';

interface GameOfStrifeBoardProps {
  board: Cell[][];
  stage: GameStage;
  boardSize: number;
  isPlacementStage: boolean;
  isMyTurn: boolean;
  isFinished: boolean;
  onGameAction: (action: any) => void;
  selectedCell?: { row: number; col: number } | null;
  mySeat?: 'P1' | 'P2' | null;
  enableSuperpowerAnimations: boolean;
}

// Create Animated Pressable component for placement stage animations
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GameOfStrifeBoard: React.FC<GameOfStrifeBoardProps> = ({
  board,
  stage,
  boardSize,
  isPlacementStage,
  isMyTurn,
  isFinished,
  onGameAction,
  selectedCell,
  mySeat,
  enableSuperpowerAnimations,
}) => {
  const boardRef = useRef<View>(null);
  const lastPlacedCell = useRef<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const boardLayoutRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const lastTouchPosition = useRef<{ row: number; col: number } | null>(null);

  // Animated values for superpower effects (shared by type for efficiency)
  const animatedValues = useRef({
    tank: new Animated.Value(0),      // Type 1
    spreader: new Animated.Value(0),  // Type 2
    survivor: new Animated.Value(0),  // Type 3
    ghost: new Animated.Value(0),     // Type 4
    replicator: new Animated.Value(0),// Type 5
    destroyer: new Animated.Value(0), // Type 6
    hybrid: new Animated.Value(0),    // Type 7
  }).current;

  // Animation factory - creates looping animations for each superpower type
  const createAnimationForType = useCallback((
    type: string,
    animValue: Animated.Value
  ): Animated.CompositeAnimation => {
    const configs: Record<string, { duration: number | (() => number); toValue: number }> = {
      tank: { duration: 600, toValue: 1 },        // Steady protective pulse
      spreader: { duration: 400, toValue: 1 },    // Fast spreading waves
      survivor: { duration: 500, toValue: 1 },    // Persistent flame
      ghost: {
        // Irregular phasing - 200-400ms random
        duration: () => Math.random() * 200 + 200,
        toValue: 1
      },
      replicator: { duration: 250, toValue: 1 },  // Very fast bursts
      destroyer: { duration: 350, toValue: 1 },   // Aggressive rapid pulse
      hybrid: { duration: 700, toValue: 1 },      // Complex sophisticated
    };

    const config = configs[type];
    const duration = typeof config.duration === 'function' ? config.duration() : config.duration;

    return Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: config.toValue,
          duration: duration,
          useNativeDriver: false, // Required for shadow properties
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: duration,
          useNativeDriver: false,
        }),
      ])
    );
  }, []);

  // Start/stop animations based on stage (placement and finished only)
  useEffect(() => {
    if (
      (stage === 'placement' || stage === 'finished') &&
      enableSuperpowerAnimations &&
      boardSize <= 20
    ) {
      // Start all 7 animations in parallel
      const animations = Object.entries(animatedValues).map(
        ([type, value]) => createAnimationForType(type, value)
      );

      animations.forEach(anim => anim.start());

      return () => {
        // Cleanup: stop all animations and reset values
        animations.forEach(anim => anim.stop());
        Object.values(animatedValues).forEach(v => v.setValue(0));
      };
    }
  }, [stage, enableSuperpowerAnimations, boardSize, animatedValues, createAnimationForType]);

  // Component uses per-cell Pressable approach for touch handling

  // Handle token placement during drag
  const handlePlacement = useCallback((row: number, col: number) => {
    console.log('[GameBoard] handlePlacement called:', { row, col, isPlacementStage, isMyTurn, isFinished });

    if (!isPlacementStage || !isMyTurn || isFinished) {
      console.log('[GameBoard] Placement blocked by stage/turn/finish check');
      return;
    }

    const cellKey = `${row}-${col}`;
    // Avoid placing multiple tokens on the same cell during one drag
    if (lastPlacedCell.current === cellKey) {
      devLog('[GameBoard] Same cell as last placement, skipping');
      return;
    }

    // Check if cell is occupied
    const cell = board[row]?.[col];
    const cellOccupied = cell && cell.player !== null;
    const myPlayerIndex = mySeat === 'P1' ? 0 : 1;
    const isMyToken = cellOccupied && cell.player === myPlayerIndex;

    devLog('[GameBoard] Cell check:', {
      cellOccupied,
      player: cell?.player,
      myPlayerIndex,
      isMyToken
    });

    // If clicking own token, remove it (backend handles this automatically)
    if (isMyToken) {
      devLog('[GameBoard] Removing own token at position:', row * boardSize + col);
      onGameAction({
        type: 'PLACE_TOKEN',  // Use PLACE_TOKEN - backend detects removal automatically
        payload: { position: row * boardSize + col, row, col },
        timestamp: Date.now()
      });
      lastPlacedCell.current = cellKey;
      return;
    }

    // If cell occupied by opponent, skip
    if (cellOccupied) {
      console.log('[GameBoard] Cell occupied by opponent, skipping');
      return;
    }

    lastPlacedCell.current = cellKey;

    // Convert to flat board position for socket system
    const position = row * boardSize + col;

    console.log(`🔵 [GameBoard] SENDING TO SERVER: row=${row}, col=${col}, boardSize=${boardSize}, position=${position} (calculation: ${row}*${boardSize}+${col}=${position})`);
    onGameAction({
      type: 'PLACE_TOKEN',
      payload: { position, row, col },
      timestamp: Date.now()
    });
  }, [isPlacementStage, isMyTurn, isFinished, board, boardSize, onGameAction, mySeat]);

  // Handle cell press - called directly by each cell's Pressable
  const handleCellPress = useCallback((row: number, col: number) => {
    console.log('[GameBoard] Cell pressed:', { row, col });
    lastPlacedCell.current = null; // Reset for new placement
    handlePlacement(row, col);
  }, [handlePlacement]);

  // Interpolate cells between two points (line drawing algorithm)
  const interpolateCells = useCallback((from: { row: number; col: number }, to: { row: number; col: number }) => {
    const cells: { row: number; col: number }[] = [];

    // Bresenham's line algorithm
    let x0 = from.col;
    let y0 = from.row;
    const x1 = to.col;
    const y1 = to.row;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      cells.push({ row: y0, col: x0 });

      if (x0 === x1 && y0 === y1) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }

    return cells;
  }, []);

  // Convert touch coordinates to cell position
  const getCellFromTouch = useCallback((pageX: number, pageY: number): { row: number; col: number } | null => {
    if (!boardLayoutRef.current) return null;

    const { x: boardX, y: boardY, width, height } = boardLayoutRef.current;

    // Convert page coordinates to board-relative coordinates
    const relativeX = pageX - boardX;
    const relativeY = pageY - boardY;

    // Check if touch is within board bounds
    if (relativeX < 0 || relativeX > width || relativeY < 0 || relativeY > height) {
      return null;
    }

    // Calculate cell size (accounting for borders)
    const BOARD_BORDER = 2;
    const usableWidth = width - (BOARD_BORDER * 2);
    const usableHeight = height - (BOARD_BORDER * 2);
    const cellWidth = usableWidth / boardSize;
    const cellHeight = usableHeight / boardSize;

    // Adjust for border
    const adjustedX = relativeX - BOARD_BORDER;
    const adjustedY = relativeY - BOARD_BORDER;

    // Calculate cell indices
    const col = Math.floor(adjustedX / cellWidth);
    const row = Math.floor(adjustedY / cellHeight);

    // Validate bounds
    if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
      return { row, col };
    }

    return null;
  }, [boardSize]);

  // Handle touch start - begin drag
  const handleTouchStart = useCallback((e: GestureResponderEvent) => {
    if (!isPlacementStage || !isMyTurn || isFinished) {
      console.log('[GameBoard] Touch start blocked:', { isPlacementStage, isMyTurn, isFinished });
      return;
    }

    console.log('[GameBoard] Touch start - pageX:', e.nativeEvent.pageX, 'pageY:', e.nativeEvent.pageY);
    console.log('[GameBoard] Board layout:', boardLayoutRef.current);

    setIsDragging(true);
    lastPlacedCell.current = null;

    // Place token at starting position
    const cell = getCellFromTouch(e.nativeEvent.pageX, e.nativeEvent.pageY);
    console.log('[GameBoard] Touch start calculated cell:', cell);
    if (cell) {
      console.log('[GameBoard] ✅ Placing token at cell:', cell);
      lastTouchPosition.current = cell;
      handlePlacement(cell.row, cell.col);
    } else {
      console.log('[GameBoard] ❌ No valid cell for touch position');
      lastTouchPosition.current = null;
    }
  }, [isPlacementStage, isMyTurn, isFinished, getCellFromTouch, handlePlacement]);

  // Handle touch move - drag across cells with interpolation
  const handleTouchMove = useCallback((e: GestureResponderEvent) => {
    if (!isDragging || !isPlacementStage || !isMyTurn || isFinished) return;

    const currentCell = getCellFromTouch(e.nativeEvent.pageX, e.nativeEvent.pageY);
    if (!currentCell) return;

    // If we have a previous position, interpolate between them
    if (lastTouchPosition.current) {
      const interpolatedCells = interpolateCells(lastTouchPosition.current, currentCell);
      console.log(`[GameBoard] Interpolating ${interpolatedCells.length} cells from`, lastTouchPosition.current, 'to', currentCell);

      // Place tokens on all cells along the line
      interpolatedCells.forEach(cell => {
        handlePlacement(cell.row, cell.col);
      });
    } else {
      // No previous position, just place at current
      handlePlacement(currentCell.row, currentCell.col);
    }

    lastTouchPosition.current = currentCell;
  }, [isDragging, isPlacementStage, isMyTurn, isFinished, getCellFromTouch, interpolateCells, handlePlacement]);

  // Handle touch end - stop drag
  const handleTouchEnd = useCallback(() => {
    console.log('[GameBoard] Touch ended');
    setIsDragging(false);
    lastPlacedCell.current = null;
    lastTouchPosition.current = null;
  }, []);

  // Measure board layout
  const handleBoardLayout = useCallback(() => {
    boardRef.current?.measure((x, y, width, height, pageX, pageY) => {
      boardLayoutRef.current = { x: pageX, y: pageY, width, height };
      console.log('[GameBoard] Board layout:', { x: pageX, y: pageY, width, height });
    });
  }, []);

  // Get animated style interpolations for superpower cells
  const getAnimatedStyle = useCallback((cell: Cell) => {
    if (cell.superpowerType === 0 || !cell.alive) {
      return {}; // No animation for normal cells
    }

    const typeNames = ['', 'tank', 'spreader', 'survivor', 'ghost', 'replicator', 'destroyer', 'hybrid'];
    const typeName = typeNames[cell.superpowerType];
    const animValue = animatedValues[typeName as keyof typeof animatedValues];

    // Return animated style object based on type
    switch (cell.superpowerType) {
      case 1: // Tank - Protective Halo
        return {
          shadowRadius: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [2, 8],
          }),
          shadowOpacity: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.6, 0.9],
          }),
          shadowColor: '#FFFFFF',
          elevation: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [4, 8],
          }),
        };

      case 2: // Spreader - Rippling Waves
        return {
          transform: [{
            scale: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [1.0, 1.08],
            }),
          }],
          shadowRadius: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 6],
          }),
          shadowOpacity: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.8],
          }),
          shadowColor: '#00F5FF',
        };

      case 3: // Survivor - Eternal Flame
        return {
          shadowRadius: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [4, 10],
          }),
          shadowOpacity: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.7, 1.0],
          }),
          shadowColor: '#FFFF00',
          elevation: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [4, 7],
          }),
        };

      case 4: // Ghost - Phase Shift
        return {
          opacity: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 0.8],
          }),
          shadowRadius: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [2, 5],
          }),
          shadowColor: '#FF10F0',
        };

      case 5: // Replicator - Mitosis Burst
        return {
          transform: [{
            scale: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [1.0, 1.15],
            }),
          }],
          shadowRadius: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 5],
          }),
          shadowOpacity: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.9],
          }),
          shadowColor: '#FF6600',
        };

      case 6: // Destroyer - Aggressive Pulse
        return {
          borderWidth: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [3.5, 5.5],
          }),
          shadowRadius: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [3, 8],
          }),
          shadowOpacity: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1.0],
          }),
          shadowColor: '#FF0000',
          elevation: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [5, 9],
          }),
        };

      case 7: // Hybrid - Chromatic Shift
        return {
          shadowRadius: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [3, 7],
          }),
          shadowOpacity: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.6, 0.95],
          }),
          shadowColor: '#B026FF',
          transform: [{
            scale: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [1.0, 1.04],
            }),
          }],
          elevation: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [3, 6],
          }),
        };

      default:
        return {};
    }
  }, [animatedValues]);

  const getSuperpowerStyle = (superpowerType: number) => {
    switch (superpowerType) {
      case 1: // Tank
        return styles.superpowerTank;
      case 2: // Spreader
        return styles.superpowerSpreader;
      case 3: // Survivor
        return styles.superpowerSurvivor;
      case 4: // Ghost
        return styles.superpowerGhost;
      case 5: // Replicator
        return styles.superpowerReplicator;
      case 6: // Destroyer
        return styles.superpowerDestroyer;
      case 7: // Hybrid
        return styles.superpowerHybrid;
      default:
        return null;
    }
  };

  const getCellStyle = (cell: Cell) => {
    const cellStyles: any[] = [styles.cell];

    // Base color for player
    if (cell.alive && cell.player === 0) {
      cellStyles.push(styles.cellP1); // Blue for P1
    } else if (cell.alive && cell.player === 1) {
      cellStyles.push(styles.cellP2); // Green for P2
    } else {
      cellStyles.push(styles.cellEmpty); // Dark gray for empty
    }

    // Superpower visual effect
    if (cell.alive && cell.superpowerType > 0) {
      const superpowerStyle = getSuperpowerStyle(cell.superpowerType);
      if (superpowerStyle) {
        cellStyles.push(superpowerStyle);
      }
    }

    // Memory effects
    if (cell.memory & MEMORY_FLAGS.IS_VETERAN) {
      cellStyles.push(styles.cellVeteran);
    }

    return cellStyles;
  };


  // Calculate board dimensions - responsive for phones, tablets, and Chromebooks
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Detect device type based on screen dimensions
  const isTablet = React.useMemo(() => {
    const smallerDimension = Math.min(width, height);
    return smallerDimension >= 600; // 600dp is standard tablet breakpoint
  }, [width, height]);

  const boardDimension = React.useMemo(() => {
    // Use the smaller dimension to handle landscape/portrait
    const smallerDimension = Math.min(width, height);

    // Account for safe area insets
    const availableWidth = width - insets.left - insets.right - 32; // 32px padding
    const availableHeight = height - insets.top - insets.bottom - 100; // 100px for HUD/cards
    const availableSpace = Math.min(availableWidth, availableHeight);

    // Different scaling for tablets/Chromebooks vs phones
    if (isTablet) {
      // Tablets/Chromebooks: use more of the screen, higher max size
      return Math.min(availableSpace * 0.85, 700);
    } else {
      // Phones: tighter fit, lower max size
      return Math.min(availableSpace * 0.9, 450);
    }
  }, [width, height, insets, isTablet]);

  // Calculate cell size and actual board dimensions
  const boardBorderWidth = 2;
  const cellBorderWidth = 0.5; // Each cell has 0.5px border on all sides

  // Calculate cell size from max available dimension
  // Account for borders: each cell adds (cellSize + 2*borderWidth) to total width
  // Total row width = boardSize * (cellSize + 2*borderWidth) must fit in maxAvailableSpace
  const maxAvailableSpace = boardDimension - (boardBorderWidth * 2);

  // Calculate cell size to exactly fill the board
  // In React Native, width includes borders (border-box model)
  // We need: cellSize * boardSize = maxAvailableSpace (as close as possible)
  const exactCellSize = maxAvailableSpace / boardSize;
  const cellSize = Math.floor(exactCellSize);

  // Calculate how many pixels we're short
  const totalCellsWidth = cellSize * boardSize;
  const remainingPixels = maxAvailableSpace - totalCellsWidth;

  // If we have significant remaining space (0.5px or more per cell on average),
  // we can make cells 1px bigger to fill the gap
  const shouldIncrementCellSize = remainingPixels >= boardSize * 0.5;
  const finalCellSize = shouldIncrementCellSize ? cellSize + 1 : cellSize;

  // Calculate actual space used
  const actualCellsWidth = finalCellSize * boardSize;
  const actualBoardWidth = actualCellsWidth + (boardBorderWidth * 2);

  return (
    <View style={styles.container}>
      <View
        ref={boardRef}
        onLayout={handleBoardLayout}
        onStartShouldSetResponder={() => {
          const shouldSet = isPlacementStage && isMyTurn && !isFinished;
          console.log('[GameBoard] onStartShouldSetResponder:', shouldSet, { isPlacementStage, isMyTurn, isFinished });
          return shouldSet;
        }}
        onStartShouldSetResponderCapture={() => {
          // Capture gestures more aggressively to prevent ScrollView from stealing them
          const shouldCapture = isPlacementStage && isMyTurn && !isFinished;
          console.log('[GameBoard] onStartShouldSetResponderCapture:', shouldCapture);
          return shouldCapture;
        }}
        onMoveShouldSetResponder={() => {
          const shouldSet = isPlacementStage && isMyTurn && !isFinished;
          return shouldSet;
        }}
        onMoveShouldSetResponderCapture={() => {
          // Keep capturing during move to maintain gesture ownership
          return isPlacementStage && isMyTurn && !isFinished;
        }}
        onResponderGrant={handleTouchStart}
        onResponderMove={handleTouchMove}
        onResponderRelease={handleTouchEnd}
        onResponderTerminate={handleTouchEnd}
        style={[
          styles.board,
          {
            width: actualBoardWidth,
            height: actualBoardWidth,
          }
        ]}
      >
        {board.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((cell, colIndex) => {
              const baseCellStyle = [
                ...getCellStyle(cell),
                selectedCell?.row === rowIndex && selectedCell?.col === colIndex && styles.cellSelected,
                { width: finalCellSize, height: finalCellSize }
              ];

              // Get animated styles for superpower cells
              const animatedStyle = getAnimatedStyle(cell);

              // During placement: use plain View (touch handled at board level)
              // During simulation/finished: use Animated.View with animations
              // Always use Animated.View - touch logic handled by board responder
              return (
                <Animated.View
                  key={`${rowIndex}-${colIndex}`}
                  style={[baseCellStyle, animatedStyle]}
                >
                  {cell.alive && (
                    <Text style={styles.livesText}>{cell.lives}</Text>
                  )}
                </Animated.View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingVertical: 16,
  },
  board: {
    flexDirection: 'column',
    borderWidth: 2,
    borderColor: '#6B7280',
    backgroundColor: '#1F2937',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 0.5,
    borderColor: '#4B5563',
  },
  cellEmpty: {
    backgroundColor: '#1F2937',
  },
  cellP1: {
    backgroundColor: '#3B82F6', // Blue
  },
  cellP2: {
    backgroundColor: '#10B981', // Green
  },
  cellSelected: {
    borderWidth: 2,
    borderColor: '#FBBF24', // Yellow ring
  },
  cellVeteran: {
    opacity: 0.9,
  },
  // Superpower visual effects - Distinctive borders and patterns
  superpowerTank: {
    borderWidth: 4, // Thickest border for maximum defense
    borderColor: '#FFFFFF', // Thick white border (defensive)
    borderStyle: 'solid',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 4,
  },
  superpowerSpreader: {
    borderWidth: 2.5,
    borderColor: '#06B6D4', // Cyan dotted border (spreading)
    borderStyle: 'dotted',
  },
  superpowerSurvivor: {
    borderWidth: 3,
    borderColor: '#FBBF24', // Bright yellow border (glowing)
    borderStyle: 'solid',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4, // Android shadow
  },
  superpowerGhost: {
    opacity: 0.5, // Semi-transparent base for ethereal phasing
    borderWidth: 2,
    borderColor: '#C084FC', // Purple border
    borderStyle: 'dashed',
    shadowColor: '#FF10F0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },
  superpowerReplicator: {
    borderWidth: 2.5,
    borderColor: '#F97316', // Orange dashed border (duplication pattern)
    borderStyle: 'dashed',
  },
  superpowerDestroyer: {
    borderWidth: 3.5, // Matches animation starting point
    borderColor: '#EF4444', // Thick red border (aggressive)
    borderStyle: 'solid',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
  },
  superpowerHybrid: {
    borderWidth: 3,
    borderColor: '#A855F7', // Purple border with glow
    borderStyle: 'solid',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 3,
  },
  livesText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    lineHeight: 20,
  },
});
