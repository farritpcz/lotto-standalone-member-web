// Page: /wallet (member) — deposit/withdraw + history
// Related: components/wallet/*
//
// Layout ฝากเงิน: Tab → BankDisplayCard → Mode selector → AmountForm → Conditions → HistoryTable
// Layout ถอนเงิน: Tab → BankDisplayCard → AmountForm → Conditions → HistoryTable

'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { BANK_NAMES } from '@/components/BankIcon'
import { useToast } from '@/components/Toast'
import { useAuthStore } from '@/store/auth-store'
import Link from 'next/link'

import { TransferModal, type AgentBank } from '@/components/wallet/TransferModal'
import { BankDisplayCard } from '@/components/wallet/BankDisplayCard'
import { HistoryTable } from '@/components/wallet/HistoryTable'
import { AmountForm } from '@/components/wallet/AmountForm'

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

  // ===== deposit modes =====
  const hasAutoOrManual = agentBanks.some(b => b.transfer_mode === 'manual' || b.transfer_mode === 'auto')
  const hasEasySlip = agentBanks.some(b => b.transfer_mode === 'easyslip')

  const availableModes: { key: string; label: string; desc: string; icon: string }[] = []
  if (hasAutoOrManual) availableModes.push({ key: 'auto', label: 'ฝากอัตโนมัติ', desc: 'โอนแล้วรอระบบตรวจ', icon: '⚡' })
  if (hasEasySlip) availableModes.push({ key: 'easyslip', label: 'ฝากแนบสลิป', desc: 'เครดิตเข้าทันที', icon: '📎' })

  const [selectedDepositMode, setSelectedDepositMode] = useState('')
  const depositMode = selectedDepositMode || availableModes[0]?.key || 'manual'

  const agentBankForMode = depositMode === 'easyslip'
    ? agentBanks.find(b => b.transfer_mode === 'easyslip') || agentBanks[0]
    : agentBanks.find(b => b.transfer_mode === 'manual' || b.transfer_mode === 'auto') || agentBanks[0]

  // ===== ข้อมูลบัญชีที่จะแสดง =====
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

  const historyItems = isDeposit
    ? depositHistory.filter(d => !['expired', 'cancelled'].includes(d.status)).slice(0, 5)
    : withdrawHistory.slice(0, 5)

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

      {/* Section 1: บัญชีผู้ใช้ */}
      <div style={{ padding: '0 16px 12px' }}>
        <BankDisplayCard
          isDeposit={isDeposit}
          depositMode={depositMode}
          bankCode={bankCode}
          bankName={bankName}
          bankNumber={bankNumber}
          bankAccountName={bankAccountName}
        />
      </div>

      {/* Section 1.5: deposit mode selector */}
      {isDeposit && availableModes.length > 1 && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {availableModes.map(mode => {
              const isActive = depositMode === mode.key
              const color = mode.key === 'easyslip' ? '#007AFF' : mode.key === 'qrcode' ? '#AF52DE' : '#34C759'
              return (
                <button
                  key={mode.key}
                  onClick={() => setSelectedDepositMode(mode.key)}
                  style={{
                    flex: 1, padding: '14px 12px', borderRadius: 14,
                    border: `2px solid ${isActive ? color : 'var(--ios-separator)'}`,
                    background: isActive ? `${color}0D` : 'var(--ios-card)',
                    cursor: 'pointer', textAlign: 'center',
                    boxShadow: isActive ? `0 2px 12px ${color}20` : 'var(--shadow-card)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{mode.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? color : 'var(--ios-label)' }}>{mode.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--ios-secondary-label)', marginTop: 2 }}>{mode.desc}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* PC: 2 columns / Mobile: 1 column */}
      <div className="wallet-grid">

        {/* Section 2: amount form */}
        <div style={{ padding: '0 16px 12px' }}>
          <AmountForm
            isDeposit={isDeposit}
            amount={amount}
            setAmount={setAmount}
            loading={loading}
            onSubmit={handleSubmit}
          />
        </div>

        {/* Column 2 (PC) */}
        <div>

          {/* Section 3: conditions */}
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

          {/* Section 4: history */}
          <div style={{ padding: '0 16px 16px' }}>
            <HistoryTable isDeposit={isDeposit} items={historyItems} />
          </div>

        </div>{/* close column 2 */}
      </div>{/* close wallet-grid */}

      {/* Transfer Modal */}
      {showTransferModal && <TransferModal
        depositAmount={depositAmount}
        depositMode={depositMode}
        agentBanks={agentBankForMode ? [agentBankForMode] : agentBanks}
        memberBank={{ bank_code: bankCode, bank_name: bankName, account_number: bankNumber, account_name: bankAccountName }}
        loading={loading}
        onConfirm={handleConfirmTransfer}
        onClose={() => setShowTransferModal(false)}
        onSlipSuccess={() => { setShowTransferModal(false); setDepositAlert('success'); setAmount(''); loadHistory() }}
        toast={toast}
      />}

      {/* Deposit Success Alert */}
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
