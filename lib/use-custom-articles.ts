'use client'

import { useState, useEffect } from 'react'
import type { Article } from './types'
import { getCustomArticles } from './custom-articles'

export function useCustomArticles(base: Article[]): Article[] {
  const [merged, setMerged] = useState(base)

  useEffect(() => {
    const custom = getCustomArticles()
    setMerged(custom.length > 0 ? [...base, ...custom] : base)
  }, [base])

  return merged
}
