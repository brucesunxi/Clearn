'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import type { Article, Level } from '@/lib/types'
import { getCustomArticles } from '@/lib/custom-articles'

interface ArticleSelectClientProps {
  articles: Article[]
  levels: Level[]
}

export default function ArticleSelectClient({ articles: baseArticles, levels }: ArticleSelectClientProps) {
  const router = useRouter()
  const { locale } = useTranslation()
  const [articles, setArticles] = useState(baseArticles)

  useEffect(() => {
    const custom = getCustomArticles()
    if (custom.length > 0) {
      setArticles([...baseArticles, ...custom])
    }
  }, [baseArticles])

  // Group articles by level
  const grouped = useMemo(() => {
    const map: Record<number, Article[]> = {}
    for (const a of articles) {
      const lvl = a.level || 1
      if (!map[lvl]) map[lvl] = []
      map[lvl].push(a)
    }
    // Sort levels
    const sorted: [number, Article[]][] = Object.entries(map)
      .map(([k, v]) => [Number(k), v] as [number, Article[]])
      .sort(([a], [b]) => a - b)
    return sorted
  }, [articles])

  const handleSelect = (article: Article) => {
    router.push(`/ai-battle?articleId=${article.id}`)
  }

  if (articles.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-400">{locale === 'zh' ? '暂无文章' : 'No articles available'}</p>
        <button onClick={() => router.push('/import')} className="text-blue-500 mt-2 text-sm">
          {locale === 'zh' ? '去导入 →' : 'Go import →'}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => router.push('/ai-battle')}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4 inline-block"
      >
        ← {locale === 'zh' ? '返回对战' : 'Back to Battle'}
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        📖 {locale === 'zh' ? '选择文章' : 'Select Article'}
      </h1>
      <p className="text-sm text-gray-400 mb-6">
        {locale === 'zh'
          ? '选择一篇文章，用它的词汇和 AI 对战'
          : 'Pick an article and battle AI with its vocabulary'}
      </p>

      {grouped.map(([levelId, levelArticles]) => {
        const level = levels.find((l) => l.id === levelId)
        return (
          <div key={levelId} className="mb-8">
            <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
              {level ? (
                <>
                  <span className="text-lg">{level.emoji}</span>
                  <span>{locale === 'zh' ? level.name : level.name}</span>
                  <span className="text-xs text-gray-400 font-normal">({levelArticles.length})</span>
                </>
              ) : (
                <span>
                  {locale === 'zh' ? `级别 ${levelId}` : `Level ${levelId}`} ({levelArticles.length})
                </span>
              )}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {levelArticles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => handleSelect(article)}
                  className="text-left p-4 rounded-xl border border-gray-100 bg-white hover:shadow-md hover:border-orange-200 transition-all group"
                >
                  <p className="font-medium text-gray-800 text-sm group-hover:text-orange-600 transition-colors">
                    {article.emoji} {article.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{article.titleEn}</p>
                  <p className="text-[10px] text-gray-400 mt-2">
                    📝 {article.vocabulary.length} {locale === 'zh' ? '个单词' : 'words'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
