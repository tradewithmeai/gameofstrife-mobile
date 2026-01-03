# Screenshot Guide for Google Play Store

## Required Specifications

- **Minimum**: 2 screenshots
- **Recommended**: 4-8 screenshots
- **Dimensions**: 1080 x 1920 pixels (portrait) OR 1440 x 2560 pixels
- **Format**: PNG or JPEG
- **Max File Size**: 8MB per screenshot
- **Location**: Place in `play-store-assets/screenshots/` directory

## How to Capture Screenshots

### Method 1: Android Device (Recommended)

1. **Run the app** on your Android device:
   ```bash
   npx expo start
   # Scan QR code with Expo Go app
   ```

2. **Navigate to the screen** you want to capture

3. **Take screenshot**:
   - Press **Power + Volume Down** simultaneously
   - Or use device's screenshot gesture (varies by manufacturer)

4. **Find screenshots**:
   - Usually in `Pictures/Screenshots/` folder
   - Or `DCIM/Screenshots/`

5. **Transfer to computer**:
   - USB cable → copy files
   - Google Photos → download
   - Email to yourself

### Method 2: Android Studio Emulator

1. **Start emulator** (Pixel 5 or similar)

2. **Run app**:
   ```bash
   npx expo start
   # Press 'a' to open in Android emulator
   ```

3. **Take screenshot**:
   - Click camera icon in emulator controls
   - Or use keyboard shortcut (varies by OS)

