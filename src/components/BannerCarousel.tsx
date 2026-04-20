/**
 * BannerCarousel — Premium auto-slide banner
 *
 * Features:
 * - Aspect ratio 16:5 (default) — responsive ทั้ง mobile & desktop
 * - Ken Burns effect (zoom ช้าๆ ระหว่างสไลด์) — premium look
 * - Gradient overlay ด้านล่างสำหรับ contrast
 * - Progress bar ใต้สุดแทน dots เดิม (+ dots เล็กกลางยังมี)
 * - Pause auto-slide on hover (desktop) + touch (mobile)
 * - Skeleton shimmer ตอนรูปแรกยังโหลดไม่เสร็จ
 * - Infinite loop (last → first seamlessly)
 * - Touch swipe ซ้าย/ขวา
 * - Prev/Next arrow (desktop hover เท่านั้น)
 * - srcset support สำหรับ R2 multi-size (ถ้า image_url มี _md/_lg suffix)
 *
 * Usage:
 *   <BannerCarousel banners={banners} />                   // 16:5 default
 *   <BannerCarousel banners={banners} aspectRatio="16/5" />
 *   <BannerCarousel banners={banners} height={160} />      // backward compat
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { resolveImageUrl } from '@/lib/imageUrl'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Banner {
  image_url: string
  link_url?: string
  title?: string
}

interface BannerCarouselProps {
  banners: Banner[]
  /** Auto-slide interval in ms (default: 5000) */
  interval?: number
  /** Aspect ratio CSS value (default: "16/5") — จะทับ height ถ้ามีค่า */
  aspectRatio?: string
  /** Legacy: fixed height in px — ใช้เมื่อไม่ set aspectRatio */
  height?: number
}

// ───── helper: build srcset ถ้า URL มี _md/_lg suffix (จาก R2 multi-size) ─────
function buildSrcSet(url: string): string | undefined {
  // pattern: /banner/{uuid}_{ts}_md.jpg → generate sm/md/lg variants
  const match = url.match(/^(.+)_(sm|md|lg)(\.[a-z]+)$/i)
  if (!match) return undefined
  const [, base, , ext] = match
  return `${base}_sm${ext} 640w, ${base}_md${ext} 1280w, ${base}_lg${ext} 1920w`
}

