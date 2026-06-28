'use client'

import { useEffect, useRef } from 'react'
import { gameConfig } from '../config/gameConfig'

interface PixiSlotMachineProps {
  spinTrigger: number;
  bet: number;
  onResult: (payout: { points: number; coins: number; energyWin: number }) => void;
}

// Symbol definitions with emoji and color
const SYMBOL_DEFS: Record<string, { emoji?: string; imageSrc?: string; color: string; label: string }> = {
  coin: { emoji: '🪙', color: '#ffb700', label: 'GOLD' },
  badge: { imageSrc: '/marox-badge.png', color: '#00d2ff', label: 'MAROX' },
  energy: { emoji: '⚡', color: '#00d2ff', label: 'ENERGY' },
  red_x: { emoji: '❌', color: '#ff3333', label: 'RED X' },
}

export function PixiSlotMachine({ spinTrigger, bet, onResult }: PixiSlotMachineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    reels: [
      ['coin', 'badge', 'energy', 'red_x', 'coin', 'badge'],
      ['energy', 'red_x', 'coin', 'badge', 'energy', 'red_x'],
      ['badge', 'coin', 'red_x', 'energy', 'badge', 'coin'],
    ],
    spinning: [false, false, false],
    yOffsets: [0, 0, 0],
    velocities: [0, 0, 0],
    bouncePhase: [false, false, false],
    bounceY: [0, 0, 0],
    winners: [] as number[], // row indices that won
    winPulse: 0,
    isInitialized: false,
  })
  const rafRef = useRef<number>(0)
  const isInitialMountRef = useRef(true)
  const imagesRef = useRef<Record<string, HTMLImageElement>>({})

  useEffect(() => {
    // Preload images
    for (const key in SYMBOL_DEFS) {
      const src = SYMBOL_DEFS[key].imageSrc
      if (src && typeof window !== 'undefined') {
        const img = new Image()
        img.src = src
        imagesRef.current[src] = img
      }
    }
  }, [])

  const REEL_COUNT = 3
  const ROW_COUNT = 1
  const GAP = 4
  // Responsive: divide available width into 3 reels
  // We'll use 342 as default, actual canvas gets resized by container
  const SYMBOL_W = 124
  const SYMBOL_H = 112
  const CANVAS_W = REEL_COUNT * (SYMBOL_W + GAP) - GAP
  const CANVAS_H = ROW_COUNT * SYMBOL_H
  const TOP_SPEED = 28

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const s = stateRef.current
    s.isInitialized = true

    const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + r)
      ctx.lineTo(x + w, y + h - r)
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      ctx.lineTo(x + r, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
    }

    const drawSymbol = (
      symbolId: string,
      x: number, y: number,
      w: number, h: number,
      isSpinning: boolean,
      isWinner: boolean,
      pulse: number
    ) => {
      const def = SYMBOL_DEFS[symbolId] || SYMBOL_DEFS.red_x
      const pad = 4

      // Card background
      ctx.save()
      if (isSpinning) {
        ctx.filter = `blur(${3 + Math.random()}px)`
      }

      // Winning glow
      if (isWinner) {
        const glowAlpha = 0.4 + 0.4 * Math.sin(pulse * 0.1)
        ctx.shadowColor = def.color
        ctx.shadowBlur = 20 + 10 * Math.sin(pulse * 0.1)
        const grad = ctx.createLinearGradient(x + pad, y + pad, x + w - pad, y + h - pad)
        grad.addColorStop(0, `${def.color}33`)
        grad.addColorStop(1, `${def.color}11`)
        ctx.fillStyle = grad
        drawRoundRect(x + pad, y + pad, w - pad * 2, h - pad * 2, 10)
        ctx.fill()
        ctx.strokeStyle = def.color
        ctx.lineWidth = 2.5
        ctx.globalAlpha = glowAlpha * 2
        drawRoundRect(x + pad, y + pad, w - pad * 2, h - pad * 2, 10)
        ctx.stroke()
        ctx.globalAlpha = 1
        ctx.shadowBlur = 0
      } else {
        ctx.fillStyle = '#0f0624'
        drawRoundRect(x + pad, y + pad, w - pad * 2, h - pad * 2, 10)
        ctx.fill()
        ctx.strokeStyle = isSpinning ? 'rgba(157,78,221,0.15)' : 'rgba(157,78,221,0.35)'
        ctx.lineWidth = 2
        drawRoundRect(x + pad, y + pad, w - pad * 2, h - pad * 2, 10)
        ctx.stroke()
      }

      // Symbol Image or Emoji
      const shake = 0

      if (def.imageSrc && imagesRef.current[def.imageSrc]?.complete) {
        const img = imagesRef.current[def.imageSrc]
        const imgSize = isWinner ? 76 : 68
        const imgX = x + w / 2 - imgSize / 2 + shake
        const imgY = y + h / 2 - 8 - imgSize / 2 + shake

        ctx.save()
        ctx.beginPath()
        ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(img, imgX, imgY, imgSize, imgSize)
        ctx.restore()
      } else if (def.emoji) {
        ctx.font = `${isWinner ? 54 : 48}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#ffffff'
        ctx.fillText(def.emoji, x + w / 2 + shake, y + h / 2 - 8 + shake)
      }

      // Label
      ctx.filter = 'none'
      ctx.font = 'bold 7px monospace'
      ctx.fillStyle = isWinner ? def.color : 'rgba(255,255,255,0.4)'
      ctx.fillText(def.label, x + w / 2, y + h - 10)

      ctx.restore()
    }

    const drawPayline = (rowY: number, color: string, alpha: number) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.shadowColor = color
      ctx.shadowBlur = 12
      ctx.setLineDash([8, 4])
      ctx.beginPath()
      ctx.moveTo(0, rowY + SYMBOL_H / 2)
      ctx.lineTo(CANVAS_W, rowY + SYMBOL_H / 2)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()
    }

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

      // Scanline overlay background
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      for (let sy = 0; sy < CANVAS_H; sy += 4) {
        ctx.fillRect(0, sy, CANVAS_W, 2)
      }

      s.winPulse++

      for (let i = 0; i < REEL_COUNT; i++) {
        const baseX = i * (SYMBOL_W + GAP)
        const reel = s.reels[i]

        // Update velocity and position
        if (s.spinning[i]) {
          // Accelerate to top speed
          if (s.velocities[i] < TOP_SPEED) {
            s.velocities[i] = Math.min(s.velocities[i] + 4, TOP_SPEED)
          }
          s.yOffsets[i] = (s.yOffsets[i] + s.velocities[i]) % SYMBOL_H

          // Scroll symbols
          if (s.yOffsets[i] < s.velocities[i]) {
            const newSym = gameConfig.slot.symbols[Math.floor(Math.random() * gameConfig.slot.symbols.length)].id
            reel.unshift(newSym)
            if (reel.length > 10) reel.pop()
          }
        }

        // Draw visible symbols (3 rows + 1 buffer above)
        const offset = s.yOffsets[i]
        for (let j = -1; j < ROW_COUNT + 1; j++) {
          const y = j * SYMBOL_H + offset - SYMBOL_H
          if (y > CANVAS_H || y + SYMBOL_H < 0) continue
          const symIdx = ((j + reel.length) % reel.length + reel.length) % reel.length
          const symbolId = reel[symIdx] || 'red_x'
          const visualRow = j - 1
          const isWinner = s.winners.includes(visualRow) && !s.spinning[i]
          drawSymbol(symbolId, baseX, y, SYMBOL_W, SYMBOL_H, s.spinning[i], isWinner, s.winPulse)
        }

        // Reel separator lines
        if (i < REEL_COUNT - 1) {
          ctx.fillStyle = 'rgba(157,78,221,0.2)'
          ctx.fillRect(baseX + SYMBOL_W + 1, 0, GAP - 2, CANVAS_H)
        }
      }

      // Draw paylines for winning rows
      for (const row of s.winners) {
        const alpha = 0.6 + 0.4 * Math.abs(Math.sin(s.winPulse * 0.08))
        drawPayline(row * SYMBOL_H, '#ffb700', alpha)
      }

      // Clip to canvas bounds (hide overflow symbols)
      ctx.clearRect(0, -10, CANVAS_W, 10)
      ctx.clearRect(0, CANVAS_H, CANVAS_W, 10)

      rafRef.current = requestAnimationFrame(render)
    }

    render()

      // Expose spin function globally for this component
      ; (window as any).__spinMaroxSlot = (finalGrid: string[][], winnerRows: number[]) => {
        const state = stateRef.current
        state.winners = []
        state.spinning = [true, true, true]
        state.velocities = [0, 0, 0]

        const stopReel = (i: number) => {
          state.spinning[i] = false
          state.velocities[i] = 0
          // Snap to clean position
          state.yOffsets[i] = 0
          // Set visible symbols
          const targets = finalGrid[i]
          state.reels[i] = [
            'red_x',    // buffer above
            targets[0], // visible row
            'coin',     // buffer below
            'energy', 'badge'
          ]

          if (i === REEL_COUNT - 1) {
            // All reels stopped — apply winners
            setTimeout(() => {
              state.winners = winnerRows
            }, 100)
          }
        }

        // Staggered stops: reel 0 → 800ms, reel 1 → 1300ms, reel 2 → 1800ms
        for (let i = 0; i < REEL_COUNT; i++) {
          setTimeout(() => stopReel(i), 800 + i * 500)
        }
      }

    return () => {
      cancelAnimationFrame(rafRef.current)
      delete (window as any).__spinMaroxSlot
    }
  }, [])

  // Trigger spin on spinTrigger change
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      return
    }
    if (spinTrigger === 0) return // Ensure we don't spin on initial mount/unmount

    const r = Math.random() * 100
    let outcome = 'mixed'

    // 30% Gold, 25% MAROX, 20% Energy, 10% Red X, 15% Mixed
    if (r < 30) {
      outcome = 'coin'
    } else if (r < 55) { // 30 + 25
      outcome = 'badge'
    } else if (r < 75) { // 55 + 20
      outcome = 'energy'
    } else if (r < 85) { // 75 + 10
      outcome = 'red_x'
    } else {
      outcome = 'mixed' // Remaining 15%
    }

    let finalGrid: string[][]
    if (outcome !== 'mixed') {
      finalGrid = [[outcome], [outcome], [outcome]]
    } else {
      // Pick 3 distinct symbols so it's impossible to have a 3-match
      const allSymbols = ['coin', 'badge', 'energy', 'red_x']
      const shuffled = allSymbols.sort(() => 0.5 - Math.random())
      finalGrid = [[shuffled[0]], [shuffled[1]], [shuffled[2]]]
    }

    // Determine winning rows
    const winnerRows: number[] = []
    let points = 0
    let coins = 0
    let energyWin = 0

    for (let row = 0; row < 1; row++) {
      const sym0 = finalGrid[0][row]
      const sym1 = finalGrid[1][row]
      const sym2 = finalGrid[2][row]
      if (sym0 === sym1 && sym1 === sym2) {
        winnerRows.push(row)
        const matchedSym = gameConfig.slot.symbols.find((s) => s.id === sym0)
        if (matchedSym) {
          points += matchedSym.points
          coins += matchedSym.coins
          if (matchedSym.energy) {
            energyWin += matchedSym.energy
          }
        }
      }
    }

    if (typeof window !== 'undefined' && (window as any).__spinMaroxSlot) {
      ; (window as any).__spinMaroxSlot(finalGrid, winnerRows)
    }

    // Resolve outcome after all reels stop
    setTimeout(() => {
      onResult({ points, coins, energyWin })
    }, 2200)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinTrigger])

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'transparent',
        position: 'relative',
      }}
    >
      {/* Top/Bottom mask to cleanly clip scrolling symbols */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '10px',
        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)',
        width: '100%',
        maxWidth: `${CANVAS_W}px`,
      }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
        {/* Top fade mask */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '24px',
          background: 'linear-gradient(to bottom, rgba(3,1,9,0.95), transparent)',
          pointerEvents: 'none',
        }} />
        {/* Bottom fade mask */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '24px',
          background: 'linear-gradient(to top, rgba(3,1,9,0.95), transparent)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  )
}
