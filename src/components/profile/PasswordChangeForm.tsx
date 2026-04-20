// Component: PasswordChangeForm — collapsible password change form
// Parent: src/app/(member)/profile/page.tsx

import { ChevronDown, KeyRound } from 'lucide-react'
import { SectionCard } from './SectionCard'

const inputStyle = {
  display: 'block', width: '100%', boxSizing: 'border-box' as const,
  padding: '10px 14px', fontSize: 15, color: 'var(--ios-label)',
  background: 'var(--ios-bg)', border: '1.5px solid var(--ios-separator)',
  borderRadius: 10, outline: 'none', transition: 'border-color 0.2s',
}

export interface PasswordChangeFormProps {
  show: boolean
  setShow: (v: boolean) => void
  oldPw: string
  setOldPw: (v: string) => void
  newPw: string
  setNewPw: (v: string) => void
  saving: boolean
  onSubmit: () => void
}

export function PasswordChangeForm({
  show, setShow, oldPw, setOldPw, newPw, setNewPw, saving, onSubmit,
}: PasswordChangeFormProps) {
  return (
    <SectionCard>
      <button onClick={() => setShow(!show)} style={{
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
          transform: show ? 'rotate(180deg)' : 'none',
        }} />
      </button>

      {show && (
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
          <button onClick={onSubmit} disabled={saving || !oldPw || !newPw} style={{
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
  )
}
