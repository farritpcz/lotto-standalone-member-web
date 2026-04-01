/**
 * หน้ายิงเลขยี่กี — real-time WebSocket (แบบเจริญดี88 — teal theme)
 *
 * Features:
 * - กดเลข 5 หลัก → ยิงผ่าน WebSocket
 * - เห็นเลขที่คนอื่นยิง live
 * - Countdown timer
 * - ผลออกทันทีเมื่อหมดเวลา
 *
 * ⭐ ใช้ useWebSocket hook + provider-game-web (#8) share ได้
 */

'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import NumberPad from '@/components/number-pad/NumberPad'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { WSMessage } from '@/types'

interface ShootItem {
  member_username: string
  number: string
  shot_at: string
}

interface ResultInfo {
  result_number: string
  top3: string
  top2: string
  bottom2: string
}

function YeekeePlayContent() {
  const searchParams = useSearchParams()
  const roundId = Number(searchParams.get('round'))

  const [shoots, setShoots] = useState<ShootItem[]>([])
  const [totalSum, setTotalSum] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [result, setResult] = useState<ResultInfo | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const [shootMessage, setShootMessage] = useState('')

  const handleMessage = useCallback((msg: WSMessage) => {
    switch (msg.type) {
      case 'shoot_broadcast': {
        const data = msg.data as { member_username: string; number: string; total_sum: number; shot_at: string }
        setShoots(prev => [{ member_username: data.member_username, number: data.number, shot_at: data.shot_at }, ...prev])
        setTotalSum(data.total_sum)
        break
      }
      case 'countdown': {
        const data = msg.data as { seconds_remaining: number }
        setCountdown(data.seconds_remaining)
        break
      }
      case 'result': {
        setResult(msg.data as ResultInfo)
        break
      }
      case 'error': {
        const data = msg.data as { message: string }
        setShootMessage(data.message)
        break
      }
    }
  }, [])

  const { isConnected, shoot } = useWebSocket({ roundId, onMessage: handleMessage })

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown(prev => Math.max(0, prev - 1)), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleShoot = useCallback((number: string) => {
    shoot(number)
    setShootMessage(`ยิงเลข ${number} แล้ว!`)
    setResetKey(prev => prev + 1)
    setTimeout(() => setShootMessage(''), 2000)
  }, [shoot])

  if (!roundId) {
    return (
      <div className="p-4">
        <div className="card p-8 text-center">
          <p className="text-muted text-sm">กรุณาเลือกรอบยี่กีก่อน</p>
          <Link href="/yeekee/room" className="btn-primary inline-block mt-3 text-sm px-6 py-2 rounded-lg">
            เลือกรอบ
          </Link>
        </div>
      </div>
    )
  }

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <Link href="/yeekee/room" className="text-muted">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold">ยี่กี — ยิงเลข</h1>
        <div className="flex-1" />
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${isConnected ? 'text-green-600' : 'text-red-500'}`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          {isConnected ? 'เชื่อมต่อแล้ว' : 'กำลังเชื่อมต่อ...'}
        </div>
      </div>

      {/* ผลยี่กี (ถ้าออกแล้ว) */}
      {result && (
        <div className="px-4 mb-3">
          <div className="card p-5 text-center border-2 border-amber-300">
            <div className="text-sm font-bold mb-2" style={{ color: 'var(--color-gold)' }}>ผลยี่กี</div>
            <div className="text-4xl font-bold font-mono mb-3">{result.result_number}</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-amber-50 rounded-lg p-2">
                <div className="text-muted text-[10px]">3 ตัวบน</div>
                <div className="text-lg font-bold font-mono text-amber-600">{result.top3}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-2">
                <div className="text-muted text-[10px]">2 ตัวบน</div>
                <div className="text-lg font-bold font-mono text-green-600">{result.top2}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-2">
                <div className="text-muted text-[10px]">2 ตัวล่าง</div>
                <div className="text-lg font-bold font-mono text-blue-600">{result.bottom2}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Countdown */}
      <div className="px-4 mb-3">
        <div className="card p-4 text-center">
          <div className="text-muted text-xs mb-1">เวลาที่เหลือ</div>
          <div className={`text-4xl font-bold font-mono ${countdown <= 30 ? 'text-red-500' : ''}`}
            style={{ color: countdown > 30 ? 'var(--color-primary)' : undefined }}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <div className="text-muted text-xs mt-1">ผลรวมเลข: {totalSum.toLocaleString()}</div>
        </div>
      </div>

      {/* Message */}
      {shootMessage && (
        <div className="px-4 mb-3">
          <div className={`rounded-lg px-4 py-2.5 text-sm font-medium text-center ${
            shootMessage.includes('แล้ว') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {shootMessage}
          </div>
        </div>
      )}

      {/* Number Pad — กดเลข 5 หลัก */}
      {!result && (
        <div className="px-4 mb-3">
          <h2 className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider text-center">กดเลข 5 หลักเพื่อยิง</h2>
          <NumberPad digitCount={5} onComplete={handleShoot} resetTrigger={resetKey} />
        </div>
      )}

      {/* เลขที่ยิงมา Live */}
      <div className="px-4 pb-4">
        <div className="section-title px-0">
          <span>เลขที่ยิงมา ({shoots.length})</span>
        </div>
        <div className="card p-2 max-h-64 overflow-y-auto">
          {shoots.length === 0 ? (
            <div className="text-muted text-center py-6 text-sm">ยังไม่มีคนยิง</div>
          ) : shoots.map((s, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg mb-1" style={{ background: 'var(--color-bg-card-alt)' }}>
              <span className="text-sm text-secondary">{s.member_username}</span>
              <span className="font-mono font-bold" style={{ color: 'var(--color-primary)' }}>{s.number}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function YeekeePlayPage() {
  return (
    <Suspense fallback={
      <div className="p-4">
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="skeleton h-24 rounded-xl mb-4" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    }>
      <YeekeePlayContent />
    </Suspense>
  )
}
