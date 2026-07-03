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
const miniAppUrl = process.env.MINI_APP_URL || 'https://marox-game.vercel.app';
const EVENT_END_TIME = new Date("2026-07-03T21:00:00Z").getTime();

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

      const ogCount = await prisma.user.count({ where: { isOG: true } });
      const canBeOG = ogCount < 1000;

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
          isOG: canBeOG,
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

    const completedTasks = user.tasks ? user.tasks.filter(t => {
      if (['retweet_x', 'react_telegram', 'buy_shop'].includes(t.taskId)) {
        if (!t.completedAt) return false;
        const diffHours = (new Date().getTime() - new Date(t.completedAt).getTime()) / (1000 * 60 * 60);
        return diffHours < 24; // If < 24h, stays in completed. If >= 24h, drops out to be repeatable.
      }
      return true;
    }).map(t => t.taskId) : [];
    
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

async function grantReferralBonus(user, pointsEarned) {
  if (pointsEarned > 0 && user.referredBy) {
    const bonus = Math.floor(pointsEarned * 0.15);
    if (bonus > 0) {
      try {
        const isEventActive = Date.now() < EVENT_END_TIME;
        const dataUpdate = { points: { increment: bonus } };
        if (isEventActive) {
          dataUpdate.eventPoints = { increment: bonus };
        }
        await prisma.user.update({
          where: { telegramId: user.referredBy },
          data: dataUpdate
        });
      } catch (err) {
        console.error("Failed to grant referral bonus:", err.message);
      }
    }
  }
}

const antiCheatTracker = new Map();

async function checkAntiCheat(telegramId, pointsGained) {
  if (!pointsGained || pointsGained <= 0) return false;
  const now = Date.now();
  let tracker = antiCheatTracker.get(String(telegramId));
  if (!tracker || now - tracker.windowStart > 60000) {
    tracker = { windowStart: now, pointsEarned: 0 };
  }
  tracker.pointsEarned += pointsGained;
  antiCheatTracker.set(String(telegramId), tracker);
  
  if (tracker.pointsEarned > 1500000) {
    console.warn(`[ANTI-CHEAT] Banning user ${telegramId} for earning ${tracker.pointsEarned} points in under 60s!`);
    await prisma.task.deleteMany({ where: { telegramId: String(telegramId) } });
    await prisma.user.deleteMany({ where: { telegramId: String(telegramId) } });
    antiCheatTracker.delete(String(telegramId));
    return true; // Indicates user was banned
  }
  return false;
}

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
    else if (r < 50) outcome = 'badge';
    else if (r < 65) outcome = 'energy';
    else if (r < 80) outcome = 'red_x';

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
      'coin': { points: 0, coins: 1000, energy: 0 },
      'badge': { points: 400, coins: 0, energy: 0 },
      'energy': { points: 0, coins: 0, energy: 30 }
    };

    if (outcome !== 'mixed') {
      winnerRows.push(0);
      points = symbolValues[outcome].points;
      coins = symbolValues[outcome].coins;
      energyWin = symbolValues[outcome].energy;
    }

    let scaledPoints = Math.floor(points * scale);
    if (user.isOG) {
      scaledPoints = Math.floor(scaledPoints * 1.5);
    }
    const scaledCoins = Math.floor(coins * scale);
    const scaledEnergyWin = Math.floor(energyWin * scale);

    const isBanned = await checkAntiCheat(telegramId, scaledPoints);
    if (isBanned) return res.status(403).json({ ok: false, error: 'Banned for suspicious activity' });

    const isEventActive = Date.now() < EVENT_END_TIME;

    const dataUpdate = {
      energy: user.energy - bet + scaledEnergyWin,
      points: user.points + scaledPoints,
      coins: Math.max(0, user.coins + scaledCoins),
    };
    if (isEventActive && scaledPoints > 0) {
      dataUpdate.eventPoints = user.eventPoints + scaledPoints;
    }

    const updatedUser = await prisma.user.update({
      where: { telegramId: String(telegramId) },
      data: dataUpdate
    });

    // Grant 15% referral bonus if applicable
    await grantReferralBonus(user, scaledPoints);

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

