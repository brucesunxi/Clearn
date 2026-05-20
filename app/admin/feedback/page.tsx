import type { Metadata } from 'next'
import AdminFeedbackClient from '@/components/AdminFeedbackClient'

export const metadata: Metadata = {
  title: 'Feedback Admin - 熊猫汉语',
  description: 'User feedback management',
  robots: { index: false, follow: false },
}

export default function AdminFeedbackPage() {
  return <AdminFeedbackClient />
}
