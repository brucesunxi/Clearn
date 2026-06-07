'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useTranslation } from '@/lib/i18n/context'
import VerifyWall from '@/components/VerifyWall'

function RegisterForm() {
  const { user, register } = useAuth()
  const { locale } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [justRegistered, setJustRegistered] = useState(false)

  // 注册后未验证，直接显示 VerifyWall
  if (justRegistered && user && !user.emailVerified) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            📝 {locale === 'zh' ? '欢迎加入 PandaHan' : 'Welcome to PandaHan'}
          </h1>
          <p className="text-sm text-gray-400">
            {locale === 'zh' ? '验证邮箱后开始学习' : 'Verify your email to start learning'}
          </p>
        </div>
        <VerifyWall />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) { setError('Email is required'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (!agreedToTerms) {
      setError(locale === 'zh' ? '请同意隐私政策和用户协议' : 'Please agree to the Privacy Policy and Terms of Service')
      return
    }

    setLoading(true)
    const result = await register(email, password, refCode || undefined)
    setLoading(false)

    if (result.success) {
      try {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'conversion', {
            'send_to': 'AW-18197467032/IG2TCOzEpbccEJifneVD',
            'value': 1.0,
            'currency': 'USD'
          })
        }
      } catch(e) {}
      if (result.emailVerified) {
        router.push('/')
      } else {
        setJustRegistered(true)
      }
    } else {
      setError(result.error || 'Registration failed')
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">Create Account</h1>
        <p className="text-sm text-gray-400 text-center mb-8">Join PandaHan and start learning!</p>

        {refCode && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <p className="text-sm text-emerald-700 font-medium">
              🎉 {locale === 'zh' ? '邀请注册 · 你和邀请人都可获得奖励！' : 'Invited! Both you and your inviter get a reward!'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Privacy & Terms agreement */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms-agreement"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="terms-agreement" className="text-xs text-gray-500 leading-relaxed">
              {locale === 'zh'
                ? '我已阅读并同意 '
                : 'I have read and agree to the '}
              <Link href="/privacy" className="text-blue-500 hover:text-blue-600 underline">
                {locale === 'zh' ? '隐私政策' : 'Privacy Policy'}
              </Link>
              {locale === 'zh' ? ' 和 ' : ' and '}
              <Link href="/terms" className="text-blue-500 hover:text-blue-600 underline">
                {locale === 'zh' ? '用户协议' : 'Terms of Service'}
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 transition-all shadow-sm"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-500 hover:text-blue-600 font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
