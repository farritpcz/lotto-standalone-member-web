/**
 * BetSlipResultAlert — pop-up สำเร็จ/ล้มเหลว หลังกด "ยืนยันแทง"
 *
 * ใช้ได้ทั้ง 2 จุด: standalone (betSlip ว่าง + closeFull) และใน fullscreen modal
 * buttonLabel รับจาก parent เพราะ 2 จุดใช้ text ไม่เหมือนกัน (ตกลง / ลองใหม่)
 * Parent: ../BetSlip.tsx
 */

'use client'

import type { ResultAlertState } from './types'

interface BetSlipResultAlertProps {
  alert: ResultAlertState
  buttonLabel: string
  onDismiss: () => void
}

export default function BetSlipResultAlert({ alert, buttonLabel, onDismiss }: BetSlipResultAlertProps) {
  const isSuccess = alert.type === 'success'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: 'var(--ios-card)', borderRadius: 20, padding: '32px 24px',
        textAlign: 'center', maxWidth: 320, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        {/* icon */}
        <div style={{ fontSize: 48, marginBottom: 12 }}>{isSuccess ? '✅' : '❌'}</div>

        {/* หัวข้อ */}
        <div style={{
          fontSize: 18, fontWeight: 700, marginBottom: 8,
          color: isSuccess ? 'var(--accent-color)' : 'var(--ios-red)',
        }}>
          {isSuccess ? 'แทงสำเร็จ!' : 'แทงไม่สำเร็จ'}
        </div>

        {/* รายละเอียด */}
        <div style={{ fontSize: 14, color: 'var(--ios-secondary-label)', marginBottom: 20, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
          {alert.message}
        </div>

        {/* ปุ่มปิด */}
        <button
          onClick={onDismiss}
          style={{
            width: '100%', padding: '14px', borderRadius: 12, fontSize: 16, fontWeight: 700,
            border: 'none', cursor: 'pointer',
            background: isSuccess ? 'var(--accent-color)' : 'var(--ios-red)',
            color: isSuccess ? '#1a1a1a' : 'white',
          }}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}
