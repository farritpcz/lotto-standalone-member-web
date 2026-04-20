/**
 * FeaturedLotteries — grid 2 คอลัมน์ แสดงหวยแนะนำ 6 ประเภท + countdown
 *
 * Rule: filter `code` ∈ featured list จาก parent-provided lotteries
 * Related: app/(member)/dashboard/page.tsx, types.LotteryTypeInfo
 */
'use client'
import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { Clock, Timer, Zap } from 'lucide-react'
import Loading from '@/components/Loading'
import type { LotteryTypeInfo } from '@/types'

const FEATURED_CODES = ['THAI_GOV', 'GSB', 'YEEKEE', 'LAO_VIP', 'HANOI', 'MALAY']

interface Props {
  lotteries: LotteryTypeInfo[]
}

export default function FeaturedLotteries({ lotteries }: Props) {
  const filtered = FEATURED_CODES.map(code => lotteries.find(l => l.code === code)).filter(
    Boolean,
  ) as LotteryTypeInfo[]

  return (
    <>
      <div
        className="ios-animate ios-animate-4"
        style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 16px 6px' }}
      >
        <Link
          href="/lobby"
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--accent-color)',
            textDecoration: 'none',
          }}
        >
          ดูทั้งหมด
        </Link>
      </div>
      <div
        className="lobby-grid ios-animate ios-animate-4"
        style={{ padding: '0 12px', marginBottom: 24, display: 'grid', gap: 8 }}
      >
        {lotteries.length === 0 ? (
          <Loading />
        ) : (
          filtered.map(lottery => {
            const isYeekee = lottery.code === 'YEEKEE'
            const href = isYeekee ? '/yeekee/room' : `/lottery/${lottery.code}`
            const imageUrl = (lottery as LotteryTypeInfo & { image_url?: string }).image_url
            const nextClose = lottery.next_close_time

            return (
              <Link
                key={lottery.id}
                href={href}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  style={{
                    borderRadius: 14,
                    overflow: 'hidden',
                    height: '100%',
                    boxShadow: 'var(--shadow-card)',
                    background: 'var(--ios-card)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* พื้นหลัง (รูปจาก DB) */}
                  <div
                    style={{
                      width: '100%',
                      height: 90,
                      overflow: 'hidden',
                      background: imageUrl ? '#f0f0f0' : 'var(--ios-fill)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={lottery.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 36 }}>{lottery.icon || '🎲'}</span>
                    )}
                  </div>

                  {/* ข้อมูล */}
                  <div
                    style={{
                      padding: '8px 8px 10px',
                      textAlign: 'center',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--ios-label)',
                        lineHeight: 1.3,
                        marginBottom: 3,
                      }}
                    >
                      {lottery.name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--ios-tertiary-label)',
                        marginBottom: 8,
                        lineHeight: 1.3,
                        flex: 1,
                      }}
                    >
                      {lottery.description || '-'}
                    </div>

                    {/* สถานะ */}
                    <div
                      style={{
                        padding: '5px 0',
                        borderRadius: 8,
                        fontSize: 10,
                        fontWeight: 700,
                        background: isYeekee
                          ? 'rgba(239,68,68,0.08)'
                          : 'color-mix(in srgb, var(--accent-color) 12%, transparent)',
                        color: isYeekee ? '#ef4444' : 'var(--accent-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3,
                      }}
                    >
                      {isYeekee ? (
                        <>
                          <Zap size={10} fill="#ef4444" /> Live
                        </>
                      ) : (
                        <>
                          <Clock size={10} strokeWidth={2.5} /> เปิดรับแทง
                        </>
                      )}
                    </div>

                    {nextClose && <DashboardCountdown closeTime={nextClose} />}
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </>
  )
}

// ⭐ useSyncExternalStore — อ่าน Date.now() อย่าง pure, trigger re-render ทุก 1s
//    server snapshot = 0 (ยังไม่ render countdown บน SSR)
function subscribeTick(cb: () => void): () => void {
  const id = setInterval(cb, 1000)
  return () => clearInterval(id)
}
const getNow = () => Date.now()
const getServerNow = () => 0

/** Countdown ขนาดเล็กสำหรับการ์ดหวย */
function DashboardCountdown({ closeTime }: { closeTime: string }) {
  const now = useSyncExternalStore(subscribeTick, getNow, getServerNow)

  if (now === 0) return null // SSR / pre-mount
  const diff = new Date(closeTime).getTime() - now
  if (diff <= 0) return null

  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  const text = d > 0 ? `${d} วัน ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`

  return (
    <div
      style={{
        marginTop: 6,
        padding: '4px 6px',
        borderRadius: 8,
        background: 'color-mix(in srgb, var(--header-bg) 10%, transparent)',
        border: '1px solid color-mix(in srgb, var(--header-bg) 15%, transparent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        fontSize: 9,
        fontWeight: 600,
        color: 'var(--ios-secondary-label)',
      }}
    >
      <Timer size={9} strokeWidth={2.5} />
      {text}
    </div>
  )
}
