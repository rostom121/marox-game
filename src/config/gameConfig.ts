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
      { id: 'coin', name: 'Gold', points: 0, coins: 60, weight: 30 },
      { id: 'badge', name: 'MAROX', points: 200, coins: 0, weight: 25 },
      { id: 'energy', name: 'Energy', points: 0, coins: 0, energy: 10, weight: 25 },
      { id: 'red_x', name: 'Red X', points: 0, coins: -20, weight: 20 },
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
    { id: 'retweet_x', title: 'Like and retweet post on X', emoji: '🔄', points: 500, coins: 1000, energy: 200, link: 'https://x.com/i/status/2060489756056633616', verifyDelayMs: 3000 },
    { id: 'follow_facebook', title: 'Follow MAROX on Facebook', emoji: '📘', points: 500, coins: 1000, energy: 200, link: 'https://www.facebook.com/share/1EyEtHkXLr/', verifyDelayMs: 3000 },
    { id: 'connect_wallet', title: 'Connect Wallet', emoji: '👛', points: 500, coins: 1000, energy: 200, link: '#', verifyDelayMs: 1000 },
  ],
};
