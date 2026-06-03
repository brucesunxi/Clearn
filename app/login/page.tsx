import type { Metadata } from 'next'
import LoginPageClient from '@/components/LoginPageClient'

export const metadata: Metadata = {
  title: 'Sign In 登录 - Panda Chinese Account',
  description: 'Sign in to your Panda Chinese account to continue your Chinese learning journey. 登录熊猫汉语账号，继续你的中文学习之旅。',
  alternates: {
    canonical: 'https://pandahan.xyz/login',
    languages: {
      'en-US': 'https://pandahan.xyz/login',
      'zh-CN': 'https://pandahan.xyz/login',
    },
  },
  keywords: ['sign in', 'login', 'account', '登录', '账号'],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Sign In 登录 - Panda Chinese',
    description: 'Sign in to continue learning. 登录账号继续学习。',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
  },
}

export default function LoginPage() {
  return <LoginPageClient />
}
