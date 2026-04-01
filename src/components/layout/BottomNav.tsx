/**
 * BottomNav — iOS 17 HIG Tab Bar
 *
 * - rgba(249,249,249,0.94) + backdrop-filter blur
 * - 0.5px top border
 * - 83px height (iOS standard)
 * - 25px icons
 * - Active: systemGreen (#34C759) filled
 * - Inactive: #8E8E93 outline
 * - 10pt labels
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  iconPaths: React.ReactNode
  matchPrefixes?: string[]
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'หน้าหลัก',
    matchPrefixes: ['/dashboard'],
    iconPaths: (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
  },
  {
    href: '/lobby',
    label: 'แทงหวย',
    matchPrefixes: ['/lobby', '/lottery', '/yeekee'],
    iconPaths: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M16 8l-4 4-4-4" />
        <path d="M8 16l4-4 4 4" />
      </>
    ),
  },
  {
    href: '/results',
    label: 'ผลรางวัล',
    matchPrefixes: ['/results'],
    iconPaths: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </>
    ),
  },
  {
    href: '/wallet',
    label: 'กระเป๋า',
    matchPrefixes: ['/wallet'],
    iconPaths: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <circle cx="17" cy="15" r="1.5" />
      </>
    ),
  },
  {
    href: '/profile',
    label: 'บัญชี',
    matchPrefixes: ['/profile'],
    iconPaths: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
  },
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
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill={active ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={active ? 0 : 1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: 25, height: 25 }}
            >
              {item.iconPaths}
            </svg>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
