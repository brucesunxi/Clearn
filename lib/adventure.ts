// ============================================================
// 熊猫冒险闯关游戏 - 核心数据结构和逻辑
// ============================================================

import { getRedis, addCoins, getCoins } from './redis'

// --------------- 类型定义 ---------------

export interface PandaEnergy {
  current: number
  max: number
  lastRegen?: string
}

export interface EquipmentItem {
  id: string
  name: string
  nameEn: string
  emoji: string
  price: number
  slot: 'head' | 'body' | 'accessory' | 'weapon' | 'shield' | 'foot'
  stats: {
    power?: number
    defense?: number
    luck?: number
    energy?: number
  }
  description: string
  descriptionEn: string
  requiredLevel?: number
}

export interface AdventureLevel {
  id: number
  name: string
  nameEn: string
  emoji: string
  description: string
  descriptionEn: string
  theme: string
  difficulty: number
  requiredEnergy: number
  totalQuestions: number
  requirements: {
    minLevel?: number
    minPower?: number
    minDefense?: number
  }
  rewards: {
    coins: { min: number; max: number }
    exp: number
  }
  gameType: string
}

export interface PetLevelData {
  level: number
  exp: number
  expToNext: number
}

export const ADVENTURE_CONFIG = {
  energy: {
    max: 100,
    regenPerHour: 5,
  },
  activities: {
    article_read: 10,
    quiz_complete: 5,
    listen_complete: 8,
    speak_complete: 8,
    battle_win: 15,
    checkin: 20,
  },
  pet: {
    maxLevel: 50,
    expPerLevel: 100,
    expMultiplier: 1.5,
  },
}

// --------------- 关卡数据 ---------------

export function getAdventureLevels(): AdventureLevel[] {
  return [
    {
      id: 1,
      name: '竹林初试',
      nameEn: 'Bamboo Forest Trial',
      emoji: '🎋',
      description: '在竹林中开始你的第一个挑战，回答基础中文词汇问题',
      descriptionEn: 'Start your first challenge in the bamboo forest with basic Chinese vocabulary',
      theme: 'bamboo-forest',
      difficulty: 1,
      requiredEnergy: 10,
      totalQuestions: 5,
      requirements: {},
      rewards: { coins: { min: 20, max: 40 }, exp: 20 },
      gameType: 'quiz',
    },
    {
      id: 2,
      name: '竹海漫步',
      nameEn: 'Bamboo Sea Walk',
      emoji: '🌿',
      description: '在广袤的竹海中漫步，回答更多中文词汇问题',
      descriptionEn: 'Stroll through the vast bamboo sea answering more Chinese vocabulary questions',
      theme: 'bamboo-forest',
      difficulty: 1,
      requiredEnergy: 10,
      totalQuestions: 5,
      requirements: {},
      rewards: { coins: { min: 25, max: 45 }, exp: 25 },
      gameType: 'quiz',
    },
    {
      id: 3,
      name: '山路探险',
      nameEn: 'Mountain Trail Adventure',
      emoji: '⛰️',
      description: '沿着山路前进，问题难度开始增加',
      descriptionEn: 'Trek along the mountain trail with increasingly challenging questions',
      theme: 'mountain',
      difficulty: 2,
      requiredEnergy: 15,
      totalQuestions: 6,
      requirements: { minPower: 10 },
      rewards: { coins: { min: 35, max: 60 }, exp: 35 },
      gameType: 'quiz',
    },
    {
      id: 4,
      name: '山巅对决',
      nameEn: 'Mountain Peak Duel',
      emoji: '🏔️',
      description: '登上山巅与守护者对决',
      descriptionEn: 'Reach the peak and duel the guardian',
      theme: 'mountain',
      difficulty: 2,
      requiredEnergy: 15,
      totalQuestions: 6,
      requirements: { minPower: 15 },
      rewards: { coins: { min: 40, max: 65 }, exp: 40 },
      gameType: 'quiz',
    },
    {
      id: 5,
      name: '溪流迷阵',
      nameEn: 'River Maze',
      emoji: '🌊',
      description: '穿越溪流迷宫，回答综合知识问题',
      descriptionEn: 'Navigate the river maze and answer comprehensive questions',
      theme: 'river',
      difficulty: 3,
      requiredEnergy: 20,
      totalQuestions: 7,
      requirements: { minLevel: 3, minPower: 25 },
      rewards: { coins: { min: 50, max: 90 }, exp: 55 },
      gameType: 'quiz',
    },
    {
      id: 6,
      name: '瀑布试炼',
      nameEn: 'Waterfall Trial',
      emoji: '💧',
      description: '在瀑布下接受最高难度试炼',
      descriptionEn: 'Endure the ultimate trial beneath the waterfall',
      theme: 'river',
      difficulty: 3,
      requiredEnergy: 20,
      totalQuestions: 7,
      requirements: { minLevel: 3, minPower: 30 },
      rewards: { coins: { min: 55, max: 100 }, exp: 65 },
      gameType: 'quiz',
    },
    {
      id: 7,
      name: '云端神殿',
      nameEn: 'Cloud Temple',
      emoji: '☁️',
      description: '挑战传说中的云端神殿，证明你的实力',
      descriptionEn: 'Challenge the legendary Cloud Temple and prove your strength',
      theme: 'cloud-temple',
      difficulty: 4,
      requiredEnergy: 25,
      totalQuestions: 8,
      requirements: { minLevel: 5, minPower: 45 },
      rewards: { coins: { min: 80, max: 150 }, exp: 85 },
      gameType: 'quiz',
    },
    {
      id: 8,
      name: '熊猫之巅',
      nameEn: 'Panda Summit',
      emoji: '🐼',
      description: '最终挑战！登上熊猫之巅成为最强',
      descriptionEn: 'Final challenge! Conquer the Panda Summit and become the strongest',
      theme: 'cloud-temple',
      difficulty: 5,
      requiredEnergy: 30,
      totalQuestions: 10,
      requirements: { minLevel: 6, minPower: 65 },
      rewards: { coins: { min: 120, max: 200 }, exp: 120 },
      gameType: 'quiz',
    },
  ]
}

