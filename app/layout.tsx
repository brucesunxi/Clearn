import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import FeedbackWidget from '@/components/FeedbackWidget'
import { I18nProvider } from '@/lib/i18n/context'
import TranslationUpdater from '@/components/TranslationUpdater'
import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from '@/lib/theme-context'
import { WebsiteJsonLd, EducationalOrganizationJsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: {
    template: '%s | Panda Chinese 熊猫汉语',
    default: 'Panda Chinese 熊猫汉语 - Learn Chinese Through Reading 分级阅读学中文',
  },
  description:
    'A leveled Chinese reading platform for overseas children. Learn Chinese through fun reading, vocabulary drills, and listening practice. 为海外华裔儿童打造的中文分级阅读平台，让学习中文变得有趣又简单。',
  keywords: [
    'Chinese learning', 'learn Chinese', 'Chinese for kids', 'overseas Chinese', 'leveled reading',
    '中文学习', '学中文', '海外华裔', '儿童中文', '分级阅读', '汉语学习', '华裔儿童',
    'HSK', 'Chinese reading', 'mandarin learning', 'learn mandarin'
  ],
  metadataBase: new URL('https://pandahan.xyz'),
  authors: [{ name: 'Panda Chinese 熊猫汉语', url: 'https://pandahan.xyz' }],
  creator: 'Panda Chinese 熊猫汉语',
  publisher: 'Panda Chinese 熊猫汉语',
  applicationName: 'Panda Chinese 熊猫汉语',
  generator: 'Next.js',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Panda Chinese 熊猫汉语 - Learn Chinese Through Reading 分级阅读学中文',
    description: 'A leveled Chinese reading platform for overseas children. Learn Chinese through fun reading! 为海外华裔儿童打造的中文分级阅读平台。',
    url: 'https://pandahan.xyz',
    siteName: 'Panda Chinese 熊猫汉语',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://pandahan.xyz/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Panda Chinese 熊猫汉语 - Learn Chinese Through Reading 分级阅读学中文',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Panda Chinese 熊猫汉语 - Learn Chinese Through Reading',
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
          <FeedbackWidget />
          <footer className="bg-white border-t mt-16 py-8 text-center text-sm text-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500 transition-colors" id="site-footer">
            🐼 熊猫汉语
          </footer>
        </AuthProvider>
        </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
