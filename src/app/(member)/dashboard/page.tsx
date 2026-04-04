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
import { RefreshCw, ChevronRight, Ticket, Trophy, ClipboardList, Target, Wallet, ArrowDownToLine, Gift, User, Headphones } from 'lucide-react'
import Link from 'next/link'
import Loading from '@/components/Loading'
import { useAuthStore } from '@/store/auth-store'
import { api, lotteryApi, resultApi, walletApi } from '@/lib/api'
import type { LotteryTypeInfo, LotteryRound } from '@/types'
import BannerCarousel from '@/components/BannerCarousel'

/* ─── Fallback banners — ใช้เมื่อยังไม่มี banner จาก API ─── */
const FALLBACK_BANNERS = [
  { image_url: '/images/banners/banner-default.png' },
  { image_url: '/images/banners/banner-default.png' },
  { image_url: '/images/banners/banner-default.png' },
]

// ── Category-based styling — ไม่ต้อง map ทุก code ──────────────────────────
const categoryStyles: Record<string, { icon: string; gradient: string; glow: string; cardBg: string }> = {
  thai:   { icon: '🇹🇭', gradient: 'linear-gradient(135deg, #f5a623, #d4820a)', glow: 'rgba(245,166,35,0.25)', cardBg: 'linear-gradient(135deg, rgba(245,166,35,0.08) 0%, transparent 100%)' },
  yeekee: { icon: '🎯', gradient: 'linear-gradient(135deg, #0d6e6e, #34d399)', glow: 'rgba(45,212,191,0.25)', cardBg: 'linear-gradient(135deg, rgba(45,212,191,0.08) 0%, transparent 100%)' },
  lao:    { icon: '🇱🇦', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', glow: 'rgba(239,68,68,0.25)', cardBg: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, transparent 100%)' },
  hanoi:  { icon: '🇻🇳', gradient: 'linear-gradient(135deg, #ec4899, #be185d)', glow: 'rgba(236,72,153,0.25)', cardBg: 'linear-gradient(135deg, rgba(236,72,153,0.08) 0%, transparent 100%)' },
  malay:  { icon: '🇲🇾', gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)', glow: 'rgba(20,184,166,0.25)', cardBg: 'linear-gradient(135deg, rgba(20,184,166,0.08) 0%, transparent 100%)' },
  stock:  { icon: '📈', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', glow: 'rgba(59,130,246,0.25)', cardBg: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, transparent 100%)' },
}
const defaultStyle = categoryStyles.stock

// Helper: ดึง style จาก category (ไม่ต้อง hardcode ทุก code)
const getStyle = (category: string) => categoryStyles[category] || defaultStyle

