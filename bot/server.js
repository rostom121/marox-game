const express = require('express');
const tb = require('node-telegram-bot-api');
const TelegramBot = tb.default || tb;
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const token = process.env.BOT_TOKEN;
const port = process.env.PORT || 5000;
const channelUsername = process.env.CHANNEL_USERNAME || '@marox_channel';
const miniAppUrl = process.env.MINI_APP_URL || 'https://t.me/marox_bot/game';

if (!token) {
  console.error("Warning: BOT_TOKEN is not set in environment variables!");
}

const bot = new TelegramBot(token || 'MOCK_TOKEN', { polling: !token ? false : true });
const app = express();

app.use(cors());
app.use(express.json());

// Serve static frontend files from 'out' directory
const path = require('path');
const fs = require('fs');
const outDir = path.join(__dirname, '..', 'out');
if (fs.existsSync(outDir)) {
  app.use(express.static(outDir));
  console.log("Serving Next.js static files from out/ directory");
}

// ── Telegram Bot Start Command Handler ──
if (token) {
  bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = String(msg.from.id);
    const startParam = match[1] || ''; // ref_XXXXX

    console.log(`User ${userId} started bot. Start param: "${startParam}"`);

    let welcomeText = `👋 *Welcome to MAROX Ecosystem!*\n\nSpin the slots, collect MAROX points, level up, and prepare for future airdrops! 🎰💎`;

    let referredBy = null;
    if (startParam.startsWith('ref_')) {
      referredBy = startParam.substring(4);
      welcomeText += `\n\n🎉 You were invited by user ID: ${referredBy}! Claim your starting welcome rewards now inside the app.`;
    }

    // Try creating/fetching user in PostgreSQL via Prisma
    try {
      const existingUser = await prisma.user.findUnique({ where: { telegramId: userId } });

      if (!existingUser && referredBy && referredBy !== userId) {
        // Reward the referrer based on the new user's premium status
        const isPrem = !!msg.from.is_premium;
        const rewardPoints = isPrem ? 1000 : 500;
        const rewardCoins = isPrem ? 200 : 100;
        const rewardEnergy = isPrem ? 1000 : 200;

        try {
          await prisma.user.update({
            where: { telegramId: referredBy },
            data: {
              points: { increment: rewardPoints },
              coins: { increment: rewardCoins },
              energy: { increment: rewardEnergy },
              referralsCount: { increment: 1 },
            }
          });
        } catch (err) {
          console.error("Referrer not found or error updating referrer:", err.message);
        }
      }

      await prisma.user.upsert({
        where: { telegramId: userId },
        update: {
          firstName: msg.from.first_name,
          username: msg.from.username,
        },
        create: {
          telegramId: userId,
          firstName: msg.from.first_name,
          username: msg.from.username,
          referredBy: referredBy,
          premium: !!msg.from.is_premium,
        }
      });
    } catch (e) {
      console.error("Failed to upsert user in Telegram bot handler:", e.message);
    }

    const playUrl = startParam ? `${miniAppUrl}?startapp=${startParam}` : miniAppUrl;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🎮 Play MAROX', web_app: { url: playUrl } }
        ],
        [
          { text: '📢 Join Channel', url: `https://t.me/${channelUsername.replace('@', '')}` }
        ]
      ]
    };

    try {
      await bot.sendMessage(chatId, welcomeText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (e) {
      console.error("Failed to send start message", e);
    }
  });

  // ── SECRET ADMIN COMMAND TO RESET DATABASE ──
  bot.onText(/\/admin_reset_db_marox_confirm/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      await prisma.task.deleteMany({});
      await prisma.user.deleteMany({});
      await bot.sendMessage(chatId, "✅ <b>DATABASE RESET SUCCESSFUL</b>\nAll players, test accounts, and tasks have been completely deleted. The game is now clean and starts from zero.", { parse_mode: 'HTML' });
    } catch (e) {
      await bot.sendMessage(chatId, `❌ <b>ERROR RESETTING DB:</b>\n${e.message}`, { parse_mode: 'HTML' });
    }
  });

  // ── SEND PROMOTIONAL IMAGE COMMAND ──
  const handleSendMarox = async (msg) => {
    const chatId = msg.chat.id;
    try {
      const captionText = "Welcome to the world of MAROX! 🚀 Meet your hero, the master of the slot adventure. Build, play, earn, and conquer the leaderboards. Are you ready to join the journey? Click below to start playing now!";
      const keyboard = {
        inline_keyboard: [
          [
            { text: 'Play Now 🔥', url: 'https://t.me/Maroxcoinbot' }
          ]
        ]
      };

      const imagePath = require('path').join(__dirname, '..', '1000129139.jpg');
      await bot.sendPhoto(chatId, imagePath, {
        caption: captionText,
        reply_markup: keyboard
      });

      // Auto-delete the command message
      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (err) {
        console.error("Failed to delete user command:", err);
      }
    } catch (e) {
      console.error("Error in /sendmarox:", e);
    }
  };

  bot.onText(/\/sendmarox/, handleSendMarox);
  bot.on('channel_post', (msg) => {
    if (msg.text && msg.text.includes('/sendmarox')) {
      handleSendMarox(msg);
    }
  });

  console.log(`Telegram Bot is active and polling...`);
} else {
  console.log("Telegram Bot is running in MOCK mode (no BOT_TOKEN provided).");
}

