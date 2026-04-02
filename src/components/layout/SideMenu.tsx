/**
 * SideMenu — iOS 17 HIG Sheet style (Lucide icons)
 */

'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import {
  Home, Target, Gamepad2, UserPlus, User, FileText,
  DollarSign, BookOpen, ArrowDownToLine, ArrowUpFromLine, LogOut, X
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface SideMenuProps {
  isOpen: boolean
  onClose: () => void
}

const menuItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'หน้าหลัก', icon: Home },
  { href: '/lobby', label: 'หวย', icon: Target },
  { href: '/yeekee/room', label: 'เล่นเกม', icon: Gamepad2 },
  { href: '/referral', label: 'แนะนำเพื่อน', icon: UserPlus },
  { href: '/profile', label: 'บัญชีผู้ใช้', icon: User },
  { href: '/history', label: 'ประวัติ', icon: FileText },
  { href: '/rates', label: 'อัตราจ่าย', icon: DollarSign },
  { href: '/rules', label: 'กฎกติกา', icon: BookOpen },
]

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const router = useRouter()
  const { member, logout } = useAuthStore()

  // ปิดเมื่อกด Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // ป้องกัน scroll body
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleLogout = () => {
    logout()
    onClose()
    router.push('/login')
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 998,
          background: 'rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '300px', maxWidth: '85vw', zIndex: 999,
        background: 'var(--ios-bg)',
        boxShadow: '-10px 0 40px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.25s ease',
        overflowY: 'auto',
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 6, borderRadius: 8,
          }}
        >
          <X size={22} color="var(--ios-secondary-label)" />
        </button>

        {/* User Info */}
        <div style={{ padding: '24px 20px 16px' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 24,
            background: 'var(--ios-green)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 12,
          }}>
            {(member?.username || 'U')[0].toUpperCase()}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ios-label)' }}>
            {member?.username || 'สมาชิก'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ios-secondary-label)', marginTop: 2 }}>
            เครดิตคงเหลือ
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ios-green)', marginTop: 2 }}>
            ฿{(member?.balance || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>

          {/* Deposit / Withdraw buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Link href="/wallet?tab=deposit" onClick={onClose} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 600,
              background: 'rgba(52,199,89,0.1)', color: 'var(--ios-green)',
              textDecoration: 'none',
            }}>
              <ArrowDownToLine size={16} />
              เติมเงิน
            </Link>
            <Link href="/wallet?tab=withdraw" onClick={onClose} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 600,
              background: 'rgba(255,59,48,0.08)', color: 'var(--ios-red)',
              textDecoration: 'none',
            }}>
              <ArrowUpFromLine size={16} />
              ถอนเงิน
            </Link>
          </div>
        </div>

        {/* Menu Items */}
        <div style={{ padding: '0 12px', flex: 1 }}>
          {menuItems.map(item => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 12px', borderRadius: 12,
                  fontSize: 15, fontWeight: 500,
                  color: 'var(--ios-label)', textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
              >
                <Icon size={20} strokeWidth={1.8} color="var(--ios-secondary-label)" />
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Logout */}
        <div style={{ padding: '12px 12px 24px' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '12px', borderRadius: 12,
              fontSize: 15, fontWeight: 600,
              background: 'rgba(255,59,48,0.08)', color: 'var(--ios-red)',
              border: 'none', cursor: 'pointer',
            }}
          >
            <LogOut size={18} />
            ออกจากระบบ
          </button>
        </div>
      </div>
    </>
  )
}
