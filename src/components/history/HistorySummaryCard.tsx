/**
 * HistorySummaryCard — การ์ดสรุปยอด 2x2 ที่อยู่เหนือ filter tabs
 *
 * แสดง: ยอดแทงรวม, กำไร/ขาดทุน (ชนะ-แพ้), ยอดชนะ, อัตราชนะ %
 * Parent: src/app/(member)/history/page.tsx
 */

'use client'

interface Props {
  totalBet: number
  totalWin: number
  wonCount: number
  totalCount: number
}

export default function HistorySummaryCard({ totalBet, totalWin, wonCount, totalCount }: Props) {
  return (
    <div style={{ padding: '0 16px 12px' }}>
      <div style={{
        background: 'var(--ios-card)', borderRadius: 16, padding: 16,
        boxShadow: 'var(--shadow-card)',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ios-secondary-label)', marginBottom: 4 }}>ยอดแทงรวม</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ios-label)' }}>฿{totalBet.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ios-secondary-label)', marginBottom: 4 }}>ชนะ / แพ้</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: totalWin - totalBet >= 0 ? '#34C759' : '#FF3B30' }}>
            {totalWin - totalBet >= 0 ? '+' : ''}฿{(totalWin - totalBet).toLocaleString()}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ios-secondary-label)', marginBottom: 4 }}>ยอดชนะ</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#34C759' }}>+฿{totalWin.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ios-secondary-label)', marginBottom: 4 }}>อัตราชนะ</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ios-label)' }}>
            {totalCount > 0 ? Math.round((wonCount / totalCount) * 100) : 0}%
            <span style={{ fontSize: 12, color: 'var(--ios-secondary-label)', fontWeight: 400 }}> ({wonCount}/{totalCount})</span>
          </div>
        </div>
      </div>
    </div>
  )
}
