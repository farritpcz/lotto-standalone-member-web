/**
 * ResultCard — แสดงผลยี่กีเมื่อรอบออกผลแล้ว (3-top, 2-top, 2-bottom)
 */
import type { ResultInfo } from '@/app/(member)/yeekee/play/_config'

export default function ResultCard({ result }: { result: ResultInfo }) {
  return (
    <div className="px-4 mb-3">
      <div className="card p-5 text-center border-2 border-amber-300">
        <div className="text-sm font-bold mb-2" style={{ color: 'var(--color-gold)' }}>ผลยี่กี</div>
        <div className="text-4xl font-bold font-mono mb-3">{result.result_number}</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-amber-50 rounded-lg p-2">
            <div className="text-muted text-[10px]">3 ตัวบน</div>
            <div className="text-lg font-bold font-mono text-amber-600">{result.top3}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-2">
            <div className="text-muted text-[10px]">2 ตัวบน</div>
            <div className="text-lg font-bold font-mono text-green-600">{result.top2}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-2">
            <div className="text-muted text-[10px]">2 ตัวล่าง</div>
            <div className="text-lg font-bold font-mono text-blue-600">{result.bottom2}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
