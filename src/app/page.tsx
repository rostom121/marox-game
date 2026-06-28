'use client'

import { useEffect } from 'react'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import '../i18n'
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
  const { activeTab, setTab, initStore, loading, data } = useGameStore()

  useEffect(() => {
    // Initialise store on mount (client-side only)
    initStore()
  }, [initStore])

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
        Loading MAROX...
      </div>
    )
  }

  const TABS = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'slot', icon: '🎰', label: 'Slot' },
    { id: 'missions', icon: '📜', label: 'Tasks' },
    { id: 'friends', icon: '👥', label: 'Friends' },
    { id: 'leaderboard', icon: '🏆', label: 'Rank' },
    { id: 'profile', icon: '👤', label: 'Profile' },
  ]

  return (
    <TonConnectUIProvider manifestUrl="https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json">
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
