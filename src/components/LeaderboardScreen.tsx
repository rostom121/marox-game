'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/useGameStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://marox-game-production.up.railway.app';

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  points: number;
  premium: boolean;
  avatar: string;
}

export default function LeaderboardScreen() {
  const { t } = useTranslation()
  const { data, telegramUser } = useGameStore()

  const getUserTier = (points: number): 'whale' | 'master' | 'legendary' => {
    if (points >= 500000) return 'legendary';
    if (points >= 100000) return 'master';
    return 'whale';
  }

  const [activeTier, setActiveTier] = useState<'whale' | 'master' | 'legendary'>(getUserTier(data.points))

  const [leaderboardList, setLeaderboardList] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    fetch(`${API_URL}/api/leaderboard`)
      .then(res => res.json())
      .then(resData => {
        if (resData.ok && resData.leaderboard) {
          const list = resData.leaderboard.map((u: any, index: number) => ({
            id: u.telegramId,
            rank: index + 1,
            name: u.username || u.firstName || 'Player',
            points: u.points,
            premium: u.premium,
            avatar: '👤'
          }));
          setLeaderboardList(list);
        }
      })
      .catch(console.error);
  }, []);

  // Generate dynamic leaderboard list combining dummy data and the current user
  const dynamicLeaderboard = [...leaderboardList]

  // Add current user to the list
  const currentUserId = String(telegramUser?.id || 'demo');
  const currentUserName = data.gameUsername || telegramUser?.username || telegramUser?.firstName || 'You'
  // Check if current user is already in the list by ID
  if (!dynamicLeaderboard.find(p => String(p.id) === currentUserId)) {
    dynamicLeaderboard.push({
      id: currentUserId,
      rank: 0, // Rank will be calculated below
      name: currentUserName,
      points: data.points,
      premium: telegramUser?.premium || false,
      avatar: telegramUser?.photoUrl ? 'user_photo' : '👤' // Marker for user photo
    })
  } else {
    // If user is in dummy data (e.g. testing), update their points
    const userIndex = dynamicLeaderboard.findIndex(p => String(p.id) === currentUserId)
    dynamicLeaderboard[userIndex].points = data.points
  }

  // Filter by active tier
  const filteredList = dynamicLeaderboard.filter(p => {
    if (activeTier === 'legendary') return p.points >= 500000;
    if (activeTier === 'master') return p.points >= 100000 && p.points < 500000;
    return p.points < 100000;
  });

  // Sort by points descending
  filteredList.sort((a, b) => b.points - a.points)

  // Re-assign ranks based on sorted order
  filteredList.forEach((player, index) => {
    player.rank = index + 1
  })

  // Optional: If you only want to show Top N (e.g. Top 10) plus the current user if they are lower
  // For now we show the whole list
  const displayList = filteredList

  return (
    <div className="page" style={{ padding: '16px 12px' }}>
      <header className="page-header">
        <h1 className="pixel-text gold-text glow-text" style={{ fontSize: '20px', textShadow: '0 0 10px var(--gold)' }}>{t('top_players')}</h1>
        <div className="accent-line" style={{ background: 'var(--gold)', boxShadow: '0 0 10px var(--gold)' }} />
      </header>

      <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.5, margin: '8px 0 16px' }}>
        See where you stand among top MAROX Players. Compete to win massive crypto rewards!
      </p>

      {/* TIER SWITCHER */}
      <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => setActiveTier('whale')}
          style={{ flex: 1, padding: '12px 0', fontSize: '11px', fontFamily: "'Press Start 2P', monospace", borderRadius: '8px', transition: 'all 0.2s', border: activeTier === 'whale' ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid transparent', background: activeTier === 'whale' ? 'rgba(59, 130, 246, 0.8)' : 'transparent', color: activeTier === 'whale' ? '#fff' : '#9ca3af', boxShadow: activeTier === 'whale' ? '0 0 10px rgba(59, 130, 246, 0.4)' : 'none' }}
        >
          🐳 WHALE
        </button>
        <button
          onClick={() => setActiveTier('master')}
          style={{ flex: 1, padding: '12px 0', fontSize: '11px', fontFamily: "'Press Start 2P', monospace", borderRadius: '8px', transition: 'all 0.2s', border: activeTier === 'master' ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid transparent', background: activeTier === 'master' ? 'rgba(168, 85, 247, 0.8)' : 'transparent', color: activeTier === 'master' ? '#fff' : '#9ca3af', boxShadow: activeTier === 'master' ? '0 0 10px rgba(168, 85, 247, 0.4)' : 'none' }}
        >
          👑 MASTER
        </button>
        <button
          onClick={() => setActiveTier('legendary')}
          style={{ flex: 1, padding: '12px 0', fontSize: '11px', fontFamily: "'Press Start 2P', monospace", borderRadius: '8px', transition: 'all 0.2s', border: activeTier === 'legendary' ? '1px solid rgba(250, 204, 21, 0.5)' : '1px solid transparent', background: activeTier === 'legendary' ? 'rgba(250, 204, 21, 0.8)' : 'transparent', color: activeTier === 'legendary' ? '#000' : '#9ca3af', boxShadow: activeTier === 'legendary' ? '0 0 10px rgba(250, 204, 21, 0.4)' : 'none' }}
        >
          🐉 LEGEND
        </button>
      </div>

      {/* Top Player Card */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
        {displayList[0] && (
          <div className="card" style={{ width: '60%', maxWidth: '200px', padding: '12px 12px', textAlign: 'center', background: 'rgba(255, 183, 0, 0.08)', border: '2px solid var(--gold)', boxShadow: '0 0 15px rgba(255, 183, 0, 0.2)', borderRadius: '12px' }}>
            <div style={{ fontSize: '32px', animation: 'bounceSymbol 1.5s infinite' }}>🏆</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--gold)', margin: '4px 0' }}>
              {displayList[0].name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gold)', fontFamily: 'monospace', fontWeight: 'bold' }}>{displayList[0].points.toLocaleString()}</div>
          </div>
        )}
      </div>

      {/* Leaderboard Scrollable List */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ overflowY: 'auto', padding: '6px' }}>
          {displayList.map((player) => {
            const isMe = String(player.id) === currentUserId;
            return (
              <div
                key={player.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 12px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  background: isMe ? 'rgba(255, 183, 0, 0.15)' : player.rank <= 3 ? 'rgba(157, 78, 221, 0.05)' : 'transparent',
                  border: isMe ? '1px solid var(--gold)' : 'none',
                  borderRadius: isMe ? '8px' : '0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', fontFamily: 'monospace', color: player.rank <= 3 || isMe ? 'var(--gold)' : 'var(--text-dim)', width: '24px', textAlign: 'center', fontWeight: 'bold' }}>
                    #{player.rank}
                  </span>
                  {player.avatar === 'user_photo' && telegramUser?.photoUrl ? (
                     <img src={telegramUser.photoUrl} alt="User Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                  ) : (
                     <span style={{ fontSize: '24px' }}>{player.avatar}</span>
                  )}
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: isMe ? 'var(--gold)' : '#fff' }}>
                    {player.name} {isMe && '(You)'} {player.premium && <span style={{ color: 'var(--gold)', fontSize: '10px' }}>⚡</span>}
                  </span>
                </div>
                <span style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--blue)' }}>
                  {player.points.toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
