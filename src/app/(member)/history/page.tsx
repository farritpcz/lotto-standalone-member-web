/**
 * หน้าโพยหวย — แสดงเป็นบิล (group by batch_id)
 *
 * แต่ละบิล = 1 ครั้งที่กดยืนยันแทง (อาจมีหลายเลข)
 * กดเข้าไปดูรายละเอียดทุกเลขในบิล
 */

'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { betApi } from '@/lib/api'
import type { Bet } from '@/types'

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: 'rgba(255,159,10,0.12)',  color: '#B25000', label: 'รอผล' },
  won:       { bg: 'rgba(52,199,89,0.12)',   color: '#1a8a40', label: 'ชนะ' },
  lost:      { bg: 'rgba(255,59,48,0.10)',   color: '#CC2020', label: 'แพ้' },
  cancelled: { bg: 'rgba(142,142,147,0.12)', color: '#888', label: 'ยกเลิก' },
  refunded:  { bg: 'rgba(0,122,255,0.10)',   color: '#0055CC', label: 'คืนเงิน' },
}

const filterTabs = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รอผล' },
  { key: 'won', label: 'ชนะ' },
  { key: 'lost', label: 'แพ้' },
]

// จัดกลุ่ม bets เป็นบิล (group by batch_id หรือ id ถ้าไม่มี batch)
interface Bill {
  batchId: string
  bets: Bet[]
  totalAmount: number
  totalWin: number
  status: string        // pending ถ้ายังมี pending, won ถ้ามี won, lost ถ้าทุกตัว lost
  lotteryName: string
  roundNumber: string
  createdAt: string
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
    const status = hasPending ? 'pending' : hasWon ? 'won' : 'lost'
    return {
      batchId,
      bets,
      totalAmount,
      totalWin,
      status,
      lotteryName: bets[0]?.lottery_round?.lottery_type?.name || 'หวย',
      roundNumber: bets[0]?.lottery_round?.round_number || '-',
      createdAt: bets[0]?.created_at || '',
    }
  })
}

