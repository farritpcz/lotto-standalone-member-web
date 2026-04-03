/**
 * BetSlip — สรุปรายการแทงก่อนยืนยัน
 *
 * 2 โหมด:
 *   1. Mini mode (default) — แสดงสรุปย่อ + ปุ่ม "ดูรายการแทง" เปิด fullscreen
 *   2. Fullscreen modal — ตารางเต็มจอ + แก้ราคาได้ + ปุ่มยืนยันแทง
 *
 * ⭐ ใช้ CSS variables ตามธีม (dark/light) ทั้งหมด — ไม่ hardcode สี
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useBetStore, BetSlipItem } from '@/store/bet-store'
import { useAuthStore } from '@/store/auth-store'
import { betApi } from '@/lib/api'

interface BetSlipProps {
  /** return true if success, string with error message if failed, false for generic error */
  onConfirm: () => Promise<boolean | string>
  loading?: boolean
}

export default function BetSlip({ onConfirm, loading }: BetSlipProps) {
  const { betSlip, removeFromBetSlip, updateAmount, clearBetSlip, getTotalAmount, removeDuplicates } = useBetStore()
  const { member } = useAuthStore()
  const [showFull, setShowFull] = useState(false)
  const [resultAlert, setResultAlert] = useState<{ type: 'success' | 'error'; message: string; closeFull?: boolean } | null>(null)

  // ⭐ เช็คเลขอั้น/ลดเรท/จำกัดยอด — แสดง warning ก่อนแทง
  const [numberWarnings, setNumberWarnings] = useState<Record<string, { status: string; message: string; reduced_rate?: number }>>({})

  const currentRound = useBetStore(s => s.currentRound)

  const checkNumbers = useCallback(async () => {
    if (!currentRound || betSlip.length === 0) { setNumberWarnings({}); return }
    try {
      const items = betSlip.map(b => ({ bet_type_code: b.betType, number: b.number }))
      // deduplicate
      const unique = items.filter((v, i, a) => a.findIndex(t => t.bet_type_code === v.bet_type_code && t.number === v.number) === i)
      const res = await betApi.checkNumbers({ lottery_round_id: currentRound.id, items: unique })
      const results = res.data?.data || []
      const warnings: typeof numberWarnings = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results.forEach((r: any) => {
        if (r.status !== 'ok') {
          warnings[`${r.bet_type}-${r.number}`] = { status: r.status, message: r.message, reduced_rate: r.reduced_rate }
        }
      })
      setNumberWarnings(warnings)
    } catch { /* ignore */ }
  }, [currentRound, betSlip])

  useEffect(() => {
    const timer = setTimeout(checkNumbers, 300) // debounce
    return () => clearTimeout(timer)
  }, [checkNumbers])

  // ===== Result Alert Overlay (แสดงหลังแทงสำเร็จ/ไม่สำเร็จ) =====
  // ถ้า betSlip ว่าง แต่มี resultAlert ที่ต้องปิด fullscreen → แสดง alert ก่อน
  if (betSlip.length === 0 && resultAlert && resultAlert.closeFull) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{
          background: 'var(--ios-card)', borderRadius: 20, padding: '32px 24px',
          textAlign: 'center', maxWidth: 320, width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            {resultAlert.type === 'success' ? '✅' : '❌'}
          </div>
          <div style={{
            fontSize: 18, fontWeight: 700, marginBottom: 8,
            color: resultAlert.type === 'success' ? 'var(--ios-green)' : 'var(--ios-red)',
          }}>
            {resultAlert.type === 'success' ? 'แทงสำเร็จ!' : 'แทงไม่สำเร็จ'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--ios-secondary-label)', marginBottom: 20, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
            {resultAlert.message}
          </div>
          <button
            onClick={() => setResultAlert(null)}
            style={{
              width: '100%', padding: '14px',
              borderRadius: 12, fontSize: 16, fontWeight: 700,
              color: 'white', border: 'none', cursor: 'pointer',
              background: resultAlert.type === 'success' ? 'var(--ios-green)' : 'var(--ios-red)',
            }}
          >
            ตกลง
          </button>
        </div>
      </div>
    )
  }

  // ===== Empty State =====
  if (betSlip.length === 0 && !resultAlert) {
    return (
      <div style={{
        background: 'var(--ios-card)', borderRadius: 16, padding: 24,
        textAlign: 'center', boxShadow: 'var(--shadow-card)',
      }}>
        <p style={{ fontSize: 32, marginBottom: 8 }}>📝</p>
        <p style={{ color: 'var(--ios-secondary-label)', fontSize: 14 }}>ยังไม่มีรายการแทง</p>
        <p style={{ color: 'var(--ios-tertiary-label)', fontSize: 12, marginTop: 4 }}>เลือกประเภท → กดเลข → เพิ่มรายการ</p>
      </div>
    )
  }

  const totalAmount = getTotalAmount()

  // ── Mini mode: แสดงสรุปย่อ + ปุ่มเปิดเต็มจอ ──────────────────────────────
  return (
    <>
      <div style={{ background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', background: 'var(--ios-bg)',
        }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ios-label)' }}>รายการแทง ({betSlip.length})</span>
          <button onClick={clearBetSlip} style={{ fontSize: 12, fontWeight: 600, color: 'var(--ios-red)', background: 'none', border: 'none', cursor: 'pointer' }}>
            ล้างทั้งหมด
          </button>
        </div>

        {/* สรุปย่อ: แสดง 3 รายการแรก */}
        <div style={{ padding: '4px 16px' }}>
          {betSlip.slice(0, 3).map((item: BetSlipItem) => {
            const warn = numberWarnings[`${item.betType}-${item.number}`]
            return (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 0', borderBottom: '0.5px solid var(--ios-separator)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                    background: 'var(--ios-bg)', color: 'var(--ios-secondary-label)',
                  }}>
                    {item.betTypeName}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14, color: 'var(--ios-green)' }}>{item.number}</span>
                  {warn && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10,
                      background: warn.status === 'full_ban' || warn.status === 'banned' ? 'rgba(255,59,48,0.1)' : 'rgba(255,159,10,0.1)',
                      color: warn.status === 'full_ban' || warn.status === 'banned' ? 'var(--ios-red)' : 'var(--ios-orange)',
                    }}>
                      {warn.message}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ios-label)' }}>฿{item.amount}</span>
              </div>
            )
          })}
          {betSlip.length > 3 && (
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ios-tertiary-label)', padding: '4px 0' }}>+{betSlip.length - 3} รายการเพิ่มเติม</p>
          )}
        </div>

        {/* Footer: ยอดรวม + ปุ่มเปิดเต็มจอ */}
        <div style={{ padding: '10px 16px 14px', background: 'var(--ios-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--ios-secondary-label)' }}>ยอดรวม</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--ios-green)' }}>฿{totalAmount.toLocaleString()}</span>
          </div>
          <button
            onClick={() => setShowFull(true)}
            style={{
              width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              color: 'white', border: 'none', cursor: 'pointer',
              background: 'var(--ios-green)', boxShadow: '0 4px 16px rgba(52,199,89,0.3)',
            }}
          >
            ดูรายการแทง ({betSlip.length} รายการ)
          </button>
        </div>
      </div>

      {/* ── Fullscreen Modal ────────────────────────────────────────────────── */}
      {showFull && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'var(--ios-bg)',
          display: 'flex', flexDirection: 'column',
          maxWidth: 680, margin: '0 auto',
          borderLeft: '1px solid var(--ios-separator)',
          borderRight: '1px solid var(--ios-separator)',
        }}>
          {/* Header — โทน balance card */}
          <div style={{
            background: 'linear-gradient(135deg, var(--header-bg) 0%, color-mix(in srgb, var(--header-bg) 70%, black) 100%)',
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
            borderBottom: '1px solid var(--ios-separator)',
          }}>
            <button onClick={() => setShowFull(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} style={{ width: 22, height: 22 }}>
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span style={{ color: 'white', fontSize: 17, fontWeight: 700 }}>
              รายการแทง ({betSlip.length})
            </span>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => {
                const n = removeDuplicates()
                setResultAlert(n > 0
                  ? { type: 'success', message: `ลบเลขซ้ำ ${n} รายการ` }
                  : { type: 'success', message: 'ไม่มีเลขซ้ำ' }
                )
              }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-color)', fontSize: 13, fontWeight: 600 }}>
                เคลียซ้ำ
              </button>
              <button onClick={clearBetSlip} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ios-red)', fontSize: 13, fontWeight: 600 }}>
                ล้างทั้งหมด
              </button>
            </div>
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
              const groupMeta: Record<number, { label: string; color: string; bg: string }> = {
                3: { label: '3 ตัว', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
                2: { label: '2 ตัว', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
                1: { label: 'วิ่ง / 1 ตัว', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
                4: { label: '4 ตัว', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
              }
              for (const d of [4, 3, 2, 1]) {
                if (digitMap[d]) {
                  const meta = groupMeta[d] || { label: `${d} หลัก`, color: 'var(--ios-secondary-label)', bg: 'var(--ios-bg)' }
                  groups.push({ ...meta, items: digitMap[d] })
                }
              }
              return groups.map(group => (
                <div key={group.label}>
                  {/* Group header */}
                  <div style={{
                    padding: '8px 16px',
                    background: group.bg,
                    borderBottom: '0.5px solid var(--ios-separator)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: 'white',
                      background: group.color, padding: '2px 10px', borderRadius: 10,
                    }}>
                      {group.label}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--ios-secondary-label)' }}>
                      {group.items.length} รายการ
                    </span>
                  </div>
                  {/* Items */}
                  {group.items.map((item: BetSlipItem) => {
                    const isBanned = (() => { const w = numberWarnings[`${item.betType}-${item.number}`]; return w && (w.status === 'full_ban' || w.status === 'banned') })()
                    return (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 16px',
                      borderBottom: '0.5px solid var(--ios-separator)',
                      opacity: isBanned ? 0.4 : 1,
                      background: isBanned ? 'rgba(255,59,48,0.04)' : undefined,
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
                      {/* เลข + warning */}
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 18, color: 'var(--ios-label)', minWidth: 40, textAlign: 'center' }}>
                        {item.number}
                      </span>
                      {numberWarnings[`${item.betType}-${item.number}`] && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10,
                          background: numberWarnings[`${item.betType}-${item.number}`].status === 'full_ban' || numberWarnings[`${item.betType}-${item.number}`].status === 'banned' ? 'rgba(255,59,48,0.1)' : 'rgba(255,159,10,0.1)',
                          color: numberWarnings[`${item.betType}-${item.number}`].status === 'full_ban' || numberWarnings[`${item.betType}-${item.number}`].status === 'banned' ? 'var(--ios-red)' : 'var(--ios-orange)',
                          flexShrink: 0,
                        }}>
                          {numberWarnings[`${item.betType}-${item.number}`].message}
                        </span>
                      )}
                      {/* ราคา input — ใช้สีธีม */}
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateAmount(item.id, Math.max(1, Number(e.target.value)))}
                        min={1}
                        style={{
                          width: 60, textAlign: 'center', fontSize: 14, fontWeight: 700,
                          border: '1.5px solid var(--ios-separator)', borderRadius: 8, padding: '5px 4px',
                          background: 'var(--ios-bg)', color: 'var(--ios-label)',
                          outline: 'none', flexShrink: 0,
                        }}
                      />
                      {/* เรท */}
                      <span style={{ fontSize: 12, color: 'var(--ios-tertiary-label)', flexShrink: 0 }}>x{item.rate}</span>
                      {/* ชนะ */}
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-color)', marginLeft: 'auto', flexShrink: 0 }}>
                        ฿{item.potentialWin.toLocaleString()}
                      </span>
                      {/* ลบ */}
                      <button
                        onClick={() => removeFromBetSlip(item.id)}
                        style={{
                          width: 26, height: 26, borderRadius: 13,
                          background: 'rgba(255,59,48,0.08)', color: 'var(--ios-red)',
                          border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )
                  })}
                </div>
              ))
            })()}
          </div>

          {/* Result Alert — แสดงหลังกดยืนยัน */}
          {resultAlert && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 300,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24,
            }}>
              <div style={{
                background: 'var(--ios-card)', borderRadius: 20, padding: '32px 24px',
                textAlign: 'center', maxWidth: 320, width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>
                  {resultAlert.type === 'success' ? '✅' : '❌'}
                </div>
                <div style={{
                  fontSize: 18, fontWeight: 700, marginBottom: 8,
                  color: resultAlert.type === 'success' ? 'var(--accent-color)' : 'var(--ios-red)',
                }}>
                  {resultAlert.type === 'success' ? 'แทงสำเร็จ!' : 'แทงไม่สำเร็จ'}
                </div>
                <div style={{ fontSize: 14, color: 'var(--ios-secondary-label)', marginBottom: 20, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                  {resultAlert.message}
                </div>
                <button
                  onClick={() => { setResultAlert(null); if (resultAlert.closeFull) setShowFull(false) }}
                  style={{
                    width: '100%', padding: '14px',
                    borderRadius: 12, fontSize: 16, fontWeight: 700,
                    color: 'white', border: 'none', cursor: 'pointer',
                    background: resultAlert.type === 'success'
                      ? 'linear-gradient(180deg, var(--accent-color) 0%, color-mix(in srgb, var(--accent-color) 82%, black) 100%)'
                      : 'var(--ios-red)',
                    color: resultAlert.type === 'success' ? '#1a1a1a' : 'white',
                  }}
                >
                  {resultAlert.type === 'success' ? 'ตกลง' : 'ลองใหม่'}
                </button>
              </div>
            </div>
          )}

          {/* Footer: เครดิต + ยอดแทง + ปุ่มยืนยัน — ใช้สีธีม */}
          <div style={{
            padding: '12px 16px 16px',
            borderTop: '0.5px solid var(--ios-separator)',
            background: 'var(--ios-card)', flexShrink: 0,
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          }}>
            {/* เครดิตคงเหลือ + ยอดแทง + เครดิตหลังแทง */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: 'var(--ios-secondary-label)' }}>เครดิตคงเหลือ</span>
              <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>
                ฿{(member?.balance || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: 'var(--ios-secondary-label)' }}>ยอดแทง ({betSlip.length} รายการ)</span>
              <span style={{ fontWeight: 700, color: 'var(--ios-orange)' }}>
                ฿{totalAmount.toLocaleString()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
              <span style={{ color: 'var(--ios-secondary-label)' }}>เครดิตหลังแทง</span>
              <span style={{ fontWeight: 700, color: (member?.balance || 0) >= totalAmount ? 'var(--ios-label)' : 'var(--ios-red)' }}>
                ฿{((member?.balance || 0) - totalAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* ⭐ เตือนถ้ามีเลขอั้น */}
            {(() => {
              const bannedItems = betSlip.filter(b => {
                const w = numberWarnings[`${b.betType}-${b.number}`]
                return w && (w.status === 'full_ban' || w.status === 'banned')
              })
              if (bannedItems.length > 0) return (
                <div style={{
                  background: 'rgba(255,59,48,0.08)', borderRadius: 10,
                  padding: '10px 12px', marginBottom: 12, fontSize: 13,
                  color: 'var(--ios-red)', textAlign: 'center', fontWeight: 600,
                }}>
                  <div>มีเลขอั้น {bannedItems.length} รายการ</div>
                  <button
                    onClick={() => {
                      bannedItems.forEach(b => removeFromBetSlip(b.id))
                      const remaining = betSlip.length - bannedItems.length
                      if (remaining <= 0) setShowFull(false)
                    }}
                    style={{
                      marginTop: 8, padding: '8px 20px', borderRadius: 10,
                      background: 'var(--ios-red)', color: 'white', border: 'none',
                      fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    ลบเลขอั้นทั้งหมด ({bannedItems.length})
                  </button>
                </div>
              )
              return null
            })()}

            {/* เตือนถ้าเครดิตไม่พอ */}
            {(member?.balance || 0) < totalAmount && (
              <div style={{
                background: 'rgba(255,59,48,0.08)', borderRadius: 10,
                padding: '8px 12px', marginBottom: 12, fontSize: 13,
                color: 'var(--ios-red)', textAlign: 'center', fontWeight: 600,
              }}>
                เครดิตไม่เพียงพอ กรุณาเติมเงินก่อน
              </div>
            )}

            {/* ปุ่มยืนยัน — ใช้ --ios-green แทน hardcode */}
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
                    closeFull: true,
                  })
                } else {
                  setResultAlert({
                    type: 'error',
                    message: typeof result === 'string' ? result : 'ไม่สามารถส่งโพยได้ กรุณาตรวจสอบเลขอั้นหรือเครดิตคงเหลือ',
                  })
                }
              }}
              disabled={loading || betSlip.length === 0 || (member?.balance || 0) < totalAmount || betSlip.some(b => { const w = numberWarnings[`${b.betType}-${b.number}`]; return w && (w.status === 'full_ban' || w.status === 'banned') })}
              style={{
                display: 'block', width: '100%', padding: '16px',
                borderRadius: 14, fontSize: 17, fontWeight: 700,
                color: 'white', border: 'none',
                cursor: (loading || (member?.balance || 0) < totalAmount) ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(180deg, var(--accent-color) 0%, color-mix(in srgb, var(--accent-color) 82%, black) 100%)',
                color: '#1a1a1a',
                opacity: (loading || (member?.balance || 0) < totalAmount || betSlip.some(b => { const w = numberWarnings[`${b.betType}-${b.number}`]; return w && (w.status === 'full_ban' || w.status === 'banned') })) ? 0.5 : 1,
                boxShadow: '0 4px 20px color-mix(in srgb, var(--accent-color) 30%, transparent)',
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
