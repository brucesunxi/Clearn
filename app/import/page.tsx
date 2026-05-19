import type { Metadata } from 'next'
import { getLevels, getAllArticles } from '@/lib/content'
import ImportPageClient from '@/components/ImportPageClient'

export const metadata: Metadata = {
  title: '导入内容 Import Content',
  description: '粘贴中文文本或上传 .txt 文件，自动分析生成学习素材。Import Chinese text to create learning materials.',
  openGraph: {
    title: '导入内容 - 熊猫汉语',
    description: '上传中文内容，自动生成学习素材，应用到阅读、听力、口语等所有教学模块。',
  },
}

export default function ImportPage() {
  const levels = getLevels()
  const articles = getAllArticles()
  return <ImportPageClient levels={levels} articles={articles} />
}
