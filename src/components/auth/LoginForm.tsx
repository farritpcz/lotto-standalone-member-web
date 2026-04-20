// Component: LoginForm — phone + password form with error display
// Parent: src/app/(auth)/login/page.tsx
'use client'

import Link from 'next/link'
import { Phone, Lock, Eye, EyeOff, UserPlus } from 'lucide-react'

interface Props {
  phone: string
  setPhone: (v: string) => void
  password: string
  setPassword: (v: string) => void
  showPw: boolean
  setShowPw: (v: boolean) => void
  error: string
  loading: boolean
  onLogin: () => void
}

export default function LoginForm({
  phone, setPhone, password, setPassword,
  showPw, setShowPw, error, loading, onLogin,
}: Props) {
  return (
    <div className="auth-card">
      {error && <div className="auth-error">{error}</div>}

      <div className="auth-form">
        <div className="auth-field">
          <label className="auth-label">เบอร์โทรศัพท์</label>
          <div className="auth-input-wrap">
            <Phone size={17} className="auth-input-icon" />
            <input
              type="tel" value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && onLogin()}
              placeholder="0XX-XXX-XXXX" maxLength={10}
              className="auth-input"
            />
          </div>
        </div>

        <div className="auth-field">
          <div className="auth-label-row">
            <label className="auth-label">รหัสผ่าน</label>
            <a href="#" className="auth-forgot">ลืมรหัสผ่าน?</a>
          </div>
          <div className="auth-input-wrap">
            <Lock size={17} className="auth-input-icon" />
            <input
              type={showPw ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onLogin()}
              placeholder="รหัสผ่าน"
              className="auth-input auth-input--pw"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="auth-pw-toggle">
              {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <button onClick={onLogin} disabled={loading} className="auth-btn auth-btn--primary">
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>

        <Link href="/register" className="auth-btn auth-btn--register">
          <UserPlus size={17} strokeWidth={2.5} />
          สมัครสมาชิก
        </Link>
      </div>
    </div>
  )
}
