/**
 * API Client สำหรับเชื่อมต่อกับ lotto-standalone-member-api (#3)
 *
 * ความสัมพันธ์:
 * - เรียก API ของ: #3 lotto-standalone-member-api (port 8080)
 * - ใช้ JWT token สำหรับ authentication
 * - token เก็บใน Zustand store (memory) + localStorage (persist)
 *
 * NOTE: provider-game-web (#8) จะมี api.ts คล้ายกัน
 * ต่างกันที่: base URL, auth method (launch token vs JWT)
 * TODO: แยกเป็น @lotto/api-client npm package ในอนาคต
 */

import axios, { AxiosInstance } from 'axios'

// ⭐ ใช้ relative URL → Next.js rewrites proxy ไป backend (same-origin สำหรับ httpOnly cookie)
// dev: /api/v1 → Next.js rewrite → http://localhost:8082/api/v1
// prod: /api/v1 → reverse proxy (nginx) → backend
const API_BASE_URL = '/api/v1'

/**
 * สร้าง Axios instance พร้อม JWT interceptor
 *
 * - Request interceptor: แนบ JWT token ทุก request
 * - Response interceptor: จัดการ 401 (token expired → redirect login)
 */
/** อ่าน cookie value จาก document.cookie */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    withCredentials: true, // ⭐ ส่ง httpOnly cookie ทุก request (แทน localStorage token)
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // ⭐ CSRF: อ่าน csrf_token cookie → ส่งกลับใน X-CSRF-Token header
  client.interceptors.request.use((config) => {
    const csrfToken = getCookie('csrf_token')
    if (csrfToken && config.headers) {
      config.headers['X-CSRF-Token'] = csrfToken
    }
    return config
  })

  // Response interceptor — จัดการ error
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired / cookie หมดอายุ → clear auth store + redirect login
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          // ⭐ ลบ Zustand persist ด้วย (ไม่งั้น isAuthenticated ค้างใน localStorage)
          try {
            const raw = localStorage.getItem('lotto-auth')
            if (raw) {
              localStorage.setItem('lotto-auth', JSON.stringify({
                state: { member: null, isAuthenticated: false },
                version: 0,
              }))
            }
          } catch {}
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }
  )

  return client
}

/** API client instance (singleton) */
export const api = createApiClient()

// =============================================================================
// Client-side Cache — ลด request ซ้ำสำหรับ data ที่ไม่เปลี่ยนบ่อย
// =============================================================================

/** cache entry: data + expiry timestamp */
const apiCache = new Map<string, { data: unknown; expiry: number }>()

/**
 * cachedGet — GET แบบ cache (ถ้ายังไม่หมดอายุจะคืนจาก cache ไม่ยิง request)
 *
 * @param url   - API path เช่น '/lotteries'
 * @param ttlMs - cache TTL in milliseconds (default 5 นาที)
 * @param params - query params (optional)
 *
 * ใช้: const res = await cachedGet<MyType>('/lotteries', 5 * 60 * 1000)
 */
async function cachedGet<T>(url: string, ttlMs: number, params?: Record<string, unknown>): Promise<{ data: T }> {
  // สร้าง cache key จาก url + params
  const key = url + (params ? '?' + JSON.stringify(params) : '')
  const now = Date.now()
  const cached = apiCache.get(key)

  // ถ้ามี cache ยังไม่หมดอายุ → คืนทันที
  if (cached && cached.expiry > now) {
    return { data: cached.data as T }
  }

  // ไม่มี cache หรือหมดอายุ → ยิง request จริง
  const res = await api.get<T>(url, { params })
  apiCache.set(key, { data: res.data, expiry: now + ttlMs })
  return res
}

/** ล้าง cache ทั้งหมด (เรียกหลัง login/logout) */
export function clearApiCache() { apiCache.clear() }

/** ล้าง cache เฉพาะ prefix (เช่น '/referral' จะลบ /referral/info, /referral/leaderboard ฯลฯ) */
export function invalidateCache(prefix: string) {
  for (const key of apiCache.keys()) {
    if (key.startsWith(prefix)) apiCache.delete(key)
  }
}

// Cache durations (milliseconds)
const CACHE_1MIN  = 60 * 1000
const CACHE_5MIN  = 5 * 60 * 1000
const CACHE_30MIN = 30 * 60 * 1000
const CACHE_1HR   = 60 * 60 * 1000

// =============================================================================
// API Functions — จัดกลุ่มตาม feature
// =============================================================================

