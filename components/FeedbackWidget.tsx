'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n/context'

export default function FeedbackWidget() {
  const { t, locale } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Drag state
  const [position, setPosition] = useState({ y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef({ y: 0, initialY: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Load saved position from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('feedback-button-position')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (typeof parsed.y === 'number') {
          setPosition({ y: parsed.y })
        }
      } catch {}
    }
  }, [])

  // Save position when changed
  useEffect(() => {
    if (!isDragging) {
      localStorage.setItem('feedback-button-position', JSON.stringify(position))
    }
  }, [position, isDragging])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    dragStartPos.current = {
      y: e.clientY,
      initialY: position.y,
    }
  }, [position.y])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true)
    dragStartPos.current = {
      y: e.touches[0].clientY,
      initialY: position.y,
    }
  }, [position.y])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const deltaY = e.clientY - dragStartPos.current.y
      const newY = dragStartPos.current.initialY + deltaY
      // Constrain to viewport bounds (keep some padding)
      const maxY = window.innerHeight - 100
      const minY = 80
      setPosition({ y: Math.max(minY, Math.min(maxY, newY)) })
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return
      const deltaY = e.touches[0].clientY - dragStartPos.current.y
      const newY = dragStartPos.current.initialY + deltaY
      const maxY = window.innerHeight - 100
      const minY = 80
      setPosition({ y: Math.max(minY, Math.min(maxY, newY)) })
    }

    const handleEnd = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleEnd)
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleEnd)
    }
  }, [isDragging])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      textareaRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!message.trim()) return
    setSubmitting(true)
    setStatus('idle')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), contact: contact.trim() }),
      })
      if (res.ok) {
        setStatus('success')
        setMessage('')
        setContact('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setStatus('idle')
    setMessage('')
    setContact('')
  }

  return (
    <>
      {/* Floating button - draggable */}
      <button
        ref={buttonRef}
        onClick={() => !isDragging && setIsOpen(true)}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          position: 'fixed',
          right: '24px',
          bottom: position.y > 0 ? undefined : '24px',
          top: position.y > 0 ? `${position.y}px` : undefined,
          zIndex: 50,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        className={`w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center ${isDragging ? 'scale-110' : ''}`}
        aria-label="Feedback"
        title={locale === 'zh' ? '拖拽可移动位置' : 'Drag to move'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97-1.94.284-3.916.455-5.922.505a.39.39 0 00-.266.112L8.25 21.25V17.5a.75.75 0 00-.75-.75h-1.5a3.75 3.75 0 01-3.75-3.75V6.24c0-1.946 1.37-3.678 3.348-3.97z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

          {/* Card */}
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative pointer-events-auto"
              role="dialog"
              aria-modal="true"
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>

              {/* Title */}
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                💬 {t('feedback.title')}
              </h2>

              {status === 'success' ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">✅</p>
                  <p className="text-green-600 font-medium">{t('feedback.success')}</p>
                  <button
                    onClick={handleClose}
                    className="mt-4 px-5 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-medium transition-colors"
                  >
                    {t('feedback.close')}
                  </button>
                </div>
              ) : (
                <>
                  {/* Message */}
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('feedback.message')} <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('feedback.messagePlaceholder')}
                    maxLength={2000}
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/2000</p>

                  {/* Contact */}
                  <label className="block text-sm font-medium text-gray-700 mt-3 mb-1">
                    {t('feedback.contact')}
                  </label>
                  <input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={t('feedback.contactPlaceholder')}
                    maxLength={200}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />

                  {/* Error */}
                  {status === 'error' && (
                    <p className="mt-3 text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                      {t('feedback.error')}
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={!message.trim() || submitting}
                    className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500 transition-all shadow-sm"
                  >
                    {submitting ? t('feedback.submitting') : t('feedback.submit')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
