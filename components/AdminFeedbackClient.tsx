'use client'

import { useState, useEffect, useCallback } from 'react'

interface FeedbackEntry {
  id: string; userId: string; message: string; contact: string; createdAt: string; read: boolean
}
interface ActivityEntry {
  id: string; userId: string; action: string; detail: string; createdAt: string
}
interface UserEntry {
  userId: string; email: string; createdAt: string; emailVerified: boolean
}

type AdminTab = 'feedback' | 'activity' | 'users'
type FeedbackFilter = 'all' | 'unread'

const ACTION_META: Record<string, { emoji: string; label: string }> = {
  study_complete:  { emoji: '📝', label: 'Study' },
  quiz_complete:   { emoji: '🎯', label: 'Quiz' },
  battle_complete: { emoji: '⚔️', label: 'Battle' },
  listen_complete: { emoji: '🎧', label: 'Listen' },
  speak_complete:  { emoji: '🗣️', label: 'Speak' },
  checkin:         { emoji: '✅', label: 'Check-in' },
  box_open:        { emoji: '🎁', label: 'Box' },
  pet_feed:        { emoji: '🍙', label: 'Feed' },
  shop_purchase:   { emoji: '🛒', label: 'Shop' },
  article_read:    { emoji: '📖', label: 'Read' },
  material_import: { emoji: '📥', label: 'Import' },
}
const ACTION_KEYS = Object.keys(ACTION_META)

