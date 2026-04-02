/**
 * BetSuccess — Fullscreen overlay แสดงผลเมื่อแทงหวยสำเร็จ
 *
 * Features:
 * - Large green checkmark animation (SVG stroke-dasharray draws itself)
 * - Text: "แทงหวยสำเร็จ!" + bet count + total amount
 * - Confetti burst (ใช้ Confetti component ที่มีอยู่)
 * - Auto-dismiss หลัง 3 วินาที หรือ tap เพื่อปิด
 *
 * Usage:
 *   <BetSuccess show={true} count={5} amount={500} onClose={() => {}} />
 */

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Confetti from './Confetti'

interface BetSuccessProps {
  /** แสดง/ซ่อน overlay */
  show: boolean
  /** จำนวนรายการที่แทง */
  count: number
  /** ยอดรวม */
  amount: number
  /** callback เมื่อปิด */
  onClose: () => void
}

export default function BetSuccess({ show, count, amount, onClose }: BetSuccessProps) {
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [confettiActive, setConfettiActive] = useState(false)

  useEffect(() => {
    if (show) {
      setVisible(true)
      /* เริ่ม animation หลัง mount เล็กน้อย */
      requestAnimationFrame(() => {
        setAnimating(true)
        setConfettiActive(true)
      })

      /* Auto-dismiss หลัง 3 วินาที */
      const timer = setTimeout(() => {
        handleClose()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [show]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => {
    setAnimating(false)
    setTimeout(() => {
      setVisible(false)
      setConfettiActive(false)
      onClose()
    }, 300) // fade out duration
  }, [onClose])

  if (!visible) return null

  return (
    <>
      {/* ── Confetti burst ── */}
      <Confetti active={confettiActive} onComplete={() => setConfettiActive(false)} />

      {/* ── Overlay ── */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 300,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: animating ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0)',
          backdropFilter: animating ? 'blur(8px)' : 'blur(0px)',
          WebkitBackdropFilter: animating ? 'blur(8px)' : 'blur(0px)',
          transition: 'background 0.3s, backdrop-filter 0.3s',
          cursor: 'pointer',
        }}
      >
        {/* ── Card ── */}
        <div
          style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 24,
            padding: '40px 48px',
            textAlign: 'center',
            transform: animating ? 'scale(1)' : 'scale(0.7)',
            opacity: animating ? 1 : 0,
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Checkmark SVG ── */}
          <div style={{ marginBottom: 20 }}>
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              style={{ display: 'block', margin: '0 auto' }}
            >
              {/* วงกลม background */}
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="#22c55e"
                strokeWidth="4"
                strokeDasharray="226"
                strokeDashoffset={animating ? '0' : '226'}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 0.8s ease-out',
                }}
              />
              {/* เครื่องหมายถูก */}
              <path
                d="M24 42 L35 53 L56 28"
                fill="none"
                stroke="#22c55e"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="60"
                strokeDashoffset={animating ? '0' : '60'}
                style={{
                  transition: 'stroke-dashoffset 0.6s 0.4s ease-out',
                }}
              />
            </svg>
          </div>

          {/* ── Title ── */}
          <h2 style={{
            color: '#22c55e',
            fontSize: 24,
            fontWeight: 800,
            margin: '0 0 8px',
            letterSpacing: -0.3,
          }}>
            แทงหวยสำเร็จ!
          </h2>

          {/* ── Details ── */}
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 16,
            margin: '0 0 4px',
            fontWeight: 500,
          }}>
            {count} รายการ
          </p>
          <p style={{
            color: 'white',
            fontSize: 28,
            fontWeight: 800,
            margin: 0,
            letterSpacing: -0.5,
          }}>
            ฿{amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </p>

          {/* ── Tap hint ── */}
          <p style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: 12,
            marginTop: 16,
            marginBottom: 0,
          }}>
            แตะเพื่อปิด
          </p>
        </div>
      </div>
    </>
  )
}
