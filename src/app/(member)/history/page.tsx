/**
 * หน้าประวัติการแทง (แบบเจริญดี88 — teal theme)
 *
 * แสดง bets ทั้งหมดของสมาชิก + filter status + pagination
 * เรียก API: betApi.getMyBets() → standalone-member-api (#3)
 */

'use client'

import { useEffect, useState } from 'react'
import { betApi } from '@/lib/api'
import type { Bet } from '@/types'

const statusStyles: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-600' },
  won: { bg: 'bg-green-50', text: 'text-green-600' },
  lost: { bg: 'bg-red-50', text: 'text-red-600' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500' },
  refunded: { bg: 'bg-blue-50', text: 'text-blue-600' },
}

const statusLabels: Record<string, string> = {
  pending: 'รอผล', won: 'ชนะ', lost: 'แพ้', cancelled: 'ยกเลิก', refunded: 'คืนเงิน',
}

const filterTabs = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รอผล' },
  { key: 'won', label: 'ชนะ' },
  { key: 'lost', label: 'แพ้' },
]

export default function HistoryPage() {
  const [bets, setBets] = useState<Bet[]>([])
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    betApi.getMyBets({ status: status || undefined, page, per_page: 20 })
      .then(res => {
        setBets(res.data.data?.items || [])
        setTotal(res.data.data?.total || 0)
      })
      .finally(() => setLoading(false))
  }, [status, page])

  return (
    <div>
      {/* Page Title */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>โพยหวย / ประวัติ</h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setStatus(tab.key); setPage(1) }}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              status === tab.key ? 'text-white' : 'text-secondary'
            }`}
            style={{
              background: status === tab.key ? 'var(--color-primary)' : 'var(--color-bg-card)',
              boxShadow: status === tab.key ? 'none' : 'var(--shadow-card)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bet List */}
      <div className="px-4 pb-4">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-3 flex items-center gap-3">
                <div className="skeleton w-14 h-14 rounded-lg" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-24 mb-1.5" />
                  <div className="skeleton h-3 w-36" />
                </div>
              </div>
            ))}
          </div>
        ) : bets.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-muted text-sm">ยังไม่มีประวัติการแทง</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bets.map(bet => {
              const style = statusStyles[bet.status] || statusStyles.pending
              return (
                <div key={bet.id} className="card p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* เลขที่แทง */}
                      <div
                        className="w-14 h-14 rounded-lg flex items-center justify-center font-mono font-bold text-lg"
                        style={{ background: 'var(--color-primary)', color: 'white' }}
                      >
                        {bet.number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--color-bg-card-alt)' }}>
                            {bet.bet_type?.name}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                            {statusLabels[bet.status]}
                          </span>
                        </div>
                        <p className="text-muted text-xs mt-1">
                          {bet.lottery_round?.lottery_type?.name} • รอบ {bet.lottery_round?.round_number}
                        </p>
                        <p className="text-muted text-[10px] mt-0.5">
                          {new Date(bet.created_at).toLocaleString('th-TH')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-sm">฿{bet.amount.toLocaleString()}</div>
                      {bet.status === 'won' && (
                        <div className="text-green-600 text-sm font-bold">+฿{bet.win_amount.toLocaleString()}</div>
                      )}
                      <div className="text-muted text-[10px]">rate x{bet.rate}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 transition"
              style={{ background: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)' }}
            >
              ← ก่อนหน้า
            </button>
            <span className="text-sm text-muted px-2">หน้า {page} ({total} รายการ)</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={bets.length < 20}
              className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 transition"
              style={{ background: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)' }}
            >
              ถัดไป →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
