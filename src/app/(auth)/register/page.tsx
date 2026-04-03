/**
 * หน้าสมัครสมาชิก — minimal, clean design (แบบเดียวกับ login)
 *
 * Ref code: อ่านจาก URL ?ref=CODE → ส่งไป API ตอนสมัคร
 * ความสัมพันธ์:
 * - POST /api/v1/auth/register (member-api) → ref_code → referred_by
 */

'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Phone, Lock, Eye, EyeOff, User, CreditCard, ChevronDown } from 'lucide-react'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import BankIcon from '@/components/BankIcon'

const THAI_BANKS = [
  { code: 'SCB',   name: 'ไทยพาณิชย์' },
  { code: 'KBANK', name: 'กสิกรไทย' },
  { code: 'BBL',   name: 'กรุงเทพ' },
  { code: 'KTB',   name: 'กรุงไทย' },
  { code: 'BAY',   name: 'กรุงศรีอยุธยา' },
  { code: 'TTB',   name: 'ทหารไทยธนชาต' },
  { code: 'GSB',   name: 'ออมสิน' },
  { code: 'BAAC',  name: 'ธกส.' },
  { code: 'UOB',   name: 'ยูโอบี' },
  { code: 'CITI',  name: 'ซิตี้แบงก์' },
]

function translateError(msg: string): string {
  if (!msg) return 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่'
  const map: Record<string, string> = {
    'username already exists': 'เบอร์โทรนี้ถูกใช้สมัครแล้ว',
    'failed to hash password': 'เกิดข้อผิดพลาด กรุณาลองใหม่',
    'failed to create member': 'ไม่สามารถสร้างบัญชีได้ กรุณาลองใหม่',
    'invalid request': 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
  }
  const lower = msg.toLowerCase()
  for (const [key, thai] of Object.entries(map)) {
    if (lower.includes(key)) return thai
  }
  if (/[\u0E00-\u0E7F]/.test(msg)) return msg
  return 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่'
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const { setAuth } = useAuthStore()

  const refCodeFromUrl = searchParams.get('ref') || ''

  const [phone, setPhone] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!phone) { setError('กรุณากรอกเบอร์โทรศัพท์'); return }
    if (!/^\d{9,10}$/.test(phone)) { setError('เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก'); return }
    if (!fullName) { setError('กรุณากรอกชื่อ-สกุล'); return }
    if (!/^[a-zA-Zก-๏\s]+$/.test(fullName)) { setError('ชื่อ-สกุลต้องเป็นภาษาไทยหรืออังกฤษเท่านั้น'); return }
    if (!password) { setError('กรุณากรอกรหัสผ่าน'); return }
    if (password.length < 6) { setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return }
    if (accountNumber && !/^\d+$/.test(accountNumber)) { setError('เลขบัญชีต้องเป็นตัวเลขเท่านั้น'); return }
    setError('')
    setLoading(true)
    try {
      const res = await authApi.register({
        username: phone,
        password,
        phone,
        bank_code: bankCode,
        bank_account: accountNumber,
        full_name: fullName,
        ref_code: refCodeFromUrl,
      })
      const { member } = res.data.data
      setAuth(member)
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } }
      const msg = e.response?.data?.error || e.response?.data?.message || ''
      setError(translateError(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="reg-card">
        {/* Section title */}
        <h1 className="reg-title">สมัครสมาชิก</h1>

        {/* Info note */}
        <div className="reg-note">
          สมัครง่ายแค่กรอกข้อมูล เริ่มเล่นได้ทันที
          <br />ฝาก-ถอนรวดเร็ว ปลอดภัย 100%
        </div>

        {/* Ref code badge */}
        {refCodeFromUrl && (
          <div className="auth-ref-badge">
            แนะนำโดย <strong>{refCodeFromUrl}</strong>
          </div>
        )}

        {/* Error */}
        {error && <div className="auth-error">{error}</div>}

        {/* Form */}
        <div className="auth-form">
          {/* Phone */}
          <div className="auth-field">
            <label className="auth-label">เบอร์โทรศัพท์</label>
            <div className="auth-input-wrap">
              <Phone size={17} className="auth-input-icon" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                placeholder="0XX-XXX-XXXX"
                maxLength={10}
                className="auth-input"
              />
            </div>
          </div>

          {/* Full name */}
          <div className="auth-field">
            <label className="auth-label">ชื่อ-สกุล</label>
            <div className="auth-input-wrap">
              <User size={17} className="auth-input-icon" />
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value.replace(/[^a-zA-Zก-๏\s]/g, ''))}
                placeholder="ชื่อ สกุล (ไม่ต้องใส่คำนำหน้า)"
                className="auth-input"
              />
            </div>
          </div>

          {/* Bank */}
          <div className="auth-field">
            <label className="auth-label">ธนาคาร <span className="auth-optional">ไม่บังคับ</span></label>
            <div className="auth-input-wrap">
              {bankCode ? (
                <span className="auth-input-icon" style={{ pointerEvents: 'none' }}>
                  <BankIcon code={bankCode} size={20} />
                </span>
              ) : (
                <CreditCard size={17} className="auth-input-icon" />
              )}
              <select
                value={bankCode}
                onChange={e => setBankCode(e.target.value)}
                className="auth-input auth-select"
                style={{ color: bankCode ? 'var(--ios-label)' : 'var(--ios-tertiary-label)' }}
              >
                <option value="">เลือกธนาคาร</option>
                {THAI_BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
              <ChevronDown size={15} className="auth-select-arrow" />
            </div>
          </div>

          {/* Account number */}
          {bankCode && (
            <div className="auth-field">
              <label className="auth-label">เลขบัญชี</label>
              <div className="auth-input-wrap">
                <CreditCard size={17} className="auth-input-icon" />
                <input
                  type="text"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="เลขบัญชีธนาคาร"
                  maxLength={20}
                  inputMode="numeric"
                  className="auth-input"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label">รหัสผ่าน</label>
            <div className="auth-input-wrap">
              <Lock size={17} className="auth-input-icon" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                className="auth-input auth-input--pw"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="auth-pw-toggle"
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleRegister}
            disabled={loading}
            className="auth-btn auth-btn--primary"
          >
            {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </button>
        </div>

        {/* Footer */}
        <p className="auth-footer">
          มีบัญชีอยู่แล้ว?{' '}
          <Link href="/login" className="auth-link">เข้าสู่ระบบ</Link>
        </p>
      </div>

      <style>{authStyles}</style>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }} />}>
      <RegisterForm />
    </Suspense>
  )
}

