# Google Play Store Assets

This directory contains assets and guides for Google Play Store submission.

## Required Assets

### 1. Feature Graphic (REQUIRED)
- **File**: `feature-graphic.png`
- **Size**: 1024 x 500 pixels
- **Guide**: See [FEATURE_GRAPHIC_GUIDE.md](./FEATURE_GRAPHIC_GUIDE.md)
- **Status**: ⏳ To be created

### 2. Screenshots (REQUIRED)
- **Location**: `screenshots/` directory
- **Minimum**: 2 screenshots
- **Recommended**: 4-8 screenshots
- **Size**: 1080 x 1920 pixels (portrait)
- **Guide**: See [SCREENSHOT_GUIDE.md](./SCREENSHOT_GUIDE.md)
- **Status**: ⏳ To be captured

## Directory Structure

```
play-store-assets/
├── README.md (this file)
├── FEATURE_GRAPHIC_GUIDE.md (how to create banner)
├── SCREENSHOT_GUIDE.md (how to capture screenshots)
├── feature-graphic.png (to be created)
└── screenshots/
    ├── screenshot-01-lobby.png (to be captured)
    ├── screenshot-02-placement.png (to be captured)
    ├── screenshot-03-simulation.png (to be captured)
    ├── screenshot-04-settings.png (to be captured)
    └── [optional additional screenshots]
```

## Quick Start

### Step 1: Create Feature Graphic

1. Read [FEATURE_GRAPHIC_GUIDE.md](./FEATURE_GRAPHIC_GUIDE.md)
2. Use Canva, Figma, or similar tool
3. Create 1024 x 500 px banner image
4. Save as `feature-graphic.png` in this directory

**Estimated time**: 30-60 minutes

### Step 2: Capture Screenshots

1. Read [SCREENSHOT_GUIDE.md](./SCREENSHOT_GUIDE.md)
2. Run app on Android device or emulator
3. Navigate to each screen and capture:
   - Lobby screen
   - Game board (placement phase)
   - Game board (simulation running)
   - Settings screen
4. Save in `screenshots/` directory

**Estimated time**: 20-30 minutes

## Asset Specifications

| Asset Type | Dimensions | Format | Max Size | Quantity |
|------------|-----------|--------|----------|----------|
| Feature Graphic | 1024 x 500 | PNG/JPEG | 1MB | 1 (required) |
| Screenshots | 1080 x 1920 | PNG/JPEG | 8MB each | 2-8 (min 2) |
| App Icon | 1024 x 1024 | PNG | 1MB | 1 (already in `assets/`) |

## Existing Assets (Already Complete)

✅ **App Icon**: `../assets/icon.png` (1024x1024)
✅ **Adaptive Icon**: `../assets/adaptive-icon.png` (1024x1024)
✅ **Splash Screen**: `../assets/splash-icon.png` (1024x1024)

## Design Guidelines

### Color Palette

Use these colors from the app for consistency:

- **Player 1 (Blue)**: `#3B82F6`
- **Player 2 (Green)**: `#10B981`
- **Background Dark**: `#1F2937`
- **Border Gray**: `#6B7280`
- **Text White**: `#F3F4F6`

### Branding

- **App Name**: "Game of Strife"
- **Tagline**: "Conway's Multiplayer Battle" or "Strategic Cellular Combat"
- **Theme**: Dark mode, Conway's Game of Life, Strategy game

## Checklist

Before uploading to Google Play Console:

### Feature Graphic
- [ ] Created at 1024 x 500 pixels
- [ ] Uses app colors and branding
- [ ] File size under 1MB
- [ ] Saved as `feature-graphic.png`
- [ ] Text is readable
- [ ] Design looks professional

### Screenshots
- [ ] Minimum 2 screenshots captured
- [ ] All screenshots are 1080 x 1920 pixels
- [ ] Saved in `screenshots/` directory
- [ ] Named descriptively (screenshot-01, screenshot-02, etc.)
- [ ] Show actual app functionality
- [ ] High quality, not blurry
- [ ] No personal information visible

## Tools & Resources

**Design Tools**:
- Canva (free): https://www.canva.com
- Figma (free): https://www.figma.com
- Photopea (free): https://www.photopea.com

**Image Editing**:
- ILoveIMG (resize): https://www.iloveimg.com
- TinyPNG (compress): https://tinypng.com

**Google Resources**:
- Play Store guidelines: https://support.google.com/googleplay/android-developer/answer/9866151
- Asset requirements: https://support.google.com/googleplay/android-developer/answer/9866151

## Timeline Estimate

| Task | Time Required |
|------|---------------|
| Create feature graphic | 30-60 min |
| Capture screenshots | 20-30 min |
| Edit/resize if needed | 10-20 min |
| **Total** | **1-2 hours** |

## Upload to Play Store

Once assets are ready:

1. Go to Google Play Console: https://play.google.com/console
2. Navigate to your app → Store presence → Main store listing
3. Upload feature graphic
4. Upload screenshots (minimum 2)
5. Save changes

See main deployment plan for full submission steps.

## Need Help?

- **Developer**: Richard Watson
- **Email**: dev.solvx@gmail.com
- **GitHub**: https://github.com/tradewithmeai/gameofstrife-mobile

---

**Status**: 🚧 Assets to be created before Play Store submission
