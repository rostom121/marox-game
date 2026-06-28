'use client'

import { useState } from 'react'
import { useGameStore } from '../store/useGameStore'

export default function FriendsScreen() {
  const { telegramUser } = useGameStore()
  const [copied, setCopied] = useState(false)
  const userId = telegramUser?.id || 'demo'
  // ضع هنا اسم البوت الخاص بك (Username) بدلاً من YOUR_BOT_USERNAME
  // وضع الاسم المختصر للتطبيق (Short Name) بدلاً من YOUR_APP_SHORT_NAME
  const inviteLink = `https://t.me/Maroxcoinbot/play?startapp=ref_${userId}`

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
    }
  }

  const handleInvite = () => {
    const text = encodeURIComponent(`🎮 Spin the slots, collect points, and level up in MAROX Slot Adventure! 🎰⚡`)
    const url = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${text}`
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(url)
    } else {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="page" style={{ padding: '16px 12px' }}>
      <header className="page-header">
        <h1 className="pixel-text" style={{ fontSize: '15px', color: 'var(--blue)', textShadow: '0 0 10px var(--blue)' }}>INVITE FRIENDS</h1>
        <div className="accent-line" style={{ background: 'var(--blue)', boxShadow: '0 0 10px var(--blue)' }} />
      </header>

      <div className="referral-hero card" style={{ padding: '24px 16px', textAlign: 'center', background: 'rgba(22, 15, 41, 0.6)' }}>
        <div style={{ fontSize: '44px', marginBottom: '8px' }}>👥</div>
        <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Spread the Word!</h2>
        <p style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: 1.6 }}>
          Invite your friends to MAROX! Both of you will receive rewards. Premium users receive massive bonuses!
        </p>

        {/* Reward breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px', textAlign: 'left' }}>
          <div className="card" style={{ padding: '10px', background: 'rgba(0, 210, 255, 0.05)', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--blue)', fontWeight: 'bold' }}>Standard User</div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>+100 Energy</div>
            <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>+5,000 Gold Coins</div>
          </div>
          <div className="card" style={{ padding: '10px', background: 'rgba(255, 183, 0, 0.05)', border: '1px solid rgba(255, 183, 0, 0.2)' }}>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 'bold' }}>Telegram Premium</div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--gold)', marginTop: '4px' }}>+500 Energy</div>
            <div style={{ fontSize: '9px', color: 'var(--gold)' }}>+50,000 Gold Coins</div>
          </div>
        </div>
      </div>

      {/* Invite Link copy block */}
      <div className="card" style={{ padding: '16px', background: 'rgba(22, 15, 41, 0.6)' }}>
        <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 'bold', marginBottom: '6px' }}>Your Referral Link</div>
        <div className="link-box" onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-neon)', borderRadius: '12px', cursor: 'pointer' }}>
          <div style={{ flex: 1, overflow: 'hidden', marginRight: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--blue)', whiteSpace: 'nowrap' }}>{inviteLink}</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--blue)', fontWeight: 'bold' }}>{copied ? 'Copied! 📋' : 'Copy 📋'}</span>
        </div>

        <button className="invite-btn" onClick={handleInvite} style={{ marginTop: '16px', width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: 'var(--blue)', color: '#001020', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0, 210, 255, 0.3)' }}>
          Invite Friends
        </button>
      </div>

      {/* Stats list */}
      <div className="friends-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div className="friends-stat card" style={{ padding: '12px', background: 'rgba(22, 15, 41, 0.6)' }}>
          <div style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 'bold' }}>Friends Invited</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', marginTop: '4px', fontFamily: 'monospace' }}>0</div>
        </div>
        <div className="friends-stat card" style={{ padding: '12px', background: 'rgba(22, 15, 41, 0.6)' }}>
          <div style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 'bold' }}>Points Earned</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--blue)', marginTop: '4px', fontFamily: 'monospace' }}>0</div>
        </div>
      </div>
    </div>
  )
}
