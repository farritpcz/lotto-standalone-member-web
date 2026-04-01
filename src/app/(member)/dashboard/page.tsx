/**
 * หน้า Dashboard สมาชิก — หน้าหลักหลัง login (แบบเจริญดี88)
 *
 * โครงสร้าง:
 * 1. Ticker bar (ข้อความวิ่ง)
 * 2. User balance card (gradient teal)
 * 3. Menu grid (4 columns)
 * 4. Banner slider (โปรโมชั่น)
 * 5. Game cards (หวยที่เปิดอยู่)
 * 6. ผลรางวัลล่าสุด
 *
 * เรียก API: lotteryApi, resultApi → standalone-member-api (#3)
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth-store'
import { lotteryApi, resultApi } from '@/lib/api'
import type { LotteryTypeInfo, LotteryRound } from '@/types'

// Icon mapping สำหรับแต่ละประเภทหวย
const lotteryIcons: Record<string, string> = {
  THAI: '🇹🇭', LAO: '🇱🇦', STOCK_TH: '📈', STOCK_FOREIGN: '🌍', YEEKEE: '🎯', CUSTOM: '🎲',
}

// สีพื้นหลัง icon สำหรับ game card
const lotteryBgColors: Record<string, string> = {
  THAI: 'bg-blue-50', LAO: 'bg-red-50', STOCK_TH: 'bg-green-50',
  STOCK_FOREIGN: 'bg-purple-50', YEEKEE: 'bg-orange-50', CUSTOM: 'bg-gray-50',
}

// Banner โปรโมชั่น (mock data — จะมาจาก API ภายหลัง)
const banners = [
  { id: 1, title: 'สมัครใหม่รับโบนัส 100%', color: 'from-teal-500 to-emerald-600' },
  { id: 2, title: 'แนะนำเพื่อน รับค่าคอม 5%', color: 'from-amber-500 to-orange-600' },
  { id: 3, title: 'หวยยี่กี เปิดใหม่ 24 ชม.', color: 'from-pink-500 to-rose-600' },
]

export default function DashboardPage() {
  const { member } = useAuthStore()
  const [lotteries, setLotteries] = useState<LotteryTypeInfo[]>([])
  const [latestResults, setLatestResults] = useState<LotteryRound[]>([])
  const [currentBanner, setCurrentBanner] = useState(0)

  // โหลดข้อมูล
  useEffect(() => {
    lotteryApi.getTypes()
      .then(res => setLotteries(res.data.data || []))
      .catch(() => {})

    resultApi.getResults({ per_page: 3 })
      .then(res => setLatestResults(res.data.data?.items || []))
      .catch(() => {})
  }, [])

  // Banner auto-slide
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div>
      {/* ===== 1. Ticker Bar (ข้อความวิ่ง) ===== */}
      <div className="ticker-bar">
        <div className="ticker-content">
          📢 ยินดีต้อนรับสู่ LOTTO — แทงหวยออนไลน์ จ่ายจริง ถอนไว 24 ชม. &nbsp;&nbsp;&nbsp; 🏆 ผู้โชคดีถูกรางวัล 3 ตัวบน รับ ฿900,000 &nbsp;&nbsp;&nbsp; 🔥 หวยยี่กีเปิดใหม่ ยิงเลขได้ตลอด 24 ชม.
        </div>
      </div>

      {/* ===== 2. Balance Card ===== */}
      <div className="p-4">
        <div className="balance-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white/70 text-xs">สวัสดี</p>
              <p className="text-white font-bold text-base">{member?.username || 'สมาชิก'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
              {member?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          <p className="text-white/60 text-xs">ยอดเงินคงเหลือ</p>
          <p className="text-3xl font-bold text-white mt-0.5">
            ฿{member?.balance?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'}
          </p>
          <div className="flex gap-2 mt-4">
            <Link
              href="/wallet"
              className="flex-1 text-center bg-white/20 hover:bg-white/30 text-white py-2.5 rounded-lg text-sm font-semibold transition no-underline"
            >
              ฝากเงิน
            </Link>
            <Link
              href="/wallet"
              className="flex-1 text-center bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-lg text-sm font-semibold transition no-underline"
            >
              ถอนเงิน
            </Link>
          </div>
        </div>
      </div>

      {/* ===== 3. Menu Grid (4 columns) ===== */}
      <div className="menu-grid">
        <Link href="/lobby" className="menu-grid-item">
          <div className="icon bg-teal-50 text-teal-600">🎰</div>
          <span className="label">แทงหวย</span>
        </Link>
        <Link href="/results" className="menu-grid-item">
          <div className="icon bg-amber-50 text-amber-600">🏆</div>
          <span className="label">ผลรางวัล</span>
        </Link>
        <Link href="/history" className="menu-grid-item">
          <div className="icon bg-blue-50 text-blue-600">📋</div>
          <span className="label">โพยหวย</span>
        </Link>
        <Link href="/yeekee/room" className="menu-grid-item">
          <div className="icon bg-orange-50 text-orange-600">🎯</div>
          <span className="label">ยี่กี</span>
        </Link>
        <Link href="/wallet" className="menu-grid-item">
          <div className="icon bg-green-50 text-green-600">💰</div>
          <span className="label">เติมเงิน</span>
        </Link>
        <Link href="/wallet" className="menu-grid-item">
          <div className="icon bg-red-50 text-red-600">🏧</div>
          <span className="label">ถอนเงิน</span>
        </Link>
        <Link href="/history" className="menu-grid-item">
          <div className="icon bg-purple-50 text-purple-600">📜</div>
          <span className="label">ประวัติ</span>
        </Link>
        <Link href="/profile" className="menu-grid-item">
          <div className="icon bg-pink-50 text-pink-600">👤</div>
          <span className="label">บัญชี</span>
        </Link>
      </div>

      {/* ===== 4. Banner Slider ===== */}
      <div className="px-4 mb-4">
        <div className="relative overflow-hidden rounded-xl" style={{ height: 120 }}>
          {banners.map((banner, i) => (
            <div
              key={banner.id}
              className={`absolute inset-0 bg-gradient-to-r ${banner.color} rounded-xl flex items-center justify-center transition-all duration-500 ${
                i === currentBanner ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
              }`}
            >
              <p className="text-white font-bold text-lg text-center px-6">{banner.title}</p>
            </div>
          ))}
          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentBanner(i)}
                className={`w-2 h-2 rounded-full transition ${
                  i === currentBanner ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ===== 5. หวยที่เปิดอยู่ (Game Cards) ===== */}
      <div className="section-title">
        <span>หวยที่เปิดอยู่</span>
        <Link href="/lobby" className="see-all">ดูทั้งหมด →</Link>
      </div>
      <div className="px-4 mb-4 space-y-2">
        {lotteries.length === 0 ? (
          // Skeleton loading
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-3 flex items-center gap-3">
                <div className="skeleton w-12 h-12 rounded-lg" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-24 mb-1.5" />
                  <div className="skeleton h-3 w-36" />
                </div>
              </div>
            ))}
          </>
        ) : (
          lotteries.slice(0, 5).map(lottery => (
            <Link
              key={lottery.id}
              href={lottery.code === 'YEEKEE' ? '/yeekee/room' : `/lottery/${lottery.code}`}
              className="game-card"
            >
              <div className={`game-icon ${lotteryBgColors[lottery.code] || 'bg-gray-50'}`}>
                {lotteryIcons[lottery.code] || '🎲'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{lottery.name}</h3>
                <p className="text-xs text-muted truncate mt-0.5">{lottery.description}</p>
              </div>
              {lottery.code === 'YEEKEE' && (
                <span className="chip chip-green text-xs">Live</span>
              )}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-muted flex-shrink-0">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))
        )}
      </div>

      {/* ===== 6. ผลรางวัลล่าสุด ===== */}
      <div className="section-title">
        <span>ผลรางวัลล่าสุด</span>
        <Link href="/results" className="see-all">ดูทั้งหมด →</Link>
      </div>
      <div className="px-4 pb-4 space-y-2">
        {latestResults.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-muted text-sm">ยังไม่มีผลรางวัล</p>
          </div>
        ) : (
          latestResults.map(round => (
            <div key={round.id} className="card p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{lotteryIcons[round.lottery_type?.code] || '🎲'}</span>
                  <span className="font-semibold text-sm">{round.lottery_type?.name}</span>
                </div>
                <span className="text-muted text-xs">
                  {new Date(round.round_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-amber-50 rounded-lg p-2 text-center">
                  <div className="text-muted text-[10px]">3 ตัวบน</div>
                  <div className="text-lg font-bold font-mono text-amber-600">{round.result_top3 || '-'}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <div className="text-muted text-[10px]">2 ตัวบน</div>
                  <div className="text-lg font-bold font-mono text-green-600">{round.result_top2 || '-'}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <div className="text-muted text-[10px]">2 ตัวล่าง</div>
                  <div className="text-lg font-bold font-mono text-blue-600">{round.result_bottom2 || '-'}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
