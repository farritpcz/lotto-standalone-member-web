/**
 * NotificationPoller — เริ่ม polling unread count ทุก 30 วินาที
 *
 * ต้องเป็น client component เพราะใช้ useEffect
 * วางใน (member)/layout.tsx — เริ่ม polling เมื่อ member layout mount
 * หยุด polling เมื่อ unmount (logout / ออกจากหน้า member)
 *
 * ไม่ render อะไรเลย (return null) — ทำงาน background เท่านั้น
 */
'use client'

import { useEffect } from 'react'
import { startNotificationPolling, stopNotificationPolling } from '@/store/notification-store'

export default function NotificationPoller() {
  useEffect(() => {
    // เริ่ม polling เมื่อ member layout mount
    startNotificationPolling()

    // หยุด polling เมื่อ unmount
    return () => stopNotificationPolling()
  }, [])

  return null // ไม่ render อะไร — ทำงาน background
}
