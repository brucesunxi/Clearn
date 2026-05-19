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
      max_tokens: 4096,
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
        `你是中文学习平台的文本清洗专家。请对以下从网页抓取的文本进行彻底清洗，提取纯正文内容。

规则：
1. 删除所有非正文内容：导航菜单、广告、版权声明、网站页眉页脚、分享按钮、标签云、评论区、相关阅读推荐、登录/注册提示、cookie提示、侧边栏内容、SEO关键词堆砌、作者简介等
2. 只保留文章正文，按语义合理分段，段落之间用空行隔开
3. 如果正文中包含引文或对话，保留在正文中
4. 保留所有中文内容完整，不要删减或改写句子
5. 返回清洗后的纯文本，只输出正文本身，不要添加任何额外的说明或标题`,
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
