/**
 * หน้าตรวจผลรางวัล — iOS 17 HIG Design
 */

'use client'

import { useEffect, useState } from 'react'
import Loading from '@/components/Loading'
import { resultApi, lotteryApi } from '@/lib/api'
import type { LotteryRound, LotteryTypeInfo } from '@/types'

const lotteryIcons: Record<string, string> = {
  THAI: '🇹🇭', LAO: '🇱🇦', STOCK_TH: '📈', STOCK_FOREIGN: '🌍', YEEKEE: '🎯', CUSTOM: '🎲',
}

const filterBtnStyle = (active: boolean) => ({
  padding: '7px 14px',
  borderRadius: 9999,
  fontSize: 13,
  fontWeight: active ? 600 : 400,
  whiteSpace: 'nowrap' as const,
  border: 'none',
  cursor: 'pointer',
  background: active ? 'var(--ios-green)' : 'var(--ios-card)',
  color: active ? 'white' : 'var(--ios-label)',
  boxShadow: active ? '0 2px 10px rgba(52,199,89,0.3)' : 'var(--shadow-card)',
  transition: 'all 0.15s',
  flexShrink: 0,
})

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
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedType, page])

  return (
    <div>
      <div style={{ padding: '16px 16px 8px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ios-label)', margin: 0 }}>ผลรางวัล</h1>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '4px 16px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <button onClick={() => { setSelectedType(undefined); setPage(1) }} style={filterBtnStyle(!selectedType)}>
          ทั้งหมด
        </button>
        {lotteryTypes.map(lt => (
          <button
            key={lt.id}
            onClick={() => { setSelectedType(lt.id); setPage(1) }}
            style={filterBtnStyle(selectedType === lt.id)}
          >
            {lotteryIcons[lt.code] || ''} {lt.name}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 16px', paddingBottom: 16 }}>
        {loading ? (
          <Loading />
        ) : results.length === 0 ? (
          <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '48px 16px', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🏆</p>
            <p style={{ color: 'var(--ios-secondary-label)', fontSize: 15 }}>ยังไม่มีผลรางวัล</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map(round => (
              <div key={round.id} style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{lotteryIcons[round.lottery_type?.code] || '🎲'}</span>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{round.lottery_type?.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--ios-secondary-label)' }}>รอบ {round.round_number}</span>
                  </div>
                  <span style={{ color: 'var(--ios-secondary-label)', fontSize: 13 }}>
                    {new Date(round.round_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: '3 ตัวบน', value: round.result_top3 || '-', color: 'var(--ios-orange)', bg: 'rgba(255,159,10,0.08)' },
                    { label: '2 ตัวบน', value: round.result_top2 || '-', color: 'var(--ios-green)', bg: 'rgba(52,199,89,0.08)' },
                    { label: '2 ตัวล่าง', value: round.result_bottom2 || '-', color: 'var(--ios-blue)', bg: 'rgba(0,122,255,0.08)' },
                  ].map((item) => (
                    <div key={item.label} style={{ background: item.bg, borderRadius: 10, padding: '10px 4px', textAlign: 'center' }}>
                      <div style={{ color: 'var(--ios-secondary-label)', fontSize: 11, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: item.color, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                border: 'none', cursor: 'pointer',
                background: 'var(--ios-card)', boxShadow: 'var(--shadow-card)',
                color: 'var(--ios-label)', opacity: page === 1 ? 0.4 : 1,
              }}
            >
              ← ก่อนหน้า
            </button>
            <span style={{ fontSize: 14, color: 'var(--ios-secondary-label)' }}>หน้า {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={results.length < 20}
              style={{
                padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                border: 'none', cursor: 'pointer',
                background: 'var(--ios-card)', boxShadow: 'var(--shadow-card)',
                color: 'var(--ios-label)', opacity: results.length < 20 ? 0.4 : 1,
              }}
            >
              ถัดไป →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
