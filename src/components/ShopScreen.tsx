'use client'

import { useState } from 'react'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { useGameStore } from '../store/useGameStore'

const DESTINATION_WALLET = 'UQAlEG3XMAbp2aD4OgGvUuQ5Rd1MELL04dq8ioam1jAIR51-'

const ENERGY_PACKAGES = [
  { id: 'e1', amount: 500, price: 0.5, type: 'energy', label: '500 ENERGY', emoji: '⚡', highlight: false },
  { id: 'e2', amount: 1500, price: 1.0, type: 'energy', label: '1,500 ENERGY', emoji: '🔋', highlight: false },
  { id: 'e3', amount: 5000, price: 4.0, type: 'energy', label: '5,000 ENERGY', emoji: '🔥', highlight: false },
  { id: 'e4', amount: 10000, price: 7.5, type: 'energy', label: '10,000 ENERGY', emoji: '💎⚡', highlight: true },
  { id: 'e5', amount: 20000, price: 12.0, type: 'energy', label: '20,000 ENERGY', emoji: '🚀', highlight: false },
  { id: 'e6', amount: 50000, price: 15.0, type: 'energy', label: '50,000 ENERGY', emoji: '👑⚡', highlight: true },
]

const COINS_PACKAGES = [
  { id: 'c1', amount: 10000, price: 1.5, type: 'coins', label: '10,000 COINS', emoji: '🪙', highlight: false },
  { id: 'c2', amount: 20000, price: 2.7, type: 'coins', label: '20,000 COINS', emoji: '💰', highlight: false },
  { id: 'c3', amount: 50000, price: 4.9, type: 'coins', label: '50,000 COINS', emoji: '🤑', highlight: true },
  { id: 'c4', amount: 100000, price: 7.99, type: 'coins', label: '100,000 COINS', emoji: '🏆🪙', highlight: true },
]

