/**
 * Types + constants + helpers สำหรับหน้าโพยหวย
 *
 * เก็บ: statusConfig, filterTabs, Bill interface, groupIntoBills,
 *      getDateGroup, fmtDate — แชร์ให้ sub-components ทุกตัว
 * Parent: src/app/(member)/history/page.tsx
 */

import type { Bet } from '@/types'

// ─── Status Config ──────────────────────────────────────────
export const statusConfig: Record<string, { bg: string; color: string; border: string; label: string }> = {
  pending:   { bg: 'rgba(255,149,0,0.10)',  color: '#FF9500', border: '#FF9500', label: 'รอผล' },
  won:       { bg: 'rgba(52,199,89,0.10)',  color: '#1a8a40', border: '#34C759', label: 'ชนะ' },
  lost:      { bg: 'rgba(255,59,48,0.10)',  color: '#FF3B30', border: '#FF3B30', label: 'แพ้' },
  cancelled: { bg: 'rgba(142,142,147,0.10)', color: '#8E8E93', border: '#8E8E93', label: 'ยกเลิก' },
  refunded:  { bg: 'rgba(0,122,255,0.10)',  color: '#007AFF', border: '#007AFF', label: 'คืนเงิน' },
}

export const filterTabs = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รอผล' },
  { key: 'won', label: 'ชนะ' },
  { key: 'lost', label: 'แพ้' },
]

// ─── Bill interface ─────────────────────────────────────────
export interface Bill {
  batchId: string; bets: Bet[]; totalAmount: number; totalWin: number
  status: string; lotteryName: string; createdAt: string
}

export function groupIntoBills(bets: Bet[]): Bill[] {
  const map = new Map<string, Bet[]>()
  for (const bet of bets) {
    const key = bet.batch_id || `single-${bet.id}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(bet)
  }
  return Array.from(map.entries()).map(([batchId, bets]) => {
    const totalAmount = bets.reduce((s, b) => s + b.amount, 0)
    const totalWin = bets.reduce((s, b) => s + (b.win_amount || 0), 0)
    const hasWon = bets.some(b => b.status === 'won')
    const hasPending = bets.some(b => b.status === 'pending')
    return {
      batchId, bets, totalAmount, totalWin,
      status: hasPending ? 'pending' : hasWon ? 'won' : 'lost',
      lotteryName: bets[0]?.lottery_round?.lottery_type?.name || 'หวย',
      createdAt: bets[0]?.created_at || '',
    }
  })
}

// ─── Date grouping helpers ──────────────────────────────────
export function getDateGroup(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today.getTime() - 86400000)
  if (d.toDateString() === today.toDateString()) return 'วันนี้'
  if (d.toDateString() === yesterday.toDateString()) return 'เมื่อวาน'
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

export const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }
  catch { return d }
}
