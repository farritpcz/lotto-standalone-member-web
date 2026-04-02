/**
 * NotificationCenter — Slide-in panel แจ้งเตือน
 *
 * Features:
 * - Slide-in จากขวา (width 320px, full height)
 * - Dark overlay ด้านหลัง
 * - รายการแจ้งเตือน: icon + title + time ago + unread dot
 * - Mark all as read
 * - Close on overlay click หรือ X button
 *
 * ใช้โดย: AppHeader.tsx (bell icon)
 */

'use client'

import { useState, useEffect } from 'react'
import {
  X, Trophy, Wallet, PartyPopper, Bell, CheckCheck,
  Gift, ShieldCheck, Info
} from 'lucide-react'

interface Notification {
  id: string
  icon: 'trophy' | 'wallet' | 'welcome' | 'gift' | 'security' | 'info'
  title: string
  timeAgo: string
  read: boolean
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

/** Mock notifications — ในอนาคตดึงจาก API */
const initialNotifications: Notification[] = [
  {
    id: '1',
    icon: 'trophy',
    title: 'ผลรางวัลยี่กีรอบ 27 ออกแล้ว',
    timeAgo: '2 นาทีที่แล้ว',
    read: false,
  },
  {
    id: '2',
    icon: 'wallet',
    title: 'ฝากเงิน ฿500 สำเร็จ',
    timeAgo: '1 ชั่วโมงที่แล้ว',
    read: false,
  },
  {
    id: '3',
    icon: 'welcome',
    title: 'ยินดีต้อนรับสมาชิกใหม่!',
    timeAgo: '1 วันที่แล้ว',
    read: false,
  },
  {
    id: '4',
    icon: 'gift',
    title: 'รับโบนัสต้อนรับ ฿100 แล้ว',
    timeAgo: '1 วันที่แล้ว',
    read: true,
  },
  {
    id: '5',
    icon: 'security',
    title: 'เข้าสู่ระบบจากอุปกรณ์ใหม่',
    timeAgo: '2 วันที่แล้ว',
    read: true,
  },
]

const iconMap = {
  trophy: Trophy,
  wallet: Wallet,
  welcome: PartyPopper,
  gift: Gift,
  security: ShieldCheck,
  info: Info,
}

const iconColorMap = {
  trophy: { bg: 'rgba(255,159,10,0.12)', color: '#FF9F0A' },
  wallet: { bg: 'rgba(52,199,89,0.12)', color: '#34C759' },
  welcome: { bg: 'rgba(90,200,250,0.12)', color: '#5AC8FA' },
  gift: { bg: 'rgba(175,82,222,0.12)', color: '#AF52DE' },
  security: { bg: 'rgba(0,122,255,0.12)', color: '#007AFF' },
  info: { bg: 'rgba(142,142,147,0.12)', color: '#8E8E93' },
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)

  // ป้องกัน scroll body
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // ปิดเมื่อกด Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.4)',
          animation: 'notif-fadeIn 0.2s ease',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 320,
        maxWidth: '90vw',
        zIndex: 1001,
        background: 'var(--ios-bg)',
        boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'notif-slideIn 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 16px 12px',
          borderBottom: '0.5px solid var(--ios-separator)',
          position: 'sticky',
          top: 0,
          background: 'var(--ios-bg)',
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={20} strokeWidth={2} style={{ color: 'var(--ios-label)' }} />
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ios-label)' }}>
              การแจ้งเตือน
            </span>
            {unreadCount > 0 && (
              <span style={{
                background: '#FF3B30',
                color: 'white',
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 10,
                padding: '1px 7px',
                minWidth: 18,
                textAlign: 'center',
              }}>
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="ปิดการแจ้งเตือน"
          >
            <X size={22} color="var(--ios-secondary-label)" />
          </button>
        </div>

        {/* Mark all as read */}
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: '0.5px solid var(--ios-separator)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--ios-green)',
              width: '100%',
            }}
          >
            <CheckCheck size={16} />
            อ่านทั้งหมดแล้ว
          </button>
        )}

        {/* Notification list */}
        <div style={{ flex: 1, padding: '4px 0' }}>
          {notifications.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 16px',
              color: 'var(--ios-secondary-label)',
            }}>
              <Bell size={36} strokeWidth={1.2} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ fontSize: 15 }}>ไม่มีการแจ้งเตือน</p>
            </div>
          ) : (
            notifications.map(notif => {
              const IconComponent = iconMap[notif.icon] || Info
              const iconStyle = iconColorMap[notif.icon] || iconColorMap.info

              return (
                <div
                  key={notif.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom: '0.5px solid var(--ios-separator)',
                    background: notif.read ? 'transparent' : 'rgba(52,199,89,0.04)',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: iconStyle.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <IconComponent size={18} color={iconStyle.color} strokeWidth={2} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 14,
                      fontWeight: notif.read ? 400 : 600,
                      color: 'var(--ios-label)',
                      margin: 0,
                      marginBottom: 3,
                      lineHeight: 1.4,
                    }}>
                      {notif.title}
                    </p>
                    <p style={{
                      fontSize: 12,
                      color: 'var(--ios-secondary-label)',
                      margin: 0,
                    }}>
                      {notif.timeAgo}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.read && (
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#007AFF',
                      flexShrink: 0,
                      marginTop: 6,
                    }} />
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes notif-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes notif-slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