export default function ShopScreen() {
  const { addPurchasedItems, data } = useGameStore()
  const wallet = useTonWallet()
  const [tonConnectUI] = useTonConnectUI()
  
  const [activeTab, setActiveTab] = useState<'energy'|'coins'>('energy')
  const [isProcessing, setIsProcessing] = useState(false)
  const [txMessage, setTxMessage] = useState<string | null>(null)

  const handlePurchase = async (pkg: { id: string, amount: number, price: number, type: string, label: string, emoji: string, highlight: boolean }) => {
    if (!wallet) {
      tonConnectUI.openModal()
      return
    }

    try {
      setIsProcessing(true)
      setTxMessage('APPROVE IN WALLET...')

      const amountNano = Math.floor(pkg.price * 1e9).toString()

      const transaction = {
        // eslint-disable-next-line react-hooks/purity
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: DESTINATION_WALLET,
            amount: amountNano
          }
        ]
      }

      await tonConnectUI.sendTransaction(transaction)

      setTxMessage('PAYMENT SUCCESSFUL! 💸')
      
      setTimeout(() => {
        if (pkg.type === 'energy') {
          addPurchasedItems(pkg.amount, 0)
        } else {
          addPurchasedItems(0, pkg.amount)
        }
        setTxMessage(null)
      }, 1500)

    } catch (e) {
      console.error(e)
      setTxMessage('PAYMENT FAILED OR CANCELLED')
      setTimeout(() => setTxMessage(null), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  const packages = activeTab === 'energy' ? ENERGY_PACKAGES : COINS_PACKAGES

  return (
    <div className="h-full w-full flex flex-col p-4 overflow-y-auto pb-24 relative" style={{ background: 'var(--dark-bg)' }}>
      {/* HEADER */}
      <div className="flex flex-col items-center mt-4 mb-6">
        <h1 className="pixel-text gold-text text-xl mb-2" style={{ textShadow: '0 4px 10px rgba(255,183,0,0.4)' }}>
          MAROX SHOP
        </h1>
        <p className="text-xs text-center" style={{ color: 'var(--text-dim)' }}>
          Buy Energy and Coins to dominate the leaderboard!
        </p>
      </div>

      {/* BALANCES */}
      <div className="flex justify-center gap-4 mb-6">
        <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-yellow-500/30">
          <span>⚡</span>
          <span className="pixel-text text-[10px] text-white">{data.energy}</span>
        </div>
        <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-yellow-500/30">
          <span>🪙</span>
          <span className="pixel-text text-[10px] text-white">{data.coins.toLocaleString()}</span>
        </div>
      </div>

      {/* TAB SWITCHER */}
      <div className="flex w-full mb-6 bg-black/30 rounded-xl p-1 border border-white/5 relative z-10">
        <button
          onClick={() => setActiveTab('energy')}
          className={`flex-1 py-3 pixel-text text-[10px] rounded-lg transition-all ${
            activeTab === 'energy' 
            ? 'bg-blue-600/80 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] border border-blue-400/50' 
            : 'text-gray-400 hover:bg-white/5'
          }`}
        >
          ⚡ ENERGY
        </button>
        <button
          onClick={() => setActiveTab('coins')}
          className={`flex-1 py-3 pixel-text text-[10px] rounded-lg transition-all ${
            activeTab === 'coins' 
            ? 'bg-yellow-600/80 text-white shadow-[0_0_15px_rgba(202,138,4,0.5)] border border-yellow-400/50' 
            : 'text-gray-400 hover:bg-white/5'
          }`}
        >
          🪙 COINS
        </button>
      </div>

      {/* PACKAGES GRID */}
      <div className="grid grid-cols-2 gap-3 relative z-10">
        {packages.map((pkg) => (
          <div 
            key={pkg.id}
            className={`relative flex flex-col items-center p-4 rounded-2xl border ${
              pkg.highlight 
                ? (activeTab === 'energy' ? 'border-blue-400 bg-blue-900/20 shadow-[0_0_20px_rgba(96,165,250,0.3)]' : 'border-yellow-400 bg-yellow-900/20 shadow-[0_0_20px_rgba(250,204,21,0.3)]')
                : 'border-white/10 bg-black/40'
            }`}
          >
            {pkg.highlight && (
              <div className="absolute -top-3 bg-red-500 text-white text-[8px] pixel-text px-2 py-1 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] border border-white/20 z-10">
                BEST VALUE
              </div>
            )}
            <div className="text-4xl mb-2 mt-2 filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]">{pkg.emoji}</div>
            <div className={`pixel-text text-[10px] mb-4 text-center ${activeTab === 'energy' ? 'text-blue-300' : 'text-yellow-300'}`}>
              {pkg.label}
            </div>
            
            <button 
              onClick={() => handlePurchase(pkg)}
              disabled={isProcessing}
              className={`w-full py-2 rounded-xl flex items-center justify-center gap-1 border-b-2 active:translate-y-[2px] active:border-b-0 transition-all ${
                activeTab === 'energy'
                  ? 'bg-blue-500 border-blue-700 text-white hover:bg-blue-400'
                  : 'bg-yellow-500 border-yellow-700 text-black hover:bg-yellow-400'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="mr-1.5 filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                <circle cx="50" cy="50" r="50" fill="#0088cc"/>
                <path d="M 28 35 L 72 35 L 50 72 Z" fill="none" stroke="white" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round"/>
                <line x1="50" y1="35" x2="50" y2="72" stroke="white" strokeWidth="8" strokeLinecap="round"/>
              </svg>
              <span className="font-bold">{pkg.price} GRAM</span>
            </button>
          </div>
        ))}
      </div>

      {/* OVERLAY LOADER */}
      {isProcessing && (
        <div className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="text-6xl mb-4 animate-spin filter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">⚙️</div>
          <div className="pixel-text gold-text text-center text-sm px-6 max-w-[300px] leading-relaxed">
            {txMessage}
          </div>
        </div>
      )}
    </div>
  )
}
