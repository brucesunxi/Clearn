'use client'

import { useState, useEffect, useCallback } from 'react'

interface FeedbackEntry {
  id: string
  userId: string
  message: string
  contact: string
  createdAt: string
  read: boolean
}

interface FeedbackResult {
  entries: FeedbackEntry[]
  total: number
}

type FilterType = 'all' | 'unread'

export default function AdminFeedbackClient() {
  const [step, setStep] = useState<'password' | 'authenticated'>('password')
  const [adminKey, setAdminKey] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [entries, setEntries] = useState<FeedbackEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<FilterType>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  const pageSize = 20

  // Try to restore admin key from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('admin-key')
    if (saved) {
      setAdminKey(saved)
      setStep('authenticated')
    }
  }, [])

  const fetchFeedback = useCallback(async (p: number) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: String(pageSize) })
      if (filter === 'unread') params.set('filter', 'unread')
      const res = await fetch(`/api/admin/feedback?${params}`, {
        headers: { 'x-admin-key': adminKey },
      })
      if (res.status === 401) {
        setAuthError('Session expired. Please re-enter password.')
        sessionStorage.removeItem('admin-key')
        setStep('password')
        setAdminKey('')
        return
      }
      if (!res.ok) throw new Error('Failed to load')
      const data: FeedbackResult = await res.json()
      const filtered = filter === 'unread' ? data.entries.filter((e) => !e.read) : data.entries
      setEntries(filtered)
      setTotal(filter === 'unread' ? filtered.length : data.total)
    } catch {
      setError('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }, [adminKey, filter])

  useEffect(() => {
    if (step === 'authenticated' && adminKey) {
      fetchFeedback(page)
    }
  }, [step, adminKey, page, filter, fetchFeedback])

  const handleAuth = async () => {
    if (!passwordInput.trim()) return
    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await fetch('/api/admin/feedback?page=1&pageSize=1', {
        headers: { 'x-admin-key': passwordInput.trim() },
      })
      if (res.ok) {
        sessionStorage.setItem('admin-key', passwordInput.trim())
        setAdminKey(passwordInput.trim())
        setStep('authenticated')
      } else if (res.status === 401) {
        setAuthError('Invalid password')
      } else {
        setAuthError('Service unavailable')
      }
    } catch {
      setAuthError('Network error')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleMarkRead = async (id: string) => {
    const res = await fetch('/api/admin/feedback', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, read: true } : e)))
      setActionMsg('Marked as read')
    }
    setTimeout(() => setActionMsg(''), 2000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this feedback?')) return
    const res = await fetch('/api/admin/feedback', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id))
      setTotal((prev) => prev - 1)
      setActionMsg('Deleted')
    }
    setTimeout(() => setActionMsg(''), 2000)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin-key')
    setAdminKey('')
    setStep('password')
    setPasswordInput('')
    setEntries([])
    setPage(1)
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    })
  }

  const unreadCount = entries.filter((e) => !e.read).length

  // === Password prompt ===
  if (step === 'password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <p className="text-3xl mb-2">🔐</p>
            <h1 className="text-xl font-bold text-gray-800">Feedback Admin</h1>
            <p className="text-sm text-gray-400 mt-1">Enter admin password to continue</p>
          </div>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            placeholder="Password"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            autoFocus
          />
          {authError && (
            <p className="mt-2 text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{authError}</p>
          )}
          <button
            onClick={handleAuth}
            disabled={!passwordInput.trim() || authLoading}
            className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
          >
            {authLoading ? 'Verifying...' : 'Login'}
          </button>
        </div>
      </div>
    )
  }

  // === Dashboard ===
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">💬 Feedback</h1>
            <p className="text-sm text-gray-400 mt-1">
              Total: {total} · Unread: {entries.filter((e) => !e.read).length}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Action flash */}
        {actionMsg && (
          <p className="mb-4 text-sm text-green-600 bg-green-50 rounded-lg px-4 py-2 text-center">{actionMsg}</p>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {(['all', 'unread'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1) }}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'All' : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="mb-4 text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        )}

        {/* Empty */}
        {!loading && entries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-400">No feedback yet</p>
          </div>
        )}

        {/* Feedback list */}
        {!loading && entries.length > 0 && (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`bg-white rounded-xl border p-4 transition-all ${
                  !entry.read ? 'border-blue-200 shadow-sm' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Meta */}
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                      <span className="font-mono">{entry.userId.slice(0, 8)}...</span>
                      <span>·</span>
                      <span>{formatDate(entry.createdAt)}</span>
                      {!entry.read && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-600">New</span>
                      )}
                    </div>
                    {/* Message */}
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{entry.message}</p>
                    {/* Contact */}
                    {entry.contact && (
                      <p className="mt-1 text-xs text-gray-400">
                        📧 {entry.contact}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 shrink-0">
                    {!entry.read && (
                      <button
                        onClick={() => handleMarkRead(entry.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <span className="text-xs text-gray-400">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
