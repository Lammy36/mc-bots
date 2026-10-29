// Mineflayer bot launcher for an offline-mode Paper Minecraft server.
// Update the config below to match your server before starting the bots.

const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals: { GoalNear } } = require('mineflayer-pathfinder');

const HOST = 'anhemdanlang.play.hosting';
const PORT = 25565;
const VERSION = undefined; // or set a version string such as '1.20.4'
const NAMES = ['tuanbel', 'dat', 'XxiamliamxX'];
const AUTH = 'offline';
const STAGGER_MS = 6000; // stagger logins to avoid connection throttling
const RECONNECT_MS = 15000; // reconnect after disconnect
const RETRY_MS = 30000; // retry no-rod / no-water cases

// Optional per-bot fishing spots. Leave empty or set values like: { Bot_Alpha: [10, 64, 10] }
const FISH_SPOTS = {
  // Bot_Alpha: [10, 64, 10],
};

const FOOD_ITEMS = [
  'bread',
  'cooked_beef',
  'cooked_chicken',
  'cooked_porkchop',
  'apple',
  'carrot',
  'beetroot',
  'melon_slice',
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

process.on('unhandledRejection', (err) => {
  console.log('[unhandledRejection]', err && err.stack ? err.stack : err);
});

process.on('uncaughtException', (err) => {
  console.log('[uncaughtException]', err && err.stack ? err.stack : err);
});

function getFoodItem(bot) {
  return bot.inventory.items().find((item) => FOOD_ITEMS.includes(item.name));
}

async function eatFoodIfNeeded(bot) {
  if (bot.food >= 14) return;

  const foodItem = getFoodItem(bot);
  if (!foodItem) {
    console.log(`[${bot.username}] Low hunger but no food in inventory.`);
    return;
  }

  try {
    await bot.equip(foodItem, 'hand');
    await bot.consume();
    console.log(`[${bot.username}] Ate ${foodItem.name} to recover hunger.`);
  } catch (err) {
    console.log(`[${bot.username}] Food use failed: ${err && err.message ? err.message : err}`);
  }
}

function getFishingRod(bot) {
  return bot.inventory.items().find((item) => item && item.name === 'fishing_rod') || null;
}

async function equipFishingRod(bot) {
  const rod = getFishingRod(bot);
  if (!rod) {
    return false;
  }

  const alreadyEquipped = bot.heldItem && bot.heldItem.type === rod.type && bot.heldItem.metadata === rod.metadata;
  if (!alreadyEquipped) {
    try {
      await bot.equip(rod, 'hand');
    } catch (err) {
      console.log(`[${bot.username}] Could not equip rod: ${err && err.message ? err.message : err}`);
      return false;
    }
  }

  return true;
}

function findNearestWater(bot) {
  const waterIds = new Set([
    bot.registry.blocksByName.water?.id ?? 8,
    bot.registry.blocksByName.flowing_water?.id ?? 9,
  ]);

  const waterBlocks = bot.findBlocks({
    point: bot.entity.position,
    matching: (block) => block && waterIds.has(block.type),
    maxDistance: 6,
    count: 1,
  });

  return waterBlocks && waterBlocks.length ? waterBlocks[0] : null;
}

async function walkToFishSpot(bot, name) {
  const fishSpot = FISH_SPOTS[name];
  if (!fishSpot) return;

  const [x, y, z] = fishSpot;
  bot.pathfinder.setMovements(new Movements(bot));
  bot.pathfinder.setGoal(new GoalNear(x, y, z, 1));

  const start = Date.now();
  while (Date.now() - start < 30000) {
    const dx = bot.entity.position.x - x;
    const dy = bot.entity.position.y - y;
    const dz = bot.entity.position.z - z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance <= 2) {
      return;
    }

    await wait(250);
  }

  console.log(`[${name}] Could not reach fish spot; trying nearby water instead.`);
}

async function lookAtWater(bot, waterPos) {
  const target = waterPos.offset(0.5, 0.5, 0.5);
  bot.lookAt(target);
  await wait(250);
}

async function fishForever(bot, name) {
  while (bot.alive) {
    try {
      await eatFoodIfNeeded(bot);

      if (!bot.heldItem || bot.heldItem.name !== 'fishing_rod') {
        const hasRod = await equipFishingRod(bot);
        if (!hasRod) {
          console.log(`[${name}] No fishing rod available; retrying in ${RETRY_MS / 1000}s.`);
          await wait(RETRY_MS);
          continue;
        }
      }

      await walkToFishSpot(bot, name);

      const water = findNearestWater(bot);
      if (!water) {
        console.log(`[${name}] No water within 6 blocks; retrying in ${RETRY_MS / 1000}s.`);
        await wait(RETRY_MS);
        continue;
      }

      await lookAtWater(bot, water);

      try {
        await bot.fish();
      } catch (err) {
        console.log(`[${name}] bot.fish() error: ${err && err.message ? err.message : err}`);
        await wait(1000);
        continue;
      }

      if (!bot.heldItem || bot.heldItem.name !== 'fishing_rod') {
        const replacement = getFishingRod(bot);
        if (replacement) {
          console.log(`[${name}] Rod broke; re-equipping another rod.`);
          await equipFishingRod(bot);
        } else {
          console.log(`[${name}] Rod broke and no replacement found; waiting ${RETRY_MS / 1000}s.`);
          await wait(RETRY_MS);
        }
      }

      await wait(1000);
    } catch (err) {
      console.log(`[${name}] Fishing loop failed: ${err && err.message ? err.message : err}`);
      await wait(1000);
    }
  }
}

function makeBot(name) {
  const bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username: name,
    auth: AUTH,
    version: VERSION,
  });

  bot.alive = true;
  bot.fishStarted = false;
  bot.loadPlugin(pathfinder);

  bot.on('login', () => {
    console.log(`[${name}] Logged in to ${HOST}:${PORT}`);
  });

  bot.on('spawn', () => {
    console.log(`[${name}] Spawned successfully`);
    if (!bot.fishStarted) {
      bot.fishStarted = true;
      fishForever(bot, name);
    }
  });

  bot.on('kicked', (reason, loggedIn) => {
    console.log(`[${name}] Kicked: ${reason || 'unknown reason'} (loggedIn=${loggedIn})`);
  });

  bot.on('error', (err) => {
    console.log(`[${name}] Error: ${err && err.message ? err.message : err}`);
  });

  bot.on('death', () => {
    console.log(`[${name}] Died; re-equipping rod and continuing fishing on respawn.`);
  });

  bot.on('end', (reason) => {
    console.log(`[${name}] Disconnected: ${reason || 'unknown reason'}`);
    bot.alive = false;
    bot.fishStarted = false;
    setTimeout(() => {
      console.log(`[${name}] Reconnecting in ${RECONNECT_MS / 1000} seconds...`);
      makeBot(name);
    }, RECONNECT_MS);
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
