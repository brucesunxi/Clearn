'use client'

import { getPet as getRedisPet, setPet as setRedisPet, getInventory as getRedisInventory, setInventory as setRedisInventory } from './redis'

const PET_KEY = 'panda-pet'
const INVENTORY_KEY = 'panda-inventory'

// 获取当前用户ID
function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('chineselearn-user-id')
}

export interface PetState {
  hunger: number
  happiness: number
  lastUpdated: string
}

export interface Inventory {
  coins: number
  food: Record<string, number>
  accessories: Record<string, boolean>
  equipped: string[]
}

export interface ShopItem {
  id: string
  name: string
  emoji: string
  price: number
  type: 'food' | 'accessory'
  effect?: { hunger?: number; happiness?: number }
  description?: string
}

// ---- Shop Data ----

export const FOOD_ITEMS: ShopItem[] = [
  { id: 'bamboo', name: 'Bamboo', emoji: '🎋', price: 15, type: 'food', effect: { hunger: 30, happiness: 5 }, description: 'Panda\'s favorite! Fills hunger a lot.' },
  { id: 'rice', name: 'Rice Ball', emoji: '🍙', price: 10, type: 'food', effect: { hunger: 20 }, description: 'Simple and filling.' },
  { id: 'dumpling', name: 'Dumplings', emoji: '🥟', price: 25, type: 'food', effect: { hunger: 25, happiness: 10 }, description: 'Yummy and makes panda happy!' },
  { id: 'cake', name: 'Cake', emoji: '🍰', price: 30, type: 'food', effect: { hunger: 15, happiness: 20 }, description: 'Sweet treat! Boosts happiness.' },
  { id: 'milk', name: 'Milk Tea', emoji: '🧋', price: 20, type: 'food', effect: { hunger: 10, happiness: 15 }, description: 'Warm and comforting.' },
]

export const ACCESSORY_ITEMS: ShopItem[] = [
  { id: 'red_scarf', name: 'Red Scarf', emoji: '🧣', price: 50, type: 'accessory', description: 'A warm red scarf.' },
  { id: 'bamboo_hat', name: 'Bamboo Hat', emoji: '🎩', price: 40, type: 'accessory', description: 'A stylish bamboo hat.' },
  { id: 'glasses', name: 'Cool Glasses', emoji: '👓', price: 60, type: 'accessory', description: 'Makes panda look smart!' },
  { id: 'bowtie', name: 'Red Bow Tie', emoji: '🎀', price: 45, type: 'accessory', description: 'Classy and cute.' },
  { id: 'crown', name: 'Golden Crown', emoji: '👑', price: 120, type: 'accessory', description: 'The ultimate bling!' },
  { id: 'necklace', name: 'Jade Necklace', emoji: '📿', price: 80, type: 'accessory', description: 'A beautiful jade pendant.' },
]

const HOUR_DECAY_HUNGER = 2
const HOUR_DECAY_HAPPINESS = 1

// ---- Initialization ----

function defaultPet(): PetState {
  return { hunger: 100, happiness: 100, lastUpdated: new Date().toISOString() }
}

function defaultInventory(): Inventory {
  return { coins: 500, food: { bamboo: 2 }, accessories: {}, equipped: [] }
}

// ---- Pet State ----

function getPetRaw(): PetState {
  if (typeof window === 'undefined') return defaultPet()
  const raw = localStorage.getItem(PET_KEY)
  if (raw) {
    try { return JSON.parse(raw) as PetState } catch { /* fall through */ }
  }
  return defaultPet()
}

function getInventoryRaw(): Inventory {
  if (typeof window === 'undefined') return defaultInventory()
  const raw = localStorage.getItem(INVENTORY_KEY)
  if (raw) {
    try { return JSON.parse(raw) as Inventory } catch { /* fall through */ }
  }
  return defaultInventory()
}

function savePet(state: PetState) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PET_KEY, JSON.stringify(state))
}

function saveInventory(inv: Inventory) {
  if (typeof window === 'undefined') return
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv))
}

// 从 Redis 获取宠物状态
async function getRedisPetState(): Promise<PetState | null> {
  const userId = getCurrentUserId()
  if (!userId) return null
  try {
    return await getRedisPet(userId)
  } catch { return null }
}

