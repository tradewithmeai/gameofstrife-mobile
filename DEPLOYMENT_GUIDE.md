# Game of Strife - Mobile Deployment Guide

## Phase 5: Testing & Deployment Checklist

### ✅ Pre-Deployment Checklist

**Development Environment:**
- [x] Expo project created and configured
- [x] All dependencies installed
- [x] Backend server running locally (port 3030)
- [x] Expo dev server running (port 8082)

**Code Complete:**
- [x] GameBoard component (touch-enabled)
- [x] GameHUD component
- [x] GameOfStrife container
- [x] Lobby screen (create/join rooms)
- [x] Settings screen
- [x] Socket.IO integration
- [x] AsyncStorage persistence

---

## Step 1: Local Testing with Expo Go

### A. Start Both Servers

**Terminal 1 - Backend:**
```bash
cd D:\Documents\11Projects\gameofstrife-mobile\server
npm run dev
```
Server should be running on `http://localhost:3030`

**Terminal 2 - Expo:**
```bash
cd D:\Documents\11Projects\gameofstrife-mobile
npx expo start --port 8082
```
Expo dev server on `http://localhost:8082`

### B. Test on Physical Device

1. **Install Expo Go** on your Android device from Google Play Store
2. **Scan QR Code** displayed in Terminal 2
3. **Test Core Features:**
   - ✅ Socket connection (should show "CONNECTED" status)
   - ✅ Create private room (generates 4-6 character code)
   - ✅ Join room from second device using code
   - ✅ Place 20 tokens each
   - ✅ Conway simulation runs automatically
   - ✅ Winner declared correctly
   - ✅ Rematch works
   - ✅ Settings persist after app restart

### C. Known Limitations with Expo Go

Expo Go has limitations:
- Can't test production Socket.IO connections (only localhost)
- Can't test background/foreground app state transitions fully
- Performance may differ from production build

**Solution:** We'll create a development build in Step 4.

---

## Step 2: Deploy Backend to Railway

### A. Prepare Backend for Deployment

1. **Create `.gitignore` in `server/` directory:**
```
node_modules/
dist/
.env
*.log
```

2. **Update `package.json` scripts:**
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

3. **Create `Procfile` in `server/` directory:**
```
web: npm start
```

### B. Deploy to Railway

1. **Sign up for Railway:** https://railway.app/
2. **Create New Project** → "Deploy from GitHub repo"
3. **Select Repository:** `gameofstrife-mobile`
4. **Set Root Directory:** `/server`
5. **Configure Environment Variables:**
   - `NODE_ENV`: `production`
   - `PORT`: `3030` (Railway provides this automatically)
   - `HOST`: `0.0.0.0`
   - `ENGINE_KIND`: `gameofstrife`
   - `MATCH_MODE`: `turn`

6. **Deploy:** Railway auto-deploys on push
7. **Get Production URL:** e.g., `https://gameofstrife-production.up.railway.app`

### C. Alternative: Deploy to Render

1. **Sign up:** https://render.com/
2. **New Web Service** → Connect GitHub
3. **Configure:**
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Add same variables as Railway

4. **Deploy** → Get production URL

---

## Step 3: Update Mobile App for Production

### A. Update `app.json` with Production URL

Replace `localhost` URL with your deployed backend:

```json
{
  "expo": {
    "extra": {
      "wsUrl": "https://gameofstrife-production.up.railway.app"
    }
  }
}
```

### B. Test Production Connection with Expo Go

1. Restart Expo dev server
2. Reload app on device
3. Verify "CONNECTED" status with production server
4. Test full multiplayer flow

---

## Step 4: Setup EAS Build

### A. Install EAS CLI

```bash
npm install -g eas-cli
```

### B. Login to Expo Account

```bash
eas login
```

