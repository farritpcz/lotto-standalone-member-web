/**
 * NumberGrid — Tab 'เลือกจากแผง' (แบบเจริญดี88)
 *
 * แสดงตารางเลข 00-99 สำหรับ 2 ตัว หรือ 000-999 สำหรับ 3 ตัว
 * กดเลขเพื่อเพิ่มลง bet slip
 * + filter หมวด + ค้นหา
 */

'use client'

import { useState, useMemo } from 'react'

interface NumberGridProps {
  digitCount: number
  onSelect: (number: string) => void
}

// หมวดเลขเด็ด
const categories2 = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'teen', label: 'เลขตอง', filter: (n: string) => n[0] === n[1] },
  { key: 'low', label: '00-49', filter: (n: string) => parseInt(n) <= 49 },
  { key: 'high', label: '50-99', filter: (n: string) => parseInt(n) >= 50 },
]

export default function NumberGrid({ digitCount, onSelect }: NumberGridProps) {
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('all')

  // สร้างรายการเลข
  const allNumbers = useMemo(() => {
    const max = Math.pow(10, digitCount)
    return Array.from({ length: max }, (_, i) => String(i).padStart(digitCount, '0'))
  }, [digitCount])

  // Filter
  const filtered = useMemo(() => {
    let nums = allNumbers

    // Filter by category (2 หลัก only)
    if (digitCount === 2 && selectedCat !== 'all') {
      const cat = categories2.find(c => c.key === selectedCat)
      if (cat?.filter) nums = nums.filter(cat.filter)
    }

    // Filter by search
    if (search) {
      nums = nums.filter(n => n.includes(search))
    }

    return nums
  }, [allNumbers, digitCount, selectedCat, search])

  // จำกัดแสดงไม่เกิน 200 เลข
  const displayNumbers = filtered.slice(0, 200)

  return (
    <div>
      {/* ค้นหา */}
      <div className="mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value.replace(/\D/g, ''))}
          placeholder={`ค้นหาเลข ${digitCount} หลัก...`}
          className="w-full rounded-lg px-4 py-2.5 text-sm border border-gray-200 focus:border-teal-500 focus:outline-none"
          style={{ background: 'var(--color-bg-card)' }}
          maxLength={digitCount}
        />
      </div>

      {/* หมวดหมู่ (2 หลัก) */}
      {digitCount === 2 && (
        <div className="flex gap-1.5 mb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {categories2.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCat(cat.key)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-semibold whitespace-nowrap transition ${
                selectedCat === cat.key ? 'text-white' : 'text-secondary'
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
      )}

      {/* จำนวนที่พบ */}
      <div className="text-muted text-xs mb-2">
        พบ {filtered.length} เลข {filtered.length > 200 && '(แสดง 200 แรก)'}
      </div>

      {/* Grid */}
      <div className={`grid gap-1.5 max-h-72 overflow-y-auto ${
        digitCount <= 2 ? 'grid-cols-5' : 'grid-cols-4'
      }`}>
        {displayNumbers.map(num => (
          <button
            key={num}
            onClick={() => onSelect(num)}
            className="card py-2 text-center font-mono font-bold text-sm transition active:scale-95 hover:shadow-md"
            style={{ color: 'var(--color-primary)' }}
          >
            {num}
          </button>
        ))}
      </div>

      {digitCount >= 3 && filtered.length > 200 && (
        <p className="text-muted text-xs text-center mt-2">ใช้ช่องค้นหาเพื่อกรองเลข</p>
      )}
    </div>
  )
}
