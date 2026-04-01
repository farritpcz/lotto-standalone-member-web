/**
 * หน้า Wallet — iOS 17 HIG Design
 * ฝาก-ถอน + ประวัติธุรกรรม
 */

'use client'

import { useEffect, useState } from 'react'
import { walletApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
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

  useEffect(() => {
    walletApi.getTransactions({ per_page: 30 })
      .then(res => setTransactions(res.data.data?.items || []))
      .catch(() => {})
  }, [message, depositAlert])

  // ดึงบัญชี agent (ใช้แสดงให้ลูกค้าโอน)
  useEffect(() => {
    import('@/lib/api').then(({ api }) => {
      api.get('/agent/bank-accounts').then(res => {
        setAgentBanks(res.data.data || [])
      }).catch(() => {
        // fallback: ใช้ข้อมูล default ถ้า API ยังไม่มี
        setAgentBanks([{
          bank_code: 'KBANK', bank_name: 'ธนาคารกสิกรไทย',
          account_number: '0001234567', account_name: 'บริษัท LOTTO จำกัด',
        }])
      })
    })
  }, [])

  const handleSubmit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setMessage('กรุณากรอกจำนวนเงิน'); return }
    setMessage('')

    if (action === 'deposit') {
      // ── ฝากเงิน: แสดงบัญชี agent ให้โอน ──
      setDepositAmount(amt)
      setShowTransferModal(true)
      return
    }

    // ── ถอนเงิน: สร้างคำขอถอน (ไม่หักเงินทันที รอแอดมินอนุมัติ) ──
    if (amt > (member?.balance || 0)) { setMessage('ยอดเงินไม่เพียงพอ'); return }
    setLoading(true)
    try {
      await (await import('@/lib/api')).api.post('/wallet/withdraw', { amount: amt })
      setAmount('')
      setMessage('แจ้งถอนเงินสำเร็จ รอแอดมินอนุมัติ')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setMessage(axiosErr.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  // ลูกค้ากดยืนยันว่าโอนแล้ว → สร้างคำขอฝาก (ไม่เพิ่มเงินทันที รอแอดมินอนุมัติ)
  const handleConfirmTransfer = async () => {
    setLoading(true)
    try {
      await (await import('@/lib/api')).api.post('/wallet/deposit', { amount: depositAmount })
      setShowTransferModal(false)
      setDepositAlert('success')
      setAmount('')
    } catch {
      setMessage('เกิดข้อผิดพลาด กรุณาลองใหม่')
      setShowTransferModal(false)
    } finally {
      setLoading(false)
    }
  }

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

      {/* บัญชีของสมาชิก — แสดงเฉพาะตอนฝากเงิน เพื่อให้รู้ว่าต้องโอนจากบัญชีไหน */}
      {action === 'deposit' && member?.bank_code && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{
            background: 'var(--ios-card)',
            borderRadius: 16,
            padding: 16,
            boxShadow: 'var(--shadow-card)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            {/* Bank logo circle */}
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: BANK_COLORS[member.bank_code] || '#666',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: 14,
              flexShrink: 0,
            }}>
              {member.bank_code}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: 'var(--ios-secondary-label)', marginBottom: 3 }}>
                บัญชีของคุณ (ใช้โอนเงินเข้าระบบ)
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ios-label)', marginBottom: 2 }}>
                {BANK_NAMES[member.bank_code] || member.bank_code}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: 1 }}>
                {member.bank_account_number || '—'}
              </div>
              {member.bank_account_name && (
                <div style={{ fontSize: 13, color: 'var(--ios-secondary-label)', marginTop: 2 }}>
                  {member.bank_account_name}
                </div>
              )}
            </div>
          </div>
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
        <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: 16, boxShadow: 'var(--shadow-card)' }}>

          {/* Quick amounts */}
          <div className="quick-amount" style={{ marginBottom: 12 }}>
            {[100, 500, 1000, 5000].map(a => (
              <button
                key={a}
                onClick={() => setAmount(String(a))}
                className={amount === String(a) ? 'active' : ''}
              >
                ฿{a.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Number input */}
          <div style={{
            border: '1.5px solid',
            borderColor: 'var(--ios-separator)',
            borderRadius: 12,
            marginBottom: 12,
            overflow: 'hidden',
          }}>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="กรอกจำนวนเงิน"
              min={1}
              style={{
                display: 'block',
                width: '100%',
                boxSizing: 'border-box',
                padding: '14px 16px',
                textAlign: 'center',
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--ios-label)',
                background: 'var(--ios-bg)',
                border: 'none',
                outline: 'none',
              }}
            />
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

      {/* Transaction History */}
      <div className="section-title">
        <span>ประวัติธุรกรรม</span>
      </div>
      <div style={{ padding: '0 16px', paddingBottom: 16 }}>
        {transactions.length === 0 ? (
          <div style={{
            background: 'var(--ios-card)',
            borderRadius: 16,
            padding: '40px 16px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-card)',
          }}>
            <p style={{ color: 'var(--ios-secondary-label)', fontSize: 15 }}>ยังไม่มีธุรกรรม</p>
          </div>
        ) : (
          <div style={{ background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            {transactions.map((tx, idx) => (
              <div key={tx.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderBottom: idx < transactions.length - 1 ? '0.5px solid var(--ios-separator)' : 'none',
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'var(--ios-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                }}>
                  {txTypeIcons[tx.type] || '💳'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 2 }}>{txTypeLabels[tx.type] || tx.type}</div>
                  <div style={{ fontSize: 12, color: 'var(--ios-secondary-label)' }}>
                    {new Date(tx.created_at).toLocaleString('th-TH')}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: tx.amount >= 0 ? 'var(--ios-green)' : 'var(--ios-red)',
                  }}>
                    {tx.amount >= 0 ? '+' : ''}฿{Math.abs(tx.amount).toLocaleString()}
                  </span>
                  <div style={{ fontSize: 11, color: 'var(--ios-secondary-label)', marginTop: 2 }}>
                    คงเหลือ ฿{tx.balance_after.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Transfer Modal: แสดงบัญชี agent ให้โอน ──────────────────────── */}
      {showTransferModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'white', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ background: '#1a3d35', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <button onClick={() => setShowTransferModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} style={{ width: 22, height: 22 }}>
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span style={{ color: 'white', fontSize: 17, fontWeight: 700 }}>โอนเงินเข้าบัญชี</span>
            <div style={{ width: 30 }} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {/* จำนวนเงินที่ต้องโอน */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>จำนวนเงินที่ต้องโอน</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#1a3d35' }}>
                ฿{depositAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* บัญชี agent ที่ต้องโอนเข้า */}
            <div style={{ fontSize: 14, fontWeight: 600, color: '#888', marginBottom: 12 }}>โอนเข้าบัญชีนี้</div>
            {agentBanks.map((bank, i) => (
              <div key={i} style={{
                background: '#f8f8f8', borderRadius: 16, padding: 16, marginBottom: 12,
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 12,
                  background: BANK_COLORS[bank.bank_code] || '#666',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 800, fontSize: 13, flexShrink: 0,
                }}>
                  {bank.bank_code}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 2 }}>
                    {BANK_NAMES[bank.bank_code] || bank.bank_name}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1a3d35', letterSpacing: 1, marginBottom: 2 }}>
                    {bank.account_number}
                  </div>
                  <div style={{ fontSize: 13, color: '#888' }}>{bank.account_name}</div>
                </div>
              </div>
            ))}

            {/* คำแนะนำ */}
            <div style={{
              background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.2)',
              borderRadius: 12, padding: '12px 16px', marginTop: 8,
            }}>
              <div style={{ fontSize: 13, color: '#c87800', lineHeight: 1.6 }}>
                <strong>คำแนะนำ:</strong><br />
                • โอนเงินจำนวน ฿{depositAmount.toLocaleString()} เข้าบัญชีด้านบน<br />
                • หลังโอนเสร็จ กดปุ่ม "โอนเรียบร้อยแล้ว" ด้านล่าง<br />
                • เงินจะเข้าบัญชีภายใน 1-3 นาที
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 16px 16px', borderTop: '1px solid #eee', flexShrink: 0, paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
            <button
              onClick={handleConfirmTransfer}
              disabled={loading}
              style={{
                display: 'block', width: '100%', padding: '16px',
                borderRadius: 14, fontSize: 17, fontWeight: 700,
                color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: '#34C759', opacity: loading ? 0.6 : 1,
                boxShadow: '0 4px 20px rgba(52,199,89,0.35)',
                minHeight: 56, marginBottom: 10,
              }}
            >
              {loading ? 'กำลังตรวจสอบ...' : '✓ โอนเรียบร้อยแล้ว'}
            </button>
            <button
              onClick={() => setShowTransferModal(false)}
              style={{
                display: 'block', width: '100%', padding: '14px',
                borderRadius: 14, fontSize: 15, fontWeight: 600,
                color: '#888', background: '#f5f5f5', border: 'none', cursor: 'pointer',
              }}
            >
              ยกเลิก
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
                background: '#0d6e6e',
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
