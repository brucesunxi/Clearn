'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function VerifyForm() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMsg('Missing verification token')
      return
    }
    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
        const data = await res.json()
        if (res.ok) {
          setStatus('success')
        } else {
          setStatus('error')
          setMsg(data.error || 'Verification failed')
        }
      } catch {
        setStatus('error')
        setMsg('Network error')
      }
    }
    verify()
  }, [searchParams])

  return (
    <div className="text-center max-w-sm">
      {status === 'verifying' && (
        <>
          <p className="text-5xl mb-4">⏳</p>
          <p className="text-gray-600 dark:text-gray-400">Verifying your email...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <p className="text-5xl mb-4">✅</p>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Email Verified!</h1>
          <p className="text-gray-500 mb-6">Your email has been successfully verified.</p>
          <button
            onClick={() => { window.location.href = '/' }}
            className="inline-block px-6 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600"
          >
            Go to Home
          </button>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="text-5xl mb-4">❌</p>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Verification Failed</h1>
          <p className="text-gray-500 mb-6">{msg || 'The link may be invalid or expired'}</p>
          <a href="/login" className="inline-block px-6 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600">
            Go to Login
          </a>
        </>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Suspense fallback={<p className="text-gray-500 dark:text-gray-400">Loading...</p>}>
        <VerifyForm />
      </Suspense>
    </div>
  )
}
