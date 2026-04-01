/**
 * หน้าเลือกรอบยี่กี — แสดงรอบที่กำลัง shooting + รอบถัดไป
 *
 * เรียก API: yeekeeApi.getRounds() → standalone-member-api (#3)
 * กดเลือกรอบ → ไป /yeekee/play?round=ID
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { yeekeeApi } from '@/lib/api'
import type { YeekeeRound } from '@/types'

export default function YeekeeRoomPage() {
  const [rounds, setRounds] = useState<YeekeeRound[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = () => {
      yeekeeApi.getRounds()
        .then(res => setRounds(res.data.data || []))
        .finally(() => setLoading(false))
    }
    load()
    const interval = setInterval(load, 10000) // refresh ทุก 10 วินาที
    return () => clearInterval(interval)
  }, [])

  const statusLabels: Record<string, string> = {
    waiting: 'รอเริ่ม',
    shooting: 'กำลังยิง',
    calculating: 'กำลังคำนวณ',
    resulted: 'ออกผลแล้ว',
  }
  const statusColors: Record<string, string> = {
    waiting: 'text-gray-400',
    shooting: 'text-green-400',
    calculating: 'text-yellow-400',
    resulted: 'text-blue-400',
  }

  if (loading) return <div className="p-6 text-center text-gray-400">กำลังโหลด...</div>

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-4">🎯 ยี่กี — เลือกรอบ</h1>

      {rounds.length === 0 ? (
        <div className="text-center text-gray-500 py-10">ยังไม่มีรอบยี่กี</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {rounds.map(round => (
            <Link
              key={round.id}
              href={round.status === 'shooting' ? `/yeekee/play?round=${round.id}` : '#'}
              className={`bg-gray-800 rounded-xl p-4 transition border-2
                ${round.status === 'shooting'
                  ? 'border-green-500/50 hover:border-green-400 cursor-pointer'
                  : 'border-gray-700 opacity-60 cursor-not-allowed'}`}
            >
              <div className="text-center">
                <div className="text-white font-bold text-lg">รอบ {round.round_no}</div>
                <div className={`text-sm font-semibold mt-1 ${statusColors[round.status]}`}>
                  {round.status === 'shooting' && '🟢 '}{statusLabels[round.status]}
                </div>
                <div className="text-gray-500 text-xs mt-2">
                  {new Date(round.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  {' — '}
                  {new Date(round.end_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </div>
                {round.shoot_count > 0 && (
                  <div className="text-gray-400 text-xs mt-1">ยิงแล้ว {round.shoot_count} เลข</div>
                )}
                {round.result_number && (
                  <div className="text-yellow-400 font-mono font-bold mt-1">{round.result_number}</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
