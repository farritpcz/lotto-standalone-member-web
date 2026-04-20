/**
 * LatestResults — รายการผลรางวัล 3 งวดล่าสุด (card pattern iOS)
 *
 * Rule: UI-only
 * Related: app/(member)/dashboard/page.tsx
 */
'use client'
import Link from 'next/link'
import type { LotteryRound } from '@/types'

interface Props {
  rounds: LotteryRound[]
}

export default function LatestResults({ rounds }: Props) {
  return (
    <>
      <div className="section-title ios-animate ios-animate-5">
        <span>ผลรางวัลล่าสุด</span>
        <Link href="/results" className="see-all">
          ดูทั้งหมด
        </Link>
      </div>
      <div
        style={{ padding: '0 16px', paddingBottom: 16 }}
        className="ios-animate ios-animate-5"
      >
        {rounds.length === 0 ? (
          <div
            style={{
              background: 'var(--ios-card)',
              borderRadius: 16,
              padding: '32px 16px',
              textAlign: 'center',
              border: '1px solid var(--ios-separator)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            }}
          >
            <p style={{ color: 'var(--ios-secondary-label)', fontSize: 15 }}>
              ยังไม่มีผลรางวัล
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rounds.map(round => (
              <div
                key={round.id}
                style={{
                  background: 'var(--ios-card)',
                  borderRadius: 16,
                  padding: '14px 16px',
                  border: '1px solid var(--ios-separator)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{round.lottery_type?.icon || '🎲'}</span>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>
                      {round.lottery_type?.name}
                    </span>
                  </div>
                  <span style={{ color: 'var(--ios-secondary-label)', fontSize: 13 }}>
                    {new Date(round.round_date).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    {
                      label: '3 ตัวบน',
                      value: round.result_top3 || '-',
                      color: 'var(--accent-color)',
                      bg: 'color-mix(in srgb, var(--accent-color) 10%, transparent)',
                    },
                    {
                      label: '2 ตัวบน',
                      value: round.result_top2 || '-',
                      color: 'var(--ios-label)',
                      bg: 'var(--ios-bg)',
                    },
                    {
                      label: '2 ตัวล่าง',
                      value: round.result_bottom2 || '-',
                      color: 'var(--ios-label)',
                      bg: 'var(--ios-bg)',
                    },
                  ].map(item => (
                    <div
                      key={item.label}
                      style={{
                        background: item.bg,
                        borderRadius: 10,
                        padding: '8px 4px',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          color: 'var(--ios-secondary-label)',
                          fontSize: 11,
                          marginBottom: 4,
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: item.color,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
