/**
 * BillCard — การ์ดบิลหนึ่งใบ (3 rows: name/status/amount, numbers, time/count/arrow)
 *
 * กดแล้วเปิด BillDetailSheet (bottom sheet) ผ่าน onClick
 * Parent: src/app/(member)/history/page.tsx (ผ่าน HistoryDateGroup)
 */

'use client'

import { ChevronRight } from 'lucide-react'
import type { Bill } from './types'
import { statusConfig, fmtDate } from './types'

interface Props {
  bill: Bill
  onClick: (bill: Bill) => void
}

export default function BillCard({ bill, onClick }: Props) {
  const cfg = statusConfig[bill.status] || statusConfig.pending
  return (
    <div onClick={() => onClick(bill)} style={{
      background: 'var(--ios-card)', borderRadius: 14, cursor: 'pointer',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      borderLeft: `4px solid ${cfg.border}`,
      padding: '12px 14px',
    }}>
      {/* Row 1: name + status + amount */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)' }}>{bill.lotteryName}</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: cfg.bg, color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ios-label)' }}>฿{bill.totalAmount.toLocaleString()}</div>
          {bill.totalWin > 0 && (
            <div style={{ fontSize: 14, fontWeight: 700, color: '#34C759' }}>+฿{bill.totalWin.toLocaleString()}</div>
          )}
        </div>
      </div>

      {/* Row 2: numbers */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
        {bill.bets.slice(0, 8).map((b, i) => {
          const isWon = b.status === 'won'
          const isBanned = (b.original_rate ?? 0) > 0 && b.original_rate! > b.rate
          return (
            <span key={i} style={{
              fontFamily: 'monospace', fontWeight: 700, fontSize: 14, minWidth: 32, textAlign: 'center',
              padding: '3px 8px', borderRadius: 6,
              background: isWon ? 'rgba(52,199,89,0.12)' : isBanned ? 'rgba(217,119,6,0.08)' : 'rgba(0,0,0,0.04)',
              color: isWon ? '#1a8a40' : isBanned ? '#b45309' : 'var(--ios-label)',
              border: isWon ? '1px solid rgba(52,199,89,0.25)' : '1px solid transparent',
            }}>
              {b.number}
            </span>
          )
        })}
        {bill.bets.length > 8 && <span style={{ fontSize: 12, color: '#999', alignSelf: 'center' }}>+{bill.bets.length - 8}</span>}
      </div>

      {/* Row 3: time + count + arrow */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--ios-tertiary-label)' }}>
          {fmtDate(bill.createdAt)} · {bill.bets.length} รายการ
        </span>
        <ChevronRight size={14} color="var(--ios-tertiary-label)" />
      </div>
    </div>
  )
}
