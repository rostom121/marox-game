import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      // Navigation
      nav_home: 'Home',
      nav_slot: 'Slot',
      nav_tasks: 'Tasks',
      nav_friends: 'Friends',
      nav_rank: 'Rank',
      nav_profile: 'Profile',
      
      // General
      loading: 'Loading MAROX...',
      close: 'CLOSE',
      play_now: 'PLAY NOW',
      welcome: 'Welcome to MAROX',
      welcome_desc: 'Spin the reels, complete tasks, and earn rewards!',
      awesome: 'AWESOME!',
      buy: 'Buy',
      choose_username: 'CHOOSE USERNAME',
      choose_username_desc: 'Enter a unique username to be used in the game and leaderboards.',
      start_game: 'START GAME',
      
      // Slot Screen
      slot_tasks: 'Tasks',
      slot_daily: 'Daily',
      slot_rank: 'Rank',
      slot_refs: 'Refs',
      slot_feats: 'Feats',
      slot_shop: 'Shop',
      slot_items: 'Items',
      slot_wallet: 'Wallet',
      slot_setup: 'Setup',
      slot_lang: 'Lang',
      spin: 'SPIN',
      auto: 'AUTO',
      bet: 'BET',
      energy: 'ENERGY',
      out_of_energy: 'OUT OF ENERGY!',
      out_of_energy_desc: 'Your energy has depleted. Grab more from the store to keep spinning!',
      buy_energy: '⚡ BUY ENERGY',
      
      // Settings
      settings: 'SETTINGS',
      audio: 'Audio',
      sound: 'Sound',
      mute: 'MUTE 🔊',
      unmute: 'UNMUTE 🔇',
      volume: 'Volume',
      language: 'Language',
      
      // Tasks
      missions_title: 'MISSIONS & TASKS',
      new_tasks: 'NEW TASKS',
      completed_tasks: 'COMPLETED',
      reward: 'Reward',
      do_it: 'Do it',
      verifying: 'VERIFYING...',
      completed: 'Completed',
      
      // Friends
      invite_title: 'INVITE FRIENDS',
      invite_desc: 'Invite a friend and earn +1000 Coins and +100 Energy for each!',
      invite_btn: 'INVITE FRIEND',
      copy_link: 'COPY LINK',
      no_friends: 'No friends invited yet',
      friend_reward: 'You get 1000 Coins per friend',
      
      // Leaderboard
      top_players: 'TOP PLAYERS',
      rank_col: 'Rank',
      player_col: 'Player',
      score_col: 'Score',
      
      // Profile
      profile_title: 'PLAYER PROFILE',
      level: 'LEVEL',
      to_next_level: 'to next level',
      wallet_address: 'Wallet Address',
      not_connected: 'Not Connected',
      ton_wallet: 'TON WALLET',
      ton_wallet_desc_connected: 'Connected:',
      ton_wallet_desc_not: 'Connect your Web3 wallet to receive token rewards and NFTs!',
      
      // Shop
      shop_title: 'SHOP',
      energy_packs: 'Energy Packs',
      daily_special: 'Daily Special',
      
      // Upgrades
      upgrade_cost: 'Upgrade Cost',
      progress_to_level: 'Progress to Level',
      upgrade_level: 'UPGRADE LEVEL',
      total_gold: 'Total Gold',
      level_up: 'LEVEL UP!',
      congratulations: 'Congratulations',
      reached_new_level: 'You have reached a new level.',
      
      // Daily Rewards
      daily_rewards: 'DAILY REWARDS',
      day: 'Day',
      claim: 'CLAIM',
      come_back_tomorrow: 'Come back tomorrow',
    }
  },

  ru: {
    translation: {
      // Navigation
      nav_home: 'Главная',
      nav_slot: 'Слот',
      nav_tasks: 'Задания',
      nav_friends: 'Друзья',
      nav_rank: 'Рейтинг',
      nav_profile: 'Профиль',
      
      // General
      loading: 'Загрузка MAROX...',
      close: 'ЗАКРЫТЬ',
      play_now: 'ИГРАТЬ',
      welcome: 'Добро пожаловать в MAROX',
      welcome_desc: 'Крутите барабаны, выполняйте задания и получайте награды!',
      awesome: 'ОТЛИЧНО!',
      buy: 'Купить',
      choose_username: 'ВЫБРАТЬ ИМЯ',
      choose_username_desc: 'Введите уникальное имя пользователя для игры и таблиц лидеров.',
      start_game: 'НАЧАТЬ ИГРУ',
      
      // Slot Screen
      slot_tasks: 'Задания',
      slot_daily: 'Ежедневн.',
      slot_rank: 'Рейтинг',
      slot_refs: 'Реф.',
      slot_feats: 'Достиж.',
      slot_shop: 'Магазин',
      slot_items: 'Вещи',
      slot_wallet: 'Кошелек',
      slot_setup: 'Настр.',
      slot_lang: 'Язык',
      spin: 'КРУТИТЬ',
      auto: 'АВТО',
      bet: 'СТАВКА',
      energy: 'ЭНЕРГИЯ',
      out_of_energy: 'НЕТ ЭНЕРГИИ!',
      out_of_energy_desc: 'Ваша энергия исчерпана. Получите больше в магазине!',
      buy_energy: '⚡ КУПИТЬ ЭНЕРГИЮ',
      
      // Settings
      settings: 'НАСТРОЙКИ',
      audio: 'Аудио',
      sound: 'Звук',
      mute: 'ВКЛ 🔊',
      unmute: 'ВЫКЛ 🔇',
      volume: 'Громкость',
      language: 'Язык',
      
      // Tasks
      missions_title: 'ЗАДАНИЯ И МИССИИ',
      new_tasks: 'НОВЫЕ',
      completed_tasks: 'ЗАВЕРШЕННЫЕ',
      reward: 'Награда',
      do_it: 'Выполнить',
      verifying: 'ПРОВЕРКА...',
      completed: 'Завершено',
      
      // Friends
      invite_title: 'ПРИГЛАСИТЬ ДРУЗЕЙ',
      invite_desc: 'Пригласи друга и получи +1000 Монет и +100 Энергии!',
      invite_btn: 'ПРИГЛАСИТЬ ДРУГА',
      copy_link: 'СКОПИРОВАТЬ ССЫЛКУ',
      no_friends: 'Пока нет приглашенных друзей',
      friend_reward: '1000 монет за друга',
      
      // Leaderboard
      top_players: 'ТОП ИГРОКОВ',
      rank_col: 'Место',
      player_col: 'Игрок',
      score_col: 'Очки',
      
      // Profile
      profile_title: 'ПРОФИЛЬ ИГРОКА',
      level: 'УРОВЕНЬ',
      to_next_level: 'до след. уровня',
      wallet_address: 'Адрес кошелька',
      not_connected: 'Не подключен',
      ton_wallet: 'КОШЕЛЕК TON',
      ton_wallet_desc_connected: 'Подключено:',
      ton_wallet_desc_not: 'Подключите Web3 кошелек для получения наград и NFT!',
      
      // Shop
      shop_title: 'МАГАЗИН',
      energy_packs: 'Пакеты Энергии',
      daily_special: 'Специальное',
      
      // Upgrades
      upgrade_cost: 'Стоимость',
      progress_to_level: 'Прогресс до',
      upgrade_level: 'УЛУЧШИТЬ',
      total_gold: 'Всего золота',
      level_up: 'НОВЫЙ УРОВЕНЬ!',
      congratulations: 'Поздравляем',
      reached_new_level: 'Вы достигли нового уровня.',
      
      // Daily Rewards
      daily_rewards: 'ЕЖЕДНЕВНЫЕ НАГРАДЫ',
      day: 'День',
      claim: 'ПОЛУЧИТЬ',
      come_back_tomorrow: 'Возвращайтесь завтра',
    }
  },
  fr: {
    translation: {
      // Navigation
      nav_home: 'Accueil',
      nav_slot: 'Slot',
      nav_tasks: 'Tâches',
      nav_friends: 'Amis',
      nav_rank: 'Classement',
      nav_profile: 'Profil',
      
      // General
      loading: 'Chargement MAROX...',
      close: 'FERMER',
      play_now: 'JOUER',
      welcome: 'Bienvenue chez MAROX',
      welcome_desc: 'Faites tourner, accomplissez des tâches et gagnez!',
      awesome: 'GÉNIAL!',
      buy: 'Acheter',
      choose_username: 'CHOISIR UN NOM',
      choose_username_desc: 'Entrez un nom d\'utilisateur unique pour le jeu et les classements.',
      start_game: 'COMMENCER',
      
      // Slot Screen
      slot_tasks: 'Tâches',
      slot_daily: 'Quotidien',
      slot_rank: 'Classement',
      slot_refs: 'Réf.',
      slot_feats: 'Exploits',
      slot_shop: 'Boutique',
      slot_items: 'Objets',
      slot_wallet: 'Portefeuille',
      slot_setup: 'Config',
      slot_lang: 'Langue',
      spin: 'TOURNER',
      auto: 'AUTO',
      bet: 'MISE',
      energy: 'ÉNERGIE',
      out_of_energy: 'PLUS D\'ÉNERGIE!',
      out_of_energy_desc: 'Votre énergie est épuisée. Obtenez-en plus dans la boutique!',
      buy_energy: '⚡ ACHETER DE L\'ÉNERGIE',
      
      // Settings
      settings: 'PARAMÈTRES',
      audio: 'Audio',
      sound: 'Son',
      mute: 'MUTE 🔊',
      unmute: 'UNMUTE 🔇',
      volume: 'Volume',
      language: 'Langue',
      
      // Tasks
      missions_title: 'MISSIONS ET TÂCHES',
      new_tasks: 'NOUVELLES',
      completed_tasks: 'TERMINÉES',
      reward: 'Récompense',
      do_it: 'Faire',
      verifying: 'VÉRIFICATION...',
      completed: 'Terminé',
      
      // Friends
      invite_title: 'INVITER DES AMIS',
      invite_desc: 'Invitez un ami et gagnez +1000 Pièces et +100 Énergie!',
      invite_btn: 'INVITER UN AMI',
      copy_link: 'COPIER LE LIEN',
      no_friends: 'Aucun ami invité',
      friend_reward: '1000 pièces par ami',
      
      // Leaderboard
      top_players: 'MEILLEURS JOUEURS',
      rank_col: 'Rang',
      player_col: 'Joueur',
      score_col: 'Score',
      
      // Profile
      profile_title: 'PROFIL DU JOUEUR',
      level: 'NIVEAU',
      to_next_level: 'au niveau suivant',
      wallet_address: 'Adresse du Portefeuille',
      not_connected: 'Non connecté',
      ton_wallet: 'PORTEFEUILLE TON',
      ton_wallet_desc_connected: 'Connecté:',
      ton_wallet_desc_not: 'Connectez votre portefeuille Web3 pour recevoir des récompenses!',
      
      // Shop
      shop_title: 'BOUTIQUE',
      energy_packs: 'Packs d\'Énergie',
      daily_special: 'Spécial Quotidien',
      
      // Upgrades
      upgrade_cost: 'Coût',
      progress_to_level: 'Progrès au Niveau',
      upgrade_level: 'AMÉLIORER',
      total_gold: 'Or Total',
      level_up: 'NIVEAU SUPÉRIEUR!',
      congratulations: 'Félicitations',
      reached_new_level: 'Vous avez atteint un nouveau niveau.',
      
      // Daily Rewards
      daily_rewards: 'RÉCOMPENSES QUOTIDIENNES',
      day: 'Jour',
      claim: 'RÉCLAMER',
      come_back_tomorrow: 'Revenez demain',
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
