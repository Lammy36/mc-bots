# mc-bots

A simple Node.js project that launches multiple Mineflayer bots against an offline-mode Paper Minecraft server.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Edit the config at the top of `bots.js`:
   - `HOST`
   - `PORT`
   - `VERSION` (or leave as `undefined` for auto-detect)
   - `NAMES`
3. Start the bots:
   ```bash
   npm start
   ```

## Notes

- The bots use offline mode (`auth: 'offline'`).
- Logins are staggered by 6 seconds to help avoid connection throttling.
- Each bot reconnects 15 seconds after disconnect.
- Bots respond with `Hello <player>!` when someone says `<botname> hi`.

This repository intentionally keeps secrets out of source control.
