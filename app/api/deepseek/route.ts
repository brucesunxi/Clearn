import { NextRequest, NextResponse } from 'next/server'

const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions'

async function callDeepSeek(system: string, user: string): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY
  if (!key) {
    throw new Error('DeepSeek API key not configured')
  }

  const res = await fetch(DEEPSEEK_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek API error (${res.status}): ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

export async function POST(request: NextRequest) {
  try {
    const { action, text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid text' }, { status: 400 })
    }

    if (action === 'clean') {
      const cleaned = await callDeepSeek(
        `你是中文学习平台的编辑助手。请对以下文本进行清洗：
1. 删除非正文内容（导航、广告、版权声明、无关链接等）
2. 修复段落分割，按语义合理分段
3. 保留所有中文内容完整
4. 返回清洗后的纯文本，只输出文本本身，不要添加任何解释`,
        text
      )
      return NextResponse.json({ cleaned })
    }

    if (action === 'title') {
      const result = await callDeepSeek(
        `你是中文学习平台的编辑助手。根据以下中文文本，生成文章标题。

要求：
- 中文标题：简短（2-8个字），有吸引力，概括文章主题
- 英文标题：准确翻译中文标题

只输出以下JSON格式，不要添加其他内容：
{"title":"中文标题","titleEn":"English Title"}`,
        text
      )

      // Try to parse JSON from response
      const jsonMatch = result.match(/\{[\s\S]*"title"[\s\S]*"titleEn"[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return NextResponse.json({
          title: parsed.title || '',
          titleEn: parsed.titleEn || '',
        })
      }

      return NextResponse.json({ title: '', titleEn: '' })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('DeepSeek API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'DeepSeek API error' },
      { status: 500 }
    )
  }
}
