import type { Metadata } from 'next'
import AdminFeedbackClient from '@/components/AdminFeedbackClient'

export const metadata: Metadata = {
  title: 'Admin - 熊猫汉语',
  description: 'User feedback and activity management',
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return <AdminFeedbackClient />
}
