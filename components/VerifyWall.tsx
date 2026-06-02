'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/context'

const RESEND_COOLDOWN = 60

export default function VerifyWall() {
  const { t, locale } = useTranslation()
  const [countdown, setCountdown] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('emailResendUntil')
    if (saved) {
      const remaining = Math.max(0, Math.ceil((parseInt(saved) - Date.now()) / 1000))
      if (remaining > 0) setCountdown(remaining)
    }
  }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { localStorage.removeItem('emailResendUntil'); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleResend = async () => {
    if (countdown > 0 || isSending) return
    setIsSending(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST', credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      const until = Date.now() + RESEND_COOLDOWN * 1000
      localStorage.setItem('emailResendUntil', until.toString())
      setCountdown(RESEND_COOLDOWN)
      setMessage(locale === 'zh' ? '验证邮件已发送！请检查收件箱（包括垃圾邮件）' : 'Verification email sent! Check your inbox (and spam)')
    } catch (e) {
      setError(e instanceof Error ? e.message : (locale === 'zh' ? '发送失败' : 'Send failed'))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {locale === 'zh' ? '请验证邮箱' : 'Verify Your Email'}
        </h2>
        <p className="text-gray-500 text-sm mb-2">
          {locale === 'zh'
            ? '注册后请先验证邮箱才能使用完整功能'
            : 'Please verify your email to unlock all features'}
        </p>
        <p className="text-gray-400 text-xs mb-6">
          {locale === 'zh'
            ? '检查收件箱（包括垃圾邮件），点击验证链接激活账号'
            : 'Check your inbox (and spam folder) and click the verification link'}
        </p>

        <button
          onClick={handleResend}
          disabled={countdown > 0 || isSending}
          className="w-full py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
        >
          {isSending
            ? (locale === 'zh' ? '发送中...' : 'Sending...')
            : countdown > 0
              ? (locale === 'zh' ? `重新发送 (${countdown}s)` : `Resend (${countdown}s)`)
              : (locale === 'zh' ? '重新发送验证邮件' : 'Resend Verification Email')}
        </button>

        {message && <p className="text-sm text-emerald-600 mb-2">{message}</p>}
        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

        <p className="text-xs text-gray-400">
          {locale === 'zh'
            ? '验证链接24小时内有效。重新登录后会自动刷新状态。'
            : 'The link expires in 24 hours. Log back in after verifying.'}
        </p>

        {/* 提示用户重新登录 */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {locale === 'zh'
              ? '✅ 已验证邮箱？请重新登录刷新状态'
              : '✅ Already verified? Log out and back in to refresh'}
          </p>
        </div>
      </div>
    </div>
  )
}
