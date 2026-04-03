/**
 * BetTypeSelector — เลือกประเภทการแทง (Multi-select)
 *
 * ⭐ Layout ตามแบบ reference — flat grid 2 คอลัมน์ ไม่แบ่งกลุ่ม
 * ชื่อไทย + rate จ่ายอยู่ในปุ่มเดียวกัน
 */

'use client'

import { useBetStore } from '@/store/bet-store'
import type { BetType } from '@/types'

// ชื่อแสดงผลภาษาไทย (แบบ reference — ใช้คำเต็ม)
const betTypeLabels: Record<string, string> = {
  '4TOP': 'สี่ตัวบน',
  '4TOD': 'สี่ตัวโต๊ด',
  '3TOP': 'สามตัวบน',
  '3BOTTOM': 'สามตัวล่าง',
  '3TOD': 'สามตัวโต๊ด',
  '3FRONT': 'สามตัวหน้า',
  '3TOD_FRONT': 'สามโต๊ดหน้า',
  'PERM3': 'สามตัวกลับ',
  '2TOP': 'สองตัวบน',
  '2BOTTOM': 'สองตัวล่าง',
  '2TOP_UNDER': 'สองบน+ล่าง',
  'PERM2': 'สองตัวกลับ',
  'RUN_TOP': 'วิ่งบน',
  'RUN_BOT': 'วิ่งล่าง',
  '19DOOR': '19 ประตู',
  '1TOP': 'ท้าย 1 ตัว',
}

// ลำดับการแสดงผล (4 หลัก → 3 หลัก → 2 หลัก → 1 หลัก)
function getSortOrder(code: string): number {
  const order: Record<string, number> = {
    '4TOP': 1, '4TOD': 2,
    '3TOP': 3, '3TOD': 4, '3FRONT': 5, '3BOTTOM': 6, '3TOD_FRONT': 7, 'PERM3': 8,
    '2TOP': 9, '2BOTTOM': 10, '2TOP_UNDER': 11, 'PERM2': 12,
    'RUN_TOP': 13, 'RUN_BOT': 14, '19DOOR': 15, '1TOP': 16,
  }
  return order[code] || 99
}

export default function BetTypeSelector() {
  const { betTypes, selectedBetTypes, toggleBetType } = useBetStore()

  // เรียงลำดับ
  const sorted = [...betTypes].sort((a, b) => getSortOrder(a.code) - getSortOrder(b.code))

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
      padding: '4px 0',
    }}>
      {sorted.map((bt) => {
        const isSelected = selectedBetTypes.includes(bt.code as BetType)
        return (
          <button
            key={bt.code}
            onClick={() => toggleBetType(bt.code as BetType)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 4,
              padding: '10px 8px',
              borderRadius: 12,
              border: isSelected ? '2px solid var(--accent-color)' : '2px solid var(--ios-separator)',
              background: isSelected
                ? 'color-mix(in srgb, var(--accent-color) 15%, transparent)'
                : 'var(--ios-card)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              minHeight: 56,
            }}
          >
            {/* ชื่อประเภท */}
            <span style={{
              fontSize: 14, fontWeight: 700,
              color: isSelected ? 'var(--accent-color)' : 'var(--ios-label)',
            }}>
              {betTypeLabels[bt.code] || bt.name}
            </span>
            {/* Rate badge */}
            <span style={{
              fontSize: 12, fontWeight: 700,
              padding: '2px 10px', borderRadius: 6,
              background: isSelected
                ? 'var(--accent-color)'
                : 'color-mix(in srgb, var(--accent-color) 12%, transparent)',
              color: isSelected ? '#1a1a1a' : 'var(--accent-color)',
            }}>
              {bt.rate.toLocaleString()}
            </span>
          </button>
        )
      })}
    </div>
  )
}
