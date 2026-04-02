/**
 * หน้าผลรางวัล — แบบเจริญดี88
 * - เลือกวันที่ + ปุ่มเช็คผลล่าสุด
 * - Filter tabs ตามประเภทหวย
 * - จัดกลุ่มตามประเภท: header + ตารางรอบ
 */
'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import Loading from '@/components/Loading'
import { resultApi, lotteryApi } from '@/lib/api'
import type { LotteryRound, LotteryTypeInfo } from '@/types'

const lotteryGradients: Record<string, string> = {
  THAI: 'linear-gradient(135deg, #f5a623, #d4820a)',
  LAO: 'linear-gradient(135deg, #ef4444, #dc2626)',
  STOCK_TH: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  STOCK_FOREIGN: 'linear-gradient(135deg, #a855f7, #7c3aed)',
  YEEKEE: 'linear-gradient(135deg, #0d6e6e, #34d399)',
}

export default function ResultsPage() {
  const [results, setResults] = useState<LotteryRound[]>([])
  const [lotteryTypes, setLotteryTypes] = useState<LotteryTypeInfo[]>([])
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    lotteryApi.getTypes().then(res => setLotteryTypes(res.data.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params: Record<string, unknown> = { per_page: 100 }
    if (selectedType !== 'all') {
      const lt = lotteryTypes.find(l => l.code === selectedType)
      if (lt) params.lottery_type_id = lt.id
    }
    resultApi.getResults(params)
      .then(res => setResults(res.data.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedType, selectedDate, lotteryTypes])

  // จัดกลุ่มผลตามประเภทหวย
  const grouped = lotteryTypes
    .filter(lt => selectedType === 'all' || lt.code === selectedType)
    .map(lt => ({
      ...lt,
      rounds: results.filter(r => r.lottery_type?.code === lt.code),
      imageUrl: (lt as LotteryTypeInfo & { image_url?: string }).image_url || '',
    }))
    .filter(g => selectedType !== 'all' || g.rounds.length > 0 || true) // แสดงทุกประเภทถ้า all

  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) }
    catch { return d }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, flex: 1, color: 'var(--ios-label)' }}>ผลรางวัล</h1>
      </div>

      {/* Date picker + เช็คผลล่าสุด */}
      <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8 }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--ios-card)', borderRadius: 12, padding: '8px 14px',
          boxShadow: 'var(--shadow-card)',
        }}>
          <span style={{ fontSize: 13, color: 'var(--ios-secondary-label)' }}>เลือกวันที่</span>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: 14, fontWeight: 600,
              color: 'var(--ios-label)', background: 'transparent', fontFamily: 'inherit',
            }} />
        </div>
        <button onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))} style={{
          padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
          border: 'none', cursor: 'pointer',
          background: 'var(--ios-green)', color: 'white',
          boxShadow: '0 2px 8px rgba(52,199,89,0.3)',
          whiteSpace: 'nowrap',
        }}>
          เช็คผลล่าสุด
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <button onClick={() => setSelectedType('all')} style={{
          padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: selectedType === 'all' ? 600 : 400,
          border: 'none', cursor: 'pointer', flexShrink: 0,
          background: selectedType === 'all' ? 'var(--ios-green)' : 'var(--ios-card)',
          color: selectedType === 'all' ? 'white' : 'var(--ios-label)',
          boxShadow: selectedType === 'all' ? '0 2px 8px rgba(52,199,89,0.3)' : 'var(--shadow-card)',
        }}>
          ทั้งหมด
        </button>
        {lotteryTypes.map(lt => (
          <button key={lt.code} onClick={() => setSelectedType(lt.code)} style={{
            padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: selectedType === lt.code ? 600 : 400,
            border: 'none', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
            background: selectedType === lt.code ? 'var(--ios-green)' : 'var(--ios-card)',
            color: selectedType === lt.code ? 'white' : 'var(--ios-label)',
            boxShadow: selectedType === lt.code ? '0 2px 8px rgba(52,199,89,0.3)' : 'var(--shadow-card)',
          }}>
            {lt.name}
          </button>
        ))}
      </div>

      {/* Results grouped by lottery type */}
      <div style={{ padding: '0 16px', paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? <Loading /> : grouped.map(group => {
          const gradient = lotteryGradients[group.code] || 'linear-gradient(135deg, #6b7280, #4b5563)'

          return (
            <div key={group.code} style={{
              background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            }}>
              {/* Group header */}
              <div style={{
                background: gradient, padding: '14px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {group.imageUrl ? (
                    <img src={group.imageUrl} alt={group.name} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
                  ) : null}
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{group.name}</span>
                </div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{selectedDate}</span>
              </div>

              {/* Rounds table */}
              {group.rounds.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ios-secondary-label)', fontSize: 14 }}>
                  ไม่มีรอบ
                </div>
              ) : (
                <div>
                  {/* Table header */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
                    padding: '10px 16px', borderBottom: '1px solid var(--ios-separator)',
                    fontSize: 12, fontWeight: 600, color: 'var(--ios-secondary-label)',
                  }}>
                    <span>งวดวันที่</span>
                    <span style={{ textAlign: 'center' }}>3 ตัวบน</span>
                    <span style={{ textAlign: 'center' }}>2 ตัวบน</span>
                    <span style={{ textAlign: 'center' }}>2 ตัวล่าง</span>
                  </div>

                  {/* Table rows */}
                  {group.rounds.map((round, idx) => {
                    const hasResult = round.result_top3 && round.result_top3 !== ''
                    return (
                      <div key={round.id} style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
                        padding: '12px 16px', alignItems: 'center',
                        borderBottom: idx < group.rounds.length - 1 ? '0.5px solid var(--ios-separator)' : 'none',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ios-label)' }}>
                          {(() => {
                            // แปลง round_date เป็น "1 เม.ย. 69" + ถ้ายี่กีแสดงรอบด้วย
                            const d = round.round_date || round.created_at
                            const dateStr = d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '-'
                            const isYeekee = group.code === 'YEEKEE'
                            if (isYeekee) {
                              const rn = round.round_number?.match(/\d+$/)?.[0] || ''
                              return `${dateStr} #${rn}`
                            }
                            return dateStr
                          })()}
                        </span>
                        {hasResult ? (<>
                          <span style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, color: '#d4820a' }}>
                            {round.result_top3}
                          </span>
                          <span style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, color: '#1a8a40' }}>
                            {round.result_top2 || '-'}
                          </span>
                          <span style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, color: '#0055cc' }}>
                            {round.result_bottom2 || '-'}
                          </span>
                        </>) : (<>
                          <span style={{ textAlign: 'center', fontSize: 13, color: 'var(--ios-secondary-label)' }}>รอผล</span>
                          <span style={{ textAlign: 'center', fontSize: 13, color: 'var(--ios-secondary-label)' }}>รอผล</span>
                          <span style={{ textAlign: 'center', fontSize: 13, color: 'var(--ios-secondary-label)' }}>รอผล</span>
                        </>)}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {!loading && grouped.length === 0 && (
          <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '48px 16px', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🏆</p>
            <p style={{ color: 'var(--ios-secondary-label)', fontSize: 15 }}>ยังไม่มีผลรางวัล</p>
          </div>
        )}
      </div>
    </div>
  )
}
