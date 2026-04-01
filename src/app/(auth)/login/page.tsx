/**
 * หน้า Login สำหรับสมาชิก (แบบเจริญดี88 — teal theme)
 *
 * ความสัมพันธ์:
 * - เรียก API: authApi.login() → standalone-member-api (#3)
 * - เก็บ state: useAuthStore → Zustand
 * - Login สำเร็จ → redirect ไป /dashboard
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await authApi.login({ username, password })
      const { access_token, refresh_token, member } = res.data.data
      setAuth(member, access_token, refresh_token)
      router.push('/dashboard')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
      {/* Logo */}
      <div className="mb-8 text-center">
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold shadow-lg"
          style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)' }}
        >
          L
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>LOTTO</h1>
        <p className="text-sm text-muted mt-1">หวยออนไลน์ จ่ายจริง ถอนไว</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm card p-6">
        <h2 className="text-lg font-bold text-center mb-6" style={{ color: 'var(--color-text)' }}>เข้าสู่ระบบ</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">ชื่อผู้ใช้</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg px-4 py-3 text-sm border border-gray-200 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
              style={{ background: 'var(--color-bg-card-alt)' }}
              placeholder="กรอก username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-4 py-3 text-sm border border-gray-200 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
              style={{ background: 'var(--color-bg-card-alt)' }}
              placeholder="กรอก password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm rounded-xl"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        {/* Demo Login — ข้ามการ login เพื่อทดสอบ UI */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => {
              setAuth(
                {
                  id: 1,
                  username: 'demo_user',
                  phone: '0812345678',
                  email: 'demo@lotto.com',
                  balance: 12500.50,
                  status: 'active',
                  created_at: '2025-01-15T00:00:00Z',
                },
                'demo-token-xxx',
                'demo-refresh-xxx'
              )
              router.push('/dashboard')
            }}
            className="btn-gold w-full py-3 text-sm rounded-xl"
          >
            เข้าสู่ระบบ Demo
          </button>
        </div>

        <p className="text-center mt-6 text-sm text-muted">
          ยังไม่มีบัญชี?{' '}
          <Link href="/register" className="font-semibold" style={{ color: 'var(--color-primary)' }}>
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </div>
  )
}
