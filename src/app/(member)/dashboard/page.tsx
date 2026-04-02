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
import Link from 'next/link'
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
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" style={{ width: 16, height: 16 }}>
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <Link
              href="/wallet"
              style={{
                flex: 1,
                textAlign: 'center',
                background: '#34C759',
                color: 'white',
                padding: '11px 8px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(52,199,89,0.4)',
              }}
            >
              ฝากเงิน
            </Link>
            <Link
              href="/wallet"
              style={{
                flex: 1,
                textAlign: 'center',
                background: '#FF3B30',
                color: 'white',
                padding: '11px 8px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(255,59,48,0.4)',
              }}
            >
              ถอนเงิน
            </Link>
          </div>
        </div>
      </div>

      {/* ===== 3. Menu Grid (icon circles, no boxes) ===== */}
      <div className="ios-animate ios-animate-2 menu-grid">
        {[
          { href: '/lobby',        emoji: '🎰', label: 'แทงหวย' },
          { href: '/results',      emoji: '🏆', label: 'ผลรางวัล' },
          { href: '/history',      emoji: '📋', label: 'โพยหวย' },
          { href: '/yeekee/room',  emoji: '🎯', label: 'ยี่กี' },
          { href: '/wallet',       emoji: '💰', label: 'เติมเงิน' },
          { href: '/wallet',       emoji: '🏧', label: 'ถอนเงิน' },
          { href: '/referral',     emoji: '🎁', label: 'แนะนำเพื่อน' },
          { href: '/profile',      emoji: '👤', label: 'บัญชี' },
        ].map((item, i) => (
          <Link key={i} href={item.href} className="menu-grid-item">
            <div className="icon">{item.emoji}</div>
            <span className="label">{item.label}</span>
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
      <div style={{ padding: '0 16px', marginBottom: 24 }} className="ios-animate ios-animate-4">
        <div style={{ background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          {lotteries.length === 0 ? (
            [1, 2, 3].map(i => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderBottom: i < 3 ? '0.5px solid var(--ios-separator)' : 'none',
              }}>
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 14, width: 100, marginBottom: 6, borderRadius: 4 }} />
                  <div className="skeleton" style={{ height: 12, width: 140, borderRadius: 4 }} />
                </div>
              </div>
            ))
          ) : (
            lotteries.slice(0, 5).map((lottery, idx) => (
              <Link
                key={lottery.id}
                href={lottery.code === 'YEEKEE' ? '/yeekee/room' : `/lottery/${lottery.code}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  textDecoration: 'none',
                  color: 'var(--ios-label)',
                  borderBottom: idx < lotteries.slice(0,5).length - 1 ? '0.5px solid var(--ios-separator)' : 'none',
                  transition: 'opacity 0.1s',
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: lotteryBgColors[lottery.code] || '#F5F5F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  flexShrink: 0,
                }}>
                  {lotteryIcons[lottery.code] || '🎲'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, marginBottom: 2 }}>{lottery.name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--ios-secondary-label)', margin: 0 }}>{lottery.description}</p>
                </div>
                {lottery.code === 'YEEKEE' && (
                  <span className="chip chip-green" style={{ fontSize: 11, marginRight: 4 }}>Live</span>
                )}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16, color: 'var(--ios-tertiary-label)', flexShrink: 0 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))
          )}
        </div>
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
