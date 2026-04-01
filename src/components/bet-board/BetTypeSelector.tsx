/**
 * BetTypeSelector — เลือกประเภทการแทง (Multi-select)
 *
 * ⭐ Multi-select rules:
 *   - กลุ่ม 3 หลัก: 3ตัวบน + 3ตัวโต๊ด (+ 3ตัวล่าง, 3ตัวหน้า) เลือกพร้อมกันได้
 *   - กลุ่ม 2 หลัก: 2ตัวบน + 2ตัวล่าง เลือกพร้อมกันได้
 *   - กลุ่ม 1 หลัก: วิ่งบน + วิ่งล่าง เลือกพร้อมกันได้
 *   - ข้ามกลุ่ม → reset แล้วเลือกใหม่
 *   เมื่อกดเลข → สร้าง bet ให้ทุก type ที่เลือก
 */

'use client'

import { useBetStore } from '@/store/bet-store'
import type { BetType } from '@/types'

// ชื่อแสดงผลภาษาไทย
const betTypeLabels: Record<string, string> = {
  '3TOP': '3 ตัวบน',
  '3BOTTOM': '3 ตัวล่าง',
  '3TOD': '3 ตัวโต๊ด',
  '3FRONT': '3 ตัวหน้า',
  '3TOD_FRONT': '3 โต๊ดหน้า',
  'PERM3': '3 ตัวกลับ',
  '2TOP': '2 ตัวบน',
  '2BOTTOM': '2 ตัวล่าง',
  '2TOP_UNDER': '2 บน+ล่าง',
  'PERM2': '2 ตัวกลับ',
  'RUN_TOP': 'วิ่งบน',
  'RUN_BOT': 'วิ่งล่าง',
  '19DOOR': '19 ประตู',
  '1TOP': 'ท้าย 1 ตัว',
  '4TOP': '4 ตัวบน',
  '4TOD': '4 ตัวโต๊ด',
}

export default function BetTypeSelector() {
  const { betTypes, selectedBetTypes, toggleBetType } = useBetStore()

  return (
    <div className="grid grid-cols-3 gap-2">
      {betTypes.map((bt) => {
        // ⭐ เช็คว่า type นี้ถูกเลือกอยู่หรือไม่ (multi-select)
        const isSelected = selectedBetTypes.includes(bt.code as BetType)
        return (
          <button
            key={bt.code}
            onClick={() => toggleBetType(bt.code as BetType)}
            className="rounded-xl py-2.5 px-2 text-center transition-all border-2"
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
          </button>
        )
      })}
    </div>
  )
}
