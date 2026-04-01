/**
 * หน้า Profile — ดู/แก้ไขโปรไฟล์สมาชิก + เปลี่ยนรหัสผ่าน + logout
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
      setMessage('✅ บันทึกสำเร็จ')
      setEditing(false)
    } catch {
      setMessage('❌ บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePw = async () => {
    setSaving(true)
    try {
      const { api } = await import('@/lib/api')
      await api.put('/member/password', { old_password: oldPw, new_password: newPw })
      setMessage('✅ เปลี่ยนรหัสผ่านสำเร็จ')
      setShowPwForm(false)
      setOldPw('')
      setNewPw('')
    } catch {
      setMessage('❌ รหัสผ่านเดิมไม่ถูกต้อง')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-white mb-6">โปรไฟล์</h1>

      {message && (
        <div className={`rounded-lg px-4 py-2 mb-4 text-sm ${message.includes('✅') ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
          {message}
        </div>
      )}

      {/* ข้อมูลโปรไฟล์ */}
      <div className="bg-gray-800 rounded-xl p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {member?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-white font-semibold">{member?.username}</div>
            <div className="text-gray-400 text-sm">สมาชิกตั้งแต่ {member?.created_at ? new Date(member.created_at).toLocaleDateString('th-TH') : '-'}</div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-gray-400 text-xs">เบอร์โทร</label>
            {editing ? (
              <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 mt-1" />
            ) : (
              <div className="text-white">{member?.phone || '-'}</div>
            )}
          </div>
          <div>
            <label className="text-gray-400 text-xs">อีเมล</label>
            {editing ? (
              <input value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 mt-1" />
            ) : (
              <div className="text-white">{member?.email || '-'}</div>
            )}
          </div>
        </div>

        <div className="mt-4">
          {editing ? (
            <div className="flex gap-2">
              <button onClick={handleSaveProfile} disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm">
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              <button onClick={() => setEditing(false)} className="flex-1 bg-gray-700 text-gray-300 py-2 rounded-lg text-sm">ยกเลิก</button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="w-full bg-gray-700 text-gray-300 py-2 rounded-lg text-sm hover:bg-gray-600">แก้ไขโปรไฟล์</button>
          )}
        </div>
      </div>

      {/* เปลี่ยนรหัสผ่าน */}
      <div className="bg-gray-800 rounded-xl p-5 mb-4">
        <button onClick={() => setShowPwForm(!showPwForm)} className="w-full text-left text-white font-semibold text-sm flex justify-between items-center">
          เปลี่ยนรหัสผ่าน <span className="text-gray-500">{showPwForm ? '▲' : '▼'}</span>
        </button>
        {showPwForm && (
          <div className="mt-3 space-y-3">
            <input type="password" placeholder="รหัสผ่านเดิม" value={oldPw} onChange={e => setOldPw(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2" />
            <input type="password" placeholder="รหัสผ่านใหม่" value={newPw} onChange={e => setNewPw(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2" />
            <button onClick={handleChangePw} disabled={saving || !oldPw || !newPw}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm disabled:bg-gray-600">
              {saving ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
            </button>
          </div>
        )}
      </div>

      {/* Logout */}
      <button onClick={handleLogout} className="w-full bg-red-600/20 text-red-400 py-3 rounded-xl font-semibold hover:bg-red-600/30 transition">
        ออกจากระบบ
      </button>
    </div>
  )
}
