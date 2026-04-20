/**
 * หน้า Dashboard สมาชิก — iOS 17 HIG Design
 *
 * Rule: page-level (data fetching + layout) — render แบ่งไป components/dashboard/*
 * Related:
 *  - components/dashboard/BalanceCard.tsx
 *  - components/dashboard/MenuGrid.tsx
 *  - components/dashboard/FeaturedLotteries.tsx
 *  - components/dashboard/LatestResults.tsx
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import BannerCarousel from '@/components/BannerCarousel'
import BalanceCard from '@/components/dashboard/BalanceCard'
import MenuGrid from '@/components/dashboard/MenuGrid'
import FeaturedLotteries from '@/components/dashboard/FeaturedLotteries'
import LatestResults from '@/components/dashboard/LatestResults'
import { useAuthStore } from '@/store/auth-store'
import { api, lotteryApi, resultApi, walletApi } from '@/lib/api'
import type { LotteryTypeInfo, LotteryRound } from '@/types'

/* ─── Fallback banners — ใช้เมื่อยังไม่มี banner จาก API ─── */
const FALLBACK_BANNERS = [
  { image_url: '/images/banners/banner-default.png' },
  { image_url: '/images/banners/banner-default.png' },
  { image_url: '/images/banners/banner-default.png' },
]

// ⭐ Default ticker — ดึงจาก agent config ถ้ามี (TODO: wire up)
const defaultTicker =
  '🎉 ยินดีต้อนรับสู่ LOTTO · จ่ายจริง ถอนได้จริง · สมัครวันนี้รับโบนัส 100% · หวยรัฐบาลจ่ายบาทละ 900'

export default function DashboardPage() {
  const { member, updateBalance } = useAuthStore()
  const [lotteries, setLotteries] = useState<LotteryTypeInfo[]>([])
  const [latestResults, setLatestResults] = useState<LotteryRound[]>([])
  const [banners, setBanners] = useState(FALLBACK_BANNERS)
  const [refreshing, setRefreshing] = useState(false)

  // ดึงยอดเงินล่าสุดจาก API
  const refreshBalance = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await walletApi.getBalance()
      updateBalance(res.data.data?.balance || 0)
    } catch {
      /* ignore */
    }
    setTimeout(() => setRefreshing(false), 500) // animation delay
  }, [updateBalance])

  useEffect(() => {
    lotteryApi
      .getTypes()
      .then(res => setLotteries(res.data.data || []))
      .catch(() => {})

    resultApi
      .getResults({ per_page: 3 })
      .then(res => setLatestResults(res.data.data?.items || []))
      .catch(() => {})

    api
      .get('/agent/banners')
      .then(res => {
        const data = res.data.data || []
        if (data.length > 0) setBanners(data)
      })
      .catch(() => {})
  }, [])

  return (
    <div
      style={{
        fontFamily: 'var(--font-sarabun), -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* ===== 1. Ticker Bar ===== */}
      <div className="ticker-bar">
        <div className="ticker-content px-4">{defaultTicker}</div>
      </div>

      {/* ===== 2. Banner Slider ===== */}
      <div style={{ padding: '12px 16px 0' }}>
        <BannerCarousel banners={banners} aspectRatio="16/5" interval={5000} />
      </div>

      {/* ===== 3. Balance Card ===== */}
      <BalanceCard
        username={member?.username}
        balance={member?.balance}
        refreshing={refreshing}
        onRefresh={refreshBalance}
      />

      {/* ===== 4. Menu Grid ===== */}
      <MenuGrid />

      {/* ===== 5. หวยแนะนำ ===== */}
      <FeaturedLotteries lotteries={lotteries} />

      {/* ===== 6. ผลรางวัลล่าสุด ===== */}
      <LatestResults rounds={latestResults} />
    </div>
  )
}
