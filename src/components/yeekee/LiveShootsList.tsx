/**
 * LiveShootsList — แสดงเลขที่ยิงมา real-time (ล่าสุดบนสุด)
 * ใช้ maskBotUsername ซ่อนชื่อผู้ใช้เป็นเบอร์โทร mask
 */
import { maskBotUsername, type ShootItem } from '@/app/(member)/yeekee/play/_config'

export default function LiveShootsList({ shoots }: { shoots: ShootItem[] }) {
  return (
    <div className="px-4 pb-24">
      <div className="section-title px-0">
        <span>เลขที่ยิงมา ({shoots.length})</span>
      </div>
      <div className="card p-2 max-h-48 overflow-y-auto">
        {shoots.length === 0 ? (
          <div className="text-muted text-center py-6 text-sm">ยังไม่มีคนยิง</div>
        ) : shoots.map((s, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-3 py-2 rounded-lg mb-1"
            style={{ background: 'var(--color-bg-card-alt)' }}
          >
            <span className="text-sm text-secondary">{maskBotUsername(s.member_username)}</span>
            <span className="font-mono font-bold" style={{ color: 'var(--color-primary)' }}>{s.number}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
