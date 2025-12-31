# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Game of Strife is a mobile multiplayer game built with React Native (Expo) and a Node.js backend. It implements Conway's Game of Life as a competitive two-player game where players place tokens on a board, then watch them compete through generations of cellular automation.

## Architecture

### Frontend (React Native + Expo)
- **State Management**: Zustand stores in `stores/`
  - `socketStore.ts`: WebSocket connection, room management, match state, and game logic
  - `settingsStore.ts`: User preferences and AsyncStorage persistence
- **UI Components**: Located in `components/`
  - `GameOfStrife.tsx`: Main game container with Conway simulation logic
  - `GameBoard.tsx`: Touch-enabled game board rendering
  - `GameHUD.tsx`: Game stats, turn indicators, token counts
- **Screens**: Expo Router file-based routing in `app/`
  - `app/(tabs)/index.tsx`: Lobby screen (create/join rooms, quick match)
  - `app/(tabs)/game.tsx`: Active game screen
  - `app/(tabs)/settings.tsx`: Settings and preferences
  - `app/_layout.tsx`: Root layout with Material Design theming
- **Utilities**: `utils/` contains game types, board helpers, and Conway's Game of Life simulation logic

### Backend (Fastify + Socket.IO)
- **Entry Point**: `server/src/index.ts` - Fastify server with Socket.IO namespace `/game`
- **Game Engine**: `server/src/engine/gameOfStrifeEngine.ts` - Core game logic
  - Handles placement phase, token validation, Conway simulation
  - Supports superpowers (special cells with different Conway rules)
  - Configurable Conway rules (birth/survival patterns)
- **Services**:
  - `roomManager.ts`: Room creation, joining, player management
  - `matchService.ts`: Match lifecycle, move validation, game state
  - `gameRegistry.ts`: Maps matches to rooms
  - `matchmaker.ts`: Quick match queue (not heavily used)
- **Types**: `server/src/types/` and `server/src/engine/gameOfStrifeTypes.ts`

### Key Design Patterns

1. **Dual Board Representation**:
   - Frontend uses flat array `board: (string | null)[]` for simple games
   - Game of Strife engine uses 2D array `Cell[][]` with rich cell data (player, superpowerType, memory flags)
   - Server sends `fullBoard` in metadata to preserve cell properties

2. **Versioned State Updates**:
   - Each game state has a `version` number
   - Frontend drops stale updates (version <= current)
   - Prevents race conditions and ensures consistency

3. **Two-Phase Game**:
   - **Placement Phase**: Players take turns placing tokens (configurable per player)
   - **Simulation Phase**: Conway's Game of Life runs for up to 100 generations
   - Frontend animates simulation locally; server computes final result

4. **WebSocket Communication**:
   - All real-time game actions via Socket.IO namespace `/game`
   - Events: `matchStart`, `squareClaimed`, `claimRejected`, `stateSync`, `result`, `rematchPending`
   - Server URL configured in `app.json` under `extra.wsUrl`

5. **Rematch System**:
   - Either player can request rematch after game ends
   - Both players auto-accept → new match in same room
   - 30-second timeout if no response

## Common Development Commands

### Mobile App (Root Directory)
```bash
# Start Expo development server
npm start

# Run on Android device/emulator
npm run android

# Run on iOS device/simulator (macOS only)
npm run ios

# Run in web browser (limited functionality)
npm run web
```

### Backend Server
```bash
cd server

# Development with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run production build
npm start
```

## Environment Configuration

### Mobile App
- Server URL: Set in `app.json` → `expo.extra.wsUrl`
- Current production: `https://gameofstrife-mobile-production.up.railway.app`
- For local development: Update to `http://YOUR_LOCAL_IP:3030`

### Backend Server
- **PORT**: Server port (default: 3030)
- **HOST**: Bind address (default: 0.0.0.0)
- **MATCH_MODE**: `turn` (default) or `simul` for simultaneous moves
- **NODE_ENV**: `development` or `production`

## Game Settings & Superpowers

Game settings are defined in `server/src/engine/gameOfStrifeTypes.ts`:
- `boardSize`: Grid dimensions (default: 9x9, max: 15x15)
- `tokensPerPlayer`: Tokens each player can place (default: 20)
- `conwayRules`: Birth/survival patterns (default: B3/S23 - standard Conway)
- `superpowerPercentage`: % chance of superpower cell (default: 20%)
- `enabledSuperpowers`: Array of enabled superpower types

