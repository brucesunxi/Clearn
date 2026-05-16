'use client'

import Link from 'next/link'
import levelsData from '@/content/levels.json'
import type { Article, Level } from '@/lib/types'

interface ArticleCardProps {
  article: Article
}

function getLevel(id: number): Level | undefined {
  return (levelsData as Level[]).find((l) => l.id === id)
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const level = getLevel(article.level)

  return (
    <Link
      href={`/reading/${article.id}`}
      className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl">{article.emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-800 truncate">
            {article.title}
          </h3>
          <p className="text-sm text-gray-400 mt-0.5">{article.titleEn}</p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
              style={{ backgroundColor: level?.color || '#999' }}
            >
              {level?.emoji} {level?.name}
            </span>
            <span className="text-xs text-gray-400">
              {article.vocabulary.length} 个生词
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
