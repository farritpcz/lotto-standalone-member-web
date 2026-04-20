/**
 * Referral / Affiliate API — ลิงก์แนะนำ + ค่าคอม + ถอน + leaderboard + share templates
 * Backend: lotto-standalone-member-api `/api/v1/referral/*`
 *
 * AIDEV-NOTE: หลัง withdraw ต้องล้างทั้ง wallet + referral cache
 */
import { api, cachedGet, invalidateCache, CACHE_1MIN, CACHE_5MIN, CACHE_30MIN } from './_client'
import type { PaginatedResponse } from '@/types'

export const referralApi = {
  /** ดึงข้อมูลครบสำหรับหน้า referral — ⭐ cache 2 นาที (ลิงก์ไม่เปลี่ยน, stats ช้า) */
  getInfo: () =>
    cachedGet<{ success: boolean; data: ReferralInfo }>('/referral/info', 2 * CACHE_1MIN),

  /** ดูรายการค่าคอม */
  getCommissions: (params?: { page?: number; per_page?: number; status?: string }) =>
    api.get<PaginatedResponse<ReferralCommission>>('/referral/commissions', { params }),

  /** ถอนค่าคอมเข้า wallet — ⭐ ล้าง wallet + referral cache หลังถอน */
  withdraw: async (amount: number) => {
    const res = await api.post<{ success: boolean; message: string }>('/referral/withdraw', { amount })
    invalidateCache('/wallet')   // ยอดเงินเปลี่ยน
    invalidateCache('/referral') // สถิติ referral เปลี่ยน
    return res
  },

  /** ประวัติการถอนค่าคอม */
  getWithdrawals: (params?: { page?: number; per_page?: number }) =>
    api.get<PaginatedResponse<WithdrawalRecord>>('/referral/withdrawals', { params }),

  /** กระดานอันดับ top 10 — ⭐ cache 2 นาที (อัพเดทช้า) */
  getLeaderboard: (period?: 'day' | 'week' | 'month') =>
    cachedGet<{ success: boolean; data: LeaderboardResponse }>(`/referral/leaderboard?period=${period || 'month'}`, 2 * CACHE_1MIN),

  /** สถิติลิงก์ — ⭐ cache 5 นาที */
  getAnalytics: (days?: number) =>
    cachedGet<{ success: boolean; data: ReferralAnalytics }>(`/referral/analytics?days=${days || 7}`, CACHE_5MIN),

  /** ตั้ง custom referral code */
  setCustomCode: (code: string) =>
    api.post<{ success: boolean; message: string; data: { custom_code: string; link: string } }>('/referral/custom-code', { code }),

  /** ดึงแจ้งเตือน referral */
  getNotifications: (params?: { page?: number; per_page?: number }) =>
    api.get<{ success: boolean; data: ReferralNotificationsResponse }>('/referral/notifications', { params }),

  /** อ่านแจ้งเตือน */
  markNotificationsRead: (data: { ids?: number[]; all?: boolean }) =>
    api.post<{ success: boolean }>('/referral/notifications/read', data),

  /** ข้อความสำเร็จรูปจาก admin — ⭐ cache 30 นาที (admin ไม่ค่อยเปลี่ยน) */
  getShareTemplates: () =>
    cachedGet<{ success: boolean; data: ShareTemplate[] }>('/referral/share-templates', CACHE_30MIN),
}

// ─── Types ─────────────────────────────────────────────────────────────
export interface ReferralInfo {
  link: {
    id: number; code: string; link: string
    clicks: number; registrations: number; status: string; created_at: string
  }
  stats: {
    total_referred: number; active_referred: number
    total_comm: number; pending_comm: number; paid_comm: number
  }
  commission_rates: Array<{ lottery_type?: string; lottery_type_id?: number; rate: number }>
  withdrawal: { min: number; note: string }
}

export interface ReferralCommission {
  id: number; referred_username: string
  bet_amount: number; commission_rate: number; commission_amount: number
  status: string; paid_at?: string; created_at: string
}

// Leaderboard
export interface LeaderboardEntry {
  rank: number; username: string
  total_commission: number; total_referred: number
  is_me: boolean
}
export interface LeaderboardResponse {
  period: string; start_date: string
  leaderboard: LeaderboardEntry[]
}

// Withdrawal record (จาก transactions table)
export interface WithdrawalRecord {
  id: number; amount: number; created_at: string
  balance_before: number; balance_after: number
}

// Analytics / Notifications / Share templates
export interface ReferralAnalytics {
  summary: { total_clicks: number; total_registrations: number; conversion_rate: string }
  daily: Array<{ date: string; clicks: number; registrations: number }>
}

export interface ReferralNotification {
  id: number; type: string; title: string; message: string
  data?: string; is_read: boolean; created_at: string
}
export interface ReferralNotificationsResponse {
  notifications: ReferralNotification[]
  unread_count: number
  meta: { page: number; per_page: number; total: number; total_pages: number }
}

export interface ShareTemplate {
  id: number; name: string; content: string; platform: string
  sort_order: number; status: string
}
