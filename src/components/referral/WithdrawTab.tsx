// Component: WithdrawTab — pending balance + withdraw form + withdraw/commission history
// Parent: src/app/(member)/referral/page.tsx

import { Wallet } from 'lucide-react'
import Loading from '@/components/Loading'
import type { ReferralInfo, ReferralCommission, WithdrawalRecord } from '@/lib/api'

export interface WithdrawTabProps {
  loading: boolean
  info: ReferralInfo | null
  showConditions: boolean
  setShowConditions: (v: boolean | ((p: boolean) => boolean)) => void
  withdrawAmount: string
  setWithdrawAmount: (v: string) => void
  withdrawing: boolean
  cooldown: number
  onWithdraw: () => void
  withdrawals: WithdrawalRecord[]
  commissions: ReferralCommission[]
}

export function WithdrawTab(props: WithdrawTabProps) {
  const {
    loading, info, showConditions, setShowConditions,
    withdrawAmount, setWithdrawAmount, withdrawing, cooldown, onWithdraw,
    withdrawals, commissions,
  } = props

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ยอดค่าคอมคงเหลือ */}
      <div style={{
        background: 'linear-gradient(135deg, var(--header-bg) 0%, var(--nav-bg) 100%)',
        borderRadius: 16, padding: '20px 16px', textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>ค่าคอมรอถอน</p>
        <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-color)', letterSpacing: -1 }}>
          {loading ? '...' : `฿${(info?.stats.pending_comm ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 12 }}>
          <div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>รายได้ทั้งหมด</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
              ฿{(info?.stats.total_comm ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.15)' }} />
          <div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>ถอนแล้ว</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
              ฿{(info?.stats.paid_comm ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* ฟอร์มถอน */}
      <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ios-label)' }}>ถอนรายได้</p>
          <button
            onClick={() => setShowConditions(v => !v)}
            style={{ fontSize: 13, color: 'var(--accent-color)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            เงื่อนไขการถอน
          </button>
        </div>

        {showConditions && (
          <div style={{
            background: 'color-mix(in srgb, var(--accent-color) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-color) 20%, transparent)',
            borderRadius: 10, padding: '10px 12px', marginBottom: 12,
            fontSize: 13, color: 'var(--ios-secondary-label)', lineHeight: 1.6,
          }}>
            {loading ? 'กำลังโหลด...' : (
              <>
                <p>• ถอนขั้นต่ำ <strong style={{ color: 'var(--accent-color)' }}>฿{(info?.withdrawal.min ?? 1).toFixed(2)}</strong></p>
                {info?.withdrawal.note && <p>• {info.withdrawal.note}</p>}
                <p>• ค่าคอมจ่ายหลังรอบหวยออกผลและคำนวณเสร็จสมบูรณ์</p>
                <p>• รายได้จะเข้า wallet ทันทีหลังถอนสำเร็จ</p>
              </>
            )}
          </div>
        )}

        {!showConditions && (
          <p style={{ fontSize: 12, color: 'var(--ios-secondary-label)', marginBottom: 8 }}>
            ขั้นต่ำ {loading ? '...' : `฿${(info?.withdrawal.min ?? 1).toFixed(2)}`} • เข้า wallet ทันที
          </p>
        )}

        <div style={{ position: 'relative', marginBottom: 10 }}>
          <input
            type="number"
            value={withdrawAmount}
            onChange={e => setWithdrawAmount(e.target.value)}
            placeholder="0.00"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--ios-bg)', border: '1.5px solid var(--ios-separator)', borderRadius: 10,
              padding: '12px 80px 12px 14px', fontSize: 18, fontWeight: 600,
              textAlign: 'right', color: 'var(--ios-label)', outline: 'none',
            }}
          />
          <button
            onClick={() => {
              const pending = info?.stats.pending_comm ?? 0
              if (pending > 0) setWithdrawAmount(pending.toFixed(2))
            }}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              border: '1px solid var(--accent-color)', background: 'color-mix(in srgb, var(--accent-color) 8%, transparent)',
              color: 'var(--accent-color)', cursor: 'pointer',
            }}
          >
            ทั้งหมด
          </button>
        </div>

        <button
          onClick={onWithdraw}
          disabled={withdrawing || loading || cooldown > 0}
          style={{
            width: '100%', padding: '13px', borderRadius: 10,
            background: cooldown > 0 ? 'var(--ios-secondary-label)' : 'var(--accent-color)',
            color: 'white', fontSize: 15, fontWeight: 700, border: 'none',
            cursor: (withdrawing || cooldown > 0) ? 'not-allowed' : 'pointer',
            opacity: (withdrawing || cooldown > 0) ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s',
          }}
        >
          <Wallet size={18} strokeWidth={2} />
          {withdrawing ? 'กำลังถอน...' : cooldown > 0 ? `รอ ${cooldown} วินาที` : 'ถอนเข้า Wallet'}
        </button>
      </div>

      {/* ประวัติการถอน */}
      <div style={{ background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--ios-separator)' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ios-label)' }}>ประวัติการถอน</p>
        </div>
        {withdrawals.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <p style={{ color: 'var(--ios-tertiary-label)', fontSize: 13 }}>ยังไม่มีประวัติการถอน</p>
          </div>
        ) : (
          withdrawals.map((w, idx) => (
            <div key={w.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 16px',
              borderBottom: idx < withdrawals.length - 1 ? '0.5px solid var(--ios-separator)' : 'none',
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ios-label)' }}>ถอนค่าคอมเข้า Wallet</p>
                <p style={{ fontSize: 11, color: 'var(--ios-tertiary-label)' }}>
                  {new Date(w.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}{' '}
                  {new Date(w.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-color)' }}>
                +฿{w.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </p>
            </div>
          ))
        )}
      </div>

      {/* ประวัติค่าคอม */}
      <div style={{ background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--ios-separator)' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ios-label)' }}>ประวัติค่าคอมที่ได้รับ</p>
        </div>
        {loading ? (
          <div style={{ padding: 30 }}><Loading inline /></div>
        ) : commissions.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center' }}>
            <Wallet size={36} strokeWidth={1.5} style={{ color: 'var(--ios-tertiary-label)', marginBottom: 8 }} />
            <p style={{ color: 'var(--ios-secondary-label)', fontSize: 15 }}>ยังไม่มีประวัติค่าคอม</p>
            <p style={{ color: 'var(--ios-tertiary-label)', fontSize: 13, marginTop: 4 }}>ชวนเพื่อนแทงหวยเพื่อรับค่าคอม!</p>
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
                  {new Date(c.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-color)' }}>
                  +฿{c.commission_amount.toFixed(2)}
                </p>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 6,
                  background: c.status === 'paid' ? 'color-mix(in srgb, var(--accent-color) 10%, transparent)' : 'rgba(255,159,10,0.1)',
                  color: c.status === 'paid' ? 'var(--accent-color)' : 'var(--ios-orange)',
                  fontWeight: 600,
                }}>
                  {c.status === 'paid' ? 'จ่ายแล้ว' : 'รอถอน'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