(Create account at https://expo.dev if you don't have one)

### C. Configure Project

```bash
cd D:\Documents\11Projects\gameofstrife-mobile
eas build:configure
```

This creates `eas.json` (already created for you).

### D. Create Development Build (Optional but Recommended)

Development builds allow testing production features while keeping dev tools:

```bash
eas build --profile development --platform android
```

**Note:** This build takes 15-30 minutes on EAS servers.

After build completes:
1. Download APK from EAS dashboard
2. Install on device
3. Launch via Expo dev server
4. Test production Socket.IO connection

---

## Step 5: Create Production Build for Google Play

### A. Generate Android Keystore

EAS handles this automatically for you. On first production build:

```bash
eas build --platform android --profile production
```

EAS will:
1. Generate a new keystore
2. Store it securely in EAS servers
3. Sign your APK/AAB automatically

### B. Build APK for Testing (Optional)

```bash
eas build --profile preview --platform android
```

This creates an APK you can install directly for testing.

### C. Build AAB for Google Play Store

```bash
eas build --platform android --profile production
```

This creates an Android App Bundle (`.aab`) required by Google Play.

**Build time:** 20-40 minutes

**Output:** Download `.aab` file from EAS dashboard

---

## Step 6: Create Privacy Policy

Google Play requires a privacy policy. Create `PRIVACY_POLICY.md`:

```markdown
# Privacy Policy for Game of Strife

**Last Updated:** [Current Date]

## Overview
Game of Strife is a multiplayer Conway's Game of Life battle game. This app does not collect, store, or share any personal information.

## Data Collection
We do NOT collect:
- Personal information (name, email, phone)
- Location data
- Device identifiers
- Analytics or tracking data

## Network Communication
The app connects to our game server solely for:
- Real-time multiplayer gameplay
- Temporary session data (room codes, player states)

All game data is:
- Stored only in device memory (AsyncStorage)
- Deleted when the app is uninstalled
- Not transmitted to third parties

## Third-Party Services
We do not use:
- Analytics services
- Advertising networks
- Social media integrations

## Contact
For questions about this policy, email: [your-email@example.com]
```

**Important:** Host this on GitHub Pages or your website, get a public URL.

---

## Step 7: Prepare Play Store Assets

### A. Required Assets

**App Icon (1024x1024 PNG):**
- Create icon representing Game of Strife
- Tool: https://www.canva.com/ or https://icon.kitchen/

**Feature Graphic (1024x500 PNG):**
- Banner image for Play Store listing

**Screenshots (at least 2):**
- Game board with tokens placed
- Lobby screen showing room code
- Settings screen
- Simulation in progress

### B. Play Store Listing Text

**Short Description (80 chars max):**
```
2-player Conway's Game of Life battle - strategic multiplayer!
```

**Full Description:**
```
Game of Strife is a competitive twist on Conway's Game of Life! Battle your friends in this strategic multiplayer game.

FEATURES:
• 2-Player Multiplayer via room codes
• Conway's Game of Life simulation engine
• 7 unique superpower types (Tank, Ghost, Destroyer, etc.)
• Customizable board sizes and rules
• No ads, no tracking, pure gameplay

HOW TO PLAY:
1. Create a private room or join with a friend's code
2. Place 20 tokens strategically on the board
3. Watch Conway's simulation determine the winner!
4. Rematch and refine your strategy

Perfect for:
- Fans of Conway's Game of Life
- Strategy game enthusiasts
- Anyone who loves multiplayer challenges

PRIVACY:
No data collection, no ads, completely offline-capable.
```

---

## Step 8: Submit to Google Play Console

### A. Create Developer Account

1. **Sign up:** https://play.google.com/console
2. **Pay $25 one-time fee**
3. **Complete registration**

### B. Create New App

1. **Create app** → Fill in basic info
2. **App Category:** Games > Strategy
3. **Privacy Policy URL:** Link to your hosted privacy policy

### C. Complete IARC Content Rating

1. Navigate to **Content Rating**
2. Complete questionnaire:
   - Is this app a game? **Yes**
   - Does it contain violence? **No**
   - Does it contain user-generated content? **No**
   - Does it allow user communication? **Yes (multiplayer gameplay only)**

### D. Upload App Bundle

1. Navigate to **Production** → **Create Release**
2. **Upload AAB** from EAS build
3. **Release Name:** "1.0.0 - Initial Release"
4. **Release Notes:**
   ```
   Initial release of Game of Strife!

   Features:
   - 2-player multiplayer Conway's Game of Life
   - Private room codes for matchmaking
   - 7 superpower types
   - Customizable rules and board sizes
   ```

### E. Complete Store Listing

Upload all prepared assets:
- App icon
- Feature graphic
- Screenshots (minimum 2)
- Short & full descriptions

### F. Select Countries

- **Availability:** Select target countries (start with your country)
- **Pricing:** Free

### G. Review and Publish

1. **Review summary** → Check for issues
2. **Send for Review** → Submit to Google Play
3. **Review time:** 1-7 days typically

---

## Step 9: Internal Testing Track (Recommended First Step)

Before full production release:

1. **Create Internal Testing Release**
2. **Add test users** (up to 100 email addresses)
3. **Distribute test link**
4. **Collect feedback**
5. **Fix bugs**
6. **Promote to Production** when ready

---

## Testing Checklist

### Local Testing (Expo Go)
- [ ] App loads without crashes
- [ ] Socket connects to localhost
- [ ] Create room generates valid code
- [ ] Join room works with code
- [ ] Token placement via touch
- [ ] Conway simulation runs
- [ ] Winner determined correctly
- [ ] Rematch works
- [ ] Settings save/load

### Production Testing (Development Build)
- [ ] Socket connects to production server
- [ ] 2-device multiplayer works
- [ ] App survives background/foreground switch
- [ ] Network errors handled gracefully
- [ ] No memory leaks during long sessions

### Pre-Launch Testing
- [ ] Test on multiple Android versions (8.0+)
- [ ] Test on different screen sizes
- [ ] Test with poor network conditions
- [ ] Test rapid reconnection scenarios
- [ ] Verify privacy policy compliance

---

## Troubleshooting Common Issues

### Issue: "Cannot connect to server"
**Solutions:**
1. Check server is deployed and running
2. Verify `wsUrl` in `app.json` is correct
3. Ensure server allows CORS from all origins
4. Check server logs for errors

### Issue: "Build failed on EAS"
**Solutions:**
1. Check EAS dashboard for error logs
2. Verify `eas.json` configuration
3. Ensure all dependencies are in `package.json`
4. Try clearing EAS cache: `eas build --clear-cache`

### Issue: "App crashes on startup"
**Solutions:**
1. Check Metro bundler logs
2. Verify all imports are correct
3. Ensure AsyncStorage is properly configured
4. Test on physical device (emulator can have issues)

---

## Production Monitoring

After launch:

1. **Monitor Server Logs** (Railway/Render dashboard)
2. **Check Play Store Reviews** regularly
3. **Monitor Crash Reports** (Google Play Console)
4. **Track Active Users** (Google Play Console analytics)

---

## Updating the App

When you make changes:

1. **Increment version** in `app.json`:
   ```json
   {
     "version": "1.0.1",
     "android": {
       "versionCode": 2
     }
   }
   ```

2. **Build new AAB:**
   ```bash
   eas build --platform android --profile production
   ```

3. **Upload to Play Store:**
   - Create new release in Google Play Console
   - Upload new AAB
   - Add release notes
   - Rollout to production

---

## Cost Breakdown

- **Expo Account:** Free (with limited builds) or $29/month (unlimited)
- **Railway Backend:** ~$5/month for hobby tier
- **Google Play Developer:** $25 one-time
- **Total First Month:** ~$35
- **Ongoing:** ~$5-35/month depending on Expo plan

---

## Support Resources

- **Expo Documentation:** https://docs.expo.dev/
- **EAS Build Guide:** https://docs.expo.dev/build/introduction/
- **Play Store Help:** https://support.google.com/googleplay/android-developer/
- **Railway Docs:** https://docs.railway.app/
