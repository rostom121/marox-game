'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
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
  const { data, telegramUser, spinOutcome, setTab } = useGameStore()
  
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
  const [bet, setBet] = useState(5)
  const [spinTrigger, setSpinTrigger] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [winMessage, setWinMessage] = useState<string | null>('SPIN, EARN MAROX!')
  const [autoSpin, setAutoSpin] = useState(false)
  const [lastWin, setLastWin] = useState<number | null>(null)
  const particleCanvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const particleRafRef = useRef<number>(0)

  const latestRef = useRef({ spinning, energy: data.energy, bet, autoSpin })
  latestRef.current = { spinning, energy: data.energy, bet, autoSpin }

  useEffect(() => {
    if (!allowedBets.includes(bet)) {
      setBet(allowedBets[allowedBets.length - 1]);
    }
  }, [allowedBets, bet]);

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
    const currentIndex = allowedBets.indexOf(bet);
    let nextIndex = currentIndex !== -1 ? currentIndex + diff : 0;
    if (nextIndex < 0) nextIndex = 0;
    if (nextIndex >= allowedBets.length) nextIndex = allowedBets.length - 1;
    setBet(allowedBets[nextIndex]);
  }

  const playRetroSpinSound = useCallback(() => {
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
        gain.gain.setValueAtTime(0.03, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        osc.start(time);
        osc.stop(time + 0.08);
        time += 0.08;
      }
    } catch(e) {}
  }, [])

  const playRetroWinSound = useCallback(() => {
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
      burstGain.gain.setValueAtTime(0.1, time);
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
        gain.gain.linearRampToValueAtTime(0.1, time + (i * 0.06) + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + (i * 0.06) + 0.2);
        osc.start(time + (i * 0.06));
        osc.stop(time + (i * 0.06) + 0.2);
      }
    } catch(e) {}
  }, [])

  const handleSpinClick = useCallback(() => {
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
    setSpinTrigger((prev) => prev + 1)
  }, [playRetroSpinSound])

  const handleSpinResult = useCallback((payout: { points: number; coins: number; energyWin: number }) => {
    setSpinning(false)
    latestRef.current.spinning = false

    const currentBet = latestRef.current.bet
    const scale = currentBet / 5
    const scaledCoins = Math.floor(payout.coins * scale)
    const scaledPts = Math.floor(payout.points * scale)
    const scaledEnergy = Math.floor(payout.energyWin * scale)

    spinOutcome(scaledPts, scaledCoins, currentBet, scaledEnergy)

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
      setWinMessage(`⚡ WIN! +${payout.energyWin} ENERGY`)
      setLastWin(payout.energyWin)
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
            { emoji: '📜', label: 'Tasks', action: () => setTab('missions'), badge: true },
            { emoji: '🎁', label: 'Daily', action: () => showModal('daily') },
            { emoji: '🏆', label: 'Rank', action: () => setTab('leaderboard') },
            { emoji: '👥', label: 'Refs', action: () => setTab('friends') },
            { emoji: '⭐', label: 'Feats', action: () => showModal('achievements') },
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
            { emoji: '🛒', label: 'Shop', action: () => setTab('shop') },
            { emoji: '📦', label: 'Items', action: () => showModal('inventory') },
            { emoji: '👛', label: 'Wallet', action: () => setTab('profile') },
            { emoji: '⚙️', label: 'Setup', action: () => setTab('profile') },
            { emoji: '🌐', label: 'Lang', action: () => setTab('profile') },
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
          <PixiSlotMachine
            key="force-remount-no-shake"
            spinTrigger={spinTrigger}
            bet={bet}
            onResult={handleSpinResult}
          />
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
            <h2 style={{ color: '#ff3333', fontSize: '20px', marginBottom: '10px' }}>OUT OF ENERGY!</h2>
            <p style={{ color: '#fff', fontSize: '10px', marginBottom: '20px', lineHeight: '1.5' }}>
              Your energy has depleted.<br/>Grab more from the store to keep spinning!
            </p>
            <button className="slot-btn primary pixel-text" style={{ padding: '12px 20px', marginBottom: '12px', width: '100%', fontSize: '12px' }} onClick={() => { setModalType(null); setTab('shop'); }}>
              ⚡ BUY ENERGY
            </button>
            <button className="slot-btn pixel-text" style={{ padding: '10px 20px', background: 'transparent', border: '2px solid #555', color: '#aaa', width: '100%', fontSize: '10px' }} onClick={() => setModalType(null)}>
              CLOSE
            </button>
          </div>
        </div>
      )}

      {modalType === 'avatar' && (
        <PlayerInfoModal onClose={() => setModalType(null)} />
      )}
    </div>
  )
}
