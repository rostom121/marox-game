'use client'

import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/useGameStore'

interface LandingProps {
  navigate: (tab: string) => void;
}

interface Sparkle {
  id: number
  x: number
  y: number
  size: number
  alpha: number
  life: number
  maxLife: number
  color: string
}

interface FloatingParticle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  emoji?: string
  life: number
  maxLife: number
}

const SPARK_COLORS = ['#ffb700', '#00d2ff', '#9d4edd', '#ffffff', '#ff6b35']
const FLOAT_EMOJIS = ['🪙', '⭐', '✨', '💎', '⚡']

export default function LandingScreen({ navigate }: LandingProps) {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<FloatingParticle[]>([])
  const sparklesRef = useRef<Sparkle[]>([])
  const rafRef = useRef<number>(0)
  const frameRef = useRef(0)
  const [charScale, setCharScale] = useState(1)
  const [charY, setCharY] = useState(0)
  const charRef = useRef({ blink: 0, breathe: 0, glow: 0 })

  const { data, setGameUsername } = useGameStore()
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')

  const handlePlayNow = () => {
    if (!data.gameUsername) {
      setShowUsernameModal(true)
    } else {
      navigate('slot')
    }
  }

  const handleSaveUsername = () => {
    if (usernameInput.trim().length >= 3) {
      setGameUsername(usernameInput.trim())
      setShowUsernameModal(false)
      navigate('slot')
    }
  }

  // Continuous ambient canvas animation
  useEffect(() => {
    const canvas = bgCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const spawnParticle = () => {
      // Coin or star floating up
      const useEmoji = Math.random() > 0.5
      particlesRef.current.push({
        id: Math.random(),
        x: Math.random() * canvas.width,
        y: canvas.height + 20,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(0.4 + Math.random() * 0.9),
        size: 10 + Math.random() * 12,
        color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
        emoji: useEmoji ? FLOAT_EMOJIS[Math.floor(Math.random() * FLOAT_EMOJIS.length)] : undefined,
        life: 0,
        maxLife: 100 + Math.random() * 120,
      })
    }

    const spawnSparkle = (x?: number, y?: number) => {
      sparklesRef.current.push({
        id: Math.random(),
        x: x ?? Math.random() * canvas.width,
        y: y ?? Math.random() * canvas.height,
        size: 1 + Math.random() * 3,
        alpha: 1,
        life: 0,
        maxLife: 30 + Math.random() * 40,
        color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
      })
    }

    // Spawn some sparkles along building edges (simulated city lights)
    const cityLightPositions = [
      { x: 0.08, y: 0.55 }, { x: 0.12, y: 0.52 }, { x: 0.15, y: 0.58 },
      { x: 0.82, y: 0.50 }, { x: 0.86, y: 0.55 }, { x: 0.90, y: 0.48 },
      { x: 0.20, y: 0.65 }, { x: 0.78, y: 0.60 }, { x: 0.50, y: 0.35 },
      { x: 0.30, y: 0.72 }, { x: 0.70, y: 0.68 },
    ]

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frameRef.current++
      const f = frameRef.current

      // Spawn ambient particles
      if (f % 18 === 0) spawnParticle()
      // Spawn random sparkles
      if (f % 12 === 0) spawnSparkle()
      // Spawn city light twinkles
      if (f % 25 === 0) {
        const pos = cityLightPositions[Math.floor(Math.random() * cityLightPositions.length)]
        spawnSparkle(pos.x * canvas.width, pos.y * canvas.height)
      }

      // Draw sparkles
      sparklesRef.current = sparklesRef.current.filter((s) => s.life < s.maxLife)
      for (const s of sparklesRef.current) {
        s.life++
        const t = s.life / s.maxLife
        const alpha = s.alpha * (1 - t) * Math.sin(t * Math.PI)
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = s.color
        ctx.shadowColor = s.color
        ctx.shadowBlur = 8
        // Draw star shape
        ctx.beginPath()
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2
          const r = i % 2 === 0 ? s.size * 2 : s.size * 0.5
          ctx.lineTo(s.x + Math.cos(angle) * r, s.y + Math.sin(angle) * r)
        }
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }

      // Draw floating particles
      particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife)
      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.life++
        const t = p.life / p.maxLife
        const alpha = (1 - t * t) * 0.7

        ctx.save()
        ctx.globalAlpha = alpha
        if (p.emoji) {
          ctx.font = `${p.size}px serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(p.emoji, p.x, p.y)
        } else {
          ctx.fillStyle = p.color
          ctx.shadowColor = p.color
          ctx.shadowBlur = 10
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size / 4, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      // Moving star field (soft light pulses across the top half)
      const starPulse = Math.sin(f * 0.02) * 0.5 + 0.5
      ctx.save()
      ctx.globalAlpha = 0.15 * starPulse
      ctx.fillStyle = 'rgba(157, 78, 221, 1)'
      ctx.shadowColor = '#9d4edd'
      ctx.shadowBlur = 30
      ctx.beginPath()
      ctx.arc(canvas.width * 0.5, canvas.height * 0.3, 80, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      rafRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [])

  // Character idle animation (breathing + floating)
  useEffect(() => {
    let raf: number
    let t = 0
    const animate = () => {
      t += 0.03
      // Breathing: subtle scale oscillation
      const breath = 1 + Math.sin(t * 0.8) * 0.012
      // Float: gentle vertical bob
      const float = Math.sin(t * 0.6) * 4
      setCharScale(breath)
      setCharY(float)
      raf = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="landing-root">
      {/* Background image */}
      <div className="landing-bg" />

      {/* Ambient animation canvas (particles, sparkles, city lights) */}
      <canvas ref={bgCanvasRef} className="landing-ambient-canvas" />

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
          PLAY NOW
        </button>
        <span className="landing-mini-app-text">game mini app on telegram</span>
      </div>

      {showUsernameModal && (
        <div className="welcome-modal-overlay" style={{ zIndex: 3000 }}>
          <div className="welcome-modal-card card" style={{ position: 'relative', maxWidth: '320px', width: 'fit-content', padding: '25px 20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h2 className="pixel-text gold-text" style={{ fontSize: '18px', textAlign: 'center' }}>CHOOSE USERNAME</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
              Enter a unique username to be used in the game and leaderboards.
            </p>
            <input 
              type="text" 
              className="pixel-text"
              placeholder="Username..." 
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(0,0,0,0.5)',
                border: '2px solid var(--border-neon)',
                borderRadius: '8px',
                color: '#fff',
                outline: 'none',
                textAlign: 'center',
                fontSize: '14px'
              }}
            />
            <button 
              className={`claim-btn pixel-text ${usernameInput.trim().length < 3 ? 'disabled' : ''}`}
              onClick={handleSaveUsername}
              disabled={usernameInput.trim().length < 3}
              style={{ width: '100%', marginTop: '10px' }}
            >
              START ADVENTURE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
