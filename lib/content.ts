import fs from 'fs'
import path from 'path'
import type { Article, Level } from './types'
import levelsData from '@/content/levels.json'

const CONTENT_DIR = path.join(process.cwd(), 'content')

export type { Article, Level }

export function getLevels(): Level[] {
  return levelsData as Level[]
}

export function getLevel(id: number): Level | undefined {
  return levelsData.find((l) => l.id === id) as Level | undefined
}

function getLevelDir(levelId: number): string {
  return path.join(CONTENT_DIR, `level-${levelId}`)
}

export function getArticlesByLevel(levelId: number): Article[] {
  const dir = getLevelDir(levelId)
  if (!fs.existsSync(dir)) return []

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
  const articles: Article[] = []

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8')
    articles.push(JSON.parse(content) as Article)
  }

  return articles.sort((a, b) => a.id.localeCompare(b.id))
}

export function getAllArticles(): Article[] {
  const levels = getLevels()
  const all: Article[] = []
  for (const level of levels) {
    all.push(...getArticlesByLevel(level.id))
  }
  return all
}

export function getArticle(id: string): Article | null {
  const levels = getLevels()
  for (const level of levels) {
    const articles = getArticlesByLevel(level.id)
    const found = articles.find((a) => a.id === id)
    if (found) return found
  }
  return null
}
