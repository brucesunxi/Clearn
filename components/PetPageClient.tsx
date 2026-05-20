'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import {
  getPet, getInventory, feedPet, buyFood, buyAccessory, toggleEquip,
  FOOD_ITEMS, ACCESSORY_ITEMS, petStatsText,
} from '@/lib/pet'
import type { PetState, Inventory } from '@/lib/pet'
import { trackActivity } from '@/lib/activity'

const ACCESSORY_POSITIONS: Record<string, { top: string; left: string; size: string }> = {
  red_scarf: { top: '62%', left: '40%', size: '28px' },
  bamboo_hat: { top: '14%', left: '32%', size: '32px' },
  glasses: { top: '36%', left: '26%', size: '36px' },
  bowtie: { top: '58%', left: '40%', size: '24px' },
  crown: { top: '10%', left: '32%', size: '34px' },
  necklace: { top: '55%', left: '36%', size: '26px' },
}

export default function PetPageClient() {
  const { t, locale } = useTranslation()
  const [tab, setTab] = useState<'panda' | 'shop'>('panda')
  const [pet, setPet] = useState<PetState>(() => getPet())
  const [inv, setInv] = useState<Inventory>(() => getInventory())
  const [feedMsg, setFeedMsg] = useState('')
  const [shopMsg, setShopMsg] = useState('')

  // Sync coins and pet state from API/Redis on mount
  useEffect(() => {
    const userId = localStorage.getItem('chineselearn-user-id')
    if (!userId) return
    fetch('/api/inventory', { headers: { 'x-user-id': userId } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return
        // Sync coin balance from API to localStorage
        const currentInv = getInventory()
        currentInv.coins = data.coins
        if (data.inventory) {
          currentInv.food = { ...data.inventory.food }
          currentInv.accessories = { ...data.inventory.accessories }
          currentInv.equipped = [...data.inventory.equipped]
        }
        localStorage.setItem('panda-inventory', JSON.stringify(currentInv))
        setInv({ ...currentInv })
        // Sync pet state
        if (data.pet) {
          localStorage.setItem('panda-pet', JSON.stringify(data.pet))
          setPet(data.pet)
        }
      })
      .catch(() => {})
  }, [])

  const handleFeed = (foodId: string) => {
    const result = feedPet(foodId)
    setPet(result.pet)
    setInv(result.inventory)
    setFeedMsg(result.message)
    trackActivity('pet_feed', { foodId })
    setTimeout(() => setFeedMsg(''), 2500)
  }

  const handleBuyFood = (foodId: string) => {
    const ok = buyFood(foodId, 1)
    if (ok) {
      setInv(getInventory())
      setShopMsg('+1 🎉')
      trackActivity('shop_purchase', { itemId: foodId, type: 'food' })
    } else {
      setShopMsg('Not enough coins!')
    }
    setTimeout(() => setShopMsg(''), 1500)
  }

  const handleBuyAccessory = (accId: string) => {
    const ok = buyAccessory(accId)
    if (ok) {
      setInv(getInventory())
      setShopMsg('Purchased! 🎉')
      const item = ACCESSORY_ITEMS.find((a) => a.id === accId)
      trackActivity('shop_purchase', { itemId: accId, type: 'accessory', price: item?.price || 0 })
    } else {
      setShopMsg('Not enough coins!')
    }
    setTimeout(() => setShopMsg(''), 2000)
  }

  const handleToggleEquip = (accId: string) => {
    const updated = toggleEquip(accId)
    setInv({ ...updated })
  }

  const statusText = petStatsText(pet)
  const hungerPct = pet.hunger
  const happinessPct = pet.happiness

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        🐼 {locale === 'zh' ? '我的熊猫' : 'My Panda'}
      </h1>
      <p className="text-gray-400 mb-6">{locale === 'zh' ? '照顾你的熊猫朋友吧！' : 'Take care of your panda friend!'}</p>

      {/* Coins display */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 mb-6 flex items-center gap-2 text-sm">
        <span className="text-lg">🪙</span>
        <span className="font-bold text-yellow-700">{inv.coins}</span>
        <span className="text-yellow-500">{locale === 'zh' ? '金币' : 'coins'}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('panda')}
          className={`flex-1 py-3 rounded-xl text-base font-medium transition-all ${tab === 'panda' ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          🐼 {locale === 'zh' ? '我的熊猫' : 'My Panda'}
        </button>
        <button
          onClick={() => setTab('shop')}
          className={`flex-1 py-3 rounded-xl text-base font-medium transition-all ${tab === 'shop' ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          🏪 {locale === 'zh' ? '商店' : 'Shop'}
        </button>
      </div>

      {tab === 'panda' && (
        <>
          {/* Panda Display */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6 text-center relative">
            <div className="relative inline-block" style={{ width: 128, height: 128 }}>
              {/* Base panda */}
              <svg width="128" height="128" viewBox="0 0 64 64" className="absolute inset-0">
                <circle cx="16" cy="18" r="10" fill="#2D2D2D" />
                <circle cx="48" cy="18" r="10" fill="#2D2D2D" />
                <circle cx="32" cy="32" r="24" fill="white" stroke="#2D2D2D" strokeWidth="1.5" />
                <ellipse cx="21" cy="28" rx="8" ry="7" fill="#2D2D2D" />
                <ellipse cx="43" cy="28" rx="8" ry="7" fill="#2D2D2D" />
                <circle cx="21" cy="27" r="3.5" fill="white" />
                <circle cx="43" cy="27" r="3.5" fill="white" />
                <circle cx="21" cy="27" r="2" fill="#2D2D2D" />
                <circle cx="43" cy="27" r="2" fill="#2D2D2D" />
                <ellipse cx="32" cy="36" rx="3" ry="2" fill="#2D2D2D" />
                <path d="M29 39 C29 43,35 43,35 39" stroke="#2D2D2D" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                {pet.hunger <= 30 && (
                  <>
                    <text x="17" y="25" fontSize="5" fill="white" fontWeight="bold" transform="rotate(-15,17,25)">×</text>
                    <text x="41" y="25" fontSize="5" fill="white" fontWeight="bold" transform="rotate(15,41,25)">×</text>
                  </>
                )}
              </svg>
              {/* Accessories */}
              {inv.equipped.map((accId) => {
                const pos = ACCESSORY_POSITIONS[accId]
                if (!pos) return null
                const item = ACCESSORY_ITEMS.find((a) => a.id === accId)
                return (
                  <span
                    key={accId}
                    className="absolute pointer-events-none"
                    style={{ top: pos.top, left: pos.left, fontSize: pos.size, transform: 'translate(-50%,-50%)' }}
                  >
                    {item?.emoji}
                  </span>
                )
              })}
            </div>
            <p className="mt-4 text-lg font-medium text-gray-700">{statusText}</p>

            {/* Hunger bar */}
            <div className="mt-4 text-left">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>🍚 {locale === 'zh' ? '饱食度' : 'Hunger'}</span>
                <span>{hungerPct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${hungerPct}%`,
                    backgroundColor: hungerPct > 50 ? '#F97316' : hungerPct > 20 ? '#EF4444' : '#DC2626',
                  }}
                />
              </div>
            </div>

            {/* Happiness bar */}
            <div className="mt-3 text-left">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>😊 {locale === 'zh' ? '快乐值' : 'Happiness'}</span>
                <span>{happinessPct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${happinessPct}%`,
                    backgroundColor: happinessPct > 50 ? '#8B5CF6' : happinessPct > 20 ? '#A855F7' : '#9333EA',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Feed section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-base font-bold text-gray-800 mb-3">
              🍽️ {locale === 'zh' ? '喂食' : 'Feed Panda'}
            </h3>
            {feedMsg && (
              <p className="text-sm text-green-600 mb-3 bg-green-50 rounded-lg px-3 py-2">{feedMsg}</p>
            )}
            <div className="grid grid-cols-5 gap-2">
              {FOOD_ITEMS.map((food) => {
                const qty = inv.food[food.id] || 0
                return (
                  <button
                    key={food.id}
                    onClick={() => qty > 0 && handleFeed(food.id)}
                    disabled={qty <= 0}
                    className={`p-2 rounded-xl text-center transition-all ${qty > 0 ? 'bg-orange-50 hover:bg-orange-100 border border-orange-200' : 'bg-gray-50 opacity-40'}`}
                  >
                    <div className="text-xl">{food.emoji}</div>
                    <div className="text-xs text-gray-500 mt-0.5">×{qty}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Accessories display */}
          {inv.equipped.length > 0 && (
            <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-base font-bold text-gray-800 mb-3">
                💎 {locale === 'zh' ? '已佩戴' : 'Equipped'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {inv.equipped.map((accId) => {
                  const item = ACCESSORY_ITEMS.find((a) => a.id === accId)
                  if (!item) return null
                  return (
                    <button
                      key={accId}
                      onClick={() => handleToggleEquip(accId)}
                      className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-sm flex items-center gap-1 hover:bg-purple-100"
                    >
                      {item.emoji} {item.name} ✕
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Shop tab */}
      {tab === 'shop' && (
        <>
          {shopMsg && (
            <p className="text-sm text-center text-green-600 mb-4 bg-green-50 rounded-lg px-3 py-2">{shopMsg}</p>
          )}

          {/* Food shop */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
            <h3 className="text-base font-bold text-gray-800 mb-4">
              🍽️ {locale === 'zh' ? '食物' : 'Food'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FOOD_ITEMS.map((food) => {
                const canAfford = inv.coins >= food.price
                return (
                  <div key={food.id} className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                    <span className="text-2xl">{food.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700">{food.name}</p>
                      <p className="text-xs text-gray-400 truncate">
                        +{food.effect?.hunger || 0} 🍚 +{food.effect?.happiness || 0} 😊
                      </p>
                      <button
                        onClick={() => handleBuyFood(food.id)}
                        disabled={!canAfford}
                        className="mt-1.5 px-3 py-1 text-xs rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                      >
                        🪙 {food.price}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Accessory shop */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-base font-bold text-gray-800 mb-4">
              💎 {locale === 'zh' ? '饰品' : 'Accessories'}
            </h3>
            <div className="space-y-3">
              {ACCESSORY_ITEMS.map((acc) => {
                const owned = !!inv.accessories[acc.id]
                const equipped = inv.equipped.includes(acc.id)
                return (
                  <div key={acc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{acc.emoji}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{acc.name}</p>
                        <p className="text-xs text-gray-400">{acc.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {owned ? (
                        <button
                          onClick={() => handleToggleEquip(acc.id)}
                          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            equipped
                              ? 'bg-purple-100 text-purple-700 border border-purple-300'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {equipped ? (locale === 'zh' ? '已佩戴 ✓' : 'Equipped ✓') : (locale === 'zh' ? '佩戴' : 'Wear')}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-yellow-600 font-medium">🪙 {acc.price}</span>
                          <button
                            onClick={() => handleBuyAccessory(acc.id)}
                            disabled={inv.coins < acc.price}
                            className="px-3 py-1.5 text-xs rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                          >
                            {locale === 'zh' ? '购买' : 'Buy'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
