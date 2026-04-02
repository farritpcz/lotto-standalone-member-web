/**
 * SwipeBack — ปัดจากขอบซ้ายเพื่อย้อนกลับ (เหมือน iOS)
 *
 * ใช้งาน:
 *   <SwipeBack>{children}</SwipeBack>
 *
 * Features:
 *   - Swipe จากขอบซ้าย (0-20px) เท่านั้น
 *   - หน้าเลื่อนไปทางขวาพร้อมเงา
 *   - Threshold: 100px → trigger router.back()
 *   - Touch events เท่านั้น (mobile)
 */

'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface SwipeBackProps {
  children: React.ReactNode
  /** ขอบเขต trigger zone ด้านซ้าย (px) — default 20 */
  edgeWidth?: number
  /** ระยะปัดขั้นต่ำเพื่อ trigger back (px) — default 100 */
  threshold?: number
}

export default function SwipeBack({
  children,
  edgeWidth = 20,
  threshold = 100,
}: SwipeBackProps) {
  const router = useRouter()
  const [swipeX, setSwipeX] = useState(0)
  const startX = useRef(0)
  const swiping = useRef(false)
  const triggered = useRef(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const x = e.touches[0].clientX
    // เริ่มได้เมื่อแตะภายใน edge zone ด้านซ้ายเท่านั้น
    if (x <= edgeWidth) {
      startX.current = x
      swiping.current = true
      triggered.current = false
    }
  }, [edgeWidth])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping.current) return
    const dx = e.touches[0].clientX - startX.current
    if (dx > 0) {
      setSwipeX(dx)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!swiping.current) return
    swiping.current = false

    if (swipeX >= threshold && !triggered.current) {
      triggered.current = true
      // Animate out แล้ว navigate back
      setSwipeX(window.innerWidth)
      setTimeout(() => {
        router.back()
        setSwipeX(0)
      }, 250)
    } else {
      setSwipeX(0)
    }
  }, [swipeX, threshold, router])

  /** ความทึบของ overlay เงาด้านซ้าย (0-0.3) */
  const shadowOpacity = Math.min(swipeX / 300, 0.3)

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{ position: 'relative', overflow: 'hidden', height: '100%' }}
    >
      {/* ---- Shadow overlay ---- */}
      {swipeX > 0 && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to right, rgba(0,0,0,${shadowOpacity}) 0%, transparent 60%)`,
            zIndex: 9999,
            pointerEvents: 'none',
            transition: swiping.current ? 'none' : 'opacity 0.25s',
          }}
        />
      )}

      {/* ---- Page content (slides right) ---- */}
      <div
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swiping.current ? 'none' : 'transform 0.25s cubic-bezier(.4,0,.2,1)',
          height: '100%',
        }}
      >
        {children}
      </div>
    </div>
  )
}
