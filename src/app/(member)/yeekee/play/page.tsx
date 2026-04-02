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
 */

'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import Loading from '@/components/Loading'
import NumberPad from '@/components/number-pad/NumberPad'
import BetTypeSelector from '@/components/bet-board/BetTypeSelector'
import BetSlip from '@/components/bet-board/BetSlip'
import NumberGrid from '@/components/bet-board/NumberGrid'
import LuckyNumbers from '@/components/bet-board/LuckyNumbers'
import { useBetStore } from '@/store/bet-store'
import { useAuthStore } from '@/store/auth-store'
import { useWebSocket } from '@/hooks/useWebSocket'
import { lotteryApi, betApi, yeekeeApi } from '@/lib/api'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { WSMessage, PlaceBetItem } from '@/types'

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

type MainTab = 'bet' | 'shoot'
type BetSubTab = 'keypad' | 'grid' | 'lucky'

const betSubTabs: { key: BetSubTab; label: string }[] = [
  { key: 'keypad', label: 'กดเลขเอง' },
  { key: 'grid', label: 'เลือกจากแผง' },
  { key: 'lucky', label: 'เลขวิน' },
]

// =============================================================================
// ⭐ ยี่กี Bet Types — 6 ประเภทเท่านั้น (ตามรูปตัวอย่างเจริญดี88)
// =============================================================================
interface YeekeeBetType {
  code: string
  label: string
  rate: number
  digitCount: number
}

