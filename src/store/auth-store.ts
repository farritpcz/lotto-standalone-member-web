/**
 * Auth Store — จัดการ authentication state ด้วย Zustand
 *
 * เก็บ: member info + isAuthenticated
 * JWT token: เก็บใน httpOnly cookie (browser จัดการ) — ไม่เก็บใน localStorage/state แล้ว
 * Persist: localStorage เฉพาะ member info (อยู่ได้หลัง refresh)
 *
 * ความสัมพันธ์:
 * - ใช้โดย: ทุก page ที่ต้อง auth
 * - api.ts ใช้ withCredentials: true → browser ส่ง httpOnly cookie เอง
 * - provider-game-web (#8) ใช้ store คล้ายกัน แต่เก็บ launch token แทน JWT
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Member } from '@/types'
import { api } from '@/lib/api'

interface AuthState {
  // State
  member: Member | null
  isAuthenticated: boolean

  // Actions
  setAuth: (member: Member) => void
  logout: () => void
  updateMember: (member: Partial<Member>) => void
  updateBalance: (balance: number) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      member: null,
      isAuthenticated: false,

      // Login / Register สำเร็จ → เก็บเฉพาะ member info
      // ⭐ JWT token อยู่ใน httpOnly cookie แล้ว (set โดย backend)
      setAuth: (member) => {
        set({
          member,
          isAuthenticated: true,
        })
      },

      // Logout → ลบ state + เรียก API ลบ cookie + ล้าง cache
      logout: () => {
        // เรียก backend ลบ httpOnly cookie
        api.post('/auth/logout').catch(() => {})
        // ⭐ ล้าง API cache ตอน logout
        import('@/lib/api').then(m => m.clearApiCache()).catch(() => {})

        set({
          member: null,
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
        // เก็บเฉพาะ member info (ไม่มี token แล้ว)
        member: state.member,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
