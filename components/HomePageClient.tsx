'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'

const sections = [
  {
    href: '/listen',
    emoji: '🎧',
    titleKey: 'listen',
    subtitleKey: 'listenSub',
    descKey: 'listenDesc',
    bg: 'from-blue-100 to-blue-50',
    border: 'border-blue-300',
    btn: 'bg-white text-blue-600 hover:bg-blue-50',
  },
  {
    href: '/speak',
    emoji: '🗣️',
    titleKey: 'speak',
    subtitleKey: 'speakSub',
    descKey: 'speakDesc',
    bg: 'from-red-100 to-red-50',
    border: 'border-red-300',
    btn: 'bg-white text-red-600 hover:bg-red-50',
  },
  {
    href: '/reading',
    emoji: '📖',
    titleKey: 'read',
    subtitleKey: 'readSub',
    descKey: 'readDesc',
    bg: 'from-orange-100 to-orange-50',
    border: 'border-orange-300',
    btn: 'bg-white text-orange-600 hover:bg-orange-50',
  },
]

const content: Record<string, { zh: string; en: string }> = {
  listen: { zh: '听', en: 'Listen' },
  listenSub: { zh: '听中文，选意思', en: 'Listen & Choose' },
  listenDesc: { zh: '听单词发音，选择正确的英文意思，训练你的中文听力。', en: 'Listen to Chinese words and choose the correct meaning.' },
  speak: { zh: '说', en: 'Speak' },
  speakSub: { zh: '看中文，开口说', en: 'See & Speak' },
  speakDesc: { zh: '看中文单词，用麦克风说出来，AI 帮你判断发音是否正确。', en: 'Read Chinese words aloud with speech recognition.' },
  read: { zh: '读', en: 'Read' },
  readSub: { zh: '读文章，学词汇', en: 'Read & Learn' },
  readDesc: { zh: '阅读分级文章，学习新单词。艾宾浩斯遗忘曲线帮你科学记忆。', en: 'Read leveled articles and learn words with spaced repetition.' },
  start: { zh: '开始学习', en: 'Start Learning' },
}

export default function HomePageClient() {
  const { locale } = useTranslation()
  const t = (key: string) => locale === 'zh' ? content[key]?.zh : content[key]?.en

  return (
    <div className="flex flex-col">
      {sections.map((s, i) => (
        <Link
          key={s.href}
          href={s.href}
          className={`min-h-[70vh] md:min-h-[80vh] flex items-center justify-center bg-gradient-to-b ${s.bg} border-b ${s.border} group transition-colors`}
        >
          <div className="max-w-2xl mx-auto px-6 text-center py-16">
            <span className="text-7xl md:text-8xl block mb-6 group-hover:scale-110 transition-transform duration-300">
              {s.emoji}
            </span>
            <h2 className="text-5xl md:text-7xl font-black text-gray-800 mb-2">
              {t(s.titleKey)}
            </h2>
            <p className="text-lg md:text-xl font-medium text-gray-500 mb-4">
              {t(s.subtitleKey)}
            </p>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-8 max-w-md mx-auto">
              {t(s.descKey)}
            </p>
            <span className={`inline-block px-8 py-3 rounded-full font-semibold text-base shadow-md transition-all group-hover:shadow-xl group-hover:-translate-y-0.5 ${s.btn}`}>
              {t('start')} →
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
