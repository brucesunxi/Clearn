'use client'

import { useState } from 'react'
import { getCheckInData, getMonthData } from '@/lib/checkin'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function CheckInCalendar() {
  const [checkin] = useState(() => getCheckInData())
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const days = getMonthData(year, month)
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800">学习打卡</h2>
        <p className="text-sm text-gray-400">
          完成一轮单词学习自动打卡，坚持就是胜利
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-6 mb-5">
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-500">{checkin.currentStreak}</div>
          <div className="text-xs text-gray-400">🔥 连续天数</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">{checkin.history.length}</div>
          <div className="text-xs text-gray-400">📅 累计天数</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-500">{checkin.longestStreak}</div>
          <div className="text-xs text-gray-400">🏆 最长记录</div>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => {
            if (month === 1) {
              setYear(year - 1)
              setMonth(12)
            } else {
              setMonth(month - 1)
            }
          }}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          ◀
        </button>
        <span className="text-sm font-medium text-gray-700">
          {year}年{month}月
        </span>
        <button
          onClick={() => {
            if (month === 12) {
              setYear(year + 1)
              setMonth(1)
            } else {
              setMonth(month + 1)
            }
          }}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          ▶
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
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