**Superpower Types** (1-7):
1. Warrior - Extra survival resilience
2. Healer - Creates new cells
3. Explorer - Wide influence radius
4. Builder - Defensive formations
5. Necromancer - Resurrects dead cells
6. Strategist - Complex patterns
7. Chaos Agent - Random effects

Frontend randomly assigns superpowers during placement based on these settings.

## Key Implementation Details

### Socket Store (`stores/socketStore.ts`)
- **Connection Management**: Auto-reconnects on app foreground (AppState listener)
- **Pending Claims**: Optimistic UI with `pendingClaims` Map (selectionId → claim)
- **Match State**: `matchState` contains full game state (board, moves, winner, metadata)
- **Seat Assignment**: `mySeat` ('P1' | 'P2') determines player's perspective

### Conway Simulation (Frontend)
- Lives in `GameOfStrife.tsx` component
- Triggered when stage transitions to 'simulation' or 'finished'
- Uses saved `placementBoardRef` (board at end of placement)
- Runs 200ms per generation, max 100 generations
- Stops early if board stabilizes (no changes)
- Displays results modal with final cell counts

### Move Validation Flow
1. Frontend calls `claimSquare(squareId, superpowerType)`
2. Socket store validates locally (turn check, occupied check)
3. Emits `claimSquare` event to server with unique `selectionId`
4. Server validates via `GameOfStrifeEngine.validateClaim()`
5. On success: Server emits `squareClaimed` with updated board
6. On failure: Server emits `claimRejected` with reason

## Deployment

### Production Backend
- Deployed on Railway: `https://gameofstrife-mobile-production.up.railway.app`
- Config: `railway.json`, `nixpacks.toml`
- Build command: `cd server && npm ci && npm run build`
- Start command: `cd server && npm start`

### Mobile App Build
- Use Expo EAS Build for production APK/IPA
- Config: `eas.json`
- Build profile: `production` (minifies, optimizes)

See `DEPLOYMENT_GUIDE.md` for full deployment checklist.

## TypeScript Configuration

### Root (`tsconfig.json`)
- Extends `expo/tsconfig.base`
- Strict mode enabled

### Server (`server/tsconfig.json`)
- Target: ES2022
- Module: ESNext (for ES modules)
- Outputs to `server/dist/`

## Testing Locally

1. Start backend: `cd server && npm run dev` (port 3030)
2. Get your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Update `app.json` → `extra.wsUrl` to `http://YOUR_IP:3030`
4. Start Expo: `npm start` in root directory
5. Scan QR code with Expo Go app on phone
6. Test on two devices to play multiplayer

## Common Pitfalls

1. **WebSocket URL**: Mobile devices can't reach `localhost` - use local network IP
2. **Android Cleartext**: Enabled via `expo-build-properties` for local HTTP testing
3. **Board Flattening**: Server sends 2D `Cell[][]`, frontend may need to flatten/unflatten
4. **Version Mismatches**: Always check `version` field to avoid stale state
5. **Placement Board**: Must save board BEFORE simulation starts (use ref in useMemo)
6. **Socket Handlers**: Detach old handlers before attaching new ones to prevent duplicates

## File Structure Summary

```
gameofstrife-mobile/
├── app/                      # Expo Router screens
│   ├── (tabs)/              # Tab navigation
│   │   ├── index.tsx        # Lobby
│   │   ├── game.tsx         # Game screen
│   │   └── settings.tsx     # Settings
│   └── _layout.tsx          # Root layout
├── components/              # React Native components
│   ├── GameOfStrife.tsx    # Main game container
│   ├── GameBoard.tsx       # Board rendering
│   └── GameHUD.tsx         # Game stats
├── stores/                  # Zustand stores
│   ├── socketStore.ts      # WebSocket & game state
│   └── settingsStore.ts    # User preferences
├── utils/                   # Game utilities
├── server/                  # Node.js backend
│   ├── src/
│   │   ├── index.ts        # Fastify + Socket.IO server
│   │   ├── engine/         # Game logic
│   │   ├── services/       # Room, match, registry
│   │   └── types/          # TypeScript types
│   └── package.json        # Server dependencies
├── app.json                # Expo configuration
└── package.json            # Mobile dependencies
```
