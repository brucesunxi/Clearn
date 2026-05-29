'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { getCheckInData, getMonthData } from '@/lib/checkin'

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAYS_ZH = ['日', '一', '二', '三', '四', '五', '六']

export default function CheckInCalendar() {
  const { locale, t } = useTranslation()
  const [checkin] = useState(() => getCheckInData())
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth() + 1)

  const days = getMonthData(year, month)
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
  const weekdays = locale === 'zh' ? WEEKDAYS_ZH : WEEKDAYS_EN

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800">{t('checkin.title')}</h2>
        <p className="text-sm text-gray-400">{t('checkin.desc')}</p>
      </div>

      <div className="flex gap-6 mb-5">
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-500">{checkin.currentStreak}</div>
          <div className="text-xs text-gray-400">🔥 {t('checkin.streak')}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">{checkin.history.length}</div>
          <div className="text-xs text-gray-400">📅 {t('checkin.total')}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-500">{checkin.longestStreak}</div>
          <div className="text-xs text-gray-400">🏆 {t('checkin.best')}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => {
            if (month === 1) { setYear(year - 1); setMonth(12) }
            else setMonth(month - 1)
          }}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          ◀
        </button>
        <span className="text-sm font-medium text-gray-700" suppressHydrationWarning>
          {locale === 'zh' ? `${year}年${month}月` : `${month}/${year}`}
        </span>
        <button
          onClick={() => {
            if (month === 12) { setYear(year + 1); setMonth(1) }
            else setMonth(month + 1)
          }}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          ▶
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekdays.map((w) => (
          <div key={w} className="text-center text-xs text-gray-400 py-1 font-medium">
            {w}
          </div>
        ))}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((d) => {
          const dateNum = parseInt(d.date.split('-')[2])
          return (
            <div
              key={d.date}
              className={`aspect-square rounded-lg flex items-center justify-center text-sm ${
                d.checked ? 'bg-green-100' : 'text-gray-400'
              }`}
            >
              {d.checked ? '🟢' : dateNum}
            </div>
          )
        })}
      </div>
    </div>
  )
}
