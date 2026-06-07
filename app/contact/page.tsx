import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us 联系我们',
  description:
    'Get in touch with the PandaHan team. We welcome your feedback and suggestions! 联系PandaHan团队，欢迎您的反馈和建议。',
  alternates: {
    canonical: 'https://pandahan.xyz/contact',
  },
  openGraph: {
    title: 'Contact Us 联系我们 - PandaHan',
    description: 'Contact the PandaHan team. 联系PandaHan团队。',
  },
}

export default function ContactPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Contact Us 联系我们
      </h1>

      <div className="space-y-8">
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            📧 Email 邮箱
          </h2>
          <p className="text-gray-600">
            <a
              href="mailto:support@pandahan.xyz"
              className="text-blue-500 hover:text-blue-600 underline"
            >
              support@pandahan.xyz
            </a>
          </p>
          <p className="text-sm text-gray-400 mt-1">
            We typically respond within 48 hours. / 我们通常在48小时内回复。
          </p>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            📬 Address 地址
          </h2>
          <p className="text-gray-600 leading-relaxed">
            PandaHan
            <br />
            Unit 903, 9/F, Cityplaza One
            <br />
            1111 King&apos;s Road, Taikoo Shing
            <br />
            Hong Kong
          </p>
          <p className="text-sm text-gray-400 mt-1">
            * This is a correspondence address. / 此为通信地址。
          </p>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            💬 Send Us a Message 给我们留言
          </h2>
          <p className="text-gray-600 leading-relaxed">
            You can also use the feedback button (blue chat icon) at the bottom-right corner
            of any page to send us a message directly.
          </p>
          <p className="text-gray-600 leading-relaxed mt-2">
            您也可以点击页面右下角的蓝色反馈按钮直接给我们留言。
          </p>
        </section>
      </div>
    </main>
  )
}
