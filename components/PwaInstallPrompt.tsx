'use client'

import { useEffect, useState, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY = 'pwa-install-dismissed'

export default function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && Date.now() - Number(stored) < 7 * 24 * 60 * 60 * 1000) {
      return
    }
    setDismissed(false)

    const standalone = window.matchMedia('(display-mode: standalone)').matches
    const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsStandalone(standalone || iosStandalone)

    if (standalone || iosStandalone) return

    const iOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
    setIsIOS(iOS)

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    if (iOS && !isStandalone) {
      setShowIOSGuide(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [isStandalone])

  useEffect(() => {
    const handler = () => {
      setDismissed(false)
      const iOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
      if (iOS) {
        setShowIOSGuide(true)
      } else if (installPrompt) {
        setShowPrompt(true)
      }
    }
    window.addEventListener('show-pwa-install', handler)
    return () => window.removeEventListener('show-pwa-install', handler)
  }, [installPrompt])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const result = await installPrompt.userChoice
    if (result.outcome === 'accepted') {
      setShowPrompt(false)
    }
    setInstallPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setShowIOSGuide(false)
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
    setDismissed(true)
  }

  if (dismissed || isStandalone) return null

  return (
    <>
      {showPrompt && installPrompt && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg animate-slide-up">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-lg flex-shrink-0">
                🐼
              </div>
              <div>
                <p className="font-semibold text-sm dark:text-white">安装PandaHan App</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">随时随地方便学习</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                稍后
              </button>
              <button
                onClick={handleInstall}
                className="px-4 py-1.5 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
              >
                安装
              </button>
            </div>
          </div>
        </div>
      )}

      {showIOSGuide && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-lg flex-shrink-0 mt-0.5">
                  📱
                </div>
                <div>
                  <p className="font-semibold text-sm dark:text-white">将PandaHan添加到主屏幕</p>
                  <p className="text-[11px] text-amber-500 mt-1 mb-1.5">请在 Safari 浏览器中操作（Chrome 不支持安装到主屏幕）</p>
                  <ol className="text-xs text-gray-500 dark:text-gray-400 space-y-1 list-decimal list-inside">
                    <li>点击 Safari 地址栏的分享按钮 <span className="inline-block px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">⎙</span>（在地址栏左侧或底部）</li>
                    <li>向下滑动并选择 <strong>添加到主屏幕</strong></li>
                    <li>点击右上角 <strong>添加</strong> 完成安装</li>
                  </ol>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none flex-shrink-0"
                aria-label="关闭"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
