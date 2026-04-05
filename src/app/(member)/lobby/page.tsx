/**
 * =============================================================================
 * หน้า Lobby — เลือกประเภทหวย (Grid layout แบบเจริญดี88)
 * =============================================================================
 *
 * โครงสร้าง:
 *  1. Header + Back
 *  2. ไอคอนหมวด (category icons row) — 6 ไอคอนวงกลม
 *  3. Filter tabs — แถบกรอง horizontal scroll
 *  4. Lottery grid — แยก section ตามหมวด, 3 คอลัมน์
 *     - แต่ละ card: ธง/รูป + ชื่อ + เวลา + ปุ่มสถานะ
 *
 * สีใช้ agent theme: --accent-color, --header-bg, --card-gradient
 * =============================================================================
 */
'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronLeft, Zap, Clock, Ticket, Trophy, Target, TrendingUp, Globe, Sparkles, Timer } from 'lucide-react'
import Loading from '@/components/Loading'
import { lotteryApi } from '@/lib/api'
import type { LotteryTypeInfo } from '@/types'

// ─── Category config ─────────────────────────────────────────────
// สำหรับ section headers + icons
const categories = [
  { key: 'all',    label: 'ทั้งหมด', icon: Sparkles, emoji: '✨' },
  { key: 'thai',   label: 'หวยไทย',  icon: Ticket,   emoji: '🇹🇭' },
  { key: 'yeekee', label: 'ยี่กี',    icon: Target,   emoji: '🎯' },
  { key: 'lao',    label: 'หวยลาว',  icon: Globe,    emoji: '🇱🇦' },
  { key: 'hanoi',  label: 'ฮานอย',   icon: Globe,    emoji: '🇻🇳' },
  { key: 'malay',  label: 'มาเลย์',  icon: Globe,    emoji: '🇲🇾' },
  { key: 'stock',  label: 'หุ้น',     icon: TrendingUp, emoji: '📈' },
]

// สีแถบสถานะ (เปิดรับ/ปิดรับ)
const STATUS_OPEN = { bg: 'color-mix(in srgb, var(--accent-color) 12%, transparent)', color: 'var(--accent-color)', label: 'เปิดรับแทง' }
const STATUS_CLOSED = { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'ปิดรับแทง' }

