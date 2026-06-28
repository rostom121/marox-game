'use client'

import { useState } from 'react'
import { useGameStore } from '../store/useGameStore'
import { gameConfig } from '../config/gameConfig'

interface VerificationState {
  [key: string]: 'not_started' | 'verifying' | 'completed';
}

export default function TasksScreen() {
  const { updateStats } = useGameStore()
  const [taskStates, setTaskStates] = useState<VerificationState>({
    join_channel: 'not_started',
    follow_twitter: 'not_started',
    youtube_subscribe: 'not_started',
  })

  const handleTaskClick = (taskId: string, link: string) => {
    if (taskStates[taskId] !== 'not_started') return;

    // Open link
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.openLink(link)
    } else {
      window.open(link, '_blank')
    }

    // Set to verifying
    setTaskStates((prev) => ({ ...prev, [taskId]: 'verifying' }))

    // Trigger timed verification delay (configured in gameConfig)
    const task = gameConfig.tasks.find((t) => t.id === taskId)
    const delay = task ? task.verifyDelayMs : 3000

    setTimeout(() => {
      setTaskStates((prev) => ({ ...prev, [taskId]: 'completed' }))
      
      // Award points and coins
      if (task) {
        updateStats(task.points, task.coins, 0)
      }

      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
      }
    }, delay)
  }

  return (
    <div className="page" style={{ padding: '16px 12px' }}>
      <header className="page-header">
        <h1 className="pixel-text" style={{ fontSize: '15px', color: 'var(--neon-purple)', textShadow: '0 0 10px var(--neon-purple)' }}>TASKS & MISSIONS</h1>
        <div className="accent-line" style={{ background: 'var(--neon-purple)', boxShadow: '0 0 10px var(--neon-purple)' }} />
      </header>

      {/* Rewards overview banner */}
      <div className="task-info-banner card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(157, 78, 221, 0.08)' }}>
        <div>
          <div className="reward-label" style={{ fontSize: '8px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Complete All Tasks</div>
          <div className="reward-title" style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>Collect Massive Rewards</div>
        </div>
        <div className="reward-amount" style={{ fontFamily: 'monospace', fontSize: '14px', color: 'var(--blue)', fontWeight: 'bold' }}>
          +1,500 pts
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {gameConfig.tasks.map((task) => {
          const state = taskStates[task.id] || 'not_started'
          return (
            <div
              key={task.id}
              className="task-card card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'rgba(22, 15, 41, 0.6)',
                border: state === 'completed' ? '1px solid rgba(0, 210, 255, 0.2)' : '2px solid var(--border-neon)',
                opacity: state === 'completed' ? 0.75 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>{task.emoji}</span>
                <div>
                  <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{task.title}</h3>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '9px', color: 'var(--blue)', fontWeight: 'bold' }}>+{task.points} pts</span>
                    <span style={{ fontSize: '9px', color: 'var(--gold)', fontWeight: 'bold' }}>+{task.coins} coins</span>
                  </div>
                </div>
              </div>

              <button
                disabled={state !== 'not_started'}
                onClick={() => handleTaskClick(task.id, task.link)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: state === 'not_started' ? 'var(--blue)' : state === 'verifying' ? 'rgba(255, 183, 0, 0.15)' : 'rgba(255,255,255,0.05)',
                  color: state === 'not_started' ? '#001020' : state === 'verifying' ? 'var(--gold)' : 'var(--text-dim)',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  cursor: state === 'not_started' ? 'pointer' : 'default',
                  textTransform: 'uppercase',
                  boxShadow: state === 'not_started' ? '0 2px 8px rgba(0, 210, 255, 0.25)' : 'none',
                }}
              >
                {state === 'not_started' && 'Go'}
                {state === 'verifying' && 'Verifying... 🕒'}
                {state === 'completed' && 'Done ✅'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
