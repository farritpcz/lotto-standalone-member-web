/**
 * Bet Store — จัดการ state การแทงหวย (bet slip)
 *
 * เก็บ: รายการ bet ที่เลือกไว้ (ยังไม่ส่ง), ประเภทหวยที่กำลังเล่น
 *
 * ความสัมพันธ์:
 * - ใช้โดย: หน้าแทงหวย, bet-slip component
 * - provider-game-web (#8) ใช้ store เดียวกันเป๊ะ
 *   TODO: แยกเป็น @lotto/stores npm package ในอนาคต
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

interface BetState {
  // State
  currentRound: LotteryRound | null  // รอบที่กำลังแทง
  betTypes: BetTypeInfo[]            // ประเภทการแทงที่ใช้ได้
  selectedBetType: BetType | null    // ประเภทที่เลือกอยู่
  betSlip: BetSlipItem[]             // รายการใน bet slip

  // Actions
  setCurrentRound: (round: LotteryRound) => void
  setBetTypes: (types: BetTypeInfo[]) => void
  selectBetType: (type: BetType) => void

  /** เพิ่ม bet ลง slip */
  addToBetSlip: (number: string, amount: number) => void

  /** ลบ bet ออกจาก slip */
  removeFromBetSlip: (id: string) => void

  /** แก้จำนวนเงิน */
  updateAmount: (id: string, amount: number) => void

  /** ล้าง bet slip ทั้งหมด */
  clearBetSlip: () => void

  /** คำนวณยอดรวม */
  getTotalAmount: () => number
}

export const useBetStore = create<BetState>((set, get) => ({
  // Initial state
  currentRound: null,
  betTypes: [],
  selectedBetType: null,
  betSlip: [],

  setCurrentRound: (round) => set({ currentRound: round }),
  setBetTypes: (types) => set({ betTypes: types }),
  selectBetType: (type) => set({ selectedBetType: type }),

  addToBetSlip: (number, amount) => {
    const state = get()
    const betType = state.selectedBetType
    if (!betType) return

    // หา rate จาก betTypes
    const typeInfo = state.betTypes.find((t) => t.code === betType)
    if (!typeInfo) return

    const item: BetSlipItem = {
      id: `${betType}-${number}-${Date.now()}`,
      number,
      betType,
      betTypeName: typeInfo.name,
      amount,
      rate: typeInfo.rate,
      potentialWin: amount * typeInfo.rate,
    }

    set((s) => ({ betSlip: [...s.betSlip, item] }))
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
}))
