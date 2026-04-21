/**
 * หน้าโพยหวย — UX/UI Redesign (orchestrator)
 *
 * UX Principles:
 * 1. Date Grouping: วันนี้ / เมื่อวาน / ก่อนหน้า
 * 2. Win/Loss Summary: ยอดแทง + ชนะ + กำไร/ขาดทุน
 * 3. Color Psychology: เขียว=ชนะ, แดง=แพ้, ส้ม=รอ
 * 4. Left border status (ไม่ใช่ gradient bar)
 * 5. Bottom sheet detail (ไม่ใช่ fullscreen)
 * 6. Touch targets 44px + 8pt grid
 *
 * หน้านี้ทำหน้าที่แค่ state + fetch + orchestration
 * Render แยกเป็น sub-components ใน src/components/history/*
 */

'use client'

import { useEffect, useState, useMemo } from 'react'
import { betApi } from '@/lib/api'
import Loading from '@/components/Loading'
import type { Bet } from '@/types'

import {
  type Bill,
  groupIntoBills,
  getDateGroup,
} from '@/components/history/types'
import HistorySummaryCard from '@/components/history/HistorySummaryCard'
import HistoryFilterTabs from '@/components/history/HistoryFilterTabs'
import HistoryEmptyState from '@/components/history/HistoryEmptyState'
import HistoryDateGroup from '@/components/history/HistoryDateGroup'
import HistoryPagination from '@/components/history/HistoryPagination'
import BillDetailSheet from '@/components/history/BillDetailSheet'

export default function HistoryPage() {
  const [bets, setBets] = useState<Bet[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)

  // ⭐ prev-state pattern (react-hooks/set-state-in-effect) — set loading ก่อน fetch
  //    โดยไม่เรียก setState ใน effect body
  const [prevFilter, setPrevFilter] = useState(statusFilter)
  const [prevPage, setPrevPage] = useState(page)
  if (prevFilter !== statusFilter || prevPage !== page) {
    setPrevFilter(statusFilter)
    setPrevPage(page)
    setLoading(true)
  }

  useEffect(() => {
    betApi.getMyBets({ status: statusFilter || undefined, page, per_page: 20 })
      .then(res => { setBets(res.data.data?.items || []); setTotal(res.data.data?.total || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [statusFilter, page])

  const bills = useMemo(() => groupIntoBills(bets), [bets])

  // ─── Summary ──────────────────────────────────────────────
  const summary = useMemo(() => ({
    totalBet: bills.reduce((s, b) => s + b.totalAmount, 0),
    totalWin: bills.reduce((s, b) => s + b.totalWin, 0),
    wonCount: bills.filter(b => b.status === 'won').length,
    totalCount: bills.length,
  }), [bills])

  // ─── Group by date ────────────────────────────────────────
  const dateGroups = useMemo(() => {
    const groups: { label: string; bills: Bill[] }[] = []
    const map = new Map<string, Bill[]>()
    for (const bill of bills) {
      const label = getDateGroup(bill.createdAt)
      if (!map.has(label)) map.set(label, [])
      map.get(label)!.push(bill)
    }
    map.forEach((bills, label) => groups.push({ label, bills }))
    return groups
  }, [bills])

  // ─── Filter counts ────────────────────────────────────────
  const allBills = useMemo(() => groupIntoBills(bets), [bets])
  const filterCounts = useMemo(() => ({
    '': allBills.length,
    pending: allBills.filter(b => b.status === 'pending').length,
    won: allBills.filter(b => b.status === 'won').length,
    lost: allBills.filter(b => b.status === 'lost').length,
  }), [allBills])

  return (
    <div>
      {/* ── Header ────────────────────────────────────────── */}
      <div style={{ padding: '16px 16px 8px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ios-label)', margin: 0 }}>โพยหวย</h1>
      </div>

      {/* ── Summary Card ─────────────────────────────────── */}
      {!loading && bills.length > 0 && (
        <HistorySummaryCard
          totalBet={summary.totalBet}
          totalWin={summary.totalWin}
          wonCount={summary.wonCount}
          totalCount={summary.totalCount}
        />
      )}

      {/* ── Filter Tabs + count ───────────────────────────── */}
      <HistoryFilterTabs
        statusFilter={statusFilter}
        filterCounts={filterCounts}
        onChange={(key) => { setStatusFilter(key); setPage(1) }}
      />

      {/* ── Bills List (grouped by date) ─────────────────── */}
      <div style={{ padding: '0 16px', paddingBottom: 16 }}>
        {loading ? <Loading /> : bills.length === 0 ? (
          <HistoryEmptyState statusFilter={statusFilter} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {dateGroups.map(group => (
              <HistoryDateGroup
                key={group.label}
                label={group.label}
                bills={group.bills}
                onBillClick={setSelectedBill}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <HistoryPagination
            page={page}
            total={total}
            currentCount={bets.length}
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => p + 1)}
          />
        )}
      </div>

      {/* ══ Bill Detail — Bottom Sheet ════════════════════════ */}
      {selectedBill && (
        <BillDetailSheet bill={selectedBill} onClose={() => setSelectedBill(null)} />
      )}

      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  )
}
