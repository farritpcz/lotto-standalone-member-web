/**
 * หน้า Profile — บัญชีผู้ใช้ (แบบเจริญดี88 — teal theme)
 *
 * แสดง: ข้อมูลโปรไฟล์ + แก้ไข + เปลี่ยนรหัสผ่าน + logout
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { memberApi } from '@/lib/api'

export default function ProfilePage() {
  const router = useRouter()
  const { member, updateMember, logout } = useAuthStore()

  const [phone, setPhone] = useState(member?.phone || '')
  const [email, setEmail] = useState(member?.email || '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // เปลี่ยนรหัสผ่าน
  const [showPwForm, setShowPwForm] = useState(false)
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await memberApi.updateProfile({ phone, email })
      updateMember({ phone, email })
      setMessage('บันทึกสำเร็จ')
      setEditing(false)
    } catch {
      setMessage('บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePw = async () => {
    setSaving(true)
    try {
      const { api } = await import('@/lib/api')
      await api.put('/member/password', { old_password: oldPw, new_password: newPw })
      setMessage('เปลี่ยนรหัสผ่านสำเร็จ')
      setShowPwForm(false)
      setOldPw('')
      setNewPw('')
    } catch {
      setMessage('รหัสผ่านเดิมไม่ถูกต้อง')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const isError = message && message.includes('ไม่')

  return (
    <div>
      {/* Profile Header */}
      <div className="p-4">
        <div className="balance-card flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {member?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div className="text-white font-bold text-lg">{member?.username || 'สมาชิก'}</div>
            <div className="text-white/60 text-xs mt-0.5">
              สมาชิกตั้งแต่ {member?.created_at ? new Date(member.created_at).toLocaleDateString('th-TH') : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="px-4 mb-2">
          <div className={`rounded-lg px-4 py-2.5 text-sm font-medium text-center ${
            isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
          }`}>
            {isError ? '✗' : '✓'} {message}
          </div>
        </div>
      )}

      {/* Profile Info */}
      <div className="px-4 mb-3">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm">ข้อมูลบัญชี</h3>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ color: 'var(--color-primary)', background: 'rgba(13,110,110,0.08)' }}
              >
                แก้ไข
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-medium text-muted uppercase tracking-wider">ชื่อผู้ใช้</label>
              <div className="font-medium text-sm mt-0.5">{member?.username || '-'}</div>
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted uppercase tracking-wider">เบอร์โทร</label>
              {editing ? (
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm border border-gray-200 focus:border-teal-500 focus:outline-none mt-1"
                  style={{ background: 'var(--color-bg-card-alt)' }}
                />
              ) : (
                <div className="font-medium text-sm mt-0.5">{member?.phone || '-'}</div>
              )}
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted uppercase tracking-wider">อีเมล</label>
              {editing ? (
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm border border-gray-200 focus:border-teal-500 focus:outline-none mt-1"
                  style={{ background: 'var(--color-bg-card-alt)' }}
                />
              ) : (
                <div className="font-medium text-sm mt-0.5">{member?.email || '-'}</div>
              )}
            </div>
          </div>

          {editing && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="btn-primary flex-1 py-2.5 text-sm rounded-lg"
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: 'var(--color-bg-card-alt)', color: 'var(--color-text-secondary)' }}
              >
                ยกเลิก
              </button>
            </div>
          )}
        </div>
      </div>

      {/* เปลี่ยนรหัสผ่าน */}
      <div className="px-4 mb-3">
        <div className="card p-4">
          <button
            onClick={() => setShowPwForm(!showPwForm)}
            className="w-full flex items-center justify-between"
          >
            <span className="font-bold text-sm">เปลี่ยนรหัสผ่าน</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-5 h-5 text-muted transition ${showPwForm ? 'rotate-180' : ''}`}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showPwForm && (
            <div className="mt-4 space-y-3">
              <input
                type="password"
                placeholder="รหัสผ่านเดิม"
                value={oldPw}
                onChange={e => setOldPw(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm border border-gray-200 focus:border-teal-500 focus:outline-none"
                style={{ background: 'var(--color-bg-card-alt)' }}
              />
              <input
                type="password"
                placeholder="รหัสผ่านใหม่"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm border border-gray-200 focus:border-teal-500 focus:outline-none"
                style={{ background: 'var(--color-bg-card-alt)' }}
              />
              <button
                onClick={handleChangePw}
                disabled={saving || !oldPw || !newPw}
                className="btn-primary w-full py-2.5 text-sm rounded-lg"
              >
                {saving ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 mb-3">
        <div className="card overflow-hidden">
          {[
            { label: 'ประวัติการเล่น', href: '/history', icon: '📋' },
            { label: 'อัตราจ่าย', href: '/results', icon: '💹' },
            { label: 'กฎกติกา', href: '#', icon: '📜' },
            { label: 'แนะนำเพื่อน', href: '#', icon: '👥' },
          ].map((item, i) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 p-3.5 hover:bg-gray-50 transition ${
                i > 0 ? 'border-t border-gray-100' : ''
              }`}
              style={{ textDecoration: 'none', color: 'var(--color-text)' }}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-muted">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 pb-6">
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl font-bold text-sm text-red-500 transition"
          style={{ background: 'rgba(229,62,62,0.06)' }}
        >
          ออกจากระบบ
        </button>
      </div>
    </div>
  )
}
