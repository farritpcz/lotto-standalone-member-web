/**
 * Bet Store — จัดการ state การแทงหวย (bet slip)
 *
 * ⭐ Multi-select bet types:
 *   - 3ตัวบน + 3ตัวโต๊ด → กดพร้อมกันได้ (กลุ่ม 3 หลัก)
 *   - 2ตัวบน + 2ตัวล่าง → กดพร้อมกันได้ (กลุ่ม 2 หลัก)
 *   - วิ่งบน + วิ่งล่าง → กดพร้อมกันได้ (กลุ่ม 1 หลัก)
 *   เมื่อกดเลข → สร้าง bet ให้ทุก type ที่เลือกอยู่
 *
 * ⭐ เก็บ betSlip ใน localStorage → refresh ไม่หาย
 * ⭐ เพิ่ม removeDuplicates — ลบเลขซ้ำ (เก็บตัวแรก)
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
function getPermutations(str: string): string[] {
  const results = new Set<string>()
  const chars = str.split('')
  function permute(arr: string[], start: number) {
    if (start === arr.length - 1) { results.add(arr.join('')); return }
    for (let i = start; i < arr.length; i++) {
      ;[arr[start], arr[i]] = [arr[i], arr[start]]
      permute([...arr], start + 1)
    }
  }
  permute(chars, 0)
  return Array.from(results)
}

// กลุ่ม bet types ที่เลือกพร้อมกันได้ (ต้อง digit_count เดียวกัน)
function getDigitGroup(code: string): number {
  if (['3TOP', '3BOTTOM', '3TOD', '3FRONT', '3TOD_FRONT', 'PERM3'].includes(code)) return 3
  if (['4TOP', '4TOD'].includes(code)) return 4
  if (['2TOP', '2BOTTOM', '2TOP_UNDER', 'PERM2'].includes(code)) return 2
  if (['RUN_TOP', 'RUN_BOT', '19DOOR', '1TOP'].includes(code)) return 1
  return 0
}

interface BetState {
  currentRound: LotteryRound | null
  betTypes: BetTypeInfo[]
  selectedBetTypes: BetType[]
  betSlip: BetSlipItem[]

  setCurrentRound: (round: LotteryRound) => void
  setBetTypes: (types: BetTypeInfo[]) => void
  toggleBetType: (type: BetType) => void
  getSelectedDigitCount: () => number
  addToBetSlip: (number: string, amount: number) => void
  removeFromBetSlip: (id: string) => void
  updateAmount: (id: string, amount: number) => void
  clearBetSlip: () => void
  getTotalAmount: () => number
  /** ⭐ ลบเลขซ้ำ — เก็บตัวแรกของแต่ละ betType+number */
  removeDuplicates: () => number

  // Backward compat
  selectedBetType: BetType | null
  selectBetType: (type: BetType) => void
}

