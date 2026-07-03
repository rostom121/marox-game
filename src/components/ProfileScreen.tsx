import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore, getUpgradeClicksRequired } from '../store/useGameStore'
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react'

const formatK = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'k';
  return num.toString();
};

export default function ProfileScreen() {
  const { t } = useTranslation()
  const { data, telegramUser, walletConnected, setWallet } = useGameStore()
  const address = useTonAddress()

  // Sync TON wallet address with Zustand store state
  useEffect(() => {
    if (address) {
      setWallet(address)
    } else {
      setWallet(null)
    }
  }, [address, setWallet])

  const requiredClicks = getUpgradeClicksRequired(data.level)
  const currentClicks = data.xp || 0
  const progressPercent = Math.min(100, Math.max(0, (currentClicks / requiredClicks) * 100))

  return (
    <div className="page" style={{ padding: '16px 12px' }}>
      <header className="page-header">
        <h1 className="pixel-text" style={{ fontSize: '15px', color: 'var(--blue)', textShadow: '0 0 10px var(--blue)' }}>{t('profile_title')}</h1>
        <div className="accent-line" style={{ background: 'var(--blue)', boxShadow: '0 0 10px var(--blue)' }} />
      </header>

      {/* Profile Info Card */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(22, 15, 41, 0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="avatar-img-wrap" style={{ width: '60px', height: '60px', border: '2px solid var(--blue)', borderRadius: '14px' }}>
            <img src={telegramUser?.photoUrl || "/marox.png"} onError={(e: any) => { e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23e63946'/><circle cx='50' cy='55' r='20' fill='%23fff'/><rect x='35' y='18' width='30' height='18' fill='%23fff' rx='4'/><circle cx='40' cy='52' r='3' fill='%23000'/><circle cx='60' cy='52' r='3' fill='%23000'/></svg>" }} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              {data.gameUsername || telegramUser?.firstName || 'Player'}
              {data.isOG && <span style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 'bold', textShadow: '0 0 5px var(--gold)', background: 'rgba(255,215,0,0.15)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,215,0,0.3)' }}>👑 OG Builders</span>}
            </h2>
            {telegramUser?.username && <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>@{telegramUser.username}</div>}
            <div style={{ fontSize: '11px', color: 'var(--gold)', marginTop: '4px', fontWeight: 'bold' }}>{t('level')} {data.level}</div>
            <div className="xp-bar-track" style={{ height: '6px', marginTop: '6px' }}>
              <div className="xp-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-dim)', textAlign: 'right', marginTop: '3px' }}>{Math.round(progressPercent)}% {t('to_next_level')}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '5px' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 'bold' }}>$MAROX</div>
            <div className="pixel-text" style={{ fontSize: '14px', color: 'var(--blue)', marginTop: '6px' }}>💎 {formatK(data.points)}</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>{t('wallet_address')}</div>
            <div style={{ fontSize: '11px', color: walletConnected ? '#fff' : 'var(--red)', fontWeight: 'bold', marginTop: '8px', wordBreak: 'break-all' }}>
              {walletConnected ? `${address.substring(0, 4)}...${address.substring(address.length - 4)}` : t('not_connected')}
            </div>
          </div>
        </div>
      </div>

      {/* OG Benefits Section */}
      {data.isOG && (
        <div className="card" style={{ padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--gold)', textShadow: '0 0 5px var(--gold)', textAlign: 'center', fontWeight: 'bold', marginBottom: '8px' }}>👑 MAROX OG Builders</h3>
          <div style={{ fontSize: '11px', color: '#fff', lineHeight: 1.6 }}>
            <div style={{ marginBottom: '6px' }}>💎 <b style={{ color: 'var(--gold)' }}>Airdrop Bonus:</b> You earn 1.5x MAROX points and future airdrops.</div>
            <div style={{ marginBottom: '6px' }}>🚀 <b style={{ color: 'var(--gold)' }}>Early Access:</b> Try new features and updates before everyone else.</div>
            <div style={{ marginBottom: '6px' }}>⭐ <b style={{ color: 'var(--gold)' }}>Community Status:</b> Exclusive OG rank in the community.</div>
            <div>💡 <b style={{ color: 'var(--gold)' }}>Closer to the Team:</b> Help shape the future of MAROX.</div>
          </div>
        </div>
      )}

      {/* TON Wallet Connect Section */}
      <div className="settings-section">
        <h3 className="settings-section-title">{t('ton_wallet')}</h3>
        <div className="wallet-card card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(22, 15, 41, 0.6)' }}>
          <p className="wallet-desc" style={{ fontSize: '10px', color: 'var(--text-dim)', lineHeight: 1.5, textAlign: 'center' }}>
            {walletConnected
              ? `${t('ton_wallet_desc_connected')} ${address.substring(0, 6)}...${address.substring(address.length - 6)}`
              : t('ton_wallet_desc_not')}
          </p>
          <div className="ton-connect-btn-wrapper">
            <TonConnectButton />
          </div>
        </div>
      </div>

    </div>
  )
}
