/**
 * AppHeader — Unified Navbar สำหรับทุกหน้า
 *
 * ใช้ทั้งหน้า auth (login, register) และ member pages
 * แยกพฤติกรรมตาม isAuthenticated:
 *
 *  ยังไม่ login:
 *   [ L LOTTO .............. เข้าสู่ระบบ | ≡ ]
 *
 *  Login แล้ว:
 *   [ ฿xxx.xx ...... LOTTO ...... 🔔 | ≡ ]
 *
 * ความสัมพันธ์:
 * - อ่าน state จาก useAuthStore (Zustand) — member-web เท่านั้น
 * - provider-game-web (#8) จะมี AppHeader คล้ายกัน แต่มี operator info เพิ่ม
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth-store'
import SideMenu from './SideMenu'

// สีหลักของ header (dark teal — เหมือนกันทุกหน้า)
const HEADER_BG = '#1a3d35'

export default function AppHeader() {
  const { member, isAuthenticated, updateBalance } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  // รีเฟรชเครดิตจาก API
  const handleRefreshBalance = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const { walletApi } = await import('@/lib/api')
      const res = await walletApi.getBalance()
      updateBalance(res.data.data?.balance || 0)
    } catch { /* ignore */ }
  }

  return (
    <>
      <header style={{
        background: HEADER_BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        height: 56,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        // ไม่ใช้ frosted glass เพราะต้องทำงานบน background หลายสี
      }}>

        {/* ── Left side ─────────────────────────────────────────────────────── */}
        {isAuthenticated ? (
          // Login แล้ว → แสดงยอดเงิน (คลิกไปหน้ากระเป๋า)
          <Link
            href="/wallet"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(52,199,89,0.18)',
              border: '1px solid rgba(52,199,89,0.3)',
              borderRadius: 20,
              padding: '5px 12px',
              textDecoration: 'none',
              minHeight: 32,
            }}
          >
            {/* Wallet icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth={2} strokeLinecap="round" style={{ width: 14, height: 14 }}>
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
              <circle cx="17" cy="15" r="1.5" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#34C759' }}>
              ฿{member?.balance?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'}
            </span>
            {/* ปุ่มรีเฟรช */}
            <button
              onClick={handleRefreshBalance}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 2, display: 'flex', marginLeft: 2,
              }}
              aria-label="รีเฟรชเครดิต"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth={2.5} strokeLinecap="round" style={{ width: 13, height: 13 }}>
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </Link>
        ) : (
          // ยังไม่ login → แสดงปุ่มเข้าสู่ระบบ
          <Link
            href="/login"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 20,
              padding: '5px 14px',
              textDecoration: 'none',
              minHeight: 32,
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} style={{ width: 14, height: 14 }}>
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>เข้าสู่ระบบ</span>
          </Link>
        )}

        {/* ── Center — Brand ─────────────────────────────────────────────────── */}
        <Link
          href={isAuthenticated ? '/dashboard' : '/login'}
          style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 8,
            textDecoration: 'none',
          }}
        >
          {/* L logo box */}
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: '#34C759',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, color: 'white', fontSize: 15,
          }}>L</div>
          <span style={{ color: '#f0c060', fontWeight: 800, fontSize: 18, letterSpacing: 0.5 }}>
            LOTTO
          </span>
        </Link>

        {/* ── Right side ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

          {/* Notification bell — แสดงเฉพาะเมื่อ login แล้ว */}
          {isAuthenticated && (
            <button
              style={{
                width: 36, height: 36,
                background: 'transparent', border: 'none', cursor: 'pointer',
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 18,
              }}
              aria-label="การแจ้งเตือน"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={1.8} strokeLinecap="round" style={{ width: 22, height: 22 }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {/* Red dot */}
              <span style={{
                position: 'absolute', top: 7, right: 7,
                width: 7, height: 7,
                background: '#FF3B30',
                borderRadius: '50%',
                border: '1.5px solid #1a3d35',
              }} />
            </button>
          )}

          {/* Hamburger menu */}
          <button
            onClick={() => setMenuOpen(true)}
            style={{
              width: 36, height: 36,
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 18,
            }}
            aria-label="เปิดเมนู"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={2.5} strokeLinecap="round" style={{ width: 22, height: 22 }}>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* Side menu (ใช้ร่วมทั้ง auth + member) */}
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
