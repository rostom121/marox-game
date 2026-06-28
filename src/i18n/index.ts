import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      home: 'Home',
      slot: 'Slot',
      missions: 'Tasks',
      friends: 'Friends',
      rank: 'Leaderboard',
      profile: 'Profile',
      welcome: 'Welcome to MAROX',
      play_now: 'PLAY NOW',
      daily: 'Daily Rewards',
    }
  },

  ru: {
    translation: {
      home: 'Главная',
      slot: 'Слот',
      missions: 'Задания',
      friends: 'Друзья',
      rank: 'Лидерборд',
      profile: 'Профиль',
      welcome: 'Добро пожаловать в MAROX',
      play_now: 'ИГРАТЬ СЕЙЧАС',
      daily: 'Ежедневные награды',
    }
  },
  fr: {
    translation: {
      home: 'Accueil',
      slot: 'Slot',
      missions: 'Tâches',
      friends: 'Amis',
      rank: 'Classement',
      profile: 'Profil',
      welcome: 'Bienvenue chez MAROX',
      play_now: 'JOUER MAINTENANT',
      daily: 'Récompenses Quotidiennes',
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
