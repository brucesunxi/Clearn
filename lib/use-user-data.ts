'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './auth-context'

/**
 * 统一的用户数据管理 Hook
 * 优先从 Redis 读取，如果没有则从 localStorage 读取并同步到 Redis
 */

interface UseUserDataOptions<T> {
  localKey: string
  defaultValue: T
}

export function useUserData<T>({ localKey, defaultValue }: UseUserDataOptions<T>) {
  const { user } = useAuth()
  const [data, setData] = useState<T>(defaultValue)
  const [loading, setLoading] = useState(true)
  const [synced, setSynced] = useState(false)

  // 从服务器加载数据
  const loadFromServer = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch(`/api/user-data?key=${localKey}`, {
        credentials: 'same-origin'
      })
      if (res.ok) {
        const result = await res.json()
        if (result.data) {
          setData(result.data)
          // 同时更新 localStorage 保持兼容
          if (typeof window !== 'undefined') {
            localStorage.setItem(localKey, JSON.stringify(result.data))
          }
        } else if (typeof window !== 'undefined') {
          // 服务器没有，尝试从 localStorage 读取并上传
          const local = localStorage.getItem(localKey)
          if (local) {
            try {
              const parsed = JSON.parse(local)
              setData(parsed)
              // 上传到服务器
              await fetch('/api/user-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: localKey, data: parsed }),
                credentials: 'same-origin'
              })
            } catch { /* ignore */ }
          }
        }
      }
    } finally {
      setLoading(false)
      setSynced(true)
    }
  }, [user, localKey])

  // 保存数据到服务器和 localStorage
  const saveData = useCallback(async (newData: T) => {
    setData(newData)

    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(localKey, JSON.stringify(newData))
    }

    // 如果已登录，同步到服务器
    if (user) {
      try {
        await fetch('/api/user-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: localKey, data: newData }),
          credentials: 'same-origin'
        })
      } catch { /* ignore */ }
    }
  }, [user, localKey])

  // 初始加载
  useEffect(() => {
    loadFromServer()
  }, [loadFromServer])

  return { data, setData: saveData, loading, synced }
}
