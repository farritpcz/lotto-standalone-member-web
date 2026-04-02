/**
 * หน้ายี่กี — 2 tabs: ยิงเลข (WebSocket) + แทงหวย (bet placement)
 *
 * Tab 1 — ยิงเลข:
 *   กดเลข 5 หลัก → ยิงผ่าน WebSocket → เห็นเลขคนอื่นยิง live → ผลออกอัตโนมัติ
 *
 * Tab 2 — แทงหวย:
 *   เลือก bet type (3ตัวบน/2ตัวบน/2ตัวล่าง/วิ่ง) → กดเลข → ใส่จำนวนเงิน → ยืนยัน
 *   ใช้ components เดียวกับ /lottery/[type] (NumberPad, BetTypeSelector, BetSlip)
 *
 * ⭐ ยิงเลข ≠ แทงหวย
 *   - ยิงเลข = ส่งเลข 5 หลักเพื่อร่วมคำนวณผล (ไม่เสียเงิน)
 *   - แทงหวย = เดิมพันว่าผลจะออกเลขอะไร (เสียเงิน ถ้าถูกได้เงิน)
 */

'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import NumberPad from '@/components/number-pad/NumberPad'
import BetTypeSelector from '@/components/bet-board/BetTypeSelector'
import BetSlip from '@/components/bet-board/BetSlip'
import { useBetStore } from '@/store/bet-store'
import { useAuthStore } from '@/store/auth-store'
import { useWebSocket } from '@/hooks/useWebSocket'
import { lotteryApi, betApi, yeekeeApi } from '@/lib/api'
import type { WSMessage, BetTypeInfo, PlaceBetItem } from '@/types'

// =============================================================================
// Types
// =============================================================================
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

type TabKey = 'shoot' | 'bet'