export default function HistoryPage() {
  const [bets, setBets] = useState<Bet[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)

  useEffect(() => {
    setLoading(true)
    betApi.getMyBets({ status: statusFilter || undefined, page, per_page: 50 })
      .then(res => {
        setBets(res.data.data?.items || [])
        setTotal(res.data.data?.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [statusFilter, page])

  const bills = groupIntoBills(bets)

  return (
    <div>
      <div style={{ padding: '16px 16px 8px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ios-label)', margin: 0 }}>โพยหวย</h1>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '4px 16px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setStatusFilter(tab.key); setPage(1) }}
            style={{
              padding: '7px 14px', borderRadius: 9999, fontSize: 13,
              fontWeight: statusFilter === tab.key ? 600 : 400, whiteSpace: 'nowrap',
              border: 'none', cursor: 'pointer', flexShrink: 0,
              background: statusFilter === tab.key ? 'var(--ios-green)' : 'var(--ios-card)',
              color: statusFilter === tab.key ? 'white' : 'var(--ios-label)',
              boxShadow: statusFilter === tab.key ? '0 2px 10px rgba(52,199,89,0.3)' : 'var(--shadow-card)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bills List */}
      <div style={{ padding: '0 16px', paddingBottom: 16 }}>
        {loading ? (
          <div style={{ background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ padding: '16px', borderBottom: i < 3 ? '0.5px solid var(--ios-separator)' : 'none' }}>
                <div className="skeleton" style={{ height: 16, width: 120, marginBottom: 8, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 12, width: 200, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : bills.length === 0 ? (
          <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '48px 16px', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
            <p style={{ color: 'var(--ios-secondary-label)', fontSize: 15 }}>ยังไม่มีประวัติการแทง</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bills.map(bill => {
              const cfg = statusConfig[bill.status] || statusConfig.pending
              const numbers = bill.bets.map(b => b.number).join(', ')
              return (
                <div
                  key={bill.batchId}
                  onClick={() => setSelectedBill(bill)}
                  style={{
                    background: 'var(--ios-card)', borderRadius: 16,
                    padding: '14px 16px', cursor: 'pointer',
                    boxShadow: 'var(--shadow-card)',
                    transition: 'transform 0.1s',
                  }}
                >
                  {/* Top row: lottery name + status + amount */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ios-label)' }}>
                        {bill.lotteryName}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                        background: cfg.bg, color: cfg.color,
                      }}>
                        {cfg.label}
                      </span>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ios-label)' }}>
                      ฿{bill.totalAmount.toLocaleString()}
                    </span>
                  </div>

                  {/* Numbers preview — เลขอั้นเปลี่ยนสี amber */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    {bill.bets.slice(0, 6).map((b, i) => {
                      const isBanned = (b.original_rate ?? 0) > 0 && b.original_rate! > b.rate
                      return (
                        <span key={i} style={{
                          fontFamily: 'monospace', fontWeight: 700, fontSize: 14,
                          background: isBanned ? 'rgba(217,119,6,0.10)' : 'rgba(13,110,110,0.08)',
                          color: isBanned ? '#b45309' : '#0d6e6e',
                          padding: '2px 8px', borderRadius: 6,
                        }}>
                          {b.number}
                        </span>
                      )
                    })}
                    {bill.bets.length > 6 && (
                      <span style={{ fontSize: 12, color: '#888', alignSelf: 'center' }}>+{bill.bets.length - 6}</span>
                    )}
                  </div>

                  {/* Bottom: date + bill id + bet count + win */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--ios-secondary-label)' }}>
                      บิล #{bill.batchId.substring(0, 8).toUpperCase()} · {bill.bets.length} รายการ
                    </span>
                    {bill.totalWin > 0 && (
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#34C759' }}>
                        +฿{bill.totalWin.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {total > 50 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', background: 'var(--ios-card)', boxShadow: 'var(--shadow-card)', color: 'var(--ios-label)', opacity: page === 1 ? 0.4 : 1 }}>
              ← ก่อนหน้า
            </button>
            <span style={{ fontSize: 14, color: 'var(--ios-secondary-label)' }}>หน้า {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={bets.length < 50}
              style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', background: 'var(--ios-card)', boxShadow: 'var(--shadow-card)', color: 'var(--ios-label)', opacity: bets.length < 50 ? 0.4 : 1 }}>
              ถัดไป →
            </button>
          </div>
        )}
      </div>

      {/* ── Bill Detail Modal (Fullscreen) ──────────────────────────────── */}
      {selectedBill && (() => {
        const bill = selectedBill
        const cfg = statusConfig[bill.status] || statusConfig.pending
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'white', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ background: '#1a3d35', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <button onClick={() => setSelectedBill(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <ChevronLeft size={22} strokeWidth={2.5} color="white" />
              </button>
              <span style={{ color: 'white', fontSize: 17, fontWeight: 700 }}>รายละเอียดบิล</span>
              <div style={{ width: 30 }} />
            </div>

            {/* Summary card */}
            <div style={{ padding: 16, background: '#f8f8f8', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1a3d35' }}>{bill.lotteryName}</div>
                  <div style={{ fontSize: 13, color: '#888' }}>รอบ {bill.roundNumber}</div>
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 700, padding: '4px 14px', borderRadius: 20,
                  background: cfg.bg, color: cfg.color,
                }}>
                  {cfg.label}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: '#888' }}>จำนวน</span>
                <span style={{ fontWeight: 600 }}>{bill.bets.length} รายการ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: '#888' }}>ยอดแทงรวม</span>
                <span style={{ fontWeight: 700, color: '#1a3d35' }}>฿{bill.totalAmount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: '#888' }}>ถ้าถูกทั้งหมดจะได้</span>
                <span style={{ fontWeight: 700, color: '#0d6e6e' }}>
                  ฿{bill.bets.reduce((s, b) => s + b.amount * b.rate, 0).toLocaleString()}
                </span>
              </div>
              {bill.totalWin > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#888' }}>เงินรางวัลที่ได้</span>
                  <span style={{ fontWeight: 700, color: '#34C759' }}>+฿{bill.totalWin.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '0.5px solid #e8e8e8' }}>
                <span style={{ fontSize: 12, color: '#aaa' }}>
                  {new Date(bill.createdAt).toLocaleString('th-TH')}
                </span>
                <span style={{ fontSize: 11, color: '#aaa', fontFamily: 'monospace' }}>
                  บิล #{bill.batchId.substring(0, 8).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Bet items */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {bill.bets.map((bet, idx) => {
                const betCfg = statusConfig[bet.status] || statusConfig.pending
                const isRateReduced = (bet.original_rate ?? 0) > 0 && bet.original_rate! > bet.rate
                return (
                  <div key={bet.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px',
                    borderBottom: idx < bill.bets.length - 1 ? '0.5px solid #f0f0f0' : 'none',
                  }}>
                    {/* Number */}
                    <div style={{
                      width: 50, height: 50, borderRadius: 12,
                      background: isRateReduced
                        ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'  // amber = เลขอั้น
                        : 'linear-gradient(135deg, #0d6e6e 0%, #1a8a6e 100%)', // teal = ปกติ
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: 17, fontFamily: 'monospace', flexShrink: 0,
                      position: 'relative',
                    }}>
                      {bet.number}
                      {/* badge เลขอั้น มุมขวาบน */}
                      {isRateReduced && (
                        <span style={{
                          position: 'absolute', top: -4, right: -4,
                          fontSize: 8, fontWeight: 700, color: 'white',
                          background: '#ef4444', borderRadius: 6,
                          padding: '1px 4px', lineHeight: 1.2,
                        }}>
                          อั้น
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 500, padding: '1px 6px', borderRadius: 4, background: '#f0f0f0', color: '#666' }}>
                          {bet.bet_type?.name}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: betCfg.bg, color: betCfg.color }}>
                          {betCfg.label}
                        </span>
                        {/* badge ลดเรท */}
                        {isRateReduced && (
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                            background: 'rgba(245,158,11,0.12)', color: '#b45309',
                          }}>
                            เลขอั้น
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#aaa' }}>
                        {/* แสดงเรท: ถ้าถูกลด → ขีดฆ่าเรทเดิม + เรทใหม่ */}
                        {isRateReduced ? (
                          <>
                            <span style={{ textDecoration: 'line-through', color: '#ccc', marginRight: 4 }}>x{bet.original_rate}</span>
                            <span style={{ color: '#b45309', fontWeight: 600 }}>x{bet.rate}</span>
                          </>
                        ) : (
                          <span>x{bet.rate}</span>
                        )}
                        {' · '}ถูกได้ <span style={{ color: '#0d6e6e', fontWeight: 600 }}>฿{(bet.amount * bet.rate).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>฿{bet.amount.toLocaleString()}</div>
                      {bet.status === 'won' && (
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#34C759' }}>+฿{bet.win_amount.toLocaleString()}</div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Result section */}
              {bill.bets[0]?.lottery_round?.result_top3 && (
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 12 }}>ผลรางวัล</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                      { label: '3 ตัวบน', value: bill.bets[0].lottery_round.result_top3, color: '#d4820a' },
                      { label: '2 ตัวบน', value: bill.bets[0].lottery_round.result_top2 || '-', color: '#1a8a40' },
                      { label: '2 ตัวล่าง', value: bill.bets[0].lottery_round.result_bottom2 || '-', color: '#0055cc' },
                    ].map(r => (
                      <div key={r.label} style={{ background: '#f8f8f8', borderRadius: 10, padding: '10px 4px', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{r.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: r.color }}>{r.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #eee', flexShrink: 0, paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
              <button onClick={() => setSelectedBill(null)} style={{
                display: 'block', width: '100%', padding: '14px', borderRadius: 14,
                fontSize: 16, fontWeight: 700, color: 'white', border: 'none', cursor: 'pointer', background: '#0d6e6e',
              }}>
                ปิด
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
