/**
 * BetTypeSelector — เลือกประเภทการแทง (แบบเจริญดี88 — teal theme)
 *
 * ⭐ Share กับ provider-game-web (#8)
 *
 * แสดง: ปุ่มเลือก bet type + rate จ่าย + จำนวนหลัก
 */

'use client'

import { useBetStore } from '@/store/bet-store'
import type { BetType } from '@/types'

// ชื่อแสดงผลภาษาไทย
const betTypeLabels: Record<string, string> = {
  '3TOP': '3 ตัวบน',
  '3BOTTOM': '3 ตัวล่าง',
  '3TOD': '3 ตัวโต๊ด',
  '2TOP': '2 ตัวบน',
  '2BOTTOM': '2 ตัวล่าง',
  'RUN_TOP': 'วิ่งบน',
  'RUN_BOT': 'วิ่งล่าง',
  '4TOP': '4 ตัวบน',
  '4TOD': '4 ตัวโต๊ด',
  '3FRONT': '3 ตัวหน้า',
}

export default function BetTypeSelector() {
  const { betTypes, selectedBetType, selectBetType } = useBetStore()

  return (
    <div className="grid grid-cols-3 gap-2">
      {betTypes.map((bt) => {
        const isSelected = selectedBetType === bt.code
        return (
          <button
            key={bt.code}
            onClick={() => selectBetType(bt.code as BetType)}
            className="rounded-xl p-3 text-center transition-all border-2"
            style={{
              background: isSelected ? 'var(--color-primary)' : 'var(--color-bg-card)',
              borderColor: isSelected ? 'var(--color-primary)' : 'transparent',
              boxShadow: isSelected ? 'none' : 'var(--shadow-card)',
              color: isSelected ? 'white' : 'var(--color-text)',
            }}
          >
            <div className="font-bold text-sm">
              {betTypeLabels[bt.code] || bt.name}
            </div>
            <div
              className="text-xs mt-0.5"
              style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)' }}
            >
              จ่าย x{bt.rate}
            </div>
            <div
              className="text-[10px]"
              style={{ color: isSelected ? 'rgba(255,255,255,0.5)' : 'var(--color-text-muted)' }}
            >
              {bt.digit_count} หลัก
            </div>
          </button>
        )
      })}
    </div>
  )
}
