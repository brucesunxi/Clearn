import type { Metadata } from 'next'
import VerifyEmailPageClient from '@/components/VerifyEmailPageClient'

export const metadata: Metadata = {
  title: '邮箱验证 Email Verification',
  description: '验证你的熊猫汉语账号邮箱地址。Verify your Panda Chinese account email address.',
  alternates: {
    canonical: 'https://pandahan.xyz/verify-email',
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: '邮箱验证 - 熊猫汉语',
    description: '验证你的熊猫汉语账号邮箱地址。',
  },
}

export default function VerifyEmailPage() {
  return <VerifyEmailPageClient />
}