// ── Express API Endpoints ──

// 1. Get or Create User
app.get('/api/user', async (req, res) => {
  const { telegramId, firstName, username, premium, referredBy } = req.query;

  if (!telegramId) {
    return res.status(400).json({ ok: false, error: 'telegramId parameter is required' });
  }

  const hackerIds = ['5126493471', '6224736496', '6114081533', '8811290958', '1797450754'];
  if (hackerIds.includes(String(telegramId))) {
    return res.json({ ok: false, error: 'BANNED' });
  }

  try {
    let user = await prisma.user.findUnique({
      where: { telegramId: String(telegramId) },
      include: { tasks: true }
    });

    let isNew = false;
    if (!user) {
      isNew = true;
      if (referredBy && String(referredBy) !== String(telegramId)) {
        // Reward the referrer
        const isPrem = premium === 'true';
        const rewardPoints = isPrem ? 1000 : 500;
        const rewardCoins = isPrem ? 200 : 100;
        const rewardEnergy = isPrem ? 1000 : 200;

        try {
          await prisma.user.update({
            where: { telegramId: String(referredBy) },
            data: {
              points: { increment: rewardPoints },
              coins: { increment: rewardCoins },
              energy: { increment: rewardEnergy },
              referralsCount: { increment: 1 },
            }
          });
        } catch (err) {
          console.error("Referrer not found in /api/user:", err.message);
        }
      }

      user = await prisma.user.create({
        data: {
          telegramId: String(telegramId),
          firstName: String(firstName || 'Player'),
          username: username ? String(username) : null,
          premium: premium === 'true',
          referredBy: referredBy ? String(referredBy) : null,
        }
      });
      user.tasks = [];
    } else {
      if (user.energy < 100) {
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - user.updatedAt.getTime()) / 1000);
        if (elapsedSeconds >= 144) {
          const gainedEnergy = Math.floor(elapsedSeconds / 144);
          user.energy = Math.min(100, user.energy + gainedEnergy);

          await prisma.user.update({
            where: { telegramId: String(telegramId) },
            data: { energy: user.energy }
          });
        }
      }
    }

    const completedTasks = user.tasks ? user.tasks.map(t => t.taskId) : [];
    const payloadUser = { ...user, completedTasks };

    return res.json({ ok: true, user: payloadUser, isNew });
  } catch (error) {
    console.error("Database error in GET /api/user:", error.message);
    return res.status(500).json({ ok: false, error: 'Database operation failed' });
  }
});

