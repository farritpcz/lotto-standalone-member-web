/**
 * BottomNav — iOS 17 HIG Tab Bar (Lucide icons)
 * - Animated active indicator (teal dot that slides between tabs)
 * - Press effect: scale(0.95) on tap
 * - Notification badge dot support via `badges` prop
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Target, Trophy, Wallet, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  /** key ที่ใช้อ้างอิงใน badges prop */
  key: string
  icon: LucideIcon
  matchPrefixes?: string[]
}

const navItems: NavItem[] = [
  { href: '/dashboard', key: 'dashboard', label: 'หน้าหลัก', icon: Home, matchPrefixes: ['/dashboard'] },
  { href: '/lobby', key: 'lobby', label: 'แทงหวย', icon: Target, matchPrefixes: ['/lobby', '/lottery', '/yeekee'] },
  { href: '/results', key: 'results', label: 'ผลรางวัล', icon: Trophy, matchPrefixes: ['/results'] },
  { href: '/wallet', key: 'wallet', label: 'กระเป๋า', icon: Wallet, matchPrefixes: ['/wallet'] },
  { href: '/profile', key: 'profile', label: 'บัญชี', icon: User, matchPrefixes: ['/profile'] },
]

/** badges — ส่ง key ของ tab ที่ต้องการแสดง badge dot เช่น { results: true, wallet: true } */
interface BottomNavProps {
  badges?: Partial<Record<string, boolean>>
}

export default function BottomNav({ badges }: BottomNavProps) {
  const pathname = usePathname()
  const navRef = useRef<HTMLElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({})
  const [pressedIdx, setPressedIdx] = useState<number | null>(null)

  const isActive = (item: NavItem) => {
    if (item.matchPrefixes) {
      return item.matchPrefixes.some(prefix => pathname.startsWith(prefix))
    }
    return pathname === item.href
  }

  // ---- Animated indicator: คำนวณตำแหน่ง active tab ----
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const activeIdx = navItems.findIndex(isActive)
    if (activeIdx === -1) {
      setIndicatorStyle({ opacity: 0 })
      return
    }
    const items = nav.querySelectorAll<HTMLAnchorElement>('.bottom-nav-item')
    const el = items[activeIdx]
    if (!el) return
    const navRect = nav.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    setIndicatorStyle({
      left: elRect.left - navRect.left + elRect.width / 2 - 10,
      opacity: 1,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <nav ref={navRef} className="bottom-nav" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'var(--ios-card, #fff)', borderTop: '0.5px solid var(--ios-separator, #e5e5e5)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {/* ---- Sliding active indicator (teal line) ---- */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          width: 20,
          height: 3,
          borderRadius: '0 0 3px 3px',
          background: '#2dd4bf',
          transition: 'left 0.3s cubic-bezier(.4,0,.2,1), opacity 0.2s',
          pointerEvents: 'none',
          ...indicatorStyle,
        }}
      />

      {navItems.map((item, idx) => {
        const active = isActive(item)
        const Icon = item.icon
        const hasBadge = badges?.[item.key]

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            style={{
              position: 'relative',
              transform: pressedIdx === idx ? 'scale(0.95)' : 'scale(1)',
              transition: 'transform 0.12s ease',
            }}
            onTouchStart={() => setPressedIdx(idx)}
            onTouchEnd={() => setPressedIdx(null)}
            onTouchCancel={() => setPressedIdx(null)}
            onMouseDown={() => setPressedIdx(idx)}
            onMouseUp={() => setPressedIdx(null)}
            onMouseLeave={() => setPressedIdx(null)}
          >
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <Icon
                size={25}
                fill={active ? 'currentColor' : 'none'}
                strokeWidth={active ? 0 : 1.8}
              />
              {/* ---- Notification badge dot ---- */}
              {hasBadge && (
                <span
                  aria-label="มีการแจ้งเตือน"
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -4,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#FF3B30',
                    border: '1.5px solid var(--bg-primary, #0d1f1a)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </span>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