export function getLevelById(id: number): AdventureLevel | undefined {
  return getAdventureLevels().find(l => l.id === id)
}

// --------------- 装备数据 ---------------

export function getEquipmentShop(): EquipmentItem[] {
  return [
    {
      id: 'bamboo-hat',
      name: '竹帽',
      nameEn: 'Bamboo Hat',
      emoji: '🎋',
      price: 60,
      slot: 'head',
      stats: { defense: 5, luck: 2 },
      description: '用竹叶编织的帽子，增加防御和幸运',
      descriptionEn: 'A hat woven from bamboo leaves, boosts defense and luck',
    },
    {
      id: 'bamboo-sword',
      name: '竹剑',
      nameEn: 'Bamboo Sword',
      emoji: '🗡️',
      price: 80,
      slot: 'weapon',
      stats: { power: 15 },
      description: '锋利的竹剑，提升攻击力',
      descriptionEn: 'A sharp bamboo sword that boosts attack power',
    },
    {
      id: 'bamboo-shield',
      name: '竹盾',
      nameEn: 'Bamboo Shield',
      emoji: '🛡️',
      price: 70,
      slot: 'shield',
      stats: { defense: 12 },
      description: '坚固的竹盾，大幅提升防御',
      descriptionEn: 'A sturdy bamboo shield that greatly boosts defense',
    },
    {
      id: 'lucky-charm',
      name: '幸运符',
      nameEn: 'Lucky Charm',
      emoji: '🍀',
      price: 60,
      slot: 'accessory',
      stats: { luck: 8 },
      description: '四叶草幸运符，提升幸运值',
      descriptionEn: 'A four-leaf clover charm that boosts luck',
    },
    {
      id: 'energy-belt',
      name: '能量腰带',
      nameEn: 'Energy Belt',
      emoji: '⚡',
      price: 100,
      slot: 'accessory',
      stats: { energy: 30 },
      description: '蕴含能量的腰带，增加能量上限',
      descriptionEn: 'An energy-infused belt that increases energy capacity',
    },
    {
      id: 'red-scarf',
      name: '红围巾',
      nameEn: 'Red Scarf',
      emoji: '🧣',
      price: 50,
      slot: 'body',
      stats: { defense: 5, power: 3 },
      description: '温暖的红色围巾，增加防御和少量攻击',
      descriptionEn: 'A warm red scarf that boosts defense and a bit of power',
    },
    {
      id: 'cool-glasses',
      name: '酷墨镜',
      nameEn: 'Cool Glasses',
      emoji: '🕶️',
      price: 65,
      slot: 'head',
      stats: { luck: 5, power: 5 },
      description: '酷酷的墨镜，增加幸运值和攻击力',
      descriptionEn: 'Cool shades that boost luck and power',
    },
    {
      id: 'golden-crown',
      name: '金皇冠',
      nameEn: 'Golden Crown',
      emoji: '👑',
      price: 150,
      slot: 'head',
      stats: { power: 10, defense: 10, luck: 10 },
      description: '闪耀的金皇冠，全面提升属性',
      descriptionEn: 'A shining golden crown that boosts all stats',
      requiredLevel: 5,
    },
    {
      id: 'bamboo-staff',
      name: '竹法杖',
      nameEn: 'Bamboo Staff',
      emoji: '🔮',
      price: 120,
      slot: 'weapon',
      stats: { power: 20, luck: 5 },
      description: '蕴含神秘力量的竹法杖，大幅提升攻击力',
      descriptionEn: 'A mysterious bamboo staff that greatly boosts power',
      requiredLevel: 3,
    },
    {
      id: 'jade-necklace',
      name: '玉项链',
      nameEn: 'Jade Necklace',
      emoji: '💎',
      price: 90,
      slot: 'accessory',
      stats: { luck: 10, energy: 15 },
      description: '精美的玉项链，提升幸运和能量上限',
      descriptionEn: 'An exquisite jade necklace that boosts luck and energy',
    },
  ]
}

