'use client'

import { useState, useEffect } from 'react'
import { useCoins } from '@/lib/use-coins'
import type { EquipmentItem } from '@/lib/adventure'
import EquipmentPanel from './EquipmentPanel'
import EnergyBar from './EnergyBar'

interface AdventureShopProps {
  shop: EquipmentItem[]
}

export default function AdventureShop({ shop }: AdventureShopProps) {
  const { balance, spend, refresh } = useCoins()
  const [equipped, setEquipped] = useState<string[]>([])
  const [inventory, setInventory] = useState<string[]>([])
  const [stats, setStats] = useState({ power: 0, defense: 0, luck: 0, energy: 100 })
  const [energy, setEnergy] = useState({ current: 100, max: 100 })
  const [loading, setLoading] = useState(true)
  const [purchaseStatus, setPurchaseStatus] = useState<{ message: string; error?: boolean } | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/adventure/equipment').then(r => r.json()),
      fetch('/api/adventure/energy').then(r => r.json()),
    ])
      .then(([equipData, energyData]) => {
        if (equipData.equipped) setEquipped(equipData.equipped)
        if (equipData.owned) setInventory(equipData.owned)
        if (equipData.stats) setStats(equipData.stats)
        if (energyData.energy) setEnergy(energyData.energy)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleBuy = async (item: EquipmentItem) => {
    if (balance < item.price) {
      setPurchaseStatus({ message: 'Not enough coins!', error: true })
      return
    }

    const res = await fetch('/api/adventure/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: item.id, action: 'buy' })
    })
    const data = await res.json()

    if (data.success) {
      setInventory(prev => [...prev, item.id])
      setPurchaseStatus({ message: `Purchased ${item.name}!` })
      refresh()
    } else {
      setPurchaseStatus({ message: data.error || 'Purchase failed', error: true })
    }
  }

  const handleEquip = async (itemId: string, isEquip: boolean) => {
    const res = await fetch('/api/adventure/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, action: isEquip ? 'equip' : 'unequip' })
    })

    const data = await res.json()
    if (data.success) {
      setEquipped(data.equipped)
      setStats(data.stats)
    }
  }

  const getSlotIcon = (slot: string) => {
    const icons: Record<string, string> = {
      'head': '👒',
      'body': '👕',
      'weapon': '🗡️',
      'shield': '🛡️',
      'accessory': '💍',
      'foot': '👟'
    }
    return icons[slot] || '📦'
  }

  const getStatDisplay = (stats: EquipmentItem['stats']) => {
    const parts = []
    if (stats.power) parts.push(`+${stats.power} ⚔️`)
    if (stats.defense) parts.push(`+${stats.defense} 🛡️`)
    if (stats.luck) parts.push(`+${stats.luck} 🍀`)
    if (stats.energy) parts.push(`+${stats.energy} ⚡`)
    return parts.join(' ')
  }

  if (loading) {
    return <div className="text-center py-12">Loading shop...</div>
  }

  // Group by slot
  const bySlot = shop.reduce((acc, item) => {
    if (!acc[item.slot]) acc[item.slot] = []
    acc[item.slot].push(item)
    return acc
  }, {} as Record<string, EquipmentItem[]>)

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-500 mb-1">Coins</div>
            <div className="text-2xl font-bold text-amber-600">💰 {balance}</div>
          </div>
          <EnergyBar energy={energy} />
          <EquipmentPanel stats={stats} compact />
        </div>
      </div>

      {/* Purchase Status */}
      {purchaseStatus && (
        <div
          className={`px-4 py-2 rounded-lg text-center ${
            purchaseStatus.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}
        >
          {purchaseStatus.message}
        </div>
      )}

      {/* Shop Items */}
      <div className="space-y-6">
        {Object.entries(bySlot).map(([slot, items]) => (
          <div key={slot} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">{getSlotIcon(slot)}</span>
              <span className="capitalize">{slot} Slot</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(item => {
                const isOwned = inventory.includes(item.id)
                const isEquipped = equipped.includes(item.id)

                return (
                  <div
                    key={item.id}
                    className={`border-2 rounded-xl p-4 transition-all ${
                      isEquipped
                        ? 'border-green-400 bg-green-50'
                        : isOwned
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-3xl">{item.emoji}</span>
                      <span className="text-sm font-bold text-amber-600">💰 {item.price}</span>
                    </div>

                    <h4 className="font-bold text-gray-800">{item.name}</h4>
                    <p className="text-xs text-gray-500 mb-2">{item.nameEn}</p>

                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>

                    <div className="text-xs text-purple-600 font-medium mb-3">
                      {getStatDisplay(item.stats)}
                    </div>

                    {!isOwned ? (
                      <button
                        onClick={() => handleBuy(item)}
                        disabled={balance < item.price}
                        className="w-full py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {balance >= item.price ? 'Buy' : 'Not enough'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEquip(item.id, !isEquipped)}
                        className={`w-full py-2 rounded-lg font-medium transition-colors ${
                          isEquipped
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {isEquipped ? 'Equipped ✓' : 'Equip'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