// Event Leaderboard
app.get('/api/event/leaderboard', async (req, res) => {
  try {
    const topUsers = await prisma.user.findMany({
      where: { eventPoints: { gt: 0 } },
      orderBy: { eventPoints: 'desc' },
      take: 100,
      select: {
        telegramId: true,
        firstName: true,
        username: true,
        eventPoints: true,
        premium: true
      }
    });
    return res.json({ ok: true, leaderboard: topUsers, endTime: EVENT_END_TIME });
  } catch (error) {
    console.error("Database error in GET /api/event/leaderboard:", error.message);
    return res.status(500).json({ ok: false, error: 'Failed to fetch event leaderboard' });
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
    const { telegramId, taskId, rewardPoints, rewardCoins, rewardEnergy } = req.body;
    if (!telegramId || !taskId) return res.status(400).json({ ok: false, error: 'Missing params' });

    const user = await prisma.user.findUnique({ where: { telegramId: String(telegramId) }, include: { tasks: true } });
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

    const existingTask = user.tasks.find(t => t.taskId === taskId);
    if (existingTask) {
      if (['retweet_x', 'react_telegram', 'buy_shop'].includes(taskId)) {
        const diffHours = (new Date().getTime() - new Date(existingTask.completedAt).getTime()) / (1000 * 60 * 60);
        if (diffHours < 24) return res.status(400).json({ ok: false, error: 'Wait 24 hours to repeat this task' });
        
        await prisma.task.update({
          where: { id: existingTask.id },
          data: { completedAt: new Date() }
        });
      } else {
        return res.status(400).json({ ok: false, error: 'Task already completed' });
      }
    } else {
      // Validate referral tasks
      if (taskId.startsWith('ref_')) {
        const requiredRefs = parseInt(taskId.split('_')[1], 10);
        if (isNaN(requiredRefs) || user.referralsCount < requiredRefs) {
          return res.status(400).json({ ok: false, error: 'Not enough referrals to claim this task' });
        }
      }

      await prisma.task.create({
        data: { telegramId: String(telegramId), taskId: taskId, status: 'completed', completedAt: new Date() }
      });
    }

    let finalRewardPoints = Number(rewardPoints || 0);
    if (user.isOG) {
      finalRewardPoints = Math.floor(finalRewardPoints * 1.5);
    }

    const isBanned = await checkAntiCheat(telegramId, finalRewardPoints);
    if (isBanned) return res.status(403).json({ ok: false, error: 'Banned for suspicious activity' });

    const isEventActive = Date.now() < EVENT_END_TIME;
    const dataUpdate = {
      points: { increment: finalRewardPoints },
      coins: { increment: Number(rewardCoins || 0) },
      energy: { increment: Number(rewardEnergy || 0) }
    };
    if (isEventActive && finalRewardPoints > 0) {
      dataUpdate.eventPoints = { increment: finalRewardPoints };
    }

    const updatedUser = await prisma.user.update({
      where: { telegramId: String(telegramId) },
      data: dataUpdate
    });

    // Grant 15% referral bonus if applicable
    await grantReferralBonus(user, finalRewardPoints);

    return res.json({ ok: true, user: updatedUser });
  } catch (error) {
    console.error("Error in /api/tasks/complete:", error.message);
    return res.status(500).json({ ok: false, error: 'Failed to complete task' });
  }
});

// SECURE ADS REWARD
app.post('/api/ads/reward', async (req, res) => {
  try {
    const { telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ ok: false, error: 'Missing params' });

    const isBanned = await checkAntiCheat(telegramId, 0); // Not points, but just a check
    if (isBanned) return res.status(403).json({ ok: false, error: 'Banned for suspicious activity' });

    const updatedUser = await prisma.user.update({
      where: { telegramId: String(telegramId) },
      data: {
        energy: { increment: 600 }
      }
    });

    return res.json({ ok: true, user: updatedUser });
  } catch (error) {
    console.error("Error in /api/ads/reward:", error.message);
    return res.status(500).json({ ok: false, error: 'Failed to claim ad reward' });
  }
});