// =============================================================================
// Main Component
// =============================================================================
function YeekeePlayContent() {
  const searchParams = useSearchParams()
  const roundId = Number(searchParams.get('round'))

  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>('shoot')

  // === Shooting state ===
  const [shoots, setShoots] = useState<ShootItem[]>([])
  const [totalSum, setTotalSum] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [result, setResult] = useState<ResultInfo | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const [shootMessage, setShootMessage] = useState('')
  const [lotteryRoundId, setLotteryRoundId] = useState<number | null>(null)

  // === Betting state ===
  const { member, updateBalance } = useAuthStore()
  const { selectedBetTypes, betSlip, setBetTypes, setCurrentRound, addToBetSlip, clearBetSlip, getSelectedDigitCount } = useBetStore()
  const [betAmount, setBetAmount] = useState(10)
  const [betResetKey, setBetResetKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [betMessage, setBetMessage] = useState('')
  const [betTypesLoaded, setBetTypesLoaded] = useState(false)

  // === WebSocket ===
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
      case 'round_info': {
        const data = msg.data as { shoot_count: number; total_sum: number; seconds_remaining: number; shoots?: ShootItem[] }
        setCountdown(data.seconds_remaining || 0)
        setTotalSum(data.total_sum || 0)
        if (data.shoots && data.shoots.length > 0) {
          setShoots(data.shoots.reverse())
        }
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

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown(prev => Math.max(0, prev - 1)), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // โหลด bet types + lottery_round_id สำหรับ tab แทงหวย
  useEffect(() => {
    if (!roundId || betTypesLoaded) return

    // ดึง yeekee rounds → หา lottery_round_id ของรอบนี้
    yeekeeApi.getRounds()
      .then(res => {
        const yeekeeRounds = res.data.data || []
        // หา yeekee round ที่ตรงกับ roundId
        const thisRound = yeekeeRounds.find((r: { id: number }) => r.id === roundId)
        if (thisRound) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const lrId = (thisRound as any).lottery_round_id
          setLotteryRoundId(lrId)
          // ต้องดึง lottery type ID จาก lottery_round
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ltId = (thisRound as any).lottery_round?.lottery_type_id
          if (ltId) {
            // ดึง bet types ด้วย lottery type ID
            lotteryApi.getBetTypes(ltId)
              .then(btRes => {
                const types: BetTypeInfo[] = btRes.data.data || []
                setBetTypes(types)
                setBetTypesLoaded(true)
              })
              .catch(() => {})
          }
        }
      })
      .catch(() => {})
  }, [roundId, betTypesLoaded, setBetTypes])

  // === Handlers ===
  const handleShoot = useCallback((number: string) => {
    shoot(number)
    setShootMessage(`ยิงเลข ${number} แล้ว!`)
    setResetKey(prev => prev + 1)
    setTimeout(() => setShootMessage(''), 2000)
  }, [shoot])

  const handleBetNumberComplete = useCallback((number: string) => {
    if (selectedBetTypes.length === 0) {
      setBetMessage('กรุณาเลือกประเภทการแทงก่อน')
      setTimeout(() => setBetMessage(''), 2000)
      return
    }
    addToBetSlip(number, betAmount)
    setBetResetKey(prev => prev + 1)
  }, [selectedBetTypes, betAmount, addToBetSlip])

  const handleSubmitBets = useCallback(async () => {
    if (betSlip.length === 0 || !lotteryRoundId) return
    setSubmitting(true)

    try {
      const items: PlaceBetItem[] = betSlip.map(b => ({
        lottery_round_id: lotteryRoundId,
        bet_type_code: b.betType,
        number: b.number,
        amount: b.amount,
      }))

      const res = await betApi.placeBets(items)
      if (res.data.success) {
        const data = res.data.data
        setBetMessage(`แทงสำเร็จ ${data.total_bets} รายการ!`)
        clearBetSlip()
        if (data.balance_after !== undefined) {
          updateBalance(data.balance_after)
        }
      } else {
        setBetMessage(res.data.error || 'แทงไม่สำเร็จ')
      }
    } catch {
      setBetMessage('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
      setTimeout(() => setBetMessage(''), 3000)
    }
  }, [betSlip, lotteryRoundId, clearBetSlip, updateBalance])

  // === Early returns ===
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
  const digitCount = getSelectedDigitCount()

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <Link href="/yeekee/room" className="text-muted">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold">ยี่กี</h1>
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
        <div className="card p-3 text-center">
          <div className="text-muted text-xs mb-1">เวลาที่เหลือ</div>
          <div className={`text-3xl font-bold font-mono ${countdown <= 30 ? 'text-red-500' : ''}`}
            style={{ color: countdown > 30 ? 'var(--color-primary)' : undefined }}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <div className="text-muted text-xs mt-1">ผลรวมเลข: {totalSum.toLocaleString()}</div>
        </div>
      </div>

      {/* ⭐ Tabs — ยิงเลข / แทงหวย */}
      <div className="px-4 mb-3">
        <div className="flex rounded-xl overflow-hidden" style={{ background: 'var(--ios-bg-tertiary)' }}>
          <button
            onClick={() => setActiveTab('shoot')}
            className="flex-1 py-2.5 text-sm font-semibold text-center transition-all rounded-xl"
            style={{
              background: activeTab === 'shoot' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'shoot' ? 'white' : 'var(--ios-secondary-label)',
            }}
          >
            🎯 ยิงเลข
          </button>
          <button
            onClick={() => setActiveTab('bet')}
            className="flex-1 py-2.5 text-sm font-semibold text-center transition-all rounded-xl"
            style={{
              background: activeTab === 'bet' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'bet' ? 'white' : 'var(--ios-secondary-label)',
            }}
          >
            💰 แทงหวย
          </button>
        </div>
      </div>

      {/* === Tab: ยิงเลข === */}
      {activeTab === 'shoot' && !result && (
        <div className="px-4 mb-3">
          {/* Message */}
          {shootMessage && (
            <div className={`rounded-lg px-4 py-2.5 text-sm font-medium text-center mb-3 ${
              shootMessage.includes('แล้ว') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {shootMessage}
            </div>
          )}
          <h2 className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider text-center">กดเลข 5 หลักเพื่อยิง (ฟรี)</h2>
          <NumberPad digitCount={5} onComplete={handleShoot} resetTrigger={resetKey} />
        </div>
      )}

      {/* === Tab: แทงหวย === */}
      {activeTab === 'bet' && !result && (
        <div className="px-4 mb-3">
          {/* Message */}
          {betMessage && (
            <div className={`rounded-lg px-4 py-2.5 text-sm font-medium text-center mb-3 ${
              betMessage.includes('สำเร็จ') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {betMessage}
            </div>
          )}

          {/* เลือกประเภทการแทง */}
          <BetTypeSelector />

          {/* จำนวนเงิน */}
          <div className="mt-3 mb-3">
            <div className="text-xs font-semibold text-muted mb-2">จำนวนเงิน (บาท)</div>
            <div className="flex gap-2 flex-wrap">
              {[10, 20, 50, 100, 500, 1000].map(amount => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: betAmount === amount ? 'var(--color-primary)' : 'var(--ios-bg-tertiary)',
                    color: betAmount === amount ? 'white' : 'var(--ios-label)',
                  }}
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>

          {/* กดเลข */}
          <h2 className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider text-center">
            กดเลข {digitCount || '?'} หลัก
          </h2>
          <NumberPad
            digitCount={digitCount || 3}
            onComplete={handleBetNumberComplete}
            resetTrigger={betResetKey}
          />

          {/* Bet Slip */}
          {betSlip.length > 0 && (
            <div className="mt-3">
              <BetSlip onSubmit={handleSubmitBets} submitting={submitting} />
            </div>
          )}
        </div>
      )}

      {/* เลขที่ยิงมา Live */}
      <div className="px-4 pb-24">
        <div className="section-title px-0">
          <span>เลขที่ยิงมา ({shoots.length})</span>
        </div>
        <div className="card p-2 max-h-48 overflow-y-auto">
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