/* ─── Styles ─── */
const authStyles = `
  .auth-page {
    min-height: calc(100dvh - 56px);
    background: var(--ios-bg);
    display: flex; flex-direction: column; align-items: center;
    padding: 24px 20px;
    font-family: var(--font-sarabun), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  /* ── Register layout ── */
  .reg-card {
    width: 100%; max-width: 600px;
    background: var(--ios-card);
    border: 1px solid var(--ios-separator);
    border-radius: 14px;
    padding: 20px 18px;
  }
  .reg-title {
    font-size: 20px; font-weight: 700; color: var(--ios-label);
    margin: 0 0 16px; text-align: center;
  }
  .reg-note {
    background: color-mix(in srgb, var(--accent-color) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent-color) 20%, transparent);
    border-radius: 10px; padding: 12px 16px;
    font-size: 14px; line-height: 1.6;
    color: var(--accent-color); text-align: center;
    margin-bottom: 20px;
  }
  .auth-ref-badge {
    background: color-mix(in srgb, var(--ios-green) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--ios-green) 25%, transparent);
    border-radius: 10px; padding: 10px 14px; margin-bottom: 20px;
    font-size: 13px; color: var(--ios-green); text-align: center;
  }
  .auth-error {
    background: color-mix(in srgb, var(--ios-red) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--ios-red) 15%, transparent);
    color: var(--ios-red); padding: 10px 14px; border-radius: 10px;
    font-size: 14px; text-align: center; margin-bottom: 20px;
  }
  .auth-form { display: flex; flex-direction: column; gap: 16px; }
  .auth-field { display: flex; flex-direction: column; gap: 6px; }
  .auth-label { font-size: 14px; font-weight: 600; color: var(--ios-label); }
  .auth-optional { font-size: 12px; font-weight: 400; color: var(--ios-secondary-label); }
  .auth-input-wrap { position: relative; display: flex; align-items: center; }
  .auth-input-icon { position: absolute; left: 14px; color: var(--ios-secondary-label); pointer-events: none; }
  .auth-input {
    width: 100%; box-sizing: border-box;
    background: var(--ios-card); border: 1px solid var(--ios-separator);
    border-radius: 10px; padding: 12px 14px 12px 42px;
    font-size: 16px; color: var(--ios-label); outline: none;
    transition: border-color 0.15s;
    font-family: inherit;
  }
  .auth-input::placeholder { color: var(--ios-tertiary-label); }
  .auth-input:focus { border-color: var(--accent-color); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 12%, transparent); }
  .auth-input--pw { padding-right: 44px; }
  .auth-select { appearance: none; cursor: pointer; padding-right: 40px; }
  .auth-select-arrow { position: absolute; right: 14px; color: var(--ios-secondary-label); pointer-events: none; }
  .auth-pw-toggle {
    position: absolute; right: 12px; background: none; border: none;
    cursor: pointer; color: var(--ios-secondary-label); display: flex; padding: 4px;
  }
  .auth-btn {
    width: 100%; padding: 13px; border-radius: 10px;
    font-size: 16px; font-weight: 600; border: none; cursor: pointer;
    transition: opacity 0.15s, transform 0.1s; margin-top: 4px;
    font-family: inherit;
  }
  .auth-btn:active:not(:disabled) { transform: scale(0.985); }
  .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .auth-btn--primary { background: var(--header-bg); color: white; }
  .auth-btn--primary:hover:not(:disabled) { opacity: 0.9; }
  .auth-footer { text-align: center; margin-top: 24px; font-size: 14px; color: var(--ios-secondary-label); }
  .auth-link { color: var(--accent-color); font-weight: 600; text-decoration: none; }
  .auth-link:hover { text-decoration: underline; }
`
