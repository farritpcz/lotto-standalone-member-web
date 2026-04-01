/**
 * BetSlip — สรุปรายการแทงก่อนยืนยัน
 *
 * ⭐ Component นี้ใช้ร่วมกับ provider-game-web (#8) ได้เลย
 * TODO: แยกเป็น @lotto/game-ui npm package
 *
 * แสดง: รายการเลขที่เลือก + จำนวนเงิน + ยอดรวม + ปุ่มยืนยัน
 */

'use client'

import { useBetStore, BetSlipItem } from '@/store/bet-store'

interface BetSlipProps {
  /** callback เมื่อกดยืนยัน */
  onConfirm: () => void
  /** กำลัง submit อยู่ */
  loading?: boolean
}

export default function BetSlip({ onConfirm, loading }: BetSlipProps) {
  const { betSlip, removeFromBetSlip, updateAmount, clearBetSlip, getTotalAmount } = useBetStore()

  if (betSlip.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-4 text-center">
        <p className="text-gray-500 text-sm">ยังไม่มีรายการแทง</p>
        <p className="text-gray-600 text-xs mt-1">เลือกประเภท → กดเลข → เพิ่มรายการ</p>
      </div>
    )
  }

  const totalAmount = getTotalAmount()

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-700/50">
        <h3 className="text-white font-semibold text-sm">
          รายการแทง ({betSlip.length})
        </h3>
        <button
          onClick={clearBetSlip}
          className="text-red-400 hover:text-red-300 text-xs"
        >
          ล้างทั้งหมด
        </button>
      </div>

      {/* Bet items */}
      <div className="max-h-64 overflow-y-auto">
        {betSlip.map((item: BetSlipItem) => (
          <div key={item.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
            <div className="flex-1">
              {/* เลข + ประเภท */}
              <div className="flex items-center gap-2">
                <span className="text-white font-mono font-bold text-lg">{item.number}</span>
                <span className="text-gray-400 text-xs bg-gray-700 px-2 py-0.5 rounded">
                  {item.betTypeName}
                </span>
              </div>
              {/* Rate + potential win */}
              <div className="text-gray-500 text-xs mt-0.5">
                rate ×{item.rate} → ได้ ฿{item.potentialWin.toLocaleString()}
              </div>
            </div>

            {/* จำนวนเงิน */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={item.amount}
                onChange={(e) => updateAmount(item.id, Math.max(1, Number(e.target.value)))}
                className="w-20 bg-gray-700 text-white text-right text-sm rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:outline-none"
                min={1}
              />
              <button
                onClick={() => removeFromBetSlip(item.id)}
                className="text-red-500 hover:text-red-400 text-lg"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer — ยอดรวม + ปุ่มยืนยัน */}
      <div className="px-4 py-3 bg-gray-700/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 text-sm">ยอดรวม</span>
          <span className="text-white font-bold text-lg">฿{totalAmount.toLocaleString()}</span>
        </div>
        <button
          onClick={onConfirm}
          disabled={loading || betSlip.length === 0}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed
            text-white font-semibold py-3 rounded-xl transition"
        >
          {loading ? 'กำลังแทง...' : `ยืนยันแทง (${betSlip.length} รายการ)`}
        </button>
      </div>
    </div>
  )
}
