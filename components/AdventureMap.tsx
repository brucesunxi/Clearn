'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { AdventureLevel, LevelMilestone } from '@/lib/adventure'
import { getNextMilestones } from '@/lib/adventure'
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
  const [petExp, setPetExp] = useState(0)
  const [petExpToNext, setPetExpToNext] = useState(100)
  const [completedLevels, setCompletedLevels] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/adventure/energy').then(r => r.json()),
      fetch('/api/adventure/equipment').then(r => r.json()),
      fetch('/api/adventure/pet').then(r => r.json()),
      fetch('/api/adventure/levels').then(r => r.json()),
    ])
      .then(([energyData, equipData, petData, levelData]) => {
        if (energyData.energy) setEnergy(energyData.energy)
        if (equipData.stats) setStats(equipData.stats)
        if (petData.petLevel) {
          setPetLevel(petData.petLevel.level)
          setPetExp(petData.petLevel.exp)
          setPetExpToNext(petData.petLevel.expToNext)
        }
        if (levelData.completed) setCompletedLevels(levelData.completed)
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
          <div>
            <EnergyBar energy={energy} />
            <button
              onClick={async () => {
                const res = await fetch('/api/adventure/energy', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'recharge' })
                })
                const data = await res.json()
                if (data.success) {
                  setEnergy(data.energy)
                }
              }}
              className="mt-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              ⚡ Buy +30 energy (30 coins)
            </button>
          </div>

          {/* Stats */}
          <EquipmentPanel stats={stats} compact />

          {/* Pet Level & Shop */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐼</span>
                <span className="font-medium text-gray-700">Pet Level</span>
              </div>
              <span className="text-lg font-bold text-purple-600">Lv.{petLevel}</span>
            </div>
            {/* XP Progress */}
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-300"
                style={{ width: `${Math.round((petExp / Math.max(1, petExpToNext)) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500">{petExp}/{petExpToNext} XP</span>
              <Link
                href="/adventure/shop"
                className="px-4 py-1.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium text-sm"
              >
                🛍️ Shop
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Energy Recovery Hint */}
      {energy.current < 20 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-amber-700 font-medium mb-2">⚡ Low energy! Complete learning activities to recharge:</p>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <Link href="/reading" className="px-3 py-1 bg-white rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50">📖 Read</Link>
            <Link href="/learn" className="px-3 py-1 bg-white rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50">📝 Quiz</Link>
            <Link href="/listen" className="px-3 py-1 bg-white rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50">🎧 Listen</Link>
            <Link href="/speak" className="px-3 py-1 bg-white rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50">🗣️ Speak</Link>
          </div>
        </div>
      )}

      {/* Level Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {levels.map((level) => {
          const isCompleted = completedLevels.includes(level.id)
          const isLocked = level.requirements.minLevel && petLevel < level.requirements.minLevel
          const hasEnergy = energy.current >= level.requiredEnergy

          return (
            <div
              key={level.id}
              className={`relative rounded-2xl p-6 transition-all ${
                isCompleted
                  ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-300'
                  : isLocked
                  ? 'bg-gray-100 opacity-60'
                  : 'bg-gradient-to-br ' + getThemeGradient(level.theme) + ' hover:shadow-lg cursor-pointer'
              }`}
              onClick={() => {
                if (!isLocked && hasEnergy && !isCompleted) {
                  router.push(`/adventure/play/${level.id}`)
                }
              }}
            >
              {/* Completion Badge */}
              {isCompleted && (
                <div className="absolute top-4 left-4">
                  <span className="text-2xl">✅</span>
                </div>
              )}

              {/* Difficulty Badge */}
              <div className={`absolute top-4 ${isCompleted ? 'right-4' : 'right-4'}`}>
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

              {/* Completed Replay Button */}
              {isCompleted && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (hasEnergy) router.push(`/adventure/play/${level.id}`)
                  }}
                  className={`mt-3 w-full py-2 rounded-lg font-medium text-sm transition-colors ${
                    hasEnergy
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {hasEnergy ? '🔄 Replay' : '😴 No Energy'}
                </button>
              )}

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
              {!isLocked && !isCompleted && !hasEnergy && (
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

      {/* Adventure Stats */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2 text-sm">
          <span>📊</span> Adventure Stats
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div className="text-xl font-bold text-green-600">{completedLevels.length}/{levels.length}</div>
            <div className="text-gray-500 text-xs">Levels Cleared</div>
          </div>
          <div>
            <div className="text-xl font-bold text-purple-600">Lv.{petLevel}</div>
            <div className="text-gray-500 text-xs">Pet Level</div>
          </div>
          <div>
            <div className="text-xl font-bold text-amber-600">⚔️ {stats.power}</div>
            <div className="text-gray-500 text-xs">Total Power</div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-600">🛡️ {stats.defense}</div>
            <div className="text-gray-500 text-xs">Total Defense</div>
          </div>
        </div>
      </div>

      {/* Next Milestones */}
      {petLevel < 50 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2 text-sm">
            <span>🏆</span> Next Milestones
          </h3>
          <div className="flex flex-wrap gap-3">
            {getNextMilestones(petLevel).map((m: LevelMilestone, i: number) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl text-sm">
                <span>{m.icon}</span>
                <span className="text-gray-700">Lv.{m.level}</span>
                <span className="text-gray-500">- {m.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
