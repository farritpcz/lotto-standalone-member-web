/**
 * หน้ารีวิวจากผู้ใช้ — แสดง testimonials (แบบเจริญดี88)
 *
 * Mock data — ในอนาคตจะมาจาก API
 */

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

const reviews = [
  { id: 1, name: 'คุณ A***', rating: 5, text: 'ถอนไวมาก ไม่ถึง 5 นาที เงินเข้าเลย สุดยอดครับ', date: '2 วันที่แล้ว' },
  { id: 2, name: 'คุณ S***', rating: 5, text: 'แทงหวยง่าย UI สวย ใช้งานสะดวก', date: '3 วันที่แล้ว' },
  { id: 3, name: 'คุณ N***', rating: 4, text: 'ยี่กีสนุกมาก เล่นได้ตลอด 24 ชม.', date: '5 วันที่แล้ว' },
  { id: 4, name: 'คุณ P***', rating: 5, text: 'จ่ายจริง ถูก 3 ตัวบนได้เงินทันที ไม่โกง', date: '1 สัปดาห์ที่แล้ว' },
  { id: 5, name: 'คุณ T***', rating: 4, text: 'หวยครบทุกประเภท ทั้งไทย ลาว หุ้น ยี่กี', date: '1 สัปดาห์ที่แล้ว' },
  { id: 6, name: 'คุณ M***', rating: 5, text: 'ฝากถอนง่าย มีโปรโมชั่นดีๆ ตลอด', date: '2 สัปดาห์ที่แล้ว' },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`text-sm ${i <= rating ? 'text-amber-400' : 'text-gray-300'}`}>
          ★
        </span>
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)

  return (
    <div>
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <Link href="/dashboard" className="text-muted">
          <ChevronLeft size={20} strokeWidth={2} />
        </Link>
        <h1 className="text-lg font-bold">รีวิวจากผู้ใช้</h1>
      </div>

      {/* Summary Card */}
      <div className="px-4 mb-3">
        <div className="card p-5 text-center">
          <div className="text-4xl font-bold" style={{ color: 'var(--color-primary)' }}>{avgRating}</div>
          <div className="flex justify-center mt-1 mb-1">
            <StarRating rating={Math.round(Number(avgRating))} />
          </div>
          <div className="text-muted text-xs">จาก {reviews.length} รีวิว</div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="px-4 pb-4 space-y-2">
        {reviews.map(review => (
          <div key={review.id} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'var(--color-primary)' }}>
                  {review.name.charAt(3)}
                </div>
                <div>
                  <div className="font-semibold text-sm">{review.name}</div>
                  <StarRating rating={review.rating} />
                </div>
              </div>
              <span className="text-muted text-[10px]">{review.date}</span>
            </div>
            <p className="text-sm text-secondary">{review.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
