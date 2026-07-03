import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore, getUpgradeCost, getUpgradeClicksRequired } from '../store/useGameStore'

const formatK = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'k';
  return num.toString();
};

interface PlayerInfoModalProps {
  onClose: () => void;
}

export default function PlayerInfoModal({ onClose }: PlayerInfoModalProps) {
  const { t } = useTranslation()
  const { data, telegramUser, upgradeLevel } = useGameStore();
  const cost = getUpgradeCost(data.level);
  const canUpgrade = data.coins >= cost;
  
  const requiredClicks = getUpgradeClicksRequired(data.level);
  const currentClicks = data.xp || 0;
  const progressPercent = Math.min(100, Math.max(0, (currentClicks / requiredClicks) * 100));
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpgrade = async () => {
    if (canUpgrade && !isUpgrading) {
      setIsUpgrading(true);
      const result = await upgradeLevel();
      setIsUpgrading(false);
      if (result.success && result.leveledUp) {
        setShowCelebration(true);
      }
    }
  };

  // Canvas Star Explosion Effect
  useEffect(() => {
    if (!showCelebration) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles: {x: number, y: number, vx: number, vy: number, size: number, color: string, life: number, maxLife: number, rot: number, vRot: number}[] = [];
    const colors = ['#ffb700', '#fff', '#00d2ff', '#ff3333', '#9d4edd'];

    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: Math.random() * 40 + 40,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.4
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let aliveParticles = 0;

      for (const p of particles) {
        if (p.life >= p.maxLife) continue;
        aliveParticles++;
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.rot += p.vRot;

        const progress = p.life / p.maxLife;
        const alpha = 1 - Math.pow(progress, 3); // fade out at end

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        
        // draw star
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
          ctx.lineTo(Math.cos((18 + j * 72) * Math.PI / 180) * p.size * 2,
                     -Math.sin((18 + j * 72) * Math.PI / 180) * p.size * 2);
          ctx.lineTo(Math.cos((54 + j * 72) * Math.PI / 180) * p.size,
                     -Math.sin((54 + j * 72) * Math.PI / 180) * p.size);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      if (aliveParticles > 0) {
        animationId = requestAnimationFrame(animate);
      }
    };
    
    animate();
    
    return () => cancelAnimationFrame(animationId);
  }, [showCelebration]);

  if (showCelebration) {
    return (
      <div className="player-modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />
        <div className="player-modal-content celebration-card" onClick={(e) => e.stopPropagation()} style={{ zIndex: 2, background: 'linear-gradient(180deg, #160f29 0%, #2a0845 100%)', border: '2px solid var(--gold)', boxShadow: '0 0 50px rgba(255,183,0,0.5)' }}>
          <div className="player-modal-avatar" style={{ transform: 'scale(1.2)', margin: '20px auto 30px' }}>
            <img
              src={telegramUser?.photoUrl || "/marox.png"}
              onError={(e: any) => { e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23e63946'/><circle cx='50' cy='55' r='20' fill='%23fff'/><rect x='35' y='18' width='30' height='18' fill='%23fff' rx='4'/></svg>" }}
              alt="Avatar"
              style={{ objectFit: 'cover' }}
            />
          </div>
          
          <h2 className="pixel-text gold-text" style={{ fontSize: '24px', textShadow: '0 0 15px var(--gold)', marginBottom: '10px' }}>
            {t('level_up')}
          </h2>
          
          <p style={{ color: '#fff', fontSize: '14px', marginBottom: '20px' }}>
            {t('congratulations')} <strong style={{color: 'var(--blue)'}}>{data.gameUsername || telegramUser?.username || telegramUser?.firstName || 'Player'}</strong>! {t('reached_new_level')}
          </p>
          
          <div className="player-modal-level-badge" style={{ fontSize: '18px', padding: '10px 20px', background: 'var(--gold)', color: '#000', border: 'none', boxShadow: '0 0 20px var(--gold)' }}>
            {t('level')} {data.level}
          </div>
          
          <div style={{ marginTop: '20px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#00d2ff', fontWeight: 'bold', fontSize: '20px', textShadow: '0 0 10px #00d2ff' }}>+30 ⚡</span>
            <span style={{ color: '#fff', fontSize: '12px', opacity: 0.8 }}>Energy Reward</span>
          </div>
          
          <button 
            className="upgrade-btn pixel-text active"
            onClick={onClose}
            style={{ marginTop: '20px' }}
          >
            AWESOME!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="player-modal-overlay" onClick={onClose}>
      <div className="player-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="red-glow-close-btn" onClick={onClose}>✕</button>
        
        <div className="player-modal-avatar">
          <img
            src={telegramUser?.photoUrl || "/marox.png"}
            onError={(e: any) => { e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23e63946'/><circle cx='50' cy='55' r='20' fill='%23fff'/><rect x='35' y='18' width='30' height='18' fill='%23fff' rx='4'/></svg>" }}
            alt="Avatar"
            style={{ objectFit: 'cover' }}
          />
        </div>
        
        <h2 className="player-modal-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '6px' }}>
          {data.gameUsername || telegramUser?.firstName || 'Player'}
          {data.isOG && <span style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 'bold', textShadow: '0 0 5px var(--gold)', background: 'rgba(255,215,0,0.15)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,215,0,0.3)' }}>👑 OG Builders</span>}
        </h2>
        <div className="player-modal-level-badge">{t('level')} {data.level}</div>
        
        <div className="player-modal-stats">
          <div className="stat-item">
            <span className="stat-label">{t('total_gold')}</span>
            <span className="stat-value gold-text">🪙 {formatK(data.coins)}</span>
          </div>
        </div>
        
        <div className="player-modal-upgrade-section">
          <div className="upgrade-info" style={{ marginBottom: '10px' }}>
            <span>{t('upgrade_cost')}:</span>
            <span className="cost-value">🪙 {formatK(cost)}</span>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)', marginBottom: '5px' }}>
              <span>{t('progress_to_level')} {data.level + 1}</span>
              <span>{currentClicks} / {requiredClicks}</span>
            </div>
            <div className="xp-bar-track" style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
              <div className="xp-bar-fill" style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--blue)', boxShadow: '0 0 10px var(--blue)' }} />
            </div>
          </div>
          
          <button 
            className={`upgrade-btn pixel-text ${canUpgrade && !isUpgrading ? 'active' : 'disabled'}`}
            onClick={handleUpgrade}
            disabled={!canUpgrade || isUpgrading}
          >
            {isUpgrading ? '...' : t('upgrade_level')}
          </button>
          
          {!canUpgrade && (
            <div className="upgrade-warning">Not enough gold</div>
          )}
        </div>
      </div>
    </div>
  )
}
