import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth'
import { getCoinHistory, getCheckin, getPet } from '@/lib/redis'
import { getAdventureStats, getPetLevel } from '@/lib/adventure'
import { getWordsProgress } from '@/lib/redis'

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [history, checkin, pet, petLevel, adventure, wordsProgress] = await Promise.all([
      getCoinHistory(userId, 200),
      getCheckin(userId).catch(() => null),
      getPet(userId).catch(() => null),
      getPetLevel(userId).catch(() => ({ level: 1, exp: 0, expToNext: 100 })),
      getAdventureStats(userId).catch(() => null),
      getWordsProgress(userId).catch(() => null),
    ])

    // 从金币历史统计各类型活动次数
    const activityCounts: Record<string, number> = {}
    let totalCoinsEarned = 0
    let totalCoinsSpent = 0

    for (const entry of history || []) {
      const reason = entry.reason || 'other'
      activityCounts[reason] = (activityCounts[reason] || 0) + 1
      if (entry.amount > 0) totalCoinsEarned += entry.amount
      else totalCoinsSpent += Math.abs(entry.amount)
    }

    // 统计学习类活动
    const studyTypes = ['study_complete', 'quiz_complete', 'battle_complete', 'listen_complete', 'speak_complete', 'checkin', 'box_open', 'box_prize']
    const totalStudyActivities = studyTypes.reduce((sum, type) => sum + (activityCounts[type] || 0), 0)

    // 词汇进度
    const wordCount = wordsProgress ? Object.keys(wordsProgress).length : 0

    return NextResponse.json({
      stats: {
        coins: {
          earned: totalCoinsEarned,
          spent: totalCoinsSpent,
          totalTransactions: history?.length || 0,
        },
        activities: {
          total: totalStudyActivities,
          breakdown: activityCounts,
        },
        words: {
          total: wordCount,
        },
        streak: checkin ? {
          current: checkin.currentStreak || 0,
          longest: checkin.longestStreak || 0,
        } : null,
        pet: petLevel ? {
          level: petLevel.level || 1,
          exp: petLevel.exp || 0,
          expToNext: petLevel.expToNext || 100,
          happiness: pet?.happiness ?? 100,
          fullness: pet ? 100 - pet.hunger : 100,
        } : null,
        adventure: adventure ? {
          levelsPlayed: adventure.totalLevelsPlayed,
          levelsCompleted: adventure.totalLevelsCompleted,
          coinsEarned: adventure.totalCoinsEarned,
          expEarned: adventure.totalExpEarned,
        } : null,
      },
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
