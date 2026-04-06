/**
 * หน้า Wallet — Redesign ตามแบบเจริญดี88
 *
 * Layout ฝากเงิน:
 *   1. Tab switcher (ฝาก / ถอน)
 *   2. บัญชีผู้ใช้ (bank icon + เลขบัญชี + ชื่อ) + label "ใช้บัญชีนี้โอนเท่านั้น"
 *   3. ระบุจำนวนเงิน (input + quick amounts 8 ปุ่ม)
 *   4. ปุ่ม "ยืนยันฝากเงิน"
 *   5. เงื่อนไขการเติมเงิน (collapsible)
 *
 * Layout ถอนเงิน:
 *   1. Tab switcher
 *   2. บัญชีผู้ใช้
 *   3. ระบุจำนวนเงิน (input) + ยอดขั้นต่ำ
 *   4. ปุ่ม "ถอนเงิน"
 *   5. เงื่อนไขการถอนเงิน (collapsible)
 *   6. รายการถอนเงิน (table)
 */

'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronDown, ChevronUp, QrCode } from 'lucide-react'
import { walletApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import BankIcon, { BANK_NAMES } from '@/components/BankIcon'
import { useToast } from '@/components/Toast'
import Link from 'next/link'

// ข้อมูลบัญชี agent สำหรับรับโอน
interface AgentBank { bank_code: string; bank_name: string; account_number: string; account_name: string }

export default function WalletPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>กำลังโหลด...</div>}>
      <WalletContent />
    </Suspense>
  )
}

