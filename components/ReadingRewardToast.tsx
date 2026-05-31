'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { useCoins } from '@/lib/use-coins'
import { ReadingRewardStatus, READING_REWARD_COINS } from '@/lib/reading-reward'

interface ReadingRewardToastProps {
  status: ReadingRewardStatus
  articleId?: string
}

export default function ReadingRewardToast({ status, articleId }: ReadingRewardToastProps) {
  const { locale } = useTranslation()
  const { add } = useCoins()
  const [showReward, setShowReward] = useState(false)
  const [rewardClaimed, setRewardClaimed] = useState(false)

  useEffect(() => {
    // 首次加载时检查是否已领取奖励
    if (articleId) {
      const { isArticleRewardClaimed } = require('@/lib/reading-reward')
      if (!isArticleRewardClaimed(articleId)) {
        // 自动领取阅读奖励
        handleClaimReward()
      } else {
        setRewardClaimed(true)
      }
    }
  }, [articleId])

  const handleClaimReward = async () => {
    if (!articleId || rewardClaimed) return

    try {
      // 发放金币奖励
      await add(READING_REWARD_COINS)

      // 标记已领取
      const { markArticleRewardClaimed } = require('@/lib/reading-reward')
      markArticleRewardClaimed(articleId)

      // 显示奖励动画
      setShowReward(true)
      setRewardClaimed(true)

      // 3秒后隐藏
      setTimeout(() => setShowReward(false), 3000)
    } catch (error) {
      console.error('Failed to claim reading reward:', error)
    }
  }

  return (
    <>
      {/* 阅读进度提示 */}
      <div className="rounded-xl px-4 py-3 mb-6 flex items-center justify-between bg-emerald-50 border border-emerald-200">
        <div className="flex items-center gap-3">
          <span className="text-xl">📚</span>
          <div>
            <p className="text-sm font-medium text-emerald-700">
              {locale === 'zh'
                ? `今日已读 ${status.used} 篇文章`
                : `You've read ${status.used} articles today`
              }
            </p>
            <p className="text-xs text-gray-500">
              {locale === 'zh'
                ? `每篇文章 +${READING_REWARD_COINS} 金币，继续学习赚取更多！`
                : `+${READING_REWARD_COINS} coins per article. Keep learning!`
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-amber-500 text-lg">🪙</span>
          <span className="text-sm font-bold text-amber-600">+{READING_REWARD_COINS}</span>
        </div>
      </div>

      {/* 金币奖励动画 */}
      {showReward && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl px-8 py-4 shadow-2xl animate-bounce">
            <div className="text-center">
              <span className="text-4xl mb-2 block">🪙</span>
              <p className="text-white font-bold text-lg">
                +{READING_REWARD_COINS}
              </p>
              <p className="text-white/80 text-sm">
                {locale === 'zh' ? '阅读奖励！' : 'Reading Reward!'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
