export interface Level {
  id: number
  name: string
  emoji: string
  color: string
  description: string
  ageRange: string
  charCount: string
}

export interface Paragraph {
  text: string
  translation: string
}

export interface VocabularyItem {
  word: string
  pinyin: string
  meaning: string
  tips?: string
}

export interface Article {
  id: string
  title: string
  titleEn: string
  level: number
  emoji: string
  paragraphs: Paragraph[]
  vocabulary: VocabularyItem[]
}
