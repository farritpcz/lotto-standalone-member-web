/**
 * Yeekee API — รอบยี่กี + shoots
 * Backend: lotto-standalone-member-api `/api/v1/yeekee/*`
 */
import { api } from './_client'
import type { YeekeeRound, YeekeeShoot } from '@/types'

export const yeekeeApi = {
  /** ดูรอบยี่กีที่เปิดอยู่ */
  getRounds: () =>
    api.get<{ success: boolean; data: YeekeeRound[] }>('/yeekee/rounds'),

  /** ดูเลขที่ยิงในรอบ */
  getShoots: (roundId: number) =>
    api.get<{ success: boolean; data: { shoots: YeekeeShoot[]; total_sum: number } }>(`/yeekee/${roundId}/shoots`),
}
