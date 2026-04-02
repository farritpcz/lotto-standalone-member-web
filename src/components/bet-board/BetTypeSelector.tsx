/**
 * BetTypeSelector — เลือกประเภทการแทง (Multi-select)
 *
 * ⭐ แบ่งกลุ่มตามจำนวนหลัก + แสดง rate จ่าย + สีแยกกลุ่ม
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

// กลุ่มหลัก + สี
const digitGroupConfig: Record<number, { label: string; color: string; bg: string }> = {
  3: { label: '3 หลัก', color: '#0d6e6e', bg: 'rgba(13,110,110,0.06)' },
  4: { label: '4 หลัก', color: '#5856D6', bg: 'rgba(88,86,214,0.06)' },
  2: { label: '2 หลัก', color: '#FF9F0A', bg: 'rgba(255,159,10,0.06)' },
  1: { label: '1 หลัก', color: '#FF3B30', bg: 'rgba(255,59,48,0.06)' },
}

function getDigitCount(code: string): number {
  if (['3TOP', '3BOTTOM', '3TOD', '3FRONT', '3TOD_FRONT', 'PERM3'].includes(code)) return 3
  if (['4TOP', '4TOD'].includes(code)) return 4
  if (['2TOP', '2BOTTOM', '2TOP_UNDER', 'PERM2'].includes(code)) return 2
  if (['RUN_TOP', 'RUN_BOT', '19DOOR', '1TOP'].includes(code)) return 1
  return 0
}

export default function BetTypeSelector() {
  const { betTypes, selectedBetTypes, toggleBetType } = useBetStore()

  // จัดกลุ่มตามจำนวนหลัก
  const groups: Record<number, typeof betTypes> = {}
  betTypes.forEach(bt => {
    const d = getDigitCount(bt.code) || bt.digit_count
    if (!groups[d]) groups[d] = []
    groups[d].push(bt)
  })

  return (
    <div className="space-y-2">
      {Object.entries(groups).map(([digitStr, types]) => {
        const digit = Number(digitStr)
        const cfg = digitGroupConfig[digit] || { label: `${digit} หลัก`, color: '#666', bg: '#f5f5f5' }

        return (
          <div key={digit}>
            {/* Group label */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.color, color: 'white' }}>
                {cfg.label}
              </span>
              <div className="flex-1 h-px" style={{ background: `${cfg.color}20` }} />
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              {types.map((bt) => {
                const isSelected = selectedBetTypes.includes(bt.code as BetType)
                return (
                  <button
                    key={bt.code}
                    onClick={() => toggleBetType(bt.code as BetType)}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-all active:scale-[0.97]"
                    style={{
                      background: isSelected ? cfg.color : cfg.bg,
                      border: `2px solid ${isSelected ? cfg.color : `${cfg.color}30`}`,
                      color: isSelected ? 'white' : 'var(--ios-label)',
                    }}
                  >
                    <span className="font-bold text-sm">
                      {betTypeLabels[bt.code] || bt.name}
                    </span>
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-md" style={{
                      background: isSelected ? 'rgba(255,255,255,0.2)' : `${cfg.color}15`,
                      color: isSelected ? 'white' : cfg.color,
                    }}>
                      x{bt.rate}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
