import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy 隐私政策',
  description:
    'Privacy Policy for PandaHan. Learn how we collect, use, and protect your data. PandaHan隐私政策，了解我们如何收集、使用和保护您的数据。',
  alternates: {
    canonical: 'https://pandahan.xyz/privacy',
  },
  openGraph: {
    title: 'Privacy Policy 隐私政策 - PandaHan',
    description: 'PandaHan Privacy Policy. PandaHan隐私政策。',
  },
}

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Privacy Policy 隐私政策
      </h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: June 4, 2026 / 最后更新：2026年6月4日</p>

      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            1. Information We Collect 我们收集的信息
          </h2>
          <p className="text-gray-600 leading-relaxed">
            When you register for an account, we collect your email address and a securely hashed password.
            We also collect anonymous usage data to improve our service, including pages visited,
            features used, and learning progress.
          </p>
          <p className="text-gray-600 leading-relaxed mt-2">
            Google AdSense and Google Analytics may set cookies and collect browsing data on our site.
            Please see section 4 below for details.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            2. How We Use Your Information 信息使用方式
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>To create and manage your account</li>
            <li>To track your learning progress and achievements</li>
            <li>To improve our platform based on usage patterns</li>
            <li>To display relevant advertisements via Google AdSense</li>
            <li>To communicate with you regarding your account or feedback</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            3. Data Retention 数据保留
          </h2>
          <p className="text-gray-600 leading-relaxed">
            We retain your account information for as long as your account is active.
            You may request deletion of your account and associated data by contacting us at
            sunxi0302@gmail.com.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            4. Cookies and Third-Party Services Cookies 和第三方服务
          </h2>
          <p className="text-gray-600 leading-relaxed">
            We use the following third-party services that may set cookies or collect data:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
            <li>
              <strong>Google AdSense</strong> — displays advertisements. Uses cookies to serve
              personalized ads based on your browsing history. You can opt out of personalized
              advertising at{' '}
              <a href="https://adssettings.google.com" className="text-blue-500 hover:text-blue-600 underline">
                adssettings.google.com
              </a>
              .
            </li>
            <li>
              <strong>Google Analytics</strong> — analyzes site traffic and usage patterns.
              Data is anonymized where possible.
            </li>
            <li>
              <strong>Upstash Redis</strong> — stores session and progress data securely.
            </li>
            <li>
              <strong>Resend</strong> — sends account verification and notification emails.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            5. Children&apos;s Privacy 儿童隐私
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Our service is designed for overseas Chinese children and families. We do not
            knowingly collect personal information from children under 13 without parental
            consent. If you believe a child has provided us with personal data, please
            contact us to have it removed.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            6. Your Rights 您的权利
          </h2>
          <p className="text-gray-600 leading-relaxed">
            You have the right to access, correct, or delete your personal data at any time.
            To exercise these rights, please contact us at sunxi0302@gmail.com.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            7. Changes to This Policy 政策变更
          </h2>
          <p className="text-gray-600 leading-relaxed">
            We may update this Privacy Policy from time to time. Changes will be posted on
            this page with an updated date. Continued use of the platform after changes
            constitutes acceptance of the new policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            8. Contact 联系方式
          </h2>
          <p className="text-gray-600 leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="text-gray-600 mt-2">
            Email: <a href="mailto:sunxi0302@gmail.com" className="text-blue-500 hover:text-blue-600 underline">sunxi0302@gmail.com</a>
          </p>
        </section>
      </div>
    </main>
  )
}