export const useBetStore = create<BetState>()(
  persist(
    (set, get) => ({
      currentRound: null,
      betTypes: [],
      selectedBetTypes: [],
      betSlip: [],

      setCurrentRound: (round) => set({ currentRound: round }),
      setBetTypes: (types) => set({ betTypes: types }),

      // Toggle bet type: เลือก/ยกเลิก
      // ⭐ Conflict rules (ป้องกันเลือกซ้ำ/ขัดกัน):
      //   - PERM3 (กลับ) ↔ 3TOP (บน) → เลือกได้แค่อันเดียว (กลับ expand เป็นบน)
      //   - PERM2 (กลับ) ↔ 2TOP (บน) → เลือกได้แค่อันเดียว
      //   - ข้าม digit group → auto-clear กลุ่มเดิม
      toggleBetType: (type) => {
        const state = get()
        const clickedGroup = getDigitGroup(type)
        const currentGroups = state.selectedBetTypes.map(t => getDigitGroup(t))
        const currentGroup = currentGroups.length > 0 ? currentGroups[0] : null

        // ข้าม digit group → reset เลือกใหม่
        if (currentGroup !== null && currentGroup !== clickedGroup) {
          set({ selectedBetTypes: [type] })
          return
        }

        const already = state.selectedBetTypes.includes(type)
        if (already) {
          // ยกเลิกตัวที่เลือกอยู่
          set({ selectedBetTypes: state.selectedBetTypes.filter(t => t !== type) })
        } else {
          // ⭐ Conflict: ตัดตัวที่ขัดกันออกก่อนเพิ่มตัวใหม่
          const conflicts: Record<string, string[]> = {
            'PERM3': ['3TOP'],     // กลับ3 ขัดกับ บน3 (กลับ expand เป็นบน)
            '3TOP':  ['PERM3'],    // บน3 ขัดกับ กลับ3
            'PERM2': ['2TOP'],     // กลับ2 ขัดกับ บน2
            '2TOP':  ['PERM2'],    // บน2 ขัดกับ กลับ2
          }
          const toRemove = new Set(conflicts[type] || [])
          const cleaned = state.selectedBetTypes.filter(t => !toRemove.has(t))
          set({ selectedBetTypes: [...cleaned, type] })
        }
      },

      getSelectedDigitCount: () => {
        const state = get()
        if (state.selectedBetTypes.length === 0) return 0
        const info = state.betTypes.find(t => t.code === state.selectedBetTypes[0])
        return info?.digit_count || 0
      },

      // เพิ่ม bet ให้ *ทุก* type ที่เลือก
      addToBetSlip: (number, amount) => {
        const state = get()
        if (state.selectedBetTypes.length === 0) return

        const newItems: BetSlipItem[] = []

        for (const betType of state.selectedBetTypes) {
          // "กลับ" → expand เป็นหลาย bet
          if (betType === 'PERM3' as BetType) {
            const realType = state.betTypes.find(t => t.code === '3TOP')
            if (!realType) continue
            for (const perm of getPermutations(number)) {
              newItems.push({
                id: `3TOP-${perm}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                number: perm, betType: '3TOP' as BetType, betTypeName: '3 ตัวบน (กลับ)',
                amount, rate: realType.rate, potentialWin: amount * realType.rate,
              })
            }
            continue
          }
          if (betType === 'PERM2' as BetType) {
            const realType = state.betTypes.find(t => t.code === '2TOP')
            if (!realType) continue
            for (const perm of getPermutations(number)) {
              newItems.push({
                id: `2TOP-${perm}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                number: perm, betType: '2TOP' as BetType, betTypeName: '2 ตัวบน (กลับ)',
                amount, rate: realType.rate, potentialWin: amount * realType.rate,
              })
            }
            continue
          }

          // ประเภทปกติ
          const typeInfo = state.betTypes.find(t => t.code === betType)
          if (!typeInfo) continue
          newItems.push({
            id: `${betType}-${number}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            number, betType, betTypeName: typeInfo.name,
            amount, rate: typeInfo.rate, potentialWin: amount * typeInfo.rate,
          })
        }

        set((s) => ({ betSlip: [...s.betSlip, ...newItems] }))
      },

      removeFromBetSlip: (id) =>
        set((s) => ({ betSlip: s.betSlip.filter((item) => item.id !== id) })),

      updateAmount: (id, amount) =>
        set((s) => ({
          betSlip: s.betSlip.map((item) =>
            item.id === id ? { ...item, amount, potentialWin: amount * item.rate } : item
          ),
        })),

      clearBetSlip: () => set({ betSlip: [] }),
      getTotalAmount: () => get().betSlip.reduce((sum, item) => sum + item.amount, 0),

      // ⭐ ลบเลขซ้ำ — เก็บตัวแรกของแต่ละ betType+number
      removeDuplicates: () => {
        const state = get()
        const seen = new Set<string>()
        const unique: BetSlipItem[] = []
        let removed = 0
        for (const item of state.betSlip) {
          const key = `${item.betType}-${item.number}`
          if (seen.has(key)) {
            removed++
          } else {
            seen.add(key)
            unique.push(item)
          }
        }
        set({ betSlip: unique })
        return removed
      },

      // Backward compat
      get selectedBetType() {
        return get().selectedBetTypes[0] || null
      },
      selectBetType: (type) => {
        set({ selectedBetTypes: [type] })
      },
    }),
    {
      name: 'lotto-bet-slip', // ⭐ localStorage key
      partialize: (state) => ({ betSlip: state.betSlip }), // เก็บแค่ betSlip
      skipHydration: true, // ⭐ ป้องกัน SSR hydration mismatch — hydrate ฝั่ง client
    }
  )
)

// ⭐ Hydrate on client — เรียกใน useEffect ของ component หลัก
if (typeof window !== 'undefined') {
  useBetStore.persist.rehydrate()
}