// 保存宠物状态到 Redis
async function saveRedisPet(state: PetState) {
  const userId = getCurrentUserId()
  if (!userId) return
  try {
    await setRedisPet(userId, state)
  } catch { /* ignore */ }
}

// 从 Redis 获取库存
async function getRedisInventoryState(): Promise<Inventory | null> {
  const userId = getCurrentUserId()
  if (!userId) return null
  try {
    const data = await getRedisInventory(userId)
    if (!data) return null
    // 转换 InventoryData 为 Inventory
    return {
      coins: 0, // InventoryData 中没有 coins，从本地获取
      food: data.food,
      accessories: data.accessories,
      equipped: data.equipped,
    }
  } catch { return null }
}

// 保存库存到 Redis
async function saveRedisInventory(inv: Inventory) {
  const userId = getCurrentUserId()
  if (!userId) return
  try {
    // 转换为 InventoryData
    const data = {
      food: inv.food,
      accessories: inv.accessories,
      equipped: inv.equipped,
    }
    await setRedisInventory(userId, data)
  } catch { /* ignore */ }
}

/** Calculate decay since last login */
function applyDecay(pet: PetState): PetState {
  const now = new Date()
  const last = new Date(pet.lastUpdated)
  const hoursPassed = (now.getTime() - last.getTime()) / (1000 * 60 * 60)

  if (hoursPassed <= 0) return pet

  const hungerDecay = Math.floor(hoursPassed * HOUR_DECAY_HUNGER)
  const happinessDecay = Math.floor(hoursPassed * HOUR_DECAY_HAPPINESS)

  return {
    hunger: Math.max(0, pet.hunger - hungerDecay),
    happiness: Math.max(0, pet.happiness - happinessDecay),
    lastUpdated: now.toISOString(),
  }
}

/** Get current pet with decay applied (同步版本供组件使用) */
export function getPet(): PetState {
  const pet = getPetRaw()
  const updated = applyDecay(pet)
  if (updated.hunger !== pet.hunger || updated.happiness !== pet.happiness) {
    savePet(updated)
    // 异步同步到 Redis
    saveRedisPet(updated).catch(() => {})
  }
  return updated
}

/** Get current pet with decay applied (异步版本优先 Redis) */
export async function getPetAsync(): Promise<PetState> {
  // 优先从 Redis 获取
  const redisPet = await getRedisPetState()
  const pet = redisPet || getPetRaw()
  const updated = applyDecay(pet)

  if (updated.hunger !== pet.hunger || updated.happiness !== pet.happiness) {
    savePet(updated)
    await saveRedisPet(updated)
  }

  return updated
}

/** Sync a coin reward to API/Redis (兼容旧版) */
export function syncCoinsToApi(earnedAmount: number, reason: string = 'earn', detail?: string) {
  if (typeof window === 'undefined') return
  const userId = localStorage.getItem('chineselearn-user-id')
  if (!userId) return
  fetch('/api/coins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ amount: earnedAmount, reason, detail }),
  }).catch(() => {})
}

/** Sync a coin spend to API/Redis (兼容旧版) */
export function syncSpendToApi(amount: number, reason: string = 'spend', detail?: string) {
  if (typeof window === 'undefined') return
  const userId = localStorage.getItem('chineselearn-user-id')
  if (!userId) return
  fetch('/api/coins/spend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ amount, reason, detail }),
  }).catch(() => {})
}

// 兼容旧版同步函数
export function getPetSync(): PetState {
  const pet = getPetRaw()
  const updated = applyDecay(pet)
  if (updated.hunger !== pet.hunger || updated.happiness !== pet.happiness) {
    savePet(updated)
  }
  return updated
}

