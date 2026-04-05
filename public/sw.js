/**
 * =============================================================================
 * Service Worker — Browser Push Notification
 * =============================================================================
 *
 * ทำหน้าที่:
 *  1. รับ push event จาก server → แสดง notification popup
 *  2. จัดการ click notification → เปิดหน้าที่เกี่ยวข้อง
 *  3. ทำงานใน background แม้ปิดเว็บไปแล้ว
 *
 * ลงทะเบียนโดย: usePushNotification hook (src/hooks/usePushNotification.ts)
 * ส่ง push โดย: member-api push_service.go
 *
 * Push payload format (JSON):
 * {
 *   "title": "คุณถูกรางวัล!",
 *   "body": "เลข 56 ได้รับ ฿2,000",
 *   "icon": "/images/icon-192.png",
 *   "badge": "/images/icon-72.png",
 *   "url": "/history"           ← optional: เปิดหน้าไหนเมื่อ click
 * }
 * =============================================================================
 */

// =============================================================================
// Push Event — รับ push จาก server → แสดง notification popup
// =============================================================================
self.addEventListener('push', (event) => {
  // ─── Parse payload ──────────────────────────────────────────
  let data = {
    title: 'แจ้งเตือน',
    body: 'คุณมีการแจ้งเตือนใหม่',
    icon: '/images/icon-192.png',
    badge: '/images/icon-72.png',
    url: '/dashboard',
  }

  // ลอง parse JSON จาก push payload
  if (event.data) {
    try {
      const payload = event.data.json()
      data = { ...data, ...payload }
    } catch {
      // ถ้า parse ไม่ได้ → ใช้ text เป็น body
      data.body = event.data.text()
    }
  }

  // ─── แสดง notification ──────────────────────────────────────
  // waitUntil ป้องกัน SW ถูก kill ก่อนแสดง notification เสร็จ
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      // เก็บ URL ไว้ใน data เพื่อใช้ตอน click
      data: { url: data.url },
      // vibrate pattern (มือถือ)
      vibrate: [100, 50, 100],
      // แสดง timestamp
      timestamp: Date.now(),
      // ไม่ปิดอัตโนมัติ (ต้อง click หรือ dismiss)
      requireInteraction: false,
    })
  )
})

// =============================================================================
// Notification Click — click notification → เปิดหน้าเว็บ
// =============================================================================
self.addEventListener('notificationclick', (event) => {
  // ปิด notification popup
  event.notification.close()

  // URL ที่จะเปิด (จาก push payload)
  const targetUrl = event.notification.data?.url || '/dashboard'

  // เปิดหน้าเว็บ — ถ้ามี tab เปิดอยู่แล้ว → focus tab นั้น
  // ถ้าไม่มี → เปิด tab ใหม่
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // หา tab ที่เปิดเว็บเราอยู่
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // navigate ไปหน้าที่ต้องการ + focus
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      // ไม่มี tab เปิดอยู่ → เปิดใหม่
      return self.clients.openWindow(targetUrl)
    })
  )
})

// =============================================================================
// Activate — claim clients ทันทีเมื่อ SW ใหม่ active
// =============================================================================
self.addEventListener('activate', (event) => {
  // ให้ SW ใหม่ควบคุม tab ที่เปิดอยู่ทันที (ไม่ต้องรอ reload)
  event.waitUntil(self.clients.claim())
})
