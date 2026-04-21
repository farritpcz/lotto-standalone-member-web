/**
 * HistoryPagination — ปุ่ม ก่อนหน้า / ถัดไป + เลขหน้า
 *
 * แสดงเมื่อ total > 20 เท่านั้น (page size = 20)
 * Parent: src/app/(member)/history/page.tsx
 */

'use client'

interface Props {
  page: number
  total: number
  currentCount: number
  onPrev: () => void
  onNext: () => void
}

export default function HistoryPagination({ page, total, currentCount, onPrev, onNext }: Props) {
  const prevDisabled = page === 1
  const nextDisabled = currentCount < 20
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
      <button onClick={onPrev} disabled={prevDisabled}
        style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, minHeight: 44, border: 'none', cursor: prevDisabled ? 'default' : 'pointer', background: 'var(--ios-card)', color: prevDisabled ? 'var(--ios-tertiary-label)' : 'var(--ios-label)', boxShadow: 'var(--shadow-card)' }}>
        ← ก่อนหน้า
      </button>
      <span style={{ fontSize: 13, color: 'var(--ios-secondary-label)', alignSelf: 'center' }}>
        หน้า {page}/{Math.ceil(total / 20)}
      </span>
      <button onClick={onNext} disabled={nextDisabled}
        style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, minHeight: 44, border: 'none', cursor: nextDisabled ? 'default' : 'pointer', background: 'var(--ios-card)', color: nextDisabled ? 'var(--ios-tertiary-label)' : 'var(--ios-label)', boxShadow: 'var(--shadow-card)' }}>
        ถัดไป →
      </button>
    </div>
  )
}
