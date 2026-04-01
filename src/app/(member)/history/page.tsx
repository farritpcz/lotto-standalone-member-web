/**
 * หน้าประวัติการแทง
 *
 * แสดง bets ทั้งหมดของสมาชิก + filter status + pagination
 * เรียก API: betApi.getMyBets() → standalone-member-api (#3)
 */

'use client'

import { useEffect, useState } from 'react'
import { betApi } from '@/lib/api'
import type { Bet } from '@/types'

const statusColors: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-900/30',
  won: 'text-green-400 bg-green-900/30',
  lost: 'text-red-400 bg-red-900/30',
  cancelled: 'text-gray-400 bg-gray-700',
  refunded: 'text-blue-400 bg-blue-900/30',
}

const statusLabels: Record<string, string> = {
  pending: 'รอผล',
  won: 'ชนะ',
  lost: 'แพ้',
  cancelled: 'ยกเลิก',
  refunded: 'คืนเงิน',
}

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
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-4">ประวัติการแทง</h1>

      {/* Filter status */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {['', 'pending', 'won', 'lost'].map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${status === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}
          >
            {s === '' ? 'ทั้งหมด' : statusLabels[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-10">กำลังโหลด...</div>
      ) : bets.length === 0 ? (
        <div className="text-center text-gray-500 py-10">ยังไม่มีประวัติ</div>
      ) : (
        <div className="space-y-2">
          {bets.map(bet => (
            <div key={bet.id} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono font-bold text-lg">{bet.number}</span>
                  <span className="text-gray-400 text-xs bg-gray-700 px-2 py-0.5 rounded">{bet.bet_type?.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColors[bet.status]}`}>
                    {statusLabels[bet.status]}
                  </span>
                </div>
                <div className="text-gray-500 text-xs mt-1">
                  {bet.lottery_round?.lottery_type?.name} • รอบ {bet.lottery_round?.round_number}
                </div>
                <div className="text-gray-600 text-xs">
                  {new Date(bet.created_at).toLocaleString('th-TH')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-semibold">฿{bet.amount.toLocaleString()}</div>
                {bet.status === 'won' && (
                  <div className="text-green-400 text-sm font-semibold">+฿{bet.win_amount.toLocaleString()}</div>
                )}
                <div className="text-gray-500 text-xs">rate ×{bet.rate}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg disabled:opacity-50">ก่อนหน้า</button>
          <span className="px-4 py-2 text-gray-400">หน้า {page} ({total} รายการ)</span>
          <button onClick={() => setPage(p => p + 1)} disabled={bets.length < 20}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg disabled:opacity-50">ถัดไป</button>
        </div>
      )}
    </div>
  )
}