function WalletContent() {
  const { member, updateBalance } = useAuthStore()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  // Tab ฝาก/ถอน
  const [action, setAction] = useState<'deposit' | 'withdraw'>('deposit')
  useEffect(() => {
    if (searchParams.get('tab') === 'withdraw') setAction('withdraw')
  }, [searchParams])

  // Form state
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  // Collapsible เงื่อนไข
  const [showConditions, setShowConditions] = useState(false)

  // Deposit flow
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [depositAmount, setDepositAmount] = useState(0)
  const [depositAlert, setDepositAlert] = useState<'success' | null>(null)
  const [agentBanks, setAgentBanks] = useState<AgentBank[]>([])

  // Withdraw flow
  const [memberBanks, setMemberBanks] = useState<{ id: number; bank_code: string; bank_name: string; account_number: string; account_name: string; account_type: string; is_default: boolean }[]>([])

  // ประวัติฝาก/ถอน
  const [depositHistory, setDepositHistory] = useState<{ id: number; amount: number; status: string; created_at: string }[]>([])
  const [withdrawHistory, setWithdrawHistory] = useState<{ id: number; amount: number; status: string; created_at: string }[]>([])

  // โหลดประวัติ
  const loadHistory = () => {
    import('@/lib/api').then(({ api }) => {
      api.get('/wallet/deposits?per_page=10').then(res => setDepositHistory(res.data.data?.items || [])).catch(() => {})
      api.get('/wallet/transactions?type=withdraw&per_page=10').then(res => {
        setWithdrawHistory((res.data.data?.items || []).map((t: Record<string, unknown>) => ({
          id: t.id as number, amount: Math.abs(t.amount as number), status: 'completed', created_at: t.created_at as string,
        })))
      }).catch(() => {})
    })
  }

  useEffect(() => { loadHistory() }, [depositAlert])

  // โหลดบัญชี agent + member
  useEffect(() => {
    import('@/lib/api').then(({ api }) => {
      api.get('/agent/bank-accounts').then(res => setAgentBanks(res.data.data || [])).catch(() => {
        setAgentBanks([{ bank_code: 'KBANK', bank_name: 'กสิกรไทย', account_number: '0001234567', account_name: 'บริษัท LOTTO จำกัด' }])
      })
      api.get('/bank-accounts').then(res => setMemberBanks(res.data.data || [])).catch(() => {})
    })
  }, [])

  // Poll เช็คสถานะฝาก
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { api: apiClient } = await import('@/lib/api')
        const res = await apiClient.get('/wallet/deposits?per_page=1')
        const latest = res.data.data?.items?.[0]
        if (latest?.status === 'approved' && latest.approved_at) {
          const elapsed = Date.now() - new Date(latest.approved_at).getTime()
          if (elapsed < 30000) {
            const balRes = await apiClient.get('/wallet/balance')
            if (balRes.data.data?.balance !== undefined) updateBalance(balRes.data.data.balance)
          }
        }
      } catch {}
    }, 10000)
    return () => clearInterval(interval)
  }, [updateBalance])

  // ===== Submit ฝาก/ถอน =====
  const handleSubmit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { toast.warning('กรุณากรอกจำนวนเงิน'); return }

    if (action === 'deposit') {
      setDepositAmount(amt)
      setShowTransferModal(true)
      return
    }

    // ถอนเงิน
    if (amt > (member?.balance || 0)) { toast.error('ยอดเงินไม่เพียงพอ'); return }
    setLoading(true)
    try {
      const { api: apiClient, invalidateCache } = await import('@/lib/api')
      await apiClient.post('/wallet/withdraw', { amount: amt })
      invalidateCache('/wallet') // ⭐ ล้าง cache balance + transactions
      setAmount('')
      toast.success('แจ้งถอนเงินสำเร็จ รอแอดมินอนุมัติ')
      loadHistory()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      toast.error(e.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally { setLoading(false) }
  }

  // ยืนยันโอนแล้ว (ฝากเงิน)
  const handleConfirmTransfer = async () => {
    setLoading(true)
    try {
      const { api: apiClient, invalidateCache } = await import('@/lib/api')
      await apiClient.post('/wallet/deposit', { amount: depositAmount })
      invalidateCache('/wallet') // ⭐ ล้าง cache balance + transactions
      setShowTransferModal(false)
      setDepositAlert('success')
      setAmount('')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      toast.error(e.response?.data?.error || 'เกิดข้อผิดพลาด')
      setShowTransferModal(false)
    } finally { setLoading(false) }
  }

  // ===== หาข้อมูลบัญชีที่จะแสดง =====
  const isDeposit = action === 'deposit'
  let bankCode = member?.bank_code || ''
  let bankName = BANK_NAMES[bankCode] || bankCode
  let bankNumber = member?.bank_account_number || ''
  let bankAccountName = member?.bank_account_name || ''

  if (!isDeposit) {
    const mba = memberBanks.find(b => b.account_type === 'withdraw' && b.is_default) || memberBanks[0]
    if (mba) {
      bankCode = mba.bank_code
      bankName = mba.bank_name || BANK_NAMES[mba.bank_code] || mba.bank_code
      bankNumber = mba.account_number
      bankAccountName = mba.account_name
    }
  }

  return (
    <div style={{ paddingBottom: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 10px', position: 'relative' }}>
        <Link href="/dashboard" style={{ color: 'var(--ios-label)', position: 'absolute', left: 16 }}>
          <ChevronLeft size={22} strokeWidth={2.5} />
        </Link>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 700, color: 'var(--ios-label)' }}>
          {isDeposit ? 'ฝากเงิน' : 'ถอนเงิน'}
        </span>
      </div>

      {/* Tab Switcher */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ background: 'var(--ios-card)', borderRadius: 10, padding: 3, display: 'flex', boxShadow: 'var(--shadow-card)' }}>
          {(['deposit', 'withdraw'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setAction(t); setAmount(''); setShowConditions(false) }}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 14, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: action === t ? (t === 'deposit' ? 'var(--ios-green)' : 'var(--ios-red)') : 'transparent',
                color: action === t ? 'white' : 'var(--ios-secondary-label)',
              }}
            >
              {t === 'deposit' ? 'ฝากเงิน' : 'ถอนเงิน'}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Section 1: บัญชีผู้ใช้ — Mini Credit Card Style ===== */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{
          background: 'linear-gradient(145deg, var(--header-bg) 0%, color-mix(in srgb, var(--header-bg) 70%, black) 100%)',
          borderRadius: 18, padding: '18px 20px',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          color: 'white', minHeight: 120,
        }}>
          {/* SVG pattern — ลายเส้นหรูๆ */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.04,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20.5z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            pointerEvents: 'none',
          }} />
          {/* Corner glow */}
          <div style={{
            position: 'absolute', top: -30, right: -30, width: 140, height: 140,
            background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-color) 15%, transparent) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Top row: label + badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>บัญชีผู้ใช้</span>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
              color: 'var(--accent-color)',
              background: 'rgba(0,0,0,0.3)',
              padding: '3px 10px', borderRadius: 20,
              border: '1px solid color-mix(in srgb, var(--accent-color) 30%, transparent)',
            }}>
              {isDeposit ? 'บัญชีของคุณ' : 'บัญชีรับเงินถอน'}
            </span>
          </div>

          {bankCode ? (
            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Bank icon — มุมขวาบน floating */}
              <div style={{
                position: 'absolute', top: -8, right: 0,
                width: 48, height: 48, borderRadius: 12,
                background: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              }}>
                <BankIcon code={bankCode} size={36} />
              </div>

              {/* Bank name */}
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>{bankName}</p>

              {/* Account number — hero */}
              <p style={{
                fontSize: 22, fontWeight: 800, color: 'var(--accent-color)',
                letterSpacing: 2, fontVariantNumeric: 'tabular-nums',
                margin: '0 0 12px', textShadow: '0 1px 8px rgba(0,0,0,0.3)',
              }}>
                {bankNumber}
              </p>

              {/* Account holder name */}
              <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)', margin: 0, letterSpacing: 0.5 }}>
                {bankAccountName}
              </p>
            </div>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--ios-orange)', textAlign: 'center', padding: '8px 0', position: 'relative', zIndex: 1 }}>
              ยังไม่มีบัญชีธนาคาร กรุณาเพิ่มที่หน้าบัญชี
            </p>
          )}
        </div>
      </div>

      {/* ===== PC: 2 columns / Mobile: 1 column ===== */}
      <div className="wallet-grid">

      {/* ===== Section 2: ระบุจำนวนเงิน ===== */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '16px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ios-label)' }}>ระบุจำนวนเงิน</span>
            <span style={{ fontSize: 12, color: 'var(--ios-secondary-label)' }}>
              ยอดขั้นต่ำ {isDeposit ? '100' : '300'} บาท
            </span>
          </div>

          {/* Input จำนวนเงิน */}
          <div style={{
            background: 'var(--ios-bg)', borderRadius: 12,
            padding: '4px 16px', marginBottom: 12,
            border: amount ? `2px solid var(--ios-green)` : '2px solid var(--ios-separator)',
          }}>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '12px 0',
                textAlign: 'right', fontSize: 24, fontWeight: 700,
                color: 'var(--ios-label)', background: 'transparent',
                border: 'none', outline: 'none',
              }}
            />
          </div>

          {/* Quick amounts — 2 แถว 4 ปุ่ม (เหมือนเจริญดี88) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
            {[100, 200, 500, 1000, 5000, 10000, 15000, 20000].map(a => (
              <button
                key={a}
                onClick={() => setAmount(String(a))}
                style={{
                  padding: '8px 4px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: amount === String(a) ? '1.5px solid var(--ios-green)' : '1.5px solid var(--ios-separator)',
                  background: amount === String(a) ? 'rgba(52,199,89,0.08)' : 'var(--ios-bg)',
                  color: amount === String(a) ? 'var(--ios-green)' : 'var(--ios-label)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                ฿{a >= 1000 ? `${(a / 1000).toLocaleString()}k` : a.toLocaleString()}
              </button>
            ))}
          </div>

          {/* ปุ่ม Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !amount}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '14px', borderRadius: 12,
              fontSize: 16, fontWeight: 700, color: 'white', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: isDeposit ? 'var(--ios-green)' : 'var(--ios-red)',
              opacity: (loading || !amount) ? 0.5 : 1,
              minHeight: 50,
            }}
          >
            <QrCode size={20} strokeWidth={2} />
            {loading ? 'กำลังดำเนินการ...' : isDeposit ? 'ยืนยันฝากเงิน' : 'ถอนเงิน'}
          </button>
        </div>
      </div>

      {/* ===== Column 2 (PC) ===== */}
      <div>

      {/* ===== Section 3: เงื่อนไข (collapsible) ===== */}
      <div style={{ padding: '0 16px 12px' }}>
        <button
          onClick={() => setShowConditions(v => !v)}
          style={{
            width: '100%', background: 'var(--ios-card)', borderRadius: 16,
            padding: '14px 16px', boxShadow: 'var(--shadow-card)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ios-label)' }}>
            เงื่อนไขการ{isDeposit ? 'เติมเงิน' : 'ถอนเงิน'}
          </span>
          {showConditions ? <ChevronUp size={18} color="var(--ios-secondary-label)" /> : <ChevronDown size={18} color="var(--ios-secondary-label)" />}
        </button>

        {showConditions && (
          <div style={{
            background: 'var(--ios-card)', borderRadius: '0 0 16px 16px',
            padding: '0 16px 16px', marginTop: -8,
            fontSize: 13, color: 'var(--ios-secondary-label)', lineHeight: 1.8,
          }}>
            {isDeposit ? (
              <>
                <p style={{ fontWeight: 600, color: 'var(--ios-label)', marginBottom: 4 }}>ธนาคารออนไลน์ ปรับปรุงระบบทุกวัน ดังนี้</p>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>(SCB) ไทยพาณิชย์ 23.00-00.00 น.</li>
                  <li>(KTB) กรุงไทย 23.00-03.00 น.</li>
                  <li>(KBANK) กสิกรไทย 01.00-03.30 น.</li>
                  <li>(BBL) กรุงเทพ 23.00-23.30 น. และ 02.30-04.00 น.</li>
                  <li>(BAY) กรุงศรี 23.30-00.30 น.</li>
                </ul>
              </>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>ยอดขั้นต่ำ 300 บาท</li>
                <li>ถอนได้สูงสุด 50,000 บาท/ครั้ง</li>
                <li>ต้องเดิมพัน 1 เท่าของยอดฝากก่อนถอน</li>
                <li>ระบบจะโอนเข้าบัญชีภายใน 1-5 นาที</li>
                <li>หากยอดเกิน 50,000 บาท อาจใช้เวลาตรวจสอบเพิ่มเติม</li>
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ===== Section 4: ประวัติ (table style ตามแบบเจริญดี88) ===== */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--ios-separator)' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ios-label)' }}>
              รายการ{isDeposit ? 'ฝากเงิน' : 'ถอนเงิน'}
            </span>
          </div>

          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
            padding: '10px 16px',
            fontSize: 11, fontWeight: 700, color: 'var(--accent-color)',
            textTransform: 'uppercase', letterSpacing: 0.5,
            background: 'linear-gradient(135deg, var(--header-bg) 0%, color-mix(in srgb, var(--header-bg) 70%, black) 100%)',
            backgroundImage: `linear-gradient(135deg, var(--header-bg) 0%, color-mix(in srgb, var(--header-bg) 70%, black) 100%), url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20.5z' fill='%23ffffff' fill-opacity='0.04' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            borderRadius: '12px 12px 0 0',
          }}>
            <span>วันที่</span>
            <span>ช่องทาง</span>
            <span style={{ textAlign: 'right' }}>จำนวนเงิน</span>
            <span style={{ textAlign: 'right' }}>สถานะ</span>
          </div>

          {/* Table rows */}
          {(() => {
            const items = isDeposit
              ? depositHistory.filter(d => !['expired', 'cancelled'].includes(d.status)).slice(0, 5)
              : withdrawHistory.slice(0, 5)

            if (items.length === 0) return (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ios-tertiary-label)', fontSize: 14 }}>
                ไม่มีข้อมูล
              </div>
            )

            return items.map((item, idx) => {
              const isPending = item.status === 'pending'
              const isSuccess = item.status === 'approved' || item.status === 'completed'
              return (
                <div key={item.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  padding: '10px 16px', alignItems: 'center',
                  borderBottom: idx < items.length - 1 ? '0.5px solid var(--ios-separator)' : 'none',
                  fontSize: 13,
                }}>
                  <span style={{ color: 'var(--ios-secondary-label)' }}>
                    {new Date(item.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  </span>
                  <span style={{ color: 'var(--ios-secondary-label)' }}>
                    {isDeposit ? 'โอนเงิน' : 'ธนาคาร'}
                  </span>
                  <span style={{ textAlign: 'right', fontWeight: 600, color: isDeposit ? 'var(--ios-green)' : 'var(--ios-label)' }}>
                    {isDeposit ? '+' : '-'}฿{item.amount.toLocaleString()}
                  </span>
                  <span style={{
                    textAlign: 'right', fontSize: 11, fontWeight: 600,
                    color: isPending ? 'var(--ios-orange)' : isSuccess ? 'var(--ios-green)' : 'var(--ios-red)',
                  }}>
                    {isPending ? 'รอตรวจสอบ' : isSuccess ? 'สำเร็จ' : item.status === 'rejected' ? 'ปฏิเสธ' : item.status}
                  </span>
                </div>
              )
            })
          })()}
        </div>
      </div>

      </div>{/* close column 2 */}
      </div>{/* close wallet-grid */}

      {/* ===== Transfer Modal — ตามแบบเจริญดี88 ===== */}
      {showTransferModal && <TransferModal
        depositAmount={depositAmount}
        agentBanks={agentBanks}
        memberBank={{ bank_code: bankCode, bank_name: bankName, account_number: bankNumber, account_name: bankAccountName }}
        loading={loading}
        onConfirm={handleConfirmTransfer}
        onClose={() => setShowTransferModal(false)}
        toast={toast}
      />}

      {/* ===== Deposit Success Alert ===== */}
      {depositAlert === 'success' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: 'var(--ios-card)', borderRadius: 20, padding: '32px 24px',
            textAlign: 'center', maxWidth: 320, width: '100%',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--ios-label)', marginBottom: 8 }}>แจ้งฝากเงินสำเร็จ!</p>
            <p style={{ fontSize: 14, color: 'var(--ios-secondary-label)', marginBottom: 6 }}>
              แจ้งฝากเงิน ฿{depositAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ios-orange)', marginBottom: 20 }}>
              รอแอดมินตรวจสอบและอนุมัติ
            </p>
            <button
              onClick={() => setDepositAlert(null)}
              style={{
                width: '100%', padding: '14px', borderRadius: 12,
                fontSize: 16, fontWeight: 700, color: 'white', border: 'none',
                cursor: 'pointer', background: 'var(--ios-green)',
              }}
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// TransferModal — หน้าแสดงบัญชีเว็บหลังกดฝากเงิน (ตามแบบเจริญดี88)
//
// Layout:
//   1. Warning banner สีเหลือง "ใช้บัญชีนี้โอนเท่านั้น!!"
//   2. บัญชีเว็บ + bank icon + เลขบัญชี
//   3. Countdown timer "กรุณาโอนภายใน XX:XX"
//   4. หมายเลขอ้างอิง + ปุ่มคัดลอก
//   5. ข้อความ "ยอดไม่เข้าภายใน 2 นาที กรุณาแนบสลิป"
//   6. ปุ่ม "โอนแล้ว ยืนยัน"
// =============================================================================
function TransferModal({ depositAmount, agentBanks, memberBank, loading, onConfirm, onClose, toast }: {
  depositAmount: number
  agentBanks: AgentBank[]
  memberBank: { bank_code: string; bank_name: string; account_number: string; account_name: string }
  loading: boolean
  onConfirm: () => void
  onClose: () => void
  toast: { success: (m: string) => void; error: (m: string) => void; warning: (m: string) => void }
}) {
  // Countdown timer — 10 นาที
  const [seconds, setSeconds] = useState(600)
  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s > 0 ? s - 1 : 0), 1000)
    return () => clearInterval(timer)
  }, [])
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  // สร้างหมายเลขอ้างอิง (unique per session)
  const [refNo] = useState(() => {
    const hex = () => Math.random().toString(16).slice(2, 10)
    return `${hex()}-${hex().slice(0,4)}-${hex().slice(0,4)}-${hex()}`
  })

  const bank = agentBanks[0] // บัญชีหลัก

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200, background: 'var(--ios-bg)',
      display: 'flex', flexDirection: 'column',
      maxWidth: 680, margin: '0 auto',
      borderLeft: '1px solid var(--ios-separator)',
      borderRight: '1px solid var(--ios-separator)',
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--ios-card)', padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '0.5px solid var(--ios-separator)', flexShrink: 0,
      }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ChevronLeft size={22} strokeWidth={2.5} color="var(--ios-label)" />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ios-label)' }}>ฝากเงิน</span>
        <div style={{ width: 30 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ===== 1. บัญชีของคุณ (ผู้โอน) ===== */}
        {memberBank.account_number && (
          <div style={{
            margin: '12px 16px', background: 'var(--ios-card)', borderRadius: 16,
            padding: '14px 16px', boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--ios-secondary-label)' }}>บัญชีของคุณ (ผู้โอน)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <BankIcon code={memberBank.bank_code} size={28} />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ios-label)' }}>
                  {memberBank.bank_name}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--ios-label)', letterSpacing: 1 }}>
                {memberBank.account_number}
              </span>
              <span style={{ fontSize: 13, color: 'var(--ios-secondary-label)' }}>{memberBank.account_name}</span>
            </div>
          </div>
        )}

        {/* ===== 2. Warning + บัญชีเว็บ (โอนเข้า) ===== */}
        <div style={{
          margin: '0 16px 12px', padding: '10px 14px', borderRadius: 10,
          background: 'rgba(255,204,0,0.12)', border: '1px solid rgba(255,204,0,0.3)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#cc9900' }}>
            โอนเข้าบัญชีนี้เท่านั้น!!
          </span>
        </div>

        {/* ===== PC 2-column grid ===== */}
        <div className="transfer-grid">

        {/* Left column */}
        <div>
        {/* ===== บัญชีเว็บ (ปลายทาง) ===== */}
        {bank && (
          <div style={{
            margin: '0 16px 12px', background: 'var(--ios-card)', borderRadius: 16,
            padding: '14px 16px', boxShadow: 'var(--shadow-card)',
            border: '2px solid var(--ios-green)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ios-green)' }}>โอนเข้าบัญชีนี้</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <BankIcon code={bank.bank_code} size={28} />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ios-label)' }}>
                  {BANK_NAMES[bank.bank_code] || bank.bank_name}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--ios-green)', letterSpacing: 1 }}>
                {bank.account_number}
              </span>
              <span style={{ fontSize: 13, color: 'var(--ios-secondary-label)' }}>{bank.account_name}</span>
            </div>
          </div>
        )}

        {/* ===== 3. Countdown Timer ===== */}
        <div style={{
          margin: '0 16px 12px', background: 'var(--ios-card)', borderRadius: 16,
          padding: '14px', textAlign: 'center', boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, color: 'var(--ios-secondary-label)' }}>กรุณาโอนภายใน :</span>
            <span style={{
              fontSize: 28, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 2,
              color: seconds < 60 ? 'var(--ios-red)' : 'var(--ios-green)',
            }}>
              {mm} : {ss}
            </span>
          </div>
        </div>

        {/* ===== 4. จำนวนเงิน ===== */}
        <div style={{
          margin: '0 16px 12px', background: 'var(--ios-card)', borderRadius: 16,
          padding: '20px', textAlign: 'center', boxShadow: 'var(--shadow-card)',
        }}>
          <p style={{ fontSize: 12, color: 'var(--ios-secondary-label)', marginBottom: 6 }}>จำนวนเงินที่ต้องโอน</p>
          <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--ios-green)' }}>
            ฿{depositAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </p>
        </div>

        </div>{/* close left column */}

        {/* Right column */}
        <div>
        {/* ===== 5. หมายเลขอ้างอิง ===== */}
        <div style={{
          margin: '0 16px 12px', background: 'var(--ios-card)', borderRadius: 16,
          padding: '12px 16px', boxShadow: 'var(--shadow-card)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontSize: 12, color: 'var(--ios-secondary-label)' }}>หมายเลขอ้างอิง : </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-orange)', fontFamily: 'monospace' }}>
              {refNo.slice(0, 20)}...
            </span>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(refNo); toast.success('คัดลอกหมายเลขอ้างอิงแล้ว') }}
            style={{
              padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: '1px solid var(--ios-separator)', background: 'var(--ios-bg)',
              color: 'var(--ios-green)', cursor: 'pointer',
            }}
          >
            คัดลอก
          </button>
        </div>

        {/* ===== 6. ข้อความแนบสลิป ===== */}
        <div style={{
          margin: '0 16px 12px', background: 'var(--ios-card)', borderRadius: 16,
          padding: '14px 16px', textAlign: 'center', boxShadow: 'var(--shadow-card)',
        }}>
          <p style={{ fontSize: 13, color: 'var(--ios-secondary-label)', marginBottom: 4 }}>
            กรุณาแคปหน้าจอเพื่อนำไปใช้สแกน หรือบันทึกข้อมูล
          </p>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-orange)' }}>
            ยอดไม่เข้าภายใน 2 นาที กรุณาแนบสลิป
          </p>
        </div>
        </div>
        </div>
      </div>

      {/* ===== Footer: ปุ่มโอนแล้ว + ย้อนกลับ ===== */}
      <div style={{
        padding: '12px 16px', flexShrink: 0, background: 'var(--ios-card)',
        borderTop: '0.5px solid var(--ios-separator)',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
      }}>
        <button
          onClick={onConfirm}
          disabled={loading || seconds === 0}
          style={{
            width: '100%', padding: '14px', borderRadius: 12,
            fontSize: 17, fontWeight: 700, color: 'white', border: 'none',
            cursor: (loading || seconds === 0) ? 'not-allowed' : 'pointer',
            background: seconds === 0 ? 'var(--ios-secondary-label)' : 'var(--ios-green)',
            opacity: (loading || seconds === 0) ? 0.5 : 1,
            minHeight: 50, marginBottom: 8,
          }}
        >
          {loading ? 'กำลังตรวจสอบ...' : seconds === 0 ? 'หมดเวลา กรุณาทำรายการใหม่' : 'โอนแล้ว ยืนยัน'}
        </button>
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '10px', borderRadius: 12,
            fontSize: 14, fontWeight: 500, color: 'var(--ios-secondary-label)',
            background: 'transparent', border: 'none', cursor: 'pointer',
          }}
        >
          ย้อนกลับ
        </button>
      </div>
    </div>
  )
}
