import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLevelById } from '@/lib/adventure'
import AdventureGameQuiz from '@/components/AdventureGameQuiz'

interface PlayPageProps {
  params: { levelId: string }
}

export async function generateMetadata({ params }: PlayPageProps): Promise<Metadata> {
  const level = getLevelById(parseInt(params.levelId))
  if (!level) {
    return { title: 'Level Not Found' }
  }

  return {
    title: `${level.name} ${level.nameEn} - Adventure`,
    description: `Challenge ${level.nameEn}! ${level.description}`,
  }
}

export default function PlayPage({ params }: PlayPageProps) {
  const levelId = parseInt(params.levelId)
  const level = getLevelById(levelId)

  if (!level) {
    notFound()
  }

  // Render different game types
  switch (level.gameType) {
    case 'quiz':
      return <AdventureGameQuiz level={level} />
    // Add other game types here
    default:
      return <AdventureGameQuiz level={level} />
  }
}
