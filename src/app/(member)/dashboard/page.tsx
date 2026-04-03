/**
 * หน้า Dashboard สมาชิก — iOS 17 HIG Design
 *
 * โครงสร้าง:
 * 1. Ticker bar (สีเขียว iOS)
 * 2. Balance card (dark forest green gradient, radius 20px)
 * 3. Menu grid (52×52 white circles, no boxes)
 * 4. Banner slider (iOS orange gradient, radius 16px)
 * 5. Game cards (หวยที่เปิดอยู่)
 * 6. ผลรางวัลล่าสุด
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, ChevronRight, Ticket, Trophy, ClipboardList, Target, PlusCircle, ArrowDownToLine, Gift, User, Headphones } from 'lucide-react'
import Link from 'next/link'
import Loading from '@/components/Loading'
import { useAuthStore } from '@/store/auth-store'
import { lotteryApi, resultApi, walletApi } from '@/lib/api'
import type { LotteryTypeInfo, LotteryRound } from '@/types'

const lotteryIcons: Record<string, string> = {
  THAI: '🇹🇭', LAO: '🇱🇦', STOCK_TH: '📈', STOCK_FOREIGN: '🌍', YEEKEE: '🎯', CUSTOM: '🎲',
}

const lotteryBgColors: Record<string, string> = {
  THAI: '#EFF6FF', LAO: '#FFF1F0', STOCK_TH: '#F0FFF4',
  STOCK_FOREIGN: '#F5F0FF', YEEKEE: '#FFF8F0', CUSTOM: '#F5F5F5',
}

const lotteryGradients: Record<string, string> = {
  THAI: 'linear-gradient(135deg, #f5a623, #d4820a)',
  LAO: 'linear-gradient(135deg, #ef4444, #dc2626)',
  STOCK_TH: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  STOCK_FOREIGN: 'linear-gradient(135deg, #a855f7, #7c3aed)',
  YEEKEE: 'linear-gradient(135deg, #0d6e6e, #34d399)',
}

// ⭐ Default banners — ใช้รูป SVG จาก public/images/banners/
// agent สามารถอัพรูปใหม่ทับได้ผ่าน CMS admin
const defaultBanners = [
  { id: 1, image: '/images/banners/banner-1.svg', title: 'สมัครใหม่รับโบนัส 100%', sub: 'เฉพาะสมาชิกใหม่เท่านั้น' },
  { id: 2, image: '/images/banners/banner-2.svg', title: 'ฝากเงินรับเพิ่ม 50%', sub: 'ทุกยอดฝาก สูงสุด 5,000 บาท' },
  { id: 3, image: '/images/banners/banner-3.svg', title: 'คืนยอดเสีย 10%', sub: 'ทุกวันจันทร์' },
]

// ⭐ Default ticker — ดึงจาก agent config ถ้ามี
const defaultTicker = '🎉 ยินดีต้อนรับสู่ LOTTO · จ่ายจริง ถอนได้จริง · สมัครวันนี้รับโบนัส 100% · หวยรัฐบาลจ่ายบาทละ 900'

// ⭐ Lottery images — ใช้รูป SVG จาก public/images/lottery/
const lotteryImages: Record<string, string> = {
  THAI: '/images/lottery/THAI.svg',
  LAO: '/images/lottery/LAO.svg',
  STOCK_TH: '/images/lottery/STOCK_TH.svg',
  STOCK_FOREIGN: '/images/lottery/STOCK_FOREIGN.svg',
  YEEKEE: '/images/lottery/YEEKEE.svg',
  HANOI: '/images/lottery/HANOI.svg',
  MALAY: '/images/lottery/MALAY.svg',
}

export default function DashboardPage() {
  const { member, updateBalance } = useAuthStore()
  const [lotteries, setLotteries] = useState<LotteryTypeInfo[]>([])
  const [latestResults, setLatestResults] = useState<LotteryRound[]>([])
  const [currentBanner, setCurrentBanner] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  // ดึงยอดเงินล่าสุดจาก API
  const refreshBalance = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await walletApi.getBalance()
      updateBalance(res.data.data?.balance || 0)
    } catch { /* ignore */ }
    setTimeout(() => setRefreshing(false), 500) // animation delay
  }, [updateBalance])

  useEffect(() => {
    lotteryApi.getTypes()
      .then(res => setLotteries(res.data.data || []))
      .catch(() => {})

    resultApi.getResults({ per_page: 3 })
      .then(res => setLatestResults(res.data.data?.items || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % defaultBanners.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div>

      {/* ===== 1. Ticker Bar — ⭐ ข้อความจาก CMS (ตั้งค่าใน admin → จัดการเว็บ → ตัวอักษรวิ่ง) ===== */}
      <div className="ticker-bar">
        <div className="ticker-content px-4">
          {defaultTicker}
        </div>
      </div>

      {/* ===== 2. Balance Card ===== */}
      <div className="ios-animate ios-animate-1" style={{ padding: '16px 16px 8px' }}>
        <div className="balance-card">
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 2 }}>สวัสดี</p>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>{member?.username || 'สมาชิก'}</p>
            </div>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: 18,
            }}>
              {member?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>

          {/* Balance + Refresh */}
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 4 }}>ยอดเงินคงเหลือ</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <p style={{ color: 'white', fontSize: 32, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1, margin: 0 }}>
              ฿{member?.balance?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'}
            </p>
            <button
              onClick={refreshBalance}
              disabled={refreshing}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 20,
                width: 32, height: 32, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.3s',
                transform: refreshing ? 'rotate(360deg)' : 'none',
              }}
              aria-label="รีเฟรชเครดิต"
            >
              <RefreshCw size={16} strokeWidth={2.5} color="white" />
            </button>
          </div>

          {/* Action buttons — ใช้สีธีม */}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <Link
              href="/wallet"
              style={{
                flex: 1, textAlign: 'center',
                background: 'var(--ios-green)', color: 'white',
                padding: '11px 8px', borderRadius: 12,
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
                minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ฝากเงิน
            </Link>
            <Link
              href="/wallet?tab=withdraw"
              style={{
                flex: 1, textAlign: 'center',
                background: 'rgba(255,255,255,0.15)', color: 'white',
                padding: '11px 8px', borderRadius: 12,
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
                minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              ถอนเงิน
            </Link>
          </div>
        </div>
      </div>

      {/* ===== 3. Menu Grid — Lucide icons + gradient bg (ไม่ใช้ emoji) ===== */}
      <div className="ios-animate ios-animate-2" style={{ padding: '12px 16px 8px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {([
          { href: '/lobby',        icon: <Ticket size={24} strokeWidth={1.8} />, label: 'แทงหวย',   gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
          { href: '/results',      icon: <Trophy size={24} strokeWidth={1.8} />, label: 'ผลรางวัล', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
          { href: '/history',      icon: <ClipboardList size={24} strokeWidth={1.8} />, label: 'โพยหวย',   gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
          { href: '/yeekee/room',  icon: <Target size={24} strokeWidth={1.8} />, label: 'ยี่กี',     gradient: 'linear-gradient(135deg, #ec4899, #db2777)' },
          { href: '/wallet',              icon: <PlusCircle size={24} strokeWidth={1.8} />, label: 'เติมเงิน', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
          { href: '/wallet?tab=withdraw', icon: <ArrowDownToLine size={24} strokeWidth={1.8} />, label: 'ถอนเงิน', gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)' },
          { href: '/referral',     icon: <Gift size={24} strokeWidth={1.8} />, label: 'แนะนำเพื่อน', gradient: 'linear-gradient(135deg, #f97316, #ea580c)' },
          { href: '/profile',      icon: <User size={24} strokeWidth={1.8} />, label: 'บัญชี',     gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
        ] as const).map((item, i) => (
          <Link key={i} href={item.href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: item.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white',
              boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
              transition: 'transform 0.15s',
            }}>
              {item.icon}
            </div>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ios-secondary-label)', textAlign: 'center', lineHeight: 1.2 }}>{item.label}</span>
          </Link>
        ))}
      </div>

      {/* ===== 4. Banner Slider — ดึงรูปจาก CMS (public/images/banners/) ===== */}
      <div className="ios-animate ios-animate-3" style={{ padding: '0 16px 24px' }}>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, height: 120 }}>
          {defaultBanners.map((banner, i) => (
            <div
              key={banner.id}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 16,
                overflow: 'hidden',
                transition: 'opacity 0.5s, transform 0.5s',
                opacity: i === currentBanner ? 1 : 0,
                transform: i === currentBanner ? 'translateX(0)' : 'translateX(100%)',
              }}
            >
              {/* ⭐ รูปจาก CMS — agent อัพรูปใหม่ทับได้ */}
              <img
                src={banner.image}
                alt={banner.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ))}
          {/* Pagination dots */}
          <div style={{
            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 5,
          }}>
            {defaultBanners.map((_, i) => (
              <button key={i} onClick={() => setCurrentBanner(i)} style={{
                width: i === currentBanner ? 16 : 6, height: 6, borderRadius: 3,
                background: i === currentBanner ? 'white' : 'rgba(255,255,255,0.45)',
                border: 'none', padding: 0, cursor: 'pointer', transition: 'width 0.25s, background 0.25s',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* ===== 5. หวยที่เปิดอยู่ ===== */}
      <div className="section-title ios-animate ios-animate-4">
        <span>หวยที่เปิดอยู่</span>
        <Link href="/lobby" className="see-all">ดูทั้งหมด</Link>
      </div>
      <div style={{ padding: '0 16px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }} className="ios-animate ios-animate-4">
        {lotteries.length === 0 ? (
          <Loading />
        ) : (
          lotteries.slice(0, 5).map((lottery) => {
            const gradient = lotteryGradients[lottery.code] || 'linear-gradient(135deg, #6b7280, #4b5563)'
            const imageUrl = (lottery as LotteryTypeInfo & { image_url?: string }).image_url
            const isYeekee = lottery.code === 'YEEKEE'
            return (
              <Link
                key={lottery.id}
                href={isYeekee ? '/yeekee/room' : `/lottery/${lottery.code}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{
                  background: 'var(--ios-card)', borderRadius: 14, overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                }}>
                  <div style={{ height: 3, background: gradient }} />
                  <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Icon */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, background: gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, overflow: 'hidden',
                      boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
                    }}>
                      {imageUrl ? (
                        <img src={imageUrl} alt={lottery.name} style={{ width: 48, height: 48, objectFit: 'cover' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <span style={{ fontSize: 24 }}>{lotteryIcons[lottery.code] || '🎲'}</span>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{lottery.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--ios-secondary-label)' }}>{lottery.description}</div>
                    </div>
                    {/* Badge */}
                    {isYeekee ? (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>Live</span>
                    ) : (
                      <ChevronRight size={16} color="var(--ios-tertiary-label)" />
                    )}
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>

      {/* ===== 6. ผลรางวัลล่าสุด ===== */}
      <div className="section-title ios-animate ios-animate-5">
        <span>ผลรางวัลล่าสุด</span>
        <Link href="/results" className="see-all">ดูทั้งหมด</Link>
      </div>
      <div style={{ padding: '0 16px', paddingBottom: 16 }} className="ios-animate ios-animate-5">
        {latestResults.length === 0 ? (
          <div style={{
            background: 'var(--ios-card)',
            borderRadius: 16,
            padding: '32px 16px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-card)',
          }}>
            <p style={{ color: 'var(--ios-secondary-label)', fontSize: 15 }}>ยังไม่มีผลรางวัล</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {latestResults.map(round => (
              <div key={round.id} style={{
                background: 'var(--ios-card)',
                borderRadius: 16,
                padding: '14px 16px',
                boxShadow: 'var(--shadow-card)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{lotteryIcons[round.lottery_type?.code] || '🎲'}</span>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{round.lottery_type?.name}</span>
                  </div>
                  <span style={{ color: 'var(--ios-secondary-label)', fontSize: 13 }}>
                    {new Date(round.round_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: '3 ตัวบน', value: round.result_top3 || '-', color: 'var(--ios-orange)', bg: 'rgba(255,159,10,0.08)' },
                    { label: '2 ตัวบน', value: round.result_top2 || '-', color: 'var(--ios-green)', bg: 'rgba(52,199,89,0.08)' },
                    { label: '2 ตัวล่าง', value: round.result_bottom2 || '-', color: 'var(--ios-blue)', bg: 'rgba(0,122,255,0.08)' },
                  ].map((item) => (
                    <div key={item.label} style={{ background: item.bg, borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
                      <div style={{ color: 'var(--ios-secondary-label)', fontSize: 11, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: item.color, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
