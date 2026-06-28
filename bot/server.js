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

  console.log(`Telegram Bot is active and polling...`);
} else {
  console.log("Telegram Bot is running in MOCK mode (no BOT_TOKEN provided).");
}

// ── Express API Endpoints ──

// 1. Get or Create User
app.get('/api/user', async (req, res) => {
  const { telegramId, firstName, username, premium } = req.query;

  if (!telegramId) {
    return res.status(400).json({ ok: false, error: 'telegramId parameter is required' });
  }

  try {
    let user = await prisma.user.findUnique({
      where: { telegramId: String(telegramId) }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: String(telegramId),
          firstName: String(firstName || 'Player'),
          username: username ? String(username) : null,
          premium: premium === 'true',
        }
      });
    }

    return res.json({ ok: true, user });
  } catch (error) {
    console.error("Database error in GET /api/user:", error.message);
    return res.status(500).json({ ok: false, error: 'Database operation failed' });
  }
});

// 2. Sync User Stats
app.post('/api/user/sync', async (req, res) => {
  const { telegramId, points, coins, energy, level, xp, walletAddress } = req.body;

  if (!telegramId) {
    return res.status(400).json({ ok: false, error: 'telegramId is required' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { telegramId: String(telegramId) },
      data: {
        points: Number(points),
        coins: Number(coins),
        energy: Number(energy),
        level: Number(level),
        xp: Number(xp),
        walletAddress: walletAddress ? String(walletAddress) : null
      }
    });

    return res.json({ ok: true, user: updatedUser });
  } catch (error) {
    console.error("Database error in POST /api/user/sync:", error.message);
    return res.status(500).json({ ok: false, error: 'Failed to sync stats' });
  }
});

// 3. Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const topUsers = await prisma.user.findMany({
      orderBy: { points: 'desc' },
      take: 20
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

// Basic status check
app.get('/status', (req, res) => {
  res.json({ status: 'online', botEnabled: !!token, channel: channelUsername, appUrl: miniAppUrl });
});

app.listen(port, () => {
  console.log(`Express API server is running on port ${port}`);
});
