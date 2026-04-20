/**
 * หน้ายี่กี — 2 tabs หลัก: แทงหวย + ยิงเลข
 *
 * Tab แทงหวย — copy flow จาก /lottery/[type] เป๊ะ:
 *   เลือก bet type → จำนวนเงิน → 3 sub-tabs (กดเลขเอง/เลือกจากแผง/เลขวิน)
 *   → กลับตัวเลข → BetSlip → ยืนยัน
 *
 * Tab ยิงเลข — WebSocket real-time:
 *   กดเลข 5 หลัก → ยิง (ฟรี, มี rate limit 3 วินาที)
 *
 * ⭐ ยิงเลข ≠ แทงหวย
 *   - ยิงเลข = ส่งเลข 5 หลักเพื่อร่วมคำนวณผล (ไม่เสียเงิน)
 *   - แทงหวย = เดิมพันว่าผลจะออกเลขอะไร (เสียเงิน ถ้าถูกได้เงิน)
 *
 * Split 2026-04-21 — UI sub-components + config ย้ายออก (ดู src/components/yeekee/*, ./_config.ts)
 */
'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import Loading from '@/components/Loading'
import ResultCard from '@/components/yeekee/ResultCard'
import CountdownCard from '@/components/yeekee/CountdownCard'
import LiveShootsList from '@/components/yeekee/LiveShootsList'
import ShootTab from '@/components/yeekee/ShootTab'
import BetTab from '@/components/yeekee/BetTab'
import { useBetStore } from '@/store/bet-store'
import { useAuthStore } from '@/store/auth-store'
import { useWebSocket } from '@/hooks/useWebSocket'
import { lotteryApi, betApi, yeekeeApi } from '@/lib/api'
import type { WSMessage, PlaceBetItem } from '@/types'
import {
  yeekeeBetTypesForStore,
  translateBetReason,
  type MainTab, type BetSubTab,
  type ShootItem, type ResultInfo,
} from './_config'

