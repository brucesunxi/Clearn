'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'

interface TrialBannerProps {
  type: 'register' | 'verify'
  onClose?: () => void
}

const DISMISS_KEY = 'trial_banner_dismissed'

export default function TrialBanner({ type, onClose }: TrialBannerProps) {
  const { locale } = useTranslation()
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  if (dismissed) return null

  const handleClose = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {}
    onClose?.()
  }

  if (type === 'register') {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 my-4 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">🔐</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {locale === 'zh' ? '免费注册，解锁全部功能' : 'Create a free account to unlock all features'}
            </p>
            <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
              {locale === 'zh'
                ? '注册后获得 500 金币，学习赚金币，领熊猫、抽盲盒！'
                : 'Get 500 coins on signup, earn more by learning, get your panda and open blind boxes!'}
            </p>
            <div className="flex gap-2 mt-3">
              <Link
                href="/register"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                {locale === 'zh' ? '免费注册 🎁' : 'Sign Up Free 🎁'}
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-xs font-medium bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                {locale === 'zh' ? '登录' : 'Log In'}
              </Link>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // type === 'verify'
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 my-4 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-800">
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">📧</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {locale === 'zh' ? '请验证邮箱后使用此功能' : 'Verify your email to use this feature'}
          </p>
          <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
            {locale === 'zh'
              ? '验证邮箱后即可解锁所有功能。检查收件箱（包括垃圾邮件）中的验证链接。'
              : 'Check your inbox (and spam folder) and click the verification link.'}
          </p>
          <div className="flex gap-2 mt-3">
            <Link
              href="/verify-email"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors"
            >
              {locale === 'zh' ? '去验证邮箱' : 'Verify Email'}
            </Link>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
