/**
 * BetTypeSelector — เลือกประเภทการแทง (Multi-select)
 *
 * ⭐ v5 — Compact chips + collapsible groups + conflict (ไม่มี sub-group)
 *
 * Layout:
 * - แบ่งกลุ่มตาม digit: 3 หลัก / 2 หลัก / วิ่ง
 * - Collapsible header + badge นับจำนวนที่เลือก
 * - Compact chip: checkbox + ชื่อ + x{rate} + info icon
 * - Conflict: opacity จาง + auto-swap ใน store
 *
 * Conflict rules (จัดการใน bet-store):
 * - PERM3 (กลับ) ↔ 3TOP (บน) → เลือกได้แค่อันเดียว
 * - PERM2 (กลับ) ↔ 2TOP (บน) → เลือกได้แค่อันเดียว
 */

'use client'

import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Info, X } from 'lucide-react'
import { useBetStore } from '@/store/bet-store'
import type { BetType, BetTypeInfo } from '@/types'

// ─── ชื่อแสดงผลภาษาไทย ──────────────────────────────────
const betTypeLabels: Record<string, string> = {
  '4TOP': 'สี่ตัวบน',
  '4TOD': 'สี่ตัวโต๊ด',
  '3TOP': 'สามตัวบน',
  '3BOTTOM': 'สามตัวล่าง',
  '3TOD': 'สามตัวโต๊ด',
  '3FRONT': 'สามตัวหน้า',
  '3TOD_FRONT': 'สามโต๊ดหน้า',
  'PERM3': 'สามตัวกลับ',
  '2TOP': 'สองตัวบน',
  '2BOTTOM': 'สองตัวล่าง',
  '2TOP_UNDER': 'สองบน+ล่าง',
  'PERM2': 'สองตัวกลับ',
  'RUN_TOP': 'วิ่งบน',
  'RUN_BOT': 'วิ่งล่าง',
  '19DOOR': '19 ประตู',
  '1TOP': 'ท้าย 1 ตัว',
}

// ─── คำอธิบายสั้นๆ สำหรับ tooltip ─────────────────────────
const betTypeHints: Record<string, string> = {
  '3TOP': 'เลข 3 ตัวท้ายของรางวัลที่ 1 ต้องตรงตำแหน่ง',
  '3TOD': 'เลข 3 ตัวท้ายของรางวัลที่ 1 สลับตำแหน่งได้ทุกแบบ',
  'PERM3': 'ระบบกลับเลขให้อัตโนมัติ แทงเป็น "บน" ทุกตัว เช่น 123 → 132, 213...',
  '3FRONT': 'เลข 3 ตัวหน้าของรางวัลที่ 1 ต้องตรงตำแหน่ง',
  '3TOD_FRONT': 'เลข 3 ตัวหน้าของรางวัลที่ 1 สลับตำแหน่งได้ทุกแบบ',
  '3BOTTOM': 'เลขท้าย 3 ตัว (ล่าง 2 รางวัล) ต้องตรงตำแหน่ง',
  'PERM2': 'ระบบกลับเลขให้อัตโนมัติ เช่น 12 → 21',
  '19DOOR': 'แทงเลข 2 ตัว วิ่งทั้งบนและล่าง 19 ชุด',
  '1TOP': 'แทงเลขตัวท้ายตัวเดียว (0-9)',
  '4TOD': 'สลับตำแหน่งได้ทุกแบบ 4 หลัก',
  '2TOP_UNDER': 'แทง 2 ตัว ลุ้นทั้งบนและล่างพร้อมกัน',
}

// ─── ซ่อนจาก UI (ไม่แสดงให้เลือก) ──────────────────────
const hiddenCodes = new Set(['3TOD_FRONT', '19DOOR', '1TOP'])

// ─── ลำดับการแสดงผลภายในกลุ่ม ─────────────────────────────
const sortOrder: Record<string, number> = {
  '4TOP': 1, '4TOD': 2,
  '3TOP': 1, '3TOD': 2, '3FRONT': 3, '3BOTTOM': 4, '3TOD_FRONT': 5, 'PERM3': 6,
  '2TOP': 1, '2BOTTOM': 2, '2TOP_UNDER': 3, 'PERM2': 4,
  'RUN_TOP': 1, 'RUN_BOT': 2, '19DOOR': 3, '1TOP': 4,
}

// ─── Group structure (flat — ไม่มี sub-group) ─────────────
interface DigitGroup {
  key: string
  label: string
  types: BetTypeInfo[]
}

function groupBetTypes(betTypes: BetTypeInfo[]): DigitGroup[] {
  const runCodes = ['RUN_TOP', 'RUN_BOT', '19DOOR', '1TOP']
  const groups: Record<string, BetTypeInfo[]> = {}

  for (const bt of betTypes) {
    if (hiddenCodes.has(bt.code)) continue
    let key: string
    if (runCodes.includes(bt.code)) {
      key = 'run'
    } else if (bt.digit_count === 4 || bt.code.startsWith('4')) {
      key = '4'
    } else if (bt.digit_count === 3 || bt.code.startsWith('3') || bt.code === 'PERM3') {
      key = '3'
    } else if (bt.digit_count === 2 || bt.code.startsWith('2') || bt.code === 'PERM2') {
      key = '2'
    } else {
      key = 'run'
    }
    if (!groups[key]) groups[key] = []
    groups[key].push(bt)
  }

  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => (sortOrder[a.code] || 99) - (sortOrder[b.code] || 99))
  }

  const labels: Record<string, string> = { '4': '4 หลัก', '3': '3 หลัก', '2': '2 หลัก', 'run': 'วิ่ง / 1 หลัก' }
  return ['4', '3', '2', 'run']
    .filter(k => groups[k]?.length > 0)
    .map(k => ({ key: k, label: labels[k], types: groups[k] }))
}

