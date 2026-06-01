'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import AuthWall from './AuthWall'

interface ProtectedPageProps {
  children: React.ReactNode
  featureName?: string
}

export default function ProtectedPage({ children, featureName }: ProtectedPageProps) {
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 防止水合不匹配
  if (!mounted || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  // 未登录显示登录墙
  if (!user) {
    return <AuthWall featureName={featureName} />
  }

  // 已登录显示内容
  return <>{children}</>
}
