'use client'

import Link from 'next/link'
import type { Level } from '@/lib/content'

interface LevelCardProps {
  level: Level
}

export default function LevelCard({ level }: LevelCardProps) {
  return (
    <Link
      href={`/reading?level=${level.id}`}
      className="block rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      style={{ backgroundColor: level.color + '18' }}
    >
      <div className="text-4xl mb-3">{level.emoji}</div>
      <h3 className="text-xl font-bold text-gray-800 mb-1">
        {level.name}
      </h3>
      <p className="text-sm text-gray-500 mb-2">{level.ageRange}</p>
      <p className="text-sm text-gray-600 leading-relaxed">
        {level.description}
      </p>
      <div
        className="mt-3 inline-block text-xs font-medium px-3 py-1 rounded-full text-white"
        style={{ backgroundColor: level.color }}
      >
        {level.charCount}
      </div>
    </Link>
  )
}
