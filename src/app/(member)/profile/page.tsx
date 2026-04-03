/**
 * หน้า Profile — iOS 17 HIG Design
 * บัญชีผู้ใช้, แก้ไขโปรไฟล์, เปลี่ยนรหัสผ่าน, logout
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, Sun, Moon, Monitor } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useThemeStore } from '@/store/theme-store'
import { useToast } from '@/components/Toast'
import { memberApi } from '@/lib/api'

export default function ProfilePage() {
  const router = useRouter()
  const { member, updateMember, logout } = useAuthStore()
  const { mode: themeMode, setMode: setThemeMode } = useThemeStore()
  const { toast } = useToast()

  const [phone, setPhone] = useState(member?.phone || '')
  const [email, setEmail] = useState(member?.email || '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [showPwForm, setShowPwForm] = useState(false)
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await memberApi.updateProfile({ phone, email })
      updateMember({ phone, email })
      toast.success('บันทึกข้อมูลสำเร็จ')
      setEditing(false)
    } catch {
      toast.error('บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePw = async () => {
    setSaving(true)
    try {
      const { api } = await import('@/lib/api')
      await api.put('/member/password', { old_password: oldPw, new_password: newPw })
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ')
      setShowPwForm(false)
      setOldPw('')
      setNewPw('')
    } catch {
      toast.error('รหัสผ่านเดิมไม่ถูกต้อง')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    // เรียก API ลบ cookie ก่อน แล้ว redirect (ไม่ง้อ auth store)
    try {
      const { api } = await import('@/lib/api')
      await api.post('/auth/logout')
    } catch {}
    // ลบ Zustand persist
    try { localStorage.removeItem('lotto-auth') } catch {}
    window.location.href = '/login'
  }

  const inputStyle = {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: '6px 0 12px',
    fontSize: 16,
    color: 'var(--ios-label)',
    background: 'transparent',
    border: 'none',
    outline: 'none',
  }

  return (
    <div>
      {/* Profile Header — balance card style */}
      <div style={{ padding: '16px 16px 8px' }}>
        <div className="balance-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 24,
            fontWeight: 700,
            flexShrink: 0,
          }}>
            {member?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>{member?.username || 'สมาชิก'}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>
              สมาชิกตั้งแต่ {member?.created_at ? new Date(member.created_at).toLocaleDateString('th-TH') : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Info — iOS grouped input style */}
      <div style={{ padding: '8px 16px' }}>
        <div style={{
          background: 'var(--ios-card)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '0.5px solid var(--ios-separator)' }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>ข้อมูลบัญชี</span>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--ios-green)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                แก้ไข
              </button>
            )}
          </div>

          {/* Username (read-only) */}
          <div style={{ padding: '0 16px', borderBottom: '0.5px solid var(--ios-separator)' }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ios-secondary-label)', paddingTop: 10, marginBottom: 2 }}>
              ชื่อผู้ใช้
            </label>
            <div style={{ fontSize: 16, color: 'var(--ios-label)', paddingBottom: 12, opacity: 0.6 }}>
              {member?.username || '-'}
            </div>
          </div>

          {/* Phone (read-only — แก้ได้เฉพาะแอดมินจากหลังบ้าน) */}
          <div style={{ padding: '0 16px', borderBottom: '0.5px solid var(--ios-separator)' }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ios-secondary-label)', paddingTop: 10, marginBottom: 2 }}>
              เบอร์โทร
            </label>
            <div style={{ fontSize: 16, color: 'var(--ios-label)', paddingBottom: 12, opacity: 0.6 }}>
              {member?.phone || '-'}
            </div>
          </div>

          {/* Email */}
          <div style={{ padding: '0 16px' }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ios-secondary-label)', paddingTop: 10, marginBottom: 2 }}>
              อีเมล
            </label>
            {editing ? (
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
              />
            ) : (
              <div style={{ fontSize: 16, paddingBottom: 12, color: 'var(--ios-label)' }}>{member?.email || '-'}</div>
            )}
          </div>
        </div>

        {/* Save / Cancel buttons */}
        {editing && (
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              style={{
                flex: 1,
                padding: '13px',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                color: 'white',
                background: 'var(--ios-green)',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
                minHeight: 50,
              }}
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            <button
              onClick={() => setEditing(false)}
              style={{
                flex: 1,
                padding: '13px',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--ios-secondary-label)',
                background: 'var(--ios-card)',
                border: 'none',
                cursor: 'pointer',
                minHeight: 50,
              }}
            >
              ยกเลิก
            </button>
          </div>
        )}
      </div>

      {/* ── ข้อมูลบัญชีธนาคาร ──────────────────────────── */}
      <div style={{ padding: '0 16px', marginBottom: 8 }}>
        <div style={{ background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 0' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ios-label)' }}>บัญชีธนาคาร</span>
          </div>

          <div style={{ padding: '0 16px', borderBottom: '0.5px solid var(--ios-separator)' }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ios-secondary-label)', paddingTop: 10, marginBottom: 2 }}>
              ธนาคาร
            </label>
            <div style={{ fontSize: 16, color: 'var(--ios-label)', paddingBottom: 12 }}>
              {member?.bank_code || '-'}
            </div>
          </div>

          <div style={{ padding: '0 16px', borderBottom: '0.5px solid var(--ios-separator)' }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ios-secondary-label)', paddingTop: 10, marginBottom: 2 }}>
              เลขบัญชี
            </label>
            <div style={{ fontSize: 16, color: 'var(--ios-label)', paddingBottom: 12, fontFamily: 'monospace', letterSpacing: 1 }}>
              {member?.bank_account_number || '-'}
            </div>
          </div>

          <div style={{ padding: '0 16px' }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ios-secondary-label)', paddingTop: 10, marginBottom: 2 }}>
              ชื่อบัญชี
            </label>
            <div style={{ fontSize: 16, color: 'var(--ios-label)', paddingBottom: 14 }}>
              {member?.bank_account_name || '-'}
            </div>
          </div>

          <div style={{ padding: '8px 16px 14px', fontSize: 12, color: 'var(--ios-secondary-label)' }}>
            * หากต้องการเปลี่ยนบัญชีธนาคาร กรุณาติดต่อแอดมิน
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div style={{ padding: '8px 16px' }}>
        <div style={{ background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <button
            onClick={() => setShowPwForm(!showPwForm)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--ios-label)',
            }}
          >
            <span>เปลี่ยนรหัสผ่าน</span>
            <ChevronDown size={18} strokeWidth={2}
              style={{
                color: 'var(--ios-secondary-label)',
                transition: 'transform 0.2s',
                transform: showPwForm ? 'rotate(180deg)' : 'none',
              }} />
          </button>

          {showPwForm && (
            <div style={{ borderTop: '0.5px solid var(--ios-separator)', padding: '0 16px 16px' }}>
              <div style={{ borderBottom: '0.5px solid var(--ios-separator)' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--ios-secondary-label)', paddingTop: 10, marginBottom: 2 }}>
                  รหัสผ่านเดิม
                </label>
                <input
                  type="password"
                  value={oldPw}
                  onChange={e => setOldPw(e.target.value)}
                  placeholder="กรอกรหัสผ่านเดิม"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--ios-secondary-label)', paddingTop: 10, marginBottom: 2 }}>
                  รหัสผ่านใหม่
                </label>
                <input
                  type="password"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่"
                  style={inputStyle}
                />
              </div>
              <button
                onClick={handleChangePw}
                disabled={saving || !oldPw || !newPw}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '13px',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'white',
                  background: 'var(--ios-green)',
                  border: 'none',
                  cursor: (saving || !oldPw || !newPw) ? 'not-allowed' : 'pointer',
                  opacity: (saving || !oldPw || !newPw) ? 0.4 : 1,
                  minHeight: 50,
                }}
              >
                {saving ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Theme Toggle — iOS style segmented control */}
      <div style={{ padding: '8px 16px' }}>
        <div style={{ background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)', padding: '14px 16px' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)', marginBottom: 10 }}>
            ธีม
          </div>
          <div style={{
            display: 'flex',
            gap: 0,
            background: 'var(--ios-bg)',
            borderRadius: 10,
            padding: 3,
          }}>
            {([
              { value: 'light' as const, icon: Sun, label: 'สว่าง' },
              { value: 'dark' as const, icon: Moon, label: 'มืด' },
              { value: 'system' as const, icon: Monitor, label: 'ระบบ' },
            ]).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setThemeMode(value)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  padding: '8px 4px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: themeMode === value ? 600 : 400,
                  color: themeMode === value ? 'var(--ios-label)' : 'var(--ios-secondary-label)',
                  background: themeMode === value ? 'var(--ios-card)' : 'transparent',
                  boxShadow: themeMode === value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={15} strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div style={{ padding: '8px 16px' }}>
        <div style={{ background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          {[
            { label: 'ประวัติการเล่น', href: '/history', emoji: '📋' },
            { label: 'อัตราจ่าย', href: '/rates', emoji: '💹' },
            { label: 'กฎกติกา', href: '/rules', emoji: '📜' },
            { label: 'แนะนำเพื่อน', href: '/referral', emoji: '👥' },
          ].map((item, i, arr) => (
            <a
              key={item.label}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '13px 16px',
                textDecoration: 'none',
                color: 'var(--ios-label)',
                borderBottom: i < arr.length - 1 ? '0.5px solid var(--ios-separator)' : 'none',
                fontSize: 15,
              }}
            >
              <span style={{ fontSize: 20, width: 24, textAlign: 'center' }}>{item.emoji}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              <ChevronRight size={14} strokeWidth={2} style={{ color: 'var(--ios-tertiary-label)' }} />
            </a>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div style={{ padding: '8px 16px 32px' }}>
        <div style={{ background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'block',
              width: '100%',
              padding: '14px 16px',
              fontSize: 15,
              fontWeight: 400,
              color: 'var(--ios-red)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  )
}
