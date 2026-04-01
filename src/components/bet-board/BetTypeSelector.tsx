/**
 * BetTypeSelector — เลือกประเภทการแทง (3ตัวบน, 2ตัวล่าง, วิ่ง, etc.)
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
  '3TOD': '3 ตัวโต๊ด',
  '2TOP': '2 ตัวบน',
  '2BOTTOM': '2 ตัวล่าง',
  'RUN_TOP': 'วิ่งบน',
  'RUN_BOT': 'วิ่งล่าง',
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
            className={`rounded-xl p-3 text-center transition border-2
              ${isSelected
                ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
              }`}
          >
            <div className="font-semibold text-sm">
              {betTypeLabels[bt.code] || bt.name}
            </div>
            <div className="text-xs mt-1 text-gray-500">
              จ่าย ×{bt.rate}
            </div>
            <div className="text-xs text-gray-600">
              {bt.digit_count} หลัก
            </div>
          </button>
        )
      })}
    </div>
  )
}
