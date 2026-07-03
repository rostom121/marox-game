const tb = require('node-telegram-bot-api');
const TelegramBot = tb.default || tb;
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' }); // Load from root
require('dotenv').config();

const prisma = new PrismaClient();
const token = process.env.BOT_TOKEN;
const miniAppUrl = process.env.MINI_APP_URL || 'https://marox-game.vercel.app';

if (!token) {
  console.error("No BOT_TOKEN found in environment.");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: false });

async function sendTestMessage() {
  console.log("Starting test broadcast...");
  try {
    const users = await prisma.user.findMany({
      select: { telegramId: true }
    });
    
    console.log(`Found ${users.length} users to send the test message to.`);
    
    const message = `🌟 *Your Daily MAROX Rewards are Waiting! (TEST)* 🌟\n\nHey there! Don't forget to claim your daily login rewards, energy refills, and spin the slots to climb the leaderboard! 🎰💎\n\nTap the button below to jump back into the action! 👇`;
    
    const opts = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Play Now', web_app: { url: miniAppUrl } }]
        ]
      }
    };

    let sentCount = 0;
    for (let i = 0; i < users.length; i++) {
      try {
        await new Promise(res => setTimeout(res, 50)); // 50ms delay
        await bot.sendMessage(users[i].telegramId, message, opts);
        sentCount++;
      } catch (err) {
        console.log(`Failed to send to ${users[i].telegramId}:`, err.message);
      }
    }
    console.log(`Successfully sent ${sentCount} test messages!`);
  } catch (error) {
    console.error("Error during broadcast:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

sendTestMessage();