import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  LotteryTypeInfo,
  LotteryRound,
  BetTypeInfo,
  PlaceBetItem,
  PlaceBetResponse,
  Bet,
  Transaction,
  Member,
  YeekeeRound,
  PaginatedResponse,
} from '@/types'

// === Auth ===
export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data),

  /** Logout — ลบ httpOnly cookie ที่ backend */
  logout: () =>
    api.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refresh_token: refreshToken }),
}

// === Member ===
export const memberApi = {
  getProfile: () =>
    api.get<{ success: boolean; data: Member }>('/member/profile'),

  updateProfile: (data: Partial<Member>) =>
    api.put<{ success: boolean; data: Member }>('/member/profile', data),
}

// === Lottery ===
export const lotteryApi = {
  /** ดึงประเภทหวยที่เปิดอยู่ — ⭐ cache 5 นาที (ไม่ค่อยเปลี่ยน) */
  getTypes: () =>
    cachedGet<{ success: boolean; data: LotteryTypeInfo[] }>('/lotteries', CACHE_5MIN),

  /** ดึงรอบที่เปิดรับแทง — ไม่ cache (เปลี่ยนตามเวลา) */
  getOpenRounds: (lotteryTypeId: number) =>
    api.get<{ success: boolean; data: LotteryRound[] }>(`/lotteries/${lotteryTypeId}/rounds`),

  /** ดึงประเภทการแทง + rate — ⭐ cache 30 นาที (แทบไม่เปลี่ยน) */
  getBetTypes: (lotteryTypeId: number) =>
    cachedGet<{ success: boolean; data: BetTypeInfo[] }>(`/lotteries/${lotteryTypeId}/bet-types`, CACHE_30MIN),
}

// === Betting ===
export const betApi = {
  /** วางเดิมพัน (ส่งหลายรายการพร้อมกันได้) */
  placeBets: (bets: PlaceBetItem[]) =>
    api.post<PlaceBetResponse>('/bets', { bets }),

  /** เช็คเลขก่อนแทง — ดูว่าโดนอั้น/ลดเรท/จำกัดยอดไหม */
  checkNumbers: (data: { lottery_round_id: number; items: { bet_type_code: string; number: string }[] }) =>
    api.post('/bets/check', data),

  /** ดู bets ของฉัน */
  getMyBets: (params?: { status?: string; round_id?: number; page?: number; per_page?: number }) =>
    api.get<PaginatedResponse<Bet>>('/bets', { params }),
}

// === Results ===
export const resultApi = {
  /** ตรวจผลรางวัล */
  getResults: (params?: { lottery_type_id?: number; page?: number; per_page?: number }) =>
    api.get<PaginatedResponse<LotteryRound>>('/results', { params }),
}

// === Wallet ===
export const walletApi = {
  /** ดูยอดเงิน */
  getBalance: () =>
    api.get<{ success: boolean; data: { balance: number } }>('/wallet/balance'),

  /** ดูประวัติธุรกรรม */
  getTransactions: (params?: { type?: string; page?: number; per_page?: number }) =>
    api.get<PaginatedResponse<Transaction>>('/wallet/transactions', { params }),
}

// === Yeekee ===
export const yeekeeApi = {
  /** ดูรอบยี่กีที่เปิดอยู่ */
  getRounds: () =>
    api.get<{ success: boolean; data: YeekeeRound[] }>('/yeekee/rounds'),

  /** ดูเลขที่ยิงในรอบ */
  getShoots: (roundId: number) =>
    api.get<{ success: boolean; data: { shoots: import('@/types').YeekeeShoot[]; total_sum: number } }>(`/yeekee/${roundId}/shoots`),
}

// === Referral / Affiliate ===
export const referralApi = {
  /** ดึงข้อมูลครบสำหรับหน้า referral */
  getInfo: () =>
    api.get<{ success: boolean; data: ReferralInfo }>('/referral/info'),

  /** ดูรายการค่าคอม */
  getCommissions: (params?: { page?: number; per_page?: number; status?: string }) =>
    api.get<PaginatedResponse<ReferralCommission>>('/referral/commissions', { params }),

  /** ถอนค่าคอมเข้า wallet */
  withdraw: (amount: number) =>
    api.post<{ success: boolean; message: string }>('/referral/withdraw', { amount }),

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

// Types สำหรับ referral
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

// Leaderboard types
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

// === Types สำหรับ referral analytics / notifications / share templates ===
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
