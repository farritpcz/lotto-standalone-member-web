/**
 * หน้า Lobby — เลือกประเภทหวย (แบบเจริญดี88)
 *
 * แสดงหวยทุกประเภทแบบ game card + badge สถานะ
 * กดเลือก → ไปหน้าแทงหวย /lottery/[type]
 *
 * ความสัมพันธ์:
 * - เรียก API: lotteryApi.getTypes() → standalone-member-api (#3)
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { lotteryApi } from '@/lib/api'
import type { LotteryTypeInfo } from '@/types'

// Icon mapping สำหรับแต่ละประเภทหวย
const lotteryIcons: Record<string, string> = {
  THAI: '🇹🇭', LAO: '🇱🇦', STOCK_TH: '📈', STOCK_FOREIGN: '🌍', YEEKEE: '🎯', CUSTOM: '🎲',
}

// สีพื้นหลัง icon
const lotteryBgColors: Record<string, string> = {
  THAI: 'bg-blue-50', LAO: 'bg-red-50', STOCK_TH: 'bg-green-50',
  STOCK_FOREIGN: 'bg-purple-50', YEEKEE: 'bg-orange-50', CUSTOM: 'bg-gray-50',
}

// หมวดหมู่
const categories = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'government', label: 'หวยรัฐ' },
  { key: 'foreign', label: 'หวยต่างประเทศ' },
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

  // Filter by category (simple mapping)
  const filtered = selectedCat === 'all' ? lotteries : lotteries.filter(l => {
    if (selectedCat === 'government') return ['THAI', 'LAO'].includes(l.code)
    if (selectedCat === 'stock') return l.code.startsWith('STOCK')
    if (selectedCat === 'yeekee') return l.code === 'YEEKEE'
    if (selectedCat === 'foreign') return ['LAO'].includes(l.code)
    return true
  })

  return (
    <div>
      {/* Page Title */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>เลือกประเภทหวย</h1>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setSelectedCat(cat.key)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              selectedCat === cat.key
                ? 'text-white'
                : 'text-secondary'
            }`}
            style={{
              background: selectedCat === cat.key ? 'var(--color-primary)' : 'var(--color-bg-card)',
              boxShadow: selectedCat === cat.key ? 'none' : 'var(--shadow-card)',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="px-4 space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-3 flex items-center gap-3">
              <div className="skeleton w-12 h-12 rounded-lg" />
              <div className="flex-1">
                <div className="skeleton h-4 w-28 mb-1.5" />
                <div className="skeleton h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Game Cards */}
      {!loading && (
        <div className="px-4 pb-4 space-y-2">
          {filtered.map(lottery => (
            <Link
              key={lottery.id}
              href={lottery.code === 'YEEKEE' ? '/yeekee/room' : `/lottery/${lottery.code}`}
              className="game-card"
            >
              <div className={`game-icon ${lotteryBgColors[lottery.code] || 'bg-gray-50'}`}>
                {lotteryIcons[lottery.code] || '🎲'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{lottery.name}</h3>
                <p className="text-xs text-muted mt-0.5">{lottery.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {lottery.code === 'YEEKEE' ? (
                  <span className="chip chip-green">Live 24 ชม.</span>
                ) : (
                  <span className="chip chip-teal">เปิดรับ</span>
                )}
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-muted flex-shrink-0">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}

          {filtered.length === 0 && !loading && (
            <div className="card p-8 text-center">
              <p className="text-muted text-sm">ไม่มีหวยในหมวดนี้</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
