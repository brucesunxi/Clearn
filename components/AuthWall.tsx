'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'

interface AuthWallProps {
  title?: string
  description?: string
  featureName?: string
}

export default function AuthWall({
  title,
  description,
  featureName,
}: AuthWallProps) {
  const { t, locale } = useTranslation()

  // 获取翻译文本，如果没有则使用默认值
  const getText = (key: string, defaultValue: string) => {
    const translated = t(key)
    return translated === key ? defaultValue : translated
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {title || getText('auth.wall.title', locale === 'zh' ? '需要登录' : 'Login Required')}
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          {description ||
            (featureName
              ? (locale === 'zh' ? `使用「${featureName}」功能需要登录账号` : `Log in to use ${featureName}`)
              : (locale === 'zh' ? '此功能需要登录后才能使用' : 'Please log in to use this feature'))}
        </p>
        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
          >
            {getText('auth.login', locale === 'zh' ? '登录' : 'Log In')}
          </Link>
          <Link
            href="/register"
            className="block w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors border border-gray-200"
          >
            {getText('auth.register', locale === 'zh' ? '注册新账号' : 'Create Account')}
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          {locale === 'zh' ? '注册即送 500 金币 🪙 开始你的中文学习之旅' : 'Sign up and get 500 coins 🪙 to start learning!'}
        </p>
      </div>
    </div>
  )
}
