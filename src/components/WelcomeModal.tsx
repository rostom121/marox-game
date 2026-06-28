'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '../store/useGameStore'

export default function WelcomeModal() {
  const { telegramUser, updateStats } = useGameStore()
  const [show, setShow] = useState(false)
  const [rewards, setRewards] = useState({ points: 500, energy: 20 })

  useEffect(() => {
    // Check if user has already claimed welcome rewards
    const claimed = localStorage.getItem('marox_welcome_claimed')
    if (claimed) return

    // Calculate rewards
    let pts = 500
    let nrg = 20

    if (telegramUser?.premium) {
      pts += 1000
      nrg += 50
    }

    // Try reading Telegram ID for ID age reward
    if (telegramUser?.id) {
      const idNum = Number(telegramUser.id)
      if (!isNaN(idNum) && idNum < 2000000000) {
        pts += 500 // OG bonus
      }
    }

    setRewards({ points: pts, energy: nrg })
    setShow(true)
  }, [telegramUser])

  const handleClaim = () => {
    updateStats(rewards.points, 0, rewards.energy)
    localStorage.setItem('marox_welcome_claimed', 'true')
    setShow(false)

    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
    }
  }

  if (!show) return null

  return (
    <div className="welcome-modal-overlay">
      <div className="welcome-modal-card card">
        <div className="welcome-star">🏆</div>
        <h2 className="pixel-text welcome-title">WELCOME BONUS</h2>
        <p className="welcome-desc">
          Thanks for joining MAROX Slot Adventure! We calculated your account age and Telegram status to award you these starting bonuses:
        </p>

        <div className="reward-breakdown">
          <div className="reward-row">
            <span className="reward-name">🪙 Points Reward</span>
            <span className="reward-value">+{rewards.points}</span>
          </div>
          <div className="reward-row energy">
            <span className="reward-name">⚡ Energy Bonus</span>
            <span className="reward-value">+{rewards.energy}</span>
          </div>
          {telegramUser?.premium && (
            <div className="reward-row premium">
              <span className="reward-name">✨ Premium Boost</span>
              <span className="reward-value">Included</span>
            </div>
          )}
        </div>

        <button className="claim-btn pixel-text" onClick={handleClaim} style={{ marginTop: '8px' }}>
          CLAIM BONUS
        </button>
      </div>
    </div>
  )
}
