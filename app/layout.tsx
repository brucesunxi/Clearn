import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Link from 'next/link'
import FeedbackWidget from '@/components/FeedbackWidget'
import ReferralShareWidget from '@/components/ReferralShareWidget'
import { I18nProvider } from '@/lib/i18n/context'
import TranslationUpdater from '@/components/TranslationUpdater'
import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from '@/lib/theme-context'
import { WebsiteJsonLd, EducationalOrganizationJsonLd } from '@/components/JsonLd'
import PwaInstallPrompt from '@/components/PwaInstallPrompt'

export const metadata: Metadata = {
  title: {
    template: '%s | PandaHan',
    default: 'PandaHan - Learn Chinese Through Reading 分级阅读学中文',
  },
  description:
    'A leveled Chinese reading platform for overseas children. Learn Chinese through fun reading, vocabulary drills, and listening practice. 为海外华裔儿童打造的中文分级阅读平台，让学习中文变得有趣又简单。',
  keywords: [
    'Chinese learning', 'learn Chinese', 'Chinese for kids', 'overseas Chinese', 'leveled reading',
    '中文学习', '学中文', '海外华裔', '儿童中文', '分级阅读', '汉语学习', '华裔儿童',
    'HSK', 'Chinese reading', 'mandarin learning', 'learn mandarin'
  ],
  metadataBase: new URL('https://pandahan.xyz'),
  authors: [{ name: 'PandaHan', url: 'https://pandahan.xyz' }],
  creator: 'PandaHan',
  publisher: 'PandaHan',
  applicationName: 'PandaHan',
  generator: 'Next.js',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
    other: [
      { rel: 'apple-touch-icon', url: '/icon-192x192.png', sizes: '192x192' },
      { rel: 'apple-touch-icon', url: '/icon-512x512.png', sizes: '512x512' },
    ],
  },
  appleWebApp: {
    title: 'PandaHan',
    statusBarStyle: 'default',
    capable: true,
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'PandaHan - Learn Chinese Through Reading 分级阅读学中文',
    description: 'A leveled Chinese reading platform for overseas children. Learn Chinese through fun reading! 为海外华裔儿童打造的中文分级阅读平台。',
    url: 'https://pandahan.xyz',
    siteName: 'PandaHan',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://pandahan.xyz/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PandaHan - Learn Chinese Through Reading 分级阅读学中文',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PandaHan - Learn Chinese Through Reading',
    description: 'A leveled Chinese reading platform for overseas children. 为海外华裔儿童打造的中文分级阅读平台。',
    images: ['https://pandahan.xyz/images/og-image.png'],
    creator: '@pandahanxyz',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE',
  },
  category: 'education',
  alternates: {
    canonical: 'https://pandahan.xyz',
    languages: {
      'en-US': 'https://pandahan.xyz',
      'zh-CN': 'https://pandahan.xyz',
      'x-default': 'https://pandahan.xyz',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="google-adsense-account" content="ca-pub-9711589934416529" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="PandaHan" />
        <link rel="apple-touch-startup-image" href="/icon-512x512.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(reg) {
      console.log('SW registered:', reg.scope);
    }, function(err) {
      console.log('SW registration failed:', err);
    });
  });
}`,
          }}
        />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9711589934416529" crossOrigin="anonymous" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-9K8RD1K13S" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-9K8RD1K13S');

// 检测网络，Google 服务可达才加载 Ads
fetch('https://www.googletagmanager.com/gtag/js?id=AW-18197467032', {method:'HEAD',mode:'no-cors'})
  .then(function(){
    var s=document.createElement('script');
    s.async=true;
    s.src='https://www.googletagmanager.com/gtag/js?id=AW-18197467032';
    document.head.appendChild(s);
    setTimeout(function(){
      gtag('config','AW-18197467032');
      gtag('event','conversion',{'send_to':'AW-18197467032/yQDSCKTF_rYcEJifneVD','value':1.0,'currency':'USD'});
    },1000);
  })
  .catch(function(){});`,
          }}
        />
      </head>
      <body className="bg-[#FFFBF5] dark:bg-gray-900 dark:text-gray-100 transition-colors">
        <WebsiteJsonLd />
        <EducationalOrganizationJsonLd />
        <I18nProvider>
          <ThemeProvider>
          <AuthProvider>
          <TranslationUpdater />
          <Header />
          <main className="min-h-screen">{children}</main>
          <PwaInstallPrompt />
          <FeedbackWidget />
          <ReferralShareWidget />
          <footer className="bg-white border-t mt-16 py-8 dark:bg-gray-800 dark:border-gray-700 transition-colors" id="site-footer">
            <div className="max-w-5xl mx-auto px-4">
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-4">
                <Link href="/about" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  About 关于
                </Link>
                <Link href="/contact" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  Contact 联系
                </Link>
                <Link href="/privacy" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  Privacy 隐私
                </Link>
                <Link href="/terms" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  Terms 条款
                </Link>
              </div>
              <p className="text-center text-sm text-gray-400 dark:text-gray-500">
                🐼 PandaHan
              </p>
            </div>
          </footer>
        </AuthProvider>
        </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
