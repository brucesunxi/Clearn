'use client'

interface EquipmentPanelProps {
  stats: { power: number; defense: number; luck: number; energy?: number }
  compact?: boolean
}

export default function EquipmentPanel({ stats, compact = false }: EquipmentPanelProps) {
  const statItems = [
    { key: 'power', label: 'Power', icon: '⚔️', color: 'text-red-500' },
    { key: 'defense', label: 'Defense', icon: '🛡️', color: 'text-blue-500' },
    { key: 'luck', label: 'Luck', icon: '🍀', color: 'text-green-500' },
  ]

  if (compact) {
    return (
      <div className="flex items-center justify-around">
        {statItems.map(({ key, label, icon, color }) => (
          <div key={key} className="text-center">
            <div className="text-lg mb-1">{icon}</div>
            <div className={`text-sm font-bold ${color}`}>{stats[key as keyof typeof stats] || 0}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
        <span>🎒</span> Equipment Stats
      </h3>
      <div className="space-y-2">
        {statItems.map(({ key, label, icon, color }) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{icon}</span>
              <span className="text-sm text-gray-600">{label}</span>
            </div>
            <span className={`font-bold ${color}`}>{stats[key as keyof typeof stats] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
