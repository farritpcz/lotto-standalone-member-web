/**
 * AuthGuard — ตรวจสอบ session จริงตอน mount
 *
 * ปัญหาที่แก้:
 * - Zustand persist เก็บ isAuthenticated=true ใน localStorage
 * - แต่ httpOnly cookie อาจหมดอายุ/ไม่มี
 * - ทำให้ app แสดง dashboard ได้ แต่ API call fail 401
 *
 * วิธีแก้:
 * - Mount → เรียก GET /member/profile (ใช้ httpOnly cookie)
 * - ถ้าสำเร็จ → อัพเดท member info ล่าสุด
 * - ถ้า 401 → clear auth store → redirect /login
 */

'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { memberApi } from '@/lib/api'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, setAuth, logout } = useAuthStore()
  const validated = useRef(false)

  useEffect(() => {
    // ตรวจสอบ session ครั้งเดียวตอน mount
    if (validated.current) return
    validated.current = true

    // ถ้า store บอกว่า authenticated → verify กับ backend
    if (isAuthenticated) {
      memberApi.getProfile()
        .then((res) => {
          // อัพเดท member info ล่าสุด (เผื่อมีการเปลี่ยนแปลง)
          if (res.data?.data) {
            setAuth(res.data.data)
          }
        })
        .catch(() => {
          // Cookie หมดอายุ/invalid → clear auth + redirect login
          logout()
          router.replace('/login')
        })
    }
  }, [isAuthenticated, setAuth, logout, router])

  return <>{children}</>
}
