/**
 * AppHeader — Unified Navbar (Lucide icons)
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth-store'
import SideMenu from './SideMenu'
import { Wallet, RefreshCw, LogIn, Bell, Menu } from 'lucide-react'

const HEADER_BG = '#1a3d35'

export default function AppHeader() {
  const { member, isAuthenticated, updateBalance } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

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
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', height: 56,
        position: 'sticky', top: 0, zIndex: 100,
      }}>

        {/* Left side */}
        {isAuthenticated ? (
          <Link href="/wallet" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(52,199,89,0.18)', border: '1px solid rgba(52,199,89,0.3)',
            borderRadius: 20, padding: '5px 12px', textDecoration: 'none', minHeight: 32,
          }}>
            <Wallet size={14} stroke="#34C759" strokeWidth={2} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#34C759' }}>
              ฿{member?.balance?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'}
            </span>
            <button onClick={handleRefreshBalance} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', marginLeft: 2,
            }} aria-label="รีเฟรชเครดิต">
              <RefreshCw size={13} stroke="#34C759" strokeWidth={2.5} />
            </button>
          </Link>
        ) : (
          <Link href="/login" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 20, padding: '5px 14px', textDecoration: 'none', minHeight: 32,
          }}>
            <LogIn size={14} stroke="white" strokeWidth={2.5} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>เข้าสู่ระบบ</span>
          </Link>
        )}

        {/* Center — Brand */}
        <Link href={isAuthenticated ? '/dashboard' : '/login'} style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: '#34C759',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, color: 'white', fontSize: 15,
          }}>L</div>
          <span style={{ color: '#f0c060', fontWeight: 800, fontSize: 18, letterSpacing: 0.5 }}>LOTTO</span>
        </Link>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isAuthenticated && (
            <button style={{
              width: 36, height: 36, background: 'transparent', border: 'none',
              cursor: 'pointer', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 18,
            }} aria-label="การแจ้งเตือน">
              <Bell size={22} stroke="rgba(255,255,255,0.8)" strokeWidth={1.8} />
              <span style={{
                position: 'absolute', top: 7, right: 7, width: 7, height: 7,
                background: '#FF3B30', borderRadius: '50%', border: '1.5px solid #1a3d35',
              }} />
            </button>
          )}
          <button onClick={() => setMenuOpen(true)} style={{
            width: 36, height: 36, background: 'transparent', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 18,
          }} aria-label="เปิดเมนู">
            <Menu size={22} stroke="rgba(255,255,255,0.9)" strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
