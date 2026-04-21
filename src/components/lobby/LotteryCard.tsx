// Card ย่อยใน lobby grid — ธง/รูป + ชื่อ + สถานะ + countdown
// Parent: src/app/(member)/lobby/page.tsx

'use client'

import Link from 'next/link'
import { Zap, Clock } from 'lucide-react'
import { resolveImageUrl } from '@/lib/imageUrl'
import type { LotteryTypeInfo } from '@/types'
import { STATUS_OPEN, STATUS_CLOSED, catEmoji, catGradient, catShadow } from './types'
import DefaultLotteryIcon from './DefaultLotteryIcon'
import CountdownTimer from './CountdownTimer'

export default function LotteryCard({ lottery }: { lottery: LotteryTypeInfo }) {
  const isYeekee = lottery.code === 'YEEKEE'
  const href = isYeekee ? '/yeekee/room' : `/lottery/${lottery.code}`
  const imageUrl = (lottery as LotteryTypeInfo & { image_url?: string }).image_url
  const cat = (lottery as LotteryTypeInfo & { category?: string }).category || 'stock'

  const emoji = (lottery as LotteryTypeInfo & { icon?: string }).icon || catEmoji[cat] || '🎲'

  // ─── สถานะ + countdown ──────────────────────────────────
  const nextClose = lottery.next_close_time
  const hasOpenRound = !!nextClose
  const status = isYeekee
    ? { bg: 'rgba(239,68,68,0.08)', color: '#ef4444', label: 'Live' }
    : hasOpenRound ? STATUS_OPEN : STATUS_CLOSED

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
        {/* พื้นหลังหวย (รูป หรือ SVG default) */}
        <div style={{
          position: 'relative', width: '100%', height: 90,
          background: imageUrl ? '#f0f0f0' : gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {imageUrl ? (
            <img src={resolveImageUrl(imageUrl)} alt={lottery.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                // รูปโหลดไม่ได้ → fallback เป็น gradient + SVG
                const parent = (e.target as HTMLImageElement).parentElement
                if (parent) parent.style.background = gradient;
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
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
              <div style={{ position: 'relative', zIndex: 1 }}>
                <DefaultLotteryIcon cat={cat} emoji={emoji} />
              </div>
            </>
          )}
        </div>

        {/* ข้อมูลด้านล่าง */}
        <div style={{ padding: '8px 8px 10px', textAlign: 'center' }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: 'var(--ios-label)',
            lineHeight: 1.3, marginBottom: 3, minHeight: 32,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {lottery.name}
          </div>

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

          {/* ⭐ Countdown timer — เหลือเวลารับแทง */}
          {nextClose && <CountdownTimer closeTime={nextClose} />}
        </div>
      </div>
    </Link>
  )
}
