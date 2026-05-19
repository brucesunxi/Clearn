'use client'

import { useState, useEffect, useCallback } from 'react'

const USER_ID_KEY = 'chineselearn-user-id'

function getUserId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(USER_ID_KEY)
  if (!id) {
    id = `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    localStorage.setItem(USER_ID_KEY, id)
  }
  return id
}

function headers(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-user-id': getUserId(),
  }
}

export function useCoins() {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/coins', { headers: headers() })
      if (res.ok) {
        const data = await res.json()
        setBalance(data.balance)
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
      const res = await fetch('/api/coins/spend', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ amount }),
      })
      if (res.ok) {
        const data = await res.json()
        setBalance(data.balance)
        return true
      }
      if (res.status === 402) {
        const data = await res.json()
        setBalance(data.balance)
      }
      return false
    } catch {
      return false
    }
  }, [])

  const add = useCallback(async (amount: number): Promise<number> => {
    const res = await fetch('/api/coins', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ amount }),
    })
    if (res.ok) {
      const data = await res.json()
      setBalance(data.balance)
      return data.balance
    }
    return balance
  }, [balance])

  return { balance, loading, refresh, spend, add }
}
