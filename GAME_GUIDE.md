# Game of Strife - Comprehensive Game Guide

## Table of Contents
1. [Game Overview](#game-overview)
2. [How to Play](#how-to-play)
3. [Game Modes](#game-modes)
4. [Settings Reference](#settings-reference)
5. [Superpower System](#superpower-system)
6. [Conway's Game of Life Rules](#conways-game-of-life-rules)
7. [Game Phases](#game-phases)
8. [Victory Conditions](#victory-conditions)
9. [Visual Effects & Animations](#visual-effects--animations)
10. [Technical Details](#technical-details)

---

## Game Overview

Game of Strife is a competitive multiplayer game based on Conway's Game of Life. Two players place tokens on a grid board, then watch their cells compete through generations of cellular automation. The player with the most living cells after the simulation ends wins.

**Core Concept:**
- Players take turns placing tokens on a board
- Once placement is complete, Conway's Game of Life simulation runs
- Cells live, die, and are born based on their neighbors
- Special "superpower" cells have unique abilities and extra lives
- The player with the most living cells after 100 generations (or stability) wins

**Key Features:**
- Turn-based token placement with drag-to-place support
- 7 unique superpower types with distinctive visual effects
- Configurable Conway rules (birth/survival patterns)
- Toroidal board (wraparound edges)
- Lives system for superpower cells
- Real-time multiplayer via WebSocket

---

## How to Play

### Getting Started

1. **Launch the Game**
   - Open the app
   - Choose between Practice Mode (vs yourself) or Multiplayer Mode (vs another player)

2. **Practice Mode**
   - Configure game settings (board size, tokens, rules)
   - Start game immediately
   - Place tokens for both Player 1 and Player 2 yourself

3. **Multiplayer Mode**
   - Create a room or join an existing room
   - Wait for opponent to join
   - Game starts automatically when both players are ready

### Placement Phase

**Objective:** Place your tokens strategically on the board to create formations that will survive and dominate during simulation.

**How to Place Tokens:**

1. **Tap to Place:**
   - Tap any empty cell to place a token
   - Tap your own token to remove it
   - Each token has a chance to be a superpower cell (default: 20%)

2. **Drag to Place:**
   - Touch and drag your finger across the board
   - Leaves a trail of tokens in all cells you touch
   - Works horizontally, vertically, and diagonally
   - Faster placement for creating patterns

3. **Turn-Based Play (Multiplayer):**
   - Player 1 (Blue) places first
   - Player 2 (Green) places second
   - Turns alternate until all tokens are placed
   - Your turn indicator shows "Your Turn" or "Opponent's Turn"

4. **Token Management:**
   - You have a limited number of tokens (default: 20)
   - Token counter shows remaining tokens
   - Removing a token returns it to your pool

### Simulation Phase

**What Happens:**
- Conway's Game of Life simulation runs automatically
- Cells are born, survive, or die based on neighbor counts
- Superpowers activate their special abilities
- Generation counter advances (max 100 generations)
- Simulation stops when board stabilizes or max generations reached

**What You See:**
- Board updates every frame (default: 50ms = 20fps)
- Generation counter increments
- Cell counts update in real-time
- Superpower animations activate (placement and finished stages only)
- Lives displayed on each superpower cell

**Strategic Patterns:**
- **Gliders:** Small patterns that move across the board
- **Oscillators:** Patterns that cycle between states
- **Still Lifes:** Stable patterns that don't change
- **Breeders:** Patterns that create new cells over time

### Victory

**Winner Determined By:**
1. Player with the most living cells after simulation ends
2. If tied, game is a draw
3. Results modal shows final scores and simulation stats

**Results Display:**
- Winner announcement (You Win! / You Lose / Draw)
- Final generation count
- Simulation duration in seconds
- Player 1 living cells vs Player 2 living cells
- Options: Replay, Rematch (multiplayer), or Return to Lobby

---

## Game Modes

### Practice Mode (Single Player)
- Play both sides yourself
- Test strategies and patterns
- Experiment with different settings
- No opponent needed
- Instant start

**Use Cases:**
- Learning Conway's Game of Life rules
- Testing superpower combinations
- Exploring different board configurations
- Practicing placement patterns

### Multiplayer Mode (Two Players)
- Real-time competition via internet
- Turn-based placement
- Automatic rematch system
- Room-based matchmaking

**Room System:**
- Create Room: Start a new game, share room code with friend
- Join Room: Enter room code to join existing game
- Quick Match: Auto-match with available opponent (if implemented)

**Rematch System:**
- Either player can request rematch after game ends
- Both players see "Rematch Pending" notification
- Auto-accept if both request rematch
- New game starts in same room with same settings
- 30-second timeout if no response

---

## Settings Reference

### User-Configurable Settings

#### Board Size
- **Description:** Dimensions of the square game board
- **Range:** 5x5 to 15x15
- **Default:** 10x10 (100 cells)
- **Impact:**
  - Larger boards = more complex simulations, longer games
  - Smaller boards = faster games, more direct conflict
  - Animations disabled on boards > 20x20 for performance

#### Tokens Per Player
- **Description:** Number of tokens each player can place
- **Range:** 1 to 100
- **Default:** 20
- **Impact:**
  - More tokens = denser initial configurations
  - Fewer tokens = more strategic placement importance

#### Birth Rules
- **Description:** Number of neighbors required for a dead cell to become alive
- **Format:** Array of numbers (e.g., [3])
- **Default:** [3] (standard Conway rule)
- **Common Patterns:**
  - [3] - Standard Conway's Life
  - [2, 3] - High Life variant
  - [3, 6] - Day & Night variant

#### Survival Rules
- **Description:** Number of neighbors required for a living cell to survive
- **Format:** Array of numbers (e.g., [2, 3])
- **Default:** [2, 3] (standard Conway rule)
- **Common Patterns:**
  - [2, 3] - Standard Conway's Life (B3/S23)
  - [1, 2, 3, 4, 5] - Maze variant
  - [0, 1, 2, 3, 4, 5, 6, 7, 8] - Life without Death

#### Enabled Superpowers
- **Description:** Which superpower types can appear during the game
- **Format:** Array of superpower IDs (1-7)
- **Default:** [1, 2, 3, 4, 5, 6, 7] (all enabled)
- **Options:**
  - 1 = Tank
  - 2 = Spreader
  - 3 = Survivor
  - 4 = Ghost
  - 5 = Replicator
  - 6 = Destroyer
  - 7 = Hybrid
- **Impact:** Disable specific superpowers to simplify gameplay or ban overpowered types

#### Superpower Percentage
- **Description:** Chance that a placed token becomes a superpower cell
- **Range:** 0% to 50%
- **Default:** 20%
- **Impact:**
  - 0% = No superpowers (classic Conway's Life)
  - Higher % = More special abilities and chaos
  - Lower % = More predictable, strategic gameplay

#### Animation Speed
- **Description:** Milliseconds per frame during simulation playback
- **Range:** 10ms to 500ms
- **Default:** 50ms (20 frames per second)
- **Impact:**
  - Lower values = faster simulation (e.g., 10ms = 100fps)
  - Higher values = slower simulation (e.g., 200ms = 5fps)
  - Allows you to see individual generation changes or speed through simulation

#### Enable Toroidal Board
- **Description:** Board edges wrap around (top connects to bottom, left to right)
- **Type:** Boolean (On/Off)
- **Default:** True (Enabled)
- **Impact:**
  - **Enabled:** Patterns can move off one edge and appear on opposite edge
  - **Disabled:** Edges act as walls, cells at borders have fewer neighbors

#### Enable Superpower Animations
- **Description:** Show animated visual effects on superpower cells
- **Type:** Boolean (On/Off)
- **Default:** True (Enabled)
- **When Active:** Placement phase and finished/results stage
- **Performance:** Auto-disabled on boards > 20x20
- **Impact:**
  - **Enabled:** Distinctive glows, pulses, and effects for each superpower
  - **Disabled:** Static border colors only (better performance)

#### Enable Superpower Birth
- **Description:** Allow newly born cells during simulation to become superpowers
- **Type:** Boolean (On/Off)
- **Default:** True (Enabled)
- **Impact:**
  - **Enabled:** New cells can inherit superpower type from parent cells
  - **Disabled:** Only initially placed tokens can be superpowers

#### Superpower Lives
- **Description:** Number of extra lives for each superpower type
- **Format:** Record mapping superpower ID to lives count
- **Default Values:**
  - Type 0 (Normal): 0 lives
  - Type 1 (Tank): 3 lives
  - Type 2 (Spreader): 2 lives
  - Type 3 (Survivor): 5 lives
  - Type 4 (Ghost): 1 life
  - Type 5 (Replicator): 2 lives
  - Type 6 (Destroyer): 4 lives
  - Type 7 (Hybrid): 3 lives
- **Note:** Lives are reset to current defaults when loading saved settings (for balance updates)

---

## Superpower System

### Overview

Superpowers are special cell types with unique visual effects and extra lives. Each superpower has:
- Distinctive border color and style
- Animated visual effects (when animations enabled)
- Extra lives (survive multiple "death" events)
- Thematic appearance matching their role

### Superpower Types

#### Type 0: Normal (No Superpower)
- **Role:** Standard Conway cell
- **Color:** Blue (P1) or Green (P2)
- **Border:** Standard cell border
- **Lives:** 0 (dies immediately when death conditions met)
- **Animation:** None
- **Strategy:** Form basic patterns (gliders, blinkers, blocks)

---

#### Type 1: Tank (Defensive)
- **Role:** Protective shield, impenetrable defense, steadfast guardian
- **Color:** Bright white (#FFFFFF)
- **Border:** 4px solid (thickest) - defensive barrier
- **Lives:** 3
- **Animation:** **Protective Halo**
  - Effect: Expanding/contracting white glow aura
  - Cycle: 600ms (steady pulse)
  - Shadow radius: 2px → 8px
  - Shadow opacity: 0.6 → 0.9
  - Elevation: 4 → 8 (Android shadow depth)
- **Visual Feel:** Protective barrier that breathes steadily, always present
- **Strategy:** Place in key defensive positions to anchor formations

---

#### Type 2: Spreader (Propagation)
- **Role:** Ripples spreading outward, infectious growth, expanding waves
- **Color:** Neon cyan (#00F5FF)
- **Border:** 2.5px dotted (spreading pattern)
- **Lives:** 2
- **Animation:** **Rippling Waves**
  - Effect: Pulsing outward like ripples in water
  - Cycle: 400ms (fast pulse)
  - Scale: 1.0 → 1.08 (expands outward)
  - Shadow radius: 0px → 6px
  - Shadow opacity: 0 → 0.8
- **Visual Feel:** Rapidly spreading influence, constant waves of propagation
- **Strategy:** Use to create expanding patterns and territory control

---

#### Type 3: Survivor (Endurance)
- **Role:** Unwavering presence, blazing determination, eternal flame
- **Color:** Electric yellow (#FFFF00)
- **Border:** 3px solid (strong, continuous)
- **Lives:** 5 (highest durability)
- **Animation:** **Eternal Flame**
  - Effect: Intensifying and dimming glow, like a steady flame
  - Cycle: 500ms (moderate pulse)
  - Shadow radius: 4px → 10px
  - Shadow opacity: 0.7 → 1.0
  - Elevation: 4 → 7
- **Visual Feel:** Constant, unwavering presence that can't be extinguished
- **Strategy:** Ultimate defensive cell, survives longest under pressure

---

#### Type 4: Ghost (Ethereal)
- **Role:** Phasing between dimensions, ephemeral, unpredictable
- **Color:** Neon magenta (#FF10F0)
- **Border:** 2px dashed (incomplete, phasing)
- **Base Opacity:** 0.5 (semi-transparent)
- **Lives:** 1
- **Animation:** **Phase Shift**
  - Effect: Fading in and out of existence
  - Cycle: 200-400ms random (irregular, unpredictable)
  - Opacity: 0.2 → 0.8 (phasing in/out)
  - Shadow radius: 2px → 5px
  - Timing varies for unpredictable feel
- **Visual Feel:** Unpredictable, ethereal, never quite solid, rapid phasing
- **Strategy:** Deceptive placement, opponents can't predict behavior

---

#### Type 5: Replicator (Multiplication)
- **Role:** Cell division, rapid multiplication, explosive bursts
- **Color:** Bright orange (#FF6600)
- **Border:** 2.5px dashed (replication pattern)
- **Lives:** 2
- **Animation:** **Mitosis Burst**
  - Effect: Quick flash burst simulating cell division
  - Cycle: 250ms (very fast)
  - Scale: 1.0 → 1.15 (burst out and back)
  - Shadow radius: 0px → 5px
  - Shadow opacity: 0 → 0.9 (flash intensity)
- **Visual Feel:** Energetic bursts, ready to divide and multiply, highly dynamic
- **Strategy:** Place in high-birth areas to create explosive growth

---

#### Type 6: Destroyer (Aggression)
- **Role:** Violent power, destructive force, relentless assault
- **Color:** Pure red (#FF0000)
- **Border:** 3.5px solid (thick, aggressive)
- **Lives:** 4
- **Animation:** **Aggressive Pulse**
  - Effect: Sharp, intense pulsing with border thickness variation
  - Cycle: 350ms (fast, intense)
  - Border width: 3.5px → 5.5px (aggressive expansion)
  - Shadow radius: 3px → 8px
  - Shadow opacity: 0.8 → 1.0 (maximum intensity)
  - Elevation: 5 → 9
- **Visual Feel:** Threatening, powerful, ready to strike, relentless assault
- **Strategy:** Offensive formations, dominate contested areas

---

#### Type 7: Hybrid (Complex)
- **Role:** Adaptive fusion, multi-faceted power, sophisticated evolution
- **Color:** Electric purple (#B026FF)
- **Border:** 3px solid (balanced)
- **Lives:** 3
- **Animation:** **Chromatic Shift**
  - Effect: Color shifting through purple spectrum + combined effects
  - Cycle: 700ms (moderate, sophisticated)
  - Shadow radius: 3px → 7px
  - Shadow opacity: 0.6 → 0.95
  - Scale: 1.0 → 1.04 (subtle pulse)
  - Elevation: 3 → 6
  - Shadow color shifts: #B026FF → #FF10F0 (purple to magenta)
- **Visual Feel:** Complex, sophisticated, multiple powers working together
- **Strategy:** Versatile placement, balanced offense and defense

---

## Conway's Game of Life Rules

### Standard Rules (Default)

Game of Strife uses the classic Conway's Game of Life rules (B3/S23):

**Birth Rule:** A dead cell with exactly **3** living neighbors becomes alive
**Survival Rule:** A living cell with **2 or 3** living neighbors survives

**Death Conditions:**
- Living cell with < 2 neighbors dies (underpopulation)
- Living cell with > 3 neighbors dies (overpopulation)

### How Neighbors Are Counted

Each cell has 8 potential neighbors (Moore neighborhood):
```
NW  N  NE
 W  X  E
SW  S  SE
```

**Toroidal Board (Default Enabled):**
- Cells on edges wrap around to opposite side
- Top row connects to bottom row
- Left column connects to right column
- All cells have exactly 8 neighbors

**Non-Toroidal Board:**
- Edge cells have fewer neighbors (5 for edges, 3 for corners)
- No wraparound

### Lives System

**Normal Cells (Type 0):**
- Lives = 0
- Die immediately when death conditions met
- Standard Conway behavior

**Superpower Cells (Types 1-7):**
- Lives = 1 to 5 (varies by type)
- Survive multiple death events
- Lives decrement each time death conditions met
- Cell actually dies when lives reach 0
- Lives displayed on cell during game

**Example:**
- Tank cell (3 lives) in overpopulated area
- Generation 1: Death conditions → lives: 3 → 2 (survives)
- Generation 2: Death conditions → lives: 2 → 1 (survives)
- Generation 3: Death conditions → lives: 1 → 0 (dies)

### Custom Rules

You can modify birth and survival rules in settings:

**Common Variants:**
- **HighLife (B36/S23):** Birth on 3 or 6 neighbors, survive on 2 or 3
- **Day & Night (B3678/S34678):** Birth on 3,6,7,8 neighbors, survive on 3,4,6,7,8
- **Maze (B3/S12345):** Creates maze-like patterns
- **Life without Death (B3/S012345678):** Cells never die

**Format:**
- Birth rules: Array of neighbor counts that cause birth
- Survival rules: Array of neighbor counts that allow survival
- Each number 0-8 represents possible neighbor count

---

## Game Phases

### 1. Waiting Phase
- **Multiplayer Only:** Waiting for opponent to join room
- Lobby screen shows room code and player status
- Game starts when both players ready

### 2. Placement Phase
- **Turn Indicator:** Shows whose turn it is
- **Token Counter:** Shows remaining tokens for each player
- **Actions Available:**
  - Place token (tap or drag)
  - Remove own token (tap existing)
  - View token counts
- **Phase Ends:** When all tokens placed by both players

### 3. Simulation Phase
- **Conway's Life Runs:** Automatic generation advancement
- **Frame Rate:** Controlled by animation speed setting (default: 50ms/frame)
- **Generation Counter:** Shows current generation (max 100)
- **Cell Counters:** Real-time living cell count for each player
- **Early Stop:** Simulation ends if board stabilizes (no changes for multiple generations)
- **Duration Timer:** Tracks total simulation time
- **Phase Ends:** After 100 generations or board stability

### 4. Finished Phase
- **Results Modal:** Shows winner and final stats
- **Displays:**
  - Winner announcement
  - Final generation count
  - Simulation duration
  - Final cell counts for both players
- **Actions:**
  - Replay: Watch simulation again with same board
  - Rematch: Start new game (multiplayer)
  - Return to Lobby: Exit game

---

## Victory Conditions

### Primary Victory Condition
**Most Living Cells:** Player with the most living cells after simulation ends wins

### Tie Breaker
**Draw:** If both players have equal living cells, game is a draw

### Simulation End Conditions

1. **Max Generations Reached:**
   - Default: 100 generations
   - Configurable in settings
   - Prevents infinite games

2. **Board Stability:**
   - No changes detected for several consecutive generations
   - Indicates stable patterns (still lifes, oscillators)
   - Early termination to avoid wasting time

3. **Total Extinction:**
   - All cells dead on board
   - Rare but possible
   - Draw result

### Scoring
- Only living cells count toward final score
- Dead cells (even with player color) don't count
- Superpower cells count the same as normal cells (1 cell = 1 point)
- No bonus points for superpowers or pattern complexity

---

## Visual Effects & Animations

### Animation System Overview

**Purpose:** Make each superpower instantly recognizable and visually distinctive

**Architecture:**
- Shared Animated.Value per superpower type (memory efficient)
- All cells of same type animate synchronously
- Looping animations with specific cycle times
- Active during placement and finished phases only (not during simulation)

**Performance:**
- Auto-disabled on boards > 20x20 (400+ cells)
- Can be disabled in settings for low-end devices
- Uses React Native Animated API
- useNativeDriver: false (required for shadow properties)

### Animation Timing Summary

| Superpower | Cycle Duration | Cycles in 1s | Feel |
|------------|----------------|--------------|------|
| Tank | 600ms | 1-2 | Steady protective pulse |
| Spreader | 400ms | 2-3 | Rapid spreading waves |
| Survivor | 500ms | 2 | Persistent eternal flame |
| Ghost | 200-400ms | 2-5 | Unpredictable phasing |
| Replicator | 250ms | 4 | Explosive bursts |
| Destroyer | 350ms | 2-3 | Intense aggressive beats |
| Hybrid | 700ms | 1-2 | Complex sophisticated |

### Visual Effect Details

Each superpower has multiple visual layers:

**Static Effects (Always Present):**
- Border color (from ARCADE_COLORS palette)
- Border width (2px to 4px)
- Border style (solid, dashed, or dotted)
- Base opacity (1.0 for most, 0.5 for Ghost)

**Animated Effects (When Enabled):**
- Shadow radius (glow size)
- Shadow opacity (glow intensity)
- Shadow color (matches border color)
- Scale (cell size pulsing)
- Border width (thickness variation)
- Elevation (Android shadow depth)
- Opacity (fade in/out)

**Lives Display:**
- White bold number overlaid on cell
- Shows remaining lives for superpower cells
- Updates in real-time as lives decrement
- Size: 12px font, centered

### Color Palette

**Player Colors:**
- Player 1: Blue (#3B82F6)
- Player 2: Green (#10B981)

**Superpower Colors:**
- Tank: White (#FFFFFF)
- Spreader: Neon Cyan (#00F5FF)
- Survivor: Electric Yellow (#FFFF00)
- Ghost: Neon Magenta (#FF10F0)
- Replicator: Bright Orange (#FF6600)
- Destroyer: Pure Red (#FF0000)
- Hybrid: Electric Purple (#B026FF)

**UI Colors:**
- Background: Dark Gray (#111827)
- Board: Darker Gray (#1F2937)
- Grid Lines: Medium Gray (#4B5563)
- Selected Cell: Yellow Ring (#FBBF24)

---

## Technical Details

### Board Dimensions
- **Minimum:** 5x5 (25 cells)
- **Maximum:** 15x15 (225 cells)
- **Default:** 10x10 (100 cells)
- **Responsive:** Board scales based on device screen size
- **Tablet Support:** Larger max size on tablets/Chromebooks

### Performance Limits
- **Animation Cutoff:** Disabled on boards > 20x20
- **Max Generations:** 100 (configurable)
- **Frame Rate:** Default 20fps (50ms/frame), range 2fps to 100fps

### Platform Support
- **Primary:** Android (tested and optimized)
- **Future:** iOS support (code compatible, not yet tested)
- **Web:** Limited functionality (React Native Web limitations)

### Network Requirements
- **Multiplayer:** Internet connection required
- **WebSocket:** Real-time communication via Socket.IO
- **Server:** Backend handles game logic validation
- **Latency Tolerance:** Turn-based, not latency-sensitive

### Storage
- **Settings:** Persisted to device AsyncStorage
- **Match History:** Not currently stored
- **Replay Data:** Not currently saved

### Accessibility
- **Color Blind Mode:** Not yet implemented
- **Screen Reader:** Not yet optimized
- **Touch Target Size:** Adaptive based on board size
- **Drag Support:** Improved accessibility for placement

### Known Limitations
- **Max Players:** 2 (no spectators or 3+ players)
- **Rematch Timeout:** 30 seconds (hardcoded)
- **No AI Opponent:** Practice mode requires manual play of both sides
- **No Replay Save:** Can only replay immediately after game ends
- **Simulation Speed:** Must be same for both players (set at game start)

### Version Information
- **Current Version:** 1.0.0
- **Version Code:** 1
- **Package:** com.gameofstrife.mobile
- **Server:** https://gameofstrife-mobile-production.up.railway.app

---

## Strategy Tips

### Placement Strategies

**Defensive Patterns:**
- Use Tanks (Type 1) and Survivors (Type 3) in key positions
- Create stable "still life" formations (blocks, beehives)
- Place high-life superpowers in contested areas

**Offensive Patterns:**
- Use Destroyers (Type 6) and Replicators (Type 5) for aggression
- Create "glider" patterns that invade opponent territory
- Target opponent's stable formations with oscillators

**Expansion Strategies:**
- Spreaders (Type 2) for territory control
- Place tokens near edges (wraps around with toroidal board)
- Create "breeder" patterns that generate new cells

**Advanced Tactics:**
- **Superpower Clustering:** Group same-type superpowers for synchronized effects
- **Mixed Formations:** Combine offensive and defensive types
- **Edge Control:** Use toroidal wraparound for surprise attacks
- **Timing:** Save tokens to counter opponent's placements

### Common Mistakes to Avoid

1. **Overcrowding:** Too many adjacent cells → overpopulation death
2. **Isolation:** Single cells with no neighbors → underpopulation death
3. **Ignoring Superpowers:** Random placement wastes special abilities
4. **Edge Neglect:** Forgetting edges wrap around (toroidal board)
5. **Reactive Play:** Only responding to opponent instead of building own formations

### Winning Conditions Analysis

**High-Density Games (Many Tokens):**
- Focus on survival and stability
- Create multiple isolated stable formations
- Use Survivors and Tanks heavily

**Low-Density Games (Few Tokens):**
- Aggressive glider creation
- Target opponent's isolated cells
- Use Spreaders and Replicators

**Standard Games (20 tokens default):**
- Balanced mix of offense and defense
- Create 2-3 main formation clusters
- Use variety of superpower types

---

## Appendix: Conway Pattern Reference

### Still Lifes (Stable Patterns)
- **Block:** 2x2 square of cells
- **Beehive:** 6 cells in hexagonal shape
- **Loaf:** 7 cells in bread loaf shape
- **Boat:** 5 cells in boat shape

### Oscillators (Repeating Patterns)
- **Blinker:** 3 horizontal cells (period 2)
- **Toad:** 6 cells (period 2)
- **Beacon:** 8 cells (period 2)
- **Pulsar:** 48 cells (period 3)

### Spaceships (Moving Patterns)
- **Glider:** 5 cells, moves diagonally (period 4, speed c/4)
- **Lightweight Spaceship (LWSS):** 9 cells, horizontal movement
- **Middleweight Spaceship (MWSS):** 11 cells
- **Heavyweight Spaceship (HWSS):** 13 cells

### Methuselahs (Long-Lived Patterns)
- **R-pentomino:** 5 cells, stabilizes after 1103 generations
- **Acorn:** 7 cells, stabilizes after 5206 generations
- **Diehard:** 7 cells, all cells die after 130 generations

**Note:** In Game of Strife, superpower lives and opponent interference dramatically change these patterns' behavior.

---

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Practice mode and multiplayer mode
- 7 superpower types with distinctive animations
- Drag-to-place token placement
- Configurable Conway rules
- Toroidal board support
- Lives system for superpowers
- Animation speed control
- Real-time WebSocket multiplayer
- Rematch system

### Planned Features (Future Versions)
- AI opponent for practice mode
- Match history and statistics
- Replay save/load functionality
- Color blind mode
- Accessibility improvements
- Additional superpower types
- Tournament mode
- Spectator mode

---

*End of Game Guide*
