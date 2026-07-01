import React, { useState } from 'react'
import { useGameStore, DAILY_REWARDS } from '../store/useGameStore'

interface DailyRewardModalProps {
  onClose: () => void;
}

export default function DailyRewardModal({ onClose }: DailyRewardModalProps) {
  const { getDailyStatus, claimDailyReward } = useGameStore();
  const status = getDailyStatus();
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [justClaimedReward, setJustClaimedReward] = useState<typeof DAILY_REWARDS[0] | null>(null);

  const handleClaim = async () => {
    if (status.canClaim) {
      const reward = status.nextReward;
      const success = claimDailyReward();
      if (success) {
        setJustClaimedReward(reward);
        setShowCelebration(true);

        // Sync with server
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://marox-game-production.up.railway.app';
        try {
          const res = await fetch(`${API_URL}/api/daily/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telegramId: useGameStore.getState().telegramUser?.id,
              points: reward.points,
              coins: reward.coins,
              energy: reward.energy
            })
          });
          const data = await res.json();
          if (data.ok && data.user) {
            useGameStore.getState().setServerData(data.user);
          }
        } catch (e) {
          console.error("Daily claim sync failed", e);
        }
      }
    }
  };

  if (showCelebration && justClaimedReward) {
    return (
      <div className="welcome-modal-overlay" onClick={onClose} style={{ zIndex: 3000 }}>
        <div className="welcome-modal-card card" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', border: '2px solid var(--gold)', boxShadow: '0 0 50px rgba(255,183,0,0.5)', background: 'linear-gradient(180deg, #160f29 0%, #2a0845 100%)' }}>
          <div style={{ fontSize: 60, animation: 'bounce 1s infinite' }}>🎁</div>
          <h2 className="pixel-text gold-text" style={{ fontSize: '24px', textShadow: '0 0 15px var(--gold)', margin: '15px 0' }}>
            REWARD CLAIMED!
          </h2>
          <p style={{ color: '#fff', fontSize: '14px', marginBottom: '20px' }}>
            You have successfully claimed today's reward:
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
            {justClaimedReward.energy > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '10px' }}>
                <div style={{ fontSize: '20px' }}>⚡</div>
                <div style={{ color: '#fff', fontWeight: 'bold' }}>+{justClaimedReward.energy}</div>
              </div>
            )}
            {justClaimedReward.coins > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '10px' }}>
                <div style={{ fontSize: '20px' }}>🪙</div>
                <div style={{ color: 'var(--gold)', fontWeight: 'bold' }}>+{justClaimedReward.coins}</div>
              </div>
            )}
            {justClaimedReward.points > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '10px' }}>
                <div style={{ fontSize: '20px' }}>💎</div>
                <div style={{ color: 'var(--blue)', fontWeight: 'bold' }}>+{justClaimedReward.points}</div>
              </div>
            )}
          </div>
          
          <button className="claim-btn pixel-text" onClick={onClose}>
            AWESOME!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="welcome-modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
      <div className="welcome-modal-card card" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '320px', width: 'fit-content', padding: '20px 15px' }}>
        <button className="red-glow-close-btn" onClick={onClose}>✕</button>
        
        <h2 className="pixel-text" style={{ fontSize: '18px', color: 'var(--blue)', marginBottom: '5px', marginTop: '10px' }}>
          DAILY REWARDS
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '20px', lineHeight: 1.5 }}>
          Log in daily to earn rewards. Missing a day will reset your streak back to Day 1!
        </p>

        <div className="daily-reward-grid">
          {DAILY_REWARDS.map((reward) => {
            const isClaimed = reward.day < status.currentStreak || (!status.canClaim && reward.day === status.currentStreak);
            const isToday = status.canClaim && reward.day === status.currentStreak;
            const isLocked = reward.day > status.currentStreak;

            let cardClass = "daily-card ";
            if (isClaimed) cardClass += "claimed";
            else if (isToday) cardClass += "today";
            else if (isLocked) cardClass += "locked";

            return (
              <div key={reward.day} className={cardClass}>
                <div className="daily-day-label">DAY {reward.day}</div>
                <div className="daily-reward-icons">
                  {reward.energy > 0 && <div>⚡ <span className="val">{reward.energy}</span></div>}
                  {reward.coins > 0 && <div>🪙 <span className="val">{reward.coins}</span></div>}
                  {reward.points > 0 && <div>💎 <span className="val">{reward.points}</span></div>}
                </div>
                {isClaimed && <div className="daily-status-icon">✅</div>}
                {isLocked && <div className="daily-status-icon">🔒</div>}
              </div>
            );
          })}
        </div>

        <button 
          className={`claim-btn pixel-text ${!status.canClaim ? 'disabled' : ''}`}
          onClick={handleClaim}
          disabled={!status.canClaim}
          style={{ marginTop: '25px', opacity: status.canClaim ? 1 : 0.5, width: '100%' }}
        >
          {status.canClaim ? 'CLAIM TODAY\'S REWARD' : 'COME BACK TOMORROW'}
        </button>
      </div>
    </div>
  )
}
