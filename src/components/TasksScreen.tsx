'use client'

import { useState, useEffect } from 'react'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/useGameStore'
import { gameConfig } from '../config/gameConfig'

interface VerificationState {
  [key: string]: 'not_started' | 'verifying' | 'completed';
}

export default function TasksScreen() {
  const { t } = useTranslation();
  const { data, updateStats, completeTask } = useGameStore()
  const [tonConnectUI] = useTonConnectUI()
  const wallet = useTonWallet()
  const [activeTab, setActiveTab] = useState<'new' | 'completed'>('new')

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

    if (taskId === 'buy_shop') {
      useGameStore.getState().setTab('shop');
      return;
    }

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

    if (link && link !== '#') {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        window.Telegram.WebApp.openLink(link)
      } else {
        window.open(link, '_blank')
      }
    }

    setTaskStates((prev) => ({ ...prev, [taskId]: 'verifying' }))

    const task = gameConfig.tasks.find((t) => t.id === taskId)
    const delay = task ? task.verifyDelayMs : 3000

    setTimeout(async () => {
      setTaskStates((prev) => ({ ...prev, [taskId]: 'completed' }))
      completeTask(taskId)
      
      if (task) {
        // Send completion to server
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://marox-game-production.up.railway.app';
        try {
          const res = await fetch(`${API_URL}/api/tasks/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telegramId: useGameStore.getState().telegramUser?.id,
              taskId: task.id,
              rewardPoints: task.points,
              rewardCoins: task.coins,
              rewardEnergy: task.energy || 0
            })
          });
          const data = await res.json();
          if (data.ok && data.user) {
            useGameStore.getState().setServerData(data.user);
          }
        } catch (e) {
          console.error("Task complete failed", e);
        }
      }

      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
      }
    }, delay)
  }

  const handleWatchAd = () => {
    if (typeof window !== 'undefined' && window.Adsgram) {
      const AdController = window.Adsgram.init({ blockId: "36721" });
      AdController.show().then(async (result) => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://marox-game-production.up.railway.app';
        try {
          const res = await fetch(`${API_URL}/api/ads/reward`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telegramId: useGameStore.getState().telegramUser?.id
            })
          });
          const resData = await res.json();
          if (resData.ok && resData.user) {
            useGameStore.getState().setServerData(resData.user);
            if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
              window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }
          }
        } catch (e) {
          console.error("Ad reward failed", e);
        }
      }).catch((result) => {
        console.error("Ad skipped or error", result);
      });
    } else {
      console.warn("Adsgram SDK not loaded yet");
    }
  };

  useEffect(() => {
    if (wallet && taskStates['connect_wallet'] === 'verifying') {
      setTaskStates((prev) => ({ ...prev, connect_wallet: 'completed' }))
      completeTask('connect_wallet')
      const task = gameConfig.tasks.find((t) => t.id === 'connect_wallet')
      if (task) {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://marox-game-production.up.railway.app';
        fetch(`${API_URL}/api/tasks/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId: useGameStore.getState().telegramUser?.id,
            taskId: task.id,
            rewardPoints: task.points,
            rewardCoins: task.coins,
            rewardEnergy: task.energy || 0
          })
        }).then(r => r.json()).then(data => {
          if (data.ok && data.user) {
            useGameStore.getState().setServerData(data.user);
          }
        }).catch(e => console.error(e));
      }
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
      }
    }
  }, [wallet, taskStates, updateStats, completeTask])

  return (
    <div className="page" style={{ padding: '16px 12px' }}>
      <header className="page-header">
        <h1 className="pixel-text gold-text glow-text" style={{ fontSize: '20px', textShadow: '0 0 10px var(--gold)' }}>{t('missions_title')}</h1>
        <div className="accent-line" style={{ background: 'var(--neon-purple)', boxShadow: '0 0 10px var(--neon-purple)' }} />
      </header>

      <div className="tab-buttons" style={{ display: 'flex', gap: '10px', marginBottom: '20px', marginTop: '20px' }}>
        <button 
          onClick={() => setActiveTab('new')}
          className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
          style={{ flex: 1, padding: '10px', background: activeTab === 'new' ? 'rgba(0, 210, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)', border: activeTab === 'new' ? '1px solid var(--blue)' : '1px solid transparent', borderRadius: '12px', color: activeTab === 'new' ? '#fff' : 'var(--text-dim)', fontWeight: 'bold' }}
        >
          {t('new_tasks')}
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          style={{ flex: 1, padding: '10px', background: activeTab === 'completed' ? 'rgba(0, 210, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)', border: activeTab === 'completed' ? '1px solid var(--blue)' : '1px solid transparent', borderRadius: '12px', color: activeTab === 'completed' ? '#fff' : 'var(--text-dim)', fontWeight: 'bold' }}
        >
          {t('completed_tasks')}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {activeTab === 'new' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            {/* ADSGRAM BUTTON */}
            <div
              className="task-card card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'linear-gradient(90deg, rgba(255, 183, 0, 0.2) 0%, rgba(255, 183, 0, 0.05) 100%)',
                border: '2px solid var(--gold)',
                boxShadow: '0 0 15px rgba(255, 183, 0, 0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>📺</span>
                <div>
                  <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>Watch Video Ad</h3>
                  <div style={{ fontSize: '12px', color: 'var(--blue)', marginTop: '5px' }}>Reward: 200 Energy ⚡</div>
                </div>
              </div>
              <button
                onClick={handleWatchAd}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--gold)',
                  color: '#000',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  boxShadow: '0 0 10px rgba(255,183,0,0.5)'
                }}
              >
                WATCH
              </button>
            </div>

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
                      <div style={{ fontSize: '11px', color: 'var(--gold)', marginTop: '6px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{color: 'var(--text-dim)'}}>{t('reward')}:</span>
                        {task.points > 0 && <span>{task.points} $MAROX</span>}
                        {task.energy && task.energy > 0 && <span>{task.energy} ⚡</span>}
                        {task.coins && task.coins > 0 && <span>{task.coins} 🪙</span>}
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
                    }}
                  >
                    {state === 'not_started' ? t('do_it') : t('verifying')}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'completed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                  <div style={{ color: '#00ff88', fontSize: '12px', fontWeight: 'bold' }}>✓ {t('completed')}</div>
                </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
