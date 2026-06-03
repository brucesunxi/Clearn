'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getCustomArticle, deleteCustomArticle } from '@/lib/custom-articles'
import type { Article } from '@/lib/types'
import ArticleContent from '@/components/ArticleContent'
import WordList from '@/components/WordList'

export default function CustomArticlePageClient() {
  const params = useParams()
  const id = params.id as string
  const [article, setArticle] = useState<Article | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isZh, setIsZh] = useState(false)

  useEffect(() => {
    setIsZh(window.navigator.language.startsWith('zh'))
  }, [])

  useEffect(() => {
    const a = getCustomArticle(id)
    if (a) {
      setArticle(a)
    } else {
      setNotFound(true)
    }
  }, [id])

  const handleDelete = () => {
    if (!confirm('确定删除这篇文章？Are you sure you want to delete this article?')) return
    deleteCustomArticle(id)
    window.location.href = '/reading'
  }

  if (notFound) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <p className="text-lg text-gray-400 mb-6">文章未找到 / Article Not Found</p>
        <Link
          href="/reading"
          className="text-blue-500 hover:text-blue-600 font-medium"
        >
          ← 返回阅读 / Back to Reading
        </Link>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400 text-lg">加载中... / Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/reading" className="hover:text-blue-500 transition-colors">
          📖
        </Link>
        <span>/</span>
        <span className="text-gray-600">
          📥 {article.title}
        </span>

        <div className="ml-auto flex gap-2">
          <Link
            href="/import"
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium"
          >
            ✏️ {isZh ? '编辑' : 'Edit'}
          </Link>
          <button
            onClick={handleDelete}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors font-medium"
          >
            🗑️ {isZh ? '删除' : 'Delete'}
          </button>
        </div>
      </div>

      <ArticleContent article={article} />
      <WordList vocabulary={article.vocabulary} articleId={article.id} />
    </div>
  )
}
