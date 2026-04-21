/**
 * BetSlip — สรุปรายการแทงก่อนยืนยัน (orchestrator)
 *
 * 2 โหมด:
 *   1. Mini mode (default) — สรุปย่อ + ปุ่ม "ดูรายการแทง"
 *   2. Fullscreen modal — รายการเต็มจอ + แก้ราคาได้ + ใส่ราคาทั้งหมด
 *
 * ⭐ v2 — เพิ่ม "ใส่ราคาทั้งหมด" ที่ footer + ปรับ layout ตามธีม
 * ⭐ v3 — refactor: แตกเป็น sub-components ใน ./bet-slip/*
 *        ไฟล์นี้เหลือแค่ state + handlers + การ wire พวกย่อย
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronRight } from 'lucide-react'
import { useBetStore, BetSlipItem } from '@/store/bet-store'
import { useAuthStore } from '@/store/auth-store'
import { betApi } from '@/lib/api'
import BetItem from './bet-slip/BetItem'
import BetSlipHeader from './bet-slip/BetSlipHeader'
import BetSlipActions from './bet-slip/BetSlipActions'
import BetSlipFooter from './bet-slip/BetSlipFooter'
import BetSlipResultAlert from './bet-slip/BetSlipResultAlert'
import { groupBetItems, type NumberWarningMap, type ResultAlertState } from './bet-slip/types'

interface BetSlipProps {
  onConfirm: () => Promise<boolean | string>
  loading?: boolean
}

export default function BetSlip({ onConfirm, loading }: BetSlipProps) {
  const { betSlip, removeFromBetSlip, updateAmount, clearBetSlip, getTotalAmount, removeDuplicates } = useBetStore()
  const { member } = useAuthStore()
  const [showFull, setShowFull] = useState(false)
  const [resultAlert, setResultAlert] = useState<ResultAlertState | null>(null)
  const [bulkAmount, setBulkAmount] = useState('')
  const [numberWarnings, setNumberWarnings] = useState<NumberWarningMap>({})
  const currentRound = useBetStore(s => s.currentRound)

  // ─── Check เลขอั้น ──────────────────────────────────────
  const checkNumbers = useCallback(async () => {
    if (!currentRound || betSlip.length === 0) { setNumberWarnings({}); return }
    try {
      const items = betSlip.map(b => ({ bet_type_code: b.betType, number: b.number }))
      const unique = items.filter((v, i, a) => a.findIndex(t => t.bet_type_code === v.bet_type_code && t.number === v.number) === i)
      const res = await betApi.checkNumbers({ lottery_round_id: currentRound.id, items: unique })
      const results = res.data?.data || []
      const warnings: NumberWarningMap = {}
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

  // ─── ใส่ราคาทั้งหมด (preset) ────────────────────────────
  const applyBulkAmount = (amt: number) => {
    if (amt < 1) return
    betSlip.forEach(item => updateAmount(item.id, amt))
    setBulkAmount(String(amt))
  }

  // ─── ใส่ราคาทั้งหมด (custom input) ──────────────────────
  // พิมพ์เลขใน input "อื่นๆ" — ถ้า >= 1 จะ apply ให้ทุกรายการทันที
  const handleBulkAmountChange = (value: string) => {
    setBulkAmount(value)
    const v = Number(value)
    if (v >= 1) betSlip.forEach(item => updateAmount(item.id, v))
  }

  // ─── เคลียซ้ำ ──────────────────────────────────────────
  const handleRemoveDuplicates = () => {
    const n = removeDuplicates()
    setResultAlert(n > 0
      ? { type: 'success', message: `ลบเลขซ้ำ ${n} รายการ` }
      : { type: 'success', message: 'ไม่มีเลขซ้ำ' })
  }

  // ─── กดยืนยันแทง ────────────────────────────────────────
  const handleConfirm = async () => {
    setResultAlert(null)
    const count = betSlip.length
    const amt = getTotalAmount()
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
  }

  // ─── Result Alert Overlay (betSlip ว่างหลังส่งสำเร็จ) ───
  if (betSlip.length === 0 && resultAlert?.closeFull) {
    return (
      <BetSlipResultAlert
        alert={resultAlert}
        buttonLabel="ตกลง"
        onDismiss={() => setResultAlert(null)}
      />
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
          {/* Header */}
          <BetSlipHeader
            count={betSlip.length}
            onClose={() => setShowFull(false)}
            onRemoveDuplicates={handleRemoveDuplicates}
            onClearAll={clearBetSlip}
          />

          {/* Scrollable bet list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {groupBetItems(betSlip).map(group => (
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
                {group.items.map((item: BetSlipItem) => (
                  <BetItem
                    key={item.id}
                    item={item}
                    groupColor={group.color}
                    warn={numberWarnings[`${item.betType}-${item.number}`]}
                    onUpdateAmount={updateAmount}
                    onRemove={removeFromBetSlip}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Result Alert (ซ้อนใน modal — ปุ่มเปลี่ยน label ตาม success/error) */}
          {resultAlert && (
            <BetSlipResultAlert
              alert={resultAlert}
              buttonLabel={resultAlert.type === 'success' ? 'ตกลง' : 'ลองใหม่'}
              onDismiss={() => {
                setResultAlert(null)
                if (resultAlert.closeFull) setShowFull(false)
              }}
            />
          )}

          {/* Footer: ใส่ราคาทั้งหมด + สรุปยอด + ปุ่มยืนยัน */}
          <div style={{
            borderTop: '1px solid var(--ios-separator)',
            background: 'var(--ios-card)', flexShrink: 0,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}>
            <BetSlipActions
              bulkAmount={bulkAmount}
              onApplyPreset={applyBulkAmount}
              onBulkAmountChange={handleBulkAmountChange}
            />
            <BetSlipFooter
              balance={balance}
              totalAmount={totalAmount}
              betCount={betSlip.length}
              hasBanned={hasBanned}
              canConfirm={canConfirm}
              loading={loading}
              onConfirm={handleConfirm}
            />
          </div>
        </div>
      )}
    </>
  )
}
