/**
 * Member API — profile + ระดับสมาชิก (level)
 * Backend: lotto-standalone-member-api `/api/v1/member/*`
 * Rule: docs/rules/profile_level.md
 */
import { api } from './_client'
import type { Member } from '@/types'

export const memberApi = {
  getProfile: () =>
    api.get<{ success: boolean; data: Member }>('/member/profile'),

  updateProfile: (data: Partial<Member>) =>
    api.put<{ success: boolean; data: Member }>('/member/profile', data),

  // ⭐ ระดับสมาชิก (v3 2026-04-20) — คำนวณจากยอดฝาก rolling 30 วัน
  //   backend: member-api/internal/handler/member.go:GetMyLevel
  //   docs:    docs/rules/profile_level.md
  getMyLevel: () =>
    api.get<{ success: boolean; data: MemberLevelInfo }>('/member/level'),
}

// ─── Member Level Types (v3) ──────────────────────────────────────────
export interface MemberLevelTier {
  id: number
  name: string
  color: string
  icon: string
  sort_order: number
  min_deposit_30d: number
  description: string
}

export interface MemberLevelInfo {
  current_level: MemberLevelTier | null   // null = ยังไม่ถูกจัดระดับ
  next_level: MemberLevelTier | null      // null = ถึงระดับสูงสุดแล้ว
  deposit_30d: number                     // ยอดฝากสะสม 30 วัน (cached)
  progress_pct: number                    // 0..100 — ความคืบหน้าไปยัง next
  amount_to_next: number                  // บาทที่ยังต้องฝาก (รวม 30 วัน)
  locked: boolean                         // admin override อยู่มั้ย
  recalc_info: string                     // ข้อความอธิบาย (ภาษาไทย)
  window_days: number                     // = 30
}
