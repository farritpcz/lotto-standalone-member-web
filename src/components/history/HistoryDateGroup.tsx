/**
 * HistoryDateGroup — หัว date + list ของ BillCard (วันนี้ / เมื่อวาน / ก่อนหน้า)
 *
 * ใช้ BillCard render แต่ละบิล — กดบิลแล้วส่ง onBillClick กลับ page
 * Parent: src/app/(member)/history/page.tsx
 */

'use client'

import type { Bill } from './types'
import BillCard from './BillCard'

interface Props {
  label: string
  bills: Bill[]
  onBillClick: (bill: Bill) => void
}

export default function HistoryDateGroup({ label, bills, onBillClick }: Props) {
  return (
    <div>
      {/* Date header */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-secondary-label)', padding: '12px 0 8px' }}>
        {label}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bills.map(bill => (
          <BillCard key={bill.batchId} bill={bill} onClick={onBillClick} />
        ))}
      </div>
    </div>
  )
}
