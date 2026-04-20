/**
 * Lottery API — ประเภทหวย + รอบเปิดรับแทง + bet types (rate)
 * Backend: lotto-standalone-member-api `/api/v1/lotteries/*`
 */
import { cachedGet, CACHE_5MIN, CACHE_1MIN, CACHE_30MIN } from './_client'
import type { LotteryTypeInfo, LotteryRound, BetTypeInfo } from '@/types'

export const lotteryApi = {
  /** ดึงประเภทหวยที่เปิดอยู่ — ⭐ cache 5 นาที (ไม่ค่อยเปลี่ยน) */
  getTypes: () =>
    cachedGet<{ success: boolean; data: LotteryTypeInfo[] }>('/lotteries', CACHE_5MIN),

  /** ดึงรอบที่เปิดรับแทง — ⭐ cache 2 นาที (รอบไม่เปลี่ยนบ่อย แต่ถูกเรียกถี่) */
  getOpenRounds: (lotteryTypeId: number) =>
    cachedGet<{ success: boolean; data: LotteryRound[] }>(`/lotteries/${lotteryTypeId}/rounds`, 2 * CACHE_1MIN),

  /** ⭐ ดึง "รอบใกล้ถึงที่สุด" 1 รอบ (open ใกล้ปิด → หรือ upcoming ใกล้เปิด)
   *  ใช้ในหน้าแทง: แสดงรอบเดียว ไม่ให้ user งงกับ list รอบล่วงหน้า 30 วัน
   *  404 ถ้าไม่มีรอบ (UI แสดง empty state "ยังไม่มีรอบให้แทง")
   */
  getCurrentRound: (lotteryTypeId: number) =>
    cachedGet<{ success: boolean; data: LotteryRound }>(`/lotteries/${lotteryTypeId}/current-round`, 2 * CACHE_1MIN),

  /** ดึงประเภทการแทง + rate — ⭐ cache 30 นาที (แทบไม่เปลี่ยน) */
  getBetTypes: (lotteryTypeId: number) =>
    cachedGet<{ success: boolean; data: BetTypeInfo[] }>(`/lotteries/${lotteryTypeId}/bet-types`, CACHE_30MIN),
}
