export interface BundleItem {
  type: 'food' | 'accessory' | 'coins'
  itemId?: string
  amount: number
}

export interface PrizeDef {
  type: 'food' | 'accessory' | 'coins' | 'junk' | 'bundle' | 'equipment'
  nameZh: string
  nameEn: string
  emoji: string
  weight: number
  itemId?: string
  coinAmount?: number
  bundleItems?: BundleItem[]
}

export interface DrawnPrize {
  prize: PrizeDef
  boxIndex: number
}

const PRIZE_POOL: PrizeDef[] = [
  // Pet food — common
  { type: 'food', nameZh: '竹子', nameEn: 'Bamboo', emoji: '🎋', weight: 14, itemId: 'bamboo' },
  { type: 'food', nameZh: '饭团', nameEn: 'Rice Ball', emoji: '🍙', weight: 10, itemId: 'rice' },
  { type: 'food', nameZh: '奶茶', nameEn: 'Milk Tea', emoji: '🧋', weight: 8, itemId: 'milk' },
  { type: 'food', nameZh: '饺子', nameEn: 'Dumplings', emoji: '🥟', weight: 6, itemId: 'dumpling' },
  { type: 'food', nameZh: '蛋糕', nameEn: 'Cake', emoji: '🍰', weight: 5, itemId: 'cake' },

  // Pet accessories — uncommon
  { type: 'accessory', nameZh: '红围巾', nameEn: 'Red Scarf', emoji: '🧣', weight: 7, itemId: 'red_scarf' },
  { type: 'accessory', nameZh: '竹帽', nameEn: 'Bamboo Hat', emoji: '🎩', weight: 6, itemId: 'bamboo_hat' },
  { type: 'accessory', nameZh: '蝴蝶结', nameEn: 'Red Bow Tie', emoji: '🎀', weight: 5, itemId: 'bowtie' },
  { type: 'accessory', nameZh: '墨镜', nameEn: 'Cool Glasses', emoji: '👓', weight: 4, itemId: 'glasses' },
  { type: 'accessory', nameZh: '玉坠', nameEn: 'Jade Necklace', emoji: '📿', weight: 3, itemId: 'necklace' },
  { type: 'accessory', nameZh: '皇冠', nameEn: 'Golden Crown', emoji: '👑', weight: 1, itemId: 'crown' },

  // Small coin rewards — consolation
  { type: 'coins', nameZh: '10 金币', nameEn: '10 Coins', emoji: '🪙', weight: 8, coinAmount: 10 },
  { type: 'coins', nameZh: '15 金币', nameEn: '15 Coins', emoji: '🪙', weight: 5, coinAmount: 15 },
  { type: 'coins', nameZh: '20 金币', nameEn: '20 Coins', emoji: '🪙', weight: 2, coinAmount: 20 },

  // Junk — low value
  { type: 'junk', nameZh: '一片枯叶', nameEn: 'Dead Leaf', emoji: '🍂', weight: 8 },
  { type: 'junk', nameZh: '一根头发', nameEn: 'A Strand of Hair', emoji: '💇', weight: 5 },
  { type: 'junk', nameZh: '一张废纸', nameEn: 'Scrap Paper', emoji: '🗑️', weight: 5 },
  { type: 'junk', nameZh: '一个空瓶', nameEn: 'Empty Bottle', emoji: '🧃', weight: 4 },
  { type: 'junk', nameZh: '旧袜子', nameEn: 'Old Sock', emoji: '🧦', weight: 3 },
  { type: 'junk', nameZh: '一颗石头', nameEn: 'A Rock', emoji: '🪨', weight: 3 },

  // Adventure equipment — rare drops from blind boxes
  { type: 'equipment', nameZh: '幸运符', nameEn: 'Lucky Charm', emoji: '🍀', weight: 4, itemId: 'lucky-charm' },
  { type: 'equipment', nameZh: '竹剑', nameEn: 'Bamboo Sword', emoji: '🗡️', weight: 3, itemId: 'bamboo-sword' },
  { type: 'equipment', nameZh: '竹盾', nameEn: 'Bamboo Shield', emoji: '🛡️', weight: 3, itemId: 'bamboo-shield' },
  { type: 'equipment', nameZh: '能量腰带', nameEn: 'Energy Belt', emoji: '⚡', weight: 3, itemId: 'energy-belt' },
  { type: 'equipment', nameZh: '竹法杖', nameEn: 'Bamboo Staff', emoji: '🔮', weight: 2, itemId: 'bamboo-staff' },
  { type: 'equipment', nameZh: '金皇冠', nameEn: 'Golden Crown', emoji: '👑', weight: 1, itemId: 'golden-crown' },

  // 🎉 Grand prize bundles — rare
  {
    type: 'bundle', nameZh: '🎉 食物大礼包', nameEn: '🎉 Food Bundle', emoji: '🎉', weight: 2,
    bundleItems: [
      { type: 'food', itemId: 'bamboo', amount: 3 },
      { type: 'food', itemId: 'rice', amount: 2 },
      { type: 'food', itemId: 'cake', amount: 1 },
    ],
  },
  {
    type: 'bundle', nameZh: '🎉 金币大礼包', nameEn: '🎉 Coin Bundle', emoji: '🎉', weight: 2,
    bundleItems: [{ type: 'coins', amount: 100 }],
  },
  {
    type: 'bundle', nameZh: '🎉 豪华大礼包', nameEn: '🎉 Luxury Bundle', emoji: '👑', weight: 1,
    bundleItems: [
      { type: 'food', itemId: 'bamboo', amount: 2 },
      { type: 'food', itemId: 'dumpling', amount: 2 },
      { type: 'coins', amount: 50 },
      { type: 'accessory', itemId: 'crown', amount: 1 },
    ],
  },
]

