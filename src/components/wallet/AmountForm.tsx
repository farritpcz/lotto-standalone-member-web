// Component: AmountForm — amount input + quick amount buttons + submit
// Parent: src/app/(member)/wallet/page.tsx

import { QrCode } from 'lucide-react'

export interface AmountFormProps {
  isDeposit: boolean
  amount: string
  setAmount: (v: string) => void
  loading: boolean
  onSubmit: () => void
}

export function AmountForm({ isDeposit, amount, setAmount, loading, onSubmit }: AmountFormProps) {
  return (
    <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '16px', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ios-label)' }}>ระบุจำนวนเงิน</span>
        <span style={{ fontSize: 12, color: 'var(--ios-secondary-label)' }}>
          ยอดขั้นต่ำ {isDeposit ? '100' : '300'} บาท
        </span>
      </div>

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

      <button
        onClick={onSubmit}
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
  )
}
