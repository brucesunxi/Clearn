'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'

export default function HomePageClient() {
  const { locale } = useTranslation()

  const sections = [
    {
      href: '/listen',
      emoji: '🎧',
      title: locale === 'zh' ? '听' : 'Listen',
      subtitle: locale === 'zh' ? '听中文，选意思' : 'Listen & Choose',
      desc: locale === 'zh' ? '听单词的发音，选择正确的英文意思。提升听力理解能力。' : 'Listen to Chinese words and choose the correct meaning.',
      bgClass: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      btnClass: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      href: '/speak',
      emoji: '🗣️',
      title: locale === 'zh' ? '说' : 'Speak',
      subtitle: locale === 'zh' ? '看中文，开口说' : 'See & Speak',
      desc: locale === 'zh' ? '看中文单词，用麦克风说出来。练习发音和口语表达。' : 'Read Chinese words aloud with speech recognition.',
      bgClass: 'bg-red-50 hover:bg-red-100 border-red-200',
      btnClass: 'bg-red-500 hover:bg-red-600',
    },
    {
      href: '/reading',
      emoji: '📖',
      title: locale === 'zh' ? '读' : 'Read',
      subtitle: locale === 'zh' ? '读文章，学词汇' : 'Read & Learn',
      desc: locale === 'zh' ? '阅读分级文章，学习新单词。配合艾宾浩斯遗忘曲线科学记忆。' : 'Read leveled articles and learn words with spaced repetition.',
      bgClass: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
      btnClass: 'bg-orange-500 hover:bg-orange-600',
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
      {/* Tagline */}
      <div className="text-center mb-12 md:mb-16">
        <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-3">
          🐼 {locale === 'zh' ? '熊猫汉语' : 'Panda Chinese'}
        </h1>
        <p className="text-gray-500 text-lg">
          {locale === 'zh' ? '听说读，三步学好中文' : 'Listen, Speak, Read — Three steps to Chinese'}
        </p>
      </div>

      {/* Three pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`group rounded-2xl border-2 ${s.bgClass} p-8 md:p-10 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
          >
            <span className="text-5xl md:text-6xl mb-4">{s.emoji}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">{s.title}</h2>
            <p className="text-sm font-medium text-gray-500 mb-4">{s.subtitle}</p>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">{s.desc}</p>
            <span className={`inline-block px-6 py-2.5 rounded-full text-white font-medium text-sm transition-colors ${s.btnClass} group-hover:shadow-lg`}>
              {locale === 'zh' ? '开始学习 →' : 'Start →'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
