'use client'

import { useState, useEffect, useCallback } from 'react'

const USER_ID_KEY = 'chineselearn-user-id'

function getAnonymousId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(USER_ID_KEY)
  if (!id) {
    id = `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    localStorage.setItem(USER_ID_KEY, id)
  }
  return id
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // Check if user is logged in via JWT
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      if (data.user?.userId) {
        // User is logged in, don't send x-user-id header
        // Server will use JWT cookie instead
        return headers
      }
    }
  } catch {
    // ignore
  }

  // Anonymous user - send x-user-id header
  headers['x-user-id'] = getAnonymousId()
  return headers
}

export function useCoins() {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const headers = await getAuthHeaders()
      const res = await fetch('/api/coins', { headers })
      if (res.ok) {
        const data = await res.json()
        setBalance(data.balance ?? 0)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 1000)
    return () => clearInterval(interval)
  }, [refresh])

  const spend = useCallback(async (amount: number): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/coins/spend', {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount }),
      })
      if (res.ok) {
        const data = await res.json()
        setBalance(data.balance ?? 0)
        return true
      }
      if (res.status === 402) {
        const data = await res.json()
        setBalance(data.balance ?? 0)
      }
      return false
    } catch {
      return false
    }
  }, [])

  const add = useCallback(async (amount: number): Promise<number> => {
    const headers = await getAuthHeaders()
    const res = await fetch('/api/coins', {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount }),
    })
    if (res.ok) {
      const data = await res.json()
      setBalance(data.balance ?? 0)
      return data.balance ?? 0
    }
    return balance
  }, [balance])

  return { balance, loading, refresh, spend, add }
}