const YEEKEE_BET_TYPES: YeekeeBetType[] = [
  { code: '3TOP',    label: 'สามตัวบน',   rate: 1000, digitCount: 3 },
  { code: '3TOD',    label: 'สามตัวโต๊ด', rate: 150,  digitCount: 3 },
  { code: '2TOP',    label: 'สองตัวบน',   rate: 100,  digitCount: 2 },
  { code: '2BOTTOM', label: 'สองตัวล่าง', rate: 100,  digitCount: 2 },
  { code: 'RUN_TOP', label: 'วิ่งบน',     rate: 4,    digitCount: 1 },
  { code: 'RUN_BOT', label: 'วิ่งล่าง',   rate: 5,    digitCount: 1 },
]

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
  useEffect(() => {
    if (!betTypesLoaded) {
      setBetTypes(YEEKEE_BET_TYPES.map(bt => ({
        id: 0,
        name: bt.label,
        code: bt.code,
        digit_count: bt.digitCount,
        rate: bt.rate,
        max_bet_per_number: 0,
      })))
      setBetTypesLoaded(true)
    }
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const thisRound = rounds.find((r: any) => r.id === roundId)
        if (thisRound) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tr = thisRound as any
          setRoundEndTime(tr.end_time)
          setLotteryRoundId(tr.lottery_round_id)

          // ตั้ง current round สำหรับ BetSlip
          const ltId = tr.lottery_round?.lottery_type_id
          if (ltId) {
            lotteryApi.getOpenRounds(ltId)
              .then(rRes => {
                const openRounds = rRes.data.data || []
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const lr = openRounds.find((r: any) => r.id === tr.lottery_round_id)
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
  }, [shootNumber, shoot, member])

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
  const handleReverse = useCallback((number: string) => {
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
  }, [betAmount, addToBetSlip])

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
        const translateReason = (r: string) => {
          if (r.includes('auto-ban') || r.includes('อั้นอัตโนมัติ')) return 'เลขอั้น (ยอดรวมเกินที่กำหนด)'
          if (r.includes('banned') || r.includes('อั้น')) return 'เลขอั้น'
          if (r.includes('insufficient') || r.includes('เครดิต')) return 'เครดิตไม่พอ'
          if (r.includes('closed') || r.includes('ปิดรับ')) return 'ปิดรับแล้ว'
          if (r.includes('limit') || r.includes('จำกัดยอด')) return 'เกินวงเงิน'
          return r
        }
        const errMsgs = data.errors.map((e: { number: string; BetType: string; Reason: string }) =>
          `เลข ${e.number}: ${translateReason(e.Reason)}`
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

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60
  const digitCount = getSelectedDigitCount() || 3

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

      {/* ================================================================= */}
      {/* Tab: แทงหวย — copy จาก /lottery/[type] เต็ม flow                  */}
      {/* ================================================================= */}
      {mainTab === 'bet' && !result && (
        <>
          {/* Message */}
          {betMessage && (
            <div className="px-4 mb-3">
              <div className={`rounded-lg px-4 py-2.5 text-sm font-medium text-center ${
                betMessage.includes('สำเร็จ') ? 'bg-green-50 text-green-600' :
                betMessage.includes('ผิดพลาด') ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {betMessage}
              </div>
            </div>
          )}

          {/* ⭐ ประเภทการแทง — ใช้ BetTypeSelector component เดียวกับทุกหวย */}
          <div className="px-4 mb-3">
            <h2 className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider">ประเภทการแทง</h2>
            <BetTypeSelector />
          </div>

          {/* จำนวนเงิน + กลับตัวเลข */}
          <div className="px-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">จำนวนเงิน (บาท)</h2>
              {betSlip.length > 0 && digitCount >= 2 && (
                <button
                  onClick={() => {
                    const lastItem = betSlip[betSlip.length - 1]
                    if (lastItem) handleReverse(lastItem.number)
                  }}
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition active:scale-95"
                  style={{ background: 'rgba(212,160,23,0.1)', color: 'var(--color-gold)' }}
                >
                  🔄 กลับตัวเลข
                </button>
              )}
            </div>
            <div className="quick-amount mb-2">
              {[5, 10, 20, 50, 100].map(amt => (
                <button
                  key={amt}
                  onClick={() => setBetAmount(amt)}
                  className={betAmount === amt ? 'active' : ''}
                >
                  ฿{amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-lg px-4 py-2.5 text-center text-sm font-bold border border-gray-200 focus:border-teal-500 focus:outline-none"
              style={{ background: 'var(--color-bg-card)' }}
              min={1}
            />
          </div>

          {/* 3 Sub-tabs: กดเลขเอง / เลือกจากแผง / เลขวิน */}
          <div className="px-4 mb-3">
            <div className="card p-1 flex gap-1 mb-3">
              {betSubTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setBetSubTab(tab.key)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                    betSubTab === tab.key ? 'text-white shadow-md' : 'text-secondary'
                  }`}
                  style={{ background: betSubTab === tab.key ? 'var(--color-primary)' : 'transparent' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content — ต้องเลือกประเภทแทงก่อน */}
            {selectedBetTypes.length === 0 ? (
              <div className="card p-6 text-center">
                <p className="text-muted text-sm">กรุณาเลือกประเภทการแทงก่อน</p>
              </div>
            ) : (
              <>
                {betSubTab === 'keypad' && (
                  <div>
                    <h2 className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider">กดเลข ({digitCount} หลัก)</h2>
                    <NumberPad
                      digitCount={digitCount}
                      onComplete={handleAddNumber}
                      resetTrigger={betResetKey}
                    />
                  </div>
                )}
                {betSubTab === 'grid' && (
                  <NumberGrid digitCount={digitCount} onSelect={handleAddNumber} />
                )}
                {betSubTab === 'lucky' && (
                  <LuckyNumbers digitCount={digitCount} onSelect={handleAddNumber} />
                )}
              </>
            )}
          </div>

          {/* Bet Slip */}
          <div className="px-4 pb-4">
            <h2 className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider">รายการแทง</h2>
            <BetSlip onConfirm={handleConfirm} loading={submitting} />
          </div>
        </>
      )}

      {/* ================================================================= */}
      {/* Tab: ยิงเลข — WebSocket real-time                                 */}
      {/* ================================================================= */}
      {mainTab === 'shoot' && !result && (
        <div className="px-4 mb-3">
          {shootMessage && (
            <div className={`rounded-lg px-4 py-2.5 text-sm font-medium text-center mb-3 ${
              shootMessage.includes('แล้ว') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {shootMessage}
            </div>
          )}
          <h2 className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider text-center">กดเลข 5 หลัก แล้วกดยิง (ฟรี)</h2>
          {/* ⭐ ใช้ onChange เก็บค่า — ไม่ auto-fire ตอนกดครบ */}
          <NumberPad
            digitCount={5}
            onComplete={() => {}} // ไม่ auto-fire
            onChange={(val) => setShootNumber(val)}
            resetTrigger={shootResetKey}
          />

          {/* ⭐ ปุ่มยิงเลข — กดได้เฉพาะเมื่อครบ 5 หลัก + ไม่ติด cooldown */}
          <button
            onClick={handleShootConfirm}
            disabled={shootNumber.length !== 5 || cooldownRemaining > 0}
            className="w-full mt-3 py-3 rounded-xl text-white font-bold text-base transition-all active:scale-[0.97] disabled:opacity-40"
            style={{
              background: shootNumber.length === 5 && cooldownRemaining <= 0
                ? 'linear-gradient(135deg, #FF9F0A, #FF6B00)'
                : '#C7C7CC',
            }}
          >
            {cooldownRemaining > 0
              ? `รอ ${cooldownRemaining} วินาที`
              : shootNumber.length === 5
                ? `🎯 ยิงเลข ${shootNumber}`
                : `กดเลขอีก ${5 - shootNumber.length} หลัก`
            }
          </button>
        </div>
      )}

      {/* เลขที่ยิงมา Live — แสดงทั้ง 2 tabs */}
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
    <Suspense fallback={<Loading />}>
      <YeekeePlayContent />
    </Suspense>
  )
}
