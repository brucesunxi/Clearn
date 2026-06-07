import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us 关于我们',
  description:
    'PandaHan is a free Chinese self-study tool for overseas Chinese children. Self-paced vocabulary, reading, and listening practice with gamified learning. PandaHan是为海外华裔儿童打造的免费中文自学工具，包含词汇练习、分级阅读、听力口语等自学模块。',
  alternates: {
    canonical: 'https://pandahan.xyz/about',
  },
  openGraph: {
    title: 'About Us 关于我们 - PandaHan',
    description:
      'Learn about PandaHan, a free self-study tool for overseas Chinese children.',
  },
}

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        About PandaHan 关于PandaHan
      </h1>

      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            Our Mission 我们的使命
          </h2>
          <p className="text-gray-600 leading-relaxed">
            PandaHan is a self-study tool built for overseas Chinese children and their families.
            We believe that learning Chinese should be fun, accessible, and self-paced.
            Our platform provides vocabulary drills, leveled reading articles, listening exercises,
            and gamified practice — all designed for independent self-study without live instruction
            or scheduled classes.
          </p>
          <p className="text-gray-600 leading-relaxed mt-3">
            PandaHan是为海外华裔家庭打造的中文自学工具。我们相信学习中文应该是有趣、
            自主、循序渐进的。平台提供词汇练习、分级阅读、听力训练和游戏化闯关等
            自学模块，让孩子可以按照自己的节奏练习中文，无需真人授课。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            What We Offer 我们的功能
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Vocabulary flashcards with spaced repetition / 闪卡单词记忆</li>
            <li>Leveled Chinese reading articles / 分级中文阅读</li>
            <li>Listening and speaking practice / 听力口语练习</li>
            <li>Gamified adventure challenges / 游戏化冒险闯关</li>
            <li>Custom article import / 自定义学习素材导入</li>
            <li>Progress tracking and study streaks / 学习进度追踪</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            Not a School 不是培训机构
          </h2>
          <p className="text-gray-600 leading-relaxed">
            PandaHan is a self-study tool, not a school or tutoring service. We do not
            offer live classes, scheduled lessons, one-on-one tutoring, or instruction from
            teachers. All content is designed for independent self-paced use.
          </p>
          <p className="text-gray-600 leading-relaxed mt-3">
            PandaHan是自学工具，不是培训机构。我们不提供直播课程、预约课程、
            一对一辅导或教师授课。所有内容均为自主练习而设计。
          </p>
        </section>
      </div>
    </main>
  )
}
