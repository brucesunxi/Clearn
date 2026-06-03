import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLevelById } from '@/lib/adventure'
import AdventureGameQuiz from '@/components/AdventureGameQuiz'
import AdventureGamePuzzle from '@/components/AdventureGamePuzzle'
import AdventureGameMaze from '@/components/AdventureGameMaze'

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

  switch (level.gameType) {
    case 'puzzle':
      return <AdventureGamePuzzle level={level} />
    case 'maze':
      return <AdventureGameMaze level={level} />
    case 'quiz':
    default:
      return <AdventureGameQuiz level={level} />
  }
}
