/**
 * หน้าแทงหวย — 3 tabs: กดเลขเอง / เลือกจากแผง / เลขวิน (แบบเจริญดี88)
 *
 * URL: /lottery/THAI, /lottery/YEEKEE, /lottery/STOCK_TH, etc.
 *
 * ความสัมพันธ์:
 * - ใช้ components: NumberPad, BetTypeSelector, BetSlip, NumberGrid, LuckyNumbers
 * - ใช้ store: useBetStore
 * - เรียก API: lotteryApi + betApi → standalone-member-api (#3)
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
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
import { lotteryApi, betApi } from '@/lib/api'
import type { LotteryRound, BetTypeInfo, PlaceBetItem } from '@/types'

type TabKey = 'keypad' | 'grid' | 'lucky'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'keypad', label: 'กดเลขเอง' },
  { key: 'grid', label: 'เลือกจากแผง' },
  { key: 'lucky', label: 'เลขวิน' },
]

export default function LotteryBetPage() {
  const params = useParams()
  const lotteryCode = params.type as string

  const { member, updateBalance } = useAuthStore()
  const { betTypes, selectedBetTypes, betSlip, setBetTypes, setCurrentRound, addToBetSlip, clearBetSlip, getSelectedDigitCount } = useBetStore()

  const [rounds, setRounds] = useState<LotteryRound[]>([])
  const [selectedRound, setSelectedRound] = useState<LotteryRound | null>(null)
  const [betAmount, setBetAmount] = useState(10)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('keypad')

  // โหลดรอบ + bet types
  useEffect(() => {
    const load = async () => {
      try {
        const typesRes = await lotteryApi.getTypes()
        const lt = typesRes.data.data.find((t: { code: string }) => t.code === lotteryCode)
        if (!lt) { setMessage('ไม่พบประเภทหวย'); setLoading(false); return }

        // ⭐ ใช้ getCurrentRound — คืนรอบใกล้ถึงที่สุด 1 รอบ
        //   (open ใกล้ปิด → upcoming ใกล้เปิด) 404 ถ้าไม่มีรอบ
        try {
          const currentRes = await lotteryApi.getCurrentRound(lt.id)
          const round = currentRes.data.data
          if (round) {
            setRounds([round])
            setSelectedRound(round)
            setCurrentRound(round)
          }
        } catch {
          // ไม่มีรอบให้แทง → UI แสดง empty state
          setRounds([])
        }

        const btRes = await lotteryApi.getBetTypes(lt.id)
        setBetTypes(btRes.data.data || [])
      } catch {
        setMessage('ไม่สามารถโหลดข้อมูลได้')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [lotteryCode, setBetTypes, setCurrentRound])

  // เพิ่มเลขลง slip
  const handleAddNumber = useCallback((number: string) => {
    addToBetSlip(number, betAmount)
    setResetKey(prev => prev + 1)
  }, [betAmount, addToBetSlip])

  // กลับตัวเลข (permutation) — เช่น 123 → 132, 213, 231, 312, 321
  const handleReverse = useCallback((number: string) => {
    const perms = new Set<string>()
    const chars = number.split('')

    // Generate all permutations
    const permute = (arr: string[], start: number) => {
      if (start === arr.length) {
        perms.add(arr.join(''))
        return
      }
      for (let i = start; i < arr.length; i++) {
        [arr[start], arr[i]] = [arr[i], arr[start]]
        permute([...arr], start + 1)
      }
    }
    permute(chars, 0)

    // Remove the original number, add all permutations
    perms.delete(number)
    perms.forEach(perm => addToBetSlip(perm, betAmount))
  }, [betAmount, addToBetSlip])

  // ยืนยันแทง — return true ถ้าสำเร็จ, false ถ้าไม่
  // ⭐ return true = สำเร็จ, string = error message ส่งให้ BetSlip แสดง
  const handleConfirm = useCallback(async (): Promise<boolean | string> => {
    if (!selectedRound || betSlip.length === 0) return false
    setSubmitting(true)
    setMessage('')

    try {
      const bets: PlaceBetItem[] = betSlip.map(item => ({
        lottery_round_id: selectedRound.id,
        bet_type_code: item.betType,
        number: item.number,
        amount: item.amount,
      }))

      const res = await betApi.placeBets(bets)
      const data = res.data.data

      if (data.success_count > 0) {
        updateBalance(data.balance_after)
        clearBetSlip()
        setSubmitting(false)
        return true
      }

      if (data.errors && data.errors.length > 0) {
        // แปลง error เป็นภาษาไทย
        const translateReason = (r: string) => {
          if (r.includes('auto-ban') || r.includes('อั้นอัตโนมัติ')) return 'เลขอั้น (ยอดรวมเกินที่กำหนด)'
          if (r.includes('banned') || r.includes('อั้น')) return 'เลขอั้น'
          if (r.includes('insufficient') || r.includes('เครดิต')) return 'เครดิตไม่พอ'
          if (r.includes('closed') || r.includes('ปิดรับ')) return 'ปิดรับแล้ว'
          if (r.includes('limit') || r.includes('เกินวงเงิน') || r.includes('จำกัดยอด')) return 'เกินวงเงิน'
          return r
        }
        const errMsgs = data.errors.map((e: { number: string; bet_type?: string; BetType?: string; reason?: string; Reason?: string }) =>
          `เลข ${e.number}: ${translateReason(e.Reason || e.reason || '')}`
        ).join('\n')
        setMessage(errMsgs)
        setSubmitting(false)
        return errMsgs // ⭐ ส่ง error message กลับให้ BetSlip แสดง
      }
      setSubmitting(false)
      return false
    } catch {
      setSubmitting(false)
      return 'เกิดข้อผิดพลาด กรุณาลองใหม่'
    }
  }, [selectedRound, betSlip, updateBalance, clearBetSlip])

  if (loading) {
    return <Loading />
  }

  // ⭐ Multi-select: digit count จาก bet types ที่เลือก (ใช้กำหนด number pad)
  const digitCount = getSelectedDigitCount() || 3

  return (
    <div>
      {/* Breadcrumb Header */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <Link href="/lobby" className="text-muted hover:text-primary transition">
          <ChevronLeft size={20} strokeWidth={2} />
        </Link>
        <h1 className="text-lg font-bold">แทงหวย {lotteryCode}</h1>
        <div className="flex-1" />
        <div className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(13,110,110,0.08)', color: 'var(--color-primary)' }}>
          ฿{member?.balance?.toLocaleString() || '0'}
        </div>
      </div>

      {/* เลือกรอบ */}
      {rounds.length > 0 && (
        <div className="px-4 mb-3">
          <select
            value={selectedRound?.id || ''}
            onChange={(e) => {
              const r = rounds.find(r => r.id === Number(e.target.value))
              if (r) { setSelectedRound(r); setCurrentRound(r) }
            }}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium border border-gray-200 focus:border-teal-500 focus:outline-none"
            style={{ background: 'var(--color-bg-card)' }}
          >
            {rounds.map(r => (
              <option key={r.id} value={r.id}>รอบ {r.round_number} — ปิด {new Date(r.close_time).toLocaleTimeString('th-TH')}</option>
            ))}
          </select>
        </div>
      )}

      {rounds.length === 0 && (
        <div className="px-4 mb-3">
          <div className="card p-6 text-center">
            <p className="text-muted text-sm">ยังไม่มีรอบเปิดรับแทง</p>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className="px-4 mb-3">
          <div className={`rounded-lg px-4 py-2.5 text-sm font-medium text-center ${
            message.includes('สำเร็จ') ? 'bg-green-50 text-green-600' :
            message.includes('ผิดพลาด') ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
          }`}>
            {message}
          </div>
        </div>
      )}

      {selectedRound && (
        <>
          {/* ประเภทการแทง */}
          <div className="px-4 mb-3">
            <h2 className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider">ประเภทการแทง</h2>
            <BetTypeSelector />
          </div>

          {/* ===== 3 Tabs: กดเลขเอง / เลือกจากแผง / เลขวิน ===== */}
          <div className="px-4 mb-3">
            <div className="card p-1 flex gap-1 mb-3">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === tab.key ? 'text-white shadow-md' : 'text-secondary'
                  }`}
                  style={{ background: activeTab === tab.key ? 'var(--color-primary)' : 'transparent' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content — ต้องเลือกประเภทแทงก่อนถึงจะกดเลขได้ */}
            {selectedBetTypes.length === 0 ? (
              <div className="card p-6 text-center">
                <p className="text-muted text-sm">กรุณาเลือกประเภทการแทงก่อน</p>
              </div>
            ) : (
              <>
                {activeTab === 'keypad' && (
                  <div>
                    <h2 className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider">กดเลข ({digitCount} หลัก)</h2>
                    <NumberPad
                      digitCount={digitCount}
                      onComplete={handleAddNumber}
                      resetTrigger={resetKey}
                    />
                  </div>
                )}

                {activeTab === 'grid' && (
                  <NumberGrid
                    digitCount={digitCount}
                    onSelect={handleAddNumber}
                  />
                )}

                {activeTab === 'lucky' && (
                  <LuckyNumbers
                    digitCount={digitCount}
                    onSelect={handleAddNumber}
                  />
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
    </div>
  )
}
