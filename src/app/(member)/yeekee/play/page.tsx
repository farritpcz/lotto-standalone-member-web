/**
 * หน้ายิงเลขยี่กี — real-time WebSocket
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

  // WebSocket message handler
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
        const data = msg.data as ResultInfo
        setResult(data)
        break
      }
      case 'error': {
        const data = msg.data as { message: string }
        setShootMessage(`❌ ${data.message}`)
        break
      }
    }
  }, [])

  const { isConnected, shoot } = useWebSocket({
    roundId,
    onMessage: handleMessage,
  })

  // Countdown timer (client-side fallback)
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // เมื่อกดเลขครบ 5 หลัก → ยิง
  const handleShoot = useCallback((number: string) => {
    shoot(number)
    setShootMessage(`✅ ยิงเลข ${number} แล้ว!`)
    setResetKey(prev => prev + 1)
    setTimeout(() => setShootMessage(''), 2000)
  }, [shoot])

  if (!roundId) {
    return <div className="p-6 text-center text-gray-400">กรุณาเลือกรอบยี่กีก่อน</div>
  }

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header + Status */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">🎯 ยี่กี — ยิงเลข</h1>
        <div className={`flex items-center gap-2 text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
          {isConnected ? 'เชื่อมต่อแล้ว' : 'กำลังเชื่อมต่อ...'}
        </div>
      </div>

      {/* ผลยี่กี (ถ้าออกแล้ว) */}
      {result && (
        <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-6 mb-4 text-center">
          <div className="text-yellow-400 font-semibold mb-2">🏆 ผลยี่กี</div>
          <div className="text-3xl font-bold text-white font-mono mb-3">{result.result_number}</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800 rounded-lg p-2">
              <div className="text-gray-400 text-xs">3 ตัวบน</div>
              <div className="text-yellow-400 font-bold font-mono">{result.top3}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-2">
              <div className="text-gray-400 text-xs">2 ตัวบน</div>
              <div className="text-green-400 font-bold font-mono">{result.top2}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-2">
              <div className="text-gray-400 text-xs">2 ตัวล่าง</div>
              <div className="text-blue-400 font-bold font-mono">{result.bottom2}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ซ้าย: Countdown + กดเลข */}
        <div>
          {/* Countdown */}
          <div className="bg-gray-800 rounded-xl p-4 mb-4 text-center">
            <div className="text-gray-400 text-sm">เวลาที่เหลือ</div>
            <div className={`text-4xl font-bold font-mono mt-1 ${countdown <= 30 ? 'text-red-400' : 'text-white'}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="text-gray-500 text-xs mt-2">ผลรวมเลข: {totalSum.toLocaleString()}</div>
          </div>

          {/* Message */}
          {shootMessage && (
            <div className={`rounded-lg px-4 py-2 mb-3 text-sm text-center ${shootMessage.includes('✅') ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
              {shootMessage}
            </div>
          )}

          {/* Number Pad — กดเลข 5 หลัก */}
          {!result && (
            <div>
              <h2 className="text-gray-400 text-sm mb-2 text-center">กดเลข 5 หลักเพื่อยิง</h2>
              <NumberPad digitCount={5} onComplete={handleShoot} resetTrigger={resetKey} />
            </div>
          )}
        </div>

        {/* ขวา: เลขที่ยิงมา Live */}
        <div>
          <h2 className="text-gray-400 text-sm mb-2">เลขที่ยิงมา ({shoots.length})</h2>
          <div className="bg-gray-800 rounded-xl p-3 max-h-96 overflow-y-auto space-y-1">
            {shoots.length === 0 ? (
              <div className="text-gray-500 text-center py-6 text-sm">ยังไม่มีคนยิง</div>
            ) : shoots.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-700/50 rounded-lg px-3 py-2">
                <div>
                  <span className="text-gray-300 text-sm">{s.member_username}</span>
                </div>
                <div className="text-white font-mono font-bold">{s.number}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function YeekeePlayPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-400">กำลังโหลด...</div>}>
      <YeekeePlayContent />
    </Suspense>
  )
}
