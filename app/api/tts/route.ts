import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory cache to reduce redundant requests
const cache = new Map<string, { data: ArrayBuffer; timestamp: number }>()
const CACHE_TTL = 86400000 // 24 hours

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    if (!text || typeof text !== 'string' || text.length > 200) {
      return NextResponse.json({ error: 'Invalid text' }, { status: 400 })
    }

    // Check cache
    const cached = cache.get(text)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      const buf = cached.data
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': String(buf.byteLength),
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }

    // Use Google Translate TTS (free, no API key, good Chinese quality)
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=zh-CN&client=tw-ob`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://translate.google.com/',
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'TTS unavailable' }, { status: 502 })
    }

    const audio = await res.arrayBuffer()

    // Store in cache
    cache.set(text, { data: audio, timestamp: Date.now() })

    return new NextResponse(audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audio.byteLength),
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (e) {
    console.error('TTS API error:', e)
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
  }
}

// Clean stale cache entries periodically
setInterval(() => {
  const now = Date.now()
  cache.forEach((val, key) => {
    if (now - val.timestamp > CACHE_TTL) cache.delete(key)
  })
}, 3600000)
