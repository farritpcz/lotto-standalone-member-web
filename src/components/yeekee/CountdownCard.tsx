/**
 * CountdownCard — เวลาที่เหลือของรอบ + ผลรวมเลขที่ยิง
 * แดงเมื่อเหลือ ≤ 30 วินาที (warning)
 */
export default function CountdownCard({ countdown, totalSum }: { countdown: number; totalSum: number }) {
  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60
  return (
    <div className="px-4 mb-3">
      <div className="card p-3 text-center">
        <div className="text-muted text-xs mb-1">เวลาที่เหลือ</div>
        <div
          className={`text-3xl font-bold font-mono ${countdown <= 30 ? 'text-red-500' : ''}`}
          style={{ color: countdown > 30 ? 'var(--color-primary)' : undefined }}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        <div className="text-muted text-xs mt-1">ผลรวมเลข: {totalSum.toLocaleString()}</div>
      </div>
    </div>
  )
}
