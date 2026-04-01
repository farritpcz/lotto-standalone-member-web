/**
 * หน้า Dashboard สมาชิก — หน้าหลักหลัง login
 *
 * แสดง: ยอดเงิน, bets ล่าสุด, ผลรางวัลล่าสุด, ลิงก์ไปหน้าต่างๆ
 */

'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/auth-store'

export default function DashboardPage() {
  const { member } = useAuthStore()

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header — ยอดเงิน */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 mb-6">
        <p className="text-blue-200 text-sm">ยอดเงินคงเหลือ</p>
        <p className="text-3xl font-bold text-white mt-1">
          ฿{member?.balance?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'}
        </p>
        <div className="flex gap-3 mt-4">
          <Link
            href="/wallet"
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            ฝาก-ถอน
          </Link>
          <Link
            href="/history"
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            ประวัติ
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Link href="/lobby" className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition">
          <div className="text-2xl mb-1">🎰</div>
          <div className="text-white text-sm font-medium">แทงหวย</div>
        </Link>
        <Link href="/results" className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition">
          <div className="text-2xl mb-1">📋</div>
          <div className="text-white text-sm font-medium">ตรวจผล</div>
        </Link>
        <Link href="/history" className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition">
          <div className="text-2xl mb-1">📜</div>
          <div className="text-white text-sm font-medium">ประวัติ</div>
        </Link>
        <Link href="/profile" className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition">
          <div className="text-2xl mb-1">👤</div>
          <div className="text-white text-sm font-medium">โปรไฟล์</div>
        </Link>
      </div>

      {/* Recent bets placeholder */}
      <div className="bg-gray-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-3">การแทงล่าสุด</h2>
        <p className="text-gray-500 text-sm">ยังไม่มีการแทง — <Link href="/lobby" className="text-blue-400">เริ่มแทงหวย</Link></p>
      </div>
    </div>
  )
}
