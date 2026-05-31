'use client'

import { useEffect, useRef } from 'react'

const ADSENSE_ID = 'ca-pub-9711589934416529'

// Ad unit IDs — replace with actual units from your AdSense panel
const AD_UNITS: Record<string, { slot: string; format: string; style?: React.CSSProperties }> = {
  banner: { slot: '', format: 'auto' },
  sidebar: { slot: '', format: 'rectangle' },
  // High-performing ad units
  interstitial: { slot: '', format: 'auto', style: { minHeight: '250px' } },
  inFeed: { slot: '', format: 'fluid', style: { minHeight: '100px' } },
  matchedContent: { slot: '', format: 'autorelaxed', style: { minHeight: '300px' } },
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

// Interstitial ad - good for after game/battle results
export function AdInterstitial() {
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
    <div className="my-8 min-h-[250px] bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: '250px' }}
        data-ad-client={ADSENSE_ID}
        data-ad-slot={AD_UNITS.interstitial.slot}
        data-ad-format={AD_UNITS.interstitial.format}
        data-full-width-responsive="true"
      />
    </div>
  )
}

// In-feed ad - for article lists
export function AdInFeed() {
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
    <div className="my-4 min-h-[100px] bg-gray-50/50 rounded-lg flex items-center justify-center">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: '100px' }}
        data-ad-client={ADSENSE_ID}
        data-ad-slot={AD_UNITS.inFeed.slot}
        data-ad-format={AD_UNITS.inFeed.format}
        data-ad-layout-key="-gw-3+1f-3d+2z"
        data-full-width-responsive="true"
      />
    </div>
  )
}

// Sticky bottom ad for mobile
export function AdStickyBottom() {
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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden">
      <div className="h-[60px] flex items-center justify-center">
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '60px' }}
          data-ad-client={ADSENSE_ID}
          data-ad-slot=""
          data-ad-format="horizontal"
          data-full-width-responsive="false"
        />
      </div>
    </div>
  )
}
