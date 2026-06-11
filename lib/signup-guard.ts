'use client'

const SIGNUP_SHOWN_KEY = 'signup_modal_shown'

export function hasSignupModalBeenShown(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(SIGNUP_SHOWN_KEY) === '1'
}

export function markSignupModalShown(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SIGNUP_SHOWN_KEY, '1')
}

export function clearSignupGuard(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SIGNUP_SHOWN_KEY)
}
