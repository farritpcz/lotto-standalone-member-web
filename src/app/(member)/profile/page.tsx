// Page: /profile (member) — Premium design (เจริญดี88 / luxury lotto style)
// Related: components/profile/*
//
// โครงสร้าง:
// - Profile Header: avatar gradient + ชื่อ + level badge + balance
// - Level progress card (rolling 30d)
// - ข้อมูลบัญชี: card แบบ iOS grouped (แก้ไขได้)
// - บัญชีธนาคาร
// - การตั้งค่า: ธีม + push notification toggle
// - เมนู: ประวัติ / อัตราจ่าย / กฎกติกา / แนะนำเพื่อน
// - เปลี่ยนรหัสผ่าน + ออกจากระบบ

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronRight, Shield, CreditCard, LogOut,
  History, Percent, BookOpen, UserPlus,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useThemeStore } from '@/store/theme-store'
import BankIcon from '@/components/BankIcon'
import { useToast } from '@/components/Toast'
import { memberApi, api as apiClient, type MemberLevelInfo } from '@/lib/api'
import { usePushNotification } from '@/hooks/usePushNotification'

import { SectionCard, InfoRow } from '@/components/profile/SectionCard'
import { LevelProgressCard } from '@/components/profile/LevelProgressCard'
import { ProfileHeaderCard } from '@/components/profile/ProfileHeaderCard'
import { SettingsCard } from '@/components/profile/SettingsCard'
import { PasswordChangeForm } from '@/components/profile/PasswordChangeForm'

