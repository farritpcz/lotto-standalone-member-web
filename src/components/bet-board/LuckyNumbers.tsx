/**
 * LuckyNumbers — Tab 'เลือกแบบเลขวิน' (แบบเจริญดี88)
 *
 * แสดงเลขชุดสำเร็จรูป (เลขวิน) ให้เลือก
 * กดเลือก → เพิ่มลง bet slip
 */

'use client'

import { useState } from 'react'

interface LuckyNumbersProps {
  digitCount: number
  onSelect: (number: string) => void
}

// ชุดเลขวินสำเร็จรูป
const luckyGroups = [
  {
    name: 'เลขเรียง',
    numbers2: ['12', '23', '34', '45', '56', '67', '78', '89', '90', '01'],
    numbers3: ['123', '234', '345', '456', '567', '678', '789', '890', '901', '012'],
  },
  {
    name: 'เลขตอง',
    numbers2: ['00', '11', '22', '33', '44', '55', '66', '77', '88', '99'],
    numbers3: ['000', '111', '222', '333', '444', '555', '666', '777', '888', '999'],
  },
  {
    name: 'เลขกลับ',
    numbers2: ['19', '91', '28', '82', '37', '73', '46', '64', '05', '50'],
    numbers3: ['159', '951', '267', '762', '348', '843', '102', '201', '534', '435'],
  },
  {
    name: 'เลขดัง',
    numbers2: ['42', '89', '36', '71', '55', '07', '63', '18', '94', '25'],
    numbers3: ['428', '891', '365', '712', '509', '634', '187', '946', '253', '070'],
  },
  {
    name: 'เลขมงคล',
    numbers2: ['09', '19', '29', '39', '49', '59', '69', '79', '89', '99'],
    numbers3: ['168', '289', '369', '456', '789', '199', '299', '399', '599', '899'],
  },
]

export default function LuckyNumbers({ digitCount, onSelect }: LuckyNumbersProps) {
  const [selectedGroup, setSelectedGroup] = useState(0)

  const group = luckyGroups[selectedGroup]
  const numbers = digitCount === 2 ? group.numbers2 : group.numbers3

  return (
    <div>
      {/* Group Tabs */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {luckyGroups.map((g, i) => (
          <button
            key={g.name}
            onClick={() => setSelectedGroup(i)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-semibold whitespace-nowrap transition ${
              selectedGroup === i ? 'text-white' : 'text-secondary'
            }`}
            style={{
              background: selectedGroup === i ? 'var(--color-primary)' : 'var(--color-bg-card)',
              boxShadow: selectedGroup === i ? 'none' : 'var(--shadow-card)',
            }}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Numbers Grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {numbers.map(num => (
          <button
            key={num}
            onClick={() => onSelect(num)}
            className="card py-2.5 text-center font-mono font-bold text-sm transition active:scale-95 hover:shadow-md"
            style={{ color: 'var(--color-primary)' }}
          >
            {num}
          </button>
        ))}
      </div>

      <p className="text-muted text-xs text-center mt-2">กดเลขเพื่อเพิ่มลงรายการแทง</p>
    </div>
  )
}
