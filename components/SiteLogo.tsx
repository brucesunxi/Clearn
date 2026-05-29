'use client'

import { useTranslation } from '@/lib/i18n/context'

export default function SiteLogo() {
  const { locale } = useTranslation()

  return (
    <span className="inline-flex items-center gap-1.5">
      {/* Panda SVG */}
      <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Ears */}
        <circle cx="16" cy="18" r="10" fill="#2D2D2D" />
        <circle cx="48" cy="18" r="10" fill="#2D2D2D" />
        {/* Head */}
        <circle cx="32" cy="32" r="24" fill="white" stroke="#2D2D2D" strokeWidth="1.5" />
        {/* Eye patches */}
        <ellipse cx="21" cy="28" rx="8" ry="7" fill="#2D2D2D" />
        <ellipse cx="43" cy="28" rx="8" ry="7" fill="#2D2D2D" />
        {/* Eyes */}
        <circle cx="21" cy="27" r="3.5" fill="white" />
        <circle cx="43" cy="27" r="3.5" fill="white" />
        <circle cx="21" cy="27" r="2" fill="#2D2D2D" />
        <circle cx="43" cy="27" r="2" fill="#2D2D2D" />
        {/* Nose */}
        <ellipse cx="32" cy="36" rx="3" ry="2" fill="#2D2D2D" />
        {/* Mouth */}
        <path d="M29 39 C29 43, 35 43, 35 39" stroke="#2D2D2D" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        {/* Blush */}
        <circle cx="13" cy="38" r="3" fill="#FFB5B5" opacity="0.6" />
        <circle cx="51" cy="38" r="3" fill="#FFB5B5" opacity="0.6" />
      </svg>
      <span className="text-xl font-bold text-gray-800" suppressHydrationWarning>
        {locale === 'zh' ? '熊猫汉语' : 'Panda Chinese'}
      </span>
    </span>
  )
}