export default function BannerCarousel({
  banners,
  interval = 5000,
  aspectRatio,
  height,
}: BannerCarouselProps) {
  const total = banners.length
  if (total === 0) return null

  // Sizing: aspectRatio ชนะ, fallback height, fallback default 16:5
  const containerStyle: React.CSSProperties = aspectRatio
    ? { aspectRatio: aspectRatio.replace('/', ' / ') }
    : height
    ? { height }
    : { aspectRatio: '16 / 5' }

  // ===== Infinite loop: clone first & last =====
  const slides = [banners[total - 1], ...banners, banners[0]]
  const totalSlides = slides.length

  const [currentIndex, setCurrentIndex] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [firstLoaded, setFirstLoaded] = useState(false)
  const [progress, setProgress] = useState(0) // 0-100

  const trackRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ===== Auto-slide + progress bar =====
  const startAutoSlide = useCallback(() => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current)
    if (progressRef.current) clearInterval(progressRef.current)
    setProgress(0)

    // Progress tick ทุก 50ms → เติมจาก 0 → 100 ภายใน interval ms
    const step = 100 / (interval / 50)
    progressRef.current = setInterval(() => {
      setProgress(p => Math.min(100, p + step))
    }, 50)

    autoSlideRef.current = setInterval(() => {
      setIsTransitioning(true)
      setCurrentIndex(prev => prev + 1)
      setProgress(0)
    }, interval)
  }, [interval])

  const stopAutoSlide = useCallback(() => {
    if (autoSlideRef.current) { clearInterval(autoSlideRef.current); autoSlideRef.current = null }
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null }
  }, [])

  useEffect(() => {
    if (!isPaused && total > 1) startAutoSlide()
    else stopAutoSlide()
    return () => stopAutoSlide()
  }, [isPaused, total, startAutoSlide, stopAutoSlide])

  // ===== Infinite loop: jump ไม่มี transition เมื่อถึง clone =====
  useEffect(() => {
    if (!isTransitioning) return
    const timer = setTimeout(() => {
      if (currentIndex >= total + 1) { setIsTransitioning(false); setCurrentIndex(1) }
      if (currentIndex <= 0) { setIsTransitioning(false); setCurrentIndex(total) }
    }, 500)
    return () => clearTimeout(timer)
  }, [currentIndex, isTransitioning, total])

  // Re-enable transition after jump
  useEffect(() => {
    if (!isTransitioning) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsTransitioning(true))
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
    const threshold = 50
    if (Math.abs(diff) > threshold) {
      setIsTransitioning(true)
      setCurrentIndex(prev => prev + (diff > 0 ? 1 : -1))
    }
    setTimeout(() => setIsPaused(false), 2000)
  }

  // ===== Nav =====
  const goTo = (realIndex: number) => {
    setIsTransitioning(true)
    setCurrentIndex(realIndex + 1)
  }
  const goPrev = () => { setIsTransitioning(true); setCurrentIndex(p => p - 1) }
  const goNext = () => { setIsTransitioning(true); setCurrentIndex(p => p + 1) }

  const realIndex = ((currentIndex - 1 + total) % total)

  // ===== Render slide =====
  const renderSlide = (banner: Banner, idx: number, isActive: boolean) => {
    const resolvedUrl = resolveImageUrl(banner.image_url)
    const srcSet = buildSrcSet(resolvedUrl)

    const content = (
      <div style={{
        width: '100%', height: '100%',
        position: 'relative', overflow: 'hidden',
      }}>
        <img
          src={resolvedUrl}
          srcSet={srcSet}
          sizes="(max-width: 768px) 100vw, 1200px"
          alt={banner.title || ''}
          draggable={false}
          onLoad={() => { if (idx === 1) setFirstLoaded(true) }}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            display: 'block', userSelect: 'none', pointerEvents: 'none',
            // Ken Burns: เฉพาะ slide ที่แสดงอยู่ → zoom ช้าๆ
            transform: isActive ? 'scale(1.08)' : 'scale(1)',
            transition: isActive
              ? `transform ${interval + 800}ms ease-out`
              : 'transform 0.5s ease-out',
          }}
        />
        {/* Gradient overlay ด้านล่าง → contrast สำหรับ title + dots */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 40%)',
          pointerEvents: 'none',
        }} />
        {/* Title overlay (ถ้ามี) */}
        {banner.title && (
          <div style={{
            position: 'absolute', left: 16, bottom: 22,
            color: '#fff', fontSize: 14, fontWeight: 600,
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
          }}>
            {banner.title}
          </div>
        )}
      </div>
    )

    const slotStyle: React.CSSProperties = {
      flex: '0 0 100%', width: '100%', height: '100%',
      display: 'block',
    }

    if (banner.link_url) {
      return <Link key={idx} href={banner.link_url} style={slotStyle}>{content}</Link>
    }
    return <div key={idx} style={slotStyle}>{content}</div>
  }

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: 16,
        ...containerStyle,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
      }}
    >
      {/* Skeleton shimmer ตอนรูปแรกยังไม่โหลด */}
      {!firstLoaded && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)',
          backgroundSize: '200% 100%',
          animation: 'bannerShimmer 1.6s ease-in-out infinite',
          zIndex: 1,
        }} />
      )}

      {/* Slide track */}
      <div
        ref={trackRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          display: 'flex',
          transition: isTransitioning ? 'transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1)' : 'none',
          transform: `translateX(-${currentIndex * 100}%)`,
          height: '100%', width: '100%',
        }}
      >
        {slides.map((banner, idx) => renderSlide(banner, idx, idx === currentIndex))}
      </div>

      {/* Arrow nav — desktop hover เท่านั้น */}
      {total > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous"
            className="banner-arrow banner-arrow-left"
            style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
              color: '#fff', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 3,
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goNext}
            aria-label="Next"
            className="banner-arrow banner-arrow-right"
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
              color: '#fff', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 3,
            }}
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {total > 1 && (
        <div style={{
          position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 5, zIndex: 3,
        }}>
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Banner ${i + 1}`}
              style={{
                width: i === realIndex ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i === realIndex ? '#ffffff' : 'rgba(255,255,255,0.45)',
                border: 'none', padding: 0, cursor: 'pointer',
                transition: 'width 0.3s, background 0.3s',
                boxShadow: i === realIndex ? '0 0 8px rgba(255,255,255,0.6)' : 'none',
              }}
            />
          ))}
        </div>
      )}

      {/* Progress bar ล่างสุด */}
      {total > 1 && !isPaused && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 3, background: 'rgba(255,255,255,0.15)', zIndex: 3,
        }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, #5AC8FA, #ffffff)',
            transition: 'width 0.05s linear',
            boxShadow: '0 0 8px rgba(90,200,250,0.8)',
          }} />
        </div>
      )}

      {/* Local styles */}
      <style jsx>{`
        @keyframes bannerShimmer {
          0% { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
        .banner-arrow {
          opacity: 0;
          transition: opacity 0.2s, background 0.2s;
        }
        div:hover > .banner-arrow {
          opacity: 1;
        }
        .banner-arrow:hover {
          background: rgba(0,0,0,0.75) !important;
        }
        @media (max-width: 768px) {
          .banner-arrow {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