// --------------- Redis 辅助函数 ---------------

function getRedisClient() {
  return getRedis()
}

async function getJson(key: string): Promise<unknown> {
  const redis = getRedisClient()
  if (!redis) return null
  try { return await redis.get(key) } catch { return null }
}

async function setJson(key: string, value: unknown): Promise<void> {
  const redis = getRedisClient()
  if (!redis) return
  try { await redis.set(key, JSON.stringify(value)) } catch { /* ignore */ }
}

// --------------- 能量系统 ---------------

export async function getEnergy(userId: string): Promise<PandaEnergy> {
  const key = `adventure:energy:${userId}`
  const data = await getJson(key)
  if (data && typeof data === 'object') {
    const e = data as Record<string, unknown>
    if (typeof e.current === 'number' && typeof e.max === 'number') {
      return e as unknown as PandaEnergy
    }
  }
  return { current: 100, max: 100 }
}

export async function calculateNaturalRegen(userId: string): Promise<number> {
  const energy = await getEnergy(userId)
  if (!energy.lastRegen) return 0

  const last = new Date(energy.lastRegen).getTime()
  const now = Date.now()
  const hoursPassed = (now - last) / (1000 * 60 * 60)
  const regained = Math.floor(hoursPassed * ADVENTURE_CONFIG.energy.regenPerHour)

  if (regained > 0) {
    const newCurrent = Math.min(energy.max, energy.current + regained)
    await updateEnergy(userId, newCurrent - energy.current)
    return regained
  }

  return 0
}

export async function updateEnergy(userId: string, delta: number): Promise<PandaEnergy> {
  const current = await getEnergy(userId)
  const newCurrent = Math.max(0, Math.min(current.max, current.current + delta))
  const updated: PandaEnergy = { ...current, current: newCurrent, lastRegen: new Date().toISOString() }
  await setJson(`adventure:energy:${userId}`, updated)
  return updated
}

