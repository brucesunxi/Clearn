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

const MAX_ARTICLES = 3

export default function ArticleSelectClient({ articles: baseArticles, levels }: ArticleSelectClientProps) {
  const router = useRouter()
  const { locale } = useTranslation()
  const [articles, setArticles] = useState(baseArticles)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    const custom = getCustomArticles()
    if (custom.length > 0) {
      setArticles([...baseArticles, ...custom])
    }
    // Pre-select from URL if coming back
    const params = new URLSearchParams(window.location.search)
    const preSelected = params.getAll('selected')
    if (preSelected.length > 0) {
      setSelected(new Set(preSelected))
    }
  }, [baseArticles])

  const grouped = useMemo(() => {
    const map: Record<number, Article[]> = {}
    for (const a of articles) {
      const lvl = a.level || 1
      if (!map[lvl]) map[lvl] = []
      map[lvl].push(a)
    }
    return Object.entries(map)
      .map(([k, v]) => [Number(k), v] as [number, Article[]])
      .sort(([a], [b]) => a - b)
  }, [articles])

  const toggleArticle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (next.size >= MAX_ARTICLES) return prev
        next.add(id)
      }
      return next
    })
  }

  const handleConfirm = () => {
    if (selected.size === 0) {
      router.push('/ai-battle')
      return
    }
    const ids = Array.from(selected)
    const params = ids.map((id) => `articleId=${encodeURIComponent(id)}`).join('&')
    router.push(`/ai-battle?${params}`)
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

  const totalVocab = new Set<string>()
  Array.from(selected).forEach((id) => {
    const a = articles.find((art) => art.id === id)
    if (a) a.vocabulary.forEach((w) => totalVocab.add(w.word))
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => router.push('/ai-battle')}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4 inline-block"
      >
        ← {locale === 'zh' ? '返回对战' : 'Back to Battle'}
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            📖 {locale === 'zh' ? '选择文章' : 'Select Articles'}
          </h1>
          <p className="text-sm text-gray-400">
            {locale === 'zh'
              ? `选择 1-3 篇文章，合并词汇和 AI 对战（已选 ${selected.size}/${MAX_ARTICLES}）`
              : `Pick 1-3 articles to combine vocabulary for AI battle (${selected.size}/${MAX_ARTICLES} selected)`}
          </p>
        </div>
        {selected.size > 0 && (
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-400 mb-1">
              {totalVocab.size} {locale === 'zh' ? '个单词' : 'words'}
            </p>
            <button
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-sm transition-all"
            >
              ⚔️ {locale === 'zh' ? `开始对战 (${selected.size})` : `Battle (${selected.size})`}
            </button>
          </div>
        )}
      </div>

      {selected.size > 0 && (
        <div className="mb-6 p-3 rounded-xl bg-orange-50 border border-orange-200">
          <p className="text-xs font-medium text-orange-700 mb-2">
            {locale === 'zh' ? '已选文章：' : 'Selected:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {Array.from(selected).map((id) => {
              const a = articles.find((art) => art.id === id)
              return a ? (
                <span key={id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white text-xs text-gray-700 border border-orange-200">
                  {a.emoji} {a.title}
                  <button onClick={() => toggleArticle(id)} className="text-red-400 hover:text-red-600 ml-1">✕</button>
                </span>
              ) : null
            })}
          </div>
        </div>
      )}

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
              {levelArticles.map((article) => {
                const isSelected = selected.has(article.id)
                return (
                  <button
                    key={article.id}
                    onClick={() => toggleArticle(article.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all group ${
                      isSelected
                        ? 'border-orange-400 bg-orange-50 shadow-sm'
                        : 'border-gray-100 bg-white hover:shadow-md hover:border-orange-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${isSelected ? 'text-orange-700' : 'text-gray-800 group-hover:text-orange-600'} transition-colors`}>
                          {article.emoji} {article.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{article.titleEn}</p>
                        <p className="text-[10px] text-gray-400 mt-2">
                          📝 {article.vocabulary.length} {locale === 'zh' ? '个单词' : 'words'}
                        </p>
                      </div>
                      <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                      }`}>
                        {isSelected && <span className="text-white text-[10px]">✓</span>}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Sticky bottom bar for mobile */}
      {selected.size > 0 && (
        <div className="sticky bottom-4 mt-6 text-center md:hidden">
          <button
            onClick={handleConfirm}
            className="px-8 py-3 rounded-xl text-base font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg transition-all"
          >
            ⚔️ {locale === 'zh' ? `开始对战 (${selected.size})` : `Battle (${selected.size})`}
          </button>
        </div>
      )}
    </div>
  )
}
