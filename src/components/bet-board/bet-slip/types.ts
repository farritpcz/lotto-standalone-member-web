/**
 * types.ts — Types, constants & helpers สำหรับ BetSlip
 *
 * แยกของนิ่งๆ (types / groupItems / meta) ออกจากตัว component
 * Parent: ../BetSlip.tsx
 */

import type { BetSlipItem } from '@/store/bet-store'

// ─── Result Alert ──────────────────────────────────────────
// โครง state ของ pop-up ผล success/error หลังกด "ยืนยันแทง"
export interface ResultAlertState {
  type: 'success' | 'error'
  message: string
  closeFull?: boolean
}

// ─── Number Warning Map ────────────────────────────────────
// key = `${betType}-${number}` → warning data จาก API checkNumbers
export interface NumberWarning {
  status: string
  message?: string
  reduced_rate?: number
}
export type NumberWarningMap = Record<string, NumberWarning>

// ─── Group (by digit length) ───────────────────────────────
// ใช้จัดกลุ่ม bet slip ตามจำนวนหลัก: 4/3/2/1 (วิ่ง)
export interface BetSlipGroup {
  digit: number
  label: string
  color: string
  items: BetSlipItem[]
}

// meta ประจำจำนวนหลัก — label + สี
const GROUP_META: Record<number, { label: string; color: string }> = {
  4: { label: '4 ตัว', color: '#EF4444' },
  3: { label: '3 ตัว', color: '#3B82F6' },
  2: { label: '2 ตัว', color: '#F59E0B' },
  1: { label: 'วิ่ง', color: '#8B5CF6' },
}

// ─── จัดกลุ่มตามจำนวนหลัก ──────────────────────────────────
// รับ betSlip → คืน array เรียง 4→3→2→1 เฉพาะกลุ่มที่มีของ
export function groupBetItems(betSlip: BetSlipItem[]): BetSlipGroup[] {
  const digitMap: Record<number, BetSlipItem[]> = {}
  for (const item of betSlip) {
    const d = item.number.length
    if (!digitMap[d]) digitMap[d] = []
    digitMap[d].push(item)
  }
  return [4, 3, 2, 1]
    .filter(d => digitMap[d])
    .map(d => ({
      digit: d,
      ...(GROUP_META[d] || { label: `${d} หลัก`, color: '#6b7280' }),
      items: digitMap[d],
    }))
}

// ─── Preset amounts สำหรับ "ใส่ราคาทั้งหมด" ─────────────────
export const BULK_AMOUNT_PRESETS = [5, 10, 20, 50, 100] as const
