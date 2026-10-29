# mc-bots

A simple Node.js project for running multiple Mineflayer bots on an offline-mode Paper Minecraft server.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Edit the values at the top of `bots.js`:
   - `HOST`
   - `PORT`
   - `VERSION` (or leave as `undefined` to auto-detect)
   - `NAMES`
3. Start the bots:
   ```bash
   npm start
   ```

## Behavior

- All bots use offline authentication.
- Bot logins are staggered by 6 seconds to avoid connection throttling.
- Each bot reconnects 15 seconds after a disconnect.
- If a player says `<botname> hi`, the bot replies with `Hello <player>!`.

This repository does not include tokens or secrets.
