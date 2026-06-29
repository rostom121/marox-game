'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/useGameStore'
import { gameConfig } from '../config/gameConfig'
import { PixiSlotMachine } from './PixiSlotMachine'
import PlayerInfoModal from './PlayerInfoModal'
import DailyRewardModal from './DailyRewardModal'

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  color: string
  life: number
  maxLife: number
  emoji?: string
  rotation?: number
  vRot?: number
}

const PARTICLE_COLORS = ['#ffb700', '#00d2ff', '#9d4edd', '#ff3333', '#ffffff']

const AVAILABLE_BETS = [1, 2, 3, 4, 5, 10, 25, 50, 100, 150, 250, 500, 1000];

export default function SlotScreen() {
  const { t } = useTranslation()
  const { data, telegramUser, spinOutcome, setTab, settings, updateSettings } = useGameStore()
  
  const allowedBets = useMemo(() => {
    if (data.energy >= 20000) return AVAILABLE_BETS;
    if (data.energy >= 10000) return AVAILABLE_BETS.slice(0, 12);
    if (data.energy >= 5000) return AVAILABLE_BETS.slice(0, 11);
    if (data.energy >= 3000) return AVAILABLE_BETS.slice(0, 10);
    if (data.energy >= 2000) return AVAILABLE_BETS.slice(0, 9);
    if (data.energy >= 1000) return AVAILABLE_BETS.slice(0, 8);
    if (data.energy >= 500) return AVAILABLE_BETS.slice(0, 7);
    if (data.energy >= 200) return AVAILABLE_BETS.slice(0, 6);
    return AVAILABLE_BETS.slice(0, 5); // 1, 2, 3, 4, 5
  }, [data.energy]);

  const [modalType, setModalType] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showLangModal, setShowLangModal] = useState(false)
  const [bet, setBet] = useState(5)
  const [spinData, setSpinData] = useState<{ finalGrid: string[][], winnerRows: number[], payout: { points: number, coins: number, energyWin: number } } | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [winMessage, setWinMessage] = useState<string | null>('SPIN, EARN MAROX!')
  const [autoSpin, setAutoSpin] = useState(false)
  const [lastWin, setLastWin] = useState<number | null>(null)
  const particleCanvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const particleRafRef = useRef<number>(0)

  const latestRef = useRef({ spinning, energy: data.energy, bet, autoSpin })
  latestRef.current = { spinning, energy: data.energy, bet, autoSpin }

  // We removed the useEffect that auto-decreases the bet so players can keep their unlocked bets.

  // Continuous ambient particle system
  useEffect(() => {
    const canvas = particleCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0

    const spawnParticle = () => {
      particlesRef.current.push({
        id: Math.random(),
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(0.5 + Math.random() * 1.2),
        size: 1 + Math.random() * 3,
        alpha: 0.6 + Math.random() * 0.4,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        life: 0,
        maxLife: 80 + Math.random() * 80,
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame++

      if (frame % 8 === 0) spawnParticle()

      particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife)
      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.life++
        const t = p.life / p.maxLife
        const alpha = p.alpha * (1 - t * t)

        if (p.emoji) {
          ctx.save()
          ctx.translate(p.x, p.y)
          if (p.rotation !== undefined) ctx.rotate(p.rotation)
          ctx.globalAlpha = alpha
          ctx.font = `${p.size}px serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(p.emoji, 0, 0)
          ctx.restore()
          if (p.rotation !== undefined && p.vRot !== undefined) {
            p.rotation += p.vRot
          }
          p.vy += 0.8 // Gravity
        } else {
          ctx.save()
          ctx.globalAlpha = alpha
          ctx.fillStyle = p.color
          ctx.shadowColor = p.color
          ctx.shadowBlur = 6
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      }

      particleRafRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(particleRafRef.current)
  }, [])

  const triggerBurst = useCallback((type: 'coins' | 'points' | 'energy') => {
    const canvas = particleCanvasRef.current
    if (!canvas) return

    let emoji = '🪙'
    let count = 40
    if (type === 'points') {
      emoji = '⭐'
      count = 30
    }
    if (type === 'energy') {
      emoji = '⚡'
      count = 30
    }

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 15 + 5
      particlesRef.current.push({
        id: Math.random(),
        x: canvas.width / 2,
        y: canvas.height / 2 + 30, // Burst from slightly below center
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 15,
        size: Math.random() * 20 + 20, // large emoji
        alpha: 1,
        color: '#fff',
        life: 0,
        maxLife: Math.random() * 40 + 60,
        emoji: emoji,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.4
      })
    }
  }, [])

  const changeBet = (diff: number) => {
    if (spinning) return
    const currentIndex = AVAILABLE_BETS.indexOf(bet);
    let nextIndex = currentIndex + diff;
    if (nextIndex < 0) nextIndex = 0;
    if (nextIndex >= AVAILABLE_BETS.length) nextIndex = AVAILABLE_BETS.length - 1;
    
    const nextBet = AVAILABLE_BETS[nextIndex];

    // If trying to increase the bet, they can only do so if the next bet is within their allowed bets.
    if (diff > 0 && !allowedBets.includes(nextBet)) {
      return;
    }

    setBet(nextBet);
  }

  const playRetroSpinSound = useCallback(() => {
    if (settings.isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      let time = ctx.currentTime;
      for (let i = 0; i < 20; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(400 + (i % 3) * 200 + Math.random() * 100, time);
        gain.gain.setValueAtTime(0.03 * settings.volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        osc.start(time);
        osc.stop(time + 0.08);
        time += 0.08;
      }
    } catch(e) {}
  }, [settings.isMuted, settings.volume])

  const playRetroWinSound = useCallback(() => {
    if (settings.isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      let time = ctx.currentTime;
      
      const burstOsc = ctx.createOscillator();
      const burstGain = ctx.createGain();
      burstOsc.connect(burstGain);
      burstGain.connect(ctx.destination);
      burstOsc.type = 'sawtooth';
      burstOsc.frequency.setValueAtTime(300, time);
      burstOsc.frequency.exponentialRampToValueAtTime(50, time + 0.3);
      burstGain.gain.setValueAtTime(0.1 * settings.volume, time);
      burstGain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
      burstOsc.start(time);
      burstOsc.stop(time + 0.3);

      const notes = [880, 1108, 1318, 1760, 2217];
      for (let i = 0; i < 15; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(notes[i % notes.length], time + (i * 0.06));
        gain.gain.setValueAtTime(0, time + (i * 0.06));
        gain.gain.linearRampToValueAtTime(0.1 * settings.volume, time + (i * 0.06) + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + (i * 0.06) + 0.2);
        osc.start(time + (i * 0.06));
        osc.stop(time + (i * 0.06) + 0.2);
      }
    } catch(e) {}
  }, [settings.isMuted, settings.volume])

  const handleSpinClick = useCallback(async () => {
    if (latestRef.current.spinning || latestRef.current.energy < latestRef.current.bet) {
      if (!latestRef.current.spinning && latestRef.current.energy < latestRef.current.bet) {
        showModal('no_energy')
      }
      setAutoSpin(false)
      return
    }
    setSpinning(true)
    playRetroSpinSound()
    latestRef.current.spinning = true
    setWinMessage(null)
    setLastWin(null)
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://marox-game-production.up.railway.app';
    try {
      const res = await fetch(`${API_URL}/api/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: telegramUser?.id, bet: latestRef.current.bet })
      });
      const resData = await res.json();
      if (resData.ok && resData.spin) {
        useGameStore.getState().setServerData(resData.user);
        setSpinData(resData.spin);
      } else {
        setSpinning(false);
        latestRef.current.spinning = false;
        setAutoSpin(false);
      }
    } catch (e) {
      setSpinning(false);
      latestRef.current.spinning = false;
      setAutoSpin(false);
    }
  }, [playRetroSpinSound, telegramUser])

  const handleSpinResult = useCallback((payout: { points: number; coins: number; energyWin: number }) => {
    setSpinning(false)
    latestRef.current.spinning = false

    const currentBet = latestRef.current.bet
    const scaledCoins = payout.coins
    const scaledPts = payout.points
    const scaledEnergy = payout.energyWin

    if (payout.coins > 0) {
      playRetroWinSound()
      setWinMessage(`🪙 WIN! +${scaledCoins} COINS`)
      setLastWin(scaledCoins)
      triggerBurst('coins')
    } else if (payout.points > 0) {
      playRetroWinSound()
      setWinMessage(`⭐ WIN! +${scaledPts} MAROX`)
      setLastWin(scaledPts)
      triggerBurst('points')
    } else if (payout.energyWin > 0) {
      playRetroWinSound()
      setWinMessage(`⚡ WIN! +${scaledEnergy} ENERGY`)
      setLastWin(scaledEnergy)
      triggerBurst('energy')
    } else if (payout.coins < 0) {
      setWinMessage(`❌ OUCH! ${scaledCoins} COINS`)
      setLastWin(null)
    } else {
      setWinMessage('TRY AGAIN!')
      setLastWin(null)
    }

    // Auto spin continuation
    if (latestRef.current.autoSpin) {
      setTimeout(() => {
        if (latestRef.current.autoSpin) handleSpinClick()
      }, 500)
    }
  }, [spinOutcome, handleSpinClick])

  const showModal = (type: string) => {
    setModalType(type)
  }

  const isWin = lastWin !== null

  return (
    <div className="slot-screen-root">
      {/* Ambient particle canvas */}
      <canvas
        ref={particleCanvasRef}
        width={400}
        height={600}
        className="slot-ambient-canvas"
      />

      {/* ── TOP HEADER ── */}
      <header className="slot-header">
        <div className="slot-header-left" onClick={() => showModal('avatar')}>
          <div className="slot-avatar-wrap">
            <img
              src={telegramUser?.photoUrl || "/marox.png"}
              onError={(e: any) => { e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23e63946'/><circle cx='50' cy='55' r='20' fill='%23fff'/><rect x='35' y='18' width='30' height='18' fill='%23fff' rx='4'/></svg>" }}
              alt="Avatar"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="slot-player-info">
            <span className="slot-player-name">{data.gameUsername || telegramUser?.firstName || 'Player'}</span>
            <span className="slot-player-level">LV {data.level}</span>
            <div className="slot-xp-bar">
              <div className="slot-xp-fill" style={{ width: `${data.xp}%` }} />
            </div>
          </div>
        </div>

        <div className="slot-title-center">
          <div className="slot-title-text pixel-text">MAROX</div>
          <div className="slot-title-sub">SLOT ADVENTURE</div>
        </div>

        <div className="slot-header-right">
          <div className="slot-stat-chip gold">
            <span>🪙</span>
            <span>{data.coins.toLocaleString()}</span>
          </div>
          <div className="slot-stat-chip purple">
            <span>⭐</span>
            <span>{data.points.toLocaleString()} MRX$</span>
          </div>
        </div>
      </header>

      {/* ── THREE COLUMN LAYOUT (sidebars + center) ── */}
      <div className="slot-mid-layout">
        {/* Left Sidebar */}
        <aside className="slot-sidebar">
          {[
            { emoji: '📜', label: t('slot_tasks'), action: () => setTab('missions'), badge: true },
            { emoji: '🎁', label: t('slot_daily'), action: () => showModal('daily') },
            { emoji: '🏆', label: t('slot_rank'), action: () => setTab('leaderboard') },
            { emoji: '👥', label: t('slot_refs'), action: () => setTab('friends') },
            { emoji: '⭐', label: t('slot_feats'), action: () => showModal('achievements') },
          ].map((btn) => (
            <button key={btn.label} className="slot-sidebar-btn" onClick={btn.action}>
              {btn.badge && <span className="slot-sidebar-badge" />}
              <span className="slot-sidebar-emoji">{btn.emoji}</span>
              <span className="slot-sidebar-label">{btn.label}</span>
            </button>
          ))}
        </aside>

        {/* Center — background image visible here */}
        <div className="slot-center-bg" />

        {/* Right Sidebar */}
        <aside className="slot-sidebar">
          {[
            { emoji: '🛒', label: t('slot_shop'), action: () => setTab('shop') },
            { emoji: '📦', label: t('slot_items'), action: () => showModal('inventory') },
            { emoji: '👛', label: t('slot_wallet'), action: () => setTab('profile') },
            { emoji: '⚙️', label: t('slot_setup'), action: () => setShowSettings(true) },
            { emoji: '🌐', label: t('lang'), action: () => setShowLangModal(true) },
          ].map((btn) => (
            <button key={btn.label} className="slot-sidebar-btn" onClick={btn.action}>
              <span className="slot-sidebar-emoji">{btn.emoji}</span>
              <span className="slot-sidebar-label">{btn.label}</span>
            </button>
          ))}
        </aside>
      </div>

      {/* ── SLOT MACHINE CABINET ── */}
      <div className={`slot-cabinet-outer ${isWin ? 'win-glow' : ''}`}>
        <div className="slot-cabinet-outer-inner-line"></div>

        {/* Marquee Logo Header */}
        <div className="slot-marquee-header">
          <div className="slot-marquee-lights left">
            <div className="marquee-light"></div>
            <div className="marquee-light"></div>
            <div className="marquee-light"></div>
          </div>

          <div className="slot-logo-wrapper">
            <div className="slot-wing left">💎</div>
            <div className={`slot-logo-container ${isWin ? 'win-pulse' : ''}`}>
              <img src="/marox-logo.png" alt="MAROX" className="slot-marquee-logo" />
            </div>
            <div className="slot-wing right">💎</div>
          </div>

          <div className="slot-marquee-lights right">
            <div className="marquee-light"></div>
            <div className="marquee-light"></div>
            <div className="marquee-light"></div>
          </div>
        </div>

        {/* LED marquee banner */}
        <div className={`slot-led-banner pixel-text ${isWin ? 'win-banner' : ''}`}>
          {winMessage || '◄ SPIN, EARN MAROX! ►'}
        </div>

        {/* Reels board */}
        <div className="slot-reels-board">
          <PixiSlotMachine spinData={spinData} onResult={handleSpinResult} />
          <div className="slot-glass-overlay"></div>
        </div>

        {/* Controls bar */}
        <div className="slot-controls-bar">
          <button
            className={`slot-auto-btn pixel-text ${autoSpin ? 'active' : ''}`}
            onClick={() => {
              const nextState = !autoSpin
              setAutoSpin(nextState)
              if (nextState && !spinning) {
                setTimeout(handleSpinClick, 50)
              }
            }}
          >
            {autoSpin ? 'STOP\nAUTO' : 'AUTO\nSPIN'}
          </button>

          <div className="slot-spin-group">
            <div className="slot-energy-badge">
              ⚡ {data.energy}
            </div>
            <button
              className="slot-spin-btn"
              disabled={spinning || data.energy < bet}
              onClick={handleSpinClick}
            >
              <span className="slot-spin-title pixel-text">{spinning ? '...' : 'SPIN'}</span>
              <span className="slot-spin-sub">Hold for Auto</span>
            </button>
          </div>

          <div className="slot-bet-panel">
            <span className="slot-bet-label">BET ENERGY</span>
            <div className="slot-bet-row">
              <button className="slot-bet-adj" onClick={() => changeBet(-1)}>−</button>
              <span className="slot-bet-val pixel-text">{bet}</span>
              <button className="slot-bet-adj" onClick={() => changeBet(1)}>+</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      {modalType && modalType !== 'avatar' && modalType !== 'daily' && (
        <div className="welcome-modal-overlay" onClick={() => setModalType(null)} style={{ zIndex: 2000 }}>
          <div className="welcome-modal-card card" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '320px', width: 'fit-content', padding: '20px 15px' }}>
            <button className="red-glow-close-btn" onClick={() => setModalType(null)}>✕</button>
            <div style={{ fontSize: 50, marginTop: '10px' }}>⚡</div>
            <h2 className="pixel-text" style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--blue)' }}>
              {modalType === 'inventory' && 'Inventory Items'}
              {modalType === 'achievements' && 'Achievements'}
              {modalType === 'shop' && 'Store Shop'}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.8, margin: '10px 0 20px' }}>
              {modalType === 'inventory' && 'Equip boosters, backgrounds, and custom symbols here.'}
              {modalType === 'achievements' && 'Earn medals for reaching high spin milestones and leveling up.'}
              {modalType === 'shop' && 'Purchase energy refuels, profile frames, and exclusive tokens with Gold Coins!'}
            </p>
          </div>
        </div>
      )}

      {modalType === 'daily' && (
        <DailyRewardModal onClose={() => setModalType(null)} />
      )}

      {modalType === 'no_energy' && (
        <div className="slot-modal-overlay">
          <div className="slot-modal-card pixel-text" style={{ padding: '24px', textAlign: 'center', width: '300px' }}>
            <h2 style={{ color: '#ff3333', fontSize: '20px', marginBottom: '10px' }}>{t('out_of_energy')}</h2>
            <p style={{ color: '#fff', fontSize: '10px', marginBottom: '20px', lineHeight: '1.5' }}>
              {t('out_of_energy_desc')}
            </p>
            <button className="slot-btn primary pixel-text" style={{ padding: '12px 20px', marginBottom: '12px', width: '100%', fontSize: '12px' }} onClick={() => { setModalType(null); setTab('shop'); }}>
              {t('buy_energy')}
            </button>
            <button className="slot-btn pixel-text" style={{ padding: '10px 20px', background: 'transparent', border: '2px solid #555', color: '#aaa', width: '100%', fontSize: '10px' }} onClick={() => setModalType(null)}>
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {modalType === 'avatar' && (
        <PlayerInfoModal onClose={() => setModalType(null)} />
      )}
      {/* ── SETTINGS MODAL ── */}
      {showSettings && (
        <div className="player-modal-overlay" style={{ zIndex: 5000, position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowSettings(false)}>
          <div className="player-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: '320px', padding: '20px', background: 'linear-gradient(180deg, #160f29 0%, #0d081a 100%)', border: '2px solid var(--border-neon)', borderRadius: '16px', boxShadow: '0 0 30px rgba(0,0,0,0.8)' }}>
            <button className="red-glow-close-btn" onClick={() => setShowSettings(false)}>✕</button>
            <h2 className="pixel-text gold-text" style={{ fontSize: '16px', textAlign: 'center', marginBottom: '20px', textShadow: '0 0 10px var(--gold)' }}>{t('settings')}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card" style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                <h3 style={{ color: '#fff', fontSize: '14px', marginBottom: '15px' }}>{t('audio')}</h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>{t('sound')}</span>
                  <button onClick={() => updateSettings({ isMuted: !settings.isMuted })} style={{
                    background: settings.isMuted ? 'rgba(255,51,51,0.2)' : 'rgba(0,210,255,0.2)',
                    color: settings.isMuted ? '#ff3333' : '#00d2ff',
                    border: `1px solid ${settings.isMuted ? '#ff3333' : '#00d2ff'}`,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    minWidth: '80px'
                  }}>
                    {settings.isMuted ? t('unmute') : t('mute')}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>{t('volume')}</span>
                    <span style={{ color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}>{Math.round(settings.volume * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.1" 
                    value={settings.volume} 
                    onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
                    style={{ width: '100%', accentColor: 'var(--blue)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LANG MODAL ── */}
      {showLangModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }} onClick={() => setShowLangModal(false)}>
          <div style={{
            background: 'var(--panel-bg)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            width: '90%', maxWidth: '350px',
            padding: '24px',
            position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowLangModal(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
            >
              ✕
            </button>
            <h2 style={{ color: '#fff', fontSize: '20px', marginBottom: '24px', textAlign: 'center', fontFamily: "'Press Start 2P', monospace" }}>
              LANG
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card" style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['English', 'Russian', 'French'].map(lang => (
                    <button 
                      key={lang}
                      onClick={() => updateSettings({ language: lang })}
                      style={{
                        background: settings.language === lang ? 'rgba(0,210,255,0.15)' : 'transparent',
                        border: settings.language === lang ? '1px solid var(--blue)' : '1px solid rgba(255,255,255,0.1)',
                        color: settings.language === lang ? '#fff' : 'var(--text-dim)',
                        padding: '12px',
                        borderRadius: '8px',
                        textAlign: 'left',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>
                        {lang === 'English' ? '🇺🇸' : lang === 'Russian' ? '🇷🇺' : '🇫🇷'}
                      </span>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
