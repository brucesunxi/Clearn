import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us 关于我们',
  description:
    'PandaHan (pandahan.xyz) is independently owned and operated by Sun Xi. PandaHan（pandahan.xyz）由孙曦独立所有和运营。',
  alternates: {
    canonical: 'https://pandahan.xyz/about',
  },
  openGraph: {
    title: 'About Us 关于我们 - PandaHan',
    description:
      'PandaHan (pandahan.xyz) is independently owned by Sun Xi.',
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
            Ownership 所有权
          </h2>
          <p className="text-gray-600 leading-relaxed">
            This website pandahan.xyz is independently owned and operated by Sun Xi.
          </p>
          <p className="text-gray-600 leading-relaxed mt-3">
            本网站 pandahan.xyz 由孙曦（Sun Xi）独立所有和运营。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            Contact 联系方式
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Email: <a href="mailto:sunxi0302@gmail.com" className="text-blue-500 hover:text-blue-600 underline">sunxi0302@gmail.com</a>
          </p>
        </section>
      </div>
    </main>
  )
}
