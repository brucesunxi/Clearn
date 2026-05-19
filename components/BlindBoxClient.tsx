'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { generateBoxes, processPrize } from '@/lib/blindbox'
import { useCoins } from '@/lib/use-coins'
import type { DrawnPrize } from '@/lib/blindbox'

const BOX_COST = 100

/** Sync localStorage inventory to Redis via API */
async function syncInventoryToApi() {
  try {
    const raw = localStorage.getItem('panda-inventory')
    if (!raw) return
    const inv = JSON.parse(raw)
    const userId = localStorage.getItem('chineselearn-user-id') || ''
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({
        inventory: { food: inv.food || {}, accessories: inv.accessories || {}, equipped: inv.equipped || [] },
      }),
    })
  } catch { /* silently fail */ }
}

async function syncPetToApi() {
  try {
    const raw = localStorage.getItem('panda-pet')
    if (!raw) return
    const userId = localStorage.getItem('chineselearn-user-id') || ''
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ pet: JSON.parse(raw) }),
    })
  } catch { /* silently fail */ }
}

export default function BlindBoxClient() {
  const { locale } = useTranslation()
  const { balance: coins, spend, add: addCoinsApi } = useCoins()
  const [phase, setPhase] = useState<'idle' | 'boxes'>('idle')
  const [boxes, setBoxes] = useState<DrawnPrize[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  const handleBuyBoxes = async () => {
    try {
      const ok = await spend(BOX_COST)
      if (!ok) {
        setMessage(locale === 'zh' ? '金币不足！去学习或完成练习赚取金币吧' : 'Not enough coins! Study or complete exercises to earn coins.')
        return
      }
      setBoxes(generateBoxes())
      setSelectedIndex(null)
      setMessage('')
      setPhase('boxes')
    } catch {
      setMessage(locale === 'zh' ? '操作失败，请重试' : 'Operation failed, please try again.')
    }
  }

  const handleOpen = async (index: number) => {
    if (selectedIndex !== null) return
    setSelectedIndex(index)

    const prize = boxes[index].prize

    if (prize.type === 'junk') {
      setMessage(locale === 'zh' ? '啥也没有... 再试一次？' : 'Nothing... Try again?')
      return
    }

    // Coin prizes → API first, then sync localStorage
    if (prize.type === 'coins' && prize.coinAmount) {
      await addCoinsApi(prize.coinAmount)
      // Also update localStorage for consistency
      const { addCoins } = await import('@/lib/pet')
      addCoins(prize.coinAmount)
      setMessage(locale === 'zh' ? `获得 ${prize.coinAmount} 金币！` : `Got ${prize.coinAmount} coins!`)
      return
    }

    // Food / accessory / bundle → localStorage first (processPrize), then sync to API
    processPrize(prize)

    if (prize.type === 'bundle' && prize.bundleItems) {
      const coinItems = prize.bundleItems.filter((i) => i.type === 'coins')
      for (const ci of coinItems) {
        await addCoinsApi(ci.amount)
      }
    }

    await syncInventoryToApi()
    await syncPetToApi()
    setMessage(locale === 'zh' ? `恭喜获得 ${prize.emoji} ${prize.nameZh}！` : `You got ${prize.emoji} ${prize.nameEn}!`)
  }

  const handleTryAgain = () => {
    setPhase('idle')
    setSelectedIndex(null)
    setBoxes([])
    setMessage('')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-5xl mb-3">🎁</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          {locale === 'zh' ? '神秘盲盒' : 'Mystery Blind Box'}
        </h1>
        <p className="text-sm text-gray-400">
          {locale === 'zh' ? '每次 100 金币，试试手气！' : '100 coins per pull. Try your luck!'}
        </p>
        <p className="text-sm text-yellow-600 font-semibold mt-2">
          🪙 {coins} {locale === 'zh' ? '金币' : 'coins'}
        </p>
      </div>

      {/* Idle state — buy boxes */}
      {phase === 'idle' && (
        <div className="text-center">
          <div className="flex justify-center gap-3 mb-8">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-16 h-20 sm:w-20 sm:h-24 rounded-2xl bg-gradient-to-b from-purple-400 to-purple-600 shadow-lg flex items-center justify-center animate-bounce"
                style={{ animationDelay: `${i * 0.1}s`, animationDuration: '1.5s' }}
              >
                <span className="text-2xl sm:text-3xl font-bold text-white">?</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleBuyBoxes}
            className="px-8 py-3 rounded-xl text-base font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-sm hover:shadow-md transition-all"
          >
            🎁 {locale === 'zh' ? `花费 100 金币抽盲盒` : `Open for 100 Coins`}
          </button>

          {message && (
            <p className="mt-4 text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{message}</p>
          )}

          {/* Prize pool preview */}
          <details className="mt-8 text-left">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
              {locale === 'zh' ? '📋 查看奖池概率' : '📋 Prize pool odds'}
            </summary>
            <div className="mt-3 bg-white rounded-xl border border-gray-100 p-4 text-xs text-gray-500 space-y-1">
              <p>🎋🥟🍙🧋 {locale === 'zh' ? '宠物食物' : 'Pet Food'} — ~37%</p>
              <p>🧣🎩🎀👓📿👑 {locale === 'zh' ? '宠物饰品' : 'Pet Accessories'} — ~22%</p>
              <p>🪙 {locale === 'zh' ? '金币返还' : 'Coin Rewards'} — ~13%</p>
              <p>🎉🎉👑 {locale === 'zh' ? '大礼包' : 'Grand Prize'} — ~4%</p>
              <p>🍂💇🗑️🧃🧦🪨 {locale === 'zh' ? '小垃圾' : 'Junk'} — ~24%</p>
            </div>
          </details>
        </div>
      )}

      {/* Boxes display */}
      {phase === 'boxes' && (
        <div>
          <p className="text-sm text-gray-500 text-center mb-6">
            {locale === 'zh' ? '选择一个盲盒打开...' : 'Pick a box to open...'}
          </p>
          <div className="flex justify-center gap-3 mb-8">
            {boxes.map((box, i) => {
              const isRevealed = selectedIndex !== null
              const isSelected = selectedIndex === i
              const prize = box.prize

              let boxStyle = 'from-purple-400 to-purple-600'
              if (isRevealed && isSelected) {
                boxStyle = 'from-yellow-400 to-orange-500'
              } else if (isRevealed && !isSelected) {
                boxStyle = 'from-gray-300 to-gray-400'
              }

              return (
                <button
                  key={i}
                  onClick={() => handleOpen(i)}
                  disabled={selectedIndex !== null}
                  className={`w-16 h-20 sm:w-20 sm:h-24 rounded-2xl bg-gradient-to-b ${boxStyle} shadow-lg flex items-center justify-center transition-all duration-500 ${
                    !isRevealed ? 'hover:scale-110 hover:shadow-xl cursor-pointer' : ''
                  } ${isRevealed && isSelected ? 'scale-110 ring-4 ring-yellow-300' : ''}`}
                >
                  {isRevealed && isSelected ? (
                    <span className="text-2xl sm:text-3xl">{prize.emoji}</span>
                  ) : isRevealed ? (
                    <span className="text-lg sm:text-xl text-white/50">❌</span>
                  ) : (
                    <span className="text-2xl sm:text-3xl font-bold text-white">?</span>
                  )}
                </button>
              )
            })}
          </div>

          {selectedIndex !== null && (
            <div className="text-center">
              <div className={`rounded-2xl border-2 shadow-sm p-6 mb-6 ${
                boxes[selectedIndex].prize.type === 'bundle'
                  ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300'
                  : 'bg-white border-yellow-200'
              }`}>
                <p className={`${boxes[selectedIndex].prize.type === 'bundle' ? 'text-5xl' : 'text-4xl'} mb-3`}>
                  {boxes[selectedIndex].prize.emoji}
                </p>
                <p className="text-lg font-bold text-gray-800 mb-1">
                  {locale === 'zh' ? boxes[selectedIndex].prize.nameZh : boxes[selectedIndex].prize.nameEn}
                </p>

                {boxes[selectedIndex].prize.type === 'bundle' && boxes[selectedIndex].prize.bundleItems && (
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {boxes[selectedIndex].prize.bundleItems.map((item, bi) => {
                      let icon = '🪙'
                      if (item.type === 'food') {
                        const foodMap: Record<string, string> = { bamboo: '🎋', rice: '🍙', dumpling: '🥟', cake: '🍰', milk: '🧋' }
                        icon = foodMap[item.itemId || ''] || '🎋'
                      } else if (item.type === 'accessory') {
                        const accMap: Record<string, string> = { crown: '👑', red_scarf: '🧣', bamboo_hat: '🎩', glasses: '👓', bowtie: '🎀', necklace: '📿' }
                        icon = accMap[item.itemId || ''] || '🎁'
                      }
                      return (
                        <span key={bi} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-yellow-200 text-xs text-gray-700">
                          {icon} x{item.amount}
                        </span>
                      )
                    })}
                  </div>
                )}

                <p className={`text-sm mt-2 ${boxes[selectedIndex].prize.type === 'bundle' ? 'text-orange-600 font-semibold' : message.includes('coins') ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {message}
                </p>
              </div>

              <button
                onClick={handleTryAgain}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-sm transition-all"
              >
                🎁 {locale === 'zh' ? '再抽一次' : 'Try Again'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reveal phase — same as boxes but treated as boxes+selected */}
      {/* This is handled in the boxes phase above */}
    </div>
  )
}
