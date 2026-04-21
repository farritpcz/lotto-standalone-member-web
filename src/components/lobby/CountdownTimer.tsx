// แสดง countdown เวลาที่เหลือก่อนปิดรับ เช่น "2 วัน 05:30:12"
// Parent: src/components/lobby/LotteryCard.tsx

'use client'

import { useEffect, useState } from 'react'
import { Timer } from 'lucide-react'

export default function CountdownTimer({ closeTime }: { closeTime: string }) {
  // ใช้ lazy initializer → ไม่เรียก Date.now() ตรงๆ ใน render (react-hooks/purity)
  const [now, setNow] = useState<number>(() => Date.now())

  // อัพเดททุก 1 วินาที
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const diff = new Date(closeTime).getTime() - now
  if (diff <= 0) return null // หมดเวลาแล้ว

  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  const pad = (n: number) => String(n).padStart(2, '0')

  // format: "2 วัน 05:30:12" หรือ "05:30:12" ถ้าไม่ถึงวัน
  const timeStr = days > 0
    ? `${days} วัน ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`

  return (
    <div style={{
      marginTop: 6, padding: '4px 6px', borderRadius: 8,
      background: 'color-mix(in srgb, var(--header-bg) 10%, transparent)',
      border: '1px solid color-mix(in srgb, var(--header-bg) 15%, transparent)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
      fontSize: 9, fontWeight: 600, color: 'var(--ios-secondary-label)',
    }}>
      <Timer size={9} strokeWidth={2.5} />
      {timeStr}
    </div>
  )
}
