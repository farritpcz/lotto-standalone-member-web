/**
 * Bet Store — จัดการ state การแทงหวย (bet slip)
 *
 * ⭐ Multi-select bet types:
 *   - 3ตัวบน + 3ตัวโต๊ด → กดพร้อมกันได้ (กลุ่ม 3 หลัก)
 *   - 2ตัวบน + 2ตัวล่าง → กดพร้อมกันได้ (กลุ่ม 2 หลัก)
 *   - วิ่งบน + วิ่งล่าง → กดพร้อมกันได้ (กลุ่ม 1 หลัก)
 *   เมื่อกดเลข → สร้าง bet ให้ทุก type ที่เลือกอยู่
 *
 * ความสัมพันธ์:
 * - ใช้โดย: หน้าแทงหวย, BetTypeSelector, NumberPad, BetSlip
 * - provider-game-web (#8) ใช้ store เดียวกัน
 */

import { create } from 'zustand'
import type { BetType, LotteryRound, BetTypeInfo } from '@/types'

/** Bet item ที่ยังไม่ส่ง (อยู่ใน bet slip) */
export interface BetSlipItem {
  id: string           // unique id (client-side)
  number: string       // เลขที่แทง
  betType: BetType     // ประเภทการแทง
  betTypeName: string  // ชื่อแสดงผล เช่น "3 ตัวบน"
  amount: number       // จำนวนเงิน
  rate: number         // rate จ่าย ณ ตอนเลือก
  potentialWin: number // เงินที่อาจได้ = amount × rate
}

// สร้างเลขกลับทุก permutation (ไม่ซ้ำ)
// เช่น "123" → ["123","132","213","231","312","321"]
// เช่น "12" → ["12","21"]
// เช่น "112" → ["112","121","211"] (ไม่ซ้ำ)
function getPermutations(str: string): string[] {
  const results = new Set<string>()
  const chars = str.split('')

  function permute(arr: string[], start: number) {
    if (start === arr.length - 1) {
      results.add(arr.join(''))
      return
    }
    for (let i = start; i < arr.length; i++) {
      ;[arr[start], arr[i]] = [arr[i], arr[start]]
      permute([...arr], start + 1)
    }
  }

  permute(chars, 0)
  return Array.from(results)
}

// กลุ่ม bet types ที่เลือกพร้อมกันได้ (ต้อง digit_count เดียวกัน)
// เช่น 3TOP + 3TOD = ทั้งคู่ 3 หลัก → เลือกพร้อมกันได้
function getDigitGroup(code: string): number {
  if (['3TOP', '3BOTTOM', '3TOD', '3FRONT', '3TOD_FRONT', 'PERM3'].includes(code)) return 3
  if (['4TOP', '4TOD'].includes(code)) return 4
  if (['2TOP', '2BOTTOM', '2TOP_UNDER', 'PERM2'].includes(code)) return 2
  if (['RUN_TOP', 'RUN_BOT', '19DOOR', '1TOP'].includes(code)) return 1
  return 0
}

interface BetState {
  // State
  currentRound: LotteryRound | null
  betTypes: BetTypeInfo[]
  // ⭐ เปลี่ยนจาก single → multi-select
  selectedBetTypes: BetType[]
  betSlip: BetSlipItem[]

  // Actions
  setCurrentRound: (round: LotteryRound) => void
  setBetTypes: (types: BetTypeInfo[]) => void

  /** Toggle เลือก/ยกเลิก bet type (multi-select ในกลุ่มเดียวกัน) */
  toggleBetType: (type: BetType) => void

  /** ดึง digit count ของ bet types ที่เลือกอยู่ (ใช้กำหนดจำนวนหลักของ number pad) */
  getSelectedDigitCount: () => number

  /** เพิ่ม bet ลง slip สำหรับ *ทุก* bet type ที่เลือกอยู่ */
  addToBetSlip: (number: string, amount: number) => void
  removeFromBetSlip: (id: string) => void
  updateAmount: (id: string, amount: number) => void
  clearBetSlip: () => void
  getTotalAmount: () => number

  // Backward compat
  selectedBetType: BetType | null
  selectBetType: (type: BetType) => void
}

