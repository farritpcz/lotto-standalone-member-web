/**
 * หน้า Lobby — iOS 17 HIG Design
 * เลือกประเภทหวย, category filter tabs, game cards list
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { lotteryApi } from '@/lib/api'
import type { LotteryTypeInfo } from '@/types'

const lotteryIcons: Record<string, string> = {
  THAI: '🇹🇭', LAO: '🇱🇦', STOCK_TH: '📈', STOCK_FOREIGN: '🌍', YEEKEE: '🎯', CUSTOM: '🎲',
}

const lotteryBgColors: Record<string, string> = {
  THAI: '#EFF6FF', LAO: '#FFF1F0', STOCK_TH: '#F0FFF4',
  STOCK_FOREIGN: '#F5F0FF', YEEKEE: '#FFF8F0', CUSTOM: '#F5F5F5',
}

const categories = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'government', label: 'หวยรัฐ' },
  { key: 'foreign', label: 'ต่างประเทศ' },
  { key: 'stock', label: 'หวยหุ้น' },
  { key: 'yeekee', label: 'ยี่กี' },
]

export default function LobbyPage() {
  const [lotteries, setLotteries] = useState<LotteryTypeInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCat, setSelectedCat] = useState('all')

  useEffect(() => {
    lotteryApi.getTypes()
      .then(res => setLotteries(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = selectedCat === 'all' ? lotteries : lotteries.filter(l => {
    if (selectedCat === 'government') return ['THAI', 'LAO'].includes(l.code)
    if (selectedCat === 'stock') return l.code.startsWith('STOCK')
    if (selectedCat === 'yeekee') return l.code === 'YEEKEE'
    if (selectedCat === 'foreign') return ['LAO'].includes(l.code)
    return true
  })

  return (
    <div>
      {/* Page header */}
      <div style={{ padding: '16px 16px 8px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ios-label)', margin: 0 }}>
          แทงหวย
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ios-secondary-label)', marginTop: 4 }}>
          เลือกประเภทหวยที่ต้องการ
        </p>
      </div>

      {/* Category Tabs — iOS segmented style */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: '4px 16px 12px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setSelectedCat(cat.key)}
            style={{
              padding: '7px 14px',
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: selectedCat === cat.key ? 600 : 400,
              whiteSpace: 'nowrap',
              border: 'none',
              cursor: 'pointer',
              background: selectedCat === cat.key ? 'var(--ios-green)' : 'var(--ios-card)',
              color: selectedCat === cat.key ? 'white' : 'var(--ios-label)',
              boxShadow: selectedCat === cat.key ? '0 2px 10px rgba(52,199,89,0.3)' : 'var(--shadow-card)',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div style={{ padding: '0 16px' }}>
          <div style={{ background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderBottom: i < 4 ? '0.5px solid var(--ios-separator)' : 'none',
              }}>
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 14, width: 100, marginBottom: 6, borderRadius: 4 }} />
                  <div className="skeleton" style={{ height: 12, width: 140, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game list */}
      {!loading && (
        <div style={{ padding: '0 16px', paddingBottom: 16 }}>
          {filtered.length === 0 ? (
            <div style={{
              background: 'var(--ios-card)',
              borderRadius: 16,
              padding: '48px 16px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-card)',
            }}>
              <p style={{ color: 'var(--ios-secondary-label)', fontSize: 15 }}>ไม่มีหวยในหมวดนี้</p>
            </div>
          ) : (
            <div style={{ background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              {filtered.map((lottery, idx) => (
                <Link
                  key={lottery.id}
                  href={lottery.code === 'YEEKEE' ? '/yeekee/room' : `/lottery/${lottery.code}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    textDecoration: 'none',
                    color: 'var(--ios-label)',
                    borderBottom: idx < filtered.length - 1 ? '0.5px solid var(--ios-separator)' : 'none',
                  }}
                >
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: lotteryBgColors[lottery.code] || '#F5F5F5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 26,
                    flexShrink: 0,
                  }}>
                    {lotteryIcons[lottery.code] || '🎲'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, marginBottom: 3 }}>{lottery.name}</h3>
                    <p style={{ fontSize: 13, color: 'var(--ios-secondary-label)', margin: 0 }}>{lottery.description}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    {lottery.code === 'YEEKEE' ? (
                      <span className="chip chip-green">Live 24 ชม.</span>
                    ) : (
                      <span className="chip chip-green">เปิดรับ</span>
                    )}
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16, color: 'var(--ios-tertiary-label)', flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
