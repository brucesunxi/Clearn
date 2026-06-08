import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us 联系我们',
  description:
    'Contact PandaHan via email at sunxi0302@gmail.com. 通过邮箱 sunxi0302@gmail.com 联系PandaHan。',
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

      <div className="max-w-md">
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            📧 Email 邮箱
          </h2>
          <p className="text-gray-600">
            <a
              href="mailto:sunxi0302@gmail.com"
              className="text-blue-500 hover:text-blue-600 underline"
            >
              sunxi0302@gmail.com
            </a>
          </p>
        </section>
      </div>
    </main>
  )
}
