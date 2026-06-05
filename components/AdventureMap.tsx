'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import type { AdventureLevel, LevelMilestone } from '@/lib/adventure'
import { getNextMilestones } from '@/lib/adventure'
import EnergyBar from './EnergyBar'
import EquipmentPanel from './EquipmentPanel'

const GAME_TYPES = [
  {
    type: 'quiz',
    icon: '❓',
    iconBig: '🎯',
    color: 'from-blue-500 to-blue-600',
    bgLight: 'bg-blue-50',
    titleZh: '知识问答',
    titleEn: 'Quiz Challenge',
    descZh: '回答中文知识问题攻击Boss，答对越多伤害越高！每道题都是一次学习机会。',
    descEn: 'Attack bosses by answering Chinese questions! The more you get right, the higher your damage.',
    benefitZh: '巩固词汇与语法理解',
    benefitEn: 'Reinforce vocabulary and grammar',
  },
  {
    type: 'puzzle',
    icon: '🧩',
    iconBig: '🔍',
    color: 'from-emerald-500 to-emerald-600',
    bgLight: 'bg-emerald-50',
    titleZh: '汉字谜题',
    titleEn: 'Word Puzzle',
    descZh: '在汉字矩阵中快速找出目标词语，限时挑战你的眼力和词汇敏感度！',
    descEn: 'Find target words in a character grid against the clock. Train your character recognition!',
    benefitZh: '提升汉字识别与反应速度',
    benefitEn: 'Improve character recognition speed',
  },
  {
    type: 'maze',
    icon: '🌀',
    iconBig: '🗺️',
    color: 'from-violet-500 to-violet-600',
    bgLight: 'bg-violet-50',
    titleZh: '迷宫探险',
    titleEn: 'Maze Explorer',
    descZh: '穿越迷宫收集汉字，避开陷阱。每一条路都是新词汇的发现之旅！',
    descEn: 'Navigate mazes collecting Chinese characters, avoid traps, and discover new words!',
    benefitZh: '在探索中学习新词汇',
    benefitEn: 'Learn new words through exploration',
  },
  {
    type: 'battle',
    icon: '⚔️',
    iconBig: '⚡',
    color: 'from-rose-500 to-rose-600',
    bgLight: 'bg-rose-50',
    titleZh: '熊猫对战',
    titleEn: 'Panda Battle',
    descZh: '用中文知识武装你的熊猫，与Boss进行回合制对战！装备越强，战力越高。',
    descEn: 'Arm your panda with Chinese knowledge in turn-based boss battles! The better your gear, the stronger you fight.',
    benefitZh: '综合运用所学，实战演练',
    benefitEn: 'Apply what you learned in real combat',
  },
]

interface AdventureMapProps {
  levels: AdventureLevel[]
}

