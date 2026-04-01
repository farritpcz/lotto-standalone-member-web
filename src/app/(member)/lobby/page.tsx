/**
 * หน้า Lobby — เลือกประเภทหวย
 *
 * แสดงหวยทุกประเภทที่เปิดอยู่ + จำนวนรอบที่เปิดรับ
 * กดเลือก → ไปหน้าแทงหวย /lottery/[type]
 *
 * ความสัมพันธ์:
 * - เรียก API: lotteryApi.getTypes() → standalone-member-api (#3)
 * - provider-game-web (#8) มีหน้า lobby เหมือนกัน (share component ได้)
 *   TODO: แยก LobbyCard component เป็น @lotto/game-ui
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { lotteryApi } from '@/lib/api'
import type { LotteryTypeInfo } from '@/types'

// Icon mapping สำหรับแต่ละประเภทหวย
const lotteryIcons: Record<string, string> = {
  THAI: '🇹🇭',
  LAO: '🇱🇦',
  STOCK_TH: '📈',
  STOCK_FOREIGN: '🌍',
  YEEKEE: '🎯',
  CUSTOM: '🎲',
}

export default function LobbyPage() {
  const [lotteries, setLotteries] = useState<LotteryTypeInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLotteries = async () => {
      try {
        const res = await lotteryApi.getTypes()
        setLotteries(res.data.data)
      } catch (err) {
        console.error('Failed to fetch lottery types:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLotteries()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-400">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-6">เลือกประเภทหวย</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {lotteries.map((lottery) => (
          <Link
            key={lottery.id}
            href={`/lottery/${lottery.code}`}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500 rounded-xl p-5 transition group"
          >
            {/* Icon */}
            <div className="text-4xl mb-3">
              {lotteryIcons[lottery.code] || '🎲'}
            </div>

            {/* ชื่อ */}
            <h2 className="text-white font-semibold group-hover:text-blue-400 transition">
              {lottery.name}
            </h2>

            {/* คำอธิบาย */}
            <p className="text-gray-400 text-sm mt-1">
              {lottery.description}
            </p>

            {/* Badge ถ้าเป็นยี่กี */}
            {lottery.code === 'YEEKEE' && (
              <span className="inline-block bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full mt-2">
                Real-time
              </span>
            )}
          </Link>
        ))}
      </div>

      {lotteries.length === 0 && (
        <div className="text-center text-gray-500 mt-10">
          ยังไม่มีหวยเปิดให้เล่น
        </div>
      )}
    </div>
  )
}
