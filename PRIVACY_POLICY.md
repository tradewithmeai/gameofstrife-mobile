# Privacy Policy for Game of Strife

**Effective Date:** December 30, 2025
**Last Updated:** December 30, 2025

## 1. Overview

Game of Strife ("the App") is a 2-player multiplayer strategy game based on Conway's Game of Life. This privacy policy explains our practices regarding data collection and usage.

## 2. Information We Collect

**We DO NOT collect, store, or transmit any personal information.**

The App operates with minimal data requirements:
- **No account creation** - Play immediately without registration
- **No email addresses** collected
- **No phone numbers** collected
- **No location data** collected
- **No device identifiers** tracked
- **No advertising IDs** used

## 3. Game Data

### Local Storage Only
All game settings are stored locally on your device using AsyncStorage:
- Board size preferences
- Token count preferences
- Conway's Game of Life rules (birth/survival settings)
- Superpower configuration

This data:
- Never leaves your device
- Is deleted when you uninstall the app
- Cannot be accessed by us or third parties

### Temporary Multiplayer Sessions
When playing multiplayer matches:
- A temporary room code is generated (4-6 random characters)
- Game state is synchronized between connected players
- All session data is deleted when the match ends
- No chat or messaging features exist

### Server Communication
The App connects to our game server (`gameofstrife-production.up.railway.app`) solely for:
- Real-time multiplayer gameplay coordination
- Temporary room/match state management

Server logs may contain:
- Anonymous socket connection IDs (random strings, not linked to identity)
- Room creation/join events
- Game moves (board positions)

These logs:
- Are used only for debugging and server maintenance
- Do not contain personal information
- Are automatically deleted after 30 days

## 4. Third-Party Services

We do NOT use:
- ❌ Analytics services (Google Analytics, Firebase, etc.)
- ❌ Advertising networks
- ❌ Social media integrations
- ❌ Crash reporting services (beyond basic app store metrics)
- ❌ Payment processing (app is 100% free)

The only external service is:
- ✅ Railway (https://railway.app) - Game server hosting

Railway's privacy policy: https://railway.app/legal/privacy

## 5. Children's Privacy

The App is suitable for all ages and does not knowingly collect information from children. Since we collect no personal information from any user, COPPA compliance is inherent.

## 6. Data Security

Since no personal data is collected or transmitted:
- There is no user database to breach
- No passwords to compromise
- No personal information to protect

Game session data is transmitted over encrypted WebSocket connections (WSS) when available.

## 7. Data Retention

- **Local Settings:** Retained until app is uninstalled
- **Server Logs:** Deleted after 30 days
- **Match Data:** Deleted immediately when match ends

## 8. Your Rights

You have the right to:
- **Delete your data:** Uninstall the app (no server-side data exists)
- **Opt out of data collection:** Not applicable (we don't collect data)
- **Request data access:** Not applicable (no data stored about you)

## 9. Changes to This Policy

We may update this privacy policy from time to time. Changes will be posted:
- In-app update notices (if material changes)
- Updated version on our repository: https://github.com/tradewithmeai/gameofstrife-mobile

## 10. International Users

The App is available worldwide. Our server is hosted by Railway, which operates globally. No personal information crosses borders because none is collected.

## 11. Contact Information

For questions about this privacy policy or the App:

**Developer:** Richard Watson
**Email:** dev.solvx@gmail.com
**GitHub:** https://github.com/tradewithmeai/gameofstrife-mobile

## 12. Legal Basis (GDPR)

For users in the European Economic Area:
- We process no personal data
- No legal basis is required for data we don't collect
- No data protection impact assessment needed

## 13. Summary

**What we collect:** Nothing
**What we share:** Nothing
**What we sell:** Nothing

Game of Strife is privacy-first by design. Enjoy strategic gameplay without privacy concerns!

---

**Quick Facts:**
- ✅ No ads
- ✅ No tracking
- ✅ No accounts
- ✅ No data collection
- ✅ Open source (code available for review)
- ✅ Works offline (except multiplayer mode)

**Questions?** Contact us at dev.solvx@gmail.com
