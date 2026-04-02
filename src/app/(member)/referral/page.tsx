/**
 * หน้าแนะนำเพื่อน — แบบเจริญดี88
 *
 * Layout:
 * - Header: back + "แนะนำเพื่อน"
 * - Tab Switcher: ภาพรวม / ถอนรายได้
 * - Tab ภาพรวม: ลิงก์เชิญ + คัดลอก, share 6 platform, commission rates, stats
 * - Tab ถอนรายได้: รายได้คงเหลือ, เงื่อนไขการถอน (popup), form ถอน, ประวัติ
 *
 * ความสัมพันธ์:
 * - เรียก: referralApi.getInfo() → GET /api/v1/referral/info
 * - เรียก: referralApi.withdraw() → POST /api/v1/referral/withdraw
 * - commission rates อ่านจาก affiliate_settings ที่ agent ตั้งไว้
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Copy, Wallet } from 'lucide-react'
import { referralApi, type ReferralInfo, type ReferralCommission } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

// Social share platforms
const SHARE_PLATFORMS = [
  { key: 'line',      label: 'แชร์ไลน์',     bg: '#00B900', icon: <LineIcon /> },
  { key: 'facebook',  label: 'แชร์เฟสบุ๊ก',  bg: '#1877F2', icon: <FbIcon /> },
  { key: 'telegram',  label: 'แชร์เทเลแกรม', bg: '#2CA5E0', icon: <TgIcon /> },
  { key: 'vk',        label: 'แชร์วีเค',      bg: '#4C75A3', icon: <VkIcon /> },
  { key: 'instagram', label: 'แชร์ไอจี',      bg: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', icon: <IgIcon /> },
  { key: 'tiktok',    label: 'แชร์ติ๊กต็อก',  bg: '#010101', icon: <TikTokIcon /> },
]

function shareUrl(platform: string, url: string) {
  const encoded = encodeURIComponent(url)
  const maps: Record<string, string> = {
    line:      `https://social-plugins.line.me/lineit/share?url=${encoded}`,
    facebook:  `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    telegram:  `https://t.me/share/url?url=${encoded}`,
    vk:        `https://vk.com/share.php?url=${encoded}`,
    instagram: url,   // IG ไม่มี web share → copy แทน
    tiktok:    url,   // TikTok ไม่มี web share → copy แทน
  }
  return maps[platform] || url
}

export default function ReferralPage() {
  const { member } = useAuthStore()
  const [tab, setTab] = useState<'overview' | 'withdraw'>('overview')
  const [info, setInfo] = useState<ReferralInfo | null>(null)
  const [commissions, setCommissions] = useState<ReferralCommission[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showConditions, setShowConditions] = useState(false)

  // Withdraw form
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawMsg, setWithdrawMsg] = useState('')
  const [withdrawErr, setWithdrawErr] = useState('')

  useEffect(() => {
    referralApi.getInfo()
      .then(res => setInfo(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))

    referralApi.getCommissions({ per_page: 20 })
      .then(res => setCommissions(res.data.data?.items || []))
      .catch(() => {})
  }, [])

  // สร้างลิงก์เชิญฝั่ง client เท่านั้น (ป้องกัน hydration mismatch)
  // ใช้ useState + useEffect → ทั้ง server และ client render ครั้งแรกเป็น '' เหมือนกัน
  // แล้วค่อย update หลัง mount เสร็จ
  const [refLink, setRefLink] = useState('')
  useEffect(() => {
    const refCode = info?.link.code || `REF${member?.id || '0'}`
    setRefLink(`${window.location.origin}/register?ref=${refCode}`)
  }, [info, member])

  const handleCopy = () => {
    if (!refLink) return
    navigator.clipboard.writeText(refLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = (platform: string) => {
    if (!refLink) return
    const url = shareUrl(platform, refLink)
    if (platform === 'instagram' || platform === 'tiktok') {
      // IG/TikTok ไม่มี web share API → copy link แทน
      navigator.clipboard.writeText(refLink).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      window.open(url, '_blank', 'noopener')
    }
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0) { setWithdrawErr('กรุณากรอกจำนวนเงิน'); return }
    if (info && amount < info.withdrawal.min) {
      setWithdrawErr(`ยอดถอนขั้นต่ำ ฿${info.withdrawal.min.toFixed(2)}`); return
    }
    setWithdrawErr('')
    setWithdrawMsg('')
    setWithdrawing(true)
    try {
      const res = await referralApi.withdraw(amount)
      setWithdrawMsg(res.data.message || 'ถอนสำเร็จ')
      setWithdrawAmount('')
      // reload info
      referralApi.getInfo().then(r => setInfo(r.data.data)).catch(() => {})
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setWithdrawErr(e.response?.data?.error || 'ถอนไม่สำเร็จ')
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div style={{ paddingBottom: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 10px', position: 'relative' }}>
        <Link href="/dashboard" style={{ color: 'var(--ios-label)', position: 'absolute', left: 16 }}>
          <ChevronLeft size={22} strokeWidth={2.5} />
        </Link>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 700, color: 'var(--ios-label)' }}>แนะนำเพื่อน</span>
      </div>

      {/* Tab Switcher */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ background: 'var(--ios-card)', borderRadius: 10, padding: 3, display: 'flex', boxShadow: 'var(--shadow-card)' }}>
          {(['overview', 'withdraw'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 14, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: tab === t ? 'var(--ios-green)' : 'transparent',
                color: tab === t ? 'white' : 'var(--ios-secondary-label)',
                boxShadow: tab === t ? '0 2px 8px rgba(52,199,89,0.35)' : 'none',
              }}
            >
              {t === 'overview' ? 'ภาพรวม' : 'ถอนรายได้'}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Tab: ภาพรวม ===== */}
      {tab === 'overview' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Commission Rates ที่ agent ตั้ง */}
          <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 13, color: 'var(--ios-secondary-label)', marginBottom: 10 }}>อัตราค่าคอมมิชชั่น</p>
            {loading ? (
              <div className="skeleton" style={{ height: 20, borderRadius: 6, width: '60%' }} />
            ) : info?.commission_rates.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {info.commission_rates.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: 'var(--ios-label)' }}>{r.lottery_type || 'ทุกประเภทหวย'}</span>
                    <span style={{
                      fontSize: 14, fontWeight: 700,
                      background: 'rgba(52,199,89,0.1)', color: 'var(--ios-green)',
                      padding: '2px 10px', borderRadius: 20,
                    }}>{r.rate}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--ios-green)', fontWeight: 700 }}>0.5% (default)</p>
            )}
          </div>

          {/* ลิงก์เชิญเพื่อน */}
          <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ios-label)' }}>ลิงก์เชิญเพื่อน</p>
              <Link href="/referral/commissions" style={{ fontSize: 13, color: 'var(--ios-green)', textDecoration: 'none', fontWeight: 500 }}>
                เงื่อนไขรายได้
              </Link>
            </div>

            <p style={{ fontSize: 13, color: 'var(--ios-secondary-label)', lineHeight: 1.5, marginBottom: 12 }}>
              ชวนเพื่อนง่ายๆ แค่แชร์ลิงก์ รับค่าคอมทุกวัน ทุกการเดิมพันหวยของเพื่อน
            </p>

            {/* Link URL box — ใช้ window.location.origin ต่อ ref_code เสมอ */}
            <div style={{
              background: 'var(--ios-bg)', borderRadius: 10, padding: '10px 12px',
              fontSize: 13, color: 'var(--ios-secondary-label)', fontFamily: 'monospace',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              marginBottom: 10,
            }}>
              {refLink || '...'}
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              style={{
                width: '100%', padding: '12px', borderRadius: 10,
                background: copied ? 'var(--ios-green)' : '#1a4a3a',
                color: 'white', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Copy size={16} strokeWidth={2} />
              {copied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}
            </button>
          </div>

          {/* Share Buttons */}
          <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SHARE_PLATFORMS.map(p => (
                <button
                  key={p.key}
                  onClick={() => handleShare(p.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '11px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: typeof p.bg === 'string' && p.bg.startsWith('linear') ? p.bg : p.bg,
                    color: 'white', fontSize: 13, fontWeight: 600,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {p.icon}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--ios-label)' }}>ภาพรวม</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'จำนวนสมาชิก', value: loading ? '...' : String(info?.stats.total_referred ?? 0), color: 'var(--ios-blue)' },
                { label: 'สมาชิก Active', value: loading ? '...' : String(info?.stats.active_referred ?? 0), color: 'var(--ios-green)' },
                { label: 'รายได้ทั้งหมด', value: loading ? '...' : `฿${(info?.stats.total_comm ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`, color: 'var(--ios-orange)' },
                { label: 'รอถอน', value: loading ? '...' : `฿${(info?.stats.pending_comm ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`, color: 'var(--ios-red)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--ios-bg)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--ios-secondary-label)', marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ===== Tab: ถอนรายได้ ===== */}
      {tab === 'withdraw' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* รายได้คงเหลือ + ปุ่มเงื่อนไข */}
          <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ios-label)' }}>รายได้คงเหลือ</p>
              <button
                onClick={() => setShowConditions(v => !v)}
                style={{ fontSize: 13, color: 'var(--ios-green)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
              >
                เงื่อนไขการถอน
              </button>
            </div>

            {/* Conditions popup */}
            {showConditions && (
              <div style={{
                background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.2)',
                borderRadius: 10, padding: '10px 12px', marginBottom: 12,
                fontSize: 13, color: 'var(--ios-secondary-label)', lineHeight: 1.6,
              }}>
                {loading ? 'กำลังโหลด...' : (
                  <>
                    <p>• ถอนขั้นต่ำ <strong style={{ color: 'var(--ios-green)' }}>฿{(info?.withdrawal.min ?? 1).toFixed(2)}</strong></p>
                    {info?.withdrawal.note && <p>• {info.withdrawal.note}</p>}
                    <p>• ค่าคอมจ่ายหลังรอบหวยออกผลและคำนวณเสร็จสมบูรณ์</p>
                    <p>• รายได้จะเข้า wallet ทันทีหลังถอนสำเร็จ</p>
                  </>
                )}
              </div>
            )}

            {/* Withdrawal note (short version) */}
            {!showConditions && (
              <p style={{ fontSize: 12, color: 'var(--ios-secondary-label)', marginBottom: 12 }}>
                ถอนรายได้ (ขั้นต่ำ {loading ? '...' : `฿${(info?.withdrawal.min ?? 1).toFixed(2)}`} บาท)
              </p>
            )}

            {/* Amount input */}
            <input
              type="number"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              placeholder={`0.00`}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--ios-bg)', border: 'none', borderRadius: 10,
                padding: '12px 14px', fontSize: 18, fontWeight: 600,
                textAlign: 'right', color: 'var(--ios-label)', outline: 'none',
                marginBottom: 10,
              }}
            />

            {/* Error / Success messages */}
            {withdrawErr && (
              <div style={{ background: 'rgba(255,59,48,0.08)', color: 'var(--ios-red)', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 10 }}>
                {withdrawErr}
              </div>
            )}
            {withdrawMsg && (
              <div style={{ background: 'rgba(52,199,89,0.08)', color: 'var(--ios-green)', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 10 }}>
                {withdrawMsg}
              </div>
            )}

            {/* Withdraw button */}
            <button
              onClick={handleWithdraw}
              disabled={withdrawing || loading}
              style={{
                width: '100%', padding: '13px', borderRadius: 10,
                background: '#1a4a3a', color: 'white',
                fontSize: 15, fontWeight: 700, border: 'none',
                cursor: withdrawing ? 'not-allowed' : 'pointer',
                opacity: withdrawing ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Wallet size={18} strokeWidth={2} />
              {withdrawing ? 'กำลังถอน...' : 'ถอนเงิน'}
            </button>
          </div>

          {/* ประวัติการถอน / ประวัติค่าคอม */}
          <div style={{ background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--ios-separator)' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ios-label)' }}>ประวัติค่าคอมที่ได้รับ</p>
            </div>
            {commissions.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>💰</p>
                <p style={{ color: 'var(--ios-secondary-label)', fontSize: 15 }}>ยังไม่มีประวัติค่าคอม</p>
              </div>
            ) : (
              commissions.map((c, idx) => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: idx < commissions.length - 1 ? '0.5px solid var(--ios-separator)' : 'none',
                }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ios-label)' }}>
                      {c.referred_username || 'เพื่อน'}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--ios-secondary-label)' }}>
                      ยอดแทง ฿{c.bet_amount.toLocaleString()} × {c.commission_rate}%
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--ios-tertiary-label)' }}>
                      {new Date(c.created_at).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ios-green)' }}>
                      +฿{c.commission_amount.toFixed(2)}
                    </p>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 6,
                      background: c.status === 'paid' ? 'rgba(52,199,89,0.1)' : 'rgba(255,159,10,0.1)',
                      color: c.status === 'paid' ? 'var(--ios-green)' : 'var(--ios-orange)',
                    }}>
                      {c.status === 'paid' ? 'จ่ายแล้ว' : 'รอถอน'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// SVG Icons — Social Platforms
// ============================================================

function LineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18, flexShrink: 0 }}>
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  )
}

function FbIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18, flexShrink: 0 }}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function TgIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18, flexShrink: 0 }}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

function VkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18, flexShrink: 0 }}>
      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.713-1.033-1.01-1.49-1.146-1.744-1.146-.356 0-.458.102-.458.597v1.564c0 .425-.135.678-1.253.678-1.846 0-3.896-1.12-5.339-3.202C4.91 10.948 4.28 8.762 4.28 8.304c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.779.678.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.932c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .643.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .779.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.474-.085.711-.576.711z" />
    </svg>
  )
}

function IgIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18, flexShrink: 0 }}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18, flexShrink: 0 }}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  )
}
