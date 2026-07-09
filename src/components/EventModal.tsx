import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';

interface EventModalProps {
  onClose: () => void;
}

const EVENT_END_TIME = new Date("2026-07-09T13:30:00Z").getTime();

export default function EventModal({ onClose }: EventModalProps) {
  const { telegramUser } = useGameStore();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTimeLeft, setEventTimeLeft] = useState<string>('');

  useEffect(() => {
    setLoading(false);
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
          width: '98%', 
          maxWidth: '800px', 
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #1f0b3b 0%, #0d061c 100%)', 
          border: '2px solid var(--gold)', 
          borderRadius: '20px', 
          boxShadow: '0 0 40px rgba(255, 183, 0, 0.4)',
          position: 'relative'
        }}
      >
        <button className="red-glow-close-btn" onClick={onClose} style={{ position: 'absolute', top: '-15px', right: '-15px', zIndex: 10 }}>✕</button>
        
        {/* Header Section */}
        <div style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', position: 'relative', flexShrink: 0 }}>
          
          <div style={{ fontSize: '20px', marginBottom: '2px' }}>🏆</div>
          <h2 className="pixel-text gold-text" style={{ fontSize: '14px', marginBottom: '4px', textShadow: '0 0 15px var(--gold)' }}>
            48H MAROX EVENT
          </h2>
          
          <div style={{ 
            background: 'rgba(0,0,0,0.5)', 
            padding: '4px 10px', 
            borderRadius: '12px', 
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'inline-block'
          }}>
            <div style={{ fontSize: '7px', color: 'var(--text-dim)', marginBottom: '2px', textTransform: 'uppercase' }}>Time Remaining</div>
            <div style={{ fontSize: '14px', color: '#00ff88', fontFamily: 'monospace', fontWeight: 'bold', textShadow: '0 0 10px #00ff88' }}>
              {eventTimeLeft}
            </div>
          </div>
        </div>

        {/* Scrollable Leaderboard List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '40px 0', lineHeight: 1.6 }}>
            <span style={{ fontSize: '50px', display: 'block', marginBottom: '20px' }}>🎉</span>
            <span style={{ color: 'var(--gold)', fontSize: '20px', fontWeight: 'bold', display: 'block', marginBottom: '15px', textShadow: '0 0 10px rgba(255,215,0,0.5)' }}>EVENT ENDED!</span>
            The 48H MAROX Event has successfully concluded.<br/><br/>
            If you were among the top players,<br/>
            your prizes have been sent to your <span style={{ color: 'var(--blue)', fontWeight: 'bold' }}>Items</span> section.<br/><br/>
            <span style={{ color: '#fff', fontSize: '13px' }}>Thank you for participating!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
