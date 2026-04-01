/**
 * หน้า Referral/Affiliate — แนะนำเพื่อน (แบบเจริญดี88)
 *
 * Features:
 * - ลิงก์เชิญเพื่อน (copy + share)
 * - แชร์ผ่าน social media
 * - ค่าคอมมิชชั่น
 * - ถอนรายได้จากการแนะนำ
 * - ภาพรวมสถิติ
 *
 * Mock data — รอ Referral API (Phase 6)
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth-store'

export default function ReferralPage() {
  const { member } = useAuthStore()
  const [copied, setCopied] = useState(false)

  const referralCode = `REF${member?.id || '001'}`
  const referralLink = `https://lotto.com/register?ref=${referralCode}`

  // Mock stats
  const stats = {
    totalReferred: 12,
    activeReferred: 8,
    totalCommission: 3250,
    pendingCommission: 850,
    commissionRate: 5,
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <Link href="/dashboard" className="text-muted">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold">แนะนำเพื่อน</h1>
      </div>

      {/* Commission Rate Card */}
      <div className="px-4 mb-3">
        <div className="balance-card text-center">
          <p className="text-white/60 text-xs">ค่าคอมมิชชั่น</p>
          <p className="text-4xl font-bold text-white mt-1">{stats.commissionRate}%</p>
          <p className="text-white/50 text-xs mt-1">ทุกยอดเดิมพันของเพื่อนที่แนะนำ</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 mb-3 grid grid-cols-2 gap-2">
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{stats.totalReferred}</div>
          <div className="text-muted text-xs">เพื่อนทั้งหมด</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.activeReferred}</div>
          <div className="text-muted text-xs">เพื่อนที่ Active</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--color-gold)' }}>฿{stats.totalCommission.toLocaleString()}</div>
          <div className="text-muted text-xs">รายได้ทั้งหมด</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold text-amber-500">฿{stats.pendingCommission.toLocaleString()}</div>
          <div className="text-muted text-xs">รอถอน</div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="px-4 mb-3">
        <div className="card p-4">
          <h3 className="font-bold text-sm mb-2">ลิงก์เชิญเพื่อน</h3>
          <div className="flex gap-2">
            <div className="flex-1 rounded-lg px-3 py-2.5 text-xs font-mono truncate"
              style={{ background: 'var(--color-bg-card-alt)' }}>
              {referralLink}
            </div>
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-lg text-xs font-bold text-white flex-shrink-0"
              style={{ background: copied ? 'var(--color-green)' : 'var(--color-primary)' }}
            >
              {copied ? '✓ คัดลอก!' : 'คัดลอก'}
            </button>
          </div>

          <p className="text-muted text-xs mt-2">รหัสแนะนำ: <span className="font-bold">{referralCode}</span></p>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="px-4 mb-3">
        <div className="card p-4">
          <h3 className="font-bold text-sm mb-3">แชร์ผ่านช่องทาง</h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { name: 'LINE', color: '#00B900', icon: '💬' },
              { name: 'Facebook', color: '#1877F2', icon: '📘' },
              { name: 'Twitter', color: '#1DA1F2', icon: '🐦' },
              { name: 'คัดลอก', color: '#6B7280', icon: '📋' },
            ].map(btn => (
              <button
                key={btn.name}
                onClick={handleCopy}
                className="flex flex-col items-center gap-1 p-3 rounded-xl text-white text-xs font-semibold transition active:scale-95"
                style={{ background: btn.color }}
              >
                <span className="text-lg">{btn.icon}</span>
                {btn.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Withdraw Commission */}
      <div className="px-4 pb-4">
        <button className="btn-gold w-full py-3.5 rounded-xl text-sm">
          ถอนรายได้ ฿{stats.pendingCommission.toLocaleString()}
        </button>
      </div>
    </div>
  )
}
