/**
 * หน้า Lobby — เลือกประเภทหวย (orchestrator)
 *
 * โครงสร้าง (ใช้ sub-components จาก src/components/lobby/*):
 *  1. Header + Back
 *  2. CategoryIconsRow        — ไอคอนหมวดวงกลม (drag scroll)
 *  3. Lottery grid            — sections ตามหมวด / all list
 *     - ใช้ LotteryCard ต่อตัว (ภายในมี CountdownTimer + DefaultLotteryIcon)
 *
 * สีใช้ agent theme: --accent-color, --header-bg, --card-gradient
 */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import Loading from '@/components/Loading'
import { lotteryApi } from '@/lib/api'
import type { LotteryTypeInfo } from '@/types'

import CategoryIconsRow from '@/components/lobby/CategoryIconsRow'
import LotteryCard from '@/components/lobby/LotteryCard'
import { catOrder, catLabels } from '@/components/lobby/types'

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

  // ─── Filter + group by category (สำหรับแสดง section headers) ───
  const filtered = selectedCat === 'all'
    ? lotteries
    : lotteries.filter(l => (l as LotteryTypeInfo & { category?: string }).category === selectedCat)

  const grouped = filtered.reduce((acc, lottery) => {
    const cat = (lottery as LotteryTypeInfo & { category?: string }).category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(lottery)
    return acc
  }, {} as Record<string, LotteryTypeInfo[]>)

  return (
    <div style={{ paddingBottom: 24 }}>

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '14px 16px 8px',
      }}>
        <Link href="/dashboard" style={{
          width: 34, height: 34, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--ios-card)', boxShadow: 'var(--shadow-card)',
          textDecoration: 'none', color: 'var(--ios-label)',
        }}>
          <ChevronLeft size={20} strokeWidth={2} />
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ios-label)', margin: 0, flex: 1 }}>
          แทงหวยใหม่
        </h1>
      </div>

      {/* ── Category icons row (drag-scroll) ───────────── */}
      <CategoryIconsRow selectedCat={selectedCat} onSelect={setSelectedCat} />

      {loading && <Loading />}

      {/* ── Empty state ───────────────────────────────── */}
      {!loading && filtered.length === 0 && (
        <div style={{
          background: 'var(--ios-card)', borderRadius: 16, margin: '0 16px',
          padding: '48px 16px', textAlign: 'center', boxShadow: 'var(--shadow-card)',
        }}>
          <p style={{ color: 'var(--ios-secondary-label)' }}>ไม่มีหวยในหมวดนี้</p>
        </div>
      )}

      {/* ── Grid — แยก sections ตามหมวด (all) หรือ flat ───── */}
      {!loading && selectedCat === 'all' ? (
        catOrder.map(catKey => {
          const items = grouped[catKey]
          if (!items || items.length === 0) return null
          return (
            <div key={catKey} style={{ marginBottom: 16 }}>
              <div style={{
                padding: '8px 16px 8px',
                fontSize: 15, fontWeight: 700, color: 'var(--ios-label)',
              }}>
                {catLabels[catKey] || catKey}
              </div>
              <div className="lobby-grid" style={{
                padding: '0 12px',
                display: 'grid', gap: 8,
              }}>
                {items.map(lottery => (
                  <LotteryCard key={lottery.id} lottery={lottery} />
                ))}
              </div>
            </div>
          )
        })
      ) : (
        <div className="lobby-grid" style={{
          padding: '0 12px',
          display: 'grid', gap: 8,
        }}>
          {filtered.map(lottery => (
            <LotteryCard key={lottery.id} lottery={lottery} />
          ))}
        </div>
      )}
    </div>
  )
}
