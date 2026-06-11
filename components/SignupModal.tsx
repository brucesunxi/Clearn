'use client'

import { useEffect } from 'react'
import { hasSignupModalBeenShown, markSignupModalShown } from '@/lib/signup-guard'

interface SignupModalProps {
  type: 'register' | 'verify'
  locale: 'zh' | 'en'
  onClose: () => void
}

export default function SignupModal({ type, locale, onClose }: SignupModalProps) {
  useEffect(() => {
    markSignupModalShown()
  }, [])

  if (type === 'verify') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-bounce-in">
          <div className="text-4xl mb-3">📧</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            {locale === 'zh' ? '请验证邮箱' : 'Verify Your Email'}
          </h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            {locale === 'zh'
              ? '某些功能需要验证邮箱后才能使用。请检查收件箱（或垃圾邮件），点击验证链接。'
              : 'Some features require email verification. Please check your inbox (or spam folder) and click the verification link.'}
          </p>
          <div className="space-y-3">
            <a
              href="/verify-email"
              className="block w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm hover:from-amber-600 hover:to-orange-700 transition-all"
            >
              {locale === 'zh' ? '我已验证，刷新状态' : "I've Verified, Refresh"}
            </a>
            <a
              href="/api/auth/resend-verification"
              className="block w-full py-3 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
            >
              {locale === 'zh' ? '重新发送验证邮件' : 'Resend Verification Email'}
            </a>
            <button
              onClick={onClose}
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {locale === 'zh' ? '稍后再说' : 'Skip for Now'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-bounce-in">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          {locale === 'zh' ? '学得不错！' : 'Great Job!'}
        </h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          {locale === 'zh'
            ? '创建免费账号即可保存学习进度，并获得 500 金币，解锁熊猫宠物和盲盒！'
            : 'Create a free account to save your progress, get 500 bonus coins, and unlock the panda pet & blind boxes!'}
        </p>
        <div className="space-y-3">
          <a
            href="/register"
            className="block w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm hover:from-blue-600 hover:to-indigo-700 transition-all"
          >
            {locale === 'zh' ? '🎯 创建账号' : '🎯 Create Account'}
          </a>
          <a
            href="/login"
            className="block w-full py-3 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
          >
            {locale === 'zh' ? '已有账号？登录' : 'Already have an account? Log In'}
          </a>
          <button
            onClick={onClose}
            className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {locale === 'zh' ? '继续访客模式（进度不会保存）' : "Continue as Guest (progress won't be saved)"}
          </button>
        </div>
      </div>
    </div>
  )
}
