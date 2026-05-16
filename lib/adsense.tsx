'use client'

const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID || ''

export function AdBanner() {
  if (!ADSENSE_ID) return null

  return (
    <div className="my-6 min-h-[90px] bg-gray-50 rounded-xl flex items-center justify-center text-sm text-gray-300 border border-dashed border-gray-200">
      <span>广告位</span>
    </div>
  )
}

export function AdSidebar() {
  if (!ADSENSE_ID) return null

  return (
    <div className="min-h-[250px] bg-gray-50 rounded-xl flex items-center justify-center text-sm text-gray-300 border border-dashed border-gray-200">
      <span>广告位</span>
    </div>
  )
}
