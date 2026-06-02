import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import FeedbackWidget from '@/components/FeedbackWidget'
import { I18nProvider } from '@/lib/i18n/context'
import TranslationUpdater from '@/components/TranslationUpdater'
import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from '@/lib/theme-context'

export const metadata: Metadata = {
  title: {
    template: '%s | 熊猫汉语 Panda Chinese',
    default: '熊猫汉语 - 海外华裔儿童中文学习',
  },
  description:
    '为海外华裔儿童打造的中文分级阅读平台，让学习中文变得有趣又简单。A leveled Chinese reading platform for overseas children.',
  metadataBase: new URL('https://pandahan.xyz'),
  // Note: alternates.canonical intentionally NOT set here
  // to avoid inheriting the homepage canonical to all child routes.
  // Each page should define its own canonical or rely on URL-based canonical.
  icons: {
    icon: '/favicon.svg',
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
