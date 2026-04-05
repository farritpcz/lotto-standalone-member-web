/**
 * =============================================================================
 * Notification Store — Zustand store สำหรับจัดการ state แจ้งเตือน
 * =============================================================================
 *
 * เก็บ:
 *  - unreadCount: จำนวน notification ที่ยังไม่อ่าน (แสดงบน bell badge)
 *  - notifications: รายการ notification (แสดงใน NotificationCenter panel)
 *  - isOpen: panel เปิดอยู่หรือไม่
 *
 * ใช้โดย:
 *  - AppHeader.tsx → อ่าน unreadCount + toggle isOpen
 *  - NotificationCenter.tsx → อ่าน notifications + markAsRead
 *  - (member)/layout.tsx → startPolling ตอน mount
 *
 * Polling:
 *  - ทุก 30 วินาที fetch unread count จาก API
 *  - ถ้า unreadCount เปลี่ยน → refresh notification list ด้วย
 * =============================================================================
 */

import { create } from 'zustand'
import { notificationApi, AppNotification } from '@/lib/api'

// =============================================================================
// Types
// =============================================================================

interface NotificationState {
  /** จำนวน notification ที่ยังไม่อ่าน (แสดงบน bell badge) */
  unreadCount: number

  /** รายการ notification ล่าสุด (แสดงใน panel) */
  notifications: AppNotification[]

  /** panel เปิดอยู่หรือไม่ */
  isOpen: boolean

  /** กำลัง loading อยู่หรือไม่ */
  loading: boolean

  /** เปิด/ปิด panel */
  toggle: () => void
  open: () => void
  close: () => void

  /** ดึงจำนวน unread จาก API */
  fetchUnreadCount: () => Promise<void>

  /** ดึงรายการ notification จาก API */
  fetchNotifications: () => Promise<void>

  /** mark 1 notification ว่าอ่านแล้ว */
  markAsRead: (id: number) => Promise<void>

  /** mark ทั้งหมดว่าอ่านแล้ว */
  markAllAsRead: () => Promise<void>
}

// =============================================================================
// Store
// =============================================================================

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  notifications: [],
  isOpen: false,
  loading: false,

  // ─── Panel toggle ──────────────────────────────────────────────
  toggle: () => {
    const isOpen = !get().isOpen
    set({ isOpen })
    // เปิด panel → fetch ข้อมูลใหม่
    if (isOpen) get().fetchNotifications()
  },
  open: () => {
    set({ isOpen: true })
    get().fetchNotifications()
  },
  close: () => set({ isOpen: false }),

  // ─── Fetch unread count ────────────────────────────────────────
  // เรียกทุก 30 วินาทีจาก polling (lightweight — แค่ 1 count)
  fetchUnreadCount: async () => {
    try {
      const res = await notificationApi.getUnreadCount()
      const count = res.data?.data?.unread_count ?? 0
      set({ unreadCount: count })
    } catch {
      // network error → ไม่ต้อง handle (polling จะ retry)
    }
  },

  // ─── Fetch notifications list ──────────────────────────────────
  // เรียกเมื่อเปิด panel หรือ unreadCount เปลี่ยน
  fetchNotifications: async () => {
    set({ loading: true })
    try {
      const res = await notificationApi.list({ page: 1, per_page: 30 })
      const items = res.data?.data || []
      // PaginatedResponse → data เป็น array ตรงๆ
      set({ notifications: Array.isArray(items) ? items : [] })
    } catch {
      // error → เก็บ list เดิมไว้
    } finally {
      set({ loading: false })
    }
  },

  // ─── Mark as read ──────────────────────────────────────────────
  markAsRead: async (id: number) => {
    try {
      await notificationApi.markAsRead(id)
      // อัพเดท local state ทันที (ไม่ต้อง re-fetch)
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }))
    } catch {
      // error → ไม่ทำอะไร
    }
  },

  // ─── Mark all as read ──────────────────────────────────────────
  markAllAsRead: async () => {
    try {
      await notificationApi.markAllAsRead()
      // อัพเดท local state ทันที
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }))
    } catch {
      // error → ไม่ทำอะไร
    }
  },
}))

// =============================================================================
// Polling Hook — ใช้ใน (member)/layout.tsx
// =============================================================================

let pollingInterval: ReturnType<typeof setInterval> | null = null

/** เริ่ม polling unread count ทุก 30 วินาที */
export function startNotificationPolling() {
  // fetch ครั้งแรกทันที
  useNotificationStore.getState().fetchUnreadCount()

  // ตั้ง interval ทุก 30 วินาที
  if (pollingInterval) clearInterval(pollingInterval)
  pollingInterval = setInterval(() => {
    useNotificationStore.getState().fetchUnreadCount()
  }, 30_000)
}

/** หยุด polling (เมื่อ logout หรือ unmount) */
export function stopNotificationPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}
