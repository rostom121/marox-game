import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';

interface EventModalProps {
  onClose: () => void;
}

const EVENT_END_TIME = new Date("2026-07-03T21:00:00Z").getTime();

export default function EventModal({ onClose }: EventModalProps) {
  const { telegramUser } = useGameStore();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTimeLeft, setEventTimeLeft] = useState<string>('');

  useEffect(() => {
    const fetchEventLeaderboard = async () => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://marox-game-production.up.railway.app';
      try {
        const res = await fetch(`${API_URL}/api/event/leaderboard`);
        const data = await res.json();
        if (data.ok) {
          setLeaderboard(data.leaderboard);
        }
      } catch (err) {
        console.error("Failed to fetch event leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEventLeaderboard();
  }, []);

  useEffect(() => {
    const updateEventTimer = () => {
      const now = Date.now();
      const diff = EVENT_END_TIME - now;
      if (diff <= 0) {
        setEventTimeLeft('EVENT ENDED - CALCULATING REWARDS');
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setEventTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    updateEventTimer();
    const timer = setInterval(updateEventTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRewardForRank = (rank: number) => {
    if (rank === 1) return { energy: 10000, marox: 5000, badge: '🥇' };
    if (rank === 2) return { energy: 6000, marox: 3000, badge: '🥈' };
    if (rank === 3) return { energy: 3000, marox: 1800, badge: '🥉' };
    return null;
  };

  return (
    <div className="player-modal-overlay" onClick={onClose} style={{ zIndex: 5000, position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)' }}>
      <div 
        className="player-modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          width: '95%', 
          maxWidth: '400px', 
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #1f0b3b 0%, #0d061c 100%)', 
          border: '2px solid var(--gold)', 
          borderRadius: '20px', 
          boxShadow: '0 0 40px rgba(255, 183, 0, 0.4)',
          overflow: 'hidden'
        }}
      >
        
        {/* Header Section */}
        <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', position: 'relative', flexShrink: 0 }}>
          <button className="red-glow-close-btn" onClick={onClose} style={{ top: '15px', right: '15px' }}>✕</button>
          
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🏆</div>
          <h2 className="pixel-text gold-text" style={{ fontSize: '20px', marginBottom: '10px', textShadow: '0 0 15px var(--gold)' }}>
            48H MAROX EVENT
          </h2>
          
          <div style={{ 
            background: 'rgba(0,0,0,0.5)', 
            padding: '10px', 
            borderRadius: '12px', 
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'inline-block'
          }}>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '5px', textTransform: 'uppercase' }}>Time Remaining</div>
            <div style={{ fontSize: '24px', color: '#00ff88', fontFamily: 'monospace', fontWeight: 'bold', textShadow: '0 0 10px #00ff88' }}>
              {eventTimeLeft}
            </div>
          </div>
        </div>

        {/* Scrollable Leaderboard List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--blue)', padding: '40px 0' }}>Loading event data...</div>
          ) : leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '40px 0', lineHeight: 1.5 }}>
              No players have collected points in this event yet.<br/><br/>
              <span style={{ color: 'var(--gold)' }}>Spin the slots or complete tasks to climb the leaderboard!</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {leaderboard.map((user, index) => {
                const rank = index + 1;
                const isMe = user.telegramId === telegramUser?.id?.toString();
                const reward = getRewardForRank(rank);

                return (
                  <div 
                    key={user.telegramId} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: isMe ? 'linear-gradient(90deg, rgba(0,210,255,0.2) 0%, rgba(0,210,255,0.05) 100%)' : 'rgba(255,255,255,0.05)',
                      border: isMe ? '1px solid var(--blue)' : reward ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '16px',
                      padding: '15px',
                      boxShadow: reward ? '0 0 15px rgba(255,183,0,0.15)' : 'none',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Rank Badge */}
                    <div style={{ 
                      width: '35px', 
                      height: '35px', 
                      borderRadius: '50%', 
                      background: reward ? 'var(--gold)' : 'rgba(255,255,255,0.1)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: reward ? '18px' : '14px',
                      fontWeight: 'bold',
                      color: reward ? '#000' : '#fff',
                      marginRight: '15px',
                      flexShrink: 0
                    }}>
                      {reward ? reward.badge : `#${rank}`}
                    </div>

                    {/* User Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        color: isMe ? 'var(--blue)' : '#fff', 
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '4px'
                      }}>
                        {user.firstName || user.username || 'Anonymous'} {user.premium && '⭐'} {isMe && '(You)'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 'bold' }}>
                        {user.eventPoints.toLocaleString()} MRX$
                      </div>
                    </div>

                    {/* Rewards (Only for Top 3) */}
                    {reward && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                          ⚡ <span style={{ color: '#ff3333', fontWeight: 'bold' }}>{reward.energy.toLocaleString()}</span>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                          💎 <span style={{ color: 'var(--blue)', fontWeight: 'bold' }}>{reward.marox.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
