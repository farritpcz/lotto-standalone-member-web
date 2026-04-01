/**
 * หน้าตรวจผลรางวัล (แบบเจริญดี88 — teal theme)
 *
 * แสดงผลรางวัลล่าสุด filter ตามประเภทหวย + result cards + pagination
 * เรียก API: resultApi.getResults() → standalone-member-api (#3)
 */

'use client'

import { useEffect, useState } from 'react'
import { resultApi, lotteryApi } from '@/lib/api'
import type { LotteryRound, LotteryTypeInfo } from '@/types'

// Icon mapping
const lotteryIcons: Record<string, string> = {
  THAI: '🇹🇭', LAO: '🇱🇦', STOCK_TH: '📈', STOCK_FOREIGN: '🌍', YEEKEE: '🎯', CUSTOM: '🎲',
}

export default function ResultsPage() {
  const [results, setResults] = useState<LotteryRound[]>([])
  const [lotteryTypes, setLotteryTypes] = useState<LotteryTypeInfo[]>([])
  const [selectedType, setSelectedType] = useState<number | undefined>()
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    lotteryApi.getTypes().then(res => setLotteryTypes(res.data.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    resultApi.getResults({ lottery_type_id: selectedType, page, per_page: 20 })
      .then(res => {
        setResults(res.data.data?.items || [])
        setTotal(res.data.data?.total || 0)
      })
      .finally(() => setLoading(false))
  }, [selectedType, page])

  return (
    <div>
      {/* Page Title */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>ผลรางวัล</h1>
      </div>

      {/* Filter ประเภทหวย */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => { setSelectedType(undefined); setPage(1) }}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
            !selectedType ? 'text-white' : 'text-secondary'
          }`}
          style={{
            background: !selectedType ? 'var(--color-primary)' : 'var(--color-bg-card)',
            boxShadow: !selectedType ? 'none' : 'var(--shadow-card)',
          }}
        >
          ทั้งหมด
        </button>
        {lotteryTypes.map(lt => (
          <button
            key={lt.id}
            onClick={() => { setSelectedType(lt.id); setPage(1) }}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              selectedType === lt.id ? 'text-white' : 'text-secondary'
            }`}
            style={{
              background: selectedType === lt.id ? 'var(--color-primary)' : 'var(--color-bg-card)',
              boxShadow: selectedType === lt.id ? 'none' : 'var(--shadow-card)',
            }}
          >
            {lotteryIcons[lt.code] || ''} {lt.name}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="px-4 pb-4">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-4">
                <div className="skeleton h-4 w-32 mb-3" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="skeleton h-16 rounded-lg" />
                  <div className="skeleton h-16 rounded-lg" />
                  <div className="skeleton h-16 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-3xl mb-2">🏆</p>
            <p className="text-muted text-sm">ยังไม่มีผลรางวัล</p>
          </div>
        ) : (
          <div className="space-y-2">
            {results.map(round => (
              <div key={round.id} className="card p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{lotteryIcons[round.lottery_type?.code] || '🎲'}</span>
                    <span className="font-semibold text-sm">{round.lottery_type?.name}</span>
                    <span className="text-muted text-xs">รอบ {round.round_number}</span>
                  </div>
                  <span className="text-muted text-xs">
                    {new Date(round.round_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </span>
                </div>
                {/* ผลรางวัล */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-amber-50 rounded-lg p-2.5 text-center">
                    <div className="text-muted text-[10px] mb-0.5">3 ตัวบน</div>
                    <div className="text-xl font-bold font-mono text-amber-600">{round.result_top3 || '-'}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2.5 text-center">
                    <div className="text-muted text-[10px] mb-0.5">2 ตัวบน</div>
                    <div className="text-xl font-bold font-mono text-green-600">{round.result_top2 || '-'}</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2.5 text-center">
                    <div className="text-muted text-[10px] mb-0.5">2 ตัวล่าง</div>
                    <div className="text-xl font-bold font-mono text-blue-600">{round.result_bottom2 || '-'}</div>
                  </div>
                </div>
              </div>
            ))}
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
            <span className="text-sm text-muted px-2">หน้า {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={results.length < 20}
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
