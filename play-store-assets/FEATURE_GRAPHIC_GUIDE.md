# Feature Graphic Guide for Google Play Store

## Required Specifications

- **Dimensions**: 1024 x 500 pixels (exactly)
- **Format**: PNG or JPEG
- **Max File Size**: 1MB
- **Filename**: `feature-graphic.png`
- **Location**: Place in `play-store-assets/` directory

## Design Recommendations

### Content

The feature graphic is the banner image that appears at the top of your Play Store listing. It should be eye-catching and clearly communicate what your app does.

**Suggested Elements**:
1. **App Name**: "Game of Strife" (large, clear text)
2. **Tagline**: "Conway's Multiplayer Battle" or "Strategic Cellular Combat"
3. **Background**: Conway's Game of Life cells pattern
4. **Color Scheme**:
   - Blue: #3B82F6 (Player 1 color)
   - Green: #10B981 (Player 2 color)
   - Dark Gray: #1F2937 (background)
5. **Visual Elements**:
   - Grid pattern suggesting game board
   - Living cells (colored squares)
   - Sense of competition/strategy

### Design Tools

**Online Tools (Free)**:
- **Canva** (https://www.canva.com)
  - Search "Google Play Feature Graphic"
  - Create custom size: 1024 x 500 px
  - Use templates and customize

- **Figma** (https://www.figma.com)
  - Professional design tool
  - Free for personal use
  - Create frame: 1024 x 500 px

- **Photopea** (https://www.photopea.com)
  - Free online Photoshop alternative
  - Create new project: 1024 x 500 px

**Desktop Tools**:
- **GIMP** (free)
- **Adobe Photoshop** (paid)
- **Affinity Designer** (paid)

### Template Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│    ███  Game of Strife  ███                            │
│    Conway's Multiplayer Battle                          │
│                                                         │
│    [Conway cells pattern background]                    │
│    ■ ■ □ ■ □  (Blue & Green squares)                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Color Palette

**Primary Colors** (from app):
- Player 1 Blue: `#3B82F6`
- Player 2 Green: `#10B981`
- Background Dark: `#1F2937`
- Border Gray: `#6B7280`
- Text White: `#F3F4F6`

**Conway Cell States**:
- Alive: Use Player 1/Player 2 colors
- Dead: Use dark background
- Border: Subtle gray (#4B5563)

### Text Guidelines

**Font Suggestions**:
- **Modern/Tech**: Roboto, Inter, SF Pro
- **Bold/Attention**: Montserrat Bold, Bebas Neue
- **Readable**: Open Sans, Lato

**Sizes**:
- Main title: 60-80px
- Tagline: 24-36px

**Contrast**: Ensure text is readable against background
- White text on dark background ✓
- Dark text on light cells ✓

### Inspiration

Think of feature graphics from similar apps:
- Strategy games showing game boards
- Puzzle games with clean, simple designs
- Minimal text, strong visual identity

### Quick Canva Steps

1. Go to Canva.com
2. Create a Design → Custom size → 1024 x 500 px
3. Add background:
   - Rectangle fill with #1F2937 (dark gray)
4. Add grid pattern:
   - Create small squares (20x20px)
   - Color some blue (#3B82F6), some green (#10B981)
   - Arrange in grid pattern
   - Add 1px borders (#4B5563)
5. Add text:
   - "Game of Strife" (large, white, bold)
   - "Conway's Multiplayer Battle" (smaller, white)
6. Download as PNG

### Checklist

Before saving:
- ✅ Dimensions exactly 1024 x 500 px
- ✅ File size under 1MB
- ✅ No important content in bottom 15% (may be obscured on some devices)
- ✅ Text is readable at small sizes
- ✅ Design looks good in both light and dark themes
- ✅ Colors match app branding
- ✅ No copyrighted images or content
- ✅ File named `feature-graphic.png`

### Examples of Good Feature Graphics

**Good Practices**:
- Clear, large title
- Simple, bold design
- App colors prominent
- Not too much text
- Recognizable icon/symbol

**Avoid**:
- ❌ Cluttered design with too many elements
- ❌ Small, unreadable text
- ❌ Low contrast text/background
- ❌ Screenshots in the banner (use actual screenshots section instead)
- ❌ Misleading imagery

### Testing

View your design at different sizes:
- **Large**: Full size on desktop Play Store
- **Medium**: Mobile Play Store listing
- **Small**: Search results, browse categories

The text should remain readable at all sizes.

### Final Step

Once complete:
1. Save as `feature-graphic.png`
2. Place in `play-store-assets/` directory
3. Verify dimensions with image properties
4. Ready for Play Store upload!

---

**Need Help?**
- Contact: dev.solvx@gmail.com
- See Play Store guidelines: https://support.google.com/googleplay/android-developer/answer/9866151
