'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'
import { initVoice } from '@/lib/tts'
import SiteLogo from './SiteLogo'

function getUserId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('chineselearn-user-id')
  if (!id) {
    id = `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    localStorage.setItem('chineselearn-user-id', id)
  }
  return id
}

export default function Header() {
  const { locale, setLocale, t } = useTranslation()
  const { user, loading, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')
  const [coins, setCoins] = useState(500)
  const [menuOpen, setMenuOpen] = useState(false)

  // 获取金币余额 - 与 useCoins hook 保持一致的逻辑
  useEffect(() => {
    initVoice()

    const fetchCoins = async () => {
      // 未登录时不显示金币
      if (!user) {
        setCoins(0)
        return
      }

      try {
        // 先检查是否是登录用户
        const authRes = await fetch('/api/auth/me', { credentials: 'include' })
        const authData = await authRes.json()

        const headers: HeadersInit = { 'Content-Type': 'application/json' }

        // 如果不是登录用户，发送 x-user-id header
        if (!authData.user?.userId) {
          const id = localStorage.getItem('chineselearn-user-id') ||
            `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
          localStorage.setItem('chineselearn-user-id', id)
          headers['x-user-id'] = id
        }

        const res = await fetch('/api/coins', { headers })
        if (res.ok) {
          const data = await res.json()
          if (typeof data.balance === 'number') {
            setCoins(data.balance)
          }
        }
      } catch {
        // silently fail
      }
    }

    fetchCoins()
    const t = setInterval(fetchCoins, 1000)
    return () => clearInterval(t)
  }, [user])

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 dark:bg-gray-800 dark:shadow-gray-700/20 transition-colors">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <SiteLogo />
        </Link>
        {/* Hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
            aria-label="Menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-5">
          <Link href="/listen" className="text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 font-medium transition-colors text-sm">🎧 {locale === 'zh' ? '听' : 'Listen'}</Link>
          <Link href="/speak" className="text-gray-600 hover:text-red-500 dark:text-gray-300 dark:hover:text-red-400 font-medium transition-colors text-sm">🗣️ {locale === 'zh' ? '说' : 'Speak'}</Link>
          <Link href="/reading" className="text-gray-600 hover:text-orange-500 dark:text-gray-300 dark:hover:text-orange-400 font-medium transition-colors text-sm">📖 {locale === 'zh' ? '读' : 'Read'}</Link>
          <Link href="/import" className="text-gray-600 hover:text-indigo-500 dark:text-gray-300 dark:hover:text-indigo-400 font-medium transition-colors text-sm">📥 {locale === 'zh' ? '导入' : 'Import'}</Link>
          <Link href="/stats" className="text-gray-600 hover:text-cyan-500 dark:text-gray-300 dark:hover:text-cyan-400 font-medium transition-colors text-sm">📊 {locale === 'zh' ? '统计' : 'Stats'}</Link>
          <Link href="/adventure" className="text-gray-600 hover:text-emerald-500 dark:text-gray-300 dark:hover:text-emerald-400 font-medium transition-colors text-sm">🗺️ {locale === 'zh' ? '冒险' : 'Adventure'}</Link>
          <Link href="/blindbox" className="text-gray-600 hover:text-purple-500 dark:text-gray-300 dark:hover:text-purple-400 font-medium transition-colors text-sm">🎁 {locale === 'zh' ? '盲盒' : 'Box'}</Link>
          <Link href="/pet" className="text-gray-600 hover:text-green-500 dark:text-gray-300 dark:hover:text-green-400 font-medium transition-colors text-sm">🐼</Link>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-full dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-400">
              <span>🪙</span>
              <span className="font-semibold">{coins}</span>
            </div>
          </div>
        )}
          {!isAdminPage && !loading && (
            <>
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors border border-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 dark:border-gray-600"
                  >
                    <span className="text-base">👤</span>
                    <span className="max-w-[100px] truncate">{user.email}</span>
                  </Link>
                  {!user.emailVerified && (
                    <span className="text-[11px] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded dark:bg-amber-900/30 dark:text-amber-400" title="Email not verified">⚠️</span>
                  )}
                  <button
                    onClick={logout}
                    className="px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors border border-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 dark:border-gray-600"
                  >
                    {locale === 'zh' ? '登出' : 'Logout'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors border border-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 dark:border-gray-600"
                  >
                    {locale === 'zh' ? '登录' : 'Login'}
                  </Link>
                  <Link
                    href="/register"
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-colors shadow-sm"
                  >
                    {locale === 'zh' ? '免费注册 🎁' : 'Register 🎁'}
                  </Link>
                </div>
              )}
            </>
          )}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')}
            className="px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
            title={`Theme: ${theme}`}
          >
            {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻'}
          </button>
          <button
            onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
            className="px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
          >
            {locale === 'zh' ? 'EN' : '中文'}
          </button>
      </div>
      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-4 py-3 space-y-2">
          <Link href="/listen" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-600 dark:text-gray-300 py-1.5">🎧 {locale === 'zh' ? '听力' : 'Listen'}</Link>
          <Link href="/speak" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-600 dark:text-gray-300 py-1.5">🗣️ {locale === 'zh' ? '口语' : 'Speak'}</Link>
          <Link href="/reading" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-600 dark:text-gray-300 py-1.5">📖 {locale === 'zh' ? '阅读' : 'Read'}</Link>
          <Link href="/practice" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-600 dark:text-gray-300 py-1.5">🎯 {locale === 'zh' ? '练习' : 'Practice'}</Link>
          <Link href="/learn" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-600 dark:text-gray-300 py-1.5">📝 {locale === 'zh' ? '单词' : 'Words'}</Link>
          <Link href="/import" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-600 dark:text-gray-300 py-1.5">📥 {locale === 'zh' ? '导入' : 'Import'}</Link>
          <Link href="/stats" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-600 dark:text-gray-300 py-1.5">📊 {locale === 'zh' ? '统计' : 'Stats'}</Link>
          <Link href="/blindbox" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-600 dark:text-gray-300 py-1.5">🎁 {locale === 'zh' ? '盲盒' : 'Box'}</Link>
          <Link href="/adventure" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-600 dark:text-gray-300 py-1.5">🗺️ {locale === 'zh' ? '冒险' : 'Adventure'}</Link>
          <Link href="/pet" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-600 dark:text-gray-300 py-1.5">🐼 {locale === 'zh' ? '宠物' : 'Pet'}</Link>
        </div>
      )}
    </header>
  )
}