export function gainEnergyFromActivity(activity: string): number {
  const gains: Record<string, number> = ADVENTURE_CONFIG.activities
  return gains[activity] || 0
}

// --------------- 关卡系统 ---------------

export async function getCompletedLevelIds(userId: string): Promise<number[]> {
  const key = `adventure:completed:${userId}`
  const data = await getJson(key)
  return (data && Array.isArray(data)) ? data as number[] : []
}

export async function getUnlockedLevels(userId: string): Promise<AdventureLevel[]> {
  const [completedLevels, petData] = await Promise.all([
    getCompletedLevelIds(userId),
    getPetLevel(userId),
  ])

  const petLevel = petData.level
  const allLevels = getAdventureLevels()

  return allLevels.filter(level => {
    const levelReq = level.requirements.minLevel || 1
    if (petLevel < levelReq) return false
    // Level 1 is always unlocked; others require the previous level completed
    if (level.id > 1) {
      const prevCompleted = completedLevels.includes(level.id - 1)
      const selfCompleted = completedLevels.includes(level.id)
      if (!prevCompleted && !selfCompleted) return false
    }
    return true
  })
}

export async function startLevel(userId: string, levelId: number): Promise<{
  success: boolean
  message: string
  energyLeft?: number
  requires?: Record<string, unknown>
}> {
  const level = getLevelById(levelId)
  if (!level) return { success: false, message: 'Level not found' }

  const energy = await getEnergy(userId)
  if (energy.current < level.requiredEnergy) {
    return {
      success: false,
      message: 'Not enough energy! Complete learning activities to recharge.',
      requires: { energy: level.requiredEnergy - energy.current },
    }
  }

  const updated = await updateEnergy(userId, -level.requiredEnergy)
  return { success: true, message: 'Level started!', energyLeft: updated.current }
}

export async function completeLevel(
  userId: string,
  levelId: number,
  result: { score: number; correctCount: number; totalCount: number }
): Promise<{
  success: boolean
  message: string
  rewards?: { coins: number; exp: number }
  levelUp?: boolean
}> {
  const level = getLevelById(levelId)
  if (!level) return { success: false, message: 'Level not found' }

  const completedKey = `adventure:completed:${userId}`
  const completedData = await getJson(completedKey)
  const completedList: number[] = (completedData && Array.isArray(completedData)) ? completedData as number[] : []

  if (!completedList.includes(levelId)) {
    completedList.push(levelId)
    await setJson(completedKey, completedList)
  }

  const accuracy = result.totalCount > 0 ? result.correctCount / result.totalCount : 0
  const coinsEarned = Math.floor(
    level.rewards.coins.min + (level.rewards.coins.max - level.rewards.coins.min) * accuracy
  )
  const expEarned = level.rewards.exp + Math.floor(10 * accuracy)

  // Add coins using existing coins API
  try { await addCoins(userId, coinsEarned) } catch { /* ignore */ }

  const petResult = await addPetExperience(userId, expEarned)

  return {
    success: true,
    message: `Level ${levelId} completed!`,
    rewards: { coins: coinsEarned, exp: expEarned },
    levelUp: petResult.leveledUp,
  }
}

// --------------- 装备系统 ---------------

export async function getOwnedItems(userId: string): Promise<string[]> {
  const key = `adventure:items:${userId}`
  const data = await getJson(key)
  return (data && Array.isArray(data)) ? data as string[] : []
}

export async function getEquippedItems(userId: string): Promise<string[]> {
  const key = `adventure:equipped:${userId}`
  const data = await getJson(key)
  return (data && Array.isArray(data)) ? data as string[] : []
}

export async function calculateTotalStats(userId: string): Promise<{
  power: number; defense: number; luck: number; energy: number
}> {
  const equippedIds = await getEquippedItems(userId)
  const allItems = getEquipmentShop()
  const petData = await getPetLevel(userId)

  const stats = { power: petData.level * 2, defense: petData.level * 2, luck: 0, energy: 100 }

  for (const id of equippedIds) {
    const item = allItems.find(i => i.id === id)
    if (item) {
      stats.power += item.stats.power || 0
      stats.defense += item.stats.defense || 0
      stats.luck += item.stats.luck || 0
      stats.energy += item.stats.energy || 0
    }
  }

  return stats
}