// compat — ยังใช้ใน results section
const lotteryIcons: Record<string, string> = { THAI_GOV: '🇹🇭', YEEKEE: '🎯' }
const lotteryGradients: Record<string, string> = {}


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
  const [banners, setBanners] = useState(FALLBACK_BANNERS)
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

    // โหลด banners จาก API — ถ้าไม่มีใช้ fallback
    api.get('/banners').then(res => {
      const data = res.data.data || []
      if (data.length > 0) setBanners(data)
    }).catch(() => {})
  }, [])

  return (
    <div style={{ fontFamily: 'var(--font-sarabun), -apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* ===== 1. Ticker Bar — ⭐ ข้อความจาก CMS (ตั้งค่าใน admin → จัดการเว็บ → ตัวอักษรวิ่ง) ===== */}
      <div className="ticker-bar">
        <div className="ticker-content px-4">
          {defaultTicker}
        </div>
      </div>

      {/* ===== 2. Banner Slider — ดึงจาก API, fallback เป็น default ===== */}
      <div style={{ padding: '12px 16px 0' }}>
        <BannerCarousel banners={banners} height={140} interval={4000} />
      </div>

      {/* ===== 3. Balance Card ===== */}
      <div className="ios-animate ios-animate-1" style={{ padding: '16px 16px 8px' }}>
        <div className="balance-card" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, position: 'relative', zIndex: 1 }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 2 }}>สวัสดี</p>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 17 }}>{member?.username || 'สมาชิก'}</p>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: '2px solid color-mix(in srgb, var(--accent-color) 40%, transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent-color)', fontWeight: 700, fontSize: 18,
            }}>
              {member?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>

          {/* Balance + Refresh */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginBottom: 6 }}>ยอดเงินคงเหลือ</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <p style={{ color: 'var(--accent-color)', fontSize: 34, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1, margin: 0 }}>
                ฿{member?.balance?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'}
              </p>
              <button
                onClick={refreshBalance}
                disabled={refreshing}
                style={{
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 20, width: 32, height: 32, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 0.3s',
                  transform: refreshing ? 'rotate(360deg)' : 'none',
                }}
                aria-label="รีเฟรชเครดิต"
              >
                <RefreshCw size={16} strokeWidth={2.5} color="rgba(255,255,255,0.7)" />
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 18, position: 'relative', zIndex: 1 }}>
            <Link
              href="/wallet"
              style={{
                flex: 1, textAlign: 'center',
                background: 'linear-gradient(180deg, var(--accent-color) 0%, color-mix(in srgb, var(--accent-color) 82%, black) 100%)',
                color: '#1a1a1a',
                padding: '11px 8px', borderRadius: 12,
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
                minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px color-mix(in srgb, var(--accent-color) 30%, transparent)',
              }}
            >
              ฝากเงิน
            </Link>
            <Link
              href="/wallet?tab=withdraw"
              style={{
                flex: 1, textAlign: 'center',
                background: 'linear-gradient(180deg, color-mix(in srgb, var(--header-bg) 85%, white) 0%, var(--header-bg) 100%)',
                color: 'white',
                padding: '11px 8px', borderRadius: 12,
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
                minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px color-mix(in srgb, var(--header-bg) 35%, transparent)',
              }}
            >
              ถอนเงิน
            </Link>
          </div>
        </div>
      </div>

      {/* ===== 3. Menu Grid — 3 กลุ่มสี: gold (เล่น) / green (เงิน) / teal (อื่นๆ) ===== */}
      <div className="ios-animate ios-animate-2" style={{ padding: '12px 16px 8px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {([
          // ── กลุ่ม "เล่นหวย" — gold/amber family ──
          { href: '/lobby',        icon: <Ticket size={24} strokeWidth={1.8} />,        label: 'แทงหวย',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', glow: true },
          { href: '/results',      icon: <Trophy size={24} strokeWidth={1.8} />,        label: 'ผลรางวัล', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
          { href: '/history',      icon: <ClipboardList size={24} strokeWidth={1.8} />, label: 'โพยหวย',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
          { href: '/yeekee/room',  icon: <Target size={24} strokeWidth={1.8} />,        label: 'ยี่กี',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
          // ── กลุ่ม "กระเป๋าเงิน" — green family ──
          { href: '/wallet',              icon: <Wallet size={24} strokeWidth={1.8} />,         label: 'เติมเงิน', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
          { href: '/wallet?tab=withdraw', icon: <ArrowDownToLine size={24} strokeWidth={1.8} />, label: 'ถอนเงิน', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
          // ── กลุ่ม "อื่นๆ" — teal family ──
          { href: '/referral',     icon: <Gift size={24} strokeWidth={1.8} />, label: 'แนะนำเพื่อน', color: 'var(--accent-color)', bg: 'color-mix(in srgb, var(--accent-color) 12%, transparent)' },
          { href: '/profile',      icon: <User size={24} strokeWidth={1.8} />, label: 'บัญชี',        color: 'var(--accent-color)', bg: 'color-mix(in srgb, var(--accent-color) 12%, transparent)' },
        ] as { href: string; icon: React.ReactNode; label: string; color: string; bg: string; glow?: boolean }[]).map((item, i) => (
          <Link key={i} href={item.href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: item.bg,
              border: item.glow ? `1.5px solid ${item.color}40` : '1.5px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: item.color,
              boxShadow: item.glow ? `0 0 16px ${item.color}25` : 'none',
              transition: 'transform 0.15s',
            }}>
              {item.icon}
            </div>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ios-secondary-label)', textAlign: 'center', lineHeight: 1.2 }}>{item.label}</span>
          </Link>
        ))}
      </div>


      {/* ===== 5. หวยที่เปิดอยู่ — Premium Glassmorphism Cards ===== */}
      <div className="section-title ios-animate ios-animate-4">
        <span>หวยที่เปิดอยู่</span>
        <Link href="/lobby" className="see-all">ดูทั้งหมด</Link>
      </div>
      <div style={{ padding: '0 16px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }} className="ios-animate ios-animate-4">
        {lotteries.length === 0 ? (
          <Loading />
        ) : (
          lotteries.slice(0, 8).map((lottery, idx) => {
            const cat = (lottery as LotteryTypeInfo & { category?: string }).category || 'stock'
            const style = getStyle(cat)
            const imageUrl = (lottery as LotteryTypeInfo & { image_url?: string }).image_url
            const isYeekee = lottery.code === 'YEEKEE'
            return (
              <Link
                key={lottery.id}
                href={isYeekee ? '/yeekee/room' : `/lottery/${lottery.code}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  className={`lottery-card ios-animate lottery-stagger-${Math.min(idx + 1, 5)}`}
                  style={{
                    background: `${style.cardBg}, var(--ios-card)`,
                    border: isYeekee
                      ? '1px solid rgba(45,212,191,0.25)'
                      : '1px solid var(--ios-separator)',
                    boxShadow: isYeekee
                      ? `0 2px 16px rgba(0,0,0,0.06), 0 0 20px rgba(45,212,191,0.08)`
                      : '0 2px 16px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
                    {/* Icon — 56x56 with colored glow */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {/* Glow behind icon */}
                      <div style={{
                        position: 'absolute', inset: -4,
                        borderRadius: 18, background: style.glow,
                        filter: 'blur(10px)',
                        opacity: 0.6,
                      }} />
                      <div style={{
                        width: 56, height: 56, borderRadius: 14, background: style.gradient,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', position: 'relative',
                        boxShadow: `0 4px 14px ${style.glow}`,
                      }}>
                        {imageUrl ? (
                          <img src={imageUrl} alt={lottery.name} style={{ width: 56, height: 56, objectFit: 'cover' }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        ) : (
                          <span style={{ fontSize: 28, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))' }}>
                            {lottery.icon || style.icon || '🎲'}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Text content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 16, fontWeight: 700, marginBottom: 3,
                        color: 'var(--ios-label)',
                      }}>
                        {lottery.name}
                      </div>
                      <div style={{
                        fontSize: 13, color: 'var(--ios-secondary-label)',
                        lineHeight: 1.3, marginBottom: isYeekee ? 4 : 0,
                      }}>
                        {lottery.description}
                      </div>
                      {/* YEEKEE: live status line */}
                      {isYeekee && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          fontSize: 12, fontWeight: 600,
                          color: 'var(--accent-color)',
                        }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: 'var(--accent-color)',
                            display: 'inline-block',
                            boxShadow: '0 0 6px var(--accent-color)',
                          }} />
                          กำลังเปิดรับ
                        </div>
                      )}
                    </div>
                    {/* Right — Live badge or Chevron */}
                    {isYeekee ? (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px', borderRadius: 12,
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.15)',
                      }}>
                        <span className="live-dot" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', letterSpacing: 0.5 }}>LIVE</span>
                      </div>
                    ) : (
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'var(--ios-bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <ChevronRight size={15} strokeWidth={2.5} color="var(--ios-secondary-label)" />
                      </div>
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
            border: '1px solid var(--ios-separator)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
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
                border: '1px solid var(--ios-separator)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{round.lottery_type?.icon || '🎲'}</span>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{round.lottery_type?.name}</span>
                  </div>
                  <span style={{ color: 'var(--ios-secondary-label)', fontSize: 13 }}>
                    {new Date(round.round_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: '3 ตัวบน', value: round.result_top3 || '-', color: 'var(--accent-color)', bg: 'color-mix(in srgb, var(--accent-color) 10%, transparent)' },
                    { label: '2 ตัวบน', value: round.result_top2 || '-', color: 'var(--ios-label)', bg: 'var(--ios-bg)' },
                    { label: '2 ตัวล่าง', value: round.result_bottom2 || '-', color: 'var(--ios-label)', bg: 'var(--ios-bg)' },
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
