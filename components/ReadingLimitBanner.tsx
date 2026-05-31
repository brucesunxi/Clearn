'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { ReadingLimitStatus } from '@/lib/reading-limit'

interface ReadingLimitBannerProps {
  status: ReadingLimitStatus
}

export default function ReadingLimitBanner({ status }: ReadingLimitBannerProps) {
  const { locale } = useTranslation()
  const [showUpgrade, setShowUpgrade] = useState(false)

  const isLow = status.remaining <= 1 && status.remaining > 0
  const isOut = status.remaining === 0

  return (
    <>
      {/* Status Banner */}
      <div className={`rounded-xl px-4 py-3 mb-6 flex items-center justify-between ${
        isOut
          ? 'bg-red-50 border border-red-200'
          : isLow
            ? 'bg-amber-50 border border-amber-200'
            : 'bg-sky-50 border border-sky-200'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-xl">{isOut ? '⛔' : isLow ? '⚠️' : '📚'}</span>
          <div>
            <p className={`text-sm font-medium ${
              isOut ? 'text-red-700' : isLow ? 'text-amber-700' : 'text-sky-700'
            }`}>
              {locale === 'zh'
                ? `今日阅读：${status.used}/${status.limit} 篇`
                : `Daily reads: ${status.used}/${status.limit} articles`
              }
            </p>
            {!isOut && (
              <p className="text-xs text-gray-500">
                {locale === 'zh'
                  ? `还可阅读 ${status.remaining} 篇，升级会员解锁无限阅读`
                  : `${status.remaining} remaining. Upgrade for unlimited access`
                }
              </p>
            )}
          </div>
        </div>

        {!isOut && (
          <button
            onClick={() => setShowUpgrade(true)}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium hover:from-amber-600 hover:to-orange-600 transition-colors"
          >
            {locale === 'zh' ? '升级' : 'Upgrade'}
          </button>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-6">
              <span className="text-4xl mb-2">👑</span>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {locale === 'zh' ? '升级会员' : 'Upgrade to Premium'}
              </h2>
              <p className="text-sm text-gray-500">
                {locale === 'zh'
                  ? '解锁无限阅读、去除广告、完整学习内容'
                  : 'Unlimited reading, ad-free, full content access'
                }
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <span className="text-xl">📖</span>
                <span className="text-sm text-gray-700">
                  {locale === 'zh' ? '无限阅读所有文章' : 'Unlimited article access'}
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <span className="text-xl">🚫</span>
                <span className="text-sm text-gray-700">
                  {locale === 'zh' ? '去除所有广告' : 'Ad-free experience'}
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <span className="text-xl">📝</span>
                <span className="text-sm text-gray-700">
                  {locale === 'zh' ? '完整学习报告' : 'Full learning reports'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  // TODO: Navigate to payment when available
                  alert(locale === 'zh'
                    ? '会员功能即将上线，敬请期待！'
                    : 'Premium coming soon!'
                  )
                  setShowUpgrade(false)
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-amber-600 hover:to-orange-600 transition-colors"
              >
                {locale === 'zh' ? '立即升级 - 即将上线' : 'Upgrade Now - Coming Soon'}
              </button>
              <button
                onClick={() => setShowUpgrade(false)}
                className="w-full py-3 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors text-sm"
              >
                {locale === 'zh' ? '稍后再说' : 'Maybe later'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Modal - when limit reached */}
      {isOut && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-6">
              <span className="text-4xl mb-2">⏰</span>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {locale === 'zh' ? '今日阅读额度已用完' : 'Daily limit reached'}
              </h2>
              <p className="text-sm text-gray-500">
                {locale === 'zh'
                  ? '您今天已阅读 3 篇文章，明天再来继续学习吧！或升级会员解锁无限阅读。'
                  : 'You\'ve read 3 articles today. Come back tomorrow or upgrade!'
                }
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.location.href = '/reading'}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm"
              >
                {locale === 'zh' ? '返回阅读列表' : 'Back to reading'}
              </button>
              <button
                onClick={() => {
                  alert(locale === 'zh'
                    ? '会员功能即将上线，敬请期待！'
                    : 'Premium coming soon!'
                  )
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-amber-600 hover:to-orange-600 transition-colors text-sm"
              >
                {locale === 'zh' ? '升级会员' : 'Upgrade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
