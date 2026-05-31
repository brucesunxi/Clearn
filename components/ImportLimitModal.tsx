'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { IMPORT_CONFIG, ImportLimitStatus } from '@/lib/import-limit'
import { useCoins } from '@/lib/use-coins'

interface ImportLimitModalProps {
  isOpen: boolean
  status: ImportLimitStatus
  onConfirm: () => void
  onCancel: () => void
  onEarnCoins: () => void
}

export default function ImportLimitModal({
  isOpen,
  status,
  onConfirm,
  onCancel,
  onEarnCoins
}: ImportLimitModalProps) {
  const { locale } = useTranslation()
  const { balance } = useCoins()
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const hasEnoughCoins = balance >= status.needCoins

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-4xl mb-2 block">📥</span>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {locale === 'zh' ? '导入文章' : 'Import Article'}
          </h2>
          <p className="text-sm text-gray-500">
            {locale === 'zh'
              ? `今日已导入 ${status.used} 篇文章`
              : `You've imported ${status.used} articles today`
            }
          </p>
        </div>

        {/* Status display */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-600">
              {locale === 'zh' ? '免费额度' : 'Free quota'}
            </span>
            <span className="text-sm font-medium text-gray-800">
              {status.used}/{IMPORT_CONFIG.FREE_LIMIT}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                status.isOverLimit ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min((status.used / IMPORT_CONFIG.FREE_LIMIT) * 100, 100)}%` }}
            />
          </div>

          {/* Cost info */}
          {status.isOverLimit && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {locale === 'zh' ? '本次导入费用' : 'Import cost'}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-amber-500">🪙</span>
                  <span className="font-bold text-amber-600">{IMPORT_CONFIG.EXTRA_COST}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-600">
                  {locale === 'zh' ? '当前余额' : 'Your balance'}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-amber-500">🪙</span>
                  <span className={`font-bold ${hasEnoughCoins ? 'text-emerald-600' : 'text-red-600'}`}>
                    {balance}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message */}
        {status.isOverLimit ? (
          <div className={`rounded-xl p-3 mb-6 ${hasEnoughCoins ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            <p className="text-sm text-center">
              {hasEnoughCoins
                ? (locale === 'zh'
                    ? `本次导入将消耗 ${IMPORT_CONFIG.EXTRA_COST} 金币`
                    : `This import will cost ${IMPORT_CONFIG.EXTRA_COST} coins`)
                : (locale === 'zh'
                    ? `金币不足，还差 ${IMPORT_CONFIG.EXTRA_COST - balance} 金币`
                    : `Not enough coins. Need ${IMPORT_CONFIG.EXTRA_COST - balance} more`)
              }
            </p>
          </div>
        ) : (
          <div className="bg-emerald-50 rounded-xl p-3 mb-6 text-emerald-700">
            <p className="text-sm text-center">
              {locale === 'zh'
                ? `本次导入免费（${status.used + 1}/${IMPORT_CONFIG.FREE_LIMIT}）`
                : `Free import (${status.used + 1}/${IMPORT_CONFIG.FREE_LIMIT})`
              }
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          {status.isOverLimit && !hasEnoughCoins ? (
            <button
              onClick={onEarnCoins}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:from-emerald-600 hover:to-teal-600 transition-colors"
            >
              {locale === 'zh' ? '去赚金币' : 'Earn Coins'}
            </button>
          ) : (
            <button
              onClick={() => {
                setLoading(true)
                onConfirm()
              }}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium hover:from-blue-600 hover:to-indigo-600 transition-colors disabled:opacity-50"
            >
              {loading
                ? (locale === 'zh' ? '处理中...' : 'Processing...')
                : status.isOverLimit
                  ? (locale === 'zh' ? `确认导入（消耗 ${IMPORT_CONFIG.EXTRA_COST} 金币）` : `Confirm Import (-${IMPORT_CONFIG.EXTRA_COST} coins)`)
                  : (locale === 'zh' ? '免费导入' : 'Free Import')
              }
            </button>
          )}
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors text-sm"
          >
            {locale === 'zh' ? '取消' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}
