/**
 * BottomNav — iOS 17 HIG Tab Bar (ใช้ Lucide icons)
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Target, Trophy, Wallet, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  matchPrefixes?: string[]
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'หน้าหลัก', icon: Home, matchPrefixes: ['/dashboard'] },
  { href: '/lobby', label: 'แทงหวย', icon: Target, matchPrefixes: ['/lobby', '/lottery', '/yeekee'] },
  { href: '/results', label: 'ผลรางวัล', icon: Trophy, matchPrefixes: ['/results'] },
  { href: '/wallet', label: 'กระเป๋า', icon: Wallet, matchPrefixes: ['/wallet'] },
  { href: '/profile', label: 'บัญชี', icon: User, matchPrefixes: ['/profile'] },
]

export default function BottomNav() {
  const pathname = usePathname()

  const isActive = (item: NavItem) => {
    if (item.matchPrefixes) {
      return item.matchPrefixes.some(prefix => pathname.startsWith(prefix))
    }
    return pathname === item.href
  }

  return (
    <nav className="bottom-nav">
      {navItems.map(item => {
        const active = isActive(item)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
          >
            <Icon
              size={25}
              fill={active ? 'currentColor' : 'none'}
              strokeWidth={active ? 0 : 1.8}
            />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
