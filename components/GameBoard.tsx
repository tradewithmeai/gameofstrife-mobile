// Game of Strife GameBoard for React Native
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, GestureResponderEvent, Text } from 'react-native';
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
}

export const GameOfStrifeBoard: React.FC<GameOfStrifeBoardProps> = ({
  board,
  boardSize,
  isPlacementStage,
  isMyTurn,
  isFinished,
  onGameAction,
  selectedCell,
  mySeat,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const boardRef = useRef<View>(null);
  const lastPlacedCell = useRef<string | null>(null);
  const boardLayout = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  // Runtime detection state for touch coordinate method
  const [touchMethod, setTouchMethod] = useState<'locationXY' | 'pageXY' | null>(null);
  const detectionAttempted = useRef(false);

  // Detection threshold constant
  const LOCATION_XY_MIN_THRESHOLD = 1; // Allow clicks near top-left corner

  // Log component render to verify code is loaded
  devLog('[GameBoard] Component rendered with runtime detection enabled');

  // Extract coordinates using both methods for comparison/detection
  const extractBothCoordinateMethods = useCallback((
    touch: any,
    boardX: number,
    boardY: number
  ): { locationMethod: { x: number; y: number }, pageMethod: { x: number; y: number } } => {
    return {
      locationMethod: {
        x: touch.locationX,
        y: touch.locationY
      },
      pageMethod: {
        x: touch.pageX - boardX,
        y: touch.pageY - boardY
      }
    };
  }, []);

  // Detect which touch coordinate method works for this device
  const detectTouchMethod = useCallback((
    coords: { locationMethod: { x: number; y: number }, pageMethod: { x: number; y: number } },
    boardWidth: number,
    boardHeight: number
  ): 'locationXY' | 'pageXY' => {
    const { locationMethod, pageMethod } = coords;

    devLog('[GameBoard] Touch method detection:', {
      locationXY: locationMethod,
      pageXY: pageMethod,
      boardDimensions: { width: boardWidth, height: boardHeight }
    });

    // Test if locationX/Y are within board bounds and above threshold
    const locationXYValid =
      locationMethod.x >= 0 &&
      locationMethod.x <= boardWidth &&
      locationMethod.y >= 0 &&
      locationMethod.y <= boardHeight &&
      (locationMethod.x > LOCATION_XY_MIN_THRESHOLD || locationMethod.y > LOCATION_XY_MIN_THRESHOLD);

    // Test if pageX/Y (after offset) are within board bounds
    const pageXYValid =
      pageMethod.x >= 0 &&
      pageMethod.x <= boardWidth &&
      pageMethod.y >= 0 &&
      pageMethod.y <= boardHeight;

    devLog('[GameBoard] Validation:', { locationXYValid, pageXYValid });

    // Prefer locationXY if both valid (more direct, less calculation)
    if (locationXYValid) {
      devLog('[GameBoard] DETECTED: locationXY method (real device)');
      return 'locationXY';
    } else if (pageXYValid) {
      devLog('[GameBoard] DETECTED: pageXY method (emulator)');
      return 'pageXY';
    } else {
      console.warn('[GameBoard] WARNING: Neither method validated, defaulting to pageXY');
      return 'pageXY';
    }
  }, [LOCATION_XY_MIN_THRESHOLD]);

  // Get coordinates based on detected method
  const getCoordinatesForMethod = useCallback((
    touch: any,
    boardX: number,
    boardY: number,
    method: 'locationXY' | 'pageXY'
  ): { x: number; y: number } => {
    if (method === 'locationXY') {
      return { x: touch.locationX, y: touch.locationY };
    } else {
      return { x: touch.pageX - boardX, y: touch.pageY - boardY };
    }
  }, []);

  // Get cell coordinates from touch position - using locationX/Y which is relative to the touched view
  const getCellFromPosition = useCallback((locationX: number, locationY: number, boardWidth: number, boardHeight: number): { row: number; col: number } | null => {
    // Account for board border (2px on each side as defined in styles.board)
    const BOARD_BORDER_WIDTH = 2;

    // Adjust for border offset
    const adjustedX = locationX - BOARD_BORDER_WIDTH;
    const adjustedY = locationY - BOARD_BORDER_WIDTH;

    // Calculate usable board area (excluding borders)
    const usableWidth = boardWidth - (BOARD_BORDER_WIDTH * 2);
    const usableHeight = boardHeight - (BOARD_BORDER_WIDTH * 2);

    // Clamp coordinates to valid range (allow border touches to map to nearest cell)
    const clampedX = Math.max(0, Math.min(adjustedX, usableWidth - 0.1));
    const clampedY = Math.max(0, Math.min(adjustedY, usableHeight - 0.1));

    devLog('[GameBoard] Touch calculation:', {
      locationX, locationY,
      adjustedX, adjustedY,
      clampedX, clampedY,
      boardWidth, boardHeight,
      boardSize,
      borderOffset: BOARD_BORDER_WIDTH
    });

    const cellSize = Math.min(usableWidth, usableHeight) / boardSize;

    // Calculate cell position using clamped coordinates
    const col = Math.floor(clampedX / cellSize);
    const row = Math.floor(clampedY / cellSize);

    devLog('[GameBoard] Calculated cell:', {
      row,
      col,
      cellSize: cellSize.toFixed(2),
      colBoundary: `${(col * cellSize).toFixed(1)}-${((col + 1) * cellSize).toFixed(1)}px`
    });

    // Check bounds
    if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
      devLog('[GameBoard] Cell valid!');
      return { row, col };
    }

    devLog('[GameBoard] Cell out of bounds:', { row, col, boardSize });
    return null;
  }, [boardSize]);

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

    devLog('[GameBoard] Calling onGameAction with position:', position);
    onGameAction({
      type: 'PLACE_TOKEN',
      payload: { position, row, col },
      timestamp: Date.now()
    });
  }, [isPlacementStage, isMyTurn, isFinished, board, boardSize, onGameAction, mySeat]);

  // Measure board layout on mount and when it changes
  const handleLayout = useCallback(() => {
    boardRef.current?.measureInWindow((x, y, width, height) => {
      boardLayout.current = { x, y, width, height };
      const BOARD_BORDER = 2;
      const usableWidth = width - (BOARD_BORDER * 2);
      const calculatedCellSize = usableWidth / boardSize;
      devLog('[GameBoard] Board measured:', {
        x, y, width, height,
        boardSize,
        borderWidth: BOARD_BORDER,
        usableWidth,
        calculatedCellSize: calculatedCellSize.toFixed(2),
        percentageBasedCellSize: (width / boardSize).toFixed(2)
      });
    });
  }, [boardSize]);

  // Touch event handler with runtime coordinate method detection
  const handleTouchStart = useCallback((e: GestureResponderEvent) => {
    console.log('[GameBoard] Touch start:', { isPlacementStage, isMyTurn, isFinished });
    if (!isPlacementStage || !isMyTurn) return;

    setIsDragging(true);
    lastPlacedCell.current = null;

    const touch = e.nativeEvent;

    devLog('[GameBoard] Raw touch:', {
      locationX: touch.locationX,
      locationY: touch.locationY,
      pageX: touch.pageX,
      pageY: touch.pageY,
      currentMethod: touchMethod
    });

    boardRef.current?.measureInWindow((boardX, boardY, width, height) => {
      devLog('[GameBoard] Board position:', { boardX, boardY, width, height });

      // First touch: detect which method to use
      if (!detectionAttempted.current) {
        const coords = extractBothCoordinateMethods(touch, boardX, boardY);
        const detectedMethod = detectTouchMethod(coords, width, height);
        setTouchMethod(detectedMethod);
        detectionAttempted.current = true;

        const { x, y } = getCoordinatesForMethod(touch, boardX, boardY, detectedMethod);
        devLog('[GameBoard] Using detected method:', detectedMethod, { x, y });

        const cell = getCellFromPosition(x, y, width, height);
        if (cell) {
          handlePlacement(cell.row, cell.col);
        }
      } else if (touchMethod) {
        // Subsequent touches: use cached method
        const { x, y } = getCoordinatesForMethod(touch, boardX, boardY, touchMethod);

        const cell = getCellFromPosition(x, y, width, height);
        if (cell) {
          handlePlacement(cell.row, cell.col);
        }
      }
    });
  }, [isPlacementStage, isMyTurn, touchMethod, extractBothCoordinateMethods,
      detectTouchMethod, getCoordinatesForMethod, getCellFromPosition, handlePlacement]);

  const handleTouchMove = useCallback((e: GestureResponderEvent) => {
    if (!isDragging || !isPlacementStage || !isMyTurn || !touchMethod) return;

    const touch = e.nativeEvent;

    boardRef.current?.measureInWindow((boardX, boardY, width, height) => {
      const { x, y } = getCoordinatesForMethod(touch, boardX, boardY, touchMethod);
      const cell = getCellFromPosition(x, y, width, height);
      if (cell) {
        handlePlacement(cell.row, cell.col);
      }
    });
  }, [isDragging, isPlacementStage, isMyTurn, touchMethod, getCoordinatesForMethod,
      getCellFromPosition, handlePlacement]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    lastPlacedCell.current = null;
  }, []);

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
      if (superpowerStyle) cellStyles.push(superpowerStyle);
    }

    // Memory effects
    if (cell.memory & MEMORY_FLAGS.IS_VETERAN) {
      cellStyles.push(styles.cellVeteran);
    }

    return cellStyles;
  };

  // Reset touch method detection when board size changes
  useEffect(() => {
    detectionAttempted.current = false;
    setTouchMethod(null);
    devLog('[GameBoard] Touch method detection reset (board size changed)');
  }, [boardSize]);

  // Calculate board dimensions - move outside JSX so we can use in handlers
  const screenWidth = Dimensions.get('window').width;
  const boardDimension = React.useMemo(() => Math.min(screenWidth * 0.95, 500), [screenWidth]);

  return (
    <View style={styles.container}>
      {/* Debug info */}
      <Text style={{ color: '#FFF', fontSize: 10, marginBottom: 4 }}>
        Board: {boardDimension.toFixed(0)}px | Cells: {boardSize}x{boardSize} | Method: {touchMethod || 'detecting...'}
      </Text>
      <Text style={{ color: '#10B981', fontSize: 11, marginBottom: 2 }}>
        {touchMethod === 'locationXY'
          ? '✓ Real device mode (locationX/Y)'
          : touchMethod === 'pageXY'
          ? '✓ Emulator mode (pageX/Y)'
          : 'Tap to auto-detect device...'}
      </Text>
      <View
        ref={boardRef}
        style={[
          styles.board,
          {
            width: boardDimension,
            height: boardDimension,
          }
        ]}
        onLayout={handleLayout}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <View
              key={`${rowIndex}-${colIndex}`}
              style={[
                ...getCellStyle(cell),
                selectedCell?.row === rowIndex && selectedCell?.col === colIndex && styles.cellSelected,
                { width: `${100 / boardSize}%`, height: `${100 / boardSize}%` }
              ]}
            />
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 2,
    borderColor: '#6B7280',
    backgroundColor: '#1F2937',
  },
  cell: {
    borderWidth: 0.5,
    borderColor: '#4B5563',
    aspectRatio: 1,
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
  // Superpower visual effects (use opacity/brightness for distinction)
  superpowerTank: {
    opacity: 1,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  superpowerSpreader: {
    opacity: 0.85,
  },
  superpowerSurvivor: {
    opacity: 0.95,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  superpowerGhost: {
    opacity: 0.5,
  },
  superpowerReplicator: {
    opacity: 0.8,
  },
  superpowerDestroyer: {
    opacity: 1,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  superpowerHybrid: {
    opacity: 0.9,
    borderWidth: 1,
    borderColor: '#A855F7',
  },
});
