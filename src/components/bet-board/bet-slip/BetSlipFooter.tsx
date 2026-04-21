/**
 * BetSlipFooter — สรุปยอด (เครดิต/ยอดแทง/เครดิตหลังแทง) + warnings + ปุ่มยืนยัน
 *
 * แสดงสรุปตัวเลข, เตือน "เลขอั้น"/"เครดิตไม่พอ", และปุ่ม "ยืนยันแทง"
 * Parent: ../BetSlip.tsx
 */

'use client'

interface BetSlipFooterProps {
  balance: number
  totalAmount: number
  betCount: number
  hasBanned: boolean
  canConfirm: boolean
  loading?: boolean
  onConfirm: () => void
}

export default function BetSlipFooter({
  balance,
  totalAmount,
  betCount,
  hasBanned,
  canConfirm,
  loading,
  onConfirm,
}: BetSlipFooterProps) {
  return (
    <div style={{ padding: '10px 16px' }}>
      {/* บรรทัดที่ 1 — เครดิตคงเหลือ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
        <span style={{ color: 'var(--ios-secondary-label)' }}>เครดิตคงเหลือ</span>
        <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>
          ฿{balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* บรรทัดที่ 2 — ยอดแทงรวม */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
        <span style={{ color: 'var(--ios-secondary-label)' }}>ยอดแทง ({betCount} รายการ)</span>
        <span style={{ fontWeight: 700, color: 'var(--ios-orange)' }}>฿{totalAmount.toLocaleString()}</span>
      </div>

      {/* บรรทัดที่ 3 — เครดิตหลังแทง (แดงถ้าติดลบ) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
        <span style={{ color: 'var(--ios-secondary-label)' }}>เครดิตหลังแทง</span>
        <span style={{ fontWeight: 700, color: balance >= totalAmount ? 'var(--ios-label)' : 'var(--ios-red)' }}>
          ฿{(balance - totalAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Warning: มีเลขอั้น */}
      {hasBanned && (
        <div style={{
          background: 'rgba(255,59,48,0.08)', borderRadius: 10,
          padding: '8px 12px', marginBottom: 10, fontSize: 13,
          color: 'var(--ios-red)', textAlign: 'center', fontWeight: 600,
        }}>
          มีเลขอั้น — กรุณาลบออกก่อนแทง
        </div>
      )}

      {/* Warning: เครดิตไม่เพียงพอ */}
      {balance < totalAmount && (
        <div style={{
          background: 'rgba(255,59,48,0.08)', borderRadius: 10,
          padding: '8px 12px', marginBottom: 10, fontSize: 13,
          color: 'var(--ios-red)', textAlign: 'center', fontWeight: 600,
        }}>
          เครดิตไม่เพียงพอ
        </div>
      )}

      {/* ปุ่มยืนยันแทง */}
      <button
        onClick={onConfirm}
        disabled={!canConfirm}
        style={{
          display: 'block', width: '100%', padding: '14px',
          borderRadius: 14, fontSize: 16, fontWeight: 700,
          border: 'none',
          cursor: canConfirm ? 'pointer' : 'not-allowed',
          background: 'linear-gradient(180deg, var(--accent-color) 0%, color-mix(in srgb, var(--accent-color) 80%, black) 100%)',
          color: '#1a1a1a',
          opacity: canConfirm ? 1 : 0.4,
          boxShadow: canConfirm ? '0 4px 20px color-mix(in srgb, var(--accent-color) 30%, transparent)' : 'none',
        }}
      >
        {loading ? 'กำลังส่งโพย...' : `ยืนยันแทง ฿${totalAmount.toLocaleString()}`}
      </button>
    </div>
  )
}
