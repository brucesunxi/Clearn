'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { speak } from '@/lib/tts'
import type { Article, VocabularyItem } from '@/lib/types'
import WordCard from './WordCard'

interface ArticleContentProps {
  article: Article
}

export default function ArticleContent({ article }: ArticleContentProps) {
  const { t, locale } = useTranslation()
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null)
  const [showTranslations, setShowTranslations] = useState(false)
  const [playingPara, setPlayingPara] = useState<number | null>(null)

  const sortedVocab = useMemo(
    () =>
      [...article.vocabulary].sort(
        (a, b) => b.word.length - a.word.length
      ),
    [article.vocabulary]
  )

  const highlightText = (text: string): (string | VocabularyItem)[] => {
    const parts: (string | VocabularyItem)[] = []
    let remaining = text

    while (remaining.length > 0) {
      let match: { index: number; word: VocabularyItem } | null = null

      for (const v of sortedVocab) {
        const idx = remaining.indexOf(v.word)
        if (idx !== -1 && (match === null || idx < match.index)) {
          match = { index: idx, word: v }
        }
      }

      if (match) {
        if (match.index > 0) {
          parts.push(remaining.slice(0, match.index))
        }
        parts.push(match.word)
        remaining = remaining.slice(match.index + match.word.word.length)
      } else {
        parts.push(remaining)
        remaining = ''
      }
    }

    return parts
  }

  const playParagraph = (idx: number, text: string) => {
    setPlayingPara(idx)
    speak(text, { onEnd: () => setPlayingPara(null) })
  }

  return (
    <article className="max-w-2xl mx-auto">
      {/* Article header */}
      <div className="text-center mb-10">
        <span className="text-5xl block mb-4">{article.emoji}</span>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight">
          {article.title}
        </h1>
        <p className="text-base text-gray-400">{article.titleEn}</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <button
          onClick={() => setShowTranslations(!showTranslations)}
          className={`text-sm px-4 py-2 rounded-full border transition-all font-medium ${
            showTranslations
              ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
              : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300 hover:text-orange-500'
          }`}
        >
          {showTranslations ? '🕶️ ' : ''}
          {showTranslations ? t('article.hideTranslation') : t('article.showTranslation')}
        </button>
        <span className="text-xs text-gray-300">
          {locale === 'zh' ? `${article.vocabulary.length} 个生词` : `${article.vocabulary.length} words`}
        </span>
      </div>

      {/* Paragraphs with sentence-level audio */}
      <div className="space-y-8">
        {article.paragraphs.map((p, i) => (
          <div key={i} className="group flex gap-2 items-start">
            {/* Speaker button — appears on hover */}
            <button
              onClick={() => playParagraph(i, p.text)}
              className={`shrink-0 mt-1.5 w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 ${
                playingPara === i
                  ? 'bg-orange-100 text-orange-500 opacity-100'
                  : 'bg-gray-100 text-gray-400 hover:bg-orange-100 hover:text-orange-500'
              }`}
              title={locale === 'zh' ? '朗读本句' : 'Read this sentence'}
            >
              {playingPara === i ? '🔊' : '🔈'}
            </button>

            <div className="flex-1">
              <p className="text-xl md:text-2xl leading-[2.4] text-gray-800 font-serif tracking-wide">
                {highlightText(p.text).map((part, j) =>
                  typeof part === 'string' ? (
                    <span key={j}>{part}</span>
                  ) : (
                    <button
                      key={j}
                      onClick={() => setSelectedWord(part)}
                      className="word-highlight inline"
                      title={`${part.word} (${part.pinyin})`}
                    >
                      {part.word}
                    </button>
                  )
                )}
              </p>

              {/* Translation */}
              {showTranslations && (
                <div className="mt-2 pl-4 border-l-2 border-orange-200">
                  <p className="text-sm text-gray-400 italic leading-relaxed">{p.translation}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Word popup */}
      {selectedWord && (
        <WordCard
          word={selectedWord}
          articleId={article.id}
          articleLevel={article.level}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </article>
  )
}
