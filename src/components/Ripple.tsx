/**
 * Ripple — Material Design ripple effect on click
 *
 * Circle ขยายจากจุดที่คลิก แล้ว fade out
 * ใช้ครอบ element ที่ต้องการ:
 *
 * Usage:
 *   <Ripple><button>Click me</button></Ripple>
 *
 * หรือใช้ hook:
 *   const { ripples, onRippleClick, RippleContainer } = useRipple()
 *   <div onClick={onRippleClick} style={{ position: 'relative', overflow: 'hidden' }}>
 *     <RippleContainer />
 *     ...content...
 *   </div>
 */

'use client'

import React, { useState, useCallback, useRef } from 'react'

/* ─── Ripple data ─── */
interface RippleData {
  id: number
  x: number
  y: number
  size: number
}

/* ─── Hook: useRipple ─── */
export function useRipple(color = 'rgba(255,255,255,0.35)') {
  const [ripples, setRipples] = useState<RippleData[]>([])
  const nextId = useRef(0)

  const onRippleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    /* ขนาด ripple = diameter ที่ครอบทั้ง element */
    const size = Math.max(rect.width, rect.height) * 2

    const id = nextId.current++
    setRipples(prev => [...prev, { id, x, y, size }])

    /* cleanup หลัง animation จบ (600ms) */
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id))
    }, 600)
  }, [])

  const RippleContainer = useCallback(() => (
    <>
      {ripples.map(r => (
        <span
          key={r.id}
          style={{
            position: 'absolute',
            left: r.x - r.size / 2,
            top: r.y - r.size / 2,
            width: r.size,
            height: r.size,
            borderRadius: '50%',
            background: color,
            transform: 'scale(0)',
            animation: 'rippleExpand 0.6s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      ))}
      <style jsx global>{`
        @keyframes rippleExpand {
          0% {
            transform: scale(0);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </>
  ), [ripples, color])

  return { ripples, onRippleClick, RippleContainer }
}

/* ─── Component: Ripple wrapper ─── */
interface RippleProps {
  children: React.ReactNode
  /** สี ripple (default: rgba(255,255,255,0.35)) */
  color?: string
  /** className สำหรับ wrapper */
  className?: string
  /** style สำหรับ wrapper */
  style?: React.CSSProperties
}

export default function Ripple({ children, color = 'rgba(255,255,255,0.35)', className, style }: RippleProps) {
  const { onRippleClick, RippleContainer } = useRipple(color)

  return (
    <div
      className={className}
      onClick={onRippleClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
      <RippleContainer />
    </div>
  )
}
