'use client'

const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID || ''

export function AdBanner() {
  return (
    <div className="my-6 min-h-[100px] bg-gradient-to-r from-gray-50 to-orange-50 rounded-xl flex items-center justify-center text-sm text-gray-300 border border-dashed border-orange-200">
      {ADSENSE_ID ? (
        <span>Google AdSense</span>
      ) : (
        <span className="text-gray-300 flex items-center gap-2">
          <span className="text-lg">📢</span> 广告位
        </span>
      )}
    </div>
  )
}

export function AdSidebar() {
  return (
    <div className="min-h-[250px] bg-gradient-to-b from-gray-50 to-orange-50 rounded-xl flex items-center justify-center text-sm text-gray-300 border border-dashed border-orange-200">
      {ADSENSE_ID ? (
        <span>Google AdSense</span>
      ) : (
        <span className="text-gray-300 flex items-center gap-2">
          <span className="text-lg">📢</span> 广告位
        </span>
      )}
    </div>
  )
}
