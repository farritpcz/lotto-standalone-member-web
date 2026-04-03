/**
 * หน้าโพยหวย — UX/UI Redesign
 *
 * UX Principles:
 * 1. Date Grouping: วันนี้ / เมื่อวาน / ก่อนหน้า
 * 2. Win/Loss Summary: ยอดแทง + ชนะ + กำไร/ขาดทุน
 * 3. Color Psychology: เขียว=ชนะ, แดง=แพ้, ส้ม=รอ
 * 4. Left border status (ไม่ใช่ gradient bar)
 * 5. Bottom sheet detail (ไม่ใช่ fullscreen)
 * 6. Touch targets 44px + 8pt grid
 */

'use client'

import { useEffect, useState, useMemo } from 'react'
import { ChevronRight, X } from 'lucide-react'
import { betApi } from '@/lib/api'
import Loading from '@/components/Loading'
import type { Bet } from '@/types'

// ─── Status Config ──────────────────────────────────────────
const statusConfig: Record<string, { bg: string; color: string; border: string; label: string }> = {
  pending:   { bg: 'rgba(255,149,0,0.10)',  color: '#FF9500', border: '#FF9500', label: 'รอผล' },
  won:       { bg: 'rgba(52,199,89,0.10)',  color: '#1a8a40', border: '#34C759', label: 'ชนะ' },
  lost:      { bg: 'rgba(255,59,48,0.10)',  color: '#FF3B30', border: '#FF3B30', label: 'แพ้' },
  cancelled: { bg: 'rgba(142,142,147,0.10)', color: '#8E8E93', border: '#8E8E93', label: 'ยกเลิก' },
  refunded:  { bg: 'rgba(0,122,255,0.10)',  color: '#007AFF', border: '#007AFF', label: 'คืนเงิน' },
}

const filterTabs = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รอผล' },
  { key: 'won', label: 'ชนะ' },
  { key: 'lost', label: 'แพ้' },
]

// ─── Bill interface ─────────────────────────────────────────
interface Bill {
  batchId: string; bets: Bet[]; totalAmount: number; totalWin: number
  status: string; lotteryName: string; createdAt: string
}

