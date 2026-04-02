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

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

// Base URL ของ standalone-member-api (#3)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

/**
 * สร้าง Axios instance พร้อม JWT interceptor
 *
 * - Request interceptor: แนบ JWT token ทุก request
 * - Response interceptor: จัดการ 401 (token expired → redirect login)
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor — แนบ JWT token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // ดึง token จาก localStorage (Zustand persist)
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('access_token')
        : null

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // Response interceptor — จัดการ error
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired → ลบ token + redirect ไป login
        // ⭐ ป้องกัน infinite redirect loop: ถ้าอยู่ที่ /login อยู่แล้ว ไม่ต้อง redirect ซ้ำ
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
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
  /** ดึงประเภทหวยที่เปิดอยู่ (หน้า lobby) — public endpoint */
  getTypes: () =>
    api.get<{ success: boolean; data: LotteryTypeInfo[] }>('/lotteries'),

  /** ดึงรอบที่เปิดรับแทงของหวยประเภทนั้น */
  getOpenRounds: (lotteryTypeId: number) =>
    api.get<{ success: boolean; data: LotteryRound[] }>(`/lotteries/${lotteryTypeId}/rounds`),

  /** ดึงประเภทการแทง + rate สำหรับหวยประเภทนั้น */
  getBetTypes: (lotteryTypeId: number) =>
    api.get<{ success: boolean; data: BetTypeInfo[] }>(`/lotteries/${lotteryTypeId}/bet-types`),
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
