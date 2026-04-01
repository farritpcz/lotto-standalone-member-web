/**
 * หน้าเลือกรอบยี่กี (แบบเจริญดี88 — teal theme)
 *
 * เรียก API: yeekeeApi.getRounds() → standalone-member-api (#3)
 * กดเลือกรอบ → ไป /yeekee/play?round=ID
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { yeekeeApi } from '@/lib/api'
import type { YeekeeRound } from '@/types'

const statusLabels: Record<string, string> = {
  waiting: 'รอเริ่ม', shooting: 'กำลังยิง', calculating: 'กำลังคำนวณ', resulted: 'ออกผลแล้ว',
}

export default function YeekeeRoomPage() {
  const [rounds, setRounds] = useState<YeekeeRound[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = () => {
      yeekeeApi.getRounds()
        .then(res => setRounds(res.data.data || []))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <Link href="/lobby" className="text-muted">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold">ยี่กี — เลือกรอบ</h1>
      </div>

      {rounds.length === 0 ? (
        <div className="px-4">
          <div className="card p-8 text-center">
            <p className="text-3xl mb-2">🎯</p>
            <p className="text-muted text-sm">ยังไม่มีรอบยี่กี</p>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-4 grid grid-cols-2 gap-3">
          {rounds.map(round => {
            const isShooting = round.status === 'shooting'
            return (
              <Link
                key={round.id}
                href={isShooting ? `/yeekee/play?round=${round.id}` : '#'}
                className={`card p-4 text-center transition-all border-2 ${
                  isShooting
                    ? 'border-green-400 shadow-md'
                    : 'border-transparent opacity-60'
                }`}
                style={{ pointerEvents: isShooting ? 'auto' : 'none' }}
              >
                <div className="font-bold text-base mb-1">รอบ {round.round_no}</div>
                <div className={`text-xs font-semibold mb-2 ${
                  isShooting ? 'text-green-600' : 'text-muted'
                }`}>
                  {isShooting && '● '}{statusLabels[round.status]}
                </div>
                <div className="text-muted text-[10px]">
                  {new Date(round.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  {' — '}
                  {new Date(round.end_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </div>
                {round.shoot_count > 0 && (
                  <div className="text-muted text-[10px] mt-1">ยิงแล้ว {round.shoot_count} เลข</div>
                )}
                {round.result_number && (
                  <div className="font-mono font-bold mt-1" style={{ color: 'var(--color-gold)' }}>
                    {round.result_number}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
