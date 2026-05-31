const RESEND_API_KEY = process.env.RESEND_API_KEY
const MAILTRAP_API_KEY = process.env.MAILTRAP_API_KEY
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@pandahan.xyz'

/**
 * 发送验证邮件
 * 优先使用 Resend，失败时回退到 Mailtrap
 */
export async function sendVerificationEmail(to: string, token: string): Promise<boolean> {
  const link = `https://pandahan.xyz/verify-email?token=${encodeURIComponent(token)}`

  // 优先尝试 Resend
  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `熊猫汉语 <${FROM_EMAIL}>`,
          to: [to],
          subject: '验证您的邮箱 - 熊猫汉语',
          html: generateEmailHtml(link),
        }),
      })

      if (res.ok) {
        console.log('Verification email sent via Resend to:', to)
        return true
      }
      const body = await res.text()
      console.error('Resend API error:', res.status, body)
    } catch (e) {
      console.error('Resend failed:', e)
    }
  }

  // 回退到 Mailtrap (沙盒模式，仅用于测试)
  if (MAILTRAP_API_KEY) {
    try {
      const res = await fetch('https://send.api.mailtrap.io/api/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MAILTRAP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: { email: FROM_EMAIL, name: '熊猫汉语' },
          to: [{ email: to }],
          subject: '验证您的邮箱 - 熊猫汉语',
          html: generateEmailHtml(link),
        }),
      })

      if (res.ok) {
        console.log('Verification email sent via Mailtrap to:', to)
        return true
      }
      const body = await res.text()
      console.error('Mailtrap API error:', res.status, body)
    } catch (e) {
      console.error('Mailtrap failed:', e)
    }
  }

  console.warn('No email service configured or both failed')
  return false
}

function generateEmailHtml(link: string): string {
  return `
    <div style="max-width:480px;margin:40px auto;font-family:Arial,sans-serif;text-align:center">
      <h1 style="color:#333;font-size:24px">🐼 熊猫汉语</h1>
      <p style="color:#666;font-size:15px;line-height:1.5">感谢您的注册！请点击下方按钮验证您的邮箱：</p>
      <a href="${link}"
         style="display:inline-block;padding:14px 40px;margin:28px 0;
                background-color:#3B82F6;color:#ffffff;
                text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold">
        验证邮箱
      </a>
      <p style="color:#999;font-size:13px">或复制以下链接到浏览器：<br>${link}</p>
      <p style="color:#999;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:20px">此链接24小时内有效。如果您没有注册熊猫汉语，请忽略此邮件。</p>
    </div>
  `
}
