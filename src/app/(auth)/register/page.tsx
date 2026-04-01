/**
 * หน้าสมัครสมาชิก — layout เดียวกับหน้า login (ทรงเจริญดี88)
 *
 * Layout:
 * 1. Header (dark teal + logo + hamburger) — เหมือน login
 * 2. Banner (gradient) — เหมือน login
 * 3. Form card: เบอร์, ธนาคาร, เลขบัญชี, ชื่อ-สกุล, รหัสผ่าน
 * 4. Game providers (horizontal scroll) — เหมือน login
 * 5. Quick links — เหมือน login
 *
 * ⭐ Ref code: อ่านจาก URL ?ref=CODE → ส่งไป API ตอนสมัคร
 * ความสัมพันธ์:
 * - POST /api/v1/auth/register (member-api #3) → ref_code → referred_by
 * - หน้า referral (#4) ใช้ ref code จาก link ที่สร้างใน referral handler
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

// ── Constants ──────────────────────────────────────────────────────────────────
const CARD_BG = '#ffffff'
const BTN_GREEN = '#1e5c48'
const BTN_NAVY = '#1e3560'
const INPUT_BG = '#f5f5f5'

const providers = [
  { name: 'PRAGMATIC\nPLAY', bg: '#1a2a1a', color: '#f0c040' },
  { name: 'DREAM\nGAMING',   bg: '#1a2a3a', color: '#c0a040' },
  { name: 'SPADE\nGAMING',   bg: '#2a1a2a', color: '#c0c0c0' },
  { name: 'SA\nGAMING',      bg: '#0a1a2e', color: '#4488ff' },
  { name: 'JOKER',           bg: '#0a0a0a', color: '#ff4444' },
  { name: 'PG\nSOFT',        bg: '#1a1a2e', color: '#a0c0ff' },
]

const THAI_BANKS = [
  { code: 'SCB',   name: 'ธนาคารไทยพาณิชย์' },
  { code: 'KBANK', name: 'ธนาคารกสิกรไทย' },
  { code: 'BBL',   name: 'ธนาคารกรุงเทพ' },
  { code: 'KTB',   name: 'ธนาคารกรุงไทย' },
  { code: 'BAY',   name: 'ธนาคารกรุงศรีอยุธยา' },
  { code: 'TTB',   name: 'ธนาคารทหารไทยธนชาต' },
  { code: 'GSB',   name: 'ธนาคารออมสิน' },
  { code: 'BAAC',  name: 'ธนาคาร ธกส.' },
  { code: 'UOB',   name: 'ธนาคารยูโอบี' },
  { code: 'CITI',  name: 'ซิตี้แบงก์' },
]

// แปลง error messages จาก API เป็นภาษาไทย
function translateError(msg: string): string {
  if (!msg) return 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่'
  const map: Record<string, string> = {
    'username already exists': 'เบอร์โทรนี้ถูกใช้สมัครแล้ว กรุณาใช้เบอร์อื่น',
    'failed to hash password': 'เกิดข้อผิดพลาดในการตั้งรหัสผ่าน กรุณาลองใหม่',
    'failed to create member': 'ไม่สามารถสร้างบัญชีได้ กรุณาลองใหม่ภายหลัง',
    'invalid request': 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
  }
  const lower = msg.toLowerCase()
  for (const [key, thai] of Object.entries(map)) {
    if (lower.includes(key)) return thai
  }
  // ถ้า msg เป็นภาษาไทยอยู่แล้ว ใช้ได้เลย
  if (/[\u0E00-\u0E7F]/.test(msg)) return msg
  return 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่'
}

// ── Inner component (useSearchParams ต้องอยู่ใน Suspense) ──────────────────────
function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuthStore()

  // อ่าน ref code จาก URL (?ref=CODE) — สำหรับ affiliate referral
  const refCodeFromUrl = searchParams.get('ref') || ''

  const [phone, setPhone] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // ── Input filters ──────────────────────────────────────────────────────────
  // เบอร์โทร: ตัวเลขเท่านั้น
  const handlePhoneChange = (v: string) => setPhone(v.replace(/\D/g, ''))
  // เลขบัญชี: ตัวเลขเท่านั้น
  const handleAccountChange = (v: string) => setAccountNumber(v.replace(/\D/g, ''))
  // ชื่อ-สกุล: ไทย/อังกฤษ/เว้นวรรคเท่านั้น ห้ามตัวเลข+อักษรพิเศษ
  const handleNameChange = (v: string) => setFullName(v.replace(/[^a-zA-Zก-๏\s]/g, ''))

  const handleRegister = async () => {
    if (!phone) { setError('กรุณากรอกเบอร์โทรศัพท์'); return }
    if (!/^\d{9,10}$/.test(phone)) { setError('เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก'); return }
    if (!fullName) { setError('กรุณากรอกชื่อ-สกุล'); return }
    if (!/^[a-zA-Zก-๏\s]+$/.test(fullName)) { setError('ชื่อ-สกุลต้องเป็นภาษาไทยหรืออังกฤษเท่านั้น'); return }
    if (!password) { setError('กรุณากรอกรหัสผ่าน'); return }
    if (password.length < 6) { setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return }
    if (accountNumber && !/^\d+$/.test(accountNumber)) { setError('เลขบัญชีธนาคารต้องเป็นตัวเลขเท่านั้น'); return }
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
        // ⭐ ส่ง ref_code ไป API เพื่อผูก referred_by → commission_job คำนวณค่าคอมทีหลัง
        ref_code: refCodeFromUrl,
      })
      const { access_token, refresh_token, member } = res.data.data
      setAuth(member, access_token, refresh_token)
      router.push('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } }
      const msg = e.response?.data?.error || e.response?.data?.message || ''
      // แปลง error จาก API (ภาษาอังกฤษ) เป็นภาษาไทย
      setError(translateError(msg))
    } finally {
      setLoading(false)
    }
  }

  // shared input style
  const fieldStyle = {
    width: '100%',
    boxSizing: 'border-box' as const,
    background: INPUT_BG,
    border: '1px solid #e8e8e8',
    borderRadius: 10,
    padding: '13px 14px 13px 46px',
    fontSize: 15,
    color: '#333',
    outline: 'none',
  }
  const iconWrap = {
    position: 'absolute' as const,
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#aaa',
    display: 'flex',
  }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* ===== Banner (เหมือน login) ===== */}
      <div style={{
        background: 'linear-gradient(135deg, #0d3d2e 0%, #1a6a4a 40%, #0a2a1e 100%)',
        height: 160,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%, rgba(255,200,0,0.08) 0%, transparent 70%)' }} />
        <div style={{ textAlign: 'center', padding: '0 24px', position: 'relative' }}>
          <div style={{ color: '#f0c060', fontSize: 13, fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>LOTTO ONLINE</div>
          <div style={{ color: 'white', fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginBottom: 6 }}>
            สมัครสมาชิก <span style={{ color: '#f0c060' }}>ฟรี!</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>
            สมัครง่าย รับโบนัสทันที ครบจบในเว็บเดียว
          </div>
        </div>
        <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 48, opacity: 0.15 }}>🎲</div>
        <div style={{ position: 'absolute', left: 12, top: 20, fontSize: 32, opacity: 0.12 }}>🎰</div>
      </div>

      {/* ===== Form Card ===== */}
      <div style={{ background: CARD_BG, margin: 0, padding: '20px 16px' }}>

        {/* แสดง ref code ถ้ามี */}
        {refCodeFromUrl && (
          <div style={{ background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#1a8a40', textAlign: 'center' }}>
            🎁 คุณถูกเชิญโดย <strong>{refCodeFromUrl}</strong> — รับโบนัสพิเศษ!
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(255,59,48,0.08)', border: '0.5px solid rgba(255,59,48,0.2)', color: '#cc2020', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 14, textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Phone */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 8 }}>เบอร์โทรศัพท์</label>
            <div style={{ position: 'relative' }}>
              <span style={iconWrap}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18 }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.38 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
              <input type="tel" value={phone} onChange={e => handlePhoneChange(e.target.value)} placeholder="099999999" maxLength={10}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                style={fieldStyle} />
            </div>
          </div>

          {/* Bank */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 8 }}>บัญชีธนาคาร</label>
            <div style={{ position: 'relative' }}>
              <select value={bankCode} onChange={e => setBankCode(e.target.value)}
                style={{ ...fieldStyle, paddingLeft: 14, appearance: 'none', cursor: 'pointer', color: bankCode ? '#333' : '#aaa' }}>
                <option value="" disabled>เลือกธนาคาร</option>
                {THAI_BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 16, height: 16 }}><polyline points="6 9 12 15 18 9" /></svg>
              </span>
            </div>
          </div>

          {/* Account number */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 8 }}>เลขบัญชีธนาคาร</label>
            <div style={{ position: 'relative' }}>
              <span style={iconWrap}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18 }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              </span>
              <input type="text" value={accountNumber} onChange={e => handleAccountChange(e.target.value)}
                placeholder="กรอกเลขบัญชีธนาคาร" maxLength={20} inputMode="numeric" style={fieldStyle} />
            </div>
          </div>

          {/* Full name */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 8 }}>ชื่อ-สกุล</label>
            <div style={{ position: 'relative' }}>
              <span style={iconWrap}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18 }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input type="text" value={fullName} onChange={e => handleNameChange(e.target.value)}
                placeholder="ชื่อ-สกุล (ไม่ต้องใส่คำนำหน้า)" style={fieldStyle} />
            </div>
            <p style={{ fontSize: 12, color: '#e05050', marginTop: 5 }}>
              กรอกชื่อ-สกุล ไม่ต้องกรอกคำนำหน้า และไม่ต้องใส่เครื่องหมาย (-)
            </p>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 8 }}>รหัสผ่าน</label>
            <div style={{ position: 'relative' }}>
              <span style={iconWrap}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                placeholder="ตั้งรหัสผ่าน (อย่างน้อย 6 ตัว)"
                style={{ ...fieldStyle, paddingRight: 44 }} />
              <button onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', padding: 2 }}>
                {showPw
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18 }}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                }
              </button>
            </div>
          </div>

          {/* Register button */}
          <button onClick={handleRegister} disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', padding: '14px', borderRadius: 10,
              background: BTN_NAVY, color: 'white',
              fontSize: 16, fontWeight: 700,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, marginBottom: 10, minHeight: 50,
            }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 18, height: 18 }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </button>

          {/* Login link */}
          <Link href="/login"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', padding: '14px', borderRadius: 10,
              background: BTN_GREEN, color: 'white',
              fontSize: 16, fontWeight: 700,
              textDecoration: 'none', marginBottom: 10, minHeight: 50,
              boxSizing: 'border-box',
            }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 18, height: 18 }}>
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            เข้าสู่ระบบ (มีบัญชีแล้ว)
          </Link>
        </div>
      </div>

      {/* ===== Game Providers (เหมือน login) ===== */}
      <div style={{ background: CARD_BG, borderTop: '6px solid #f0f0f0', padding: '12px 0' }}>
        <div style={{ display: 'flex', gap: 8, padding: '0 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {providers.map(p => (
            <div key={p.name} style={{
              background: p.bg, borderRadius: 8,
              width: 90, height: 56, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: p.color,
              textAlign: 'center', whiteSpace: 'pre', lineHeight: 1.3, cursor: 'pointer',
            }}>
              {p.name}
            </div>
          ))}
        </div>
      </div>

      {/* ===== Quick Links (เหมือน login) ===== */}
      <div style={{ background: CARD_BG, borderTop: '6px solid #f0f0f0', padding: '12px 16px 16px' }}>
        <Link href="/rates" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f5f5f5', borderRadius: 10, padding: '13px 16px', textDecoration: 'none', color: '#444', fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 20, height: 20, color: '#666' }}>
            <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          อัตราจ่าย
        </Link>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Link href="/rules" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f5f5f5', borderRadius: 10, padding: '13px 14px', textDecoration: 'none', color: '#444', fontSize: 14, fontWeight: 500 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 18, height: 18, color: '#666' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
            กฎและกติกา
          </Link>
          <Link href="/login" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f5f5f5', borderRadius: 10, padding: '13px 14px', textDecoration: 'none', color: '#444', fontSize: 14, fontWeight: 500 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 18, height: 18, color: '#666' }}>
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>

      <div style={{ height: 32, background: '#f0f0f0' }} />
    </div>
  )
}

// ── Export หลัก (ครอบ Suspense เพราะใช้ useSearchParams) ─────────────────────
export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ background: '#2a4a3a', minHeight: '100dvh' }} />}>
      <RegisterForm />
    </Suspense>
  )
}
