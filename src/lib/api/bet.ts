/**
 * Bet API — วางเดิมพัน + เช็คเลข + ประวัติแทง
 * Backend: lotto-standalone-member-api `/api/v1/bets/*`
 *
 * AIDEV-NOTE: หลัง placeBets ต้องล้าง wallet cache (ยอดเงินเปลี่ยน)
 */
import { api, invalidateCache } from './_client'
import type {
  PlaceBetItem, PlaceBetResponse, Bet, BetCheckResult, PaginatedResponse,
} from '@/types'

export const betApi = {
  /** วางเดิมพัน (ส่งหลายรายการพร้อมกันได้) — ⭐ ล้าง wallet cache หลังแทง */
  placeBets: async (bets: PlaceBetItem[]) => {
    const res = await api.post<PlaceBetResponse>('/bets', { bets })
    invalidateCache('/wallet') // ยอดเงินเปลี่ยน → ล้าง cache balance + transactions
    return res
  },

  /** เช็คเลขก่อนแทง — ดูว่าโดนอั้น/ลดเรท/จำกัดยอดไหม */
  checkNumbers: (data: { lottery_round_id: number; items: { bet_type_code: string; number: string }[] }) =>
    api.post<{ success: boolean; data: BetCheckResult[] }>('/bets/check', data),

  /** ดู bets ของฉัน */
  getMyBets: (params?: { status?: string; round_id?: number; page?: number; per_page?: number }) =>
    api.get<PaginatedResponse<Bet>>('/bets', { params }),
}
