'use client'

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';

export default function FriendsScreen() {
  const { t } = useTranslation();
  const { data, telegramUser } = useGameStore();
  const [copied, setCopied] = useState(false)
  const userId = telegramUser?.id || 'demo'
  const botUsername = 'MaroxGameBot'
  const inviteLink = `https://t.me/${botUsername}?start=ref_${userId}`

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
    }
  }

  const handleInvite = () => {
    const text = "Join me in MAROX and let's earn rewards together!"
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
