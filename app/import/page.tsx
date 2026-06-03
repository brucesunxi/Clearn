import type { Metadata } from 'next'
import { AdBanner } from '@/lib/adsense'
import { getLevels, getAllArticles } from '@/lib/content'
import ImportPageClient from '@/components/ImportPageClient'

export const metadata: Metadata = {
  title: 'Import Content 导入内容 - Create Custom Lessons',
  description: 'Import Chinese text or upload .txt files to automatically generate learning materials. Create custom reading, listening, and speaking lessons! 粘贴中文文本或上传 .txt 文件，自动分析生成学习素材。',
  alternates: {
    canonical: 'https://pandahan.xyz/import',
    languages: {
      'en-US': 'https://pandahan.xyz/import',
      'zh-CN': 'https://pandahan.xyz/import',
    },
  },
  keywords: ['import content', 'custom lessons', 'Chinese text', '导入内容', '自定义课程'],
  openGraph: {
    title: 'Import Content 导入内容 - Panda Chinese',
    description: 'Import Chinese text to create learning materials. 上传中文内容，自动生成学习素材。',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
  },
}

export default function ImportPage() {
  const levels = getLevels()
  const articles = getAllArticles()
  return <><ImportPageClient levels={levels} articles={articles} /><AdBanner /></>
}
