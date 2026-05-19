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
  return { 'Content-Type': 'application/json', 'x-user-id': getUserId() }
}

export interface PetData {
  hunger: number
  happiness: number
  lastUpdated: string
}

export interface InventoryData {
  food: Record<string, number>
  accessories: Record<string, boolean>
  equipped: string[]
}

export interface CheckinData {
  history: string[]
  currentStreak: number
  longestStreak: number
}

export function useApiData() {
  const [loading, setLoading] = useState(true)
  const [coins, setCoins] = useState(0)
  const [pet, setPet] = useState<PetData | null>(null)
  const [inventory, setInventory] = useState<InventoryData | null>(null)
  const [checkin, setCheckin] = useState<CheckinData | null>(null)
  const [checkedInToday, setCheckedInToday] = useState(false)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      // Fetch inventory+pet+coins in one call
      const invRes = await fetch('/api/inventory', { headers: headers() })
      if (invRes.ok) {
        const data = await invRes.json()
        setCoins(data.coins)
        setPet(data.pet)
        setInventory(data.inventory)
      }

      const ciRes = await fetch('/api/checkin', { headers: headers() })
      if (ciRes.ok) {
        const data = await ciRes.json()
        setCheckin(data.checkin)
        setCheckedInToday(data.checkedInToday)
      }
    } catch {
      // fall through
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const feed = useCallback(async (foodId: string) => {
    const res = await fetch('/api/inventory/feed', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ foodId }),
    })
    if (res.ok) {
      const data = await res.json()
      setPet(data.pet)
      setInventory(data.inventory)
      return { success: true as const, pet: data.pet as PetData, inventory: data.inventory as InventoryData }
    }
    const err = await res.json()
    return { success: false as const, error: err.error as string }
  }, [])

  const equip = useCallback(async (accessoryId: string) => {
    const res = await fetch('/api/inventory/equip', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ accessoryId }),
    })
    if (res.ok) {
      const data = await res.json()
      setInventory(data.inventory)
      return data.inventory as InventoryData
    }
    return null
  }, [])

  const doCheckin = useCallback(async () => {
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: headers(),
    })
    if (res.ok) {
      const data = await res.json()
      setCheckin(data.checkin)
      setCheckedInToday(true)
      if (data.coins) setCoins(data.coins)
      return data.checkin as CheckinData
    }
    return null
  }, [])

  return { loading, coins, pet, inventory, checkin, checkedInToday, refresh, feed, equip, doCheckin }
}
