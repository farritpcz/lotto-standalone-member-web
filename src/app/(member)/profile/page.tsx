/**
 * =============================================================================
 * หน้า Profile — Premium Design (เจริญดี88 / luxury lotto style)
 * =============================================================================
 *
 * โครงสร้าง:
 * - Profile Header: avatar gradient + ชื่อ + level badge + balance
 * - Quick Stats: ยอดแทงรวม / รอบที่เล่น / แนะนำเพื่อน
 * - ข้อมูลบัญชี: card แบบ iOS grouped (แก้ไขได้)
 * - บัญชีธนาคาร: card แสดงข้อมูลธนาคาร
 * - การตั้งค่า: ธีม + push notification toggle
 * - เมนู: ประวัติ / อัตราจ่าย / กฎกติกา / แนะนำเพื่อน
 * - เปลี่ยนรหัสผ่าน + ออกจากระบบ
 *
 * ใช้โดย: BottomNav tab "บัญชี"
 * =============================================================================
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown, ChevronRight, Sun, Moon, Monitor,
  Shield, Clock, Users, TrendingUp, CreditCard,
  KeyRound, LogOut, Bell, BellOff,
  History, Percent, BookOpen, UserPlus,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useThemeStore } from '@/store/theme-store'
import BankIcon from '@/components/BankIcon'
import { useToast } from '@/components/Toast'
import { memberApi } from '@/lib/api'
import { usePushNotification } from '@/hooks/usePushNotification'

export default function ProfilePage() {
  const router = useRouter()
  const { member, updateMember } = useAuthStore()
  const { mode: themeMode, setMode: setThemeMode } = useThemeStore()
  const { toast } = useToast()
  const push = usePushNotification()

  // ─── State ──────────────────────────────────────────────────
  const [phone, setPhone] = useState(member?.phone || '')
  const [email, setEmail] = useState(member?.email || '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPwForm, setShowPwForm] = useState(false)
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [mounted, setMounted] = useState(false)

  // ─── Mount animation ───────────────────────────────────────
  useEffect(() => { setMounted(true) }, [])

  // ─── Handlers ──────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await memberApi.updateProfile({ phone, email })
      updateMember({ phone, email })
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

  // ─── สร้าง initials สำหรับ avatar ─────────────────────────
  const initial = member?.username?.charAt(0).toUpperCase() || 'U'

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

      {/* ═══════════════════════════════════════════════════════════
          Profile Header — Premium gradient card + avatar
          ═══════════════════════════════════════════════════════════ */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{
          position: 'relative', overflow: 'hidden', borderRadius: 20,
          background: 'var(--card-gradient)',
          padding: '24px 20px 20px',
        }}>
          {/* ลายพื้นหลัง premium */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.06,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px',
          }} />

          {/* Avatar + Info row */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Avatar — gradient ring + initial */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, var(--accent-color), color-mix(in srgb, var(--accent-color) 60%, #5AC8FA))`,
              padding: 3, boxShadow: '0 4px 20px color-mix(in srgb, var(--accent-color) 30%, transparent)',
            }}>
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: 'var(--nav-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent-color)', fontSize: 28, fontWeight: 800,
                fontFamily: 'var(--font-geist-sans), sans-serif',
              }}>
                {initial}
              </div>
            </div>

            {/* User info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: 'white', fontWeight: 700, fontSize: 20, lineHeight: 1.2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {member?.username || 'สมาชิก'}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                marginTop: 6, padding: '3px 10px', borderRadius: 20,
                background: 'color-mix(in srgb, var(--accent-color) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-color) 30%, transparent)',
              }}>
                <Shield size={11} strokeWidth={2.5} style={{ color: 'var(--accent-color)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-color)', letterSpacing: 0.3 }}>
                  MEMBER
                </span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} strokeWidth={2} />
                สมาชิกตั้งแต่ {joinDate}
              </div>
            </div>
          </div>

          {/* Balance row */}
          <div style={{
            marginTop: 16, padding: '12px 16px', borderRadius: 14,
            background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginBottom: 2 }}>
                ยอดเงินคงเหลือ
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-color)', fontFamily: 'var(--font-geist-mono), monospace' }}>
                ฿{(member?.balance || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'color-mix(in srgb, var(--accent-color) 15%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent-color) 20%, transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp size={22} strokeWidth={2} style={{ color: 'var(--accent-color)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ข้อมูลบัญชี — iOS grouped card style
          ═══════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════
          บัญชีธนาคาร
          ═══════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════
          การตั้งค่า — ธีม + Push Notification
          ═══════════════════════════════════════════════════════════ */}
      <div style={{ padding: '12px 16px 0' }}>
        <SectionCard title="การตั้งค่า">
          {/* Theme selector */}
          <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--ios-separator)' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ios-secondary-label)', marginBottom: 8 }}>ธีม</div>
            <div style={{ display: 'flex', gap: 0, background: 'var(--ios-bg)', borderRadius: 10, padding: 3 }}>
              {([
                { value: 'light' as const, icon: Sun, label: 'สว่าง' },
                { value: 'dark' as const, icon: Moon, label: 'มืด' },
                { value: 'system' as const, icon: Monitor, label: 'ระบบ' },
              ]).map(({ value, icon: Icon, label }) => (
                <button key={value} onClick={() => setThemeMode(value)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  padding: '9px 4px', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer',
                  fontWeight: themeMode === value ? 600 : 400,
                  color: themeMode === value ? 'var(--ios-label)' : 'var(--ios-secondary-label)',
                  background: themeMode === value ? 'var(--ios-card)' : 'transparent',
                  boxShadow: themeMode === value ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s',
                }}>
                  <Icon size={14} strokeWidth={2} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Push notification toggle */}
          {push.isSupported && (
            <button onClick={() => push.isSubscribed ? push.unsubscribe() : push.subscribe()}
              disabled={push.loading || push.permission === 'denied'}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 15, color: 'var(--ios-label)', textAlign: 'left',
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: push.isSubscribed ? 'color-mix(in srgb, var(--accent-color) 12%, transparent)' : 'rgba(142,142,147,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {push.isSubscribed
                  ? <Bell size={17} strokeWidth={2} style={{ color: 'var(--accent-color)' }} />
                  : <BellOff size={17} strokeWidth={2} color="#8E8E93" />
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>แจ้งเตือน Push</div>
                <div style={{ fontSize: 12, color: 'var(--ios-secondary-label)', marginTop: 1 }}>
                  {push.permission === 'denied' ? 'ถูกบล็อก (เปิดใน browser settings)'
                    : push.isSubscribed ? 'เปิดอยู่ — รับแจ้งเตือนแม้ปิดเว็บ'
                    : 'ปิดอยู่ — กดเพื่อเปิดรับแจ้งเตือน'}
                </div>
              </div>
              {/* Toggle indicator */}
              <div style={{
                width: 44, height: 26, borderRadius: 13, padding: 2,
                background: push.isSubscribed ? 'var(--accent-color)' : 'var(--ios-fill)',
                transition: 'background 0.25s',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transform: push.isSubscribed ? 'translateX(18px)' : 'translateX(0)',
                  transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />
              </div>
            </button>
          )}
        </SectionCard>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          เมนู — icon + label + chevron
          ═══════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════
          เปลี่ยนรหัสผ่าน
          ═══════════════════════════════════════════════════════════ */}
      <div style={{ padding: '12px 16px 0' }}>
        <SectionCard>
          <button onClick={() => setShowPwForm(!showPwForm)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 15, fontWeight: 500, color: 'var(--ios-label)', textAlign: 'left',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8, background: 'rgba(255,159,10,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <KeyRound size={17} strokeWidth={2} color="#FF9F0A" />
            </div>
            <span style={{ flex: 1 }}>เปลี่ยนรหัสผ่าน</span>
            <ChevronDown size={16} strokeWidth={2} style={{
              color: 'var(--ios-tertiary-label)', transition: 'transform 0.25s',
              transform: showPwForm ? 'rotate(180deg)' : 'none',
            }} />
          </button>

          {showPwForm && (
            <div style={{ borderTop: '0.5px solid var(--ios-separator)', padding: '16px' }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--ios-secondary-label)', marginBottom: 6, fontWeight: 500 }}>
                  รหัสผ่านเดิม
                </label>
                <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)}
                  placeholder="กรอกรหัสผ่านเดิม" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--ios-secondary-label)', marginBottom: 6, fontWeight: 500 }}>
                  รหัสผ่านใหม่
                </label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัว)" style={inputStyle} />
              </div>
              <button onClick={handleChangePw} disabled={saving || !oldPw || !newPw} style={{
                display: 'block', width: '100%', padding: '14px', borderRadius: 14,
                fontSize: 15, fontWeight: 700, color: 'white',
                background: (saving || !oldPw || !newPw) ? 'var(--ios-fill)' : 'linear-gradient(135deg, #FF9F0A, #FF6B00)',
                border: 'none', cursor: (saving || !oldPw || !newPw) ? 'not-allowed' : 'pointer',
                boxShadow: (saving || !oldPw || !newPw) ? 'none' : '0 4px 14px rgba(255,159,10,0.3)',
                transition: 'all 0.2s',
              }}>
                {saving ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
              </button>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ออกจากระบบ
          ═══════════════════════════════════════════════════════════ */}
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

// =============================================================================
// Sub-components — SectionCard + InfoRow
// =============================================================================

/** SectionCard — iOS grouped card wrapper */
function SectionCard({ title, titleIcon, action, children }: {
  title?: string
  titleIcon?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden',
      boxShadow: 'var(--shadow-card)',
    }}>
      {title && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 16px', borderBottom: '0.5px solid var(--ios-separator)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {titleIcon}
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ios-label)' }}>{title}</span>
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

/** InfoRow — แถวแสดงข้อมูล (label + value) */
function InfoRow({ label, value, icon, dimmed, mono, noBorder, input }: {
  label: string
  value?: string
  icon?: string
  dimmed?: boolean
  mono?: boolean
  noBorder?: boolean
  input?: React.ReactNode
}) {
  return (
    <div style={{
      padding: '10px 16px',
      borderBottom: noBorder ? 'none' : '0.5px solid var(--ios-separator)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
        <span style={{ fontSize: 12, color: 'var(--ios-secondary-label)', fontWeight: 500 }}>{label}</span>
      </div>
      {input || (
        <div style={{
          fontSize: 15, color: 'var(--ios-label)',
          opacity: dimmed ? 0.6 : 1,
          fontFamily: mono ? 'var(--font-geist-mono), monospace' : 'inherit',
          letterSpacing: mono ? 1 : 0,
          fontWeight: 500,
        }}>
          {value}
        </div>
      )}
    </div>
  )
}