// ─── Conflict pairs ───────────────────────────────────────
const conflictWith: Record<string, string> = {
  'PERM3': '3TOP', '3TOP': 'PERM3',
  'PERM2': '2TOP', '2TOP': 'PERM2',
}

export default function BetTypeSelector() {
  const { betTypes, selectedBetTypes, toggleBetType } = useBetStore()
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [showHint, setShowHint] = useState<string | null>(null)

  const groups = groupBetTypes(betTypes)

  const toggleCollapse = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const countSelected = (types: BetTypeInfo[]) =>
    types.filter(bt => selectedBetTypes.includes(bt.code as BetType)).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {groups.map(group => {
        const isCollapsed = collapsedGroups.has(group.key)
        const selectedCount = countSelected(group.types)

        return (
          <div key={group.key}>
            {/* ─── Section Header ─── */}
            <button
              onClick={() => toggleCollapse(group.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '6px 0',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <span style={{
                fontSize: 12, fontWeight: 800, letterSpacing: 0.5,
                color: 'var(--accent-color)', textTransform: 'uppercase',
              }}>
                {group.label}
              </span>

              {selectedCount > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  padding: '2px 7px', borderRadius: 10,
                  background: 'var(--accent-color)',
                  color: 'var(--nav-bg)',
                  lineHeight: '14px',
                }}>
                  {selectedCount}
                </span>
              )}

              <span style={{ flex: 1 }} />
              {isCollapsed
                ? <ChevronDown size={14} color="var(--ios-tertiary-label)" />
                : <ChevronUp size={14} color="var(--ios-tertiary-label)" />
              }
            </button>

            {/* ─── Chips Grid ─── */}
            {!isCollapsed && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {group.types.map(bt => {
                  const code = bt.code
                  const isSelected = selectedBetTypes.includes(code as BetType)
                  const hasHint = !!betTypeHints[code]
                  const isHintShowing = showHint === code
                  const conflictTarget = conflictWith[code]
                  const isConflicted = conflictTarget ? selectedBetTypes.includes(conflictTarget as BetType) : false

                  return (
                    <div key={code} style={{ position: 'relative' }}>
                      {/* Chip wrapper */}
                      <div style={{
                        display: 'flex', alignItems: 'stretch',
                        borderRadius: 10, overflow: 'hidden',
                        border: isSelected
                          ? '1.5px solid var(--accent-color)'
                          : '1.5px solid var(--ios-separator)',
                        background: isSelected
                          ? 'color-mix(in srgb, var(--accent-color) 12%, transparent)'
                          : 'var(--ios-card)',
                        opacity: isConflicted ? 0.45 : 1,
                        transition: 'all 0.15s',
                      }}>
                        <button
                          onClick={() => toggleBetType(code as BetType)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            flex: 1, minWidth: 0,
                            padding: '8px 10px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                          }}
                        >
                          {/* Checkmark */}
                          <span style={{
                            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isSelected ? 'var(--accent-color)' : 'transparent',
                            border: isSelected ? '1.5px solid var(--accent-color)' : '1.5px solid var(--ios-tertiary-label)',
                            transition: 'all 0.15s',
                          }}>
                            {isSelected && <Check size={12} color="var(--nav-bg)" strokeWidth={3} />}
                          </span>

                          {/* Label + Rate */}
                          <div style={{
                            flex: 1, minWidth: 0, textAlign: 'left',
                            display: 'flex', flexDirection: 'column', gap: 1,
                          }}>
                            <span style={{
                              fontSize: 13, fontWeight: 600, lineHeight: '16px',
                              color: isSelected ? 'var(--accent-color)' : 'var(--ios-label)',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {betTypeLabels[code] || bt.name}
                            </span>
                            <span style={{
                              fontSize: 11, fontWeight: 700, lineHeight: '14px',
                              color: isSelected ? 'var(--accent-color)' : 'var(--ios-secondary-label)',
                            }}>
                              x{bt.rate.toLocaleString()}
                            </span>
                          </div>
                        </button>

                        {/* Info button */}
                        {hasHint && (
                          <button
                            onClick={() => setShowHint(isHintShowing ? null : code)}
                            style={{
                              width: 32, flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: 'none',
                              background: isHintShowing ? 'var(--accent-color)' : 'transparent',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            {isHintShowing
                              ? <X size={11} color="var(--nav-bg)" strokeWidth={3} />
                              : <Info size={11} color="var(--ios-secondary-label)" strokeWidth={2.5} />
                            }
                          </button>
                        )}
                      </div>

                      {/* Tooltip */}
                      {isHintShowing && betTypeHints[code] && (
                        <div style={{
                          marginTop: 4, zIndex: 10,
                          padding: '8px 10px', borderRadius: 8,
                          background: 'var(--nav-bg)',
                          border: '1px solid var(--accent-color)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        }}>
                          <p style={{
                            fontSize: 11, lineHeight: 1.5, margin: 0,
                            color: 'rgba(255,255,255,0.85)',
                          }}>
                            {betTypeHints[code]}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