export function getPrizePool(): PrizeDef[] {
  return PRIZE_POOL
}

/** Weighted random selection from the prize pool */
function weightedRandom(): PrizeDef {
  const totalWeight = PRIZE_POOL.reduce((sum, p) => sum + p.weight, 0)
  let rand = Math.random() * totalWeight
  for (const prize of PRIZE_POOL) {
    rand -= prize.weight
    if (rand <= 0) return prize
  }
  return PRIZE_POOL[PRIZE_POOL.length - 1]
}

/** Generate prizes for 5 blind boxes (can have duplicates) */
export function generateBoxes(): DrawnPrize[] {
  const boxes: DrawnPrize[] = []
  for (let i = 0; i < 5; i++) {
    boxes.push({ prize: weightedRandom(), boxIndex: i })
  }
  return boxes
}

/** Process the result of opening a box */
export function processPrize(prize: PrizeDef): { added: boolean; message: string } {
  const { addCoins, getInventoryRaw, saveInventory } = require('./pet')

  if (prize.type === 'food' && prize.itemId) {
    const inv = getInventoryRaw()
    const newFood = { ...inv.food }
    newFood[prize.itemId] = (newFood[prize.itemId] || 0) + 1
    saveInventory({ ...inv, food: newFood })
    return { added: true, message: '' }
  }

  if (prize.type === 'accessory' && prize.itemId) {
    const inv = getInventoryRaw()
    const newAcc = { ...inv.accessories, [prize.itemId]: true }
    saveInventory({ ...inv, accessories: newAcc })
    return { added: true, message: '' }
  }

  if (prize.type === 'coins' && prize.coinAmount) {
    addCoins(prize.coinAmount)
    return { added: true, message: '' }
  }

  // 🎉 Bundle — add multiple items
  if (prize.type === 'bundle' && prize.bundleItems) {
    const inv = getInventoryRaw()
    const newFood = { ...inv.food }
    const newAcc = { ...inv.accessories }

    for (const item of prize.bundleItems) {
      if (item.type === 'food' && item.itemId) {
        newFood[item.itemId] = (newFood[item.itemId] || 0) + item.amount
      } else if (item.type === 'accessory' && item.itemId) {
        newAcc[item.itemId] = true
      }
      // Coins are handled by BlindBoxClient via API — omit here to avoid double-count
    }

    saveInventory({ ...inv, food: newFood, accessories: newAcc })
    return { added: true, message: '' }
  }

  // Junk — nothing added
  return { added: false, message: '' }
}
