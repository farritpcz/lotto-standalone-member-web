/**
 * Notification API — In-App notifications + Browser Push subscription
 * Backend: lotto-standalone-member-api `/api/v1/notifications/*`, `/api/v1/push/*`
 */
import { api, cachedGet, CACHE_30MIN } from './_client'
import type { PaginatedResponse } from '@/types'

export const notificationApi = {
  /** รายการแจ้งเตือน (paginated) */
  list: (params?: { page?: number; per_page?: number; is_read?: boolean }) =>
    api.get<PaginatedResponse<AppNotification>>('/notifications', { params }),

  /** จำนวน notification ที่ยังไม่อ่าน (สำหรับ badge ตัวเลข) */
  getUnreadCount: () =>
    api.get<{ success: boolean; data: { unread_count: number } }>('/notifications/unread-count'),

  /** mark 1 notification ว่าอ่านแล้ว */
  markAsRead: (id: number) =>
    api.post<{ success: boolean }>(`/notifications/${id}/read`),

  /** mark ทุก notification ว่าอ่านแล้ว */
  markAllAsRead: () =>
    api.post<{ success: boolean }>('/notifications/read-all'),

  /** บันทึก browser push subscription */
  subscribePush: (subscription: PushSubscriptionJSON) =>
    api.post<{ success: boolean }>('/push/subscribe', subscription),

  /** ลบ browser push subscription */
  unsubscribePush: (endpoint: string) =>
    api.delete<{ success: boolean }>('/push/subscribe', { data: { endpoint } }),

  /** ดึง VAPID public key สำหรับ subscribe push */
  getVAPIDKey: () =>
    cachedGet<{ success: boolean; data: { vapid_public_key: string } }>('/push/vapid-key', CACHE_30MIN),
}

/** แจ้งเตือนในระบบ (รวม bet_won, deposit_approved, withdraw_approved, commission_earned, system) */
export interface AppNotification {
  id: number
  type: string            // bet_won, deposit_approved, withdraw_approved, commission_earned, system
  title: string
  message: string
  icon: string            // Lucide icon name: trophy, wallet, gift, percent, bell
  is_read: boolean
  data?: string           // JSON string สำหรับข้อมูลเพิ่มเติม
  created_at: string
}
