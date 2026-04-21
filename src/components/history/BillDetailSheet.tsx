/**
 * BillDetailSheet — bottom sheet แสดงรายละเอียดบิล (scrollable)
 *
 * ประกอบด้วย: drag handle, summary, รายการ bet, ผลรางวัล, ปุ่มปิด
 * Parent: src/app/(member)/history/page.tsx
 */

'use client'

import type { Bill } from './types'
import { statusConfig, fmtDate } from './types'

interface Props {
  bill: Bill
  onClose: () => void
}

export default function BillDetailSheet({ bill, onClose }: Props) {
  const cfg = statusConfig[bill.status] || statusConfig.pending
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={onClose}>
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
          <button onClick={onClose} style={{
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
}
