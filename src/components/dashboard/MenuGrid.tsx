/**
 * MenuGrid — เมนู 4×2 วงกลม (แทงหวย/ผลรางวัล/โพย/ยี่กี/เติม/ถอน/แนะนำ/บัญชี)
 *
 * Rule: UI-only; ใช้ CSS variable ของ agent theme
 * Related: app/(member)/dashboard/page.tsx
 */
'use client'
import Link from 'next/link'
import {
  Ticket,
  Trophy,
  ClipboardList,
  Target,
  Wallet,
  ArrowDownToLine,
  Gift,
  User,
} from 'lucide-react'

type GroupKey = 'primary' | 'deposit' | 'withdraw' | 'other'

interface MenuItem {
  href: string
  icon: React.ReactNode
  label: string
  group: GroupKey
  glow?: boolean
}

const ITEMS: MenuItem[] = [
  // กลุ่ม "เล่นหวย"
  { href: '/lobby', icon: <Ticket size={22} strokeWidth={1.8} />, label: 'แทงหวย', group: 'primary', glow: true },
  { href: '/results', icon: <Trophy size={22} strokeWidth={1.8} />, label: 'ผลรางวัล', group: 'primary' },
  { href: '/history', icon: <ClipboardList size={22} strokeWidth={1.8} />, label: 'โพยหวย', group: 'primary' },
  { href: '/yeekee/room', icon: <Target size={22} strokeWidth={1.8} />, label: 'ยี่กี', group: 'primary' },
  // กลุ่ม "กระเป๋าเงิน"
  { href: '/wallet', icon: <Wallet size={22} strokeWidth={1.8} />, label: 'เติมเงิน', group: 'deposit' },
  { href: '/wallet?tab=withdraw', icon: <ArrowDownToLine size={22} strokeWidth={1.8} />, label: 'ถอนเงิน', group: 'withdraw' },
  // กลุ่ม "อื่นๆ"
  { href: '/referral', icon: <Gift size={22} strokeWidth={1.8} />, label: 'แนะนำเพื่อน', group: 'other' },
  { href: '/profile', icon: <User size={22} strokeWidth={1.8} />, label: 'บัญชี', group: 'other' },
]

const GROUP_STYLES: Record<
  GroupKey,
  { bg: string; border: string; color: string; shadow: string; isGradient?: boolean }
> = {
  primary: {
    bg: 'color-mix(in srgb, var(--accent-color) 12%, transparent)',
    border: 'color-mix(in srgb, var(--accent-color) 25%, transparent)',
    color: 'var(--accent-color)',
    shadow: 'color-mix(in srgb, var(--accent-color) 15%, transparent)',
  },
  deposit: {
    bg: 'linear-gradient(180deg, var(--accent-color), color-mix(in srgb, var(--accent-color) 82%, black))',
    border: 'transparent',
    color: '#1a1a1a',
    shadow: 'color-mix(in srgb, var(--accent-color) 30%, transparent)',
    isGradient: true,
  },
  withdraw: {
    bg: 'linear-gradient(180deg, color-mix(in srgb, var(--header-bg) 85%, white), var(--header-bg))',
    border: 'transparent',
    color: 'white',
    shadow: 'color-mix(in srgb, var(--header-bg) 35%, transparent)',
    isGradient: true,
  },
  other: {
    bg: 'color-mix(in srgb, var(--accent-color) 8%, transparent)',
    border: 'color-mix(in srgb, var(--accent-color) 15%, transparent)',
    color: 'color-mix(in srgb, var(--accent-color) 70%, var(--ios-secondary-label))',
    shadow: 'transparent',
  },
}

export default function MenuGrid() {
  return (
    <div
      className="ios-animate ios-animate-2"
      style={{
        padding: '12px 16px 8px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
      }}
    >
      {ITEMS.map((item, i) => {
        const gs = GROUP_STYLES[item.group]
        return (
          <Link
            key={i}
            href={item.href}
            style={{
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                background: gs.bg,
                border: gs.isGradient ? 'none' : `1.5px solid ${gs.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: gs.color,
                boxShadow: item.glow ? `0 4px 14px ${gs.shadow}` : 'none',
                transition: 'transform 0.15s, box-shadow 0.2s',
              }}
            >
              {item.icon}
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--ios-secondary-label)',
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
