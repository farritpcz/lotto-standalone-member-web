/**
 * Confetti — Confetti burst animation (member-web only)
 *
 * แสดง confetti particles ระเบิดจากตรงกลาง
 * Duration: 3 วินาทีแล้ว auto-cleanup
 * Pure CSS/JS animation ไม่ต้องใช้ library
 *
 * Usage:
 *   const [showConfetti, setShowConfetti] = useState(false)
 *
 *   // trigger
 *   setShowConfetti(true)
 *
 *   // render
 *   <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
 */

'use client'

import React, { useEffect, useState, useRef } from 'react'

interface ConfettiProps {
  /** เปิด/ปิด animation */
  active: boolean
  /** callback เมื่อ animation จบ (3 วินาที) */
  onComplete?: () => void
}

/* ─── สี confetti: gold, red, green, blue, purple, pink, orange ─── */
const COLORS = [
  '#FFD700', '#FF4444', '#00C853', '#2979FF', '#AA00FF',
  '#FF4081', '#FF9100', '#00E5FF', '#76FF03', '#E040FB',
]

/* ─── สร้าง particle data ─── */
interface Particle {
  id: number
  x: number       // ตำแหน่งเริ่มจากกลาง (vw offset)
  y: number       // ตำแหน่งเริ่มจากกลาง (vh offset)
  color: string
  size: number    // px
  angle: number   // องศาที่ยิงออก
  velocity: number
  spin: number    // rotation speed
  drift: number   // horizontal drift
  delay: number   // animation delay
}

function generateParticles(count: number): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
    particles.push({
      id: i,
      x: 0,
      y: 0,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 6,
      angle,
      velocity: 200 + Math.random() * 400,
      spin: (Math.random() - 0.5) * 720,
      drift: (Math.random() - 0.5) * 100,
      delay: Math.random() * 0.15,
    })
  }
  return particles
}

export default function Confetti({ active, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (active) {
      // สร้าง 60 particles
      setParticles(generateParticles(60))
      setVisible(true)

      // cleanup หลัง 3 วินาที
      timerRef.current = setTimeout(() => {
        setVisible(false)
        setParticles([])
        onComplete?.()
      }, 3000)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [active, onComplete])

  if (!visible || particles.length === 0) return null

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {particles.map((p) => {
          /* คำนวณตำแหน่ง end จากมุม + ความเร็ว */
          const endX = Math.cos(p.angle) * p.velocity + p.drift
          const endY = Math.sin(p.angle) * p.velocity + 300 // gravity pull down

          /* สุ่มรูปร่าง: สี่เหลี่ยม หรือ วงกลม */
          const isCircle = p.id % 3 === 0
          const borderRadius = isCircle ? '50%' : p.id % 2 === 0 ? '2px' : '0'

          return (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: '50%',
                top: '40%',
                width: p.size,
                height: isCircle ? p.size : p.size * 0.6,
                background: p.color,
                borderRadius,
                opacity: 0,
                animation: `confettiBurst 2.5s ${p.delay}s ease-out forwards`,
                ['--endX' as string]: `${endX}px`,
                ['--endY' as string]: `${endY}px`,
                ['--spin' as string]: `${p.spin}deg`,
              }}
            />
          )
        })}
      </div>

      <style jsx global>{`
        @keyframes confettiBurst {
          0% {
            opacity: 1;
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
          15% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform:
              translate(var(--endX), var(--endY))
              rotate(var(--spin))
              scale(0.3);
          }
        }
      `}</style>
    </>
  )
}
