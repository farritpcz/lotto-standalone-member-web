/**
 * BetSlip — สรุปรายการแทงก่อนยืนยัน
 *
 * 2 โหมด:
 *   1. Mini mode (default) — แสดงสรุปย่อ + ปุ่ม "ดูรายการแทง" เปิด fullscreen
 *   2. Fullscreen modal — ตารางเต็มจอ + แก้ราคาได้ + ปุ่มยืนยันแทง
 *
 * ⭐ ปุ่มยืนยันใช้สีธีม (primary) แทนสีทอง
 */

'use client'

import { useState } from 'react'
import { useBetStore, BetSlipItem } from '@/store/bet-store'
import { useAuthStore } from '@/store/auth-store'

interface BetSlipProps {
  /** return true if success, string with error message if failed, false for generic error */
  onConfirm: () => Promise<boolean | string>
  loading?: boolean
}

export default function BetSlip({ onConfirm, loading }: BetSlipProps) {
  const { betSlip, removeFromBetSlip, updateAmount, clearBetSlip, getTotalAmount } = useBetStore()
  const { member } = useAuthStore()
  const [showFull, setShowFull] = useState(false)
  const [resultAlert, setResultAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // ถ้า betSlip ว่าง แต่มี resultAlert → แสดง alert ก่อน
  if (betSlip.length === 0 && resultAlert) {
    return (
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
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            {resultAlert.type === 'success' ? '✅' : '❌'}
          </div>
          <div style={{
            fontSize: 18, fontWeight: 700, marginBottom: 8,
            color: resultAlert.type === 'success' ? '#1a3d35' : '#CC2020',
          }}>
            {resultAlert.type === 'success' ? 'แทงสำเร็จ!' : 'แทงไม่สำเร็จ'}
          </div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
            {resultAlert.message}
          </div>
          <button
            onClick={() => setResultAlert(null)}
            style={{
              width: '100%', padding: '14px',
              borderRadius: 12, fontSize: 16, fontWeight: 700,
              color: 'white', border: 'none', cursor: 'pointer',
              background: resultAlert.type === 'success' ? '#0d6e6e' : '#CC2020',
            }}
          >
            ตกลง
          </button>
        </div>
      </div>
    )
  }

  if (betSlip.length === 0 && !resultAlert) {
    return (
      <div className="card p-6 text-center">
        <p className="text-3xl mb-2">📝</p>
        <p className="text-muted text-sm">ยังไม่มีรายการแทง</p>
        <p className="text-muted text-xs mt-1">เลือกประเภท → กดเลข → เพิ่มรายการ</p>
      </div>
    )
  }

  const totalAmount = getTotalAmount()

  // ── Mini mode: แสดงสรุปย่อ + ปุ่มเปิดเต็มจอ ──────────────────────────────
  return (
    <>
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--color-bg-card-alt)' }}>
          <h3 className="font-bold text-sm">รายการแทง ({betSlip.length})</h3>
          <button onClick={clearBetSlip} className="text-xs font-semibold" style={{ color: 'var(--color-red)' }}>
            ล้างทั้งหมด
          </button>
        </div>

        {/* สรุปย่อ: แสดง 3 รายการแรก */}
        <div className="px-4 py-2">
          {betSlip.slice(0, 3).map((item: BetSlipItem) => (
            <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'var(--color-bg-card-alt)' }}>
                  {item.betTypeName}
                </span>
                <span className="font-mono font-bold text-sm" style={{ color: 'var(--color-primary)' }}>{item.number}</span>
              </div>
              <span className="text-xs font-semibold">฿{item.amount}</span>
            </div>
          ))}
          {betSlip.length > 3 && (
            <p className="text-center text-xs text-muted py-1">+{betSlip.length - 3} รายการเพิ่มเติม</p>
          )}
        </div>

        {/* Footer: ยอดรวม + ปุ่มเปิดเต็มจอ */}
        <div className="px-4 py-3" style={{ background: 'var(--color-bg-card-alt)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted">ยอดรวม</span>
            <span className="text-lg font-bold" style={{ color: 'var(--color-primary-dark)' }}>฿{totalAmount.toLocaleString()}</span>
          </div>
          <button
            onClick={() => setShowFull(true)}
            className="w-full py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: 'var(--color-primary)', boxShadow: '0 4px 16px rgba(13,110,110,0.3)' }}
          >
            ดูรายการแทง ({betSlip.length} รายการ)
          </button>
        </div>
      </div>

      {/* ── Fullscreen Modal ────────────────────────────────────────────────── */}
      {showFull && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'white',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            background: '#1a3d35',
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <button onClick={() => setShowFull(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} style={{ width: 22, height: 22 }}>
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span style={{ color: 'white', fontSize: 17, fontWeight: 700 }}>
              รายการแทง ({betSlip.length})
            </span>
            <button onClick={clearBetSlip} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF6B6B', fontSize: 13, fontWeight: 600 }}>
              ล้างทั้งหมด
            </button>
          </div>

          {/* Scrollable bet list — จัดกลุ่มตามจำนวนหลัก */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {(() => {
              // จัดกลุ่ม bet items ตามจำนวนหลัก
              const groups: { label: string; color: string; bg: string; items: BetSlipItem[] }[] = []
              const digitMap: Record<number, BetSlipItem[]> = {}
              for (const item of betSlip) {
                const d = item.number.length
                if (!digitMap[d]) digitMap[d] = []
                digitMap[d].push(item)
              }
              // เรียงจากมากไปน้อย (3→2→1)
              const groupMeta: Record<number, { label: string; color: string; bg: string }> = {
                3: { label: '3 ตัว', color: '#0055CC', bg: 'rgba(0,85,204,0.08)' },
                2: { label: '2 ตัว', color: '#CC6600', bg: 'rgba(204,102,0,0.08)' },
                1: { label: 'วิ่ง / 1 ตัว', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
                4: { label: '4 ตัว', color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
              }
              for (const d of [4, 3, 2, 1]) {
                if (digitMap[d]) {
                  const meta = groupMeta[d] || { label: `${d} หลัก`, color: '#666', bg: '#f5f5f5' }
                  groups.push({ ...meta, items: digitMap[d] })
                }
              }
              return groups.map(group => (
                <div key={group.label}>
                  {/* Group header */}
                  <div style={{
                    padding: '8px 16px',
                    background: group.bg,
                    borderBottom: '1px solid #eee',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: 'white',
                      background: group.color, padding: '2px 10px', borderRadius: 10,
                    }}>
                      {group.label}
                    </span>
                    <span style={{ fontSize: 12, color: '#888' }}>
                      {group.items.length} รายการ
                    </span>
                  </div>
                  {/* Items */}
                  {group.items.map((item: BetSlipItem) => (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 16px',
                      borderBottom: '0.5px solid #f0f0f0',
                    }}>
                      {/* Badge ประเภท */}
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: group.color,
                        background: group.bg, padding: '3px 8px', borderRadius: 6,
                        border: `1px solid ${group.color}20`,
                        whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        {item.betTypeName}
                      </span>
                      {/* เลข */}
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 18, color: '#1a3d35', minWidth: 40, textAlign: 'center' }}>
                        {item.number}
                      </span>
                      {/* ราคา */}
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateAmount(item.id, Math.max(1, Number(e.target.value)))}
                        min={1}
                        style={{
                          width: 60, textAlign: 'center', fontSize: 14, fontWeight: 700,
                          border: '1.5px solid #e0e0e0', borderRadius: 8, padding: '5px 4px',
                          background: '#fafafa', outline: 'none', flexShrink: 0,
                        }}
                      />
                      {/* เรท */}
                      <span style={{ fontSize: 12, color: '#aaa', flexShrink: 0 }}>x{item.rate}</span>
                      {/* ชนะ */}
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#34C759', marginLeft: 'auto', flexShrink: 0 }}>
                        ฿{item.potentialWin.toLocaleString()}
                      </span>
                      {/* ลบ */}
                      <button
                        onClick={() => removeFromBetSlip(item.id)}
                        style={{
                          width: 26, height: 26, borderRadius: 13,
                          background: 'rgba(255,59,48,0.08)', color: '#FF3B30',
                          border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ))
            })()}
          </div>

          {/* Result Alert — แสดงหลังกดยืนยัน */}
          {resultAlert && (
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
                <div style={{ fontSize: 48, marginBottom: 12 }}>
                  {resultAlert.type === 'success' ? '✅' : '❌'}
                </div>
                <div style={{
                  fontSize: 18, fontWeight: 700, marginBottom: 8,
                  color: resultAlert.type === 'success' ? '#1a3d35' : '#CC2020',
                }}>
                  {resultAlert.type === 'success' ? 'แทงสำเร็จ!' : 'แทงไม่สำเร็จ'}
                </div>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 1.5 }}>
                  {resultAlert.message}
                </div>
                <button
                  onClick={() => { setResultAlert(null); if (resultAlert.type === 'success') setShowFull(false) }}
                  style={{
                    width: '100%', padding: '14px',
                    borderRadius: 12, fontSize: 16, fontWeight: 700,
                    color: 'white', border: 'none', cursor: 'pointer',
                    background: resultAlert.type === 'success' ? '#0d6e6e' : '#CC2020',
                  }}
                >
                  {resultAlert.type === 'success' ? 'ตกลง' : 'ลองใหม่'}
                </button>
              </div>
            </div>
          )}

          {/* Footer: เครดิต + ยอดแทง + ปุ่มยืนยัน */}
          <div style={{
            padding: '12px 16px 16px', borderTop: '1px solid #eee',
            background: 'white', flexShrink: 0,
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          }}>
            {/* เครดิตคงเหลือ + ยอดแทง */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: '#888' }}>เครดิตคงเหลือ</span>
              <span style={{ fontWeight: 700, color: '#34C759' }}>
                ฿{(member?.balance || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: '#888' }}>ยอดแทง ({betSlip.length} รายการ)</span>
              <span style={{ fontWeight: 700, color: '#FF9500' }}>
                ฿{totalAmount.toLocaleString()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 13 }}>
              <span style={{ color: '#888' }}>เครดิตหลังแทง</span>
              <span style={{ fontWeight: 700, color: (member?.balance || 0) >= totalAmount ? '#1a3d35' : '#FF3B30' }}>
                ฿{((member?.balance || 0) - totalAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* เตือนถ้าเครดิตไม่พอ */}
            {(member?.balance || 0) < totalAmount && (
              <div style={{
                background: 'rgba(255,59,48,0.08)', borderRadius: 10,
                padding: '8px 12px', marginBottom: 12, fontSize: 13,
                color: '#FF3B30', textAlign: 'center', fontWeight: 600,
              }}>
                เครดิตไม่เพียงพอ กรุณาเติมเงินก่อน
              </div>
            )}

            <button
              onClick={async () => {
                setResultAlert(null)
                const count = betSlip.length
                const amt = totalAmount
                const result = await onConfirm()
                if (result === true) {
                  setResultAlert({
                    type: 'success',
                    message: `ส่งโพย ${count} รายการ รวม ฿${amt.toLocaleString()} สำเร็จ\nเครดิตคงเหลือ ฿${((member?.balance || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
                  })
                } else {
                  // result = false (generic error) หรือ string (error message จาก backend)
                  setResultAlert({
                    type: 'error',
                    message: typeof result === 'string' ? result : 'ไม่สามารถส่งโพยได้ กรุณาตรวจสอบเลขอั้นหรือเครดิตคงเหลือ',
                  })
                }
              }}
              disabled={loading || betSlip.length === 0 || (member?.balance || 0) < totalAmount}
              style={{
                display: 'block', width: '100%', padding: '16px',
                borderRadius: 14, fontSize: 17, fontWeight: 700,
                color: 'white', border: 'none',
                cursor: (loading || (member?.balance || 0) < totalAmount) ? 'not-allowed' : 'pointer',
                background: '#0d6e6e',
                opacity: (loading || (member?.balance || 0) < totalAmount) ? 0.5 : 1,
                boxShadow: '0 4px 20px rgba(13,110,110,0.35)',
                minHeight: 56,
              }}
            >
              {loading ? 'กำลังส่งโพย...' : `ยืนยันแทง (${betSlip.length} รายการ)`}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
