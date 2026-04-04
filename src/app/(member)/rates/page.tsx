/**
 * หน้าอัตราจ่าย — แสดง rate จ่ายทุกประเภทหวย (แบบเจริญดี88)
 *
 * dropdown เลือกประเภทหวย + ตาราง rate ทั้งหมด
 * เรียก API: lotteryApi → standalone-member-api (#3)
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import Loading from '@/components/Loading'
import { lotteryApi } from '@/lib/api'
import type { LotteryTypeInfo, BetTypeInfo } from '@/types'

// Category-based icons — ไม่ hardcode lottery code เพราะ code เปลี่ยนได้
const categoryIcons: Record<string, string> = {
  thai: '🇹🇭', lao: '🇱🇦', hanoi: '🇻🇳', malay: '🇲🇾', stock: '📈', yeekee: '🎯', custom: '🎲',
}
const getIcon = (lt: LotteryTypeInfo) => {
  const cat = (lt as LotteryTypeInfo & { category?: string }).category || ''
  return categoryIcons[cat] || '🎲'
}

export default function RatesPage() {
  const [lotteryTypes, setLotteryTypes] = useState<LotteryTypeInfo[]>([])
  const [selectedType, setSelectedType] = useState<LotteryTypeInfo | null>(null)
  const [betTypes, setBetTypes] = useState<BetTypeInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    lotteryApi.getTypes()
      .then(res => {
        const types = res.data.data || []
        setLotteryTypes(types)
        if (types.length > 0) setSelectedType(types[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // โหลด bet types เมื่อเปลี่ยนประเภทหวย
  useEffect(() => {
    if (!selectedType) return
    lotteryApi.getBetTypes(selectedType.id)
      .then(res => setBetTypes(res.data.data || []))
      .catch(() => setBetTypes([]))
  }, [selectedType])

  return (
    <div>
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <Link href="/dashboard" className="text-muted">
          <ChevronLeft size={20} strokeWidth={2} />
        </Link>
        <h1 className="text-lg font-bold">อัตราจ่าย</h1>
      </div>

      {/* เลือกประเภทหวย */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {lotteryTypes.map(lt => (
          <button
            key={lt.id}
            onClick={() => setSelectedType(lt)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              selectedType?.id === lt.id ? 'text-white' : 'text-secondary'
            }`}
            style={{
              background: selectedType?.id === lt.id ? 'var(--color-primary)' : 'var(--color-bg-card)',
              boxShadow: selectedType?.id === lt.id ? 'none' : 'var(--shadow-card)',
            }}
          >
            {getIcon(lt)} {lt.name}
          </button>
        ))}
      </div>

      {/* ตาราง Rate */}
      <div className="px-4 pb-4">
        {loading ? (
          <Loading />
        ) : betTypes.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-muted text-sm">ยังไม่มีข้อมูลอัตราจ่าย</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-2 px-4 py-3 text-[11px] font-bold uppercase tracking-wider"
              style={{
                background: 'linear-gradient(135deg, var(--header-bg) 0%, color-mix(in srgb, var(--header-bg) 70%, black) 100%)',
                color: 'var(--accent-color)',
                position: 'relative', overflow: 'hidden',
                backgroundImage: `linear-gradient(135deg, var(--header-bg) 0%, color-mix(in srgb, var(--header-bg) 70%, black) 100%), url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20.5z' fill='%23ffffff' fill-opacity='0.04' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              }}>
              <div>ประเภท</div>
              <div className="text-center">จำนวนหลัก</div>
              <div className="text-center">อัตราจ่าย</div>
              <div className="text-right">สูงสุด/เลข</div>
            </div>
            {betTypes.map((bt, i) => (
              <div key={bt.code} className={`grid grid-cols-4 gap-2 items-center px-4 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                <div className="font-semibold text-sm">{bt.name}</div>
                <div className="text-center">
                  <span className="chip chip-teal">{bt.digit_count} หลัก</span>
                </div>
                <div className="text-center">
                  <span className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>x{bt.rate}</span>
                </div>
                <div className="text-right text-xs text-muted">
                  {bt.max_bet_per_number > 0 ? `฿${bt.max_bet_per_number.toLocaleString()}` : 'ไม่จำกัด'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
