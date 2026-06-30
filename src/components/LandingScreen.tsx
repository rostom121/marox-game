'use client'

import { useTranslation } from 'react-i18next'

interface LandingProps {
  navigate: (tab: string) => void;
}

export default function LandingScreen({ navigate }: LandingProps) {
  const { t } = useTranslation()

  const handlePlayNow = () => {
    navigate('slot')
  }

  return (
    <div className="landing-root">
      {/* Background image */}
      <div className="landing-bg" />

      {/* ── HEADER ── */}
      <header className="landing-header">
        <h1 className="pixel-text landing-title">MAROX</h1>
        <div className="landing-subtitle-wrapper">
          <span className="landing-subtitle">SLOT ADVENTURE</span>
        </div>
      </header>

      {/* ── PLAY NOW BUTTON ONLY ── */}
      <div className="landing-bottom-action">
        <button className="play-now-btn pixel-text super-glowing-btn" onClick={handlePlayNow}>
          {t('play_now')}
        </button>
        <span className="landing-mini-app-text">game mini app on telegram</span>
      </div>

    </div>
  )
}

