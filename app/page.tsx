import type { Metadata } from 'next'
import { getAllArticles } from '@/lib/content'
import HomePageClient from '@/components/HomePageClient'
import { WebPageJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'Home 首页',
  description: 'PandaHan - A leveled Chinese reading platform for overseas children. Learn Chinese through fun reading, vocabulary drills, and listening practice. PandaHan - 为海外华裔儿童打造的中文分级阅读平台，让学习中文变得有趣又简单。',
  alternates: {
    canonical: 'https://pandahan.xyz/',
    languages: {
      'en-US': 'https://pandahan.xyz/',
      'zh-CN': 'https://pandahan.xyz/',
    },
  },
  openGraph: {
    title: 'PandaHan - Learn Chinese Through Reading 分级阅读学中文',
    description: 'A leveled Chinese reading platform for overseas children. 为海外华裔儿童打造的中文分级阅读平台，让学习中文变得有趣又简单。',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
  },
}

export default function HomePage() {
  const allArticles = getAllArticles()
  return (
    <>
      <WebPageJsonLd
        title="PandaHan - Learn Chinese Through Reading"
        description="A leveled Chinese reading platform for overseas children. Learn Chinese through fun reading!"
        url="https://pandahan.xyz/"
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://pandahan.xyz/' },
        ]}
      />
      <HomePageClient totalArticles={allArticles.length} />
    </>
  )
}
