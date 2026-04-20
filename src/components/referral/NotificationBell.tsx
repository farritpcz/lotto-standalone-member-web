// Component: NotificationBell — bell icon + unread badge + dropdown panel
// Parent: src/app/(member)/referral/page.tsx

import { useEffect, useRef } from 'react'
import { Bell, X } from 'lucide-react'
import Loading from '@/components/Loading'
import type { ReferralNotification } from '@/lib/api'

export interface NotificationBellProps {
  unreadCount: number
  show: boolean
  onToggle: () => void
  onClose: () => void
  notifLoading: boolean
  notifications: ReferralNotification[]
}

export function NotificationBell({
  unreadCount, show, onToggle, onClose, notifLoading, notifications,
}: NotificationBellProps) {
  const ref = useRef<HTMLDivElement>(null)

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (show) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [show, onClose])

  return (
    <div ref={ref} style={{ position: 'absolute', right: 16 }}>
      <button
        onClick={onToggle}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          position: 'relative', padding: 4,
          color: 'var(--ios-label)',
        }}
      >
        <Bell size={22} strokeWidth={2} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: 'var(--ios-red)', color: 'white',
            fontSize: 10, fontWeight: 700,
            minWidth: 16, height: 16, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', lineHeight: 1,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {show && (
        <div style={{
          position: 'absolute', right: 0, top: 36, width: 300,
          background: 'var(--ios-card)', borderRadius: 14,
          boxShadow: '0 8px 30px rgba(0,0,0,0.25)', zIndex: 100,
          maxHeight: 400, overflowY: 'auto',
          border: '0.5px solid var(--ios-separator)',
        }}>
          <div style={{
            padding: '12px 14px', borderBottom: '0.5px solid var(--ios-separator)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ios-label)' }}>แจ้งเตือน</span>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ios-secondary-label)', padding: 0 }}
            >
              <X size={18} />
            </button>
          </div>

          {notifLoading ? (
            <div style={{ padding: 30 }}><Loading inline /></div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: '30px 16px', textAlign: 'center' }}>
              <Bell size={32} strokeWidth={1.5} style={{ color: 'var(--ios-tertiary-label)', marginBottom: 6 }} />
              <p style={{ fontSize: 13, color: 'var(--ios-secondary-label)' }}>ยังไม่มีแจ้งเตือน</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '10px 14px',
                  borderBottom: '0.5px solid var(--ios-separator)',
                  background: n.is_read ? 'transparent' : 'color-mix(in srgb, var(--accent-color) 4%, transparent)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  {!n.is_read && (
                    <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--accent-color)', flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label)' }}>{n.title}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--ios-secondary-label)', lineHeight: 1.5, margin: 0 }}>
                  {n.message}
                </p>
                <p style={{ fontSize: 11, color: 'var(--ios-tertiary-label)', marginTop: 4, margin: 0 }}>
                  {new Date(n.created_at).toLocaleString('th-TH')}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