// 2. Sync User Stats
app.post('/api/user/sync', async (req, res) => {
  try {
    const { telegramId, walletAddress } = req.body;
    if (!telegramId) return res.status(400).json({ ok: false, error: 'Missing telegramId' });

    // ONLY update walletAddress from sync! Everything else is handled by the server (spin/tasks).
    const dataToUpdate = {};
    if (walletAddress) dataToUpdate.walletAddress = String(walletAddress);

    let updatedUser;
    if (Object.keys(dataToUpdate).length > 0) {
      updatedUser = await prisma.user.update({
        where: { telegramId: String(telegramId) },
        data: dataToUpdate
      });
    } else {
      updatedUser = await prisma.user.findUnique({ where: { telegramId: String(telegramId) } });
    }

    return res.json({ ok: true, user: updatedUser });
  } catch (error) {
    console.error("Database error in POST /api/user/sync:", error.message);
    return res.status(500).json({ ok: false, error: 'Failed to sync stats' });
  }
});

// SECURE SPIN ENDPOINT
app.post('/api/spin', async (req, res) => {
  try {
    const { telegramId, bet } = req.body;
    if (!telegramId || !bet) return res.status(400).json({ ok: false, error: 'Missing params' });

    const user = await prisma.user.findUnique({ where: { telegramId: String(telegramId) } });
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });
    if (user.energy < bet) return res.status(400).json({ ok: false, error: 'Not enough energy' });

    // Calculate Outcome
    const scale = bet / 10;
    const r = Math.random() * 100;
    let outcome = 'mixed';
    if (r < 30) outcome = 'coin';
    else if (r < 55) outcome = 'badge';
    else if (r < 75) outcome = 'energy';
    else if (r < 85) outcome = 'red_x';

    let finalGrid;
    if (outcome !== 'mixed') {
      finalGrid = [[outcome], [outcome], [outcome]];
    } else {
      const allSymbols = ['coin', 'badge', 'energy', 'red_x'];
      const shuffled = allSymbols.sort(() => 0.5 - Math.random());
      finalGrid = [[shuffled[0]], [shuffled[1]], [shuffled[2]]];
    }

    let points = 0, coins = 0, energyWin = 0;
    let winnerRows = [];

    const symbolValues = {
      'red_x': { points: 0, coins: -500, energy: 0 },
      'coin': { points: 0, coins: 150, energy: 0 },
      'badge': { points: 400, coins: 0, energy: 0 },
      'energy': { points: 0, coins: 0, energy: 30 }
    };

    if (outcome !== 'mixed') {
      winnerRows.push(0);
      points = symbolValues[outcome].points;
      coins = symbolValues[outcome].coins;
      energyWin = symbolValues[outcome].energy;
    }

    const scaledPoints = Math.floor(points * scale);
    const scaledCoins = Math.floor(coins * scale);
    const scaledEnergyWin = Math.floor(energyWin * scale);

    const updatedUser = await prisma.user.update({
      where: { telegramId: String(telegramId) },
      data: {
        energy: user.energy - bet + scaledEnergyWin,
        points: user.points + scaledPoints,
        coins: user.coins + scaledCoins,
      }
    });

    return res.json({
      ok: true,
      user: updatedUser,
      spin: {
        finalGrid,
        winnerRows,
        payout: { points: scaledPoints, coins: scaledCoins, energyWin: scaledEnergyWin }
      }
    });
  } catch (error) {
    console.error("Database error in /api/spin:", error.message);
    return res.status(500).json({ ok: false, error: 'Spin failed' });
  }
});

// 3. Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const topUsers = await prisma.user.findMany({
      orderBy: { points: 'desc' },
      take: 100,
      select: {
        telegramId: true,
        firstName: true,
        username: true,
        points: true,
        premium: true
      }
    });
    return res.json({ ok: true, leaderboard: topUsers });
  } catch (error) {
    console.error("Database error in GET /api/leaderboard:", error.message);
    return res.status(500).json({ ok: false, error: 'Failed to fetch leaderboard' });
  }
});

