'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'
import { initVoice } from '@/lib/tts'
import SiteLogo from './SiteLogo'

interface CoinHistoryEntry {
  id: string
  amount: number
  reason: string
  balance: number
  createdAt: string
  detail: string
}

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
  const [showHistory, setShowHistory] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [history, setHistory] = useState<CoinHistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Read coins from localStorage + sync to API in background
  useEffect(() => {
    initVoice()
    const read = () => {
      try {
        // 如果未登录，不显示金币
        if (!user) {
          setCoins(0)
          setHistory([])
          return
        }
        const raw = localStorage.getItem('panda-inventory')
        if (raw) {
          const inv = JSON.parse(raw)
          setCoins((prev) => (prev !== inv.coins ? inv.coins : prev))
        }
      } catch {}
    }
    read()
    const t = setInterval(read, 1000)
    return () => clearInterval(t)
  }, [user])

  const fetchHistory = useCallback(async () => {
    // 未登录不获取历史
    if (!user) {
      setHistory([])
      return
    }
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/coins/history', {
        headers: { 'x-user-id': getUserId() },
      })
      if (res.ok) {
        const data = await res.json()
        setHistory(data.entries || [])
      }
    } catch {} finally {
      setHistoryLoading(false)
    }
  }, [user])

  const handleToggleHistory = () => {
    if (!showHistory) {
      fetchHistory()
    }
    setShowHistory(!showHistory)
  }

  const reasonLabel = (reason: string): string => {
    const map: Record<string, string> = {
      study_complete: '📝 Study',
      quiz_complete: '🎯 Quiz',
      battle_complete: '⚔️ Battle',
      listen_complete: '🎧 Listen',
      speak_complete: '🗣️ Speak',
      checkin: '✅ Check-in',
      box_open: '🎁 Box',
      box_prize: '🎁 Box Prize',
      pet_feed: '🍙 Feed',
      shop_purchase: '🛒 Purchase',
      spend: '💸 Spend',
      earn: '💰 Earn',
    }
    return map[reason] || reason
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour}h ago`
    return d.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { month: '2-digit', day: '2-digit' })
  }

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
          <Link href="/blindbox" className="text-gray-600 hover:text-purple-500 dark:text-gray-300 dark:hover:text-purple-400 font-medium transition-colors text-sm">🎁 {locale === 'zh' ? '盲盒' : 'Box'}</Link>
          <Link href="/pet" className="text-gray-600 hover:text-green-500 dark:text-gray-300 dark:hover:text-green-400 font-medium transition-colors text-sm">🐼</Link>
        </div>
        {user && (
          <div className="relative">
            <button
              onClick={handleToggleHistory}
              className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-full hover:bg-yellow-100 transition-colors cursor-pointer dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-900/50"
            >
              <span>🪙</span>
              <span className="font-semibold">{coins}</span>
            </button>

            {showHistory && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowHistory(false)} />
                <div className="absolute right-0 mt-2 z-50 w-80 bg-white rounded-xl shadow-xl border border-gray-100 max-h-96 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between dark:border-gray-700">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">🪙 Coin History</span>
                    <span className="text-xs text-gray-400 dark:text-gray-400">Balance: {coins}</span>
                  </div>
                  <div className="overflow-y-auto max-h-80">
                    {historyLoading && (
                      <div className="text-center py-8 text-xs text-gray-400">Loading...</div>
                    )}
                    {!historyLoading && history.length === 0 && (
                      <div className="text-center py-8 text-xs text-gray-400">No records yet</div>
                    )}
                    {!historyLoading && history.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0 dark:hover:bg-gray-700/50 dark:border-gray-700/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-200">{reasonLabel(entry.reason)}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(entry.createdAt)}</p>
                          {entry.detail && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{entry.detail}</p>}
                        </div>
                        <div className={`text-sm font-bold ${entry.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {entry.amount >= 0 ? '+' : ''}{entry.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
          {!isAdminPage && !loading && (
            <>
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 hidden sm:inline max-w-[100px] truncate dark:text-gray-400">{user.email}</span>
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
          <Link href="/pet" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-600 dark:text-gray-300 py-1.5">🐼 {locale === 'zh' ? '宠物' : 'Pet'}</Link>
        </div>
      )}
    </header>
  )
}
