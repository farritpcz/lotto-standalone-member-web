/**
 * หน้า Login — clean design + sections เพิ่มเติม
 *
 * Layout:
 * 1. Centered form (logo + phone + password + buttons)
 * 2. Quick links (อัตราจ่าย / กฎกติกา / เชิญเพื่อน) → เปิด modal
 * 3. ผลรางวัลหวยล่าสุด (จาก API)
 * 4. รีวิวจากผู้ใช้ (mock)
 * 5. FloatingContact (จาก auth layout)
 */

'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { api, authApi, lotteryApi, resultApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import type { LotteryTypeInfo, LotteryRound, BetTypeInfo } from '@/types'
import {
  Phone, Lock, Eye, EyeOff, UserPlus,
  Monitor, FileText, Users, X, Star,
} from 'lucide-react'
import PageTransition from '@/components/PageTransition'
import BannerCarousel from '@/components/BannerCarousel'

/* ─── Fallback banners — ใช้เมื่อยังไม่มี banner จาก API ─── */
const FALLBACK_BANNERS = [
  { image_url: '/images/banners/banner-default.png' },
  { image_url: '/images/banners/banner-default.png' },
  { image_url: '/images/banners/banner-default.png' },
]

/* ─── Modal type ─── */
type ModalType = null | 'rates' | 'rules' | 'invite'

/* ─── Rules data (static) ─── */
const RULES = [
  {
    title: 'กติกาทั่วไป',
    items: [
      'สมาชิกต้องมีอายุ 20 ปีบริบูรณ์ขึ้นไป',
      'ยอดเดิมพันขั้นต่ำ 1 บาท สูงสุดตามที่ระบบกำหนด',
      'หากมีการทุจริต ทางเราขอสงวนสิทธิ์ยกเลิกรายการทันที',
      'ผลการแทงอ้างอิงจากแหล่งข้อมูลอย่างเป็นทางการเท่านั้น',
    ],
  },
  {
    title: 'การแทงหวย',
    items: [
      '3 ตัวบน — ทายผลเลข 3 ตัวบนตรงตำแหน่ง',
      '3 ตัวโต๊ด — ทายผลเลข 3 ตัวบนไม่จำกัดตำแหน่ง',
      '2 ตัวบน — ทายผลเลข 2 ตัวบนตรงตำแหน่ง',
      '2 ตัวล่าง — ทายผลเลข 2 ตัวล่างตรงตำแหน่ง',
      'วิ่งบน — ทายเลข 1 ตัวที่อยู่ใน 3 ตัวบน',
      'วิ่งล่าง — ทายเลข 1 ตัวที่อยู่ใน 2 ตัวล่าง',
    ],
  },
  {
    title: 'ยี่กี',
    items: [
      'ยิงเลข 5 หลัก ภายในเวลาที่กำหนด',
      'ผลรวมเลขทั้งหมด mod 100000 = ผลยี่กี',
      'เปิดให้เล่นตลอด 24 ชั่วโมง',
    ],
  },
  {
    title: 'การฝาก-ถอนเงิน',
    items: [
      'ฝากเงินขั้นต่ำ 100 บาท',
      'ถอนเงินขั้นต่ำ 300 บาท',
      'ถอนเงินได้ไม่เกิน 3 ครั้ง/วัน',
      'ระบบประมวลผลอัตโนมัติ ภายใน 1-5 นาที',
    ],
  },
]

/* ─── Reviews mock data ─── */
const REVIEWS = [
  { id: 1, name: '09494xxxxx', rating: 5, text: 'ถอนไวมาก ไม่ถึง 5 นาที เงินเข้าเลย สุดยอดครับ', date: '2026-03-22' },
  { id: 2, name: '06587xxxxx', rating: 5, text: 'ดีมากอยากให้ทุกคนมาเล่นเยอะๆของจริง ชอบมากครับ', date: '2026-03-16' },
  { id: 3, name: '06255xxxxx', rating: 5, text: 'แทงหวยง่าย UI สวย ใช้งานสะดวกมาก', date: '2026-03-10' },
  { id: 4, name: '09182xxxxx', rating: 4, text: 'หวยครบทุกประเภท ทั้งไทย ลาว หุ้น ยี่กี เยี่ยม', date: '2026-03-05' },
]

