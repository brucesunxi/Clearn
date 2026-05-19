'use client'

import { useEffect, useRef } from 'react'

const ADSENSE_ID = 'ca-pub-9711589934416529'

// Ad unit IDs — replace with actual units from your AdSense panel
const AD_UNITS: Record<string, { slot: string; format: string }> = {
  banner: { slot: '', format: 'auto' },
  sidebar: { slot: '', format: 'rectangle' },
}

export function AdBanner() {
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current && (window as any).adsbygoogle) {
      try {
        ;(window as any).adsbygoogle.push({})
      } catch {}
    }
    initialized.current = true
  }, [])

  return (
    <div className="my-6 min-h-[100px] flex items-center justify-center">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_ID}
        data-ad-slot={AD_UNITS.banner.slot}
        data-ad-format={AD_UNITS.banner.format}
        data-full-width-responsive="true"
      />
    </div>
  )
}

export function AdSidebar() {
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current && (window as any).adsbygoogle) {
      try {
        ;(window as any).adsbygoogle.push({})
      } catch {}
    }
    initialized.current = true
  }, [])

  return (
    <div className="min-h-[250px] flex items-center justify-center">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_ID}
        data-ad-slot={AD_UNITS.sidebar.slot}
        data-ad-format={AD_UNITS.sidebar.format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
