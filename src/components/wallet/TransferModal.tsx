// Component: TransferModal — compact single-screen deposit confirmation
// Parent: src/app/(member)/wallet/page.tsx
//
// Layout:
//   1. Header
//   2. จาก→ไป (compact card คู่)
//   3. ยอด + countdown (รวมแถวเดียว)
//   4. แนบสลิป / โอนแล้วยืนยัน (2 ปุ่ม)
//   5. Slip upload area (แสดงเมื่อกด)

'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronDown, Upload, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
import BankIcon, { BANK_NAMES } from '@/components/BankIcon'
import { resolveImageUrl } from '@/lib/imageUrl'

export interface AgentBank {
  bank_code: string
  bank_name: string
  account_number: string
  account_name: string
  transfer_mode?: string
  qr_code_url?: string
}

export interface TransferModalProps {
  depositAmount: number
  depositMode: string // 'manual' | 'easyslip' | 'auto'
  agentBanks: AgentBank[]
  memberBank: { bank_code: string; bank_name: string; account_number: string; account_name: string }
  loading: boolean
  onConfirm: () => void
  onClose: () => void
  onSlipSuccess?: () => void
  toast: { success: (m: string) => void; error: (m: string) => void; warning: (m: string) => void }
}

export function TransferModal({
  depositAmount, depositMode, agentBanks, memberBank, loading, onConfirm, onClose, onSlipSuccess, toast,
}: TransferModalProps) {
  const [seconds, setSeconds] = useState(600)
  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s > 0 ? s - 1 : 0), 1000)
    return () => clearInterval(timer)
  }, [])
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  // Slip upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [verifyResult, setVerifyResult] = useState<{
    status: string; auto_matched: boolean; verify_status: string;
    slip_amount?: number; sender_bank?: string; sender_name?: string
  } | null>(null)

  const bank = agentBanks[0]

  // File select handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1 * 1024 * 1024) { toast.error('ไฟล์ใหญ่เกินไป (สูงสุด 1MB)'); return }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) { toast.error('รองรับเฉพาะ JPEG, PNG, WebP'); return }
    setSelectedFile(file)
    setVerifyResult(null)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  // Upload & verify slip
  const handleUploadSlip = async () => {
    if (!selectedFile) return
    setUploading(true)
    try {
      const { api } = await import('@/lib/api')
      const formData = new FormData()
      formData.append('amount', String(depositAmount))
      formData.append('slip', selectedFile)
      formData.append('verify_type', 'bank')
      const res = await api.post('/wallet/deposit-slip', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }, timeout: 30000,
      })
      setVerifyResult(res.data.data)
      if (res.data.data?.auto_matched) {
        toast.success('ฝากเงินสำเร็จ! เครดิตเข้าแล้ว')
        try {
          const { useAuthStore } = await import('@/store/auth-store')
          const balRes = await api.get('/wallet/balance')
          if (balRes.data.data?.balance !== undefined) useAuthStore.getState().updateBalance(balRes.data.data.balance)
        } catch {}
        setTimeout(() => { onClose(); onSlipSuccess?.() }, 2000)
      } else if (res.data.data?.verify_status === 'duplicate') {
        toast.error('สลิปนี้เคยใช้แล้ว')
      } else {
        toast.warning('แจ้งฝากสำเร็จ รอตรวจสอบ')
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      toast.error(e.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally { setUploading(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200, background: 'var(--ios-bg)',
      display: 'flex', flexDirection: 'column',
      maxWidth: 680, margin: '0 auto',
      borderLeft: '1px solid var(--ios-separator)', borderRight: '1px solid var(--ios-separator)',
    }}>
      {/* ── Header ── */}
      <div style={{
        background: 'var(--ios-card)', padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '0.5px solid var(--ios-separator)', flexShrink: 0,
      }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ChevronLeft size={22} strokeWidth={2.5} color="var(--ios-label)" />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ios-label)' }}>ฝากเงิน</span>
        <div style={{ width: 30 }} />
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 16px', gap: 10, overflowY: 'auto' }}>

        {/* 1. บัญชีของคุณ */}
        {memberBank.account_number && (
          <div style={{
            background: 'linear-gradient(145deg, var(--header-bg) 0%, color-mix(in srgb, var(--header-bg) 70%, black) 100%)',
            borderRadius: 16, padding: '14px 16px', position: 'relative', overflow: 'hidden', color: 'white',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20.5z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-color) 20%, transparent) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>บัญชีของคุณ</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent-color)', background: 'rgba(0,0,0,0.35)', padding: '2px 8px', borderRadius: 10, border: '1px solid color-mix(in srgb, var(--accent-color) 25%, transparent)' }}>ผู้โอน</span>
                </div>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-color)', letterSpacing: 2, margin: '0 0 4px', fontVariantNumeric: 'tabular-nums', textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}>{memberBank.account_number}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{memberBank.bank_name} · {memberBank.account_name}</p>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                <BankIcon code={memberBank.bank_code} size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Arrow — animated bounce */}
        <div style={{ textAlign: 'center', margin: '-4px 0', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--ios-green) 0%, #28a745 100%)',
            boxShadow: '0 2px 10px rgba(52,199,89,0.4)',
            animation: 'bounceArrow 1.5s ease-in-out infinite',
          }}>
            <ChevronDown size={18} color="white" strokeWidth={3} />
          </div>
          <style>{`@keyframes bounceArrow { 0%,100% { transform: translateY(0) } 50% { transform: translateY(4px) } }`}</style>
        </div>

        {/* 2. โอนเข้าบัญชีนี้ (themed by bank) */}
        {bank && (() => {
          const bankThemes: Record<string, { gradient: string; accent: string; glow: string }> = {
            KBANK: { gradient: 'linear-gradient(145deg, #1a5c2a 0%, #0d3318 100%)', accent: '#34C759', glow: 'rgba(52,199,89,0.15)' },
            SCB:   { gradient: 'linear-gradient(145deg, #3d1f6e 0%, #1e0f3d 100%)', accent: '#9b59f0', glow: 'rgba(155,89,240,0.15)' },
            BBL:   { gradient: 'linear-gradient(145deg, #1e3a7a 0%, #0f1d3d 100%)', accent: '#5b9cff', glow: 'rgba(91,156,255,0.15)' },
            KTB:   { gradient: 'linear-gradient(145deg, #1565a8 0%, #0a3358 100%)', accent: '#4fc3f7', glow: 'rgba(79,195,247,0.15)' },
            BAY:   { gradient: 'linear-gradient(145deg, #8a6d1b 0%, #4a3a0e 100%)', accent: '#ffd54f', glow: 'rgba(255,213,79,0.15)' },
            TTB:   { gradient: 'linear-gradient(145deg, #8c2f0e 0%, #4a1807 100%)', accent: '#ff8a65', glow: 'rgba(255,138,101,0.15)' },
            GSB:   { gradient: 'linear-gradient(145deg, #7a1050 0%, #3d0828 100%)', accent: '#f06292', glow: 'rgba(240,98,146,0.15)' },
          }
          const theme = bankThemes[bank.bank_code?.toUpperCase()] || bankThemes.KBANK
          return (
          <div style={{
            background: theme.gradient,
            borderRadius: 16, padding: '14px 16px', position: 'relative', overflow: 'hidden',
            color: 'white', border: `2px solid ${theme.accent}66`,
            boxShadow: `0 4px 16px ${theme.glow}, 0 0 20px ${theme.glow}`,
          }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20.5z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>โอนเข้าบัญชีนี้</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: theme.accent, background: 'rgba(0,0,0,0.35)', padding: '2px 8px', borderRadius: 10, border: `1px solid ${theme.accent}44` }}>บัญชีเว็บ</span>
                </div>
                <p style={{ fontSize: 22, fontWeight: 800, color: theme.accent, letterSpacing: 2, margin: '0 0 4px', fontVariantNumeric: 'tabular-nums', textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}>{bank.account_number}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{BANK_NAMES[bank.bank_code] || bank.bank_name} · {bank.account_name}</p>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                <BankIcon code={bank.bank_code} size={32} />
              </div>
            </div>
          </div>
          )
        })()}

        {/* QR Code — แสดงเฉพาะถ้า admin ตั้งไว้ */}
        {bank?.qr_code_url && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            background: 'var(--ios-card)', borderRadius: 16, padding: '16px',
            boxShadow: 'var(--shadow-card)', border: '1px solid var(--ios-separator)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ios-secondary-label)', textTransform: 'uppercase', letterSpacing: 1 }}>
              หรือสแกน QR พร้อมเพย์
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveImageUrl(bank.qr_code_url)}
              alt="QR พร้อมเพย์"
              style={{
                width: 220, height: 220, objectFit: 'contain',
                background: 'white', borderRadius: 12, padding: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
              onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }}
            />
            <div style={{ fontSize: 11, color: 'var(--ios-tertiary-label)' }}>
              เปิดแอปธนาคาร → สแกน QR → กรอกยอด
            </div>
          </div>
        )}

        {/* 3. ยอดเงิน + countdown */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{
            flex: 1, borderRadius: 14, padding: '14px', textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(52,199,89,0.08) 0%, var(--ios-card) 100%)',
            boxShadow: 'var(--shadow-card)', border: '1px solid rgba(52,199,89,0.12)',
          }}>
            <p style={{ fontSize: 11, color: 'var(--ios-secondary-label)', margin: 0 }}>จำนวนเงิน</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--ios-green)', margin: '4px 0 0', textShadow: '0 0 20px rgba(52,199,89,0.3)' }}>
              ฿{depositAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div style={{
            flex: 1, borderRadius: 14, padding: '14px', textAlign: 'center',
            background: seconds < 60 ? 'linear-gradient(135deg, rgba(255,69,58,0.08) 0%, var(--ios-card) 100%)' : 'var(--ios-card)',
            boxShadow: 'var(--shadow-card)', border: seconds < 60 ? '1px solid rgba(255,69,58,0.15)' : '1px solid transparent',
          }}>
            <p style={{ fontSize: 11, color: 'var(--ios-secondary-label)', margin: 0 }}>โอนภายใน</p>
            <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 2, color: seconds < 60 ? 'var(--ios-red)' : 'var(--ios-green)', margin: '4px 0 0' }}>
              {mm}:{ss}
            </p>
          </div>
        </div>

        {/* MODE: EasySlip */}
        {depositMode === 'easyslip' && (
          <>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileSelect} style={{ display: 'none' }} />
            <div style={{
              background: 'linear-gradient(135deg, rgba(0,122,255,0.06) 0%, var(--ios-card) 100%)',
              borderRadius: 14, padding: '14px', boxShadow: 'var(--shadow-card)',
              border: '1px solid rgba(0,122,255,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Upload size={14} color="#007AFF" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ios-label)' }}>แนบสลิปโอนเงิน</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: '#007AFF', background: 'rgba(0,122,255,0.1)', padding: '2px 6px', borderRadius: 8 }}>ตรวจอัตโนมัติ</span>
              </div>

              {!selectedFile ? (
                <div>
                  <p style={{ fontSize: 12, color: 'var(--ios-secondary-label)', textAlign: 'center', marginBottom: 10, lineHeight: 1.5 }}>
                    โอนเงินเข้าบัญชีเว็บด้านบนแล้ว<br />
                    <strong style={{ color: '#007AFF' }}>กดแนบสลิปเพื่อรับเครดิตทันที</strong>
                  </p>
                  <button onClick={() => fileInputRef.current?.click()} style={{
                    width: '100%', padding: '16px', borderRadius: 14,
                    border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #007AFF 0%, #0055CC 100%)',
                    boxShadow: '0 4px 14px rgba(0,122,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    color: 'white', fontSize: 16, fontWeight: 700,
                  }}>
                    <Upload size={20} /> แนบสลิปโอนเงิน
                  </button>
                  <p style={{ fontSize: 10, color: 'var(--ios-tertiary-label)', textAlign: 'center', marginTop: 6 }}>
                    JPEG, PNG, WebP (สูงสุด 1MB)
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', marginBottom: 10, border: '1px solid var(--ios-separator)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {preview && <img src={preview} alt="สลิป" style={{ width: '100%', maxHeight: 160, objectFit: 'contain', display: 'block', background: '#f5f5f5' }} />}
                    <button onClick={() => { setSelectedFile(null); setPreview(null); setVerifyResult(null) }}
                      style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', color: 'white', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                  {verifyResult && (
                    <div style={{
                      padding: '10px 12px', borderRadius: 10, marginBottom: 10,
                      background: verifyResult.auto_matched ? 'rgba(52,199,89,0.08)' : verifyResult.verify_status === 'duplicate' ? 'rgba(255,69,58,0.08)' : 'rgba(255,159,10,0.08)',
                      border: `1px solid ${verifyResult.auto_matched ? 'rgba(52,199,89,0.3)' : verifyResult.verify_status === 'duplicate' ? 'rgba(255,69,58,0.3)' : 'rgba(255,159,10,0.3)'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {verifyResult.auto_matched ? <CheckCircle size={16} color="#34C759" /> : verifyResult.verify_status === 'duplicate' ? <XCircle size={16} color="#FF453A" /> : <AlertTriangle size={16} color="#FF9F0A" />}
                        <span style={{ fontSize: 13, fontWeight: 700, color: verifyResult.auto_matched ? '#34C759' : verifyResult.verify_status === 'duplicate' ? '#FF453A' : '#FF9F0A' }}>
                          {verifyResult.auto_matched ? 'สำเร็จ! เครดิตเข้าแล้ว' : verifyResult.verify_status === 'duplicate' ? 'สลิปนี้เคยใช้แล้ว' : 'แจ้งฝากสำเร็จ รอตรวจสอบ'}
                        </span>
                      </div>
                      {verifyResult.slip_amount && <p style={{ fontSize: 11, color: 'var(--ios-secondary-label)', margin: '4px 0 0' }}>ยอดในสลิป: ฿{verifyResult.slip_amount.toLocaleString()}{verifyResult.sender_bank ? ` · ${verifyResult.sender_bank}` : ''}</p>}
                    </div>
                  )}
                  {!verifyResult && (
                    <button onClick={handleUploadSlip} disabled={uploading} style={{
                      width: '100%', padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                      color: 'white', border: 'none', cursor: uploading ? 'not-allowed' : 'pointer',
                      background: 'linear-gradient(135deg, #007AFF 0%, #0055CC 100%)', opacity: uploading ? 0.6 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxShadow: '0 4px 14px rgba(0,122,255,0.3)',
                    }}>
                      {uploading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> กำลังตรวจสอบ...</> : <><Upload size={16} /> ส่งสลิปตรวจสอบ</>}
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* MODE: RKAUTO */}
        {depositMode === 'auto' && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,159,10,0.06) 0%, var(--ios-card) 100%)',
            borderRadius: 14, padding: '16px', boxShadow: 'var(--shadow-card)',
            border: '1px solid rgba(255,159,10,0.15)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#FF9F0A', marginBottom: 4 }}>ระบบตรวจจับอัตโนมัติ</p>
            <p style={{ fontSize: 12, color: 'var(--ios-secondary-label)', lineHeight: 1.6, margin: 0 }}>
              โอนเงินเข้าบัญชีเว็บด้านบน<br />ระบบจะตรวจจับยอดโอนและเติมเครดิตให้อัตโนมัติ
            </p>
          </div>
        )}

        {/* MODE: Manual */}
        {depositMode === 'manual' && (
          <div style={{
            background: 'var(--ios-card)', borderRadius: 14, padding: '14px 16px',
            boxShadow: 'var(--shadow-card)', textAlign: 'center',
          }}>
            <p style={{ fontSize: 12, color: 'var(--ios-secondary-label)', margin: 0, lineHeight: 1.6 }}>
              โอนเงินเข้าบัญชีเว็บด้านบน แล้วกด <strong style={{ color: 'var(--ios-green)' }}>&quot;โอนแล้ว ยืนยัน&quot;</strong><br />
              แอดมินจะตรวจสอบและเติมเครดิตให้ภายใน 1-5 นาที
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 16px', flexShrink: 0, background: 'var(--ios-card)',
        borderTop: '0.5px solid var(--ios-separator)',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
      }}>
        {depositMode !== 'easyslip' && <button onClick={onConfirm} disabled={loading || seconds === 0} style={{
          width: '100%', padding: '14px', borderRadius: 14,
          fontSize: 15, fontWeight: 700, color: 'white', border: 'none',
          cursor: (loading || seconds === 0) ? 'not-allowed' : 'pointer',
          background: seconds === 0 ? 'var(--ios-secondary-label)' : 'linear-gradient(135deg, #34C759 0%, #28a745 100%)',
          opacity: (loading || seconds === 0) ? 0.5 : 1, marginBottom: 6,
          boxShadow: seconds === 0 ? 'none' : '0 4px 14px rgba(52,199,89,0.3)',
        }}>
          {loading ? 'กำลังตรวจสอบ...' : seconds === 0 ? 'หมดเวลา' : 'โอนแล้ว ยืนยัน'}
        </button>}

        <button onClick={onClose} style={{
          width: '100%', padding: '8px', borderRadius: 12,
          fontSize: 13, fontWeight: 500, color: 'var(--ios-secondary-label)',
          background: 'transparent', border: 'none', cursor: 'pointer',
        }}>
          ย้อนกลับ
        </button>
      </div>
    </div>
  )
}