// 4. Verify Channel Subscription
app.get('/api/verify', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ ok: false, error: 'Missing userId parameter' });
  }

  if (!token) {
    return res.json({ ok: true, status: 'mock_verified', message: 'Verified (Mock Mode)' });
  }

  try {
    const chatMember = await bot.getChatMember(channelUsername, userId);
    const validStatuses = ['creator', 'administrator', 'member'];
    const isJoined = validStatuses.includes(chatMember.status);

    if (isJoined) {
      return res.json({ ok: true, status: chatMember.status });
    } else {
      return res.json({ ok: false, error: 'User is not a member of the channel', status: chatMember.status });
    }
  } catch (error) {
    console.error(`Error checking subscription for ${userId}:`, error.message);
    return res.status(500).json({ ok: false, error: 'Telegram API verification failed' });
  }
});

// SECURE TASK COMPLETION
app.post('/api/tasks/complete', async (req, res) => {
  try {
    const { telegramId, taskId, rewardPoints, rewardCoins } = req.body;
    if (!telegramId || !taskId) return res.status(400).json({ ok: false, error: 'Missing params' });

    const user = await prisma.user.findUnique({ where: { telegramId: String(telegramId) }, include: { tasks: true } });
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

    const alreadyCompleted = user.tasks.some(t => t.taskId === taskId);
    if (alreadyCompleted) return res.status(400).json({ ok: false, error: 'Task already completed' });

    await prisma.task.create({
      data: { telegramId: String(telegramId), taskId: taskId, status: 'completed', completedAt: new Date() }
    });

    const updatedUser = await prisma.user.update({
      where: { telegramId: String(telegramId) },
      data: {
        points: user.points + Number(rewardPoints || 0),
        coins: user.coins + Number(rewardCoins || 0)
      }
    });

    return res.json({ ok: true, user: updatedUser });
  } catch (error) {
    console.error("Error in /api/tasks/complete:", error.message);
    return res.status(500).json({ ok: false, error: 'Failed to complete task' });
  }
});

// SECURE DAILY REWARD
app.post('/api/daily/claim', async (req, res) => {
  try {
    const { telegramId, points, energy } = req.body;
    if (!telegramId) return res.status(400).json({ ok: false, error: 'Missing params' });

    const updatedUser = await prisma.user.update({
      where: { telegramId: String(telegramId) },
      data: {
        points: { increment: Number(points || 0) },
        energy: { increment: Number(energy || 0) }
      }
    });

    return res.json({ ok: true, user: updatedUser });
  } catch (error) {
    console.error("Error in /api/daily/claim:", error.message);
    return res.status(500).json({ ok: false, error: 'Failed to claim daily reward' });
  }
});

// SECURE SHOP PURCHASE (Virtual currency only for now)
app.post('/api/shop/buy', async (req, res) => {
  try {
    const { telegramId, costCoins, gainEnergy, gainCoins, gainPoints } = req.body;
    if (!telegramId) return res.status(400).json({ ok: false, error: 'Missing params' });

    const user = await prisma.user.findUnique({ where: { telegramId: String(telegramId) } });
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

    if (costCoins && user.coins < costCoins) {
      return res.status(400).json({ ok: false, error: 'Not enough coins' });
    }

    const updatedUser = await prisma.user.update({
      where: { telegramId: String(telegramId) },
      data: {
        coins: user.coins - Number(costCoins || 0) + Number(gainCoins || 0),
        energy: user.energy + Number(gainEnergy || 0),
        points: user.points + Number(gainPoints || 0)
      }
    });

    return res.json({ ok: true, user: updatedUser });
  } catch (error) {
    console.error("Error in /api/shop/buy:", error.message);
    return res.status(500).json({ ok: false, error: 'Shop purchase failed' });
  }
});

// Basic status check
app.get('/status', (req, res) => {
  res.json({ status: 'online', botEnabled: !!token, channel: channelUsername, appUrl: miniAppUrl });
});

// TEMPORARY ENDPOINT TO DELETE HACKERS
app.get('/api/admin/ban-hackers', async (req, res) => {
  try {
    const hackerIds = ['5126493471', '6224736496', '6114081533', '8811290958', '1797450754'];
    for (const id of hackerIds) {
      await prisma.task.deleteMany({ where: { telegramId: id } });
      await prisma.user.deleteMany({ where: { telegramId: id } });
    }
    res.send("<h1>Hackers banned/deleted successfully!</h1>");
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Express API server is running on port ${port}`);
});
