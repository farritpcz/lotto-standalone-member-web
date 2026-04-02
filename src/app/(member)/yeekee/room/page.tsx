/**
 * หน้าเลือกรอบยี่กี — แสดง card แบบเจริญดี88
 *
 * แต่ละรอบแสดง:
 * - ไอคอน + ชื่อ "หวยจับยี่กี รอบที่ XX"
 * - ปิดรับ: วันที่ + เวลา
 * - countdown (วัน:ชม:นาที:วินาที)
 * - พื้นหลังสี (หรือรูปจากหลังบ้าน — ถ้ามี)
 *
 * API: yeekeeApi.getRounds() → standalone-member-api (#3)
 * กดเลือกรอบ → ไป /yeekee/play?round=ID
 *
 * ⭐ พื้นหลัง card: default = gradient สี teal/green
 * ถ้า admin ตั้งรูปจากหลังบ้าน (lottery_types.icon) → แสดงรูปแทน
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { yeekeeApi } from '@/lib/api'
import type { YeekeeRound } from '@/types'

// ป้ายสถานะ
const statusLabels: Record<string, string> = {
  waiting: 'รอเริ่ม',
  shooting: 'กำลังยิง',
  calculating: 'กำลังคำนวณ',
  resulted: 'ออกผลแล้ว',
}

// สีสถานะ
const statusColors: Record<string, string> = {
  waiting: '#8E8E93',
  shooting: '#34C759',
  calculating: '#FF9F0A',
  resulted: '#007AFF',
}

// =============================================================================
// Countdown Hook — นับถอยหลังทุกวินาที
// =============================================================================
function useCountdown(targetTime: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 })

  useEffect(() => {
    const calc = () => {
      const now = Date.now()
      const target = new Date(targetTime).getTime()
      const diff = Math.max(0, target - now)
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        total: diff,
      })
    }
    calc()
    const timer = setInterval(calc, 1000)
    return () => clearInterval(timer)
  }, [targetTime])

  return timeLeft
}

// =============================================================================
// Card Component — แต่ละรอบยี่กี
// =============================================================================
function YeekeeRoundCard({ round }: { round: YeekeeRound }) {
  const countdown = useCountdown(round.end_time)
  const isShooting = round.status === 'shooting'
  const isWaiting = round.status === 'waiting'
  const isActive = isShooting || isWaiting

  // Format วันที่ปิดรับ
  const closeDate = new Date(round.end_time)
  const closeDateStr = closeDate.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const closeTimeStr = closeDate.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Countdown text
  const pad = (n: number) => String(n).padStart(2, '0')
  const countdownStr = `${countdown.days} วัน ${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)}`

  // ลิงก์ — ถ้ากำลังยิง → ไปเล่น, ถ้ารอเริ่ม → ไม่ได้กด
  const href = isShooting ? `/yeekee/play?round=${round.id}` : '#'

  return (
    <Link
      href={href}
      className="block rounded-2xl overflow-hidden shadow-lg transition-transform active:scale-[0.97]"
      style={{
        pointerEvents: isActive ? 'auto' : 'none',
        opacity: isActive ? 1 : 0.5,
      }}
    >
      {/* ⭐ พื้นหลัง — default gradient สี teal/green
          ถ้า admin อัพรูปจากหลังบ้าน → จะใช้ background-image แทน */}
      <div
        className="relative p-3"
        style={{
          background: 'linear-gradient(135deg, #0d6e6e 0%, #14956e 50%, #1a472a 100%)',
          minHeight: '120px',
        }}
      >
        {/* ลายตัวเลข background (decorative) */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ctext x='3' y='20' font-size='14' fill='white' font-family='monospace'%3E8%3C/text%3E%3Ctext x='20' y='10' font-size='12' fill='white' font-family='monospace'%3E3%3C/text%3E%3Ctext x='25' y='32' font-size='13' fill='white' font-family='monospace'%3E7%3C/text%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Badge สถานะ — มุมขวาบน */}
        {isShooting && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
              style={{ backgroundColor: 'rgba(52, 199, 89, 0.9)' }}>
              <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
              LIVE
            </span>
          </div>
        )}

        {/* ไอคอน + ชื่อ */}
        <div className="relative z-10">
          {/* ไอคอนยี่กี (วงกลมสีเข้ม + ตัวอักษร) */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center mb-2"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <span className="text-white text-xs font-bold">ยี่กี</span>
          </div>

          <div className="text-white">
            <div className="font-bold text-sm leading-tight">
              หวยจับยี่กี รอบที่ {round.round_no}
            </div>
            <div className="text-[11px] opacity-90 mt-1">
              ปิดรับ : {closeDateStr}
            </div>
            <div className="text-[11px] opacity-90">
              {closeTimeStr}
            </div>
          </div>
        </div>

        {/* ผลยี่กี (ถ้าออกแล้ว) */}
        {round.result_number && (
          <div className="relative z-10 mt-2 bg-white/20 rounded-lg px-2 py-1.5 text-center">
            <div className="text-white text-[10px] opacity-80">ผลออก</div>
            <div className="text-white text-lg font-mono font-bold tracking-wider">
              {round.result_number}
            </div>
          </div>
        )}
      </div>

      {/* Countdown bar — ด้านล่าง */}
      <div className="bg-white px-2 py-2 flex items-center justify-center gap-1.5"
        style={{ borderTop: '1px solid #E5E5EA' }}>
        {/* ไอคอนนาฬิกา */}
        <div className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: countdown.total > 0 ? '#E8F5E9' : '#FFF3E0' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={countdown.total > 0 ? '#34C759' : '#FF9F0A'}
            strokeWidth={2} className="w-3 h-3">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <span className="text-xs font-semibold"
          style={{ color: countdown.total > 0 ? '#34C759' : '#FF9F0A' }}>
          {countdown.total > 0 ? countdownStr : 'หมดเวลา'}
        </span>
      </div>
    </Link>
  )
}

// =============================================================================
// Main Page
// =============================================================================
export default function YeekeeRoomPage() {
  const [rounds, setRounds] = useState<YeekeeRound[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    yeekeeApi.getRounds()
      .then(res => setRounds(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    // auto-refresh ทุก 10 วินาที (ดึงรอบใหม่)
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [load])

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-44 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <Link href="/lobby" className="text-muted">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold">ยี่กี — เลือกรอบ</h1>
      </div>

      {rounds.length === 0 ? (
        <div className="px-4">
          <div className="card p-8 text-center">
            <p className="text-3xl mb-2">🎯</p>
            <p className="text-muted text-sm">ยังไม่มีรอบยี่กี</p>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-24 grid grid-cols-2 gap-3">
          {rounds.map(round => (
            <YeekeeRoundCard key={round.id} round={round} />
          ))}
        </div>
      )}
    </div>
  )
}
