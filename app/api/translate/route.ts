import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: '无效的文本 / Invalid text' }, { status: 400 })
    }

    // Split into chunks at sentence boundaries (max 400 chars each)
    const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text]
    const chunks: string[] = []
    let current = ''
    for (const s of sentences) {
      if ((current + s).length > 400) {
        if (current) chunks.push(current.trim())
        current = s
      } else {
        current += s
      }
    }
    if (current.trim()) chunks.push(current.trim())

    const translatedParts: string[] = []
    for (const chunk of chunks) {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|zh-CN`
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)

      const data = await res.json()
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        translatedParts.push(data.responseData.translatedText)
      } else {
        translatedParts.push('')
      }
    }

    const translated = translatedParts.join('').trim()
    if (!translated) {
      return NextResponse.json({ error: '翻译失败，请稍后重试 / Translation failed, please try again later' }, { status: 502 })
    }

    return NextResponse.json({ translated, original: text })
  } catch {
    return NextResponse.json({ error: '翻译服务暂时不可用 / Translation service unavailable' }, { status: 500 })
  }
}