/* ─── Lottery display helpers ─── */
const lotteryFlags: Record<string, string> = {
  THAI: '🇹🇭', LAO: '🇱🇦', STOCK_TH: '📈', STOCK_FOREIGN: '🌍', YEEKEE: '🎯', CUSTOM: '🎲',
}

export default function LoginPage() {
  const { setAuth } = useAuthStore()

  // ── Form state ──
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // ── Data state ──
  const [banners, setBanners] = useState(FALLBACK_BANNERS)
  const [latestResults, setLatestResults] = useState<LotteryRound[]>([])
  const [modal, setModal] = useState<ModalType>(null)

  // ── Rates modal state ──
  const [ratesTypes, setRatesTypes] = useState<LotteryTypeInfo[]>([])
  const [ratesSelected, setRatesSelected] = useState<LotteryTypeInfo | null>(null)
  const [ratesBetTypes, setRatesBetTypes] = useState<BetTypeInfo[]>([])
  const [ratesLoading, setRatesLoading] = useState(false)

  // โหลด banners จาก API — ถ้าไม่มีใช้ fallback
  useEffect(() => {
    api.get('/banners').then(res => {
      const data = res.data.data || []
      if (data.length > 0) setBanners(data)
    }).catch(() => {}) // ใช้ fallback ถ้า API ยังไม่พร้อม
  }, [])

  // โหลดผลหวยล่าสุด
  useEffect(() => {
    resultApi.getResults({ per_page: 5 })
      .then(res => setLatestResults(res.data.data?.items || []))
      .catch(() => {})
  }, [])

  // โหลดอัตราจ่ายเมื่อเปิด modal
  useEffect(() => {
    if (modal !== 'rates' || ratesTypes.length > 0) return
    setRatesLoading(true)
    lotteryApi.getTypes()
      .then(res => {
        const types = res.data.data || []
        setRatesTypes(types)
        if (types.length > 0) setRatesSelected(types[0])
      })
      .catch(() => {})
      .finally(() => setRatesLoading(false))
  }, [modal, ratesTypes.length])

  // โหลด bet types เมื่อเปลี่ยนประเภท
  useEffect(() => {
    if (!ratesSelected) return
    lotteryApi.getBetTypes(ratesSelected.id)
      .then(res => setRatesBetTypes(res.data.data || []))
      .catch(() => setRatesBetTypes([]))
  }, [ratesSelected])

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
      {/* ===== Banner Slider ===== */}
      <div className="auth-banner">
        <BannerCarousel banners={banners} height={160} interval={4000} />
      </div>

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
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
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
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="รหัสผ่าน"
                className="auth-input auth-input--pw"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="auth-pw-toggle">
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button onClick={handleLogin} disabled={loading} className="auth-btn auth-btn--primary">
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>

          <Link href="/register" className="auth-btn auth-btn--register">
            <UserPlus size={17} strokeWidth={2.5} />
            สมัครสมาชิก
          </Link>
        </div>
      </div>

      {/* ============ QUICK LINKS ============ */}
      <div className="login-section">
        <div className="login-links">
          <button className="login-link-btn" onClick={() => setModal('rates')}>
            <Monitor size={18} />
            <span>อัตราจ่าย</span>
          </button>
          <button className="login-link-btn" onClick={() => setModal('rules')}>
            <FileText size={18} />
            <span>กฎและกติกา</span>
          </button>
          <button className="login-link-btn" onClick={() => setModal('invite')}>
            <Users size={18} />
            <span>เชิญเพื่อน</span>
          </button>
        </div>
      </div>

      {/* ============ ผลหวยล่าสุด ============ */}
      {latestResults.length > 0 && (
        <div className="login-section">
          <h2 className="login-section-title">ผลรางวัลหวยล่าสุด</h2>
          <div className="login-results">
            {latestResults.map(round => (
              <div key={round.id} className="login-result-card">
                <div className="login-result-header">
                  <div className="login-result-name">
                    <span>{lotteryFlags[round.lottery_type?.code] || '🎲'}</span>
                    <span>{round.lottery_type?.name}</span>
                  </div>
                  <span className="login-result-date">
                    {new Date(round.round_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </span>
                </div>
                <div className="login-result-numbers">
                  {[
                    { label: '3 ตัวบน', value: round.result_top3, accent: true },
                    { label: '2 ตัวบน', value: round.result_top2 },
                    { label: '2 ตัวล่าง', value: round.result_bottom2 },
                  ].map(item => (
                    <div key={item.label} className="login-result-num">
                      <span className="login-result-num-label">{item.label}</span>
                      <span className={`login-result-num-value${item.accent ? ' accent' : ''}`}>{item.value || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ รีวิวจากผู้ใช้ ============ */}
      <div className="login-section">
        <h2 className="login-section-title">รีวิวจากผู้ใช้</h2>
        <div className="login-reviews">
          {REVIEWS.map(r => (
            <div key={r.id} className="login-review-card">
              <div className="login-review-top">
                <div className="login-review-user">
                  <div className="login-review-avatar">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <div className="login-review-name">{r.name}</div>
                    <div className="login-review-date">{r.date}</div>
                  </div>
                </div>
                <div className="login-review-stars">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i < r.rating ? '#f59e0b' : 'none'}
                      stroke={i < r.rating ? '#f59e0b' : 'var(--ios-tertiary-label)'}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
              </div>
              <p className="login-review-text">{r.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom spacing for FloatingContact */}
      <div style={{ height: 40 }} />

      {/* ============ MODALS (portal to body เพราะ PageTransition transform ทำให้ fixed ไม่ทำงาน) ============ */}
      {modal && typeof document !== 'undefined' && createPortal(
          <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modal === 'rates' && 'อัตราจ่าย'}
                {modal === 'rules' && 'กฎและกติกา'}
                {modal === 'invite' && 'เชิญเพื่อน'}
              </h3>
              <button className="modal-close" onClick={() => setModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* ── อัตราจ่าย ── */}
              {modal === 'rates' && (
                ratesLoading ? (
                  <p className="modal-empty">กำลังโหลด...</p>
                ) : ratesTypes.length === 0 ? (
                  <p className="modal-empty">ยังไม่มีข้อมูล</p>
                ) : (
                  <>
                    {/* Lottery type tabs */}
                    <div className="rates-tabs">
                      {ratesTypes.map(lt => (
                        <button
                          key={lt.id}
                          onClick={() => setRatesSelected(lt)}
                          className={`rates-tab${ratesSelected?.id === lt.id ? ' active' : ''}`}
                        >
                          {lt.name}
                        </button>
                      ))}
                    </div>
                    {/* Bet types table */}
                    {ratesBetTypes.length === 0 ? (
                      <p className="modal-empty">ไม่มีข้อมูล</p>
                    ) : (
                      <div className="rates-table">
                        <div className="rates-row rates-header-row">
                          <span>ประเภท</span>
                          <span>อัตราจ่าย</span>
                          <span>สูงสุด/เลข</span>
                        </div>
                        {ratesBetTypes.map(bt => (
                          <div key={bt.code} className="rates-row">
                            <span className="rates-name">{bt.name}</span>
                            <span className="rates-rate">x{bt.rate}</span>
                            <span className="rates-max">
                              {bt.max_bet_per_number > 0 ? `฿${bt.max_bet_per_number.toLocaleString()}` : 'ไม่จำกัด'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )
              )}

              {/* ── กฎกติกา ── */}
              {modal === 'rules' && (
                <div className="rules-content">
                  {RULES.map((section, i) => (
                    <div key={i} className="rules-section">
                      <h4 className="rules-section-title">
                        <span className="rules-num">{i + 1}</span>
                        {section.title}
                      </h4>
                      <ul className="rules-list">
                        {section.items.map((item, j) => (
                          <li key={j}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* ── เชิญเพื่อน ── */}
              {modal === 'invite' && (
                <div className="invite-content">
                  <h4 className="invite-heading">ชวนเพื่อนมาเล่น รับค่าคอมทุกยอดแทง!</h4>

                  <div className="invite-section">
                    <p className="invite-section-title">เงื่อนไข</p>
                    <ul className="invite-list">
                      <li>เพื่อนสมัครผ่านลิงก์แนะนำของคุณ</li>
                      <li>รับค่าคอมมิชชั่นทุกครั้งที่เพื่อนแทงหวย</li>
                      <li>ไม่จำกัดจำนวนคนที่เชิญได้</li>
                      <li>ค่าคอมคำนวณอัตโนมัติหลังออกผล</li>
                    </ul>
                  </div>

                  <div className="invite-section">
                    <p className="invite-section-title">อัตราค่าคอมมิชชั่น</p>
                    <div className="invite-rates">
                      <div className="invite-rate-row">
                        <span>หวยไทย / หวยลาว</span>
                        <span className="invite-rate-value">0.8%</span>
                      </div>
                      <div className="invite-rate-row">
                        <span>หวยหุ้น</span>
                        <span className="invite-rate-value">0.5%</span>
                      </div>
                      <div className="invite-rate-row">
                        <span>หวยยี่กี</span>
                        <span className="invite-rate-value">0.5%</span>
                      </div>
                    </div>
                  </div>

                  <p className="invite-note">* สมัครสมาชิกและเข้าสู่ระบบเพื่อรับลิงก์แนะนำของคุณ</p>
                </div>
              )}
            </div>
          </div>
          </div>,
        document.body
      )}

      <style>{loginStyles}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Styles
 * ═══════════════════════════════════════════════════════════════════════════════ */
const loginStyles = `
  /* ── Auth page ── */
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

  /* ── Banner ── */
  .auth-banner {
    width: 100%; max-width: 600px; margin-bottom: 20px;
  }

  /* ── Error ── */
  .auth-error {
    background: rgba(255,59,48,0.07); border: 1px solid rgba(255,59,48,0.15);
    color: #dc2626; padding: 10px 14px; border-radius: 10px;
    font-size: 14px; text-align: center; margin-bottom: 20px;
  }
  [data-theme="dark"] .auth-error { color: #f87171; background: rgba(255,59,48,0.12); }

  /* ── Form ── */
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

  /* ── Buttons ── */
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

  /* ═══════ Login sections below form ═══════ */
  .login-section {
    width: 100%; max-width: 600px;
    margin-top: 28px;
  }
  .login-section-title {
    font-size: 16px; font-weight: 700; color: var(--ios-label);
    margin: 0 0 12px; text-align: center;
  }

  /* ── Quick links ── */
  .login-links {
    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;
  }
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

  /* ── Results ── */
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
  .login-result-numbers {
    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;
  }
  .login-result-num {
    background: var(--ios-bg); border-radius: 8px; padding: 6px 8px; text-align: center;
  }
  .login-result-num-label {
    display: block; font-size: 10px; color: var(--ios-secondary-label); margin-bottom: 2px;
  }
  .login-result-num-value {
    display: block; font-size: 18px; font-weight: 700; color: var(--ios-label);
    font-variant-numeric: tabular-nums;
  }
  .login-result-num-value.accent { color: var(--accent-color); }

  /* ── Reviews ── */
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

  /* ═══════ Modal ═══════ */
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

  /* ── Rates modal ── */
  .rates-tabs {
    display: flex; gap: 6px; overflow-x: auto; padding-bottom: 12px;
    scrollbar-width: none;
  }
  .rates-tabs::-webkit-scrollbar { display: none; }
  .rates-tab {
    padding: 6px 14px; border-radius: 20px; border: none;
    font-size: 12px; font-weight: 600; white-space: nowrap; cursor: pointer;
    background: var(--ios-bg); color: var(--ios-secondary-label);
    transition: all 0.15s;
  }
  .rates-tab.active {
    background: var(--accent-color); color: white;
  }
  .rates-table {
    border: 1px solid var(--ios-separator); border-radius: 10px; overflow: hidden;
  }
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

  /* ── Rules modal ── */
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

  /* ── Invite modal ── */
  .invite-content { padding: 4px 0; }
  .invite-heading {
    font-size: 15px; font-weight: 700; color: var(--accent-color);
    margin: 0 0 16px; text-align: center;
  }
  .invite-section { margin-bottom: 16px; }
  .invite-section-title {
    font-size: 13px; font-weight: 700; color: var(--ios-label);
    margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;
  }
  .invite-list {
    margin: 0; padding: 0 0 0 20px; list-style: disc;
    font-size: 13px; color: var(--ios-secondary-label); line-height: 1.8;
  }
  .invite-rates {
    border: 1px solid var(--ios-separator); border-radius: 10px; overflow: hidden;
  }
  .invite-rate-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 14px; border-bottom: 1px solid var(--ios-separator);
    font-size: 13px; color: var(--ios-label);
  }
  .invite-rate-row:last-child { border-bottom: none; }
  .invite-rate-value { font-weight: 700; color: var(--accent-color); }
  .invite-note {
    font-size: 12px; color: var(--ios-secondary-label);
    text-align: center; margin: 0;
  }

  /* ── Animations ── */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
`
