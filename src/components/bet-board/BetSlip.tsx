/**
 * BetSlip — สรุปรายการแทงก่อนยืนยัน
 *
 * 2 โหมด:
 *   1. Mini mode (default) — สรุปย่อ + ปุ่ม "ดูรายการแทง"
 *   2. Fullscreen modal — รายการเต็มจอ + แก้ราคาได้ + ใส่ราคาทั้งหมด
 *
 * ⭐ v2 — เพิ่ม "ใส่ราคาทั้งหมด" ที่ footer + ปรับ layout ตามธีม
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trash2, X, ChevronRight, AlertTriangle } from 'lucide-react'
import { useBetStore, BetSlipItem } from '@/store/bet-store'
import { useAuthStore } from '@/store/auth-store'
import { betApi } from '@/lib/api'

interface BetSlipProps {
  onConfirm: () => Promise<boolean | string>
  loading?: boolean
}

export default function BetSlip({ onConfirm, loading }: BetSlipProps) {
  const { betSlip, removeFromBetSlip, updateAmount, clearBetSlip, getTotalAmount, removeDuplicates } = useBetStore()
  const { member } = useAuthStore()
  const [showFull, setShowFull] = useState(false)
  const [resultAlert, setResultAlert] = useState<{ type: 'success' | 'error'; message: string; closeFull?: boolean } | null>(null)
  const [bulkAmount, setBulkAmount] = useState('')
  const [numberWarnings, setNumberWarnings] = useState<Record<string, { status: string; message?: string; reduced_rate?: number }>>({})
  const currentRound = useBetStore(s => s.currentRound)

  // ─── Check เลขอั้น ──────────────────────────────────────
  const checkNumbers = useCallback(async () => {
    if (!currentRound || betSlip.length === 0) { setNumberWarnings({}); return }
    try {
      const items = betSlip.map(b => ({ bet_type_code: b.betType, number: b.number }))
      const unique = items.filter((v, i, a) => a.findIndex(t => t.bet_type_code === v.bet_type_code && t.number === v.number) === i)
      const res = await betApi.checkNumbers({ lottery_round_id: currentRound.id, items: unique })
      const results = res.data?.data || []
      const warnings: typeof numberWarnings = {}
      results.forEach((r) => {
        if (r.status !== 'ok') warnings[`${r.bet_type}-${r.number}`] = { status: r.status, message: r.message, reduced_rate: r.reduced_rate }
      })
      setNumberWarnings(warnings)
    } catch { /* ignore */ }
  }, [currentRound, betSlip])

  useEffect(() => {
    const timer = setTimeout(checkNumbers, 300)
    return () => clearTimeout(timer)
  }, [checkNumbers])

  // ─── ใส่ราคาทั้งหมด ─────────────────────────────────────
  const applyBulkAmount = (amt: number) => {
    if (amt < 1) return
    betSlip.forEach(item => updateAmount(item.id, amt))
    setBulkAmount(String(amt))
  }

  // ─── จัดกลุ่มตามจำนวนหลัก ───────────────────────────────
  const groupItems = () => {
    const digitMap: Record<number, BetSlipItem[]> = {}
    for (const item of betSlip) {
      const d = item.number.length
      if (!digitMap[d]) digitMap[d] = []
      digitMap[d].push(item)
    }
    const meta: Record<number, { label: string; color: string }> = {
      4: { label: '4 ตัว', color: '#EF4444' },
      3: { label: '3 ตัว', color: '#3B82F6' },
      2: { label: '2 ตัว', color: '#F59E0B' },
      1: { label: 'วิ่ง', color: '#8B5CF6' },
    }
    return [4, 3, 2, 1]
      .filter(d => digitMap[d])
      .map(d => ({ digit: d, ...(meta[d] || { label: `${d} หลัก`, color: '#6b7280' }), items: digitMap[d] }))
  }

  // ─── Result Alert Overlay ───────────────────────────────
  if (betSlip.length === 0 && resultAlert?.closeFull) {
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
          <div style={{ fontSize: 48, marginBottom: 12 }}>{resultAlert.type === 'success' ? '✅' : '❌'}</div>
          <div style={{
            fontSize: 18, fontWeight: 700, marginBottom: 8,
            color: resultAlert.type === 'success' ? 'var(--accent-color)' : 'var(--ios-red)',
          }}>
            {resultAlert.type === 'success' ? 'แทงสำเร็จ!' : 'แทงไม่สำเร็จ'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--ios-secondary-label)', marginBottom: 20, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
            {resultAlert.message}
          </div>
          <button onClick={() => setResultAlert(null)} style={{
            width: '100%', padding: '14px', borderRadius: 12, fontSize: 16, fontWeight: 700,
            border: 'none', cursor: 'pointer',
            background: resultAlert.type === 'success' ? 'var(--accent-color)' : 'var(--ios-red)',
            color: resultAlert.type === 'success' ? '#1a1a1a' : 'white',
          }}>
            ตกลง
          </button>
        </div>
      </div>
    )
  }

  // ─── Empty State ────────────────────────────────────────
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
  const balance = member?.balance || 0
  const hasBanned = betSlip.some(b => { const w = numberWarnings[`${b.betType}-${b.number}`]; return w && (w.status === 'full_ban' || w.status === 'banned') })
  const canConfirm = !loading && betSlip.length > 0 && balance >= totalAmount && !hasBanned

  // ── Mini mode ───────────────────────────────────────────
  return (
    <>
      <button
        onClick={() => setShowFull(true)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '14px 16px',
          borderRadius: 14, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, var(--header-bg) 0%, color-mix(in srgb, var(--header-bg) 70%, black) 100%)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8,
            background: 'var(--accent-color)', color: 'var(--nav-bg)',
          }}>
            {betSlip.length}
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>รายการแทง</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-color)' }}>
            ฿{totalAmount.toLocaleString()}
          </span>
          <ChevronRight size={16} color="var(--accent-color)" />
        </div>
      </button>

      {/* ── Fullscreen Modal ─────────────────────────────── */}
      {showFull && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'var(--ios-bg)',
          display: 'flex', flexDirection: 'column',
          maxWidth: 680, margin: '0 auto',
          borderLeft: '1px solid var(--ios-separator)',
          borderRight: '1px solid var(--ios-separator)',
        }}>
          {/* ── Header ── */}
          <div style={{
            background: 'linear-gradient(135deg, var(--header-bg) 0%, color-mix(in srgb, var(--header-bg) 70%, black) 100%)',
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            flexShrink: 0,
          }}>
            <button onClick={() => setShowFull(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <X size={22} color="white" />
            </button>
            <span style={{ color: 'white', fontSize: 17, fontWeight: 700, flex: 1 }}>
              รายการแทง ({betSlip.length})
            </span>
            <button onClick={() => {
              const n = removeDuplicates()
              setResultAlert(n > 0 ? { type: 'success', message: `ลบเลขซ้ำ ${n} รายการ` } : { type: 'success', message: 'ไม่มีเลขซ้ำ' })
            }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-color)', fontSize: 13, fontWeight: 600 }}>
              เคลียซ้ำ
            </button>
            <button onClick={clearBetSlip} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b', fontSize: 13, fontWeight: 600 }}>
              ล้างทั้งหมด
            </button>
          </div>

          {/* ── Scrollable bet list ── */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {groupItems().map(group => (
              <div key={group.digit}>
                {/* Group header */}
                <div style={{
                  padding: '8px 16px',
                  background: `${group.color}10`,
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
                  const warn = numberWarnings[`${item.betType}-${item.number}`]
                  const isBanned = warn && (warn.status === 'full_ban' || warn.status === 'banned')

                  return (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 16px',
                      borderBottom: '0.5px solid var(--ios-separator)',
                      opacity: isBanned ? 0.35 : 1,
                    }}>
                      {/* Badge */}
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: group.color,
                        background: `${group.color}15`, padding: '3px 8px', borderRadius: 6,
                        whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        {item.betTypeName}
                      </span>

                      {/* เลข */}
                      <span style={{
                        fontFamily: 'monospace', fontWeight: 800, fontSize: 20,
                        color: 'var(--ios-label)', minWidth: 36,
                      }}>
                        {item.number}
                      </span>

                      {/* Warning */}
                      {warn && (
                        <AlertTriangle size={14} color={isBanned ? 'var(--ios-red)' : 'var(--ios-orange)'} style={{ flexShrink: 0 }} />
                      )}

                      <span style={{ flex: 1 }} />

                      {/* ราคา input */}
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateAmount(item.id, Math.max(1, Number(e.target.value)))}
                        min={1}
                        style={{
                          width: 56, textAlign: 'center', fontSize: 14, fontWeight: 700,
                          border: '1.5px solid var(--ios-separator)', borderRadius: 8, padding: '5px 4px',
                          background: 'var(--ios-bg)', color: 'var(--ios-label)', outline: 'none',
                        }}
                      />

                      {/* เรท × ราคา */}
                      <span style={{ fontSize: 11, color: 'var(--ios-tertiary-label)', minWidth: 36, textAlign: 'right' }}>
                        x{item.rate}
                      </span>

                      {/* ยอดชนะ */}
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-color)', minWidth: 60, textAlign: 'right' }}>
                        ฿{item.potentialWin.toLocaleString()}
                      </span>

                      {/* ลบ */}
                      <button onClick={() => removeFromBetSlip(item.id)} style={{
                        padding: 4, background: 'none', border: 'none', cursor: 'pointer',
                      }}>
                        <Trash2 size={16} color="var(--ios-red)" />
                      </button>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* ── Result Alert ── */}
          {resultAlert && (
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
                <div style={{ fontSize: 48, marginBottom: 12 }}>{resultAlert.type === 'success' ? '✅' : '❌'}</div>
                <div style={{
                  fontSize: 18, fontWeight: 700, marginBottom: 8,
                  color: resultAlert.type === 'success' ? 'var(--accent-color)' : 'var(--ios-red)',
                }}>
                  {resultAlert.type === 'success' ? 'แทงสำเร็จ!' : 'แทงไม่สำเร็จ'}
                </div>
                <div style={{ fontSize: 14, color: 'var(--ios-secondary-label)', marginBottom: 20, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                  {resultAlert.message}
                </div>
                <button onClick={() => { setResultAlert(null); if (resultAlert.closeFull) setShowFull(false) }} style={{
                  width: '100%', padding: '14px', borderRadius: 12, fontSize: 16, fontWeight: 700,
                  border: 'none', cursor: 'pointer',
                  background: resultAlert.type === 'success' ? 'var(--accent-color)' : 'var(--ios-red)',
                  color: resultAlert.type === 'success' ? '#1a1a1a' : 'white',
                }}>
                  {resultAlert.type === 'success' ? 'ตกลง' : 'ลองใหม่'}
                </button>
              </div>
            </div>
          )}

          {/* ── Footer: ใส่ราคาทั้งหมด + สรุป + ยืนยัน ── */}
          <div style={{
            borderTop: '1px solid var(--ios-separator)',
            background: 'var(--ios-card)', flexShrink: 0,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}>
            {/* ใส่ราคาทั้งหมด */}
            <div style={{ padding: '10px 16px', borderBottom: '0.5px solid var(--ios-separator)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ios-secondary-label)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                ใส่ราคาทั้งหมด
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {[5, 10, 20, 50, 100].map(amt => (
                  <button
                    key={amt}
                    onClick={() => applyBulkAmount(amt)}
                    style={{
                      flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13, fontWeight: 700,
                      border: bulkAmount === String(amt) ? '1.5px solid var(--accent-color)' : '1.5px solid var(--ios-separator)',
                      background: bulkAmount === String(amt) ? 'color-mix(in srgb, var(--accent-color) 15%, transparent)' : 'var(--ios-bg)',
                      color: bulkAmount === String(amt) ? 'var(--accent-color)' : 'var(--ios-label)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    ฿{amt}
                  </button>
                ))}
                <input
                  type="number"
                  placeholder="อื่นๆ"
                  value={bulkAmount}
                  onChange={(e) => {
                    setBulkAmount(e.target.value)
                    const v = Number(e.target.value)
                    if (v >= 1) betSlip.forEach(item => updateAmount(item.id, v))
                  }}
                  min={1}
                  style={{
                    width: 64, textAlign: 'center', fontSize: 13, fontWeight: 700,
                    border: '1.5px solid var(--ios-separator)', borderRadius: 8, padding: '7px 4px',
                    background: 'var(--ios-bg)', color: 'var(--ios-label)', outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* สรุปยอด */}
            <div style={{ padding: '10px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                <span style={{ color: 'var(--ios-secondary-label)' }}>เครดิตคงเหลือ</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>
                  ฿{balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                <span style={{ color: 'var(--ios-secondary-label)' }}>ยอดแทง ({betSlip.length} รายการ)</span>
                <span style={{ fontWeight: 700, color: 'var(--ios-orange)' }}>฿{totalAmount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
                <span style={{ color: 'var(--ios-secondary-label)' }}>เครดิตหลังแทง</span>
                <span style={{ fontWeight: 700, color: balance >= totalAmount ? 'var(--ios-label)' : 'var(--ios-red)' }}>
                  ฿{(balance - totalAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Warnings */}
              {hasBanned && (
                <div style={{
                  background: 'rgba(255,59,48,0.08)', borderRadius: 10,
                  padding: '8px 12px', marginBottom: 10, fontSize: 13,
                  color: 'var(--ios-red)', textAlign: 'center', fontWeight: 600,
                }}>
                  มีเลขอั้น — กรุณาลบออกก่อนแทง
                </div>
              )}
              {balance < totalAmount && (
                <div style={{
                  background: 'rgba(255,59,48,0.08)', borderRadius: 10,
                  padding: '8px 12px', marginBottom: 10, fontSize: 13,
                  color: 'var(--ios-red)', textAlign: 'center', fontWeight: 600,
                }}>
                  เครดิตไม่เพียงพอ
                </div>
              )}

              {/* ปุ่มยืนยัน */}
              <button
                onClick={async () => {
                  setResultAlert(null)
                  const count = betSlip.length
                  const amt = totalAmount
                  const result = await onConfirm()
                  if (result === true) {
                    setResultAlert({
                      type: 'success',
                      message: `ส่งโพย ${count} รายการ รวม ฿${amt.toLocaleString()} สำเร็จ`,
                      closeFull: true,
                    })
                  } else {
                    setResultAlert({
                      type: 'error',
                      message: typeof result === 'string' ? result : 'ไม่สามารถส่งโพยได้',
                    })
                  }
                }}
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
          </div>
        </div>
      )}
    </>
  )
}
