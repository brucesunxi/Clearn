import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    if (!text || text.length > 200) {
      return NextResponse.json({ error: 'Invalid text' }, { status: 400 })
    }

    // Google Translate TTS - free, decent Chinese quality
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=zh-CN&client=tw-ob`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://translate.google.com/',
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'TTS unavailable' }, { status: 502 })
    }

    const audio = await res.arrayBuffer()

    return new NextResponse(audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=604800',
      },
    })
  } catch {
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
  }
}
