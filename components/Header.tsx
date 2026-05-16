'use client'

import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🀄</span>
          <span className="text-xl font-bold text-gray-800">中文乐</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/reading"
            className="text-gray-600 hover:text-orange-500 font-medium transition-colors"
          >
            阅读 📖
          </Link>
        </nav>
      </div>
    </header>
  )
}