4. **Screenshots save** to:
   - `~/Desktop/` (Mac)
   - `C:\Users\YourName\Desktop\` (Windows)

### Method 3: Expo Development Build

If you have an EAS development build installed:

1. Install the development build on your device
2. Run `npx expo start --dev-client`
3. Take screenshots using device screenshot method

## Required Screenshots

### 1. Lobby Screen (`screenshot-01-lobby.png`)

**What to show**:
- Room creation interface
- "Create Room" button
- "Join Room" with code input
- Room code display (e.g., "983")
- Settings button visible

**How to capture**:
1. Open app → Lobby tab
2. If in a room, leave it first
3. Show the main lobby screen with create/join options
4. Take screenshot

**Key elements visible**:
- App title/header
- Create room button
- Join room input field
- Quick match option (if applicable)
- Settings icon

### 2. Game Board - Placement Phase (`screenshot-02-placement.png`)

**What to show**:
- 20x20 game board with tokens placed
- Blue (P1) and Green (P2) tokens visible
- "Your Turn" or turn indicator
- Token count display
- Board fitting in screen

**How to capture**:
1. Create a room with 20x20 board
2. Join from second device (or wait for opponent)
3. Place 5-10 tokens for each player
4. During placement phase, take screenshot
5. Show clear distinction between P1 and P2 tokens

**Key elements visible**:
- Full game board
- Several placed tokens
- Turn indicator (whose turn it is)
- Token counters (e.g., "P1: 15 P2: 18")
- "Leave Game" or "Close Game" button

### 3. Game Board - Simulation (`screenshot-03-simulation.png`)

**What to show**:
- Conway simulation running
- Cells evolving/changing
- Generation counter (e.g., "Generation: 25")
- Mix of alive/dead cells
- Visual activity on board

**How to capture**:
1. Complete placement phase (use all tokens)
2. Wait for simulation to start
3. Around generation 20-40, take screenshot
4. Capture when cells are actively evolving

**Key elements visible**:
- Full board with active simulation
- Generation number
- Cell count indicators
- Cells in various states (alive/dead)
- Conway's rules in action

### 4. Settings Screen (`screenshot-04-settings.png`)

**What to show**:
- Game settings options
- Board size selection (10, 15, 20, 25, 30)
- Token count options
- Conway rules configuration
- Superpower settings

**How to capture**:
1. Navigate to Settings tab
2. Scroll to show all main options
3. Take screenshot

**Key elements visible**:
- Board size buttons
- Tokens per player buttons
- Birth/survival rules
- Superpower percentage slider
- Enabled superpowers chips
- Save/Reset buttons

### Optional 5. Game Results (`screenshot-05-results.png`)

**What to show**:
- Final results modal
- Winner display
- Final cell counts
- Rematch option

**How to capture**:
1. Complete a full game
2. When results modal appears, screenshot
3. Show clear winner indication

### Optional 6. Room Joining (`screenshot-06-join-room.png`)

**What to show**:
- Room code entry screen
- Waiting for opponent screen
- Room information display

## Screenshot Editing

### Resize if Needed

If screenshots are not exactly 1080x1920:

**Using Online Tools**:
1. **ILoveIMG** (https://www.iloveimg.com/resize-image)
   - Upload screenshot
   - Enter 1080 x 1920
   - Select "Ignore aspect ratio" if needed
   - Download resized image

2. **Photopea** (https://www.photopea.com)
   - Open screenshot
   - Image → Canvas Size → 1080 x 1920
   - Download as PNG

**Using Command Line** (if ImageMagick installed):
```bash
convert input.png -resize 1080x1920! output.png
```

### Crop to Portrait

If screenshot is landscape or has extra space:
1. Open in image editor
2. Use crop tool
3. Set aspect ratio to 9:19.2 (1080:1920)
4. Crop to desired area
5. Resize to exact 1080 x 1920 if needed

### Add Captions (Optional)

You can add text overlays to screenshots:
- Use Canva, Figma, or any image editor
- Add brief text explaining the screen
- Keep text minimal and readable
- Use app colors for consistency

**Avoid**:
- ❌ Too much text
- ❌ Covering important UI elements
- ❌ Text that conflicts with the UI

## File Naming Convention

Save screenshots with descriptive names in order:

```
play-store-assets/screenshots/
├── screenshot-01-lobby.png
├── screenshot-02-placement.png
├── screenshot-03-simulation.png
├── screenshot-04-settings.png
├── screenshot-05-results.png (optional)
└── screenshot-06-join-room.png (optional)
```

## Screenshot Quality Checklist

Before uploading to Play Store:

- ✅ All screenshots are 1080 x 1920 pixels (or 1440 x 2560)
- ✅ File size under 8MB each
- ✅ Clear, high-quality images (not blurry)
- ✅ Represent actual app functionality
- ✅ No placeholder text visible
- ✅ UI is fully rendered (no loading states)
- ✅ Screenshots are recent (show current app version)
- ✅ Status bar is visible and clean
- ✅ No personal information visible
- ✅ No inappropriate content

## Tips for Best Screenshots

**Good Practices**:
- Use a real game with meaningful board state
- Show the app in action, not empty screens
- Capture at key moments (exciting gameplay)
- Ensure good lighting/visibility
- Use the production server for multiplayer shots

**Avoid**:
- Empty boards or screens
- Placeholder data
- Debug overlays or development tools
- Error messages or crashes
- Outdated UI (keep screenshots current)

## Common Screenshot Sizes

Different devices have different resolutions. If your device doesn't match 1080x1920:

| Device | Native Resolution | Scale to |
|--------|-------------------|----------|
| Pixel 5 | 1080 x 2340 | Crop to 1080 x 1920 |
| Pixel 7 | 1080 x 2400 | Crop to 1080 x 1920 |
| Galaxy S21 | 1080 x 2400 | Crop to 1080 x 1920 |
| Chromebook (tablet mode) | Varies | Resize to 1080 x 1920 |

Most modern Android phones are close to 1080 width, so you just need to crop the height.

## Upload Order

When uploading to Play Store, screenshots display in the order you upload them:

1. **First screenshot** = most important (shows in search results)
2. **Second-fourth** = core features
3. **Fifth+** = additional features, settings

**Recommended order**:
1. Game board (placement) - shows core gameplay
2. Lobby screen - shows how to start
3. Simulation - shows Conway's rules in action
4. Settings - shows customization

## Testing

Before finalizing:

1. View screenshots on phone to verify quality
2. Check that they tell a story about your app
3. Ensure each screenshot shows something unique
4. Verify no sensitive information is visible

## Final Steps

Once all screenshots are captured and edited:

1. ✅ Verify all are 1080 x 1920 (or 1440 x 2560)
2. ✅ Rename with descriptive names (screenshot-01, etc.)
3. ✅ Place in `play-store-assets/screenshots/` directory
4. ✅ Review each one for quality
5. ✅ Ready for Play Store upload!

---

**Need Help?**
- Contact: dev.solvx@gmail.com
- Google Play screenshot guidelines: https://support.google.com/googleplay/android-developer/answer/9866151