export default function ProfilePage() {
  const router = useRouter()
  void router
  const { member, updateMember } = useAuthStore()
  const { mode: themeMode, setMode: setThemeMode } = useThemeStore()
  const { toast } = useToast()
  const push = usePushNotification()

  // ─── State ──────────────────────────────────────────────────
  const [email, setEmail] = useState(member?.email || '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPwForm, setShowPwForm] = useState(false)
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [mounted, setMounted] = useState(false)
  // ⭐ Avatar upload
  const avatarUrl = member?.avatar_url || ''
  const [avatarUploading, setAvatarUploading] = useState(false)

  // ⭐ Member Level v3 (2026-04-20) — คำนวณจากยอดฝาก rolling 30 วัน
  const [levelInfo, setLevelInfo] = useState<MemberLevelInfo | null>(null)

  // ─── Mount animation ───────────────────────────────────────
  useEffect(() => { setMounted(true) }, [])

  // ─── โหลดข้อมูลระดับสมาชิก ────────────────────────────────
  //   อ้างอิง: docs/rules/profile_level.md
  useEffect(() => {
    let cancel = false
    memberApi.getMyLevel()
      .then(res => { if (!cancel) setLevelInfo(res.data?.data || null) })
      .catch(() => { /* silent — แค่ไม่แสดง section (มี fallback) */ })
    return () => { cancel = true }
  }, [])

  // ─── Avatar Upload Handler ─────────────────────────────────
  // ⚠️ [Security] client-side validate: jpeg/png/webp/gif, <500KB
  // backend enforce อีกที (imageguard)
  const handleAvatarFile = async (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowed.includes(file.type)) {
      toast.error('รองรับ jpg, png, gif, webp เท่านั้น')
      return
    }
    if (file.size > 500 * 1024) {
      toast.error('ไฟล์ใหญ่เกิน 500KB')
      return
    }
    setAvatarUploading(true)
    try {
      // [1] upload ไป R2 → ได้ URL
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'avatar')
      const upRes = await apiClient.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      const url = upRes.data?.data?.url
      if (!url) throw new Error('no url')

      // [2] บันทึก URL ไป profile
      await memberApi.updateProfile({ avatar_url: url })
      updateMember({ avatar_url: url })
      toast.success('อัพโหลดรูปโปรไฟล์สำเร็จ')
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'อัพโหลดไม่สำเร็จ'
      toast.error(msg)
    } finally {
      setAvatarUploading(false)
    }
  }

  // ─── Handlers ──────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await memberApi.updateProfile({ email })
      updateMember({ email })
      toast.success('บันทึกข้อมูลสำเร็จ')
      setEditing(false)
    } catch {
      toast.error('บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally { setSaving(false) }
  }

  const handleChangePw = async () => {
    setSaving(true)
    try {
      const { api } = await import('@/lib/api')
      await api.put('/member/password', { old_password: oldPw, new_password: newPw })
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่')
      setShowPwForm(false)
      setOldPw('')
      setNewPw('')
      setTimeout(() => {
        fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
        window.location.href = '/login'
      }, 1500)
    } catch {
      toast.error('รหัสผ่านเดิมไม่ถูกต้อง')
    } finally { setSaving(false) }
  }

  const handleLogout = () => {
    fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    try { localStorage.removeItem('lotto-auth') } catch {}
    window.location.href = '/login'
  }

  // ─── วันที่สมัคร format ──────────────────────────────────
  const joinDate = member?.created_at
    ? new Date(member.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
    : '-'

  // ─── Input style สำหรับ form ────────────────────────────
  const inputStyle = {
    display: 'block', width: '100%', boxSizing: 'border-box' as const,
    padding: '10px 14px', fontSize: 15, color: 'var(--ios-label)',
    background: 'var(--ios-bg)', border: '1.5px solid var(--ios-separator)',
    borderRadius: 10, outline: 'none', transition: 'border-color 0.2s',
  }

  return (
    <div style={{ paddingBottom: 32, opacity: mounted ? 1 : 0, transition: 'opacity 0.3s ease' }}>

      {/* ─── Profile Header — avatar + level + balance ─── */}
      <div style={{ padding: '12px 16px 0' }}>
        <ProfileHeaderCard
          username={member?.username}
          avatarUrl={avatarUrl}
          balance={member?.balance || 0}
          joinDate={joinDate}
          levelInfo={levelInfo}
          avatarUploading={avatarUploading}
          onAvatarFileSelect={handleAvatarFile}
        />
      </div>

      {/* ⭐ Member Level v3 — progress + rolling 30d explanation */}
      {levelInfo && (levelInfo.current_level || levelInfo.next_level) && (
        <div style={{ padding: '12px 16px 0' }}>
          <LevelProgressCard info={levelInfo} />
        </div>
      )}

      {/* ─── ข้อมูลบัญชี ─── */}
      <div style={{ padding: '12px 16px 0' }}>
        <SectionCard
          title="ข้อมูลบัญชี"
          action={!editing ? (
            <button onClick={() => setEditing(true)} style={{
              fontSize: 13, fontWeight: 600, color: 'var(--ios-green)',
              background: 'color-mix(in srgb, var(--accent-color) 10%, transparent)', border: 'none', cursor: 'pointer',
              padding: '5px 14px', borderRadius: 20,
            }}>
              แก้ไข
            </button>
          ) : undefined}
        >
          <InfoRow label="ชื่อผู้ใช้" value={member?.username || '-'} icon="👤" dimmed />
          <InfoRow label="เบอร์โทร" value={member?.phone || '-'} icon="📱" dimmed />
          <InfoRow label="อีเมล" icon="✉️" noBorder={!editing}
            value={editing ? undefined : (member?.email || '-')}
            input={editing ? (
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle} placeholder="กรอกอีเมล" />
            ) : undefined}
          />
        </SectionCard>

        {/* Save / Cancel buttons */}
        {editing && (
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button onClick={handleSaveProfile} disabled={saving} style={{
              flex: 1, padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 700,
              color: 'white', background: `linear-gradient(135deg, var(--accent-color), color-mix(in srgb, var(--accent-color) 70%, #000))`,
              border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1, boxShadow: '0 4px 14px color-mix(in srgb, var(--accent-color) 30%, transparent)',
            }}>
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            <button onClick={() => { setEditing(false); setEmail(member?.email || '') }} style={{
              flex: 1, padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 600,
              color: 'var(--ios-secondary-label)', background: 'var(--ios-card)',
              border: '1px solid var(--ios-separator)', cursor: 'pointer',
            }}>
              ยกเลิก
            </button>
          </div>
        )}
      </div>

      {/* ─── บัญชีธนาคาร ─── */}
      <div style={{ padding: '12px 16px 0' }}>
        <SectionCard title="บัญชีธนาคาร" titleIcon={<CreditCard size={16} strokeWidth={2} />}>
          <InfoRow label="ธนาคาร" icon="🏦"
            value={member?.bank_code ? undefined : '-'}
            input={member?.bank_code ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 2 }}>
                <BankIcon code={member.bank_code} size={26} showName />
              </div>
            ) : undefined}
          />
          <InfoRow label="เลขบัญชี" icon="🔢"
            value={member?.bank_account_number || '-'}
            mono
          />
          <InfoRow label="ชื่อบัญชี" icon="📝" noBorder
            value={member?.bank_account_name || '-'}
          />
          <div style={{ padding: '8px 16px 12px', fontSize: 11, color: 'var(--ios-tertiary-label)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Shield size={10} strokeWidth={2} />
            หากต้องการเปลี่ยนบัญชีธนาคาร กรุณาติดต่อแอดมิน
          </div>
        </SectionCard>
      </div>

      {/* ─── การตั้งค่า ─── */}
      <div style={{ padding: '12px 16px 0' }}>
        <SettingsCard themeMode={themeMode} setThemeMode={setThemeMode} push={push} />
      </div>

      {/* ─── เมนู ─── */}
      <div style={{ padding: '12px 16px 0' }}>
        <SectionCard>
          {[
            { label: 'ประวัติการเล่น', href: '/history', icon: History, color: '#007AFF' },
            { label: 'อัตราจ่าย', href: '/rates', icon: Percent, color: '#FF9F0A' },
            { label: 'กฎกติกา', href: '/rules', icon: BookOpen, color: '#5856D6' },
            { label: 'แนะนำเพื่อน', href: '/referral', icon: UserPlus, color: '#34C759' },
          ].map((item, i, arr) => (
            <a key={item.label} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
              textDecoration: 'none', color: 'var(--ios-label)',
              borderBottom: i < arr.length - 1 ? '0.5px solid var(--ios-separator)' : 'none',
              fontSize: 15, transition: 'background 0.15s',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: `${item.color}15`, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <item.icon size={17} strokeWidth={2} color={item.color} />
              </div>
              <span style={{ flex: 1, fontWeight: 500 }}>{item.label}</span>
              <ChevronRight size={16} strokeWidth={2} style={{ color: 'var(--ios-tertiary-label)' }} />
            </a>
          ))}
        </SectionCard>
      </div>

      {/* ─── เปลี่ยนรหัสผ่าน ─── */}
      <div style={{ padding: '12px 16px 0' }}>
        <PasswordChangeForm
          show={showPwForm}
          setShow={setShowPwForm}
          oldPw={oldPw}
          setOldPw={setOldPw}
          newPw={newPw}
          setNewPw={setNewPw}
          saving={saving}
          onSubmit={handleChangePw}
        />
      </div>

      {/* ─── ออกจากระบบ ─── */}
      <div style={{ padding: '12px 16px 24px' }}>
        <div style={{
          background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
        }}>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '14px 16px', fontSize: 15, fontWeight: 500,
            color: '#FF3B30', background: 'none', border: 'none', cursor: 'pointer',
          }}>
            <LogOut size={17} strokeWidth={2} />
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  )
}
