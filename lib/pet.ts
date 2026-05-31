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
    return await getRedisInventory(userId)
  } catch { return null }
}

// 保存库存到 Redis
async function saveRedisInventory(inv: Inventory) {
  const userId = getCurrentUserId()
  if (!userId) return
  try {
    await setRedisInventory(userId, inv)
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

/** Get current pet with decay applied (双写模式) */
export async function getPet(): Promise<PetState> {
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
export async function feedPet(foodId: string): Promise<{ pet: PetState; inventory: Inventory; message: string }> {
  const pet = await getPet()
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
  await saveRedisPet(updatedPet)
  await saveRedisInventory(updatedInv)

  return {
    pet: updatedPet,
    inventory: updatedInv,
    message: `${item.name} +${item.effect.hunger || 0} hunger, +${item.effect.happiness || 0} happiness!`,
  }
}

// ---- Inventory (双写模式) ----

export function getInventory(): Inventory {
  return getInventoryRaw()
}

export function getCoins(): number {
  return getInventoryRaw().coins
}

export async function addCoins(amount: number): Promise<number> {
  const inv = getInventoryRaw()
  const newCoins = inv.coins + amount
  const updatedInv = { ...inv, coins: newCoins }
  saveInventory(updatedInv)
  await saveRedisInventory(updatedInv)
  return newCoins
}

// 兼容旧版
export function addCoinsSync(amount: number): number {
  const inv = getInventoryRaw()
  const newCoins = inv.coins + amount
  saveInventory({ ...inv, coins: newCoins })
  return newCoins
}

export async function spendCoins(amount: number): Promise<boolean> {
  const inv = getInventoryRaw()
  if (inv.coins < amount) return false
  const updatedInv = { ...inv, coins: inv.coins - amount }
  saveInventory(updatedInv)
  await saveRedisInventory(updatedInv)
  return true
}

// 兼容旧版
export function spendCoinsSync(amount: number): boolean {
  const inv = getInventoryRaw()
  if (inv.coins < amount) return false
  saveInventory({ ...inv, coins: inv.coins - amount })
  return true
}

export async function buyFood(foodId: string, quantity: number = 1): Promise<boolean> {
  const item = FOOD_ITEMS.find((f) => f.id === foodId)
  if (!item) return false

  const totalPrice = item.price * quantity
  const inv = getInventoryRaw()
  if (inv.coins < totalPrice) return false

  const newFood = { ...inv.food }
  newFood[foodId] = (newFood[foodId] || 0) + quantity
  const updatedInv = { ...inv, coins: inv.coins - totalPrice, food: newFood }

  saveInventory(updatedInv)
  await saveRedisInventory(updatedInv)
  return true
}

export async function buyAccessory(accessoryId: string): Promise<boolean> {
  const item = ACCESSORY_ITEMS.find((a) => a.id === accessoryId)
  if (!item) return false

  const inv = getInventoryRaw()
  if (inv.coins < item.price) return false

  const newAcc = { ...inv.accessories, [accessoryId]: true }
  const updatedInv = { ...inv, coins: inv.coins - item.price, accessories: newAcc }

  saveInventory(updatedInv)
  await saveRedisInventory(updatedInv)
  return true
}

export async function toggleEquip(accessoryId: string): Promise<Inventory> {
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
  await saveRedisInventory(updatedInv)
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
  if (hunger <= 0) return '😵 Starving! Feed me!'
  if (hunger <= 30) return '😟 Hungry...'
  if (hunger <= 60) return '🙂 Okay'
  if (happiness <= 0) return '😢 Very unhappy'
  if (happiness <= 30) return '😐 A bit bored'
  if (hunger >= 80 && happiness >= 80) return '🥰 Happy panda!'
  return '😊 Content'
}
