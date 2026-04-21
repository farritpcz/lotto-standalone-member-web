/**
 * BetSlipHeader — top bar ของ fullscreen modal
 *
 * ปุ่มปิด + หัวข้อ + "เคลียซ้ำ" + "ล้างทั้งหมด"
 * Parent: ../BetSlip.tsx
 */

'use client'

import { X } from 'lucide-react'

interface BetSlipHeaderProps {
  count: number
  onClose: () => void
  onRemoveDuplicates: () => void
  onClearAll: () => void
}

export default function BetSlipHeader({ count, onClose, onRemoveDuplicates, onClearAll }: BetSlipHeaderProps) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--header-bg) 0%, color-mix(in srgb, var(--header-bg) 70%, black) 100%)',
      padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      flexShrink: 0,
    }}>
      {/* ปุ่มปิด modal */}
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <X size={22} color="white" />
      </button>

      {/* หัวข้อ + จำนวนรายการ */}
      <span style={{ color: 'white', fontSize: 17, fontWeight: 700, flex: 1 }}>
        รายการแทง ({count})
      </span>

      {/* ปุ่ม "เคลียซ้ำ" — ลบเลขที่ซ้ำกัน */}
      <button
        onClick={onRemoveDuplicates}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-color)', fontSize: 13, fontWeight: 600 }}
      >
        เคลียซ้ำ
      </button>

      {/* ปุ่ม "ล้างทั้งหมด" */}
      <button
        onClick={onClearAll}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b', fontSize: 13, fontWeight: 600 }}
      >
        ล้างทั้งหมด
      </button>
    </div>
  )
}
