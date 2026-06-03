'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { AdventureLevel } from '@/lib/adventure'
import EnergyBar from './EnergyBar'
import EquipmentPanel from './EquipmentPanel'

interface AdventureMapProps {
  levels: AdventureLevel[]
}

export default function AdventureMap({ levels }: AdventureMapProps) {
  const router = useRouter()
  const [energy, setEnergy] = useState({ current: 100, max: 100 })
  const [stats, setStats] = useState({ power: 0, defense: 0, luck: 0 })
  const [petLevel, setPetLevel] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch energy and stats
    fetch('/api/adventure/energy')
      .then(res => res.json())
      .then(data => {
        if (data.energy) setEnergy(data.energy)
      })
      .catch(console.error)

    fetch('/api/adventure/equipment')
      .then(res => res.json())
      .then(data => {
        if (data.stats) setStats(data.stats)
      })
      .catch(console.error)

    fetch('/api/adventure/pet')
      .then(res => res.json())
      .then(data => {
        if (data.petLevel) setPetLevel(data.petLevel.level)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const getDifficultyColor = (difficulty: number) => {
    const colors = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500', 'bg-purple-500']
    return colors[difficulty - 1] || 'bg-gray-500'
  }

  const getGameTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      'battle': '⚔️',
      'puzzle': '🧩',
      'quiz': '❓',
      'maze': '🌀'
    }
    return icons[type] || '🎮'
  }

  const getThemeGradient = (theme: string) => {
    const gradients: Record<string, string> = {
      'bamboo-forest': 'from-green-100 to-emerald-200',
      'mountain': 'from-stone-100 to-stone-200',
      'river': 'from-blue-100 to-cyan-200',
      'cloud-temple': 'from-violet-100 to-purple-200'
    }
    return gradients[theme] || 'from-gray-100 to-gray-200'
  }

  if (loading) {
    return <div className="text-center py-12">Loading adventure map...</div>
  }

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Energy */}
          <EnergyBar energy={energy} />

          {/* Stats */}
          <EquipmentPanel stats={stats} compact />

          {/* Level & Shop Link */}
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Pet Level</div>
              <div className="text-2xl font-bold text-purple-600">Lv.{petLevel}</div>
            </div>
            <Link
              href="/adventure/shop"
              className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium"
            >
              🛍️ Shop
            </Link>
          </div>
        </div>
      </div>

      {/* Level Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {levels.map((level) => {
          const isLocked = level.requirements.minLevel && petLevel < level.requirements.minLevel
          const hasEnergy = energy.current >= level.requiredEnergy

          return (
            <div
              key={level.id}
              className={`relative rounded-2xl p-6 transition-all ${
                isLocked
                  ? 'bg-gray-100 opacity-60'
                  : 'bg-gradient-to-br ' + getThemeGradient(level.theme) + ' hover:shadow-lg cursor-pointer'
              }`}
              onClick={() => {
                if (!isLocked && hasEnergy) {
                  router.push(`/adventure/play/${level.id}`)
                }
              }}
            >
              {/* Difficulty Badge */}
              <div className="absolute top-4 right-4">
                <div className={`w-8 h-8 rounded-full ${getDifficultyColor(level.difficulty)} flex items-center justify-center text-white font-bold text-sm`}>
                  {level.difficulty}
                </div>
              </div>

              {/* Level Info */}
              <div className="mb-4">
                <div className="text-3xl mb-2">{level.emoji}</div>
                <h3 className="font-bold text-gray-800 mb-1">{level.name}</h3>
                <p className="text-xs text-gray-600">{level.nameEn}</p>
              </div>

              {/* Game Type */}
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-700">
                <span>{getGameTypeIcon(level.gameType)}</span>
                <span className="capitalize">{level.gameType}</span>
              </div>

              {/* Energy Cost */}
              <div className="flex items-center gap-2 text-sm mb-3">
                <span className="text-amber-500">⚡</span>
                <span className={hasEnergy ? 'text-gray-700' : 'text-red-500'}>
                  {level.requiredEnergy} Energy
                </span>
              </div>

              {/* Rewards Preview */}
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>💰 {level.rewards.coins.min}-{level.rewards.coins.max}</span>
                <span>✨ +{level.rewards.exp} XP</span>
              </div>

              {/* Locked Overlay */}
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200/80 rounded-2xl">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🔒</div>
                    <p className="text-sm text-gray-600">Level {level.requirements.minLevel} required</p>
                  </div>
                </div>
              )}

              {/* Low Energy Warning */}
              {!isLocked && !hasEnergy && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-100/80 rounded-2xl">
                  <div className="text-center">
                    <div className="text-2xl mb-2">😴</div>
                    <p className="text-sm text-red-600">Not enough energy</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