export const useBetStore = create<BetState>((set, get) => ({
  currentRound: null,
  betTypes: [],
  selectedBetTypes: [],
  betSlip: [],

  setCurrentRound: (round) => set({ currentRound: round }),
  setBetTypes: (types) => set({ betTypes: types }),

  // ⭐ Toggle bet type: เลือก/ยกเลิก
  // ถ้ากด type ที่ต่าง digit group → clear เดิมแล้วเลือกใหม่
  // ถ้ากด type ที่อยู่ใน digit group เดียวกัน → toggle (เพิ่ม/ลบ)
  toggleBetType: (type) => {
    const state = get()
    const clickedGroup = getDigitGroup(type)
    const currentGroups = state.selectedBetTypes.map(t => getDigitGroup(t))
    const currentGroup = currentGroups.length > 0 ? currentGroups[0] : null

    if (currentGroup !== null && currentGroup !== clickedGroup) {
      // คลิก type ต่าง group → reset แล้วเลือก type ใหม่
      set({ selectedBetTypes: [type] })
    } else {
      // toggle ภายใน group เดียวกัน
      const already = state.selectedBetTypes.includes(type)
      if (already) {
        set({ selectedBetTypes: state.selectedBetTypes.filter(t => t !== type) })
      } else {
        set({ selectedBetTypes: [...state.selectedBetTypes, type] })
      }
    }
  },

  // ดึง digit count จาก bet types ที่เลือก (ใช้กำหนด number pad)
  getSelectedDigitCount: () => {
    const state = get()
    if (state.selectedBetTypes.length === 0) return 0
    const info = state.betTypes.find(t => t.code === state.selectedBetTypes[0])
    return info?.digit_count || 0
  },

  // ⭐ เพิ่ม bet ให้ *ทุก* type ที่เลือก → ซื้อพร้อมกันหลายประเภท
  // ⭐ PERM3/PERM2 = "กลับ" → สร้าง bet ทุก permutation เป็น 3TOP/2TOP
  addToBetSlip: (number, amount) => {
    const state = get()
    if (state.selectedBetTypes.length === 0) return

    const newItems: BetSlipItem[] = []

    for (const betType of state.selectedBetTypes) {
      // "กลับ" → expand เป็นหลาย bet ของ type จริง (3TOP หรือ 2TOP)
      if (betType === 'PERM3' as BetType) {
        const realType = state.betTypes.find(t => t.code === '3TOP')
        if (!realType) continue
        const perms = getPermutations(number)
        for (const perm of perms) {
          newItems.push({
            id: `3TOP-${perm}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            number: perm,
            betType: '3TOP' as BetType,
            betTypeName: `3 ตัวบน (กลับ)`,
            amount,
            rate: realType.rate,
            potentialWin: amount * realType.rate,
          })
        }
        continue
      }
      if (betType === 'PERM2' as BetType) {
        const realType = state.betTypes.find(t => t.code === '2TOP')
        if (!realType) continue
        const perms = getPermutations(number)
        for (const perm of perms) {
          newItems.push({
            id: `2TOP-${perm}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            number: perm,
            betType: '2TOP' as BetType,
            betTypeName: `2 ตัวบน (กลับ)`,
            amount,
            rate: realType.rate,
            potentialWin: amount * realType.rate,
          })
        }
        continue
      }

      // ประเภทปกติ
      const typeInfo = state.betTypes.find(t => t.code === betType)
      if (!typeInfo) continue

      newItems.push({
        id: `${betType}-${number}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        number,
        betType,
        betTypeName: typeInfo.name,
        amount,
        rate: typeInfo.rate,
        potentialWin: amount * typeInfo.rate,
      })
    }

    set((s) => ({ betSlip: [...s.betSlip, ...newItems] }))
  },

  removeFromBetSlip: (id) =>
    set((s) => ({ betSlip: s.betSlip.filter((item) => item.id !== id) })),

  updateAmount: (id, amount) =>
    set((s) => ({
      betSlip: s.betSlip.map((item) =>
        item.id === id
          ? { ...item, amount, potentialWin: amount * item.rate }
          : item
      ),
    })),

  clearBetSlip: () => set({ betSlip: [] }),
  getTotalAmount: () => get().betSlip.reduce((sum, item) => sum + item.amount, 0),

  // Backward compat: selectedBetType returns first selected
  get selectedBetType() {
    return get().selectedBetTypes[0] || null
  },
  selectBetType: (type) => {
    // legacy single-select → clear + select
    set({ selectedBetTypes: [type] })
  },
}))
