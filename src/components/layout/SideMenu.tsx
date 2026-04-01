/**
 * SideMenu — เมนูเบอร์เกอร์ slide-in จากขวา (แบบเจริญดี88)
 *
 * แสดง:
 * 1. ข้อมูลผู้ใช้ + เครดิต + เชิญเพื่อน
 * 2. ปุ่มเติมเงิน / ถอนเงิน
 * 3. เมนูรายการ (หน้าหลัก, หวย, เล่นเกม, แนะนำเพื่อน, บัญชีผู้ใช้, ประวัติ, เปลี่ยนรหัสผ่าน, ออกจากระบบ)
 */

'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'

interface SideMenuProps {
  isOpen: boolean
  onClose: () => void
}

const menuItems = [
  { href: '/dashboard', label: 'หน้าหลัก', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )},
  { href: '/lobby', label: 'หวย', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8l-4 4-4-4" />
      <path d="M8 16l4-4 4 4" />
    </svg>
  ), hasSubmenu: true },
  { href: '/yeekee/room', label: 'เล่นเกม', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="8" cy="12" r="2" />
      <path d="M15 9.5v0M18 12h0M15 14.5v0" />
    </svg>
  )},
  { href: '/referral', label: 'แนะนำเพื่อน', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )},
  { href: '/profile', label: 'บัญชีผู้ใช้', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )},
  { href: '/history', label: 'ประวัติ', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )},
  { href: '/rates', label: 'อัตราจ่าย', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )},
  { href: '/rules', label: 'กฎกติกา', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )},
]

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const router = useRouter()
  const { member, logout } = useAuthStore()

  // ปิด scroll เมื่อเปิดเมนู
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleLogout = () => {
    logout()
    onClose()
    router.push('/login')
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: 'var(--color-bg-overlay)' }}
        onClick={onClose}
      />

      {/* Slide-in Panel จากขวา */}
      <div
        className={`fixed top-0 right-0 z-[70] h-full w-72 max-w-[80vw] transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ background: 'var(--color-bg-card)' }}
      >
        {/* User Info Header */}
        <div className="p-4" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)' }}>
          {/* ปุ่มปิด */}
          <button onClick={onClose} className="absolute top-3 right-3 text-white/60 hover:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
              {member?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="text-white text-sm font-semibold">
              ผู้ใช้ : {member?.username || '-'}
            </div>
          </div>

          <div className="flex items-center justify-between text-white/80 text-xs mb-1">
            <span>เครดิตคงเหลือ :</span>
            <span className="font-bold text-white">฿ {member?.balance?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'}</span>
          </div>

          {/* ปุ่มเติมเงิน / ถอนเงิน */}
          <div className="flex gap-2 mt-3">
            <Link
              href="/wallet"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-white text-xs font-bold no-underline transition active:opacity-80"
              style={{ background: 'var(--color-green)' }}
            >
              <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px]">+</span>
              เติมเงิน
            </Link>
            <Link
              href="/wallet"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-white text-xs font-bold no-underline transition active:opacity-80"
              style={{ background: 'var(--color-red)' }}
            >
              <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px]">−</span>
              ถอนเงิน
            </Link>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium hover:bg-gray-50 transition no-underline"
              style={{ color: 'var(--color-text)' }}
            >
              <span className="text-muted">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.hasSubmenu && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-muted">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              )}
            </Link>
          ))}

          {/* Divider */}
          <div className="my-2 mx-4 border-t border-gray-100" />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium w-full text-left hover:bg-red-50 transition"
            style={{ color: 'var(--color-red)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </>
  )
}
