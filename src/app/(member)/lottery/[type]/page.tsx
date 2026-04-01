/**
 * หน้าแทงหวย — เลือกประเภท → เลือก bet type → กดเลข → เพิ่มลง slip → ยืนยัน
 *
 * URL: /lottery/THAI, /lottery/YEEKEE, /lottery/STOCK_TH, etc.
 *
 * ความสัมพันธ์:
 * - ใช้ components: NumberPad, BetTypeSelector, BetSlip
 * - ใช้ store: useBetStore
 * - เรียก API: lotteryApi + betApi → standalone-member-api (#3)
 * - provider-game-web (#8) มีหน้าเหมือนกัน (share components ได้)
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import NumberPad from '@/components/number-pad/NumberPad'
import BetTypeSelector from '@/components/bet-board/BetTypeSelector'
import BetSlip from '@/components/bet-board/BetSlip'
import { useBetStore } from '@/store/bet-store'
import { useAuthStore } from '@/store/auth-store'
import { lotteryApi, betApi } from '@/lib/api'
import type { LotteryRound, BetTypeInfo, PlaceBetItem } from '@/types'

export default function LotteryBetPage() {
  const params = useParams()
  const lotteryCode = params.type as string // THAI, YEEKEE, etc.

  const { member, updateBalance } = useAuthStore()
  const { betTypes, selectedBetType, betSlip, setBetTypes, setCurrentRound, addToBetSlip, clearBetSlip } = useBetStore()

  const [rounds, setRounds] = useState<LotteryRound[]>([])
  const [selectedRound, setSelectedRound] = useState<LotteryRound | null>(null)
  const [betAmount, setBetAmount] = useState(10) // default 10 บาท
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [message, setMessage] = useState('')

  // โหลดรอบ + bet types
  useEffect(() => {
    const load = async () => {
      try {
        // ดึง lottery types → หา ID จาก code
        const typesRes = await lotteryApi.getTypes()
        const lt = typesRes.data.data.find((t: { code: string }) => t.code === lotteryCode)
        if (!lt) { setMessage('ไม่พบประเภทหวย'); setLoading(false); return }

        // ดึงรอบที่เปิด
        const roundsRes = await lotteryApi.getOpenRounds(lt.id)
        setRounds(roundsRes.data.data || [])
        if (roundsRes.data.data?.length > 0) {
          setSelectedRound(roundsRes.data.data[0])
          setCurrentRound(roundsRes.data.data[0])
        }

        // ดึง bet types + rates
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

  // เมื่อกดเลขครบหลัก → เพิ่มลง bet slip
  const handleNumberComplete = useCallback((number: string) => {
    addToBetSlip(number, betAmount)
    setResetKey(prev => prev + 1) // reset number pad
  }, [betAmount, addToBetSlip])

  // ยืนยันแทง
  const handleConfirm = useCallback(async () => {
    if (!selectedRound || betSlip.length === 0) return
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
        setMessage(`✅ แทงสำเร็จ ${data.success_count} รายการ (฿${data.total_amount.toLocaleString()})`)
        updateBalance(data.balance_after)
        clearBetSlip()
      }

      if (data.errors && data.errors.length > 0) {
        const errMsgs = data.errors.map((e: { number: string; reason: string }) => `${e.number}: ${e.reason}`).join(', ')
        setMessage(prev => prev + ` ⚠️ ไม่สำเร็จ: ${errMsgs}`)
      }
    } catch {
      setMessage('❌ เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }, [selectedRound, betSlip, updateBalance, clearBetSlip])

  if (loading) {
    return <div className="p-6 text-center text-gray-400">กำลังโหลด...</div>
  }

  // หาจำนวนหลักจาก bet type ที่เลือก
  const selectedBT = betTypes.find((bt: BetTypeInfo) => bt.code === selectedBetType)
  const digitCount = selectedBT?.digit_count || 3

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">แทงหวย {lotteryCode}</h1>
        <div className="text-sm text-gray-400">
          ยอดเงิน: <span className="text-green-400 font-semibold">฿{member?.balance?.toLocaleString() || '0'}</span>
        </div>
      </div>

      {/* เลือกรอบ */}
      {rounds.length > 0 && (
        <div className="mb-4">
          <label className="text-gray-400 text-sm mb-1 block">เลือกรอบ</label>
          <select
            value={selectedRound?.id || ''}
            onChange={(e) => {
              const r = rounds.find(r => r.id === Number(e.target.value))
              if (r) { setSelectedRound(r); setCurrentRound(r) }
            }}
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2"
          >
            {rounds.map(r => (
              <option key={r.id} value={r.id}>{r.round_number} — ปิด {new Date(r.close_time).toLocaleTimeString('th-TH')}</option>
            ))}
          </select>
        </div>
      )}

      {rounds.length === 0 && (
        <div className="bg-gray-800 rounded-xl p-6 text-center text-gray-500 mb-4">
          ยังไม่มีรอบเปิดรับแทง
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`rounded-lg px-4 py-3 mb-4 text-sm ${message.includes('✅') ? 'bg-green-900/30 text-green-400' : message.includes('❌') ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
          {message}
        </div>
      )}

      {selectedRound && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ซ้าย: เลือกประเภท + กดเลข */}
          <div>
            {/* เลือกประเภทการแทง */}
            <div className="mb-4">
              <h2 className="text-gray-400 text-sm mb-2">ประเภทการแทง</h2>
              <BetTypeSelector />
            </div>

            {/* จำนวนเงิน */}
            <div className="mb-4">
              <h2 className="text-gray-400 text-sm mb-2">จำนวนเงิน (บาท)</h2>
              <div className="flex gap-2">
                {[10, 50, 100, 500].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setBetAmount(amt)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition
                      ${betAmount === amt ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                  >
                    ฿{amt}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                className="w-full mt-2 bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2 text-center"
                min={1}
              />
            </div>

            {/* กดเลข */}
            {selectedBetType && (
              <div>
                <h2 className="text-gray-400 text-sm mb-2">กดเลข ({digitCount} หลัก)</h2>
                <NumberPad
                  digitCount={digitCount}
                  onComplete={handleNumberComplete}
                  resetTrigger={resetKey}
                />
              </div>
            )}
          </div>

          {/* ขวา: Bet Slip */}
          <div>
            <h2 className="text-gray-400 text-sm mb-2">รายการแทง</h2>
            <BetSlip onConfirm={handleConfirm} loading={submitting} />
          </div>
        </div>
      )}
    </div>
  )
}
