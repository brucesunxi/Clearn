'use client'

import { ADVENTURE_CONFIG } from '@/lib/adventure'

interface EnergyBarProps {
  energy: { current: number; max: number }
  showRegen?: boolean
}

export default function EnergyBar({ energy, showRegen = true }: EnergyBarProps) {
  const percentage = Math.round((energy.current / energy.max) * 100)
  const nextRegen = new Date()
  nextRegen.setMinutes(nextRegen.getMinutes() + (60 - nextRegen.getMinutes() % 60))

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="font-medium text-gray-700">Energy</span>
        </div>
        <span className="text-sm font-bold text-amber-600">
          {energy.current}/{energy.max}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Regen Info */}
      {showRegen && (
        <p className="text-xs text-gray-500 mt-1">
          +{ADVENTURE_CONFIG.energy.regenPerHour}/hour • Full at {nextRegen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  )
}
