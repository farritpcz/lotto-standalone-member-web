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
        if (typeof window !== 'undefined') {
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
  /** ดึงประเภทหวยที่เปิดอยู่ (หน้า lobby) */
  getTypes: () =>
    api.get<{ success: boolean; data: LotteryTypeInfo[] }>('/lottery/types'),

  /** ดึงรอบที่เปิดรับแทงของหวยประเภทนั้น */
  getOpenRounds: (lotteryTypeId: number) =>
    api.get<{ success: boolean; data: LotteryRound[] }>(`/lottery/${lotteryTypeId}/rounds`),

  /** ดึงประเภทการแทง + rate สำหรับหวยประเภทนั้น */
  getBetTypes: (lotteryTypeId: number) =>
    api.get<{ success: boolean; data: BetTypeInfo[] }>(`/lottery/${lotteryTypeId}/bet-types`),
}

// === Betting ===
export const betApi = {
  /** วางเดิมพัน (ส่งหลายรายการพร้อมกันได้) */
  placeBets: (bets: PlaceBetItem[]) =>
    api.post<PlaceBetResponse>('/bets', { bets }),

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
