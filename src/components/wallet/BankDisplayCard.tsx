// Component: BankDisplayCard — mini credit-card showing member bank (deposit: sender, withdraw: receiver)
// Parent: src/app/(member)/wallet/page.tsx

import BankIcon from '@/components/BankIcon'

export interface BankDisplayCardProps {
  isDeposit: boolean
  depositMode: string
  bankCode: string
  bankName: string
  bankNumber: string
  bankAccountName: string
}

export function BankDisplayCard({
  isDeposit, depositMode, bankCode, bankName, bankNumber, bankAccountName,
}: BankDisplayCardProps) {
  return (
    <div style={{
      background: 'linear-gradient(145deg, var(--header-bg) 0%, color-mix(in srgb, var(--header-bg) 70%, black) 100%)',
      borderRadius: 18, padding: '18px 20px',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      color: 'white', minHeight: 120,
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20.5z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 140, height: 140,
        background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-color) 15%, transparent) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>บัญชีผู้ใช้</span>
          {isDeposit && depositMode === 'easyslip' && (
            <span style={{ fontSize: 9, fontWeight: 700, color: '#007AFF', background: 'rgba(0,122,255,0.15)', padding: '2px 7px', borderRadius: 10, border: '1px solid rgba(0,122,255,0.25)' }}>แนบสลิปอัตโนมัติ</span>
          )}
          {isDeposit && depositMode === 'auto' && (
            <span style={{ fontSize: 9, fontWeight: 700, color: '#FF9F0A', background: 'rgba(255,159,10,0.15)', padding: '2px 7px', borderRadius: 10, border: '1px solid rgba(255,159,10,0.25)' }}>ตรวจจับอัตโนมัติ</span>
          )}
        </div>
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
          <div style={{
            position: 'absolute', top: -8, right: 0,
            width: 48, height: 48, borderRadius: 12,
            background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}>
            <BankIcon code={bankCode} size={36} />
          </div>

          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>{bankName}</p>

          <p style={{
            fontSize: 22, fontWeight: 800, color: 'var(--accent-color)',
            letterSpacing: 2, fontVariantNumeric: 'tabular-nums',
            margin: '0 0 12px', textShadow: '0 1px 8px rgba(0,0,0,0.3)',
          }}>
            {bankNumber}
          </p>

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
  )
}
