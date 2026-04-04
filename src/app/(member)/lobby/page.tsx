/**
 * หน้า Lobby — เลือกประเภทหวย
 * Design: Cards แยก + gradient icon + รองรับรูปจาก API
 */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Clock, Zap } from 'lucide-react'
import Loading from '@/components/Loading'
import { lotteryApi } from '@/lib/api'
import type { LotteryTypeInfo } from '@/types'

// Category-based styling (ไม่ต้อง map ทุก code — ดึงจาก category ของ lottery)
const catStyles: Record<string, { gradient: string; accent: string; emoji: string }> = {
  thai:   { gradient: 'linear-gradient(135deg, #f5a623 0%, #d4820a 100%)', accent: '#d4820a', emoji: '🇹🇭' },
  yeekee: { gradient: 'linear-gradient(135deg, #0d6e6e 0%, #34d399 100%)', accent: '#0d6e6e', emoji: '🎯' },
  lao:    { gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', accent: '#dc2626', emoji: '🇱🇦' },
  hanoi:  { gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', accent: '#be185d', emoji: '🇻🇳' },
  malay:  { gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', accent: '#0d9488', emoji: '🇲🇾' },
  stock:  { gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', accent: '#2563eb', emoji: '📈' },
}

const defaultStyle = { gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)', accent: '#6b7280', emoji: '🎲' }

const categories = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'thai', label: 'หวยไทย' },
  { key: 'lao', label: 'หวยลาว' },
  { key: 'hanoi', label: 'หวยฮานอย' },
  { key: 'malay', label: 'มาเลย์' },
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
    const cat = (l as LotteryTypeInfo & { category?: string }).category || ''
    return cat === selectedCat
  })

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '16px 16px 6px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ios-label)', margin: 0 }}>แทงหวย</h1>
        <p style={{ fontSize: 13, color: 'var(--ios-secondary-label)', marginTop: 4 }}>เลือกประเภทหวยที่ต้องการ</p>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {categories.map(cat => (
          <button key={cat.key} onClick={() => setSelectedCat(cat.key)} style={{
            padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: selectedCat === cat.key ? 600 : 400,
            whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', flexShrink: 0,
            background: selectedCat === cat.key ? 'var(--ios-green)' : 'var(--ios-card)',
            color: selectedCat === cat.key ? 'white' : 'var(--ios-label)',
            boxShadow: selectedCat === cat.key ? '0 2px 10px rgba(52,199,89,0.3)' : 'var(--shadow-card)',
          }}>
            {cat.label}
          </button>
        ))}
      </div>

      {loading && <Loading />}

      {/* Lottery Cards */}
      {!loading && (
        <div style={{ padding: '0 16px', paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 ? (
            <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '48px 16px', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
              <p style={{ color: 'var(--ios-secondary-label)' }}>ไม่มีหวยในหมวดนี้</p>
            </div>
          ) : filtered.map(lottery => {
            const cat = (lottery as LotteryTypeInfo & { category?: string }).category || 'stock'
            const style = catStyles[cat] || defaultStyle
            const isYeekee = lottery.code === 'YEEKEE'
            const href = isYeekee ? '/yeekee/room' : `/lottery/${lottery.code}`
            // รองรับรูปจาก API (image_url field) หรือ fallback เป็น emoji
            const imageUrl = (lottery as LotteryTypeInfo & { image_url?: string }).image_url

            return (
              <Link key={lottery.id} href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  transition: 'transform 0.15s',
                }}>
                  {/* Top gradient bar */}
                  <div style={{ height: 4, background: style.gradient }} />

                  <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Lottery image/icon */}
                    <div style={{
                      width: 56, height: 56, borderRadius: 14,
                      background: style.gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, overflow: 'hidden',
                      boxShadow: `0 4px 12px ${style.accent}30`,
                    }}>
                      {imageUrl ? (
                        <img src={imageUrl} alt={lottery.name}
                          style={{ width: 56, height: 56, objectFit: 'cover' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <span style={{ fontSize: 28, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>
                          {style.emoji}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4, color: 'var(--ios-label)' }}>
                        {lottery.name}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ios-secondary-label)', lineHeight: 1.4 }}>
                        {lottery.description}
                      </div>
                    </div>

                    {/* Status + arrow */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      {isYeekee ? (
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                          background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                        }}>
                          <Zap size={12} fill="#ef4444" /> Live
                        </span>
                      ) : (
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                          background: 'rgba(52,199,89,0.1)', color: '#34C759',
                        }}>
                          <Clock size={12} /> เปิดรับ
                        </span>
                      )}
                      <ChevronRight size={16} color="var(--ios-tertiary-label)" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
