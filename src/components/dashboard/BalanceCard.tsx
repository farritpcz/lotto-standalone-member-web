/**
 * BalanceCard — dark forest gradient card + balance + ฝาก/ถอน buttons
 *
 * Rule: UI-only; parent ส่ง member + refreshing state
 * Related: app/(member)/dashboard/page.tsx
 */
'use client'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'

interface Props {
  username?: string
  balance?: number
  refreshing: boolean
  onRefresh: () => void
}

export default function BalanceCard({ username, balance, refreshing, onRefresh }: Props) {
  return (
    <div className="ios-animate ios-animate-1" style={{ padding: '16px 16px 8px' }}>
      <div className="balance-card" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Top row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 2 }}>สวัสดี</p>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 17 }}>
              {username || 'สมาชิก'}
            </p>
          </div>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: '2px solid color-mix(in srgb, var(--accent-color) 40%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-color)',
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            {username?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>

        {/* Balance + Refresh */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginBottom: 6 }}>
            ยอดเงินคงเหลือ
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <p
              style={{
                color: 'var(--accent-color)',
                fontSize: 34,
                fontWeight: 700,
                letterSpacing: -0.5,
                lineHeight: 1,
                margin: 0,
              }}
            >
              ฿{balance?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'}
            </p>
            <button
              onClick={onRefresh}
              disabled={refreshing}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20,
                width: 32,
                height: 32,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 18,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Link
            href="/wallet"
            style={{
              flex: 1,
              textAlign: 'center',
              background:
                'linear-gradient(180deg, var(--accent-color) 0%, color-mix(in srgb, var(--accent-color) 82%, black) 100%)',
              color: '#1a1a1a',
              padding: '11px 8px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px color-mix(in srgb, var(--accent-color) 30%, transparent)',
            }}
          >
            ฝากเงิน
          </Link>
          <Link
            href="/wallet?tab=withdraw"
            style={{
              flex: 1,
              textAlign: 'center',
              background:
                'linear-gradient(180deg, color-mix(in srgb, var(--header-bg) 85%, white) 0%, var(--header-bg) 100%)',
              color: 'white',
              padding: '11px 8px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px color-mix(in srgb, var(--header-bg) 35%, transparent)',
            }}
          >
            ถอนเงิน
          </Link>
        </div>
      </div>
    </div>
  )
}