// SECURE DAILY REWARD
app.post('/api/daily/claim', async (req, res) => {
  try {
    const { telegramId, points, coins, energy } = req.body;
    if (!telegramId) return res.status(400).json({ ok: false, error: 'Missing params' });

    const user = await prisma.user.findUnique({ where: { telegramId: String(telegramId) } });
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

    let finalPoints = Number(points || 0);
    if (user.isOG) {
      finalPoints = Math.floor(finalPoints * 1.5);
    }

    const isBanned = await checkAntiCheat(telegramId, finalPoints);
    if (isBanned) return res.status(403).json({ ok: false, error: 'Banned for suspicious activity' });

    const isEventActive = Date.now() < EVENT_END_TIME;
    const dataUpdate = {
      points: { increment: finalPoints },
      coins: { increment: Number(coins || 0) },
      energy: { increment: Number(energy || 0) }
    };
    if (isEventActive && finalPoints > 0) {
      dataUpdate.eventPoints = { increment: finalPoints };
    }

    const updatedUser = await prisma.user.update({
      where: { telegramId: String(telegramId) },
      data: dataUpdate
    });

    // Grant 15% referral bonus if applicable
    await grantReferralBonus(user, finalPoints);

    return res.json({ ok: true, user: updatedUser });
  } catch (error) {
    console.error("Error in /api/daily/claim:", error.message);
    return res.status(500).json({ ok: false, error: 'Failed to claim daily reward' });
  }
});

// SECURE SHOP PURCHASE (Blockchain Verification)
app.post('/api/shop/verify_purchase', async (req, res) => {
  try {
    const { telegramId, walletAddress, costNano, gainEnergy, gainCoins } = req.body;
    if (!telegramId || !walletAddress || !costNano) return res.status(400).json({ ok: false, error: 'Missing params' });

    const user = await prisma.user.findUnique({ where: { telegramId: String(telegramId) } });
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

    // 1. Fetch transactions from TonAPI for the destination wallet
    const DESTINATION_WALLET = 'UQAlEG3XMAbp2aD4OgGvUuQ5Rd1MELL04dq8ioam1jAIR51-';
    const response = await fetch(`https://tonapi.io/v2/blockchain/accounts/${DESTINATION_WALLET}/transactions?limit=20`);
    const data = await response.json();

    if (!data.transactions || !Array.isArray(data.transactions)) {
      return res.status(500).json({ ok: false, error: 'Failed to fetch blockchain data' });
    }

    let foundTxHash = null;

    for (const tx of data.transactions) {
      if (!tx.success) continue;
      
      const inMsg = tx.in_msg;
      if (!inMsg || !inMsg.source) continue;

      // Ensure it's from the user's wallet
      if (inMsg.source.address === walletAddress) {
        // Ensure the value matches exactly
        if (String(inMsg.value) === String(costNano)) {
          // Check if this tx is recent (within last 30 minutes)
          const txTime = tx.utime * 1000;
          if (Date.now() - txTime < 30 * 60 * 1000) {
            // Found a matching transaction! Now check if we already claimed it.
            const existingClaim = await prisma.task.findFirst({
              where: { taskId: `tx:${tx.hash}` }
            });

            if (!existingClaim) {
              foundTxHash = tx.hash;
              break; // We found an unclaimed transaction
            }
          }
        }
      }
    }

    if (!foundTxHash) {
      return res.json({ ok: false, status: 'pending', error: 'Transaction not found on chain or already claimed' });
    }

    // 2. Mark as claimed
    await prisma.task.create({
      data: {
        telegramId: String(telegramId),
        taskId: `tx:${foundTxHash}`,
        status: 'completed',
        completedAt: new Date()
      }
    });

    // 3. Grant the purchased items!
    const updatedUser = await prisma.user.update({
      where: { telegramId: String(telegramId) },
      data: {
        energy: user.energy + Number(gainEnergy || 0),
        coins: user.coins + Number(gainCoins || 0)
      }
    });

    return res.json({ ok: true, status: 'success', user: updatedUser });

  } catch (error) {
    console.error("Error in /api/shop/verify_purchase:", error.message);
    return res.status(500).json({ ok: false, error: 'Verification failed' });
  }
});

