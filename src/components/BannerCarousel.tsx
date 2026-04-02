/**
 * BannerCarousel — Auto-slide banner with touch swipe support
 *
 * Features:
 * - Auto-slide ทุก 4 วินาที
 * - Swipe ซ้าย/ขวาด้วย touch events
 * - Smooth CSS transition (transform translateX)
 * - Infinite loop (last → first seamlessly)
 * - Pause auto-slide ขณะ touch
 * - Dots indicator (active = teal, others = gray/50%)
 *
 * ใช้โดย: dashboard/page.tsx
 * Props: banners = [{image_url, link_url}]
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'

interface Banner {
  image_url: string
  link_url?: string
}

interface BannerCarouselProps {
  banners: Banner[]
  /** Auto-slide interval in ms (default: 4000) */
  interval?: number
  /** Banner height in px (default: 120) */
  height?: number
}

export default function BannerCarousel({ banners, interval = 4000, height = 120 }: BannerCarouselProps) {
  const total = banners.length
  // ถ้าไม่มี banner ไม่ render
  if (total === 0) return null

  // ===== Infinite loop: clone first & last =====
  // [cloneLast, ...originals, cloneFirst]
  // index 0 = clone of last, index 1..total = originals, index total+1 = clone of first
  const slides = [banners[total - 1], ...banners, banners[0]]
  const totalSlides = slides.length

  const [currentIndex, setCurrentIndex] = useState(1) // start at first real slide
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  const trackRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ===== Auto-slide =====
  const startAutoSlide = useCallback(() => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current)
    autoSlideRef.current = setInterval(() => {
      setIsTransitioning(true)
      setCurrentIndex(prev => prev + 1)
    }, interval)
  }, [interval])

  const stopAutoSlide = useCallback(() => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current)
      autoSlideRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isPaused && total > 1) {
      startAutoSlide()
    }
    return () => stopAutoSlide()
  }, [isPaused, total, startAutoSlide, stopAutoSlide])

  // ===== Infinite loop: jump without transition when reaching clone =====
  useEffect(() => {
    if (!isTransitioning) return
    const handler = () => {
      // ถ้าไปถึง clone ของ first (index = total+1) → jump กลับไป index 1
      if (currentIndex >= total + 1) {
        setIsTransitioning(false)
        setCurrentIndex(1)
      }
      // ถ้าไปถึง clone ของ last (index = 0) → jump ไป index = total
      if (currentIndex <= 0) {
        setIsTransitioning(false)
        setCurrentIndex(total)
      }
    }
    const timer = setTimeout(handler, 350) // match transition duration
    return () => clearTimeout(timer)
  }, [currentIndex, isTransitioning, total])

  // Re-enable transition after jump
  useEffect(() => {
    if (!isTransitioning) {
      // requestAnimationFrame เพื่อให้ browser paint ก่อน
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true)
        })
      })
    }
  }, [isTransitioning])

  // ===== Touch handlers =====
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    setIsPaused(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current
    const threshold = 50 // minimum swipe distance

    if (Math.abs(diff) > threshold) {
      setIsTransitioning(true)
      if (diff > 0) {
        // Swipe left → next
        setCurrentIndex(prev => prev + 1)
      } else {
        // Swipe right → prev
        setCurrentIndex(prev => prev - 1)
      }
    }

    // Resume auto-slide หลัง 2 วินาที
    setTimeout(() => setIsPaused(false), 2000)
  }

  // ===== Dot click =====
  const goToSlide = (realIndex: number) => {
    setIsTransitioning(true)
    setCurrentIndex(realIndex + 1) // +1 เพราะ index 0 = clone
  }

  // คำนวณ real index สำหรับ dots (0-based)
  const realIndex = ((currentIndex - 1 + total) % total)

  // ===== Render slide content =====
  const renderSlide = (banner: Banner, idx: number) => {
    const content = (
      <img
        src={banner.image_url}
        alt=""
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
    )

    if (banner.link_url) {
      return (
        <Link
          key={idx}
          href={banner.link_url}
          style={{
            flex: '0 0 100%',
            width: '100%',
            height,
            display: 'block',
          }}
        >
          {content}
        </Link>
      )
    }

    return (
      <div
        key={idx}
        style={{
          flex: '0 0 100%',
          width: '100%',
          height,
        }}
      >
        {content}
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 16,
        height,
      }}
    >
      {/* Slide track */}
      <div
        ref={trackRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          display: 'flex',
          transition: isTransitioning ? 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
          transform: `translateX(-${currentIndex * 100}%)`,
          height: '100%',
        }}
      >
        {slides.map((banner, idx) => renderSlide(banner, idx))}
      </div>

      {/* Dots indicator */}
      {total > 1 && (
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 5,
        }}>
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              aria-label={`Banner ${i + 1}`}
              style={{
                width: i === realIndex ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === realIndex ? '#5AC8FA' : 'rgba(255,255,255,0.5)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'width 0.25s, background 0.25s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