export default function LobbyPage() {
  const [lotteries, setLotteries] = useState<LotteryTypeInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCat, setSelectedCat] = useState('all')

  useEffect(() => {
    lotteryApi.getTypes()
      .then(res => setLotteries(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ─── Filter ────────────────────────────────────────────────
  const filtered = selectedCat === 'all'
    ? lotteries
    : lotteries.filter(l => (l as LotteryTypeInfo & { category?: string }).category === selectedCat)

  // ─── Group by category (สำหรับแสดง section headers) ─────────
  const grouped = filtered.reduce((acc, lottery) => {
    const cat = (lottery as LotteryTypeInfo & { category?: string }).category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(lottery)
    return acc
  }, {} as Record<string, LotteryTypeInfo[]>)

  // ─── Category order สำหรับ render sections ───────────────────
  const catOrder = ['thai', 'yeekee', 'lao', 'hanoi', 'malay', 'stock', 'other']
  const catLabels: Record<string, string> = {
    thai: 'หวยไทย', yeekee: 'ยี่กี', lao: 'หวยลาว',
    hanoi: 'หวยฮานอย', malay: 'หวยมาเลย์', stock: 'หวยหุ้น', other: 'อื่นๆ',
  }

  return (
    <div style={{ paddingBottom: 24 }}>

      {/* ═══════════════════════════════════════════════════════════
          Header
          ═══════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '14px 16px 8px',
      }}>
        <Link href="/dashboard" style={{
          width: 34, height: 34, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--ios-card)', boxShadow: 'var(--shadow-card)',
          textDecoration: 'none', color: 'var(--ios-label)',
        }}>
          <ChevronLeft size={20} strokeWidth={2} />
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ios-label)', margin: 0, flex: 1 }}>
          แทงหวยใหม่
        </h1>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Category Icons Row — ไอคอนวงกลมด้านบน
          ═══════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 6, padding: '8px 12px 12px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {categories.map(cat => {
          const isActive = selectedCat === cat.key
          return (
            <button key={cat.key} onClick={() => setSelectedCat(cat.key)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 6px', flexShrink: 0, minWidth: 48,
            }}>
              {/* ไอคอนวงกลม */}
              <div style={{
                width: 46, height: 46, borderRadius: '50%',
                background: isActive
                  ? 'var(--accent-color)'
                  : 'var(--ios-card)',
                border: isActive ? 'none' : '1.5px solid var(--ios-separator)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isActive
                  ? '0 4px 12px color-mix(in srgb, var(--accent-color) 35%, transparent)'
                  : 'var(--shadow-card)',
                transition: 'all 0.2s',
              }}>
                <cat.icon size={20} strokeWidth={1.8}
                  style={{ color: isActive ? 'white' : 'var(--ios-secondary-label)' }}
                />
              </div>
              {/* label */}
              <span style={{
                fontSize: 10, fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--accent-color)' : 'var(--ios-secondary-label)',
                whiteSpace: 'nowrap',
              }}>
                {cat.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Filter Tabs — แถบกรอง horizontal scroll
          ═══════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', gap: 6, padding: '0 16px 14px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {categories.map(cat => (
          <button key={cat.key} onClick={() => setSelectedCat(cat.key)} style={{
            padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', flexShrink: 0,
            background: selectedCat === cat.key ? 'var(--accent-color)' : 'var(--ios-card)',
            color: selectedCat === cat.key ? 'white' : 'var(--ios-secondary-label)',
            boxShadow: selectedCat === cat.key
              ? '0 2px 8px color-mix(in srgb, var(--accent-color) 30%, transparent)'
              : 'var(--shadow-card)',
            transition: 'all 0.2s',
          }}>
            {cat.label}
          </button>
        ))}
      </div>

      {loading && <Loading />}

      {/* ═══════════════════════════════════════════════════════════
          Lottery Grid — แยก section ตามหมวด, 3 คอลัมน์
          ═══════════════════════════════════════════════════════════ */}
      {!loading && filtered.length === 0 && (
        <div style={{
          background: 'var(--ios-card)', borderRadius: 16, margin: '0 16px',
          padding: '48px 16px', textAlign: 'center', boxShadow: 'var(--shadow-card)',
        }}>
          <p style={{ color: 'var(--ios-secondary-label)' }}>ไม่มีหวยในหมวดนี้</p>
        </div>
      )}

      {!loading && selectedCat === 'all' ? (
        /* ── แสดงแบบแยก section ตามหมวด ──────────────────────── */
        catOrder.map(catKey => {
          const items = grouped[catKey]
          if (!items || items.length === 0) return null
          return (
            <div key={catKey} style={{ marginBottom: 16 }}>
              {/* Section header */}
              <div style={{
                padding: '8px 16px 8px',
                fontSize: 15, fontWeight: 700, color: 'var(--ios-label)',
              }}>
                {catLabels[catKey] || catKey}
              </div>
              {/* Grid 3 คอลัมน์ */}
              <div className="lobby-grid" style={{
                padding: '0 12px',
                display: 'grid', gap: 8,
              }}>
                {items.map(lottery => (
                  <LotteryCard key={lottery.id} lottery={lottery} />
                ))}
              </div>
            </div>
          )
        })
      ) : (
        /* ── แสดงทั้งหมด (ไม่แยก section) ───────────────────── */
        <div className="lobby-grid" style={{
          padding: '0 12px',
          display: 'grid', gap: 8,
        }}>
          {filtered.map(lottery => (
            <LotteryCard key={lottery.id} lottery={lottery} />
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// LotteryCard — card ย่อยใน grid (ธง + ชื่อ + เวลา + สถานะ)
// =============================================================================
function LotteryCard({ lottery }: { lottery: LotteryTypeInfo }) {
  const isYeekee = lottery.code === 'YEEKEE'
  const href = isYeekee ? '/yeekee/room' : `/lottery/${lottery.code}`
  const imageUrl = (lottery as LotteryTypeInfo & { image_url?: string }).image_url
  const cat = (lottery as LotteryTypeInfo & { category?: string }).category || 'stock'

  // ─── Emoji fallback mapping ────────────────────────────────
  const catEmoji: Record<string, string> = {
    thai: '🇹🇭', yeekee: '🎯', lao: '🇱🇦', hanoi: '🇻🇳', malay: '🇲🇾', stock: '📈',
  }
  const emoji = (lottery as LotteryTypeInfo & { icon?: string }).icon || catEmoji[cat] || '🎲'

  // ─── สถานะ + countdown ──────────────────────────────────
  const nextClose = lottery.next_close_time
  const hasOpenRound = !!nextClose
  const status = isYeekee
    ? { bg: 'rgba(239,68,68,0.08)', color: '#ef4444', label: 'Live' }
    : hasOpenRound ? STATUS_OPEN : STATUS_CLOSED

  // ─── พื้นหลัง card ──────────────────────────────────────
  // ⭐ ถ้ามี image_url → ใช้รูปเป็น background / ถ้าไม่มี → SVG pattern + gradient
  const gradient = catGradient[cat] || catGradient.stock
  const shadow = catShadow[cat] || 'rgba(0,0,0,0.15)'

  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        borderRadius: 14, overflow: 'hidden',
        boxShadow: `var(--shadow-card), 0 4px 14px ${shadow}`,
        transition: 'transform 0.15s',
        display: 'flex', flexDirection: 'column',
        background: 'var(--ios-card)',
      }}>
        {/* ═══ พื้นหลังหวย (รูป หรือ SVG default) ═══════════ */}
        <div style={{
          position: 'relative', width: '100%', height: 90,
          background: imageUrl ? '#f0f0f0' : gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {imageUrl ? (
            /* ── รูปจาก admin ─────────────────────────────── */
            <img src={imageUrl} alt={lottery.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                // รูปโหลดไม่ได้ → fallback เป็น gradient + SVG
                const parent = (e.target as HTMLImageElement).parentElement
                if (parent) parent.style.background = gradient;
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            /* ── SVG default — pattern + icon ─────────────── */
            <>
              {/* ลาย pattern พื้นหลัง */}
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.1,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2l2 3.5-2 3zM0 20h2v2H0z'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '20px 20px',
              }} />
              {/* วงกลมเรืองแสง */}
              <div style={{
                position: 'absolute', width: 120, height: 120, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                top: -20, right: -20,
              }} />
              {/* SVG icon กลาง */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <DefaultLotteryIcon cat={cat} emoji={emoji} />
              </div>
            </>
          )}
        </div>

        {/* ═══ ข้อมูลด้านล่าง ══════════════════════════════ */}
        <div style={{ padding: '8px 8px 10px', textAlign: 'center' }}>
          {/* ชื่อหวย */}
          <div style={{
            fontSize: 12, fontWeight: 700, color: 'var(--ios-label)',
            lineHeight: 1.3, marginBottom: 3, minHeight: 32,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {lottery.name}
          </div>

          {/* รายละเอียด */}
          <div style={{
            fontSize: 10, color: 'var(--ios-tertiary-label)',
            marginBottom: 8, lineHeight: 1.3, minHeight: 26,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {lottery.description || '-'}
          </div>

          {/* ปุ่มสถานะ */}
          <div style={{
            padding: '5px 0', borderRadius: 8,
            fontSize: 10, fontWeight: 700,
            background: status.bg, color: status.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
          }}>
            {isYeekee ? <Zap size={10} fill="#ef4444" /> : <Clock size={10} strokeWidth={2.5} />}
            {status.label}
          </div>

          {/* ⭐ Countdown timer — เหลือเวลารับแทงอีก X วัน X:XX:XX */}
          {nextClose && <CountdownTimer closeTime={nextClose} />}
        </div>
      </div>
    </Link>
  )
}

// =============================================================================
// Gradient + Shadow maps ตามหมวดหวย
// =============================================================================

/** พื้นหลัง gradient สำหรับ SVG default icon (เมื่อไม่มีรูปจาก admin) */
const catGradient: Record<string, string> = {
  thai:   'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  yeekee: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  lao:    'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
  hanoi:  'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
  malay:  'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
  stock:  'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
}

/** เงาตามหมวด */
const catShadow: Record<string, string> = {
  thai: 'rgba(245,158,11,0.3)', yeekee: 'rgba(239,68,68,0.3)',
  lao: 'rgba(239,68,68,0.25)', hanoi: 'rgba(236,72,153,0.3)',
  malay: 'rgba(20,184,166,0.3)', stock: 'rgba(59,130,246,0.3)',
}

// =============================================================================
// DefaultLotteryIcon — SVG icon สวยๆ สำหรับ default (ไม่มีรูปจาก admin)
// =============================================================================

/** SVG icon ขาวบนพื้น gradient ตามหมวด */
function DefaultLotteryIcon({ cat, emoji }: { cat: string; emoji: string }) {
  const svgIcons: Record<string, React.ReactNode> = {
    thai: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="3" />
      </svg>
    ),
    yeekee: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
        <line x1="22" y1="12" x2="18" y2="12" /><line x1="6" y1="12" x2="2" y2="12" />
        <line x1="12" y1="6" x2="12" y2="2" /><line x1="12" y1="22" x2="12" y2="18" />
      </svg>
    ),
    lao: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </svg>
    ),
    hanoi: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="none">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ),
    malay: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="white" fillOpacity="0.2" />
        <polygon points="17,8 18,10.5 20.5,10.5 18.5,12 19.2,14.5 17,13 14.8,14.5 15.5,12 13.5,10.5 16,10.5" fill="white" />
      </svg>
    ),
    stock: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  }

  return svgIcons[cat] || <span style={{ fontSize: 24, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>{emoji}</span>
}

// =============================================================================
// CountdownTimer — แสดง countdown ปิดรับแทง
// =============================================================================

/** แสดง countdown เวลาที่เหลือก่อนปิดรับ เช่น "2 วัน 05:30:12" */
function CountdownTimer({ closeTime }: { closeTime: string }) {
  const [now, setNow] = useState(Date.now())

  // อัพเดททุก 1 วินาที
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const diff = new Date(closeTime).getTime() - now
  if (diff <= 0) return null // หมดเวลาแล้ว

  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  const pad = (n: number) => String(n).padStart(2, '0')

  // format: "2 วัน 05:30:12" หรือ "05:30:12" ถ้าไม่ถึงวัน
  const timeStr = days > 0
    ? `${days} วัน ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`

  return (
    <div style={{
      marginTop: 6, padding: '4px 6px', borderRadius: 8,
      background: 'color-mix(in srgb, var(--header-bg) 10%, transparent)',
      border: '1px solid color-mix(in srgb, var(--header-bg) 15%, transparent)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
      fontSize: 9, fontWeight: 600, color: 'var(--ios-secondary-label)',
    }}>
      <Timer size={9} strokeWidth={2.5} />
      {timeStr}
    </div>
  )
}
