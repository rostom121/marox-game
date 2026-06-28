import React, { useState, useEffect, useRef } from 'react'
import { useGameStore, getUpgradeCost } from '../store/useGameStore'

interface PlayerInfoModalProps {
  onClose: () => void;
}

export default function PlayerInfoModal({ onClose }: PlayerInfoModalProps) {
  const { data, telegramUser, upgradeLevel } = useGameStore();
  const cost = getUpgradeCost(data.level);
  const canUpgrade = data.coins >= cost;
  
  const [showCelebration, setShowCelebration] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpgrade = () => {
    if (canUpgrade) {
      const success = upgradeLevel();
      if (success) {
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
            LEVEL UP!
          </h2>
          
          <p style={{ color: '#fff', fontSize: '14px', marginBottom: '20px' }}>
            Congratulations <strong style={{color: 'var(--blue)'}}>{data.gameUsername || telegramUser?.username || telegramUser?.firstName || 'Player'}</strong>! You have reached a new level.
          </p>
          
          <div className="player-modal-level-badge" style={{ fontSize: '18px', padding: '10px 20px', background: 'var(--gold)', color: '#000', border: 'none', boxShadow: '0 0 20px var(--gold)' }}>
            LEVEL {data.level}
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
        
        <h2 className="player-modal-name">{data.gameUsername || telegramUser?.firstName || 'Player'}</h2>
        <div className="player-modal-level-badge">LEVEL {data.level}</div>
        
        <div className="player-modal-stats">
          <div className="stat-item">
            <span className="stat-label">Total Gold</span>
            <span className="stat-value gold-text">🪙 {data.coins.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="player-modal-upgrade-section">
          <div className="upgrade-info">
            <span>Next Level Cost:</span>
            <span className="cost-value">🪙 {cost.toLocaleString()}</span>
          </div>
          
          <button 
            className={`upgrade-btn pixel-text ${canUpgrade ? 'active' : 'disabled'}`}
            onClick={handleUpgrade}
            disabled={!canUpgrade}
          >
            UPGRADE LEVEL
          </button>
          
          {!canUpgrade && (
            <div className="upgrade-warning">Not enough gold</div>
          )}
        </div>
      </div>
    </div>
  )
}
