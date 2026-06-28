'use client'

import { useState, useEffect } from 'react'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { useGameStore } from '../store/useGameStore'
import { gameConfig } from '../config/gameConfig'

interface VerificationState {
  [key: string]: 'not_started' | 'verifying' | 'completed';
}

export default function TasksScreen() {
  const { data, updateStats, completeTask } = useGameStore()
  const [tonConnectUI] = useTonConnectUI()
  const wallet = useTonWallet()

  const getInitialTaskStates = (): VerificationState => {
    const states: VerificationState = {
      join_channel: 'not_started',
      follow_x: 'not_started',
      join_community: 'not_started',
      retweet_x: 'not_started',
      follow_facebook: 'not_started',
      connect_wallet: 'not_started',
    };
    if (data.completedTasks) {
      data.completedTasks.forEach(taskId => {
        states[taskId] = 'completed';
      });
    }
    return states;
  };

  const [taskStates, setTaskStates] = useState<VerificationState>(getInitialTaskStates())

  const handleTaskClick = (taskId: string, link: string) => {
    if (taskStates[taskId] !== 'not_started') return;

    if (taskId === 'connect_wallet') {
      if (wallet) {
        setTaskStates((prev) => ({ ...prev, [taskId]: 'completed' }))
        completeTask(taskId)
        const task = gameConfig.tasks.find((t) => t.id === taskId)
        if (task) {
          updateStats(task.points, task.coins, task.energy || 0)
        }
        if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
        }
        return;
      } else {
        setTaskStates((prev) => ({ ...prev, [taskId]: 'verifying' }))
        tonConnectUI.openModal()
        return;
      }
    }

    // Open link
    if (link && link !== '#') {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        window.Telegram.WebApp.openLink(link)
      } else {
        window.open(link, '_blank')
      }
    }

    // Set to verifying
    setTaskStates((prev) => ({ ...prev, [taskId]: 'verifying' }))

    // Trigger timed verification delay (configured in gameConfig)
    const task = gameConfig.tasks.find((t) => t.id === taskId)
    const delay = task ? task.verifyDelayMs : 3000

    setTimeout(() => {
      setTaskStates((prev) => ({ ...prev, [taskId]: 'completed' }))
      completeTask(taskId)
      
      // Award points, coins, and energy
      if (task) {
        updateStats(task.points, task.coins, task.energy || 0)
      }

      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
      }
    }, delay)
  }

  useEffect(() => {
    if (wallet && taskStates['connect_wallet'] === 'verifying') {
      setTaskStates((prev) => ({ ...prev, connect_wallet: 'completed' }))
      completeTask('connect_wallet')
      const task = gameConfig.tasks.find((t) => t.id === 'connect_wallet')
      if (task) {
        updateStats(task.points, task.coins, task.energy || 0)
      }
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
      }
    }
  }, [wallet, taskStates, updateStats])

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* New Tasks Section */}
        {gameConfig.tasks.filter(t => (taskStates[t.id] || 'not_started') !== 'completed').length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 className="pixel-text" style={{ fontSize: '12px', color: '#fff', marginLeft: '4px' }}>NEW TASKS</h2>
            {gameConfig.tasks.filter(t => (taskStates[t.id] || 'not_started') !== 'completed').map((task) => {
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
                    border: '2px solid var(--border-neon)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>{task.emoji}</span>
                    <div>
                      <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{task.title}</h3>
                      <div className="task-rewards" style={{ display: 'flex', gap: '8px', fontSize: '10px', marginTop: '6px' }}>
                        <span style={{ color: 'var(--neon-purple)', fontWeight: 'bold' }}>+{task.points} MRX</span>
                        <span style={{ color: '#ffb700', fontWeight: 'bold' }}>+{task.coins} 🪙</span>
                        {task.energy && <span style={{ color: '#00d2ff', fontWeight: 'bold' }}>+{task.energy} ⚡</span>}
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
                      background: state === 'not_started' ? 'var(--blue)' : 'rgba(255, 183, 0, 0.15)',
                      color: state === 'not_started' ? '#001020' : 'var(--gold)',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      cursor: state === 'not_started' ? 'pointer' : 'default',
                      textTransform: 'uppercase',
                      boxShadow: state === 'not_started' ? '0 2px 8px rgba(0, 210, 255, 0.25)' : 'none',
                    }}
                  >
                    {state === 'not_started' ? 'GO' : 'VERIFYING...'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Completed Tasks Section */}
        {gameConfig.tasks.filter(t => taskStates[t.id] === 'completed').length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 className="pixel-text" style={{ fontSize: '12px', color: 'var(--text-dim)', marginLeft: '4px' }}>COMPLETED</h2>
            {gameConfig.tasks.filter(t => taskStates[t.id] === 'completed').map((task) => (
                <div
                  key={task.id}
                  className="task-card card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'rgba(22, 15, 41, 0.3)',
                    border: '1px solid rgba(0, 210, 255, 0.1)',
                    opacity: 0.6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>{task.emoji}</span>
                    <div>
                      <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{task.title}</h3>
                    </div>
                  </div>

                  <button
                    disabled
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'var(--text-dim)',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      cursor: 'default',
                      textTransform: 'uppercase',
                    }}
                  >
                    DONE
                  </button>
                </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
