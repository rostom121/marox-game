import { create } from 'zustand'
import { gameConfig } from '../config/gameConfig'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://marox-game-production.up.railway.app';

let syncTimeout: NodeJS.Timeout | null = null;
const syncWithBackend = (telegramId: string, data: Partial<UserData>, walletAddress: string | null, force: boolean = false) => {
  if (!telegramId || telegramId === 'demo') return;
  
  const doSync = () => {
    fetch(`${API_URL}/api/user/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId,
        points: data.points,
        coins: data.coins,
        energy: data.energy,
        level: data.level,
        xp: data.xp,
        walletAddress,
        completedTasks: data.completedTasks
      })
    }).catch(console.error);
  };

  if (force) {
    if (syncTimeout) clearTimeout(syncTimeout);
    doSync();
    return;
  }

  if (syncTimeout) clearTimeout(syncTimeout);
  
  // Debounce sync to avoid spamming API on every spin
  syncTimeout = setTimeout(doSync, 2000);
};

export const getUpgradeCost = (level: number): number => {
  if (level < 10) return 100;
  if (level < 20) return 250;
  if (level < 50) return 500;
  if (level < 100) return 1000;
  if (level < 200) return 2000;
  if (level < 300) return 5000;
  return 10000;
};

export const getUpgradeClicksRequired = (level: number): number => {
  if (level < 20) return 2; // Covers 1-19
  if (level < 50) return 4;
  if (level < 100) return 7;
  if (level < 250) return 10;
  if (level < 500) return 15;
  return 25; // 500+
};

export interface UserData {
  points: number;
  coins: number;
  energy: number;
  level: number;
  xp: number;
  dailyStreak: number;
  lastClaimDate: string | null;
  gameUsername: string | null;
  lastEnergyUpdate?: number;
  completedTasks?: string[];
  referralsCount?: number;
}

export interface SettingsData {
  isMuted: boolean;
  volume: number;
  language: string;
}

export const DAILY_REWARDS = [
  { day: 1, energy: 20, coins: 0, points: 0 },
  { day: 2, energy: 30, coins: 0, points: 0 },
  { day: 3, energy: 40, coins: 50, points: 0 },
  { day: 4, energy: 50, coins: 0, points: 0 },
  { day: 5, energy: 60, coins: 0, points: 0 },
  { day: 6, energy: 80, coins: 0, points: 0 },
  { day: 7, energy: 150, coins: 200, points: 100 },
];

interface GameStore {
  data: UserData;
  telegramUser: {
    id: string;
    firstName: string;
    username?: string;
    photoUrl?: string;
    premium: boolean;
  } | null;
  walletConnected: boolean;
  walletAddress: string | null;
  activeTab: string;
  loading: boolean;
  settings: SettingsData;

  initStore: () => void;
  setTab: (tab: string) => void;
  updateStats: (pointsDiff: number, coinsDiff: number, energyDiff: number) => void;
  spinOutcome: (points: number, coins: number, energyCost: number, energyWin: number) => void;
  setWallet: (address: string | null) => void;
  getDailyStatus: () => { canClaim: boolean; currentStreak: number; nextReward: typeof DAILY_REWARDS[0] };
  claimDailyReward: () => boolean;
  upgradeLevel: () => { success: boolean, leveledUp: boolean };
  setGameUsername: (name: string) => void;
  addPurchasedItems: (energyAmount: number, coinsAmount: number) => void;
  completeTask: (taskId: string) => void;
  updateSettings: (newSettings: Partial<SettingsData>) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  data: {
    points: 100,
    coins: 5000,
    energy: 500,
    level: 1,
    xp: 0,
    dailyStreak: 1,
    lastClaimDate: null,
    gameUsername: null,
    lastEnergyUpdate: Date.now(),
    completedTasks: [],
  },
  telegramUser: null,
  walletConnected: false,
  walletAddress: null,
  activeTab: 'home',
  loading: true,
  settings: {
    isMuted: false,
    volume: 0.5,
    language: 'EN',
  },

  initStore: () => {
    // Initial data loading (load local storage fallback)
    let localData: UserData | null = null;
    let localSettings: SettingsData | null = null;
    try {
      const saved = localStorage.getItem('marox_game_data');
      if (saved) {
        localData = JSON.parse(saved);
        
        // --- Migration / Reset Hack ---
        // If the user's local data exactly matches the old dummy data, clear it.
        if (localData && localData.coins === 12450 && localData.level === 12 && localData.points === 0) {
          localData = null;
          localStorage.removeItem('marox_game_data');
        }

        const now = Date.now();
        if (localData) {
          const lastUpdate = localData.lastEnergyUpdate || now;
          const elapsedSeconds = Math.floor((now - lastUpdate) / 1000);
          if (localData.energy < 100) {
            const gainedEnergy = Math.floor(elapsedSeconds / 144);
            localData.energy = Math.min(100, localData.energy + gainedEnergy);
            localData.lastEnergyUpdate = now - ((elapsedSeconds % 144) * 1000);
          } else {
            localData.lastEnergyUpdate = now;
          }
        }
      }
      
      const savedSettings = localStorage.getItem('marox_game_settings');
      if (savedSettings) {
        localSettings = JSON.parse(savedSettings);
      }
    } catch (e) {
      console.error("Local storage error:", e);
    }

    // Try fetching Telegram user
    let tgUser = null;
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const initData = window.Telegram.WebApp.initDataUnsafe?.user;
      if (initData) {
        tgUser = {
          id: String(initData.id),
          firstName: initData.first_name || 'Player',
          username: initData.username,
          photoUrl: initData.photo_url,
          premium: !!initData.is_premium,
        };
      }
    }

    if (!tgUser) {
      tgUser = { id: 'demo', firstName: 'Player', premium: false };
    }

    const initialData = localData || {
      points: 100,
      coins: 5000,
      energy: 500,
      level: 1,
      xp: 0,
      dailyStreak: 1,
      lastClaimDate: null,
      gameUsername: null,
      lastEnergyUpdate: Date.now(),
      completedTasks: [],
    };

    set({
      telegramUser: tgUser,
      data: initialData,
      settings: localSettings || get().settings,
    }); // Keep loading true until API responds

    if (tgUser && tgUser.id !== 'demo') {
      fetch(`${API_URL}/api/user?telegramId=${tgUser.id}&firstName=${encodeURIComponent(tgUser.firstName)}&premium=${tgUser.premium}`)
        .then(res => res.json())
        .then(resData => {
          if (resData.ok && resData.user) {
            set((state) => {
              const mergedData = {
                ...state.data,
                points: resData.user.points,
                coins: resData.user.coins,
                energy: resData.user.energy,
                level: resData.user.level,
                xp: resData.user.xp,
                referralsCount: resData.user.referralsCount,
                completedTasks: resData.isNew ? [] : (resData.user.completedTasks || state.data.completedTasks),
              };
              localStorage.setItem('marox_game_data', JSON.stringify(mergedData));
              return { data: mergedData, loading: false, walletAddress: resData.user.walletAddress || state.walletAddress };
            });
          } else {
            set({ loading: false });
          }
        })
        .catch((e) => {
          console.error("Failed to load from API", e);
          set({ loading: false });
        });
    } else {
      set({ loading: false });
    }

    // Start energy regeneration: 100 max, 4 hours to fill (1 energy per 144 seconds)
    const energyRegen = setInterval(() => {
      set((state) => {
        if (state.data.energy >= 100) {
          const newData = { ...state.data, lastEnergyUpdate: Date.now() };
          return { data: newData };
        }
        const now = Date.now();
        const lastUpdate = state.data.lastEnergyUpdate || now;
        const elapsedSeconds = Math.floor((now - lastUpdate) / 1000);
        if (elapsedSeconds >= 144) {
          const gainedEnergy = Math.floor(elapsedSeconds / 144);
          const newEnergy = Math.min(100, state.data.energy + gainedEnergy);
          const newLastUpdate = now - ((elapsedSeconds % 144) * 1000);
          const newData = { ...state.data, energy: newEnergy, lastEnergyUpdate: newLastUpdate };
          try { localStorage.setItem('marox_game_data', JSON.stringify(newData)); } catch (_) { }
          return { data: newData };
        }
        return state;
      });
    }, 10000); // Check every 10s

    // Cleanup not needed for singleton store, but store the ref just in case
    if (typeof window !== 'undefined') {
      (window as any).__maroxEnergyRegen = energyRegen;
    }
  },


  setTab: (tab) => set({ activeTab: tab }),

  updateStats: (pointsDiff, coinsDiff, energyDiff) => {
    set((state) => {
      const nextPoints = Math.max(0, state.data.points + pointsDiff);
      const nextCoins = Math.max(0, state.data.coins + coinsDiff);
      const nextEnergy = Math.max(0, state.data.energy + energyDiff);

      const nextData = {
        ...state.data,
        points: nextPoints,
        coins: nextCoins,
        energy: nextEnergy,
      };

      try {
        localStorage.setItem('marox_game_data', JSON.stringify(nextData));
        syncWithBackend(state.telegramUser?.id || '', nextData, state.walletAddress);
      } catch (e) {
        console.error(e);
      }

      return { data: nextData };
    });
  },

  completeTask: (taskId: string) => {
    set((state) => {
      const currentTasks = state.data.completedTasks || [];
      if (currentTasks.includes(taskId)) return state;

      const nextData = {
        ...state.data,
        completedTasks: [...currentTasks, taskId],
      };

      try {
        localStorage.setItem('marox_game_data', JSON.stringify(nextData));
        // You could add backend syncing for tasks here if needed
      } catch (e) {
        console.error(e);
      }

      return { data: nextData };
    });
  },

  spinOutcome: (pointsWin, coinsWin, energyCost, energyWin) => {
    set((state) => {
      let nextPoints = Math.max(0, state.data.points + pointsWin);
      let nextCoins = Math.max(0, state.data.coins + coinsWin);
      let nextEnergy = Math.max(0, state.data.energy - energyCost + energyWin);

      // Leveling XP Calculation
      // Every spin gives 5 XP but no longer auto-levels
      let nextXp = Math.min(100, state.data.xp + 5);
      let nextLevel = state.data.level;

      const nextData = {
        ...state.data,
        points: nextPoints,
        coins: nextCoins,
        energy: nextEnergy,
        level: nextLevel,
        xp: nextXp,
      };

      try {
        localStorage.setItem('marox_game_data', JSON.stringify(nextData));
        syncWithBackend(state.telegramUser?.id || '', nextData, state.walletAddress);
      } catch (e) {
        console.error(e);
      }

      return { data: nextData };
    });
  },

  setWallet: (address) => {
    set((state) => {
      syncWithBackend(state.telegramUser?.id || '', state.data, address);
      return {
        walletConnected: !!address,
        walletAddress: address,
      };
    });
  },

  getDailyStatus: () => {
    const { data } = get();
    const today = new Date().toISOString().split('T')[0];

    if (!data.lastClaimDate) {
      return { canClaim: true, currentStreak: 1, nextReward: DAILY_REWARDS[0] };
    }

    const lastClaimStr = data.lastClaimDate;
    // Simple date comparison for YYYY-MM-DD
    if (lastClaimStr === today) {
      // Already claimed today
      return { canClaim: false, currentStreak: data.dailyStreak, nextReward: DAILY_REWARDS[Math.min(6, data.dailyStreak)] };
    }

    // Check if yesterday
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    if (lastClaimStr === yesterdayStr) {
      // Consecutive login!
      let nextStreak = data.dailyStreak + 1;
      if (nextStreak > 7) nextStreak = 1; // cycle 7 days
      return { canClaim: true, currentStreak: nextStreak, nextReward: DAILY_REWARDS[nextStreak - 1] };
    } else {
      // Missed a day
      return { canClaim: true, currentStreak: 1, nextReward: DAILY_REWARDS[0] };
    }
  },

  claimDailyReward: () => {
    const status = get().getDailyStatus();
    if (!status.canClaim) return false;

    const reward = status.nextReward;
    const today = new Date().toISOString().split('T')[0];

    set((state) => {
      const nextData = {
        ...state.data,
        points: state.data.points + reward.points,
        coins: state.data.coins + reward.coins,
        energy: state.data.energy + reward.energy,
        dailyStreak: status.currentStreak,
        lastClaimDate: today,
      };

      try {
        localStorage.setItem('marox_game_data', JSON.stringify(nextData));
      } catch (e) {
        console.error(e);
      }

      return { data: nextData };
    });

    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    return true;
  },

  // inside GameStore interface, upgradeLevel returns { success: boolean, leveledUp: boolean }

  upgradeLevel: () => {
    const state = get();
    const cost = getUpgradeCost(state.data.level);

    if (state.data.coins >= cost) {
      let result = { success: false, leveledUp: false };
      set((s) => {
        const clicksRequired = getUpgradeClicksRequired(s.data.level);
        const newXp = (s.data.xp || 0) + 1;

        if (newXp >= clicksRequired) {
          const nextData = {
            ...s.data,
            coins: s.data.coins - cost,
            level: s.data.level + 1,
            xp: 0,
            energy: s.data.energy + 30
          };
          try {
            localStorage.setItem('marox_game_data', JSON.stringify(nextData));
            syncWithBackend(state.telegramUser?.id || '', nextData, state.walletAddress, true);
          } catch (e) {
            console.error(e);
          }
          result = { success: true, leveledUp: true };
          return { data: nextData };
        } else {
          const nextData = {
            ...s.data,
            coins: s.data.coins - cost,
            xp: newXp
          };
          try {
            localStorage.setItem('marox_game_data', JSON.stringify(nextData));
            syncWithBackend(state.telegramUser?.id || '', nextData, state.walletAddress, false);
          } catch (e) {
            console.error(e);
          }
          result = { success: true, leveledUp: false };
          return { data: nextData };
        }
      });
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
      return result as any; // Cast as any because the interface was boolean previously, wait, I need to update the interface!
    }
    return { success: false, leveledUp: false } as any;
  },

  setGameUsername: (name) => {
    set((state) => {
      const newData = { ...state.data, gameUsername: name };
      try { localStorage.setItem('marox_game_data', JSON.stringify(newData)); } catch (_) {}
      return { data: newData };
    });
  },

  addPurchasedItems: (energyAmount, coinsAmount) => {
    set((state) => {
      const newData = {
        ...state.data,
        energy: state.data.energy + energyAmount,
        coins: state.data.coins + coinsAmount
      };
      try { localStorage.setItem('marox_game_data', JSON.stringify(newData)); } catch (_) {}
      return { data: newData };
    });
  },

  updateSettings: (newSettings) => {
    set((state) => {
      const nextSettings = { ...state.settings, ...newSettings };
      try { localStorage.setItem('marox_game_settings', JSON.stringify(nextSettings)); } catch (_) {}
      return { settings: nextSettings };
    });
  },
}));
