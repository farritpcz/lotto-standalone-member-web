/**
 * หน้า Login — ทรงเจริญดี88 (ตาม reference image)
 *
 * Layout:
 * 1. Header (dark teal + logo + hamburger)
 * 2. Banner รูปเต็มบน
 * 3. Form card: เบอร์ (full) + รหัสผ่าน (full) + ลืมรหัสผ่าน + ปุ่ม stack
 * 4. Game providers (horizontal scroll)
 * 5. Quick links grid
 * 6. ผลรางวัล section
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi, lotteryApi, resultApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import type { LotteryTypeInfo, LotteryRound } from '@/types'

const CARD_BG = '#ffffff'
const BTN_GREEN = '#1e5c48'
const BTN_NAVY = '#1e3560'
const INPUT_BG = '#f5f5f5'

const lotteryIcons: Record<string, string> = {
  THAI: '🇹🇭', LAO: '🇱🇦', STOCK_TH: '📈', STOCK_FOREIGN: '🌍', YEEKEE: '🎯', CUSTOM: '🎲',
}

const lotteryBgColors: Record<string, string> = {
  THAI: '#EFF6FF', LAO: '#FFF1F0', STOCK_TH: '#F0FFF4',
  STOCK_FOREIGN: '#F5F0FF', YEEKEE: '#FFF8F0', CUSTOM: '#F5F5F5',
}

const providers = [
  { name: 'PRAGMATIC\nPLAY', bg: '#1a2a1a', color: '#f0c040' },
  { name: 'DREAM\nGAMING', bg: '#1a2a3a', color: '#c0a040' },
  { name: 'SPADE\nGAMING', bg: '#2a1a2a', color: '#c0c0c0' },
  { name: 'SA\nGAMING', bg: '#0a1a2e', color: '#4488ff' },
  { name: 'JOKER', bg: '#0a0a0a', color: '#ff4444' },
  { name: 'PG\nSOFT', bg: '#1a1a2e', color: '#a0c0ff' },
]

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lotteries, setLotteries] = useState<LotteryTypeInfo[]>([])
  const [latestResults, setLatestResults] = useState<LotteryRound[]>([])

  useEffect(() => {
    lotteryApi.getTypes().then(res => setLotteries(res.data.data || [])).catch(() => {})
    resultApi.getResults({ per_page: 3 }).then(res => setLatestResults(res.data.data?.items || [])).catch(() => {})
  }, [])

  const handleLogin = async () => {
    if (!phone || !password) { setError('กรุณากรอกข้อมูล'); return }
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login({ username: phone, password })
      const { access_token, refresh_token, member } = res.data.data
      setAuth(member, access_token, refresh_token)
      router.push('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      const msg = e.response?.data?.message || ''
      // แปลง error จาก API เป็นภาษาไทย
      const errorMap: Record<string, string> = {
        'invalid username or password': 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง',
        'account is suspended': 'บัญชีถูกระงับ กรุณาติดต่อผู้ดูแลระบบ',
        'invalid credentials': 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง',
      }
      const lower = msg.toLowerCase()
      const thaiMsg = Object.entries(errorMap).find(([k]) => lower.includes(k))?.[1]
        || (/[\u0E00-\u0E7F]/.test(msg) ? msg : 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่')
      setError(thaiMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = () => {
    setAuth(
      { id: 1, username: 'demo_user', phone: '0812345678', email: 'demo@lotto.com', balance: 12500.50, status: 'active', created_at: '2025-01-15T00:00:00Z' },
      'demo-token-xxx', 'demo-refresh-xxx'
    )
    router.push('/dashboard')
  }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* ===== Promo Banner (full width image) ===== */}
      <div style={{
        background: 'linear-gradient(135deg, #0d3d2e 0%, #1a6a4a 40%, #0a2a1e 100%)',
        height: 180,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%, rgba(255,200,0,0.08) 0%, transparent 70%)' }} />
        <div style={{ textAlign: 'center', padding: '0 24px', position: 'relative' }}>
          <div style={{ color: '#f0c060', fontSize: 13, fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>LOTTO ONLINE</div>
          <div style={{ color: 'white', fontSize: 26, fontWeight: 800, lineHeight: 1.2, marginBottom: 6 }}>
            คาสิโน <span style={{ color: '#f0c060' }}>สล็อตออนไลน์</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 12 }}>
            การันตีด้วยค่ายเกมทุกค่ายชั้นนำ
          </div>
          <div style={{
            display: 'inline-block',
            background: BTN_GREEN,
            color: 'white',
            padding: '6px 20px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 700,
          }}>
            ครบจบในเว็บเดียว
          </div>
        </div>
        {/* Dice decoration */}
        <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 48, opacity: 0.15 }}>🎲</div>
        <div style={{ position: 'absolute', left: 12, top: 20, fontSize: 32, opacity: 0.12 }}>🎰</div>
      </div>

      {/* ===== Form Card ===== */}
      <div style={{ background: CARD_BG, margin: '0', padding: '20px 16px' }}>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(255,59,48,0.08)', border: '0.5px solid rgba(255,59,48,0.2)', color: '#cc2020', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 14, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Phone input */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 8 }}>เบอร์โทรศัพท์</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#aaa', display: 'flex' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18 }}>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.38 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="099999999"
              style={{ width: '100%', boxSizing: 'border-box', background: INPUT_BG, border: '1px solid #e8e8e8', borderRadius: 10, padding: '13px 14px 13px 44px', fontSize: 16, color: '#333', outline: 'none' }}
            />
          </div>
        </div>

        {/* Password input */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 8 }}>รหัสผ่าน</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#aaa', display: 'flex' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••••"
              style={{ width: '100%', boxSizing: 'border-box', background: INPUT_BG, border: '1px solid #e8e8e8', borderRadius: 10, padding: '13px 44px 13px 44px', fontSize: 16, color: '#333', outline: 'none' }}
            />
            <button
              onClick={() => setShowPw(!showPw)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', padding: 2 }}
            >
              {showPw
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18 }}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              }
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div style={{ textAlign: 'right', marginBottom: 18 }}>
          <a href="#" style={{ fontSize: 13, color: BTN_GREEN, fontWeight: 500, textDecoration: 'none' }}>
            ลืมรหัสผ่าน? คลิกที่นี่
          </a>
        </div>

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', padding: '14px', borderRadius: 10,
            background: BTN_GREEN, color: 'white',
            fontSize: 16, fontWeight: 700,
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            marginBottom: 10, minHeight: 50,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 18, height: 18 }}>
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>

        {/* Register button */}
        <Link
          href="/register"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', padding: '14px', borderRadius: 10,
            background: BTN_NAVY, color: 'white',
            fontSize: 16, fontWeight: 700,
            textDecoration: 'none', marginBottom: 10, minHeight: 50,
            boxSizing: 'border-box',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 18, height: 18 }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
          สมัครสมาชิก
        </Link>

        {/* Demo */}
        <button
          onClick={handleDemo}
          style={{
            display: 'block', width: '100%',
            background: 'transparent', color: '#888',
            padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 500,
            border: '1px solid #e0e0e0', cursor: 'pointer',
          }}
        >
          ทดลองเล่น (Demo)
        </button>
      </div>

      {/* ===== Game Providers (horizontal scroll) ===== */}
      <div style={{ background: CARD_BG, borderTop: '6px solid #f0f0f0', padding: '12px 0' }}>
        <div style={{ display: 'flex', gap: 8, padding: '0 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {providers.map(p => (
            <div
              key={p.name}
              style={{
                background: p.bg,
                borderRadius: 8,
                width: 90,
                height: 56,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 800,
                color: p.color,
                textAlign: 'center',
                whiteSpace: 'pre',
                lineHeight: 1.3,
                cursor: 'pointer',
              }}
            >
              {p.name}
            </div>
          ))}
        </div>
      </div>

      {/* ===== Quick Links ===== */}
      <div style={{ background: CARD_BG, borderTop: '6px solid #f0f0f0', padding: '12px 16px 16px' }}>
        {/* อัตราจ่าย — full width */}
        <Link
          href="/rates"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#f5f5f5', borderRadius: 10, padding: '13px 16px',
            textDecoration: 'none', color: '#444', fontSize: 15, fontWeight: 500,
            marginBottom: 8,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 20, height: 20, color: '#666' }}>
            <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          อัตราจ่าย
        </Link>

        {/* กฎและกติกา + เชิญเพื่อน — 2 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Link
            href="/rules"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#f5f5f5', borderRadius: 10, padding: '13px 14px',
              textDecoration: 'none', color: '#444', fontSize: 14, fontWeight: 500,
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 18, height: 18, color: '#666' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            กฎและกติกา
          </Link>
          <Link
            href="/register"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#f5f5f5', borderRadius: 10, padding: '13px 14px',
              textDecoration: 'none', color: '#444', fontSize: 14, fontWeight: 500,
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 18, height: 18, color: '#666' }}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            เชิญเพื่อน
          </Link>
        </div>
      </div>

      {/* ===== ผลรางวัลล่าสุด ===== */}
      <div style={{ background: CARD_BG, borderTop: '6px solid #f0f0f0', padding: '16px' }}>
        <h3 style={{ textAlign: 'center', fontSize: 17, fontWeight: 700, color: '#1a1a1a', margin: '0 0 14px' }}>
          ผลรางวัลหวยล่าสุด
        </h3>

        {/* Lottery type filter */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
          {['หวยไทย', 'หวยจับยี่กี', 'หวยลาว', 'หวยฮานอย', 'หวยมาเลย์', 'หวยหุ้น'].map((name, i) => (
            <button
              key={name}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 13,
                fontWeight: i === 0 ? 700 : 500, whiteSpace: 'nowrap', flexShrink: 0,
                border: 'none', cursor: 'pointer',
                background: i === 0 ? BTN_GREEN : '#f0f0f0',
                color: i === 0 ? 'white' : '#555',
              }}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Results */}
        {latestResults.length === 0 ? (
          <div style={{ background: '#f8f8f8', borderRadius: 10, padding: '24px', textAlign: 'center', color: '#aaa', fontSize: 14 }}>
            ยังไม่มีผลรางวัล
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {latestResults.map(round => (
              <div key={round.id} style={{ background: '#f8f8f8', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span>{lotteryIcons[round.lottery_type?.code] || '🎲'}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{round.lottery_type?.name}</span>
                  </div>
                  <span style={{ color: '#888', fontSize: 12 }}>{new Date(round.round_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  {[
                    { label: '3 ตัวบน', value: round.result_top3 || '-', color: '#d4820a', bg: 'rgba(255,159,10,0.08)' },
                    { label: '2 ตัวบน', value: round.result_top2 || '-', color: '#1a8a40', bg: 'rgba(52,199,89,0.08)' },
                    { label: '2 ตัวล่าง', value: round.result_bottom2 || '-', color: '#0055cc', bg: 'rgba(0,122,255,0.08)' },
                  ].map(item => (
                    <div key={item.label} style={{ background: item.bg, borderRadius: 8, padding: '8px 4px', textAlign: 'center' }}>
                      <div style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lotteries list */}
      {lotteries.length > 0 && (
        <div style={{ background: CARD_BG, borderTop: '6px solid #f0f0f0', padding: '16px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: '0 0 12px' }}>หวยที่เปิดอยู่</h3>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
            {lotteries.slice(0, 5).map((lottery, idx) => (
              <div key={lottery.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: idx < 4 ? '1px solid #f0f0f0' : 'none', background: 'white' }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: lotteryBgColors[lottery.code] || '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {lotteryIcons[lottery.code] || '🎲'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{lottery.name}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{lottery.description}</div>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14, color: '#ccc', flexShrink: 0 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom padding */}
      <div style={{ height: 32, background: '#f0f0f0' }} />
    </div>
  )
}