function groupIntoBills(bets: Bet[]): Bill[] {
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
function getDateGroup(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today.getTime() - 86400000)
  if (d.toDateString() === today.toDateString()) return 'วันนี้'
  if (d.toDateString() === yesterday.toDateString()) return 'เมื่อวาน'
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

export default function HistoryPage() {
  const [bets, setBets] = useState<Bet[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)

  useEffect(() => {
    setLoading(true)
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

  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }
    catch { return d }
  }

  return (
    <div>
      {/* ── Header ────────────────────────────────────────── */}
      <div style={{ padding: '16px 16px 8px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ios-label)', margin: 0 }}>โพยหวย</h1>
      </div>

      {/* ── Summary Card ─────────────────────────────────── */}
      {!loading && bills.length > 0 && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{
            background: 'var(--ios-card)', borderRadius: 16, padding: 16,
            boxShadow: 'var(--shadow-card)',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--ios-secondary-label)', marginBottom: 4 }}>ยอดแทงรวม</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ios-label)' }}>฿{summary.totalBet.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--ios-secondary-label)', marginBottom: 4 }}>ชนะ / แพ้</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: summary.totalWin - summary.totalBet >= 0 ? '#34C759' : '#FF3B30' }}>
                {summary.totalWin - summary.totalBet >= 0 ? '+' : ''}฿{(summary.totalWin - summary.totalBet).toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--ios-secondary-label)', marginBottom: 4 }}>ยอดชนะ</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#34C759' }}>+฿{summary.totalWin.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--ios-secondary-label)', marginBottom: 4 }}>อัตราชนะ</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ios-label)' }}>
                {summary.totalCount > 0 ? Math.round((summary.wonCount / summary.totalCount) * 100) : 0}%
                <span style={{ fontSize: 12, color: 'var(--ios-secondary-label)', fontWeight: 400 }}> ({summary.wonCount}/{summary.totalCount})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter Tabs + count ───────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {filterTabs.map(tab => {
          const count = filterCounts[tab.key as keyof typeof filterCounts] || 0
          const isActive = statusFilter === tab.key
          return (
            <button key={tab.key} onClick={() => { setStatusFilter(tab.key); setPage(1) }} style={{
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

      {/* ── Bills List (grouped by date) ─────────────────── */}
      <div style={{ padding: '0 16px', paddingBottom: 16 }}>
        {loading ? <Loading /> : bills.length === 0 ? (
          <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '48px 16px', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)', marginBottom: 4 }}>
              {statusFilter ? `ไม่มีบิล${filterTabs.find(t => t.key === statusFilter)?.label}` : 'ยังไม่มีประวัติการแทง'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--ios-secondary-label)' }}>เริ่มแทงหวยเพื่อดูประวัติของคุณ</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {dateGroups.map(group => (
              <div key={group.label}>
                {/* Date header */}
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-secondary-label)', padding: '12px 0 8px' }}>
                  {group.label}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {group.bills.map(bill => {
                    const cfg = statusConfig[bill.status] || statusConfig.pending
                    return (
                      <div key={bill.batchId} onClick={() => setSelectedBill(bill)} style={{
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
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, minHeight: 44, border: 'none', cursor: page === 1 ? 'default' : 'pointer', background: 'var(--ios-card)', color: page === 1 ? 'var(--ios-tertiary-label)' : 'var(--ios-label)', boxShadow: 'var(--shadow-card)' }}>
              ← ก่อนหน้า
            </button>
            <span style={{ fontSize: 13, color: 'var(--ios-secondary-label)', alignSelf: 'center' }}>
              หน้า {page}/{Math.ceil(total / 20)}
            </span>
            <button onClick={() => setPage(p => p + 1)} disabled={bets.length < 20}
              style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, minHeight: 44, border: 'none', cursor: bets.length < 20 ? 'default' : 'pointer', background: 'var(--ios-card)', color: bets.length < 20 ? 'var(--ios-tertiary-label)' : 'var(--ios-label)', boxShadow: 'var(--shadow-card)' }}>
              ถัดไป →
            </button>
          </div>
        )}
      </div>

      {/* ══ Bill Detail — Bottom Sheet ════════════════════════ */}
      {selectedBill && (() => {
        const bill = selectedBill
        const cfg = statusConfig[bill.status] || statusConfig.pending
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={() => setSelectedBill(null)}>
            {/* Scrim */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />

            {/* Bottom sheet */}
            <div onClick={e => e.stopPropagation()} style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              maxWidth: 680, margin: '0 auto',
              background: 'var(--ios-bg, white)', borderRadius: '20px 20px 0 0',
              maxHeight: '85dvh', display: 'flex', flexDirection: 'column',
              animation: 'slideUp 0.3s cubic-bezier(0.34,1.2,0.64,1)',
            }}>
              {/* Drag handle */}
              <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
                <div style={{ width: 40, height: 4, background: '#ddd', borderRadius: 2, margin: '0 auto' }} />
              </div>

              {/* Summary */}
              <div style={{ padding: '0 16px 12px', borderBottom: '0.5px solid var(--ios-separator, #e5e5e5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ios-label)' }}>{bill.lotteryName}</div>
                    <div style={{ fontSize: 12, color: 'var(--ios-secondary-label)' }}>{fmtDate(bill.createdAt)} · {bill.bets.length} รายการ</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                  <div>
                    <span style={{ color: 'var(--ios-secondary-label)' }}>ยอดแทง </span>
                    <span style={{ fontWeight: 700 }}>฿{bill.totalAmount.toLocaleString()}</span>
                  </div>
                  {bill.totalWin > 0 && (
                    <div>
                      <span style={{ color: 'var(--ios-secondary-label)' }}>ชนะ </span>
                      <span style={{ fontWeight: 700, color: '#34C759' }}>+฿{bill.totalWin.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bet items (scrollable) */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
                {bill.bets.map((bet, idx) => {
                  const betCfg = statusConfig[bet.status] || statusConfig.pending
                  const isRateReduced = (bet.original_rate ?? 0) > 0 && bet.original_rate! > bet.rate
                  return (
                    <div key={bet.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                      borderBottom: idx < bill.bets.length - 1 ? '0.5px solid var(--ios-separator, #f0f0f0)' : 'none',
                    }}>
                      {/* Number */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 10,
                        background: bet.status === 'won' ? 'rgba(52,199,89,0.12)' : isRateReduced ? 'rgba(217,119,6,0.08)' : 'rgba(0,0,0,0.04)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 16, fontFamily: 'monospace', flexShrink: 0,
                        color: bet.status === 'won' ? '#1a8a40' : isRateReduced ? '#b45309' : 'var(--ios-label)',
                        border: bet.status === 'won' ? '1.5px solid rgba(52,199,89,0.3)' : '1px solid transparent',
                      }}>
                        {bet.number}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{bet.bet_type?.name}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: betCfg.bg, color: betCfg.color }}>{betCfg.label}</span>
                          {isRateReduced && <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: 'rgba(245,158,11,0.1)', color: '#b45309' }}>เลขอั้น</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ios-secondary-label)' }}>
                          {isRateReduced ? (
                            <><span style={{ textDecoration: 'line-through', color: '#ccc', marginRight: 4 }}>x{bet.original_rate}</span><span style={{ color: '#b45309' }}>x{bet.rate}</span></>
                          ) : <span>x{bet.rate}</span>}
                          {' · '}ถูกได้ <span style={{ color: '#0d6e6e', fontWeight: 500 }}>฿{(bet.amount * bet.rate).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Amount */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>฿{bet.amount.toLocaleString()}</div>
                        {bet.status === 'won' && <div style={{ fontSize: 13, fontWeight: 700, color: '#34C759' }}>+฿{bet.win_amount.toLocaleString()}</div>}
                      </div>
                    </div>
                  )
                })}

                {/* ผลรางวัล */}
                {bill.bets[0]?.lottery_round?.result_top3 && (
                  <div style={{ padding: '12px 0' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-secondary-label)', marginBottom: 10 }}>ผลรางวัล</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      {[
                        { label: '3 ตัวบน', value: bill.bets[0].lottery_round.result_top3, color: '#d4820a' },
                        { label: '2 ตัวบน', value: bill.bets[0].lottery_round.result_top2 || '-', color: '#1a8a40' },
                        { label: '2 ตัวล่าง', value: bill.bets[0].lottery_round.result_bottom2 || '-', color: '#0055cc' },
                      ].map(r => (
                        <div key={r.label} style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: 'var(--ios-secondary-label)', marginBottom: 3 }}>{r.label}</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: r.color }}>{r.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Close button */}
              <div style={{ padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
                <button onClick={() => setSelectedBill(null)} style={{
                  display: 'block', width: '100%', padding: '14px', borderRadius: 14, minHeight: 48,
                  fontSize: 16, fontWeight: 700, color: 'white', border: 'none', cursor: 'pointer',
                  background: '#0d6e6e',
                }}>
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  )
}
