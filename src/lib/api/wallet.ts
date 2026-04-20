/**
 * Wallet API — ยอดเงิน + ประวัติธุรกรรม
 * Backend: lotto-standalone-member-api `/api/v1/wallet/*`
 */
import { cachedGet, CACHE_1MIN, CACHE_5MIN } from './_client'
import type { Transaction, PaginatedResponse } from '@/types'

export const walletApi = {
  /** ดูยอดเงิน — ⭐ cache 1 นาที (เปลี่ยนเฉพาะตอนแทง/ฝาก/ถอน) */
  getBalance: () =>
    cachedGet<{ success: boolean; data: { balance: number } }>('/wallet/balance', CACHE_1MIN),

  /** ดูประวัติธุรกรรม — ⭐ cache 5 นาที (ข้อมูลย้อนหลัง ไม่เปลี่ยนบ่อย) */
  getTransactions: (params?: { type?: string; page?: number; per_page?: number }) =>
    cachedGet<PaginatedResponse<Transaction>>('/wallet/transactions', CACHE_5MIN, params as Record<string, unknown>),
}
