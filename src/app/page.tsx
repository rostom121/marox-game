'use client'

import { useEffect } from 'react'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import '../i18n'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/useGameStore'
import LandingScreen from '../components/LandingScreen'
import SlotScreen from '../components/SlotScreen'
import TasksScreen from '../components/TasksScreen'
import FriendsScreen from '../components/FriendsScreen'
import LeaderboardScreen from '../components/LeaderboardScreen'
import ProfileScreen from '../components/ProfileScreen'
import WelcomeModal from '../components/WelcomeModal'
import ShopScreen from '../components/ShopScreen'

export default function AppRoot() {
  const { activeTab, setTab, initStore, loading, data, settings, isBanned } = useGameStore()
  const { t, i18n } = useTranslation()

  useEffect(() => {
    // Initialise store on mount (client-side only)
    initStore()
  }, [initStore])

  useEffect(() => {
    const langCode = settings.language === 'Russian' ? 'ru' : settings.language === 'French' ? 'fr' : 'en';
    if (i18n.language !== langCode) {
      i18n.changeLanguage(langCode);
    }
  }, [settings.language, i18n])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        background: 'var(--dark-bg)',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--blue)',
        fontSize: '12px',
        fontWeight: 'bold',
        fontFamily: "'Press Start 2P', monospace"
      }}>
        {t('loading')}
      </div>
    )
  }

  if (isBanned) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        background: '#1a0000',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: '#ff4444',
        padding: '20px',
        textAlign: 'center',
        fontFamily: "'Press Start 2P', monospace"
      }}>
        <div style={{ fontSize: '40px', marginBottom: '20px' }}>⛔</div>
        <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>ACCOUNT BANNED</h2>
        <p style={{ marginTop: '20px', fontSize: '10px', lineHeight: '1.5' }}>
          This account has been permanently banned<br/>due to cheating or violation of terms.<br/>You can no longer play Marox.
        </p>
      </div>
    )
  }

  const TABS = [
    { id: 'home', icon: '🏠', label: t('nav_home') },
    { id: 'slot', icon: '🎰', label: t('nav_slot') },
    { id: 'missions', icon: '📜', label: t('nav_tasks') },
    { id: 'friends', icon: '👥', label: t('nav_friends') },
    { id: 'leaderboard', icon: '🏆', label: t('nav_rank') },
    { id: 'profile', icon: '👤', label: t('nav_profile') },
  ]

  return (
    <TonConnectUIProvider manifestUrl="https://marox-game.vercel.app/tonconnect-manifest.json">
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        <WelcomeModal />
        {/* Active Tab Screen */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'home' && <LandingScreen navigate={setTab} />}
          {activeTab === 'slot' && <SlotScreen />}
          {activeTab === 'shop' && <ShopScreen />}
          {activeTab === 'missions' && <TasksScreen />}
          {activeTab === 'friends' && <FriendsScreen />}
          {activeTab === 'leaderboard' && <LeaderboardScreen />}
          {activeTab === 'profile' && <ProfileScreen />}
        </div>

        {/* Bottom Navigation */}
        <nav className="bottom-nav">
          {TABS.map((tTab) => (
            <button
              key={tTab.id}
              className={`nav-btn ${activeTab === tTab.id ? 'active' : ''}`}
              onClick={() => setTab(tTab.id)}
            >
              <div className="nav-icon-wrap">{tTab.icon}</div>
              <span className="nav-label">{tTab.label}</span>
              {activeTab === tTab.id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
      </div>
    </TonConnectUIProvider>
  )
}
