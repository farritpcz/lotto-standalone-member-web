// Page: /login (member) — orchestrator (banner + LoginForm + extras + modals)
// Parent: src/app/(auth) (route entry)
//
// Layout:
// 1. Banner carousel
// 2. LoginForm (phone + password)
// 3. LoginExtras (quick links + latest results + reviews)
// 4. AuthModals (rates / rules / invite)
// 5. FloatingContact (rendered by auth layout)
'use client'

import { useState, useEffect } from 'react'
import { api, authApi, resultApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import type { LotteryRound } from '@/types'
import BannerCarousel from '@/components/BannerCarousel'
import LoginForm from '@/components/auth/LoginForm'
import LoginExtras from '@/components/auth/LoginExtras'
import AuthModals, { type ModalType } from '@/components/auth/AuthModals'

/* Fallback banners — ใช้เมื่อยังไม่มี banner จาก API */
const FALLBACK_BANNERS = [
  { image_url: '/images/banners/banner-default.png' },
  { image_url: '/images/banners/banner-default.png' },
  { image_url: '/images/banners/banner-default.png' },
]

export default function LoginPage() {
  const { setAuth } = useAuthStore()

  // Form state
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Data state
  const [banners, setBanners] = useState(FALLBACK_BANNERS)
  const [latestResults, setLatestResults] = useState<LotteryRound[]>([])
  const [modal, setModal] = useState<ModalType>(null)

  // โหลด banners จาก API — ถ้าไม่มีใช้ fallback
  useEffect(() => {
    api.get('/agent/banners').then(res => {
      const data = res.data.data || []
      if (data.length > 0) setBanners(data)
    }).catch(() => {})
  }, [])

  // โหลดผลหวยล่าสุด
  useEffect(() => {
    resultApi.getResults({ per_page: 5 })
      .then(res => setLatestResults(res.data.data?.items || []))
      .catch(() => {})
  }, [])

  const handleLogin = async () => {
    if (!phone || !password) { setError('กรุณากรอกข้อมูลให้ครบ'); return }
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login({ username: phone, password })
      setAuth(res.data.data.member)
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      const msg = e.response?.data?.message || ''
      const errorMap: Record<string, string> = {
        'invalid username or password': 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง',
        'account is suspended': 'บัญชีถูกระงับ กรุณาติดต่อผู้ดูแล',
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

  return (
    <div className="auth-page">
      {/* Banner Slider */}
      <div className="auth-banner">
        <BannerCarousel banners={banners} aspectRatio="16/5" interval={5000} />
      </div>

      <LoginForm
        phone={phone} setPhone={setPhone}
        password={password} setPassword={setPassword}
        showPw={showPw} setShowPw={setShowPw}
        error={error} loading={loading}
        onLogin={handleLogin}
      />

      <LoginExtras latestResults={latestResults} setModal={setModal} />

      {/* Bottom spacing for FloatingContact */}
      <div style={{ height: 40 }} />

      <AuthModals modal={modal} setModal={setModal} />

      <style>{loginStyles}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Styles — inline <style> tag to scope within auth page without needing CSS module
 * ═══════════════════════════════════════════════════════════════════════════════ */
const loginStyles = `
  .auth-page {
    min-height: calc(100dvh - 56px);
    background: var(--ios-bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 20px 0;
    position: relative;
    font-family: var(--font-sarabun), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  .auth-card {
    width: 100%; max-width: 600px;
    background: var(--ios-card);
    border: 1px solid var(--ios-separator);
    border-radius: 14px;
    padding: 22px 20px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  }
  [data-theme="dark"] .auth-card {
    box-shadow: 0 2px 16px rgba(0,0,0,0.3);
  }

  .auth-banner { width: 100%; max-width: 600px; margin-bottom: 20px; }

  .auth-error {
    background: rgba(255,59,48,0.07); border: 1px solid rgba(255,59,48,0.15);
    color: #dc2626; padding: 10px 14px; border-radius: 10px;
    font-size: 14px; text-align: center; margin-bottom: 20px;
  }
  [data-theme="dark"] .auth-error { color: #f87171; background: rgba(255,59,48,0.12); }

  .auth-form { display: flex; flex-direction: column; gap: 16px; }
  .auth-field { display: flex; flex-direction: column; gap: 6px; }
  .auth-label-row { display: flex; justify-content: space-between; align-items: center; }
  .auth-label { font-size: 14px; font-weight: 600; color: var(--ios-label); }
  .auth-forgot { font-size: 13px; color: var(--accent-color); text-decoration: none; font-weight: 500; }

  .auth-input-wrap { position: relative; display: flex; align-items: center; }
  .auth-input-icon { position: absolute; left: 14px; color: var(--ios-secondary-label); pointer-events: none; }
  .auth-input {
    width: 100%; box-sizing: border-box;
    background: var(--ios-bg); border: 1px solid var(--ios-separator);
    border-radius: 10px; padding: 12px 14px 12px 42px;
    font-size: 16px; color: var(--ios-label); outline: none;
    transition: border-color 0.2s, box-shadow 0.2s; font-family: inherit;
  }
  .auth-input::placeholder { color: var(--ios-tertiary-label); }
  .auth-input:focus { border-color: var(--accent-color); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 12%, transparent); }
  .auth-input--pw { padding-right: 44px; }
  .auth-pw-toggle {
    position: absolute; right: 12px; background: none; border: none;
    cursor: pointer; color: var(--ios-secondary-label); display: flex; padding: 4px;
  }

  .auth-btn {
    width: 100%; padding: 13px; border-radius: 10px;
    font-size: 16px; font-weight: 600; border: none; cursor: pointer;
    transition: opacity 0.15s, transform 0.1s; font-family: inherit;
  }
  .auth-btn:active:not(:disabled) { transform: scale(0.985); }
  .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .auth-btn--primary {
    background: linear-gradient(180deg, var(--accent-color) 0%, color-mix(in srgb, var(--accent-color) 82%, black) 100%);
    color: #1a1a1a; font-weight: 700;
    box-shadow: 0 2px 8px color-mix(in srgb, var(--accent-color) 30%, transparent);
  }
  .auth-btn--primary:hover:not(:disabled) { opacity: 0.92; }
  .auth-btn--register {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 13px; border-radius: 10px;
    font-size: 16px; font-weight: 600; text-decoration: none;
    background: linear-gradient(180deg, color-mix(in srgb, var(--header-bg) 85%, white) 0%, var(--header-bg) 100%);
    color: white; border: none;
    transition: opacity 0.15s, transform 0.1s;
    box-sizing: border-box; font-family: inherit;
    box-shadow: 0 2px 8px color-mix(in srgb, var(--header-bg) 35%, transparent);
  }
  .auth-btn--register:active { transform: scale(0.985); }
  .auth-btn--register:hover { opacity: 0.92; }

  .login-section { width: 100%; max-width: 600px; margin-top: 28px; }
  .login-section-title {
    font-size: 16px; font-weight: 700; color: var(--ios-label);
    margin: 0 0 12px; text-align: center;
  }

  .login-links { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .login-link-btn {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    background: var(--ios-card); border: 1px solid var(--ios-separator);
    border-radius: 12px; padding: 14px 8px;
    cursor: pointer; color: var(--ios-label); font-size: 12px; font-weight: 600;
    transition: all 0.2s;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  }
  [data-theme="dark"] .login-link-btn { box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
  .login-link-btn svg { color: var(--accent-color); }
  .login-link-btn:hover {
    border-color: var(--accent-color);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--accent-color) 15%, transparent);
  }

  .login-results { display: flex; flex-direction: column; gap: 8px; }
  .login-result-card {
    background: var(--ios-card); border: 1px solid var(--ios-separator);
    border-radius: 12px; padding: 12px 14px; overflow: hidden;
  }
  .login-result-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 10px;
  }
  .login-result-name {
    display: flex; align-items: center; gap: 6px;
    font-size: 14px; font-weight: 700; color: var(--ios-label);
  }
  .login-result-date { font-size: 12px; color: var(--ios-secondary-label); }
  .login-result-numbers { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
  .login-result-num { background: var(--ios-bg); border-radius: 8px; padding: 6px 8px; text-align: center; }
  .login-result-num-label { display: block; font-size: 10px; color: var(--ios-secondary-label); margin-bottom: 2px; }
  .login-result-num-value { display: block; font-size: 18px; font-weight: 700; color: var(--ios-label); font-variant-numeric: tabular-nums; }
  .login-result-num-value.accent { color: var(--accent-color); }

  .login-reviews { display: flex; flex-direction: column; gap: 8px; }
  .login-review-card {
    background: var(--ios-card); border: 1px solid var(--ios-separator);
    border-radius: 12px; padding: 14px;
  }
  .login-review-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .login-review-user { display: flex; align-items: center; gap: 10px; }
  .login-review-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: var(--ios-bg); color: var(--ios-secondary-label);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; flex-shrink: 0;
  }
  .login-review-name { font-size: 13px; font-weight: 600; color: var(--ios-label); }
  .login-review-date { font-size: 11px; color: var(--ios-secondary-label); }
  .login-review-stars { display: flex; gap: 1px; margin-top: 2px; }
  .login-review-text { font-size: 14px; color: var(--ios-label); line-height: 1.5; margin: 0; }

  .modal-backdrop {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.15s ease-out;
  }
  .modal-card {
    width: calc(100% - 40px); max-width: 600px;
    max-height: 80dvh;
    background: var(--ios-card); border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    display: flex; flex-direction: column;
    animation: modalIn 0.2s ease-out;
  }
  .modal-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 18px; border-bottom: 1px solid var(--ios-separator); flex-shrink: 0;
  }
  .modal-title { font-size: 17px; font-weight: 700; color: var(--ios-label); margin: 0; }
  .modal-close {
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--ios-bg); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--ios-secondary-label);
  }
  .modal-body { overflow-y: auto; padding: 16px 18px; flex: 1; }
  .modal-empty { text-align: center; color: var(--ios-secondary-label); font-size: 14px; padding: 24px 0; }

  .rates-tabs { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 12px; scrollbar-width: none; }
  .rates-tabs::-webkit-scrollbar { display: none; }
  .rates-tab {
    padding: 6px 14px; border-radius: 20px; border: none;
    font-size: 12px; font-weight: 600; white-space: nowrap; cursor: pointer;
    background: var(--ios-bg); color: var(--ios-secondary-label);
    transition: all 0.15s;
  }
  .rates-tab.active { background: var(--accent-color); color: white; }
  .rates-table { border: 1px solid var(--ios-separator); border-radius: 10px; overflow: hidden; }
  .rates-row {
    display: grid; grid-template-columns: 1fr auto auto; gap: 12px;
    padding: 10px 14px; align-items: center;
    border-bottom: 1px solid var(--ios-separator);
  }
  .rates-row:last-child { border-bottom: none; }
  .rates-header-row {
    font-size: 11px; font-weight: 700; color: var(--accent-color);
    text-transform: uppercase; letter-spacing: 0.5px;
    padding: 10px 14px;
    background:
      url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20.5z' fill='%23ffffff' fill-opacity='0.04' fill-rule='evenodd'/%3E%3C/svg%3E"),
      linear-gradient(135deg, var(--header-bg) 0%, color-mix(in srgb, var(--header-bg) 70%, black) 100%);
  }
  .rates-name { font-size: 13px; font-weight: 600; color: var(--ios-label); }
  .rates-rate { font-size: 14px; font-weight: 700; color: var(--accent-color); text-align: right; }
  .rates-max { font-size: 12px; color: var(--ios-secondary-label); text-align: right; }

  .rules-content { display: flex; flex-direction: column; gap: 16px; }
  .rules-section-title {
    font-size: 14px; font-weight: 700; color: var(--ios-label);
    display: flex; align-items: center; gap: 8px; margin: 0 0 8px;
  }
  .rules-num {
    width: 22px; height: 22px; border-radius: 50%;
    background: var(--accent-color); color: white;
    font-size: 11px; font-weight: 700;
    display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .rules-list {
    margin: 0; padding: 0 0 0 30px; list-style: disc;
    color: var(--ios-secondary-label); font-size: 13px; line-height: 1.7;
  }

  .invite-content { padding: 4px 0; }
  .invite-heading { font-size: 15px; font-weight: 700; color: var(--accent-color); margin: 0 0 16px; text-align: center; }
  .invite-section { margin-bottom: 16px; }
  .invite-section-title { font-size: 13px; font-weight: 700; color: var(--ios-label); margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  .invite-list { margin: 0; padding: 0 0 0 20px; list-style: disc; font-size: 13px; color: var(--ios-secondary-label); line-height: 1.8; }
  .invite-rates { border: 1px solid var(--ios-separator); border-radius: 10px; overflow: hidden; }
  .invite-rate-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 14px; border-bottom: 1px solid var(--ios-separator);
    font-size: 13px; color: var(--ios-label);
  }
  .invite-rate-row:last-child { border-bottom: none; }
  .invite-rate-value { font-weight: 700; color: var(--accent-color); }
  .invite-note { font-size: 12px; color: var(--ios-secondary-label); text-align: center; margin: 0; }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
`