export default function AdminFeedbackClient() {
  const [step, setStep] = useState<'password' | 'authenticated'>('password')
  const [adminKey, setAdminKey] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [tab, setTab] = useState<AdminTab>('feedback')
  const [actionMsg, setActionMsg] = useState('')

  // Feedback state
  const [fbEntries, setFbEntries] = useState<FeedbackEntry[]>([])
  const [fbTotal, setFbTotal] = useState(0)
  const [fbPage, setFbPage] = useState(1)
  const [fbFilter, setFbFilter] = useState<FeedbackFilter>('all')
  const [fbLoading, setFbLoading] = useState(false)
  const [fbError, setFbError] = useState('')

  // Activity state
  const [actEntries, setActEntries] = useState<ActivityEntry[]>([])
  const [actTotal, setActTotal] = useState(0)
  const [actPage, setActPage] = useState(1)
  const [actFilter, setActFilter] = useState('')
  const [actLoading, setActLoading] = useState(false)
  const [actError, setActError] = useState('')

  // Users state
  const [users, setUsers] = useState<UserEntry[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')

  const pageSize = 20

  useEffect(() => {
    const saved = sessionStorage.getItem('admin-key')
    if (saved) { setAdminKey(saved); setStep('authenticated') }
  }, [])

  // ---- Data fetching ----
  const fetchFeedback = useCallback(async (p: number) => {
    setFbLoading(true); setFbError('')
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: String(pageSize) })
      const res = await fetch(`/api/admin/feedback?${params}`, { headers: { 'x-admin-key': adminKey } })
      if (res.status === 401) return handleSessionExpired()
      if (!res.ok) throw new Error()
      const data: { entries: FeedbackEntry[]; total: number } = await res.json()
      const filtered = fbFilter === 'unread' ? data.entries.filter((e) => !e.read) : data.entries
      setFbEntries(filtered); setFbTotal(fbFilter === 'unread' ? filtered.length : data.total)
    } catch { setFbError('Failed to load feedback') }
    finally { setFbLoading(false) }
  }, [adminKey, fbFilter])

  const fetchActivity = useCallback(async (p: number) => {
    setActLoading(true); setActError('')
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: String(pageSize) })
      const res = await fetch(`/api/admin/activity?${params}`, { headers: { 'x-admin-key': adminKey } })
      if (res.status === 401) return handleSessionExpired()
      if (!res.ok) throw new Error()
      const data: { entries: ActivityEntry[]; total: number } = await res.json()
      setActEntries(data.entries); setActTotal(data.total)
    } catch { setActError('Failed to load activity') }
    finally { setActLoading(false) }
  }, [adminKey])

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true); setUsersError('')
    try {
      const res = await fetch('/api/admin/users', { headers: { 'x-admin-key': adminKey } })
      if (res.status === 401) return handleSessionExpired()
      if (!res.ok) throw new Error()
      const data: { users: UserEntry[]; total: number } = await res.json()
      setUsers(data.users)
    } catch { setUsersError('Failed to load users') }
    finally { setUsersLoading(false) }
  }, [adminKey])

  useEffect(() => {
    if (step === 'authenticated' && adminKey && tab === 'feedback') fetchFeedback(fbPage)
  }, [step, adminKey, tab, fbPage, fbFilter, fetchFeedback])

  useEffect(() => {
    if (step === 'authenticated' && adminKey && tab === 'activity') fetchActivity(actPage)
  }, [step, adminKey, tab, actPage, actFilter, fetchActivity])

  useEffect(() => {
    if (step === 'authenticated' && adminKey && tab === 'users') fetchUsers()
  }, [step, adminKey, tab, fetchUsers])

  // ---- Auth ----
  const handleAuth = async () => {
    if (!passwordInput.trim()) return
    setAuthLoading(true); setAuthError('')
    try {
      const res = await fetch('/api/admin/feedback?page=1&pageSize=1', { headers: { 'x-admin-key': passwordInput.trim() } })
      if (res.ok) {
        sessionStorage.setItem('admin-key', passwordInput.trim())
        setAdminKey(passwordInput.trim()); setStep('authenticated')
      } else if (res.status === 401) { setAuthError('Invalid password')
      } else { setAuthError('Service unavailable') }
    } catch { setAuthError('Network error') }
    finally { setAuthLoading(false) }
  }

  const handleSessionExpired = () => {
    setAuthError('Session expired')
    sessionStorage.removeItem('admin-key'); setStep('password'); setAdminKey('')
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin-key'); setAdminKey(''); setStep('password')
    setPasswordInput(''); setFbEntries([]); setActEntries([]); setUsers([])
  }

  const handleMarkRead = async (id: string) => {
    const res = await fetch('/api/admin/feedback', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { setFbEntries((prev) => prev.map((e) => (e.id === id ? { ...e, read: true } : e))); setActionMsg('Marked as read') }
    setTimeout(() => setActionMsg(''), 2000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this feedback?')) return
    const res = await fetch('/api/admin/feedback', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { setFbEntries((prev) => prev.filter((e) => e.id !== id)); setFbTotal((prev) => prev - 1); setActionMsg('Deleted') }
    setTimeout(() => setActionMsg(''), 2000)
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const unreadCount = fbEntries.filter((e) => !e.read).length

  if (step === 'password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <p className="text-3xl mb-2">🔐</p>
            <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
            <p className="text-sm text-gray-400 mt-1">Enter admin password to continue</p>
          </div>
          <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()} placeholder="Password"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" autoFocus />
          {authError && <p className="mt-2 text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{authError}</p>}
          <button onClick={handleAuth} disabled={!passwordInput.trim() || authLoading}
            className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-200 transition-colors">
            {authLoading ? 'Verifying...' : 'Login'}
          </button>
        </div>
      </div>
    )
  }

  const fbTotalPages = Math.max(1, Math.ceil(fbTotal / pageSize))
  const actTotalPages = Math.max(1, Math.ceil(actTotal / pageSize))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tab bar */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {(['feedback', 'activity', 'users'] as AdminTab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-blue-500 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}>
              {t === 'feedback' ? '💬 Feedback' : t === 'activity' ? '📊 Activity' : '👥 Users'}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">Logout</button>
        </div>

        {actionMsg && <p className="mb-4 text-sm text-green-600 bg-green-50 rounded-lg px-4 py-2 text-center">{actionMsg}</p>}

        {/* Feedback Tab */}
        {tab === 'feedback' && (
          <>
            <p className="text-sm text-gray-400 mb-3">Total: {fbTotal} · Unread: {unreadCount}</p>
            <div className="flex gap-2 mb-4">
              {(['all', 'unread'] as FeedbackFilter[]).map((f) => (
                <button key={f} onClick={() => { setFbFilter(f); setFbPage(1) }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    fbFilter === f ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                  }`}>{f === 'all' ? 'All' : `Unread (${unreadCount})`}</button>
              ))}
            </div>
            {fbError && <p className="mb-4 text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{fbError}</p>}
            {fbLoading && <div className="text-center py-12 text-gray-400">Loading...</div>}
            {!fbLoading && fbEntries.length === 0 && <div className="text-center py-12"><p className="text-4xl mb-3">📭</p><p className="text-gray-400">No feedback yet</p></div>}
            {!fbLoading && fbEntries.length > 0 && (
              <div className="space-y-3">
                {fbEntries.map((entry) => (
                  <div key={entry.id} className={`bg-white rounded-xl border p-4 ${!entry.read ? 'border-blue-200 shadow-sm' : 'border-gray-100'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                          <span className="font-mono">{entry.userId.slice(0, 8)}...</span><span>·</span>
                          <span>{formatDate(entry.createdAt)}</span>
                          {!entry.read && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-600">New</span>}
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{entry.message}</p>
                        {entry.contact && <p className="mt-1 text-xs text-gray-400">📧 {entry.contact}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {!entry.read && <button onClick={() => handleMarkRead(entry.id)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100">✓</button>}
                        <button onClick={() => handleDelete(entry.id)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-500 hover:bg-red-100">✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {fbTotalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button onClick={() => setFbPage((p) => Math.max(1, p - 1))} disabled={fbPage <= 1} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30">← Prev</button>
                <span className="text-xs text-gray-400">{fbPage} / {fbTotalPages}</span>
                <button onClick={() => setFbPage((p) => Math.min(fbTotalPages, p + 1))} disabled={fbPage >= fbTotalPages} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30">Next →</button>
              </div>
            )}
          </>
        )}

        {/* Activity Tab */}
        {tab === 'activity' && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <p className="text-sm text-gray-400">Total: {actTotal}</p>
              <select value={actFilter} onChange={(e) => { setActFilter(e.target.value); setActPage(1) }}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">All actions</option>
                {ACTION_KEYS.map((key) => (<option key={key} value={key}>{ACTION_META[key].emoji} {ACTION_META[key].label}</option>))}
              </select>
            </div>
            {actError && <p className="mb-4 text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{actError}</p>}
            {actLoading && <div className="text-center py-12 text-gray-400">Loading...</div>}
            {!actLoading && actEntries.length === 0 && <div className="text-center py-12"><p className="text-4xl mb-3">📊</p><p className="text-gray-400">No activity yet</p></div>}
            {!actLoading && actEntries.length > 0 && (
              <div className="space-y-2">
                {actEntries.filter((e) => !actFilter || e.action === actFilter).map((entry) => {
                  const meta = ACTION_META[entry.action] || { emoji: '❓', label: entry.action }
                  let detailText = ''
                  try { if (entry.detail) { const d = JSON.parse(entry.detail); detailText = Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(' · ') } } catch {}
                  return (
                    <div key={entry.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-start gap-3">
                      <span className="text-lg mt-0.5 shrink-0">{meta.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-0.5">
                          <span className="font-medium text-gray-600">{meta.label}</span><span>·</span>
                          <span className="font-mono">{entry.userId.slice(0, 8)}...</span><span>·</span>
                          <span>{formatDate(entry.createdAt)}</span>
                        </div>
                        {detailText && <p className="text-xs text-gray-500">{detailText}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {actTotalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button onClick={() => setActPage((p) => Math.max(1, p - 1))} disabled={actPage <= 1} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30">← Prev</button>
                <span className="text-xs text-gray-400">{actPage} / {actTotalPages}</span>
                <button onClick={() => setActPage((p) => Math.min(actTotalPages, p + 1))} disabled={actPage >= actTotalPages} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30">Next →</button>
              </div>
            )}
          </>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <>
            {usersError && <p className="mb-4 text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{usersError}</p>}
            {usersLoading && <div className="text-center py-12 text-gray-400">Loading...</div>}
            {!usersLoading && users.length === 0 && (
              <div className="text-center py-12"><p className="text-4xl mb-3">👥</p><p className="text-gray-400">No users registered yet</p></div>
            )}
            {!usersLoading && users.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500 grid grid-cols-4 gap-4">
                  <span>Email</span>
                  <span>User ID</span>
                  <span>Registered</span>
                  <span>Verified</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <div key={u.userId} className="px-4 py-3 text-xs text-gray-600 grid grid-cols-4 gap-4 items-center">
                      <span className="truncate font-medium">{u.email}</span>
                      <span className="font-mono truncate">{u.userId.slice(0, 12)}...</span>
                      <span>{formatDate(u.createdAt)}</span>
                      <span>{u.emailVerified ? '✅' : '❌'}</span>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400 bg-gray-50">
                  Total: {users.length} user{users.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
