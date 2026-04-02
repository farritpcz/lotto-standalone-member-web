/**
 * หน้า Wallet — iOS 17 HIG Design
 * ฝาก-ถอน + ประวัติธุรกรรม
 */

'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { walletApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/components/Toast'
import type { Transaction } from '@/types'

const txTypeLabels: Record<string, string> = {
  deposit: 'ฝากเงิน', withdraw: 'ถอนเงิน', bet: 'แทงหวย', win: 'ชนะรางวัล', refund: 'คืนเงิน',
}

// แปลง bank code → ชื่อธนาคารภาษาไทย
const BANK_NAMES: Record<string, string> = {
  SCB: 'ไทยพาณิชย์', KBANK: 'กสิกรไทย', BBL: 'กรุงเทพ', KTB: 'กรุงไทย',
  BAY: 'กรุงศรีอยุธยา', TTB: 'ทหารไทยธนชาต', GSB: 'ออมสิน', BAAC: 'ธกส.',
  UOB: 'ยูโอบี', CITI: 'ซิตี้แบงก์',
}
// สีโลโก้ธนาคาร
const BANK_COLORS: Record<string, string> = {
  SCB: '#4E2A84', KBANK: '#138F2D', BBL: '#1E22AA', KTB: '#1BA5E0',
  BAY: '#FEC43B', TTB: '#0050F0', GSB: '#EB1478', BAAC: '#4B9560',
  UOB: '#0033A0', CITI: '#003B70',
}
const txTypeIcons: Record<string, string> = {
  deposit: '💰', withdraw: '🏧', bet: '🎰', win: '🏆', refund: '↩️',
}

// ข้อมูลบัญชี agent สำหรับรับโอน (จะดึงจาก API จริงทีหลัง)
interface AgentBank { bank_code: string; bank_name: string; account_number: string; account_name: string }

