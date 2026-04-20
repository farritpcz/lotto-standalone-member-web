// Component: LeaderboardTab — period switcher + top 10 referrers list
// Parent: src/app/(member)/referral/page.tsx

import { Trophy, Crown, Medal } from 'lucide-react'
import Loading from '@/components/Loading'
import type { LeaderboardEntry } from '@/lib/api'

export interface LeaderboardTabProps {
  lbPeriod: 'day' | 'week' | 'month'
  setLbPeriod: (p: 'day' | 'week' | 'month') => void
  lbLoading: boolean
  leaderboard: LeaderboardEntry[]
}

export function LeaderboardTab({ lbPeriod, setLbPeriod, lbLoading, leaderboard }: LeaderboardTabProps) {
  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

      <div style={{ display: 'flex', gap: 8 }}>
        {([
          { key: 'day' as const, label: 'วันนี้' },
          { key: 'week' as const, label: 'สัปดาห์นี้' },
          { key: 'month' as const, label: 'เดือนนี้' },
        ]).map(p => (
          <button
            key={p.key}
            onClick={() => setLbPeriod(p.key)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: lbPeriod === p.key ? '1.5px solid var(--accent-color)' : '1.5px solid var(--ios-separator)',
              background: lbPeriod === p.key ? 'color-mix(in srgb, var(--accent-color) 8%, transparent)' : 'var(--ios-card)',
              color: lbPeriod === p.key ? 'var(--accent-color)' : 'var(--ios-secondary-label)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--ios-separator)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Trophy size={18} strokeWidth={2} style={{ color: 'var(--ios-orange)' }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ios-label)' }}>
            Top 10 ผู้แนะนำ
          </p>
        </div>

        {lbLoading ? (
          <div style={{ padding: 40 }}><Loading inline /></div>
        ) : leaderboard.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center' }}>
            <Trophy size={40} strokeWidth={1.5} style={{ color: 'var(--ios-tertiary-label)', marginBottom: 8 }} />
            <p style={{ color: 'var(--ios-secondary-label)', fontSize: 15 }}>ยังไม่มีข้อมูลอันดับ</p>
            <p style={{ color: 'var(--ios-tertiary-label)', fontSize: 13, marginTop: 4 }}>ชวนเพื่อนเพิ่มเพื่อขึ้นอันดับ!</p>
          </div>
        ) : (
          leaderboard.map((entry, idx) => {
            const rankIcon = entry.rank === 1
              ? <Crown size={20} strokeWidth={2} style={{ color: '#FFD700' }} />
              : entry.rank === 2
                ? <Medal size={20} strokeWidth={2} style={{ color: '#C0C0C0' }} />
                : entry.rank === 3
                  ? <Medal size={20} strokeWidth={2} style={{ color: '#CD7F32' }} />
                  : null

            return (
              <div
                key={idx}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: idx < leaderboard.length - 1 ? '0.5px solid var(--ios-separator)' : 'none',
                  background: entry.is_me ? 'color-mix(in srgb, var(--accent-color) 6%, transparent)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: entry.rank <= 3
                      ? entry.rank === 1 ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                        : entry.rank === 2 ? 'linear-gradient(135deg, #C0C0C0, #A0A0A0)'
                          : 'linear-gradient(135deg, #CD7F32, #A0522D)'
                      : 'var(--ios-bg)',
                    color: entry.rank <= 3 ? 'white' : 'var(--ios-secondary-label)',
                    fontSize: 13, fontWeight: 700,
                  }}>
                    {rankIcon || entry.rank}
                  </div>

                  <div>
                    <p style={{
                      fontSize: 14, fontWeight: entry.is_me ? 700 : 500,
                      color: entry.is_me ? 'var(--accent-color)' : 'var(--ios-label)',
                    }}>
                      {entry.username} {entry.is_me && '(คุณ)'}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--ios-secondary-label)' }}>
                      ชวน {entry.total_referred} คน
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <p style={{
                    fontSize: 16, fontWeight: 700,
                    color: entry.rank <= 3 ? 'var(--ios-orange)' : 'var(--accent-color)',
                  }}>
                    ฿{entry.total_commission.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
