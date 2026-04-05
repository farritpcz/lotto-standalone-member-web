/**
 * =============================================================================
 * NotificationCenter — Slide-in panel แจ้งเตือน (ดึงจาก API จริง)
 * =============================================================================
 *
 * Features:
 * - Slide-in จากขวา (width 320px, full height)
 * - Dark overlay ด้านหลัง
 * - ดึง notification จาก API ผ่าน Zustand store
 * - Mark as read (click notification) / Mark all as read
 * - Close on overlay click, X button, หรือ Escape key
 * - Loading skeleton ระหว่างโหลด
 * - Time ago format (ไทย)
 *
 * ใช้โดย: AppHeader.tsx (bell icon onClick → toggle)
 * Store: useNotificationStore (notification-store.ts)
 * =============================================================================
 */

'use client'

import { useEffect } from 'react'
import {
  X, Trophy, Wallet, Bell, CheckCheck,
  Gift, Percent, Info
} from 'lucide-react'
import { useNotificationStore } from '@/store/notification-store'

// =============================================================================
// Icon mapping — ชื่อ icon จาก API → Lucide component
// =============================================================================
const iconMap: Record<string, typeof Bell> = {
  trophy: Trophy,
  wallet: Wallet,
  gift: Gift,
  percent: Percent,
  bell: Bell,
  info: Info,
}

// สีสำหรับแต่ละ icon type
const iconColorMap: Record<string, { bg: string; color: string }> = {
  trophy:  { bg: 'rgba(255,159,10,0.12)', color: '#FF9F0A' },
  wallet:  { bg: 'rgba(52,199,89,0.12)',  color: '#34C759' },
  gift:    { bg: 'rgba(175,82,222,0.12)', color: '#AF52DE' },
  percent: { bg: 'rgba(0,122,255,0.12)',  color: '#007AFF' },
  bell:    { bg: 'rgba(142,142,147,0.12)', color: '#8E8E93' },
  info:    { bg: 'rgba(142,142,147,0.12)', color: '#8E8E93' },
}

// =============================================================================
// Time ago — แปลง ISO date → "2 นาทีที่แล้ว", "1 ชั่วโมงที่แล้ว" ฯลฯ
// =============================================================================
function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffSec = Math.floor((now - then) / 1000)

  if (diffSec < 60) return 'เมื่อสักครู่'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} นาทีที่แล้ว`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ชั่วโมงที่แล้ว`
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} วันที่แล้ว`
  return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

// =============================================================================
// Component
// =============================================================================

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  // ดึง state จาก Zustand store
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotificationStore()

  // ป้องกัน scroll body เมื่อ panel เปิด
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

  if (!isOpen) return null

  return (
    <>
      {/* ─── Backdrop overlay ───────────────────────────────────── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.4)',
          animation: 'notif-fadeIn 0.2s ease',
        }}
      />

      {/* ─── Panel ──────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 320, maxWidth: '90vw', zIndex: 1001,
        background: 'var(--ios-bg)',
        boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
        animation: 'notif-slideIn 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        overflowY: 'auto',
      }}>
        {/* ─── Header ─────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 16px 12px',
          borderBottom: '0.5px solid var(--ios-separator)',
          position: 'sticky', top: 0,
          background: 'var(--ios-bg)', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={20} strokeWidth={2} style={{ color: 'var(--ios-label)' }} />
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ios-label)' }}>
              การแจ้งเตือน
            </span>
            {unreadCount > 0 && (
              <span style={{
                background: '#FF3B30', color: 'white',
                fontSize: 11, fontWeight: 700, borderRadius: 10,
                padding: '1px 7px', minWidth: 18, textAlign: 'center',
              }}>
                {unreadCount}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 4, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} aria-label="ปิดการแจ้งเตือน">
            <X size={22} color="var(--ios-secondary-label)" />
          </button>
        </div>

        {/* ─── Mark all as read button ────────────────────────── */}
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 16px', background: 'none', border: 'none',
            borderBottom: '0.5px solid var(--ios-separator)',
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            color: 'var(--ios-green)', width: '100%',
          }}>
            <CheckCheck size={16} />
            อ่านทั้งหมดแล้ว
          </button>
        )}

        {/* ─── Notification list ──────────────────────────────── */}
        <div style={{ flex: 1, padding: '4px 0' }}>
          {/* Loading skeleton */}
          {loading && notifications.length === 0 ? (
            <div style={{ padding: 16 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  display: 'flex', gap: 12, padding: '12px 0',
                  borderBottom: '0.5px solid var(--ios-separator)',
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--ios-fill)', animation: 'notif-pulse 1.5s infinite' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ width: '80%', height: 14, borderRadius: 4, background: 'var(--ios-fill)', marginBottom: 6, animation: 'notif-pulse 1.5s infinite' }} />
                    <div style={{ width: '40%', height: 12, borderRadius: 4, background: 'var(--ios-fill)', animation: 'notif-pulse 1.5s infinite' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            /* Empty state */
            <div style={{
              textAlign: 'center', padding: '48px 16px',
              color: 'var(--ios-secondary-label)',
            }}>
              <Bell size={36} strokeWidth={1.2} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ fontSize: 15 }}>ไม่มีการแจ้งเตือน</p>
            </div>
          ) : (
            /* Notification items */
            notifications.map(notif => {
              const iconName = notif.icon || 'bell'
              const IconComponent = iconMap[iconName] || Info
              const iconStyle = iconColorMap[iconName] || iconColorMap.bell

              return (
                <div
                  key={notif.id}
                  onClick={() => { if (!notif.is_read) markAsRead(notif.id) }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 16px',
                    borderBottom: '0.5px solid var(--ios-separator)',
                    background: notif.is_read ? 'transparent' : 'rgba(52,199,89,0.04)',
                    cursor: notif.is_read ? 'default' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: iconStyle.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <IconComponent size={18} color={iconStyle.color} strokeWidth={2} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 14, fontWeight: notif.is_read ? 400 : 600,
                      color: 'var(--ios-label)', margin: 0, marginBottom: 2, lineHeight: 1.4,
                    }}>
                      {notif.title}
                    </p>
                    {/* ข้อความรายละเอียด (ถ้ามีและไม่ซ้ำกับ title) */}
                    {notif.message && notif.message !== notif.title && (
                      <p style={{
                        fontSize: 12, color: 'var(--ios-secondary-label)',
                        margin: 0, marginBottom: 2, lineHeight: 1.3,
                      }}>
                        {notif.message}
                      </p>
                    )}
                    <p style={{
                      fontSize: 11, color: 'var(--ios-tertiary-label)',
                      margin: 0,
                    }}>
                      {timeAgo(notif.created_at)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.is_read && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#007AFF', flexShrink: 0, marginTop: 6,
                    }} />
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ─── Animations ─────────────────────────────────────────── */}
      <style>{`
        @keyframes notif-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes notif-slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes notif-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </>
  )
}
