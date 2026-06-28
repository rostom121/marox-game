'use client'

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';

export default function FriendsScreen() {
  const { t } = useTranslation();
  const { data, telegramUser } = useGameStore();
  const [copied, setCopied] = useState(false)
  const userId = telegramUser?.id || 'demo'
  const botUsername = 'Maroxcoinbot'
  const inviteLink = `https://t.me/${botUsername}/play?startapp=ref_${userId}`

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
    }
  }

  const handleInvite = () => {
    const text = "🎮 Spin the slots, collect points, and level up in MAROX Slot Adventure! 🎰⚡ Join me and let's earn massive rewards together! 💎🔥"
    const url = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`
    
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(url)
    } else {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="page" style={{ padding: '16px 12px' }}>
      <header className="page-header">
        <h1 className="pixel-text gold-text glow-text" style={{ fontSize: '20px', textShadow: '0 0 10px var(--gold)' }}>{t('invite_title')}</h1>
        <div className="accent-line" style={{ background: 'var(--blue)', boxShadow: '0 0 10px var(--blue)' }} />
      </header>

      {/* Main CTA */}
      <div className="card" style={{ padding: '24px 20px', textAlign: 'center', background: 'rgba(0, 210, 255, 0.05)', border: '1px solid rgba(0, 210, 255, 0.2)', marginBottom: '20px' }}>
        <div style={{ fontSize: '44px', marginBottom: '8px' }}>👥</div>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '20px' }}>
          {t('invite_desc')}
        </p>

        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <button className="invite-btn pixel-text" onClick={handleInvite} style={{ background: 'var(--blue)', color: '#000', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}>
            {t('invite_btn')}
          </button>
          <button className="copy-btn pixel-text" onClick={handleCopy} style={{ background: 'transparent', color: 'var(--blue)', border: '2px solid var(--blue)', padding: '10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '10px' }}>
            {copied ? 'COPIED!' : t('copy_link')}
          </button>
        </div>
      </div>

      {/* Rewards Info */}
      <div className="card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '12px', color: 'var(--gold)', marginBottom: '12px' }}>🎁 Invite Rewards</h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>👤</span>
            <span style={{ fontSize: '10px', color: '#fff' }}>Standard Telegram</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--green)', fontWeight: 'bold' }}>+500 MAROX, +100 COINS</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>⭐️</span>
            <span style={{ fontSize: '10px', color: '#fff' }}>Telegram Premium</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--green)', fontWeight: 'bold' }}>+1000 MAROX, +200 COINS</div>
        </div>
      </div>

      {/* Stats list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        <div className="friends-list card" style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '30px', marginBottom: '10px' }}>🚷</div>
          <h3 style={{ color: '#fff', fontSize: '14px', marginBottom: '5px' }}>{t('no_friends')}</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '10px' }}>{t('friend_reward')}</p>
        </div>
      </div>
    </div>
  )
}
