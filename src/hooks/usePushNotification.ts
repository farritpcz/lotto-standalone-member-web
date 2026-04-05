/**
 * =============================================================================
 * usePushNotification — Hook สำหรับจัดการ Browser Push Notification
 * =============================================================================
 *
 * ทำหน้าที่:
 *  1. ลงทะเบียน Service Worker (sw.js)
 *  2. ขอ permission จาก browser ("อนุญาตแจ้งเตือน?")
 *  3. Subscribe → ได้ PushSubscription → ส่งไปเก็บใน DB
 *  4. Unsubscribe → ลบ subscription ออกจาก DB
 *
 * ใช้โดย: component ที่ต้องการปุ่ม "เปิดแจ้งเตือน" เช่น Profile page
 *
 * Flow:
 *  1. Component เรียก usePushNotification()
 *  2. Hook register SW + เช็ค permission status
 *  3. User กดปุ่ม → subscribe() → ขอ permission → สร้าง subscription → ส่ง API
 *  4. User กดปุ่มอีกครั้ง → unsubscribe() → ลบ subscription → ส่ง API
 *
 * Browser Support:
 *  - Chrome (desktop + Android) ✅
 *  - Firefox ✅
 *  - Edge ✅
 *  - Safari (iOS 16.4+ เฉพาะ Add to Home Screen) ⚠️
 * =============================================================================
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { notificationApi } from '@/lib/api'

// =============================================================================
// Types
// =============================================================================

interface PushNotificationState {
  /** browser รองรับ push หรือไม่ */
  isSupported: boolean

  /** สถานะ permission: 'default' (ยังไม่ขอ), 'granted' (อนุญาต), 'denied' (ปฏิเสธ) */
  permission: NotificationPermission

  /** กำลัง subscribe อยู่หรือไม่ */
  isSubscribed: boolean

  /** กำลังโหลดหรือไม่ (subscribe/unsubscribe) */
  loading: boolean

  /** subscribe push notification */
  subscribe: () => Promise<void>

  /** unsubscribe push notification */
  unsubscribe: () => Promise<void>
}

// =============================================================================
// Helper — แปลง VAPID public key จาก Base64 URL → Uint8Array
// Web Push API ต้องการ applicationServerKey เป็น Uint8Array
// =============================================================================
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  // เพิ่ม padding ที่หายไป (Base64 URL encoding ไม่มี padding)
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// =============================================================================
// Hook
// =============================================================================

export function usePushNotification(): PushNotificationState {
  // ─── State ──────────────────────────────────────────────────
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  // ─── Init: register SW + เช็ค status ──────────────────────
  useEffect(() => {
    // เช็คว่า browser รองรับ SW + Push หรือไม่
    const supported = 'serviceWorker' in navigator && 'PushManager' in window
    setIsSupported(supported)

    if (!supported) return

    // อัพเดท permission state
    setPermission(Notification.permission)

    // ลงทะเบียน Service Worker
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      setRegistration(reg)

      // เช็คว่ามี subscription อยู่แล้วหรือไม่
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub)
      })
    }).catch((err) => {
      console.warn('SW registration failed:', err)
    })
  }, [])

  // ─── Subscribe ────────────────────────────────────────────
  const subscribe = useCallback(async () => {
    if (!registration || loading) return

    setLoading(true)
    try {
      // 1. ดึง VAPID public key จาก API
      const vapidRes = await notificationApi.getVAPIDKey()
      const vapidKey = vapidRes.data?.data?.vapid_public_key
      if (!vapidKey) throw new Error('VAPID key not available')

      // 2. แปลง VAPID key เป็น Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidKey)

      // 3. Subscribe → browser จะขอ permission ถ้ายังไม่เคยขอ
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,              // ต้อง true (Chrome บังคับ)
        applicationServerKey,
      })

      // 4. ส่ง subscription ไปเก็บใน DB
      const subJSON = subscription.toJSON()
      await notificationApi.subscribePush({
        endpoint: subJSON.endpoint!,
        keys: {
          p256dh: subJSON.keys!.p256dh!,
          auth: subJSON.keys!.auth!,
        },
      })

      setIsSubscribed(true)
      setPermission(Notification.permission)
    } catch (err) {
      console.error('Push subscribe failed:', err)
    } finally {
      setLoading(false)
    }
  }, [registration, loading])

  // ─── Unsubscribe ──────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    if (!registration || loading) return

    setLoading(true)
    try {
      // 1. ดึง subscription ปัจจุบัน
      const subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        setIsSubscribed(false)
        return
      }

      // 2. Unsubscribe จาก browser
      await subscription.unsubscribe()

      // 3. ลบ subscription ออกจาก DB
      await notificationApi.unsubscribePush(subscription.endpoint)

      setIsSubscribed(false)
    } catch (err) {
      console.error('Push unsubscribe failed:', err)
    } finally {
      setLoading(false)
    }
  }, [registration, loading])

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
  }
}