export default function WalletPage() {
  const { member, updateBalance } = useAuthStore()
  const { toast } = useToast()
  const [amount, setAmount] = useState('')
  const [action, setAction] = useState<'deposit' | 'withdraw'>('deposit')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  // ── Deposit flow states ──
  const [showTransferModal, setShowTransferModal] = useState(false)  // แสดงบัญชี agent
  const [depositAmount, setDepositAmount] = useState(0)              // จำนวนที่จะฝาก
  const [depositAlert, setDepositAlert] = useState<'success' | null>(null)
  const [agentBanks, setAgentBanks] = useState<AgentBank[]>([])      // บัญชี agent
  const [memberBanks, setMemberBanks] = useState<{ id: number; bank_code: string; bank_name: string; account_number: string; account_name: string; account_type: string; is_default: boolean }[]>([]) // บัญชีสมาชิก

  // ดึงประวัติฝาก/ถอน (deposit_requests + withdraw ล่าสุด)
  const [depositHistory, setDepositHistory] = useState<{ id: number; amount: number; status: string; auto_matched: boolean; created_at: string }[]>([])
  const [withdrawHistory, setWithdrawHistory] = useState<{ id: number; amount: number; status: string; created_at: string }[]>([])

  const loadHistory = () => {
    import('@/lib/api').then(({ api }) => {
      api.get('/wallet/deposits?per_page=10').then(res => setDepositHistory(res.data.data?.items || [])).catch(() => {})
      api.get('/wallet/transactions?type=withdraw&per_page=10').then(res => {
        // fallback: ดึงจาก transactions ถ้า deposits endpoint ยังไม่มี
        setWithdrawHistory((res.data.data?.items || []).map((t: Record<string, unknown>) => ({
          id: t.id as number, amount: Math.abs(t.amount as number), status: 'completed', created_at: t.created_at as string,
        })))
      }).catch(() => {})
    })
  }

  useEffect(() => { loadHistory() }, [message, depositAlert])

  // ยังคงดึง transactions สำหรับ backward compat
  useEffect(() => {
    walletApi.getTransactions({ per_page: 30 })
      .then(res => setTransactions(res.data.data?.items || []))
      .catch(() => {})
  }, [message, depositAlert])

  // ดึงบัญชี agent (ฝาก) + บัญชีสมาชิก (ถอน)
  useEffect(() => {
    import('@/lib/api').then(({ api }) => {
      api.get('/agent/bank-accounts').then(res => {
        setAgentBanks(res.data.data || [])
      }).catch(() => {
        setAgentBanks([{
          bank_code: 'KBANK', bank_name: 'ธนาคารกสิกรไทย',
          account_number: '0001234567', account_name: 'บริษัท LOTTO จำกัด',
        }])
      })
      // ดึงบัญชีสมาชิก (สำหรับเลือกถอน)
      api.get('/bank-accounts').then(res => {
        setMemberBanks(res.data.data || [])
      }).catch(() => {})
    })
  }, [])

  const handleSubmit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { toast.warning('กรุณากรอกจำนวนเงิน'); return }
    setMessage('')

    if (action === 'deposit') {
      // ── ฝากเงิน: แสดงบัญชี agent ให้โอน ──
      setDepositAmount(amt)
      setShowTransferModal(true)
      return
    }

    // ── ถอนเงิน: สร้างคำขอถอน (ไม่หักเงินทันที รอแอดมินอนุมัติ) ──
    if (amt > (member?.balance || 0)) { toast.error('ยอดเงินไม่เพียงพอ'); return }
    setLoading(true)
    try {
      await (await import('@/lib/api')).api.post('/wallet/withdraw', { amount: amt })
      setAmount('')
      toast.success('แจ้งถอนเงินสำเร็จ รอแอดมินอนุมัติ')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      toast.error(axiosErr.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  // ลูกค้ากดยืนยันว่าโอนแล้ว → สร้างคำขอฝาก
  const handleConfirmTransfer = async () => {
    setLoading(true)
    try {
      await (await import('@/lib/api')).api.post('/wallet/deposit', { amount: depositAmount })
      setShowTransferModal(false)
      setDepositAlert('success')
      setAmount('')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const errMsg = axiosErr.response?.data?.error || 'เกิดข้อผิดพลาด'
      toast.error(errMsg)
      setShowTransferModal(false)
    } finally {
      setLoading(false)
    }
  }

  // ── Poll เช็คสถานะฝาก pending → ถ้าสำเร็จแสดง push notification ──
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { api: apiClient } = await import('@/lib/api')
        // เช็คว่ามี approved deposit ใหม่หรือไม่
        const res = await apiClient.get('/wallet/deposits?per_page=1')
        const latest = res.data.data?.items?.[0]
        if (latest && latest.status === 'approved' && latest.approved_at) {
          const approvedTime = new Date(latest.approved_at).getTime()
          const now = Date.now()
          // ถ้าอนุมัติภายใน 30 วินาที → แจ้งเตือน
          if (now - approvedTime < 30000) {
            // ใช้ toast notification
            import('@/components/Toast').then(({ useToast }) => {
              // Note: useToast ใช้ใน component เท่านั้น — ใช้ custom event แทน
            }).catch(() => {})
            // Refresh balance
            const balRes = await apiClient.get('/wallet/balance')
            if (balRes.data.data?.balance !== undefined) {
              const { useAuthStore } = await import('@/store/auth-store')
              useAuthStore.getState().updateBalance(balRes.data.data.balance)
            }
          }
        }
      } catch {}
    }, 10000) // เช็คทุก 10 วินาที
    return () => clearInterval(interval)
  }, [])

  const isSuccess = message && message.includes('สำเร็จ')

  return (
    <div>
      {/* Balance Card */}
      <div style={{ padding: '16px 16px 8px' }}>
        <div className="balance-card" style={{ textAlign: 'center', paddingTop: 24, paddingBottom: 24 }}>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 8 }}>ยอดเงินคงเหลือ</p>
          <p style={{ color: 'white', fontSize: 36, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1 }}>
            ฿{member?.balance?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'}
          </p>
        </div>
      </div>

      {/* Action Toggle — iOS segmented control */}
      <div style={{ padding: '8px 16px 16px' }}>
        <div style={{
          background: 'var(--ios-card)',
          borderRadius: 12,
          padding: 4,
          display: 'flex',
          gap: 4,
          boxShadow: 'var(--shadow-card)',
        }}>
          <button
            onClick={() => setAction('deposit')}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 15,
              border: 'none',
              cursor: 'pointer',
              background: action === 'deposit' ? 'var(--ios-green)' : 'transparent',
              color: action === 'deposit' ? 'white' : 'var(--ios-secondary-label)',
              transition: 'all 0.15s',
              minHeight: 44,
            }}
          >
            ฝากเงิน
          </button>
          <button
            onClick={() => setAction('withdraw')}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 15,
              border: 'none',
              cursor: 'pointer',
              background: action === 'withdraw' ? 'var(--ios-red)' : 'transparent',
              color: action === 'withdraw' ? 'white' : 'var(--ios-secondary-label)',
              transition: 'all 0.15s',
              minHeight: 44,
            }}
          >
            ถอนเงิน
          </button>
        </div>
      </div>

      {/* ── บัญชีของคุณ (ฝาก) ─────────────────────────────── */}
      {action === 'deposit' && member?.bank_code && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0d6e6e 0%, #1a8a6e 100%)',
            borderRadius: 16, padding: '16px 18px',
            boxShadow: '0 4px 20px rgba(13,110,110,0.2)',
            color: 'white',
          }}>
            <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.8, marginBottom: 8, letterSpacing: 0.5 }}>
              บัญชีที่ใช้โอนเงินเข้าระบบ
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 12, flexShrink: 0,
            }}>
              {member.bank_code}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
                {BANK_NAMES[member.bank_code] || member.bank_code}
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 1.5, marginBottom: 2 }}>
                {member.bank_account_number || '—'}
              </div>
              {member.bank_account_name && (
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {member.bank_account_name}
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      )}

      {/* บัญชีถอนเงิน — แสดงเฉพาะตอนถอน */}
      {action === 'withdraw' && (
        <div style={{ padding: '0 16px 12px' }}>
          {memberBanks.filter(b => b.account_type === 'withdraw' && b.is_default).length > 0 ? (
            <div style={{
              background: 'var(--ios-card)', borderRadius: 16, padding: 16,
              boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              {(() => {
                const bank = memberBanks.find(b => b.account_type === 'withdraw' && b.is_default) || memberBanks[0]
                return bank ? (<>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 800, fontSize: 12, flexShrink: 0,
                  }}>
                    {bank.bank_code}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--ios-secondary-label)', marginBottom: 3 }}>
                      บัญชีรับเงินถอน
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ios-label)' }}>
                      {bank.bank_name || bank.bank_code}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: 1 }}>
                      {bank.account_number}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ios-secondary-label)' }}>{bank.account_name}</div>
                  </div>
                </>) : null
              })()}
            </div>
          ) : member?.bank_code ? (
            <div style={{
              background: 'var(--ios-card)', borderRadius: 16, padding: 16,
              boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: 12, flexShrink: 0,
              }}>
                {member.bank_code}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--ios-secondary-label)', marginBottom: 3 }}>บัญชีรับเงินถอน (จากโปรไฟล์)</div>
                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: 1 }}>{member.bank_account_number}</div>
                <div style={{ fontSize: 12, color: 'var(--ios-secondary-label)' }}>{member.bank_account_name}</div>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#ef4444', textAlign: 'center',
            }}>
              คุณยังไม่มีบัญชีรับเงินถอน กรุณาเพิ่มที่หน้าบัญชีผู้ใช้
            </div>
          )}
        </div>
      )}

      {/* แจ้งเตือนถ้ายังไม่มีบัญชีธนาคาร */}
      {action === 'deposit' && !member?.bank_code && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{
            background: 'rgba(255,159,10,0.08)',
            border: '1px solid rgba(255,159,10,0.2)',
            borderRadius: 12,
            padding: '12px 16px',
            fontSize: 14,
            color: '#c87800',
            textAlign: 'center',
          }}>
            คุณยังไม่ได้เพิ่มบัญชีธนาคาร กรุณาเพิ่มที่หน้าบัญชีผู้ใช้ก่อนฝากเงิน
          </div>
        </div>
      )}

      {/* Amount Input card */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '20px 16px', boxShadow: 'var(--shadow-card)' }}>

          {/* จำนวนเงิน Label */}
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-secondary-label)', marginBottom: 10, textAlign: 'center' }}>
            จำนวนเงิน{action === 'deposit' ? 'ฝาก' : 'ถอน'}
          </div>

          {/* Number input — ใหญ่ตรงกลาง */}
          <div style={{
            background: 'var(--ios-bg)',
            borderRadius: 14,
            marginBottom: 14,
            padding: '4px 16px',
            border: amount ? '2px solid var(--ios-green)' : '2px solid var(--ios-separator)',
            transition: 'border-color 0.2s',
          }}>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min={1}
              style={{
                display: 'block',
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 0',
                textAlign: 'center',
                fontSize: 32,
                fontWeight: 800,
                color: 'var(--ios-label)',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Quick amounts — pill style */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, justifyContent: 'center' }}>
            {[100, 500, 1000, 5000].map(a => (
              <button
                key={a}
                onClick={() => setAmount(String(a))}
                style={{
                  padding: '8px 16px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: amount === String(a) ? 'var(--ios-green)' : 'var(--ios-bg)',
                  color: amount === String(a) ? 'white' : 'var(--ios-label)',
                  transition: 'all 0.15s',
                  boxShadow: amount === String(a) ? '0 2px 8px rgba(52,199,89,0.3)' : 'none',
                }}
              >
                ฿{a.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Message */}
          {message && (
            <div style={{
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 12,
              fontSize: 14,
              fontWeight: 500,
              textAlign: 'center',
              background: isSuccess ? 'rgba(52,199,89,0.10)' : 'rgba(255,59,48,0.10)',
              color: isSuccess ? 'var(--ios-green-dark)' : 'var(--ios-red)',
            }}>
              {isSuccess ? '✓' : '✗'} {message}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              display: 'block',
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              fontSize: 17,
              fontWeight: 600,
              color: 'white',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: action === 'deposit' ? 'var(--ios-green)' : 'var(--ios-red)',
              opacity: loading ? 0.6 : 1,
              minHeight: 50,
              boxShadow: action === 'deposit'
                ? '0 4px 16px rgba(52,199,89,0.3)'
                : '0 4px 16px rgba(255,59,48,0.25)',
            }}
          >
            {loading ? 'กำลังดำเนินการ...' : action === 'deposit' ? 'ยืนยันฝากเงิน' : 'ยืนยันถอนเงิน'}
          </button>
        </div>
      </div>

      {/* ── ประวัติฝาก/ถอน ─────────────────────────────────────── */}
      <div className="section-title">
        <span>รายการฝาก/ถอน</span>
      </div>
      <div style={{ padding: '0 16px', paddingBottom: 16 }}>
        {(() => {
          // รวม deposit + withdraw → ซ่อน expired/cancelled → เรียงวันที่
          const allItems = [
            ...depositHistory.map(d => ({ ...d, type: 'deposit' as const })),
            ...withdrawHistory.map(w => ({ ...w, type: 'withdraw' as const })),
          ]
            .filter(i => !['expired', 'cancelled'].includes(i.status))
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 10)

          if (allItems.length === 0) {
            return (
              <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '40px 16px', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
                <p style={{ color: 'var(--ios-secondary-label)', fontSize: 15 }}>ยังไม่มีรายการ</p>
              </div>
            )
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allItems.map((item) => {
                const isDeposit = item.type === 'deposit'
                const isPending = item.status === 'pending'
                const isSuccess = item.status === 'approved' || item.status === 'completed'
                const isRejected = item.status === 'rejected'

                return (
                  <div key={`${item.type}-${item.id}`} style={{
                    background: 'var(--ios-card)', borderRadius: 14,
                    padding: '14px 16px',
                    boxShadow: 'var(--shadow-card)',
                    borderLeft: `3px solid ${isPending ? '#FF9500' : isSuccess ? (isDeposit ? '#34C759' : '#3b82f6') : isRejected ? '#ef4444' : '#ccc'}`,
                    opacity: isRejected ? 0.6 : 1,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {/* Left: type + status */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Icon circle */}
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: isDeposit
                            ? (isPending ? 'rgba(255,149,0,0.12)' : 'rgba(52,199,89,0.12)')
                            : 'rgba(59,130,246,0.12)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {isDeposit ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isPending ? '#FF9500' : '#34C759'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 5v14M5 12l7 7 7-7"/>
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 19V5M5 12l7-7 7 7"/>
                            </svg>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)', marginBottom: 2 }}>
                            {isDeposit ? 'ฝากเงิน' : 'ถอนเงิน'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--ios-secondary-label)' }}>
                            {new Date(item.created_at).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      {/* Right: amount + status */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: 18, fontWeight: 700, marginBottom: 2,
                          color: isDeposit ? '#34C759' : '#3b82f6',
                        }}>
                          {isDeposit ? '+' : '-'}฿{item.amount.toLocaleString()}
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                          background: isPending ? 'rgba(255,149,0,0.12)' : isSuccess ? 'rgba(52,199,89,0.12)' : isRejected ? 'rgba(239,68,68,0.1)' : 'rgba(142,142,147,0.1)',
                          color: isPending ? '#FF9500' : isSuccess ? '#34C759' : isRejected ? '#ef4444' : '#888',
                        }}>
                          {isPending ? 'รอตรวจสอบ' : isSuccess ? 'สำเร็จ' : isRejected ? 'ปฏิเสธ' : item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>

      {/* ── Transfer Modal: แสดงบัญชี agent ให้โอน ──────────────────────── */}
      {showTransferModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
          {/* Header — gradient */}
          <div style={{
            background: 'linear-gradient(135deg, #0d6e6e 0%, #1a8a6e 100%)',
            padding: '16px', paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          }}>
            <button onClick={() => setShowTransferModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <ChevronLeft size={22} strokeWidth={2.5} color="white" />
            </button>
            <span style={{ color: 'white', fontSize: 17, fontWeight: 700 }}>ฝากเงิน</span>
            <div style={{ width: 30 }} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* ── จำนวนเงิน — card gradient ── */}
            <div style={{
              background: 'linear-gradient(135deg, #0d6e6e 0%, #1a8a6e 100%)',
              padding: '24px 16px 32px', textAlign: 'center',
              borderRadius: '0 0 24px 24px',
              marginBottom: -16, // overlap
            }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>จำนวนเงินที่ต้องโอน</div>
              <div style={{ fontSize: 42, fontWeight: 800, color: 'white', letterSpacing: -1 }}>
                ฿{depositAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ padding: '28px 16px 16px' }}>
              {/* ── บัญชีปลายทาง ── */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 10 }}>โอนเข้าบัญชี</div>
              {agentBanks.map((bank, i) => (
                <div key={i} style={{
                  background: 'white', borderRadius: 16, padding: '16px 18px', marginBottom: 10,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  display: 'flex', alignItems: 'center', gap: 14,
                  borderLeft: '4px solid ' + (BANK_COLORS[bank.bank_code] || '#0d6e6e'),
                }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12,
                    background: BANK_COLORS[bank.bank_code] || '#0d6e6e',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 800, fontSize: 11, flexShrink: 0,
                  }}>
                    {bank.bank_code}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#555', marginBottom: 2 }}>
                      {BANK_NAMES[bank.bank_code] || bank.bank_name}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1a3d35', letterSpacing: 1.5, marginBottom: 2 }}>
                      {bank.account_number}
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>{bank.account_name}</div>
                  </div>
                  {/* Copy button */}
                  <button onClick={() => { navigator.clipboard.writeText(bank.account_number); toast.success('คัดลอกเลขบัญชีแล้ว') }}
                    style={{ padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: '1px solid #ddd', background: 'white', color: '#0d6e6e', cursor: 'pointer' }}>
                    คัดลอก
                  </button>
                </div>
              ))}

              {/* ── Steps ── */}
              <div style={{
                background: 'white', borderRadius: 14, padding: '16px 18px', marginTop: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 12 }}>ขั้นตอน</div>
                {[
                  { num: '1', text: `โอนเงิน ฿${depositAmount.toLocaleString()} เข้าบัญชีด้านบน`, color: '#3b82f6' },
                  { num: '2', text: 'กดปุ่ม "โอนแล้ว" ด้านล่าง', color: '#f5a623' },
                  { num: '3', text: 'รอระบบตรวจสอบ (1-3 นาที)', color: '#34C759' },
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < 2 ? 10 : 0 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', background: step.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>{step.num}</div>
                    <span style={{ fontSize: 13, color: '#555' }}>{step.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 16px', flexShrink: 0, paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', background: 'white', boxShadow: '0 -2px 12px rgba(0,0,0,0.05)' }}>
            <button
              onClick={handleConfirmTransfer}
              disabled={loading}
              style={{
                display: 'block', width: '100%', padding: '16px',
                borderRadius: 14, fontSize: 17, fontWeight: 700,
                color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #34C759 0%, #30B350 100%)',
                opacity: loading ? 0.6 : 1,
                boxShadow: '0 4px 20px rgba(52,199,89,0.35)',
                minHeight: 56, marginBottom: 8,
              }}
            >
              {loading ? 'กำลังตรวจสอบ...' : 'โอนแล้ว ยืนยัน'}
            </button>
            <button
              onClick={() => setShowTransferModal(false)}
              style={{
                display: 'block', width: '100%', padding: '12px',
                borderRadius: 14, fontSize: 14, fontWeight: 500,
                color: '#999', background: 'transparent', border: 'none', cursor: 'pointer',
              }}
            >
              ย้อนกลับ
            </button>
          </div>
        </div>
      )}

      {/* ── Deposit Success Alert ────────────────────────────────────────── */}
      {depositAlert === 'success' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: '32px 24px',
            textAlign: 'center', maxWidth: 320, width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a3d35', marginBottom: 8 }}>
              แจ้งฝากเงินสำเร็จ!
            </div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 6, lineHeight: 1.5 }}>
              แจ้งฝากเงิน ฿{depositAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#FF9500', marginBottom: 20 }}>
              รอแอดมินตรวจสอบและอนุมัติ
            </div>
            <button
              onClick={() => setDepositAlert(null)}
              style={{
                width: '100%', padding: '14px', borderRadius: 12,
                fontSize: 16, fontWeight: 700, color: 'white', border: 'none', cursor: 'pointer',
                background: '#0d6e6e', marginBottom: 8,
              }}
            >
              ตกลง
            </button>
            <button
              onClick={() => { setDepositAlert(null); window.location.href = '/deposit-history' }}
              style={{
                width: '100%', padding: '12px', borderRadius: 12,
                fontSize: 14, fontWeight: 500, color: '#0d6e6e', border: '1px solid #0d6e6e',
                background: 'transparent', cursor: 'pointer',
              }}
            >
              ดูประวัติฝากเงิน
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