/** Feed the pet */
export function feedPet(foodId: string): { pet: PetState; inventory: Inventory; message: string } {
  const pet = getPet()
  const inv = getInventoryRaw()
  const qty = inv.food[foodId] || 0

  if (qty <= 0) {
    return { pet, inventory: inv, message: "You don't have this food!" }
  }

  const item = FOOD_ITEMS.find((f) => f.id === foodId)
  if (!item || !item.effect) {
    return { pet, inventory: inv, message: 'Unknown food!' }
  }

  // Apply effects
  const updatedPet: PetState = {
    hunger: Math.min(100, pet.hunger + (item.effect.hunger || 0)),
    happiness: Math.min(100, pet.happiness + (item.effect.happiness || 0)),
    lastUpdated: new Date().toISOString(),
  }

  // Consume food
  const newFood = { ...inv.food }
  newFood[foodId] = qty - 1

  const updatedInv = { ...inv, food: newFood }

  // 双写保存
  savePet(updatedPet)
  saveInventory(updatedInv)
  saveRedisPet(updatedPet).catch(() => {})
  saveRedisInventory(updatedInv).catch(() => {})

  return {
    pet: updatedPet,
    inventory: updatedInv,
    message: `${item.name} +${item.effect.hunger || 0} energy, +${item.effect.happiness || 0} mood!`,
  }
}

// ---- Inventory (双写模式) ----

export function getInventory(): Inventory {
  return getInventoryRaw()
}

export function getCoins(): number {
  return getInventoryRaw().coins
}

// 使用 sync 版本作为默认导出，内部会异步同步到 Redis
export function addCoins(amount: number): number {
  const inv = getInventoryRaw()
  const newCoins = inv.coins + amount
  const updatedInv = { ...inv, coins: newCoins }
  saveInventory(updatedInv)
  // 异步同步到 Redis
  saveRedisInventory(updatedInv).catch(() => {})
  return newCoins
}

export function spendCoins(amount: number): boolean {
  const inv = getInventoryRaw()
  if (inv.coins < amount) return false
  const updatedInv = { ...inv, coins: inv.coins - amount }
  saveInventory(updatedInv)
  // 异步同步到 Redis
  saveRedisInventory(updatedInv).catch(() => {})
  return true
}

export function buyFood(foodId: string, quantity: number = 1): boolean {
  const item = FOOD_ITEMS.find((f) => f.id === foodId)
  if (!item) return false

  const totalPrice = item.price * quantity
  const inv = getInventoryRaw()
  if (inv.coins < totalPrice) return false

  const newFood = { ...inv.food }
  newFood[foodId] = (newFood[foodId] || 0) + quantity
  const updatedInv = { ...inv, coins: inv.coins - totalPrice, food: newFood }

  saveInventory(updatedInv)
  saveRedisInventory(updatedInv).catch(() => {})
  return true
}

export function buyAccessory(accessoryId: string): boolean {
  const item = ACCESSORY_ITEMS.find((a) => a.id === accessoryId)
  if (!item) return false

  const inv = getInventoryRaw()
  if (inv.coins < item.price) return false

  const newAcc = { ...inv.accessories, [accessoryId]: true }
  const updatedInv = { ...inv, coins: inv.coins - item.price, accessories: newAcc }

  saveInventory(updatedInv)
  saveRedisInventory(updatedInv).catch(() => {})
  return true
}

export function toggleEquip(accessoryId: string): Inventory {
  const inv = getInventoryRaw()
  const owned = inv.accessories[accessoryId]
  if (!owned) return inv

  let newEquipped: string[]
  if (inv.equipped.includes(accessoryId)) {
    newEquipped = inv.equipped.filter((id) => id !== accessoryId)
  } else {
    newEquipped = [...inv.equipped, accessoryId]
  }

  const updatedInv = { ...inv, equipped: newEquipped }
  saveInventory(updatedInv)
  saveRedisInventory(updatedInv).catch(() => {})
  return updatedInv
}

// 迁移函数
export async function migratePetToRedis(userId: string): Promise<void> {
  const pet = getPetRaw()
  const inv = getInventoryRaw()
  try {
    await setRedisPet(userId, pet)
    await setRedisInventory(userId, inv)
  } catch { /* ignore */ }
}

// ---- Pet interaction ----

export function petStatsText(pet: PetState): string {
  const { hunger, happiness } = pet
  if (hunger <= 0) return '😵 Need a break...'
  if (hunger <= 30) return '😟 Feeling low...'
  if (hunger <= 60) return '🙂 Okay'
  if (happiness <= 0) return '😢 Very down'
  if (happiness <= 30) return '😐 A bit bored'
  if (hunger >= 80 && happiness >= 80) return '🥰 Happy panda!'
  return '😊 Content'
}
