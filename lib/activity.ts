'use client'

export type ActionType =
  | 'study_complete'
  | 'quiz_complete'
  | 'battle_complete'
  | 'listen_complete'
  | 'speak_complete'
  | 'checkin'
  | 'box_open'
  | 'pet_feed'
  | 'shop_purchase'
  | 'article_read'
  | 'material_import'
  | 'intensive_listen'
  | 'adventure_level_complete'

export function trackActivity(action: ActionType, detail?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return

  const controller = new AbortController()
  setTimeout(() => controller.abort(), 3000)

  fetch('/api/activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      detail: detail ? JSON.stringify(detail) : '',
    }),
    signal: controller.signal,
  }).catch(() => {})
}
