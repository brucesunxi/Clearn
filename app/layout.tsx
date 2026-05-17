import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import { I18nProvider } from '@/lib/i18n/context'
import { GAScript } from '@/lib/ga'
import TranslationUpdater from '@/components/TranslationUpdater'

export const metadata: Metadata = {
  title: '熊猫汉语 - 海外华裔儿童中文学习',
  description:
    '为海外华裔儿童打造的中文分级阅读平台，让学习中文变得有趣又简单。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <GAScript />
      </head>
      <body>
        <I18nProvider>
          <TranslationUpdater />
          <Header />
          <main className="min-h-screen">{children}</main>
          <footer className="bg-white border-t mt-16 py-8 text-center text-sm text-gray-400" id="site-footer">
            🐼 熊猫汉语
          </footer>
        </I18nProvider>
      </body>
    </html>
  )
}
