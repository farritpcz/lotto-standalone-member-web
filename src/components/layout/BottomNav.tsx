/**
 * BottomNav — เมนูล่าง 5 tabs
 * ⭐ ใช้ inline styles ทั้งหมด (ไม่พึ่ง CSS class — ป้องกัน override issues)
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Target, Trophy, Wallet, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const tabs: { href: string; label: string; icon: LucideIcon; match: string[] }[] = [
  { href: '/dashboard', label: 'หน้าหลัก', icon: Home, match: ['/dashboard'] },
  { href: '/lobby', label: 'แทงหวย', icon: Target, match: ['/lobby', '/lottery', '/yeekee'] },
  { href: '/results', label: 'ผลรางวัล', icon: Trophy, match: ['/results'] },
  { href: '/wallet', label: 'กระเป๋า', icon: Wallet, match: ['/wallet'] },
  { href: '/profile', label: 'บัญชี', icon: User, match: ['/profile'] },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      maxWidth: 480,
      margin: '0 auto',
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      background: '#111827',
      borderTop: '1px solid #374151',
      zIndex: 9999,
      boxShadow: '0 -2px 10px rgba(0,0,0,0.3)',
    }}>
      {tabs.map((tab) => {
        const active = tab.match.some(p => pathname.startsWith(p))
        const Icon = tab.icon
        const color = active ? '#34C759' : '#8E8E93'

        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              flex: 1,
              height: '100%',
              textDecoration: 'none',
              color,
            }}
          >
            <Icon size={20} fill={active ? color : 'none'} strokeWidth={active ? 0 : 1.8} />
            <span style={{ fontSize: 10, fontWeight: 600, lineHeight: 1 }}>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
