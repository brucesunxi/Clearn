import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service 用户协议',
  description:
    'Terms of Service for PandaHan. Please read these terms before using our platform. PandaHan用户协议，使用前请阅读。',
  alternates: {
    canonical: 'https://pandahan.xyz/terms',
  },
  openGraph: {
    title: 'Terms of Service 用户协议 - PandaHan',
    description: 'PandaHan Terms of Service. PandaHan用户协议。',
  },
}

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Terms of Service 用户协议
      </h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: June 4, 2026 / 最后更新：2026年6月4日</p>

      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            1. Service Description 服务说明
          </h2>
          <p className="text-gray-600 leading-relaxed">
            PandaHan (pandahan.xyz) is a self-study tool for learning Chinese vocabulary,
            reading, and listening skills. It is a self-service platform only and does NOT
            provide any of the following:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
            <li>Live or scheduled classes / 直播或预约课程</li>
            <li>One-on-one or group tutoring / 一对一或小组辅导</li>
            <li>Instruction from teachers or instructors / 教师授课</li>
            <li>Formal educational courses or curricula / 正式教育课程</li>
            <li>Academic certification or degrees / 学历认证或学位</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            PandaHan（pandahan.xyz）是中文词汇、阅读和听力的自学工具。本平台仅为
            自助练习工具，<strong>不提供</strong>课程、授课、辅导或任何形式的
            教学活动。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            2. Acceptance of Terms 接受条款
          </h2>
          <p className="text-gray-600 leading-relaxed">
            By accessing or using PandaHan, you agree to be bound by these Terms of Service.
            If you do not agree, please do not use the platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            3. User Accounts 用户账户
          </h2>
          <p className="text-gray-600 leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials.
            You must be at least 13 years old to create an account. If you are under 13,
            a parent or guardian must create and manage the account on your behalf.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            4. Acceptable Use 合理使用
          </h2>
          <p className="text-gray-600 leading-relaxed">
            You agree to use the platform only for its intended purpose — self-study of the
            Chinese language. You may not:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
            <li>Use the platform for any illegal purpose</li>
            <li>Attempt to disrupt or compromise the platform</li>
            <li>Scrape, copy, or redistribute content without permission</li>
            <li>Create multiple accounts to abuse the system</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            5. Intellectual Property 知识产权
          </h2>
          <p className="text-gray-600 leading-relaxed">
            All content on PandaHan, including articles, flashcards, and software,
            is the property of PandaHan unless otherwise attributed. User-generated
            content (such as imported articles) remains the property of the user.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            6. Disclaimer of Warranties 免责声明
          </h2>
          <p className="text-gray-600 leading-relaxed">
            PandaHan is provided &quot;as is&quot; without any warranty, express or implied.
            We do not guarantee that the platform will meet your learning goals or be
            available without interruption.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            7. Limitation of Liability 责任限制
          </h2>
          <p className="text-gray-600 leading-relaxed">
            PandaHan shall not be liable for any indirect, incidental, or consequential
            damages arising from the use or inability to use the platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            8. Changes to Terms 条款变更
          </h2>
          <p className="text-gray-600 leading-relaxed">
            We reserve the right to modify these terms at any time. Users will be notified
            of material changes. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            9. Contact 联系方式
          </h2>
          <p className="text-gray-600 leading-relaxed">
            For questions about these terms, please contact:
          </p>
          <p className="text-gray-600 mt-2">
            Email: <a href="mailto:support@pandahan.xyz" className="text-blue-500 hover:text-blue-600 underline">support@pandahan.xyz</a>
          </p>
        </section>
      </div>
    </main>
  )
}
