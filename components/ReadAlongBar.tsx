'use client'

interface ReadAlongBarProps {
  playState: 'stopped' | 'playing' | 'paused'
  speed: number
  current: number
  total: number
  locale: 'zh' | 'en'
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onSpeedChange: (speed: number) => void
}

const SPEEDS = [0.75, 1, 1.25, 1.5]

export default function ReadAlongBar({
  playState, speed, current, total, locale,
  onPlay, onPause, onStop, onSpeedChange,
}: ReadAlongBarProps) {
  return (
    <div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center gap-3">
        {/* Play / Pause */}
        <button
          onClick={playState === 'playing' ? onPause : onPlay}
          className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shrink-0 transition-colors"
          title={playState === 'playing' ? (locale === 'zh' ? '暂停' : 'Pause') : (locale === 'zh' ? '播放' : 'Play')}
        >
          {playState === 'playing' ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>

        {/* Stop */}
        <button
          onClick={onStop}
          disabled={playState === 'stopped'}
          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center shrink-0 transition-colors disabled:opacity-30"
          title={locale === 'zh' ? '停止' : 'Stop'}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
        </button>

        {/* Progress */}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 mb-1">
            {locale === 'zh'
              ? `第 ${Math.min(current + 1, total)} / ${total} 句`
              : `Sentence ${Math.min(current + 1, total)} / ${total}`}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${total > 0 ? (current / total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-1 shrink-0">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                speed === s
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
