/**
 * BetSlipActions — "ใส่ราคาทั้งหมด" (5/10/20/50/100 + custom input)
 *
 * ปุ่ม preset + input ค่าอื่นๆ สำหรับใส่ราคาทุกรายการใน slip
 * Parent: ../BetSlip.tsx
 */

'use client'

import { BULK_AMOUNT_PRESETS } from './types'

interface BetSlipActionsProps {
  bulkAmount: string
  onApplyPreset: (amt: number) => void
  onBulkAmountChange: (value: string) => void
}

export default function BetSlipActions({ bulkAmount, onApplyPreset, onBulkAmountChange }: BetSlipActionsProps) {
  return (
    <div style={{ padding: '10px 16px', borderBottom: '0.5px solid var(--ios-separator)' }}>
      {/* หัวข้อเล็ก */}
      <div style={{
        fontSize: 11, fontWeight: 700, color: 'var(--ios-secondary-label)',
        marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3,
      }}>
        ใส่ราคาทั้งหมด
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {/* ปุ่ม preset */}
        {BULK_AMOUNT_PRESETS.map(amt => (
          <button
            key={amt}
            onClick={() => onApplyPreset(amt)}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13, fontWeight: 700,
              border: bulkAmount === String(amt) ? '1.5px solid var(--accent-color)' : '1.5px solid var(--ios-separator)',
              background: bulkAmount === String(amt) ? 'color-mix(in srgb, var(--accent-color) 15%, transparent)' : 'var(--ios-bg)',
              color: bulkAmount === String(amt) ? 'var(--accent-color)' : 'var(--ios-label)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            ฿{amt}
          </button>
        ))}

        {/* input ราคาเอง */}
        <input
          type="number"
          placeholder="อื่นๆ"
          value={bulkAmount}
          onChange={(e) => onBulkAmountChange(e.target.value)}
          min={1}
          style={{
            width: 64, textAlign: 'center', fontSize: 13, fontWeight: 700,
            border: '1.5px solid var(--ios-separator)', borderRadius: 8, padding: '7px 4px',
            background: 'var(--ios-bg)', color: 'var(--ios-label)', outline: 'none',
          }}
        />
      </div>
    </div>
  )
}
