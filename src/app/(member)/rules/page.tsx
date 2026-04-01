/**
 * หน้ากฎและกติกา — แสดงกฎการเล่นหวย (แบบเจริญดี88)
 *
 * static content — ไม่ใช้ API
 */

import Link from 'next/link'

const rules = [
  {
    title: 'กติกาทั่วไป',
    items: [
      'สมาชิกต้องมีอายุ 20 ปีบริบูรณ์ขึ้นไป',
      'ยอดเดิมพันขั้นต่ำ 1 บาท สูงสุดตามที่ระบบกำหนด',
      'หากมีการทุจริตหรือใช้โปรแกรมช่วย ทางเราขอสงวนสิทธิ์ยกเลิกรายการทันที',
      'ผลการแทงอ้างอิงจากแหล่งข้อมูลอย่างเป็นทางการเท่านั้น',
    ],
  },
  {
    title: 'การแทงหวย',
    items: [
      '3 ตัวบน — ทายผลเลข 3 ตัวบนตรงตำแหน่ง',
      '3 ตัวโต๊ด — ทายผลเลข 3 ตัวบนไม่จำกัดตำแหน่ง (กลับได้)',
      '2 ตัวบน — ทายผลเลข 2 ตัวบนตรงตำแหน่ง',
      '2 ตัวล่าง — ทายผลเลข 2 ตัวล่างตรงตำแหน่ง',
      'วิ่งบน — ทายเลข 1 ตัวที่อยู่ใน 3 ตัวบน',
      'วิ่งล่าง — ทายเลข 1 ตัวที่อยู่ใน 2 ตัวล่าง',
    ],
  },
  {
    title: 'ยี่กี',
    items: [
      'ยิงเลข 5 หลัก ภายในเวลาที่กำหนด',
      'ผลรวมเลขทั้งหมด mod 100000 = ผลยี่กี',
      'นำผลไปแยกเป็น 3 ตัวบน, 2 ตัวบน, 2 ตัวล่าง',
      'เปิดให้เล่นตลอด 24 ชั่วโมง',
    ],
  },
  {
    title: 'การฝาก-ถอนเงิน',
    items: [
      'ฝากเงินขั้นต่ำ 100 บาท',
      'ถอนเงินขั้นต่ำ 300 บาท',
      'ถอนเงินได้ไม่เกิน 3 ครั้ง/วัน',
      'ระบบประมวลผลอัตโนมัติ ภายใน 1-5 นาที',
    ],
  },
]

export default function RulesPage() {
  return (
    <div>
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <Link href="/dashboard" className="text-muted">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold">กฎและกติกา</h1>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {rules.map((section, i) => (
          <div key={i} className="card p-4">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'var(--color-primary)' }}>
                {i + 1}
              </span>
              {section.title}
            </h2>
            <ul className="space-y-2">
              {section.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-secondary">
                  <span className="text-muted mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
