/**
 * Auth Layout — ครอบ login + register pages
 * ใช้ .app-outer + .app-container ร่วมกับ member layout (globals.css)
 * เพิ่ม AppHeader + PageTransition + FloatingContact
 */

'use client'

import AppHeader from '@/components/layout/AppHeader'
import FloatingContact from '@/components/FloatingContact'
import PageTransition from '@/components/PageTransition'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-outer">
      <div className="app-container">
        <AppHeader />
        <PageTransition>
          {children}
        </PageTransition>
        <FloatingContact bottom={24} />
      </div>
    </div>
  )
}
