/**
 * Auth Store — จัดการ authentication state ด้วย Zustand
 *
 * เก็บ: member info, JWT tokens
 * Persist: localStorage (อยู่ได้หลัง refresh)
 *
 * ความสัมพันธ์:
 * - ใช้โดย: ทุก page ที่ต้อง auth
 * - ใช้ร่วมกับ: api.ts (อ่าน token จาก localStorage)
 * - provider-game-web (#8) ใช้ store คล้ายกัน แต่เก็บ launch token แทน JWT
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Member } from '@/types'

interface AuthState {
  // State
  member: Member | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean

  // Actions
  setAuth: (member: Member, accessToken: string, refreshToken: string) => void
  logout: () => void
  updateMember: (member: Partial<Member>) => void
  updateBalance: (balance: number) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      member: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      // Login / Register สำเร็จ → เก็บ state
      setAuth: (member, accessToken, refreshToken) => {
        // เก็บ token ใน localStorage ให้ api.ts interceptor อ่านได้
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)

        set({
          member,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        })
      },

      // Logout → ลบ state + token ทั้งหมด
      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')

        set({
          member: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      // อัพเดท member info (เช่น หลังแก้ profile)
      updateMember: (updates) =>
        set((state) => ({
          member: state.member ? { ...state.member, ...updates } : null,
        })),

      // อัพเดทยอดเงิน (เช่น หลังแทงหวย, หลังฝาก/ถอน)
      // เรียกบ่อยมาก — แทงทีนึงก็ต้อง update
      updateBalance: (balance) =>
        set((state) => ({
          member: state.member ? { ...state.member, balance } : null,
        })),
    }),
    {
      name: 'lotto-auth', // localStorage key
      partialize: (state) => ({
        // เก็บเฉพาะที่จำเป็น (ไม่เก็บ functions)
        member: state.member,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