export default function AdventureMap({ levels }: AdventureMapProps) {
  const { locale, t } = useTranslation()
  const router = useRouter()
  const [energy, setEnergy] = useState({ current: 100, max: 100 })
  const [stats, setStats] = useState({ power: 0, defense: 0, luck: 0 })
  const [petLevel, setPetLevel] = useState(1)
  const [petExp, setPetExp] = useState(0)
  const [petExpToNext, setPetExpToNext] = useState(100)
  const [completedLevels, setCompletedLevels] = useState<number[]>([])
  const [adventureStats, setAdventureStats] = useState<{ totalLevelsPlayed: number; totalLevelsCompleted: number; totalCoinsEarned: number; totalExpEarned: number; lastPlayDate: string } | null>(null)
  const [session, setSession] = useState<'loading' | 'anon' | 'authenticated'>('loading')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        const authed = !!data.user
        setSession(authed ? 'authenticated' : 'anon')
        if (!authed) {
          setLoading(false)
          return
        }
        return Promise.all([
          fetch('/api/adventure/energy').then(r => r.json()),
          fetch('/api/adventure/equipment').then(r => r.json()),
          fetch('/api/adventure/pet').then(r => r.json()),
          fetch('/api/adventure/levels').then(r => r.json()),
          fetch('/api/adventure/stats').then(r => r.json()),
        ]).then(([energyData, equipData, petData, levelData, statsData]) => {
          if (energyData.energy) setEnergy(energyData.energy)
          if (equipData.stats) setStats(equipData.stats)
          if (petData.petLevel) {
            setPetLevel(petData.petLevel.level)
            setPetExp(petData.petLevel.exp)
            setPetExpToNext(petData.petLevel.expToNext)
          }
          if (levelData.completed) setCompletedLevels(levelData.completed)
          if (statsData.stats) setAdventureStats(statsData.stats)
        })
      })
      .catch(() => { setSession('anon'); setLoading(false) })
      .finally(() => setLoading(false))
  }, [])

  const getDifficultyColor = (difficulty: number) => {
    const colors = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500', 'bg-purple-500']
    return colors[difficulty - 1] || 'bg-gray-500'
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

  const completedCount = completedLevels.length
  const totalLevels = levels.length
  const progressPct = totalLevels > 0 ? Math.round((completedCount / totalLevels) * 100) : 0

  if (loading) {
    return <div className="text-center py-12">Loading adventure map...</div>
  }

  if (session === 'anon') {
    return (
      <div className="px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-8xl mb-6">🗺️</div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4 leading-tight">
            {t('adventure.title')}<br />
            <span className="text-2xl text-gray-500">{t('adventure.subtitle')}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
            {t('adventure.description')}
          </p>

          {/* Game Type Previews */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {GAME_TYPES.map((game) => (
              <div key={game.type} className={`${game.bgLight} rounded-2xl p-4 text-left`}>
                <div className="text-2xl mb-2">{game.iconBig}</div>
                <h3 className="font-bold text-gray-800 text-sm mb-1">{locale === 'zh' ? game.titleZh : game.titleEn}</h3>
                <p className="text-xs text-gray-500">{locale === 'zh' ? game.descZh : game.descEn}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Link
              href="/register"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg"
            >
              🚀 {locale === 'zh' ? '立即开始 — 免费注册' : 'Get Started — Sign Up'}
            </Link>
            <Link
              href="/login"
              className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm"
            >
              {t('adventure.login')}
            </Link>
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← {t('adventure.backHome')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ===== HERO: 游戏合集介绍 ===== */}
      <div className="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="text-5xl md:text-6xl">🎮</div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {t('adventure.hero.title')}
            </h1>
            <p className="text-emerald-100 text-sm md:text-base leading-relaxed max-w-2xl">
              {t('adventure.hero.description')}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-1.5">
                <span>🎯</span>
                <span>{totalLevels} {t('adventure.levels')}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-1.5">
                <span>🐼</span>
                <span>{t('adventure.petLevel')}{petLevel}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-1.5">
                <span>🪙</span>
                <span>{adventureStats?.totalCoinsEarned || 0} {t('adventure.coins')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 游戏类型介绍方块 ===== */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
          <span>🎪</span>
          {locale === 'zh' ? `${t('adventure.minigames.title')} · ${t('adventure.minigames.subtitle')}` : 'Mini-Game Collection'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {GAME_TYPES.map((game) => (
            <div
              key={game.type}
              className={`${game.bgLight} dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-default`}
            >
              <div className="text-3xl mb-2">{game.iconBig}</div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-1">
                {locale === 'zh' ? game.titleZh : game.titleEn}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
                {locale === 'zh' ? game.descZh : game.descEn}
              </p>
              <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <span>💡</span>
                <span>{locale === 'zh' ? game.benefitZh : game.benefitEn}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

          {/* ===== Status Bar ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                if (data.success) setEnergy(data.energy)
              }}
              className="mt-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 font-medium"
            >
              ⚡ {t('adventure.buyEnergy')}
            </button>
          </div>

          {/* Equipment Stats */}
          <EquipmentPanel stats={stats} compact />

          {/* Pet Level */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐼</span>
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {t('adventure.petLevel').replace('Lv.', '')}
                </span>
              </div>
              <span className="text-lg font-bold text-purple-600">Lv.{petLevel}</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
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
                🛍️ {t('adventure.shop')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Progress Bar ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm flex items-center gap-2">
            <span>🗺️</span>
            {t('adventure.progress')}
          </h3>
          <span className="text-sm text-gray-500">{completedCount}/{totalLevels} ({progressPct}%)</span>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-500 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div className="text-xl font-bold text-green-600">{adventureStats?.totalLevelsCompleted || 0}</div>
            <div className="text-gray-500 text-xs">{t('adventure.clears')}</div>
          </div>
          <div>
            <div className="text-xl font-bold text-purple-600">Lv.{petLevel}</div>
            <div className="text-gray-500 text-xs">{t('adventure.petLevel').replace('Lv.', '')}</div>
          </div>
          <div>
            <div className="text-xl font-bold text-yellow-600">💰 {adventureStats?.totalCoinsEarned || 0}</div>
            <div className="text-gray-500 text-xs">{t('adventure.coinsEarned')}</div>
          </div>
          <div>
            <div className="text-xl font-bold text-amber-600">✨ {adventureStats?.totalExpEarned || 0}</div>
            <div className="text-gray-500 text-xs">{t('adventure.expEarned')}</div>
          </div>
        </div>
      </div>

      {/* ===== All Levels Complete Celebration ===== */}
      {completedCount >= totalLevels && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-2xl p-6 text-center">
          <div className="text-5xl mb-3">👑</div>
          <h2 className="text-2xl font-bold text-orange-700 dark:text-orange-400 mb-1">
            {t('adventure.allComplete')}
          </h2>
          <p className="text-orange-600 dark:text-orange-300 mb-3">
            {t('adventure.allCompleteDesc')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/adventure/shop" className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-medium text-sm">🛍️ {t('adventure.shop')}</Link>
            <Link href="/blindbox" className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 font-medium text-sm">🎁 {t('adventure.blindbox')}</Link>
          </div>
        </div>
      )}

      {/* ===== Low Energy Warning ===== */}
      {energy.current < 20 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 text-center">
          <p className="text-amber-700 dark:text-amber-400 font-medium mb-2">
            ⚡ {t('adventure.lowEnergy')}
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <Link href="/reading" className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700 text-amber-600 hover:bg-amber-50">📖 {t('adventure.read')}</Link>
            <Link href="/learn" className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700 text-amber-600 hover:bg-amber-50">📝 {t('adventure.quiz')}</Link>
            <Link href="/listen" className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700 text-amber-600 hover:bg-amber-50">🎧 {t('adventure.listen')}</Link>
            <Link href="/speak" className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700 text-amber-600 hover:bg-amber-50">🗣️ {t('adventure.speak')}</Link>
          </div>
        </div>
      )}

      {/* ===== Level Grid ===== */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
          <span>🏔️</span>
          {t('adventure.selectLevel')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {levels.map((level) => {
            const isCompleted = completedLevels.includes(level.id)
            const prevCompleted = level.id === 1 || completedLevels.includes(level.id - 1)
            const meetsLevelReq = !level.requirements.minLevel || petLevel >= level.requirements.minLevel
            const meetsPowerReq = !level.requirements.minPower || stats.power >= level.requirements.minPower
            const meetsDefenseReq = !level.requirements.minDefense || stats.defense >= level.requirements.minDefense
            const isLocked = !prevCompleted || !meetsLevelReq || !meetsPowerReq || !meetsDefenseReq
            const lockReason = !meetsLevelReq
              ? `${t('adventure.needPetLevel')} ${level.requirements.minLevel}`
              : !meetsPowerReq
              ? `⚔️ ${t('adventure.needPower')} ${level.requirements.minPower} ${t('adventure.power')} (${stats.power})`
              : !meetsDefenseReq
              ? `🛡️ ${t('adventure.needPower')} ${level.requirements.minDefense} ${t('adventure.defense')} (${stats.defense})`
              : !prevCompleted
              ? `${t('adventure.completePrevious')}`
              : ''
            const hasEnergy = energy.current >= level.requiredEnergy
            const isPlayable = !isLocked && hasEnergy

            const gameTypeInfo = GAME_TYPES.find(g => g.type === level.gameType)
            const gameTypeIcon = gameTypeInfo?.icon || '🎮'

            return (
              <div
                key={level.id}
                className={`relative rounded-2xl p-6 transition-all ${
                  isCompleted
                    ? 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-300 dark:border-green-600'
                    : isLocked
                    ? 'bg-gray-100 dark:bg-gray-800/50 opacity-60'
                    : 'bg-gradient-to-br ' + getThemeGradient(level.theme) + ' dark:from-gray-700 dark:to-gray-800 hover:shadow-lg cursor-pointer border border-gray-100 dark:border-gray-700'
                }`}
                onClick={() => {
                  if (isPlayable && !isCompleted) {
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
                <div className="absolute top-4 right-4">
                  <div className={`w-8 h-8 rounded-full ${getDifficultyColor(level.difficulty)} flex items-center justify-center text-white font-bold text-sm`}>
                    {level.difficulty}
                  </div>
                </div>

                {/* Level Info */}
                <div className="mb-3">
                  <div className="text-3xl mb-2">{level.emoji}</div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-0.5">{locale === 'zh' ? level.name : level.nameEn}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{locale === 'zh' ? level.nameEn : level.name}</p>
                </div>

                {/* Game Type */}
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-base">{gameTypeIcon}</span>
                  <span className="capitalize text-xs">{locale === 'zh'
                    ? ({ quiz: '问答', puzzle: '谜题', maze: '迷宫', battle: '对战' }[level.gameType] || level.gameType)
                    : level.gameType}</span>
                </div>

                {/* Energy Cost */}
                <div className="flex items-center gap-2 text-sm mb-3">
                  <span>⚡</span>
                  <span className={hasEnergy ? 'text-gray-700 dark:text-gray-300' : 'text-red-500 dark:text-red-400'}>
                    {level.requiredEnergy} {t('adventure.energy')}
                  </span>
                </div>

                {/* Rewards Preview */}
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span>💰 {level.rewards.coins.min}-{level.rewards.coins.max}</span>
                  <span>✨ +{level.rewards.exp} XP</span>
                </div>

                {/* Completed / Replay */}
                {isCompleted && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (hasEnergy) router.push(`/adventure/play/${level.id}`)
                    }}
                    className={`mt-3 w-full py-2 rounded-lg font-medium text-sm transition-colors ${
                      hasEnergy
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {hasEnergy
                      ? `🔄 ${t('adventure.replay')}`
                      : `😴 ${t('adventure.noEnergy')}`}
                  </button>
                )}

                {/* Locked Overlay */}
                {isLocked && !isCompleted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200/80 dark:bg-gray-900/80 rounded-2xl">
                    <div className="text-center px-4">
                      <div className="text-2xl mb-2">🔒</div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{lockReason}</p>
                    </div>
                  </div>
                )}

                {/* Low Energy Warning */}
                {!isLocked && !isCompleted && !hasEnergy && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-100/80 dark:bg-red-900/50 rounded-2xl">
                    <div className="text-center">
                      <div className="text-2xl mb-2">😴</div>
                      <p className="text-sm text-red-600 dark:text-red-300">
                        {t('adventure.noEnergy')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ===== Milestones ===== */}
      {petLevel < 50 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2 text-sm">
            <span>🏆</span>
            {t('adventure.nextMilestones')}
          </h3>
          <div className="flex flex-wrap gap-3">
            {getNextMilestones(petLevel).map((m: LevelMilestone, i: number) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm">
                <span>{m.icon}</span>
                <span className="text-gray-700 dark:text-gray-200 font-medium">Lv.{m.level}</span>
                <span className="text-gray-500 dark:text-gray-400">- {m.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
