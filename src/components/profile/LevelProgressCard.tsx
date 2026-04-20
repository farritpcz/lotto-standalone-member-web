// Component: LevelProgressCard — ระดับสมาชิก + progress bar + rolling 30d explanation
// Parent: src/app/(member)/profile/page.tsx
//
// แสดง:
//   - Badge ระดับปัจจุบัน (หรือ "ยังไม่ถูกจัดระดับ" + next tier)
//   - Progress bar ไปยังระดับถัดไป (0-100%)
//   - ยอดฝาก 30 วันล่าสุด (สด — cache จาก cron)
//   - ยอดที่ต้องฝากเพิ่มเพื่อขึ้นระดับถัดไป
//   - คำอธิบาย rolling 30d (สำคัญ — user ต้องเข้าใจว่าตกได้)
//   - 🔒 ถ้า level ถูก admin lock

import type { MemberLevelInfo } from '@/lib/api'

export function LevelProgressCard({ info }: { info: MemberLevelInfo }) {
  const cur = info.current_level
  const nxt = info.next_level
  const accent = cur?.color || '#6b7280'

  return (
    <div
      style={{
        background: 'var(--bg-elevated, #1a1a1a)',
        borderRadius: 16,
        padding: 16,
        border: `1px solid color-mix(in srgb, ${accent} 20%, transparent)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* subtle bg gradient จากสี accent ของระดับปัจจุบัน */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 8%, transparent), transparent 60%)`,
        }}
      />

      <div style={{ position: 'relative' }}>
        {/* Header — ชื่อระดับ + ยอดฝาก 30d */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary, #888)', fontWeight: 600, letterSpacing: 0.3, marginBottom: 2 }}>
              ระดับสมาชิก {info.locked && <span title="ถูกแอดมินล็อกไว้">🔒</span>}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: accent, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              {cur?.name || 'ยังไม่ถูกจัดระดับ'}
            </div>
            {cur?.description && (
              <div style={{ fontSize: 11, color: 'var(--text-tertiary, #666)', marginTop: 2 }}>
                {cur.description}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text-secondary, #888)', fontWeight: 500 }}>
              ยอดฝาก 30 วันล่าสุด
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--text-primary)' }}>
              ฿{info.deposit_30d.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Progress bar ไป next level */}
        {nxt ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 11, marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary, #888)' }}>
                ความคืบหน้าไป <strong style={{ color: nxt.color }}>{nxt.name}</strong>
              </span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {info.progress_pct}%
              </span>
            </div>

            {/* bar */}
            <div style={{
              height: 10, borderRadius: 5, overflow: 'hidden',
              background: 'var(--bg-secondary, rgba(255,255,255,0.05))',
              marginBottom: 8,
            }}>
              <div
                style={{
                  width: `${info.progress_pct}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${accent}, ${nxt.color})`,
                  borderRadius: 5,
                  transition: 'width 600ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </div>

            {/* ยังขาดอีกเท่าไหร่ */}
            <div style={{ fontSize: 11, color: 'var(--text-secondary, #888)', marginBottom: 12 }}>
              ฝากเพิ่มอีก <strong style={{ color: nxt.color, fontFamily: 'var(--font-geist-mono), monospace' }}>
                ฿{info.amount_to_next.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </strong> ภายใน 30 วัน เพื่อขึ้นระดับ {nxt.name}
            </div>
          </>
        ) : cur ? (
          <div style={{
            padding: '10px 12px', marginBottom: 10,
            background: `color-mix(in srgb, ${accent} 10%, transparent)`,
            borderRadius: 10,
            fontSize: 12, color: accent, fontWeight: 600,
            textAlign: 'center',
          }}>
            ✨ คุณอยู่ที่ระดับสูงสุดแล้ว
          </div>
        ) : null}

        {/* คำอธิบาย rolling 30d — สำคัญมาก! user ต้องรู้ว่าตกได้ */}
        <div style={{
          fontSize: 10, color: 'var(--text-tertiary, #666)',
          lineHeight: 1.6,
          padding: '8px 10px',
          background: 'color-mix(in srgb, currentColor 4%, transparent)',
          borderRadius: 8,
          borderLeft: '2px solid var(--text-tertiary, #666)',
        }}>
          <div style={{ fontWeight: 700, color: 'var(--text-secondary, #888)', marginBottom: 2 }}>
            ℹ️ วิธีคำนวณระดับ
          </div>
          ระดับสมาชิกคำนวณจาก<strong>ยอดฝากสะสมย้อนหลัง 30 วันล่าสุด</strong> (ไม่ใช่ยอดตลอดชีพ) —
          ระบบตรวจสอบและอัปเดตทุกวัน เวลา 02:00 น.
          หากช่วง 30 วันที่ผ่านมาคุณฝากน้อยลงต่ำกว่าเกณฑ์ <strong>ระดับอาจถูกปรับลงได้</strong>
          {info.locked && (
            <>
              <br /><span style={{ color: 'var(--accent-color)' }}>
                🔒 หมายเหตุ: ระดับของคุณถูกตั้งโดยแอดมิน — จะไม่เปลี่ยนตามระบบอัตโนมัติ
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
