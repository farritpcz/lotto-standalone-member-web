/**
 * PullToRefresh — ดึงลงจากด้านบนเพื่อรีเฟรช (touch devices)
 *
 * ใช้งาน:
 *   <PullToRefresh onRefresh={async () => { await loadData() }}>
 *     {children}
 *   </PullToRefresh>
 *
 * Features:
 *   - 60px threshold เพื่อ trigger refresh
 *   - Rubber-band effect ขณะดึง
 *   - Teal spinner ขณะ refreshing
 *   - Touch events เท่านั้น (mobile)
 */

'use client'

import { useCallback, useRef, useState } from 'react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}

const THRESHOLD = 60
/** อัตราหน่วงแบบ rubber-band (ยิ่งดึงมากยิ่งหน่วง) */
const DAMPING = 0.4

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const pulling = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // ---- Touch handlers ----
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // เริ่มดึงได้ก็ต่อเมื่อ scroll อยู่บนสุด
    if (refreshing) return
    const el = containerRef.current
    if (el && el.scrollTop <= 0) {
      startY.current = e.touches[0].clientY
      pulling.current = true
    }
  }, [refreshing])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshing) return
    const dy = e.touches[0].clientY - startY.current
    if (dy > 0) {
      // Rubber-band: ระยะที่แสดงจะน้อยกว่าระยะที่ดึงจริง
      setPullDistance(dy * DAMPING)
    }
  }, [refreshing])

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return
    pulling.current = false

    if (pullDistance >= THRESHOLD && !refreshing) {
      // ค้าง spinner ไว้ที่ threshold แล้ว refresh
      setPullDistance(THRESHOLD)
      setRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }, [pullDistance, refreshing, onRefresh])

  /** Progress 0-1 ก่อน threshold */
  const progress = Math.min(pullDistance / THRESHOLD, 1)

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{ position: 'relative', overflow: 'auto', height: '100%' }}
    >
      {/* ---- Spinner indicator ---- */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: pullDistance,
          overflow: 'hidden',
          transition: pulling.current ? 'none' : 'height 0.3s cubic-bezier(.4,0,.2,1)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          style={{
            opacity: progress,
            transform: `rotate(${refreshing ? 0 : progress * 270}deg)`,
            animation: refreshing ? 'ptr-spin 0.7s linear infinite' : 'none',
            transition: refreshing ? 'none' : 'transform 0.1s',
          }}
        >
          <circle
            cx="14"
            cy="14"
            r="10"
            fill="none"
            stroke="#2dd4bf"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={refreshing ? '45 18' : `${progress * 50} ${63 - progress * 50}`}
          />
        </svg>
      </div>

      {/* ---- Content area ---- */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pulling.current ? 'none' : 'transform 0.3s cubic-bezier(.4,0,.2,1)',
        }}
      >
        {children}
      </div>

      {/* ---- Keyframes (injected once) ---- */}
      <style>{`
        @keyframes ptr-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