const getUpgradeCost = (level) => {
  if (level < 10) return 100;
  if (level < 20) return 250;
  if (level < 50) return 500;
  if (level < 100) return 1000;
  if (level < 200) return 2000;
  if (level < 300) return 5000;
  return 10000;
};

const getUpgradeClicksRequired = (level) => {
  if (level < 20) return 2;
  if (level < 50) return 4;
  if (level < 100) return 7;
  if (level < 250) return 10;
  if (level < 500) return 15;
  return 25;
};

// SECURE UPGRADE LEVEL
app.post('/api/upgrade', async (req, res) => {
  try {
    const { telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ ok: false, error: 'Missing params' });

    const user = await prisma.user.findUnique({ where: { telegramId: String(telegramId) } });
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

    const cost = getUpgradeCost(user.level);
    if (user.coins < cost) {
      return res.status(400).json({ ok: false, error: 'Not enough gold to upgrade' });
    }

    const clicksRequired = getUpgradeClicksRequired(user.level);
    const newXp = (user.xp || 0) + 1;

    let updateData = {};
    let leveledUp = false;

    if (newXp >= clicksRequired) {
      updateData = {
        coins: user.coins - cost,
        level: user.level + 1,
        xp: 0,
        energy: user.energy + 30
      };
      leveledUp = true;
    } else {
      updateData = {
        coins: user.coins - cost,
        xp: newXp
      };
    }

    const updatedUser = await prisma.user.update({
      where: { telegramId: String(telegramId) },
      data: updateData
    });

    return res.json({ ok: true, user: updatedUser, leveledUp });
  } catch (error) {
    console.error("Error in /api/upgrade:", error.message);
    return res.status(500).json({ ok: false, error: 'Upgrade failed' });
  }
});

// Basic status check
app.get('/status', (req, res) => {
  res.json({ status: 'online', botEnabled: !!token, channel: channelUsername, appUrl: miniAppUrl });
});


// DAILY REMINDER CRON JOB
const cron = require('node-cron');

// Run every day at 12:00 PM (noon) server time
cron.schedule('0 12 * * *', async () => {
  if (!token) return; // Don't run if bot is not configured
  
  console.log("Starting daily reminder broadcast...");
  try {
    const users = await prisma.user.findMany({
      select: { telegramId: true }
    });
    
    console.log(`Found ${users.length} users to remind.`);
    
    const message = `🌟 *Your Daily MAROX Rewards are Waiting!* 🌟\n\nHey there! Don't forget to claim your daily login rewards, energy refills, and spin the slots to climb the leaderboard! 🎰💎\n\nTap the button below to jump back into the action! 👇`;
    
    const photoUrl = `${miniAppUrl}/daily-poster.jpg`;
    const opts = {
      caption: message,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Play Now', web_app: { url: miniAppUrl } }]
        ]
      }
    };

    // Send messages with a delay to avoid Telegram rate limits (30 msgs/sec max)
    for (let i = 0; i < users.length; i++) {
      setTimeout(async () => {
        try {
          await bot.sendPhoto(users[i].telegramId, photoUrl, opts);
        } catch (err) {
          // Ignore errors like user blocking the bot
        }
      }, i * 50); // 50ms delay between messages (20 msgs per second)
    }
  } catch (error) {
    console.error("Error running daily reminder cron job:", error);
  }
});




// ADMIN ENDPOINT TO MIGRATE EXISTING USERS TO OG
app.get('/api/admin/migrate-ogs', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      take: 1000,
      select: { telegramId: true }
    });
    
    const ids = users.map(u => u.telegramId);
    if (ids.length === 0) return res.json({ ok: true, message: "No users found" });
    
    const result = await prisma.user.updateMany({
      where: { telegramId: { in: ids } },
      data: { isOG: true }
    });
    
    res.json({ ok: true, message: `Migrated ${result.count} users to OG Builders status!` });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Express API server is running on port ${port}`);
});

