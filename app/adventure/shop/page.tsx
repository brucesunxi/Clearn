import type { Metadata } from 'next'
import AdventureShop from '@/components/AdventureShop'
import { getEquipmentShop } from '@/lib/adventure'

export const metadata: Metadata = {
  title: 'Equipment Shop 装备商店',
  description: 'Buy equipment to power up your panda for adventures! 购买装备强化你的熊猫！',
  alternates: {
    canonical: 'https://pandahan.xyz/adventure/shop',
  },
  keywords: ['shop', 'equipment', 'upgrade', '商店', '装备'],
  openGraph: {
    title: 'Equipment Shop 装备商店 - Panda Chinese',
    description: 'Buy equipment to power up your panda! 购买装备强化你的熊猫！',
  },
}

export default function ShopPage() {
  const shop = getEquipmentShop()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <span className="text-4xl">🛍️</span>
          Equipment Shop 装备商店
        </h1>
        <p className="text-gray-500">
          Buy equipment to boost your panda&apos;s stats! 购买装备提升属性！
        </p>
      </div>

      {/* Shop */}
      <AdventureShop shop={shop} />
    </div>
  )
}
