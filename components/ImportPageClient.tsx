'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import type { Level, Article, Paragraph, VocabularyItem } from '@/lib/types'
import { saveCustomArticle } from '@/lib/custom-articles'
import { buildVocabDict, splitIntoParagraphs, extractVocabulary, suggestNewWords } from '@/lib/chinese-text'

interface ImportPageClientProps {
  levels: Level[]
  articles: Article[]
}

const EMOJI_OPTIONS = ['📖', '📕', '📗', '📘', '📙', '📚', '📝', '📃', '📄', '✏️', '🖋️', '📜', '🗺️', '🎯']

type Step = 'input' | 'preview'

export default function ImportPageClient({ levels, articles }: ImportPageClientProps) {
  const { t, locale } = useTranslation()
  const router = useRouter()
  const [step, setStep] = useState<Step>('input')
  const [rawText, setRawText] = useState('')
  const [title, setTitle] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [level, setLevel] = useState(1)
  const [emoji, setEmoji] = useState('📖')
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([])
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([])
  const [saving, setSaving] = useState(false)
  const [inputType, setInputType] = useState<'text' | 'pdf' | 'url'>('text')
  const [urlInput, setUrlInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadedFromPdf, setLoadedFromPdf] = useState(false)
  const [loadedFromUrl, setLoadedFromUrl] = useState(false)

  const dict = useMemo(() => buildVocabDict(articles), [articles])

  const handleAnalyze = () => {
    const text = rawText.trim()
    if (!text) return

    const paras = splitIntoParagraphs(text)
    setParagraphs(paras)

    const knownVocab = extractVocabulary(text, dict)
    const suggestions = suggestNewWords(text, dict)
    const combined = [...knownVocab, ...suggestions.filter(
      (s) => !knownVocab.find((v) => v.word === s.word)
    )]
    setVocabulary(combined)

    if (!title) {
      const firstLine = text.split('\n')[0]?.trim().slice(0, 50) || ''
      setTitle(firstLine)
    }
    if (!titleEn) {
      setTitleEn('Imported Article')
    }

    setStep('preview')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setRawText(text)
    }
    reader.readAsText(file)
  }

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsLoading(true)
    setError('')
    setLoadedFromPdf(false)
    try {
      const { extractPdfText } = await import('@/lib/parse-pdf')
      const text = await extractPdfText(file)
      if (!text) {
        setError(locale === 'zh' ? '未能从 PDF 中提取到文字，请确认文件包含可提取的文本' : 'No text could be extracted from this PDF')
        return
      }
      setRawText(text)
      setLoadedFromPdf(true)
    } catch {
      setError(locale === 'zh' ? 'PDF 解析失败，请确认文件包含可提取的文字' : 'Failed to parse PDF. Make sure it contains extractable text')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFetchUrl = async () => {
    const u = urlInput.trim()
    if (!u) return
    setIsLoading(true)
    setError('')
    setLoadedFromUrl(false)
    try {
      const res = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: u }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        return
      }
      setRawText(data.text)
      if (data.title && !title) setTitle(data.title)
      setLoadedFromUrl(true)
    } catch {
      setError(locale === 'zh' ? '获取内容失败，请检查 URL 是否正确' : 'Failed to fetch URL. Please check the URL.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = () => {
    setSaving(true)
    const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    const article: Article = {
      id,
      title: title || rawText.split('\n')[0]?.trim().slice(0, 50) || '未命名文章',
      titleEn: titleEn || 'Untitled Article',
      level,
      emoji,
      paragraphs,
      vocabulary,
    }
    saveCustomArticle(article)
    router.push(`/reading/custom/${id}`)
  }

  const updateParagraph = (idx: number, field: 'text' | 'translation', value: string) => {
    setParagraphs((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  const removeVocab = (idx: number) => {
    setVocabulary((prev) => prev.filter((_, i) => i !== idx))
  }

  const addVocab = () => {
    setVocabulary((prev) => [...prev, { word: '', pinyin: '', meaning: '' }])
  }

  const updateVocab = (idx: number, field: keyof VocabularyItem, value: string) => {
    setVocabulary((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  if (step === 'input') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            📥 {locale === 'zh' ? '导入内容' : 'Import Content'}
          </h1>
          <p className="text-sm text-gray-400">
            {locale === 'zh'
              ? '粘贴文本、上传 PDF 或输入网页链接，自动分析生成学习素材'
              : 'Paste text, upload PDF, or enter a URL to generate learning materials'}
          </p>
        </div>

        {/* Input type tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setInputType('text'); setError('') }}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              inputType === 'text'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            📝 {locale === 'zh' ? '粘贴文本' : 'Paste Text'}
          </button>
          <button
            onClick={() => { setInputType('pdf'); setError('') }}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              inputType === 'pdf'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            📄 PDF
          </button>
          <button
            onClick={() => { setInputType('url'); setError('') }}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              inputType === 'url'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            🔗 {locale === 'zh' ? '网页链接' : 'Web URL'}
          </button>
        </div>

        {/* Text tab */}
        {inputType === 'text' && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                {locale === 'zh' ? '粘贴中文文本' : 'Paste Chinese Text'}
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={locale === 'zh' ? '在此粘贴中文内容...' : 'Paste Chinese text here...'}
                rows={12}
                className="w-full border border-gray-200 rounded-xl p-4 text-base resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                {locale === 'zh' ? '或上传 .txt 文件' : 'Or upload a .txt file'}
              </label>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
              />
            </div>
          </>
        )}

        {/* PDF tab */}
        {inputType === 'pdf' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              📄 {locale === 'zh' ? '上传 PDF 文件' : 'Upload PDF File'}
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handlePdfUpload}
              disabled={isLoading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 disabled:opacity-40"
            />

            {isLoading && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                {locale === 'zh' ? '正在解析 PDF...' : 'Parsing PDF...'}
              </div>
            )}

            {error && (
              <p className="mt-4 text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>
            )}

            {loadedFromPdf && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  {locale === 'zh' ? '提取的文本（可编辑）' : 'Extracted text (editable)'}
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={10}
                  className="w-full border border-gray-200 rounded-xl p-4 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            )}
          </div>
        )}

        {/* URL tab */}
        {inputType === 'url' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              🔗 {locale === 'zh' ? '输入网页链接' : 'Enter Web URL'}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/article"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
              <button
                onClick={handleFetchUrl}
                disabled={!urlInput.trim() || isLoading}
                className="px-5 py-3 rounded-xl text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {isLoading
                  ? (locale === 'zh' ? '加载中...' : 'Loading...')
                  : (locale === 'zh' ? '获取内容' : 'Fetch')}
              </button>
            </div>

            {isLoading && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                {locale === 'zh' ? '正在抓取网页内容...' : 'Fetching content...'}
              </div>
            )}

            {error && (
              <p className="mt-4 text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>
            )}

            {loadedFromUrl && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  {locale === 'zh' ? '抓取的内容（可编辑）' : 'Fetched content (editable)'}
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={10}
                  className="w-full border border-gray-200 rounded-xl p-4 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            )}
          </div>
        )}

        {/* Analyze button — enabled for all tabs once rawText is populated */}
        <button
          onClick={handleAnalyze}
          disabled={!rawText.trim()}
          className="w-full py-3 rounded-xl text-base font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          🔍 {locale === 'zh' ? '分析内容' : 'Analyze'}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => setStep('input')}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-2"
        >
          ← {locale === 'zh' ? '返回编辑' : 'Back to edit'}
        </button>
        <h1 className="text-3xl font-bold text-gray-800 mb-1">
          📥 {locale === 'zh' ? '预览与保存' : 'Preview & Save'}
        </h1>
        <p className="text-sm text-gray-400">
          {locale === 'zh' ? '确认内容后保存到学习库' : 'Confirm and save to your learning library'}
        </p>
      </div>

      {/* Config section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {locale === 'zh' ? '文章信息' : 'Article Info'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {locale === 'zh' ? '中文标题' : 'Chinese Title'}
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              placeholder={locale === 'zh' ? '输入中文标题' : 'Enter Chinese title'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {locale === 'zh' ? '英文标题' : 'English Title'}
            </label>
            <input
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              placeholder={locale === 'zh' ? '输入英文标题' : 'Enter English title'}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              {locale === 'zh' ? '级别' : 'Level'}
            </label>
            <div className="flex gap-2">
              {levels.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLevel(l.id)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    level === l.id
                      ? 'text-white shadow-sm'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                  style={level === l.id ? { backgroundColor: l.color } : undefined}
                >
                  {l.emoji} {t(`level.${l.id}.name`)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              {locale === 'zh' ? '表情图标' : 'Emoji'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
                    emoji === e
                      ? 'bg-blue-100 ring-2 ring-blue-400'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Paragraphs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          📄 {locale === 'zh' ? `段落 (${paragraphs.length})` : `Paragraphs (${paragraphs.length})`}
        </h2>
        <div className="space-y-4">
          {paragraphs.map((p, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4">
              <div className="text-xs text-gray-400 font-medium mb-2">
                {locale === 'zh' ? `段落 ${i + 1}` : `Paragraph ${i + 1}`}
              </div>
              <textarea
                value={p.text}
                onChange={(e) => updateParagraph(i, 'text', e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 mb-2"
              />
              <input
                value={p.translation}
                onChange={(e) => updateParagraph(i, 'translation', e.target.value)}
                placeholder={locale === 'zh' ? '翻译（可选）' : 'Translation (optional)'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Vocabulary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            📝 {locale === 'zh' ? `词汇 (${vocabulary.length})` : `Vocabulary (${vocabulary.length})`}
          </h2>
          <button
            onClick={addVocab}
            className="text-sm px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium transition-colors"
          >
            + {locale === 'zh' ? '添加' : 'Add'}
          </button>
        </div>

        <div className="space-y-2">
          {vocabulary.map((v, i) => (
            <div key={i} className="flex items-center gap-2 border border-gray-100 rounded-lg p-2">
              <input
                value={v.word}
                onChange={(e) => updateVocab(i, 'word', e.target.value)}
                placeholder={locale === 'zh' ? '词' : 'Word'}
                className="flex-[2] border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
              <input
                value={v.pinyin}
                onChange={(e) => updateVocab(i, 'pinyin', e.target.value)}
                placeholder="pinyin"
                className="flex-[2] border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
              <input
                value={v.meaning}
                onChange={(e) => updateVocab(i, 'meaning', e.target.value)}
                placeholder={locale === 'zh' ? '意思' : 'Meaning'}
                className="flex-[3] border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
              <button
                onClick={() => removeVocab(i)}
                className="shrink-0 w-7 h-7 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors text-sm"
              >
                ✕
              </button>
            </div>
          ))}
          {vocabulary.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              {locale === 'zh' ? '暂未识别到词汇' : 'No vocabulary detected'}
            </p>
          )}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-xl text-base font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {saving
          ? (locale === 'zh' ? '保存中...' : 'Saving...')
          : (locale === 'zh' ? '💾 保存到学习库' : '💾 Save to Library')}
      </button>
    </div>
  )
}
