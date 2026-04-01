/**
 * หน้าตรวจผลรางวัล
 *
 * แสดงผลรางวัลล่าสุด filter ตามประเภทหวย + pagination
 * เรียก API: resultApi.getResults() → standalone-member-api (#3)
 */

'use client'

import { useEffect, useState } from 'react'
import { resultApi, lotteryApi } from '@/lib/api'
import type { LotteryRound, LotteryTypeInfo } from '@/types'

export default function ResultsPage() {
  const [results, setResults] = useState<LotteryRound[]>([])
  const [lotteryTypes, setLotteryTypes] = useState<LotteryTypeInfo[]>([])
  const [selectedType, setSelectedType] = useState<number | undefined>()
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    lotteryApi.getTypes().then(res => setLotteryTypes(res.data.data || []))
  }, [])

  useEffect(() => {
    setLoading(true)
    resultApi.getResults({ lottery_type_id: selectedType, page, per_page: 20 })
      .then(res => {
        setResults(res.data.data?.items || [])
        setTotal(res.data.data?.total || 0)
      })
      .finally(() => setLoading(false))
  }, [selectedType, page])

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-4">ตรวจผลรางวัล</h1>

      {/* Filter ประเภทหวย */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => { setSelectedType(undefined); setPage(1) }}
          className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${!selectedType ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}
        >
          ทั้งหมด
        </button>
        {lotteryTypes.map(lt => (
          <button
            key={lt.id}
            onClick={() => { setSelectedType(lt.id); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${selectedType === lt.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}
          >
            {lt.icon} {lt.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-10">กำลังโหลด...</div>
      ) : results.length === 0 ? (
        <div className="text-center text-gray-500 py-10">ยังไม่มีผลรางวัล</div>
      ) : (
        <div className="space-y-3">
          {results.map(round => (
            <div key={round.id} className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-white font-semibold">{round.lottery_type?.name}</span>
                  <span className="text-gray-500 text-sm ml-2">รอบ {round.round_number}</span>
                </div>
                <span className="text-gray-400 text-xs">{new Date(round.round_date).toLocaleDateString('th-TH')}</span>
              </div>
              {/* ผลรางวัล */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <div className="text-gray-400 text-xs">3 ตัวบน</div>
                  <div className="text-2xl font-bold text-yellow-400 font-mono">{round.result_top3 || '-'}</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <div className="text-gray-400 text-xs">2 ตัวบน</div>
                  <div className="text-2xl font-bold text-green-400 font-mono">{round.result_top2 || '-'}</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <div className="text-gray-400 text-xs">2 ตัวล่าง</div>
                  <div className="text-2xl font-bold text-blue-400 font-mono">{round.result_bottom2 || '-'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg disabled:opacity-50">ก่อนหน้า</button>
          <span className="px-4 py-2 text-gray-400">หน้า {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={results.length < 20}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg disabled:opacity-50">ถัดไป</button>
        </div>
      )}
    </div>
  )
}
