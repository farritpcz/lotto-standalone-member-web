/**
 * Results API — ผลรางวัลย้อนหลัง
 * Backend: lotto-standalone-member-api `/api/v1/results`
 */
import { cachedGet, CACHE_30MIN } from './_client'
import type { LotteryRound, PaginatedResponse } from '@/types'

export const resultApi = {
  /** ตรวจผลรางวัล — ⭐ cache 30 นาที (ผลรางวัลเก่าไม่เปลี่ยน) */
  getResults: (params?: { lottery_type_id?: number; page?: number; per_page?: number }) =>
    cachedGet<PaginatedResponse<LotteryRound>>('/results', CACHE_30MIN, params as Record<string, unknown>),
}
