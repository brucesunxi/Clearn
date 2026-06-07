'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { useAuth } from '@/lib/auth-context'

export default function ReferralShareWidget() {
  const { t, locale } = useTranslation()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [referralData, setReferralData] = useState<{
    referralCode: string | null
    totalReferrals: number
    totalRewards: number
    rewardAmount: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [copyMsg, setCopyMsg] = useState('')

  // Drag state - use negative values to indicate offset from bottom
  const [position, setPosition] = useState<{ y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef({ y: 0, initialY: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Load saved position after mount to avoid hydration mismatch
  useEffect(() => {
    const saved = localStorage.getItem('referral-button-position')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (typeof parsed.y === 'number') {
          setPosition({ y: parsed.y })
        }
      } catch {
        setPosition({ y: 0 })
      }
    } else {
      setPosition({ y: 0 })
    }
  }, [])

  // Save position
  useEffect(() => {
    if (!isDragging && position) {
      localStorage.setItem('referral-button-position', JSON.stringify(position))
    }
  }, [position, isDragging])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartPos.current = {
      y: e.clientY,
      initialY: position?.y || 0,
    }
  }, [position?.y])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true)
    dragStartPos.current = {
      y: e.touches[0].clientY,
      initialY: position?.y || 0,
    }
  }, [position?.y])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const deltaY = e.clientY - dragStartPos.current.y
      const newY = dragStartPos.current.initialY + deltaY
      // Clamp to reasonable bounds (80px from top, 150px from bottom)
      const clampedY = Math.max(80, Math.min(window.innerHeight - 150, newY))
      setPosition({ y: clampedY })
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return
      const deltaY = e.touches[0].clientY - dragStartPos.current.y
      const newY = dragStartPos.current.initialY + deltaY
      const clampedY = Math.max(80, Math.min(window.innerHeight - 150, newY))
      setPosition({ y: clampedY })
    }

    const handleEnd = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false })
      document.addEventListener('mouseup', handleEnd)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleEnd)
    }
  }, [isDragging])

  // Fetch referral data when opened
  useEffect(() => {
    if (!isOpen || !user) return
    setLoading(true)
    fetch('/api/referral/stats', { credentials: 'include' })
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        console.log('Referral API response:', data)
        if (data.stats) {
          setReferralData(data.stats)
        } else {
          // API returned but no stats - user might not have referral code yet
          setReferralData({
            referralCode: null,
            totalReferrals: 0,
            totalRewards: 0,
            rewardAmount: 1000,
          })
        }
      })
      .catch((err) => {
        console.error('Failed to fetch referral stats:', err)
        // Set default data so UI doesn't stuck in loading
        setReferralData({
          referralCode: null,
          totalReferrals: 0,
          totalRewards: 0,
          rewardAmount: 1000,
        })
      })
      .finally(() => setLoading(false))
  }, [isOpen, user])

  // Close modal when clicking outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!user || position === null) return null

  // Calculate position - default is 100px from bottom
  const buttonStyle: React.CSSProperties = position.y > 0
    ? { top: `${position.y}px`, right: '24px' }
    : { bottom: '100px', right: '24px' }

  return (
    <>
      {/* Floating invite button - draggable */}
      <button
        ref={buttonRef}
        onClick={() => !isDragging && setIsOpen(true)}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          ...buttonStyle,
          position: 'fixed',
          zIndex: 50,
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        className={`w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-transform flex items-center justify-center ${isDragging ? 'scale-110' : 'hover:scale-105'}`}
        aria-label="Invite Friends"
        title={locale === 'zh' ? '邀请好友赚金币 (拖拽可移动)' : 'Invite friends to earn coins (drag to move)'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />

          {/* Card */}
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative pointer-events-auto max-h-[90vh] overflow-y-auto">
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">🎁</div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  {locale === 'zh' ? '邀请好友赚金币！' : 'Invite Friends & Earn Coins!'}
                </h2>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-400">{locale === 'zh' ? '加载中...' : 'Loading...'}</div>
              ) : !referralData?.referralCode ? (
                <div className="space-y-5">
                  {/* No referral code yet */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                      {locale === 'zh'
                        ? '你的邀请码正在生成中，请稍后再试'
                        : 'Your referral code is being generated. Please try again later.'}
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors"
                    >
                      {locale === 'zh' ? '刷新页面' : 'Refresh Page'}
                    </button>
                  </div>

                  {/* Still show reward info */}
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      {locale === 'zh'
                        ? `每邀请一位好友注册并验证邮箱，你即可获得 ${referralData?.rewardAmount || 1000} 金币！`
                        : `Earn ${referralData?.rewardAmount || 1000} coins for each friend who signs up and verifies their email!`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Reward info */}
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      {locale === 'zh'
                        ? `每邀请一位好友注册并验证邮箱，你即可获得 ${referralData.rewardAmount} 金币！`
                        : `Earn ${referralData.rewardAmount} coins for each friend who signs up and verifies their email!`}
                    </p>
                  </div>

                  {/* Referral Link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {locale === 'zh' ? '你的邀请链接' : 'Your referral link'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralData.referralCode}`}
                        className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/register?ref=${referralData.referralCode}`
                          navigator.clipboard.writeText(url).then(() => {
                            setCopyMsg(locale === 'zh' ? '已复制!' : 'Copied!')
                            setTimeout(() => setCopyMsg(''), 2000)
                          })
                        }}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium text-sm hover:bg-emerald-600 transition-colors"
                      >
                        {copyMsg || (locale === 'zh' ? '复制' : 'Copy')}
                      </button>
                    </div>
                  </div>

                  {/* Referral Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {locale === 'zh' ? '邀请码' : 'Referral Code'}
                    </label>
                    <div
                      onClick={() => {
                        navigator.clipboard.writeText(referralData.referralCode!).then(() => {
                          setCopyMsg(locale === 'zh' ? '已复制!' : 'Copied!')
                          setTimeout(() => setCopyMsg(''), 2000)
                        })
                      }}
                      className="inline-block bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-6 py-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <span className="text-2xl font-bold tracking-widest text-gray-800 dark:text-gray-200">{referralData.referralCode}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-3">({locale === 'zh' ? '点击复制' : 'tap to copy'})</span>
                    </div>
                  </div>

                  {/* Quick share buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        locale === 'zh'
                          ? `跟我一起学中文！使用邀请码 ${referralData.referralCode} 注册，我们一起赚金币 🎉\nhttps://pandahan.xyz/register?ref=${referralData.referralCode}`
                          : `Learn Chinese with me! Use code ${referralData.referralCode} to sign up and we both earn coins 🎉\nhttps://pandahan.xyz/register?ref=${referralData.referralCode}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-500 text-white rounded-xl p-3 text-center font-medium text-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <span>💬</span> WhatsApp
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        locale === 'zh'
                          ? `我正在用PandaHan学中文！用邀请码 ${referralData.referralCode} 注册，我们一起赚金币！🎉\nhttps://pandahan.xyz/register?ref=${referralData.referralCode}`
                          : `I'm learning Chinese with PandaHan! Use code ${referralData.referralCode} to sign up and we both earn coins! 🎉\nhttps://pandahan.xyz/register?ref=${referralData.referralCode}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-black text-white rounded-xl p-3 text-center font-medium text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <span>𝕏</span> Twitter
                    </a>
                  </div>

                  {/* Stats */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <div className="flex justify-around">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">{referralData.totalReferrals}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {locale === 'zh' ? '已邀请' : 'Referred'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{referralData.totalRewards}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {locale === 'zh' ? '已获得奖励' : 'Rewards'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {referralData.totalRewards * referralData.rewardAmount}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {locale === 'zh' ? '金币 earned' : 'Coins earned'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
