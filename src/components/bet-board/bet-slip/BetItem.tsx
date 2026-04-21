/**
 * BetItem — 1 แถวใน slip (badge + เลข + warning + input ราคา + เรท + ยอดชนะ + ปุ่มลบ)
 *
 * เป็น pure visual row — ไม่มี state ของตัวเอง
 * Parent: ../BetSlip.tsx
 */

'use client'

import { Trash2, AlertTriangle } from 'lucide-react'
import type { BetSlipItem } from '@/store/bet-store'
import type { NumberWarning } from './types'

interface BetItemProps {
  item: BetSlipItem
  groupColor: string
  warn?: NumberWarning
  onUpdateAmount: (id: string, amount: number) => void
  onRemove: (id: string) => void
}

export default function BetItem({ item, groupColor, warn, onUpdateAmount, onRemove }: BetItemProps) {
  // เลขอั้นเต็ม → แสดงแบบจาง (opacity 0.35) เพื่อเตือน
  const isBanned = warn && (warn.status === 'full_ban' || warn.status === 'banned')

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px',
      borderBottom: '0.5px solid var(--ios-separator)',
      opacity: isBanned ? 0.35 : 1,
    }}>
      {/* Badge ชื่อประเภทแทง */}
      <span style={{
        fontSize: 10, fontWeight: 700, color: groupColor,
        background: `${groupColor}15`, padding: '3px 8px', borderRadius: 6,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {item.betTypeName}
      </span>

      {/* เลขที่แทง */}
      <span style={{
        fontFamily: 'monospace', fontWeight: 800, fontSize: 20,
        color: 'var(--ios-label)', minWidth: 36,
      }}>
        {item.number}
      </span>

      {/* Warning icon — แดงถ้าอั้นเต็ม, ส้มถ้าลดเรท */}
      {warn && (
        <AlertTriangle size={14} color={isBanned ? 'var(--ios-red)' : 'var(--ios-orange)'} style={{ flexShrink: 0 }} />
      )}

      <span style={{ flex: 1 }} />

      {/* ราคา input (แก้ทีละรายการ) */}
      <input
        type="number"
        value={item.amount}
        onChange={(e) => onUpdateAmount(item.id, Math.max(1, Number(e.target.value)))}
        min={1}
        style={{
          width: 56, textAlign: 'center', fontSize: 14, fontWeight: 700,
          border: '1.5px solid var(--ios-separator)', borderRadius: 8, padding: '5px 4px',
          background: 'var(--ios-bg)', color: 'var(--ios-label)', outline: 'none',
        }}
      />

      {/* เรท × ราคา */}
      <span style={{ fontSize: 11, color: 'var(--ios-tertiary-label)', minWidth: 36, textAlign: 'right' }}>
        x{item.rate}
      </span>

      {/* ยอดชนะสูงสุด */}
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-color)', minWidth: 60, textAlign: 'right' }}>
        ฿{item.potentialWin.toLocaleString()}
      </span>

      {/* ปุ่มลบแถว */}
      <button onClick={() => onRemove(item.id)} style={{
        padding: 4, background: 'none', border: 'none', cursor: 'pointer',
      }}>
        <Trash2 size={16} color="var(--ios-red)" />
      </button>
    </div>
  )
}
