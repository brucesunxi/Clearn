const MAILTRAP_API_KEY = process.env.MAILTRAP_API_KEY
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@pandahan.xyz'

export async function sendVerificationEmail(to: string, token: string): Promise<boolean> {
  if (!MAILTRAP_API_KEY) {
    console.error('[Mail] MAILTRAP_API_KEY not set')
    return false
  }

  const link = `https://pandahan.xyz/verify-email?token=${encodeURIComponent(token)}`

  // Mailtrap Sending API - 发送真实邮件
  const payload = {
    from: { email: FROM_EMAIL, name: 'PandaHan' },
    to: [{ email: to }],
    subject: '验证您的邮箱 - PandaHan',
    html: `
      <div style="max-width:480px;margin:40px auto;font-family:Arial,sans-serif;text-align:center">
        <h1 style="color:#333;font-size:24px">🐼 PandaHan</h1>
        <p style="color:#666;font-size:15px;line-height:1.5">感谢您的注册！请点击下方按钮验证您的邮箱：</p>
        <a href="${link}"
           style="display:inline-block;padding:14px 40px;margin:28px 0;
                  background-color:#3B82F6;color:#ffffff;
                  text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold">
          验证邮箱
        </a>
        <p style="color:#999;font-size:13px">或复制以下链接到浏览器：<br>${link}</p>
        <p style="color:#999;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:20px">此链接24小时内有效。如果您没有注册PandaHan，请忽略此邮件。</p>
      </div>
    `,
  }

  console.log('[Mail] Sending to:', to)
  console.log('[Mail] From:', FROM_EMAIL)

  try {
    // 使用 Mailtrap Sending API 发送真实邮件
    const res = await fetch('https://send.api.mailtrap.io/api/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAILTRAP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('[Mail] API error:', res.status, body)
      try {
        const err = JSON.parse(body)
        console.error('[Mail] Error details:', err)
      } catch { /* ignore */ }
      return false
    }

    const responseBody = await res.json()
    console.log('[Mail] Success:', responseBody)
    return true
  } catch (e) {
    console.error('[Mail] Exception:', e)
    return false
  }
}
