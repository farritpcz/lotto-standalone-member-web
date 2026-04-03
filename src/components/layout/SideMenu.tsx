/**
 * SideMenu — Slide-in menu with staggered animations
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  const { member } = useAuthStore()
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)

  // เปิด: delay เล็กน้อยเพื่อ trigger animation
  useEffect(() => {
    if (isOpen) {
      setClosing(false)
      requestAnimationFrame(() => setVisible(true))
    }
  }, [isOpen])

  // ปิด: play close animation ก่อน unmount
  const handleClose = () => {
    setClosing(true)
    setVisible(false)
    setTimeout(() => {
      setClosing(false)
      onClose()
    }, 300)
  }

  // ปิดเมื่อกด Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ป้องกัน scroll body
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleLogout = () => {
    fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    try { localStorage.removeItem('lotto-auth') } catch {}
    window.location.href = '/login'
  }

  if (!isOpen && !closing) return null

  return (
    <>
      {/* Backdrop — blur + fade */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: visible ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
          backdropFilter: visible ? 'blur(4px)' : 'blur(0px)',
          WebkitBackdropFilter: visible ? 'blur(4px)' : 'blur(0px)',
          transition: 'all 0.3s ease',
        }}
      />

      {/* Panel — slide from right with spring */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '300px', maxWidth: '85vw', zIndex: 10001,
        background: 'var(--ios-bg, #000)',
        boxShadow: visible ? '-10px 0 40px rgba(0,0,0,0.3)' : 'none',
        display: 'flex', flexDirection: 'column',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        overflowY: 'auto',
      }}>
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(128,128,128,0.15)', border: 'none', cursor: 'pointer',
            padding: 6, borderRadius: '50%', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.2s ease 0.15s',
          }}
        >
          <X size={18} color="var(--ios-secondary-label)" />
        </button>

        {/* User Info — fade in */}
        <div style={{
          padding: '24px 20px 16px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.3s ease 0.1s',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 24,
            background: 'linear-gradient(135deg, #34C759, #30DB5B)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 12,
            boxShadow: '0 4px 12px rgba(52,199,89,0.3)',
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

          {/* Deposit / Withdraw */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Link href="/wallet?tab=deposit" onClick={handleClose} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 600,
              background: 'rgba(52,199,89,0.12)', color: 'var(--ios-green)',
              textDecoration: 'none',
            }}>
              <ArrowDownToLine size={16} /> เติมเงิน
            </Link>
            <Link href="/wallet?tab=withdraw" onClick={handleClose} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 600,
              background: 'rgba(255,59,48,0.08)', color: 'var(--ios-red)',
              textDecoration: 'none',
            }}>
              <ArrowUpFromLine size={16} /> ถอนเงิน
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--ios-separator)', margin: '0 20px' }} />

        {/* Menu Items — staggered animation */}
        <div style={{ padding: '8px 12px', flex: 1 }}>
          {menuItems.map((item, i) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleClose}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 12px', borderRadius: 12,
                  fontSize: 15, fontWeight: 500,
                  color: 'var(--ios-label)', textDecoration: 'none',
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateX(0)' : 'translateX(30px)',
                  transition: `all 0.3s cubic-bezier(0.32, 0.72, 0, 1) ${0.05 + i * 0.04}s`,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(128,128,128,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={18} strokeWidth={1.8} color="var(--ios-secondary-label)" />
                </div>
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Logout — staggered last */}
        <div style={{
          padding: '12px 12px 24px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transition: `all 0.3s ease ${0.05 + menuItems.length * 0.04}s`,
        }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '13px', borderRadius: 12,
              fontSize: 15, fontWeight: 600,
              background: 'rgba(255,59,48,0.08)', color: 'var(--ios-red)',
              border: 'none', cursor: 'pointer',
              transition: 'background 0.15s',
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
