/**
 * HistoryEmptyState — การ์ดแสดงเมื่อไม่มีบิล
 *
 * แสดงข้อความต่างกันตาม statusFilter (เช่น "ไม่มีบิลชนะ")
 * Parent: src/app/(member)/history/page.tsx
 */

'use client'

import { filterTabs } from './types'

interface Props {
  statusFilter: string
}

export default function HistoryEmptyState({ statusFilter }: Props) {
  return (
    <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '48px 16px', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)', marginBottom: 4 }}>
        {statusFilter ? `ไม่มีบิล${filterTabs.find(t => t.key === statusFilter)?.label}` : 'ยังไม่มีประวัติการแทง'}
      </p>
      <p style={{ fontSize: 13, color: 'var(--ios-secondary-label)' }}>เริ่มแทงหวยเพื่อดูประวัติของคุณ</p>
    </div>
  )
}
