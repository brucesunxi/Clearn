import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import FeedbackWidget from '@/components/FeedbackWidget'
import { I18nProvider } from '@/lib/i18n/context'
import TranslationUpdater from '@/components/TranslationUpdater'

export const metadata: Metadata = {
  title: {
    template: '%s | 熊猫汉语 Panda Chinese',
    default: '熊猫汉语 - 海外华裔儿童中文学习',
  },
  description:
    '为海外华裔儿童打造的中文分级阅读平台，让学习中文变得有趣又简单。A leveled Chinese reading platform for overseas children.',
  metadataBase: new URL('https://pandahan.xyz'),
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="16" cy="18" r="10" fill="%232D2D2D"/><circle cx="48" cy="18" r="10" fill="%232D2D2D"/><circle cx="32" cy="32" r="24" fill="white" stroke="%232D2D2D" stroke-width="1.5"/><ellipse cx="21" cy="28" rx="8" ry="7" fill="%232D2D2D"/><ellipse cx="43" cy="28" rx="8" ry="7" fill="%232D2D2D"/><circle cx="21" cy="27" r="3.5" fill="white"/><circle cx="43" cy="27" r="3.5" fill="white"/><circle cx="21" cy="27" r="2" fill="%232D2D2D"/><circle cx="43" cy="27" r="2" fill="%232D2D2D"/><ellipse cx="32" cy="36" rx="3" ry="2" fill="%232D2D2D"/><path d="M29 39 C29 43,35 43,35 39" stroke="%232D2D2D" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
  openGraph: {
    title: '熊猫汉语 - 海外华裔儿童中文学习',
    description: '为海外华裔儿童打造的中文分级阅读平台，让学习中文变得有趣又简单。',
    url: 'https://pandahan.xyz',
    siteName: '熊猫汉语',
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '熊猫汉语 - 海外华裔儿童中文学习',
    description: '为海外华裔儿童打造的中文分级阅读平台，让学习中文变得有趣又简单。',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9711589934416529" crossOrigin="anonymous" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-9K8RD1K13S" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-9K8RD1K13S');`,
          }}
        />
      </head>
      <body>
        <I18nProvider>
          <TranslationUpdater />
          <Header />
          <main className="min-h-screen">{children}</main>
          <FeedbackWidget />
          <footer className="bg-white border-t mt-16 py-8 text-center text-sm text-gray-400" id="site-footer">
            🐼 熊猫汉语
          </footer>
        </I18nProvider>
      </body>
    </html>
  )
}
