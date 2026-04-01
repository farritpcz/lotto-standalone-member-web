/**
 * AppHeader — Header bar สำหรับ member pages (แบบเจริญดี88)
 *
 * แสดง: hamburger menu + โลโก้/ชื่อเว็บ + ยอดเงิน + notification bell
 * Gradient teal background, sticky top
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth-store'
import SideMenu from './SideMenu'

export default function AppHeader() {
  const { member } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className="app-header">
        {/* Logo / Site Name */}
        <Link href="/dashboard" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold">
            L
          </div>
          <span className="text-white font-bold text-base">LOTTO</span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Balance */}
        <Link
          href="/wallet"
          className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 rounded-full px-3 py-1.5 transition no-underline"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
            <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          <span className="text-white text-xs font-bold">
            {member?.balance?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'}
          </span>
        </Link>

        {/* Notification Bell */}
        <button className="ml-2 p-1.5 rounded-full hover:bg-white/15 transition relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Hamburger Menu Button */}
        <button
          onClick={() => setMenuOpen(true)}
          className="ml-1.5 p-1.5 rounded-full hover:bg-white/15 transition"
          aria-label="เปิดเมนู"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ width: 22, height: 22 }}>
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {/* Side Menu */}
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