// =============================================================================
// Main Component
// =============================================================================
function YeekeePlayContent() {
  const searchParams = useSearchParams()
  const roundId = Number(searchParams.get('round'))

  // Main tab — เริ่มที่แทงหวย
  const [mainTab, setMainTab] = useState<MainTab>('bet')
  const [betSubTab, setBetSubTab] = useState<BetSubTab>('keypad')

  // === Shooting state ===
  const [shoots, setShoots] = useState<ShootItem[]>([])
  const [totalSum, setTotalSum] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [result, setResult] = useState<ResultInfo | null>(null)
  const [shootResetKey, setShootResetKey] = useState(0)
  const [shootMessage, setShootMessage] = useState('')
  const [shootNumber, setShootNumber] = useState('') // เลขที่กดไว้ (ยังไม่ยิง)
  // ⭐ Deferred onChange — ป้องกัน setState ระหว่าง render ของ NumberPad
  const handleShootNumberChange = useCallback((val: string) => {
    setTimeout(() => setShootNumber(val), 0)
  }, [])

  // === Betting state ===
  const { member, updateBalance } = useAuthStore()
  const { betSlip, addToBetSlip, clearBetSlip, selectedBetTypes, setBetTypes, setCurrentRound, getSelectedDigitCount } = useBetStore()
  const [lotteryRoundId, setLotteryRoundId] = useState<number | null>(null)
  const [betAmount, setBetAmount] = useState(10)
  const [betResetKey, setBetResetKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [betMessage, setBetMessage] = useState('')
  const [betTypesLoaded, setBetTypesLoaded] = useState(false)

  // ⭐ ตั้ง bet types ยี่กี เข้า store ทันที (ไม่ต้อง fetch จาก API)
  // AIDEV-NOTE: defer via setTimeout(0) to avoid react-hooks/set-state-in-effect
  useEffect(() => {
    if (betTypesLoaded) return
    const t = setTimeout(() => {
      setBetTypes(yeekeeBetTypesForStore())
      setBetTypesLoaded(true)
    }, 0)
    return () => clearTimeout(t)
  }, [betTypesLoaded, setBetTypes])

  // === WebSocket ===
  const handleMessage = useCallback((msg: WSMessage) => {
    switch (msg.type) {
      case 'shoot_broadcast': {
        const data = msg.data as { member_username: string; number: string; total_sum: number; shot_at: string }
        setShoots(prev => [{ member_username: data.member_username, number: data.number, shot_at: data.shot_at }, ...prev])
        setTotalSum(data.total_sum)
        break
      }
      case 'round_info': {
        const data = msg.data as { total_sum: number; seconds_remaining: number; shoots?: ShootItem[] }
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

  const { isConnected, shoot, cooldownRemaining } = useWebSocket({ roundId, onMessage: handleMessage })

  // ⭐ Countdown — คำนวณจาก end_time ของรอบจริง
  const [roundEndTime, setRoundEndTime] = useState<string | null>(null)

  // ดึง end_time + lottery_round_id + bet types
  useEffect(() => {
    if (!roundId) return
    yeekeeApi.getRounds()
      .then(res => {
        const rounds = res.data.data || []
        const thisRound = rounds.find((r) => r.id === roundId)
        if (thisRound) {
          setRoundEndTime(thisRound.end_time)
          setLotteryRoundId(thisRound.lottery_round_id)

          // ตั้ง current round สำหรับ BetSlip
          const ltId = thisRound.lottery_round?.lottery_type_id
          if (ltId) {
            lotteryApi.getOpenRounds(ltId)
              .then(rRes => {
                const openRounds = rRes.data.data || []
                const lr = openRounds.find((r) => r.id === thisRound.lottery_round_id)
                if (lr) setCurrentRound(lr)
              })
              .catch(() => {})
          }
        }
      })
      .catch(() => {})
  }, [roundId, betTypesLoaded, setBetTypes, setCurrentRound])

  // Countdown timer — อัพเดททุกวินาทีจาก end_time จริง
  useEffect(() => {
    if (!roundEndTime) return
    const calc = () => {
      const remaining = Math.max(0, Math.floor((new Date(roundEndTime).getTime() - Date.now()) / 1000))
      setCountdown(remaining)
    }
    calc()
    const timer = setInterval(calc, 1000)
    return () => clearInterval(timer)
  }, [roundEndTime])

  // === Shooting handlers ===
  // กดปุ่มยิง — ยิงเฉพาะเมื่อกดปุ่ม (ไม่ auto-fire ตอนกดเลขครบ)
  const handleShootConfirm = useCallback(() => {
    if (shootNumber.length !== 5) {
      setShootMessage('กรุณากดเลขให้ครบ 5 หลัก')
      setTimeout(() => setShootMessage(''), 1500)
      return
    }
    const success = shoot(shootNumber)
    if (success) {
      setShootMessage(`ยิงเลข ${shootNumber} แล้ว!`)
      // ไม่เพิ่ม local — รอ broadcast จาก server กลับมา (ป้องกันซ้ำ)
      setShootNumber('')
      setShootResetKey(prev => prev + 1)
      setTimeout(() => setShootMessage(''), 2000)
    } else {
      setShootMessage('กรุณารอสักครู่ก่อนยิงใหม่')
      setTimeout(() => setShootMessage(''), 1500)
    }
  }, [shootNumber, shoot])

  // === Betting handlers ===
  const handleAddNumber = useCallback((number: string) => {
    if (selectedBetTypes.length === 0) {
      setBetMessage('กรุณาเลือกประเภทการแทงก่อน')
      setTimeout(() => setBetMessage(''), 2000)
      return
    }
    // เพิ่มลง bet slip ด้วย bet type ที่เลือก
    addToBetSlip(number, betAmount)
    setBetResetKey(prev => prev + 1)
  }, [selectedBetTypes, betAmount, addToBetSlip])

  // กลับตัวเลข (permutation) — เช่น 123 → 132, 213, 231, 312, 321
  const handleReverseLast = useCallback(() => {
    const lastItem = betSlip[betSlip.length - 1]
    if (!lastItem) return
    const number = lastItem.number
    const perms = new Set<string>()
    const chars = number.split('')
    const permute = (arr: string[], start: number) => {
      if (start === arr.length) { perms.add(arr.join('')); return }
      for (let i = start; i < arr.length; i++) {
        [arr[start], arr[i]] = [arr[i], arr[start]]
        permute([...arr], start + 1)
      }
    }
    permute(chars, 0)
    perms.delete(number)
    perms.forEach(perm => addToBetSlip(perm, betAmount))
  }, [betSlip, betAmount, addToBetSlip])

  // ยืนยันแทง — return true = สำเร็จ, string = error message
  const handleConfirm = useCallback(async (): Promise<boolean | string> => {
    if (!lotteryRoundId || betSlip.length === 0) return false
    setSubmitting(true)
    setBetMessage('')

    try {
      const bets: PlaceBetItem[] = betSlip.map(item => ({
        lottery_round_id: lotteryRoundId,
        bet_type_code: item.betType,
        number: item.number,
        amount: item.amount,
      }))

      const res = await betApi.placeBets(bets)
      const data = res.data.data

      if (data.success_count > 0) {
        updateBalance(data.balance_after)
        clearBetSlip()
        setBetMessage(`แทงสำเร็จ ${data.success_count} รายการ!`)
        setTimeout(() => setBetMessage(''), 3000)
        setSubmitting(false)
        return true
      }

      if (data.errors && data.errors.length > 0) {
        const errMsgs = data.errors.map((e: { number: string; bet_type?: string; BetType?: string; reason?: string; Reason?: string }) =>
          `เลข ${e.number}: ${translateBetReason(e.Reason || e.reason || '')}`
        ).join('\n')
        setBetMessage(errMsgs)
        setSubmitting(false)
        return errMsgs
      }
      setSubmitting(false)
      return false
    } catch {
      setSubmitting(false)
      return false
    }
  }, [lotteryRoundId, betSlip, updateBalance, clearBetSlip])

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

  const digitCount = getSelectedDigitCount() || 3
  const hasReversible = betSlip.length > 0 && digitCount >= 2

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <Link href="/yeekee/room" className="text-muted">
          <ChevronLeft size={20} strokeWidth={2} />
        </Link>
        <h1 className="text-lg font-bold">ยี่กี</h1>
        <div className="flex-1" />
        {/* เครดิต */}
        <div className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(13,110,110,0.08)', color: 'var(--color-primary)' }}>
          ฿{member?.balance?.toLocaleString() || '0'}
        </div>
        {/* สถานะ connection */}
        {!isConnected && (
          <div className="flex items-center gap-1 text-xs font-semibold text-orange-500">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            เชื่อมต่อ...
          </div>
        )}
      </div>

      {/* ผลยี่กี (ถ้าออกแล้ว) */}
      {result && <ResultCard result={result} />}

      {/* Countdown */}
      <CountdownCard countdown={countdown} totalSum={totalSum} />

      {/* ⭐ Main Tabs — แทงหวย / ยิงเลข */}
      <div className="px-4 mb-3">
        <div className="flex rounded-xl overflow-hidden" style={{ background: 'var(--ios-bg-tertiary)' }}>
          <button
            onClick={() => setMainTab('bet')}
            className="flex-1 py-2.5 text-sm font-semibold text-center transition-all rounded-xl"
            style={{
              background: mainTab === 'bet' ? 'var(--color-primary)' : 'transparent',
              color: mainTab === 'bet' ? 'white' : 'var(--ios-secondary-label)',
            }}
          >
            💰 แทงหวย
          </button>
          <button
            onClick={() => setMainTab('shoot')}
            className="flex-1 py-2.5 text-sm font-semibold text-center transition-all rounded-xl"
            style={{
              background: mainTab === 'shoot' ? 'var(--color-primary)' : 'transparent',
              color: mainTab === 'shoot' ? 'white' : 'var(--ios-secondary-label)',
            }}
          >
            🎯 ยิงเลข
          </button>
        </div>
      </div>

      {/* Tab content */}
      {mainTab === 'bet' && !result && (
        <BetTab
          betMessage={betMessage}
          betSubTab={betSubTab}
          setBetSubTab={setBetSubTab}
          selectedBetTypesLength={selectedBetTypes.length}
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          betSlipLength={betSlip.length}
          digitCount={digitCount}
          betResetKey={betResetKey}
          submitting={submitting}
          hasReversible={hasReversible}
          onAddNumber={handleAddNumber}
          onReverseLast={handleReverseLast}
          onConfirm={handleConfirm}
        />
      )}
      {mainTab === 'shoot' && !result && (
        <ShootTab
          shootMessage={shootMessage}
          shootNumber={shootNumber}
          shootResetKey={shootResetKey}
          cooldownRemaining={cooldownRemaining}
          onShootNumberChange={handleShootNumberChange}
          onConfirm={handleShootConfirm}
        />
      )}

      {/* เลขที่ยิงมา Live — แสดงทั้ง 2 tabs */}
      <LiveShootsList shoots={shoots} />
    </div>
  )
}

export default function YeekeePlayPage() {
  return (
    <Suspense fallback={<Loading />}>
      <YeekeePlayContent />
    </Suspense>
  )
}
