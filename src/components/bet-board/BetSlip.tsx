/**
 * BetSlip — สรุปรายการแทงก่อนยืนยัน (แบบเจริญดี88 — teal theme)
 *
 * ⭐ Component นี้ใช้ร่วมกับ provider-game-web (#8) ได้เลย
 *
 * แสดง: ตารางรายการ (ประเภท/เลข/ราคา/เรท/ชนะ/ลบ) + ยอดรวม + ปุ่มยืนยัน
 */

'use client'

import { useBetStore, BetSlipItem } from '@/store/bet-store'

interface BetSlipProps {
  onConfirm: () => void
  loading?: boolean
}

export default function BetSlip({ onConfirm, loading }: BetSlipProps) {
  const { betSlip, removeFromBetSlip, updateAmount, clearBetSlip, getTotalAmount } = useBetStore()

  if (betSlip.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-3xl mb-2">📝</p>
        <p className="text-muted text-sm">ยังไม่มีรายการแทง</p>
        <p className="text-muted text-xs mt-1">เลือกประเภท → กดเลข → เพิ่มรายการ</p>
      </div>
    )
  }

  const totalAmount = getTotalAmount()

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--color-bg-card-alt)' }}
      >
        <h3 className="font-bold text-sm">
          รายการแทง ({betSlip.length})
        </h3>
        <button
          onClick={clearBetSlip}
          className="text-xs font-semibold"
          style={{ color: 'var(--color-red)' }}
        >
          ล้างทั้งหมด
        </button>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-1 px-4 py-2 text-[10px] font-semibold text-muted uppercase tracking-wider border-b border-gray-100">
        <div className="col-span-2">ประเภท</div>
        <div className="col-span-2 text-center">เลข</div>
        <div className="col-span-3 text-center">ราคา</div>
        <div className="col-span-2 text-center">เรท</div>
        <div className="col-span-2 text-right">ชนะ</div>
        <div className="col-span-1"></div>
      </div>

      {/* Bet items */}
      <div className="max-h-60 overflow-y-auto">
        {betSlip.map((item: BetSlipItem) => (
          <div key={item.id} className="grid grid-cols-12 gap-1 items-center px-4 py-2.5 border-b border-gray-50">
            {/* ประเภท */}
            <div className="col-span-2">
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'var(--color-bg-card-alt)' }}>
                {item.betTypeName}
              </span>
            </div>
            {/* เลข */}
            <div className="col-span-2 text-center">
              <span className="font-mono font-bold text-sm" style={{ color: 'var(--color-primary)' }}>
                {item.number}
              </span>
            </div>
            {/* ราคา */}
            <div className="col-span-3 text-center">
              <input
                type="number"
                value={item.amount}
                onChange={(e) => updateAmount(item.id, Math.max(1, Number(e.target.value)))}
                className="w-full text-center text-xs font-bold rounded-lg px-1 py-1.5 border border-gray-200 focus:border-teal-500 focus:outline-none"
                style={{ background: 'var(--color-bg-card-alt)' }}
                min={1}
              />
            </div>
            {/* เรท */}
            <div className="col-span-2 text-center text-xs text-muted">
              x{item.rate}
            </div>
            {/* ชนะ */}
            <div className="col-span-2 text-right text-xs font-semibold" style={{ color: 'var(--color-green)' }}>
              ฿{item.potentialWin.toLocaleString()}
            </div>
            {/* ลบ */}
            <div className="col-span-1 text-right">
              <button
                onClick={() => removeFromBetSlip(item.id)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition"
                style={{ background: 'rgba(229,62,62,0.08)', color: 'var(--color-red)' }}
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer — ยอดรวม + ปุ่มยืนยัน */}
      <div className="px-4 py-3" style={{ background: 'var(--color-bg-card-alt)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted">ยอดรวม</span>
          <span className="text-lg font-bold" style={{ color: 'var(--color-primary-dark)' }}>
            ฿{totalAmount.toLocaleString()}
          </span>
        </div>
        <button
          onClick={onConfirm}
          disabled={loading || betSlip.length === 0}
          className="btn-gold w-full py-3 rounded-xl text-sm"
        >
          {loading ? 'กำลังส่งโพย...' : `ยืนยันแทง (${betSlip.length} รายการ)`}
        </button>
      </div>
    </div>
  )
}
