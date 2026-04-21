/**
 * HistoryFilterTabs — แถบปุ่มกรองสถานะ (ทั้งหมด/รอผล/ชนะ/แพ้) + count
 *
 * scroll แนวนอนได้ กด tab จะ reset page=1
 * Parent: src/app/(member)/history/page.tsx
 */

'use client'

import { filterTabs } from './types'

interface Props {
  statusFilter: string
  filterCounts: Record<string, number>
  onChange: (key: string) => void
}

export default function HistoryFilterTabs({ statusFilter, filterCounts, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
      {filterTabs.map(tab => {
        const count = filterCounts[tab.key as keyof typeof filterCounts] || 0
        const isActive = statusFilter === tab.key
        return (
          <button key={tab.key} onClick={() => onChange(tab.key)} style={{
            padding: '8px 16px', borderRadius: 20, fontSize: 13, minHeight: 36,
            fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap', flexShrink: 0,
            border: isActive ? 'none' : '1px solid var(--ios-separator)',
            cursor: 'pointer',
            background: isActive ? 'var(--ios-green)' : 'transparent',
            color: isActive ? 'white' : 'var(--ios-label)',
          }}>
            {tab.label}
            {count > 0 && <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.7 }}>({count})</span>}
          </button>
        )
      })}
    </div>
  )
}