export async function buyEquipment(userId: string, itemId: string): Promise<{
  success: boolean
  message: string
  item?: EquipmentItem
  coinsLeft?: number
  requires?: Record<string, unknown>
}> {
  const shop = getEquipmentShop()
  const item = shop.find(i => i.id === itemId)
  if (!item) return { success: false, message: 'Item not found' }

  if (item.requiredLevel) {
    const pet = await getPetLevel(userId)
    if (pet.level < item.requiredLevel) {
      return { success: false, message: `Requires level ${item.requiredLevel}`, requires: { level: item.requiredLevel - pet.level } }
    }
  }

  try {
    const balance = await getCoins(userId)
    if (balance < item.price) {
      return { success: false, message: 'Not enough coins', requires: { coins: item.price - balance } }
    }

    await addCoins(userId, -item.price)

    const ownedKey = `adventure:items:${userId}`
    const ownedData = await getJson(ownedKey)
    const owned: string[] = (ownedData && Array.isArray(ownedData)) ? ownedData as string[] : []
    owned.push(itemId)
    await setJson(ownedKey, owned)

    const coinsLeft = await getCoins(userId)
    return { success: true, message: `Purchased ${item.name}`, item, coinsLeft }
  } catch {
    return { success: false, message: 'Transaction failed' }
  }
}

export async function equipItem(userId: string, itemId: string, shouldEquip: boolean): Promise<{
  success: boolean
  message: string
  equipped?: string[]
}> {
  const ownedKey = `adventure:items:${userId}`
  const ownedData = await getJson(ownedKey)
  const owned: string[] = (ownedData && Array.isArray(ownedData)) ? ownedData as string[] : []

  if (!owned.includes(itemId)) {
    return { success: false, message: 'You do not own this item' }
  }

  const key = `adventure:equipped:${userId}`
  const equipped = await getEquippedItems(userId)

  if (shouldEquip) {
    const shop = getEquipmentShop()
    const item = shop.find(i => i.id === itemId)
    if (item) {
      const filtered = equipped.filter(id => {
        const other = shop.find(i => i.id === id)
        return other?.slot !== item.slot
      })
      filtered.push(itemId)
      await setJson(key, filtered)
      return { success: true, message: 'Item equipped', equipped: filtered }
    }
  } else {
    const filtered = equipped.filter(id => id !== itemId)
    await setJson(key, filtered)
    return { success: true, message: 'Item unequipped', equipped: filtered }
  }

  return { success: false, message: 'Operation failed' }
}

// --------------- 宠物等级系统 ---------------

export async function getPetLevel(userId: string): Promise<PetLevelData> {
  const key = `adventure:pet:${userId}`
  const data = await getJson(key)
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    if (typeof d.level === 'number' && typeof d.exp === 'number') {
      return { level: d.level, exp: d.exp, expToNext: getExpToNext(d.level) }
    }
  }
  return { level: 1, exp: 0, expToNext: 100 }
}

export async function addPetExperience(userId: string, exp: number): Promise<{
  newLevel: number
  newExp: number
  leveledUp: boolean
}> {
  const petData = await getPetLevel(userId)
  let leveledUp = false
  let { level, exp: currentExp } = petData
  let expToNext = getExpToNext(level)

  currentExp += exp

  while (currentExp >= expToNext && level < ADVENTURE_CONFIG.pet.maxLevel) {
    currentExp -= expToNext
    level++
    expToNext = getExpToNext(level)
    leveledUp = true
  }

  const key = `adventure:pet:${userId}`
  await setJson(key, { level, exp: currentExp, expToNext })

  return { newLevel: level, newExp: currentExp, leveledUp }
}

function getExpToNext(level: number): number {
  return Math.floor(ADVENTURE_CONFIG.pet.expPerLevel * Math.pow(ADVENTURE_CONFIG.pet.expMultiplier, level - 1))
}
