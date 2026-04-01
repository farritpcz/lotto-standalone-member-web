/**
 * SideMenu — iOS 17 HIG Sheet style
 *
 * - Slides in from right
 * - White/F2F2F7 background (iOS grouped)
 * - User info header: avatar circle, username, balance
 * - Deposit/withdraw buttons (systemGreen / systemRed tinted)
 * - Menu items: icon + label, iOS list style
 * - Logout: systemRed
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )},
  { href: '/lobby', label: 'หวย', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8l-4 4-4-4" />
      <path d="M8 16l4-4 4 4" />
    </svg>
  )},
  { href: '/yeekee/room', label: 'เล่นเกม', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="8" cy="12" r="2" />
      <path d="M15 9.5v0M18 12h0M15 14.5v0" />
    </svg>
  )},
  { href: '/referral', label: 'แนะนำเพื่อน', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )},
  { href: '/profile', label: 'บัญชีผู้ใช้', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )},
  { href: '/history', label: 'ประวัติ', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )},
  { href: '/rates', label: 'อัตราจ่าย', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )},
  { href: '/rules', label: 'กฎกติกา', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )},
]

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const router = useRouter()
  const { member, logout } = useAuthStore()

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
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 150,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(2px)',
          transition: 'opacity 0.25s',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      />

      {/* Sheet panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          zIndex: 160,
          height: '100%',
          width: 280,
          maxWidth: '80vw',
          background: 'var(--ios-bg)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* User Info Header */}
        <div style={{ background: 'var(--ios-card)', padding: '20px 16px 16px', borderBottom: '0.5px solid var(--ios-separator)' }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--ios-bg)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--ios-secondary-label)',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Avatar + username */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--ios-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 18,
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {member?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)' }}>
                {member?.username || 'สมาชิก'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ios-secondary-label)', marginTop: 2 }}>
                สมาชิก
              </div>
            </div>
          </div>

          {/* Balance */}
          <div style={{
            background: 'var(--ios-bg)',
            borderRadius: 12,
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}>
            <span style={{ fontSize: 13, color: 'var(--ios-secondary-label)' }}>เครดิตคงเหลือ</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ios-label)' }}>
              ฿{member?.balance?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'}
            </span>
          </div>

          {/* Deposit / Withdraw buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Link
              href="/wallet"
              onClick={onClose}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 8px',
                borderRadius: 10,
                background: 'rgba(52,199,89,0.12)',
                color: 'var(--ios-green-dark)',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                minHeight: 40,
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              เติมเงิน
            </Link>
            <Link
              href="/wallet"
              onClick={onClose}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 8px',
                borderRadius: 10,
                background: 'rgba(255,59,48,0.10)',
                color: 'var(--ios-red)',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                minHeight: 40,
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              ถอนเงิน
            </Link>
          </div>
        </div>

        {/* Menu Items — iOS list style */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 8 }}>
          <div style={{ background: 'var(--ios-card)', borderRadius: 12, margin: '0 12px', overflow: 'hidden' }}>
            {menuItems.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 16px',
                  textDecoration: 'none',
                  color: 'var(--ios-label)',
                  borderBottom: i < menuItems.length - 1 ? '0.5px solid var(--ios-separator)' : 'none',
                  fontSize: 15,
                  fontWeight: 400,
                }}
              >
                <span style={{ color: 'var(--ios-green)', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14, color: 'var(--ios-tertiary-label)' }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
          </div>

          {/* Logout */}
          <div style={{ background: 'var(--ios-card)', borderRadius: 12, margin: '8px 12px', overflow: 'hidden' }}>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '13px 16px',
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ios-red)',
                fontSize: 15,
                fontWeight: 400,
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
