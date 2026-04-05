/**
 * Member Layout — App Shell สำหรับหน้า member ทั้งหมด
 *
 * โครงสร้าง:
 * ┌─────────────────────┐
 * │ AppHeader (sticky)  │  ← header teal gradient
 * ├─────────────────────┤
 * │                     │
 * │   Page Content      │  ← scroll area
 * │                     │
 * ├─────────────────────┤
 * │ BottomNav (fixed)   │  ← 5 tabs
 * └─────────────────────┘
 *
 * - max-width 480px (mobile-first)
 * - safe area insets for notch devices
 */

import AppHeader from '@/components/layout/AppHeader'
import BottomNav from '@/components/layout/BottomNav'
import FloatingContact from '@/components/FloatingContact'
import AuthGuard from '@/components/AuthGuard'
import NotificationPoller from '@/components/NotificationPoller'

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="app-outer">
        <div className="app-container">
          <AppHeader />
          <NotificationPoller />
          <main className="app-content">
            {children}
          </main>
          <FloatingContact />
          <BottomNav />
        </div>
      </div>
    </AuthGuard>
  )
}
