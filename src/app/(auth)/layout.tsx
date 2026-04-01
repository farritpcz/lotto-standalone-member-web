/**
 * Auth Layout — ครอบ login + register pages
 *
 * ใช้ AppHeader เดียวกันกับ member pages
 * ไม่มี BottomNav (auth pages ไม่ต้องการ)
 */

import AppHeader from '@/components/layout/AppHeader'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', background: '#2a4a3a' }}>
      <AppHeader />
      {children}
    </div>
  )
}
