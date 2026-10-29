// Mineflayer bot launcher for an offline-mode Paper Minecraft server.
// Update the config below to match your server before starting the bots.

const mineflayer = require('mineflayer');

const HOST = '[server address]';
const PORT = 25565;
const VERSION = undefined; // or set a version string such as '1.20.4'
const NAMES = ['Bot_Alpha', 'Bot_Beta', 'Bot_Gamma'];
const AUTH = 'offline';
const STAGGER_MS = 6000; // stagger logins to avoid connection throttling
const RECONNECT_MS = 15000; // reconnect after disconnect

function makeBot(name) {
  const bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username: name,
    auth: AUTH,
    version: VERSION,
  });

  bot.on('login', () => {
    console.log(`[${name}] Logged in to ${HOST}:${PORT}`);
  });

  bot.on('spawn', () => {
    console.log(`[${name}] Spawned successfully`);
  });

  bot.on('kicked', (reason, loggedIn) => {
    console.log(`[${name}] Kicked: ${reason || 'unknown reason'} (loggedIn=${loggedIn})`);
  });

  bot.on('error', (err) => {
    console.log(`[${name}] Error: ${err && err.message ? err.message : err}`);
  });

  bot.on('end', (reason) => {
    console.log(`[${name}] Disconnected: ${reason || 'unknown reason'}`);
    setTimeout(() => {
      console.log(`[${name}] Reconnecting in ${RECONNECT_MS / 1000} seconds...`);
      makeBot(name);
    }, RECONNECT_MS);
  });

  bot.on('chat', (username, message) => {
    const target = name.toLowerCase();
    if (message && message.toLowerCase() === `${target} hi`) {
      bot.chat(`Hello ${username}!`);
      console.log(`[${name}] Replied to ${username}: Hello ${username}!`);
    }
  });

  return bot;
}

NAMES.forEach((name, index) => {
  setTimeout(() => {
    console.log(`[${name}] Connecting...`);
    makeBot(name);
  }, index * STAGGER_MS);
});

console.log('Starting Mineflayer bots...');
console.log(`Server: ${HOST}:${PORT}`);
console.log(`Bots: ${NAMES.join(', ')}`);
