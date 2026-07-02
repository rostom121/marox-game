export interface SymbolConfig {
  id: string;
  name: string;
  points: number;
  coins: number;
  energy?: number;
  weight: number;
}

export interface GameConfig {
  dailyReward: {
    points: number;
    coins: number;
    premiumBonusPoints: number;
    premiumBonusCoins: number;
  };
  referral: {
    referrerPoints: number;
    referrerCoins: number;
    referrerEnergy: number;
    referrerPremiumPoints: number;
    referrerPremiumCoins: number;
    referrerPremiumEnergy: number;
    referredPoints: number;
    referredCoins: number;
  };
  slot: {
    spinCostEnergy: number;
    symbols: SymbolConfig[];
    payoutMultipliers: {
      match3: number;
      match4: number;
      match5: number;
    };
  };
  leveling: {
    baseXpNeeded: number;
    multiplier: number;
  };
  tasks: Array<{
    id: string;
    title: string;
    emoji: string;
    points: number;
    coins: number;
    energy: number;
    link: string;
    verifyDelayMs: number;
  }>;
  referralTasks: Array<{
    id: string;
    requiredReferrals: number;
    title: string;
    emoji: string;
    points: number;
    coins: number;
    energy: number;
  }>;
}

export const gameConfig: GameConfig = {
  dailyReward: {
    points: 500,
    coins: 100,
    premiumBonusPoints: 1000,
    premiumBonusCoins: 200,
  },
  referral: {
    referrerPoints: 500,
    referrerCoins: 100,
    referrerEnergy: 200,
    referrerPremiumPoints: 1000,
    referrerPremiumCoins: 200,
    referrerPremiumEnergy: 1000,
    referredPoints: 200,
    referredCoins: 50,
  },
  slot: {
    spinCostEnergy: 10,
    payoutMultipliers: {
      match3: 1.5,
      match4: 3.0,
      match5: 8.0,
    },
    symbols: [
      { id: 'coin', name: 'Gold', points: 0, coins: 150, weight: 30 },
      { id: 'badge', name: 'MAROX', points: 400, coins: 0, weight: 25 },
      { id: 'energy', name: 'Energy', points: 0, coins: 0, energy: 30, weight: 25 },
      { id: 'red_x', name: 'Red X', points: 0, coins: -50, weight: 20 },
    ],
  },
  leveling: {
    baseXpNeeded: 100,
    multiplier: 1.25,
  },
  tasks: [
    { id: 'join_channel', title: 'Join MAROX Channel', emoji: '📢', points: 500, coins: 1000, energy: 200, link: 'https://t.me/MAROXCOIN', verifyDelayMs: 3000 },
    { id: 'follow_x', title: 'Follow MAROX on X', emoji: '🐦', points: 500, coins: 1000, energy: 200, link: 'https://x.com/MAROXcoin', verifyDelayMs: 3000 },
    { id: 'join_community', title: 'Join MAROX Community', emoji: '👥', points: 500, coins: 1000, energy: 200, link: 'https://t.me/MAROXCOMMUNITY', verifyDelayMs: 3000 },
    { id: 'retweet_x', title: 'Like and retweet post on X', emoji: '🔄', points: 500, coins: 0, energy: 500, link: 'https://x.com/i/status/2071362095900147979', verifyDelayMs: 3000 },
    { id: 'react_telegram', title: 'React on Telegram Post', emoji: '💬', points: 500, coins: 0, energy: 500, link: 'https://t.me/MAROXCOIN', verifyDelayMs: 3000 },
    { id: 'follow_facebook', title: 'Follow MAROX on Facebook', emoji: '📘', points: 500, coins: 1000, energy: 200, link: 'https://www.facebook.com/share/1EyEtHkXLr/', verifyDelayMs: 3000 },
    { id: 'buy_shop', title: 'Buy from the game shop', emoji: '🛒', points: 5000, coins: 20000, energy: 2000, link: '#', verifyDelayMs: 0 },
    { id: 'connect_wallet', title: 'Connect Wallet', emoji: '👛', points: 500, coins: 1000, energy: 200, link: '#', verifyDelayMs: 1000 },
  ],
  referralTasks: [
    { id: 'ref_1', requiredReferrals: 1, title: 'Invite 1 Friend', emoji: '👤', points: 2000, coins: 50, energy: 500 },
    { id: 'ref_3', requiredReferrals: 3, title: 'Invite 3 Friends', emoji: '👥', points: 10000, coins: 200, energy: 1500 },
    { id: 'ref_10', requiredReferrals: 10, title: 'Invite 10 Friends', emoji: '🏆', points: 50000, coins: 1000, energy: 5000 },
    { id: 'ref_50', requiredReferrals: 50, title: 'Invite 50 Friends', emoji: '🔥', points: 300000, coins: 5000, energy: 20000 },
    { id: 'ref_100', requiredReferrals: 100, title: 'Invite 100 Friends', emoji: '👑', points: 1000000, coins: 15000, energy: 50000 },
  ],
};
