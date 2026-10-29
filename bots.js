# Simple Mineflayer bot launcher for an offline-mode Paper Minecraft server.
# Edit the config at the top to match your server before running.

const mineflayer = require('mineflayer');

// Configuration
const HOST = '[server address]';
const PORT = [port];
const VERSION = [Minecraft version or undefined];
const NAMES = ['Bot_Alpha', 'Bot_Beta', 'Bot_Gamma'];
const AUTH = 'offline';
const STAGGER_MS = 6000; // delay between bot logins to avoid throttling
const RECONNECT_MS = 15000; // wait before reconnect after disconnect

// Create a bot instance.
function makeBot(name) {
  const bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username: name,
    auth: AUTH,
    version: VERSION,
    // offline mode does not need password or session handling
  });

  bot.on('login', () => {
    console.log(`[${name}] Logged in to ${HOST}:${PORT}`);
  });

  bot.on('spawn', () => {
    console.log(`[${name}] Spawned successfully`);
  });

  bot.on('kicked', (reason, loggedIn) => {
    console.log(`[${name}] Kicked:`, reason, 'loggedIn=', loggedIn);
  });

  bot.on('error', (err) => {
    console.log(`[${name}] Error:`, err.message || err);
  });

  bot.on('end', (reason) => {
    console.log(`[${name}] Disconnected: ${reason || 'unknown reason'}`);
    setTimeout(() => {
      console.log(`[${name}] Attempting reconnect...`);
      makeBot(name);
    }, RECONNECT_MS);
  });

  bot.on('chat', (username, message) => {
    // Bot replies when a player says "<botname> hi"
    const target = name;
    if (message && message.toLowerCase() === `${target.toLowerCase()} hi`) {
      bot.chat(`Hello ${username}!`);
      console.log(`[${name}] Replied to ${username}`);
    }
  });

  return bot;
}

// Start bots with a staggered login schedule.
NAMES.forEach((name, index) => {
  setTimeout(() => {
    makeBot(name);
  }, index * STAGGER_MS);
});

console.log('Starting Mineflayer bots...');
console.log('Server:', HOST, PORT);
console.log('Bots:', NAMES.join(', '));
