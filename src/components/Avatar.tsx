/**
 * Avatar — Premium gradient circle avatar
 *
 * แสดงตัวอักษรแรกของ username บน gradient circle
 * สีจะเปลี่ยนตามตัวอักษรแรก:
 *   A-E = teal, F-J = blue, K-O = purple, P-T = orange, U-Z = pink, 0-9 = green
 *
 * Sizes: sm (32px), md (44px), lg (64px)
 *
 * Usage:
 *   <Avatar name="0614797423" size="lg" />
 *   <Avatar name="john" />
 */

'use client'

import React from 'react'
import { resolveImageUrl } from '@/lib/imageUrl'

/* ─── Gradient map ตามตัวอักษรแรก ─── */
const gradientMap: Record<string, [string, string]> = {
  // A-E: teal gradient
  A: ['#0d6e6e', '#2dd4a0'], B: ['#0d6e6e', '#2dd4a0'], C: ['#0d6e6e', '#2dd4a0'],
  D: ['#0d6e6e', '#2dd4a0'], E: ['#0d6e6e', '#2dd4a0'],
  // F-J: blue gradient
  F: ['#2563eb', '#60a5fa'], G: ['#2563eb', '#60a5fa'], H: ['#2563eb', '#60a5fa'],
  I: ['#2563eb', '#60a5fa'], J: ['#2563eb', '#60a5fa'],
  // K-O: purple gradient
  K: ['#7c3aed', '#c084fc'], L: ['#7c3aed', '#c084fc'], M: ['#7c3aed', '#c084fc'],
  N: ['#7c3aed', '#c084fc'], O: ['#7c3aed', '#c084fc'],
  // P-T: orange gradient
  P: ['#ea580c', '#fb923c'], Q: ['#ea580c', '#fb923c'], R: ['#ea580c', '#fb923c'],
  S: ['#ea580c', '#fb923c'], T: ['#ea580c', '#fb923c'],
  // U-Z: pink gradient
  U: ['#db2777', '#f472b6'], V: ['#db2777', '#f472b6'], W: ['#db2777', '#f472b6'],
  X: ['#db2777', '#f472b6'], Y: ['#db2777', '#f472b6'], Z: ['#db2777', '#f472b6'],
  // 0-9: green gradient
  '0': ['#059669', '#34d399'], '1': ['#059669', '#34d399'], '2': ['#059669', '#34d399'],
  '3': ['#059669', '#34d399'], '4': ['#059669', '#34d399'], '5': ['#059669', '#34d399'],
  '6': ['#059669', '#34d399'], '7': ['#059669', '#34d399'], '8': ['#059669', '#34d399'],
  '9': ['#059669', '#34d399'],
}

/* ─── Size presets ─── */
const sizeMap = {
  sm: { box: 32, font: 14 },
  md: { box: 44, font: 18 },
  lg: { box: 64, font: 26 },
}

interface AvatarProps {
  /** ชื่อผู้ใช้ — ใช้ตัวแรกแสดงบน avatar */
  name: string
  /** ⭐ URL รูปโปรไฟล์ (optional) — ถ้ามีจะแสดงแทน initial */
  url?: string | null
  /** ขนาด: sm (32px), md (44px), lg (64px) */
  size?: 'sm' | 'md' | 'lg'
  /** className สำหรับ override style เพิ่มเติม */
  className?: string
}

export default function Avatar({ name, url, size = 'md', className }: AvatarProps) {
  const firstChar = (name || 'U').charAt(0).toUpperCase()
  const [from, to] = gradientMap[firstChar] || ['#6b7280', '#9ca3af']
  const { box, font } = sizeMap[size]

  const resolvedUrl = resolveImageUrl(url)

  return (
    <div
      className={className}
      style={{
        width: box,
        height: box,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${from}, ${to})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: font,
        fontWeight: 800,
        flexShrink: 0,
        boxShadow: `0 4px 14px ${from}44`,
        letterSpacing: 0,
        userSelect: 'none',
        overflow: 'hidden',
      }}
      aria-label={`Avatar: ${firstChar}`}
    >
      {resolvedUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={resolvedUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
      ) : firstChar}
    </div>
  )
}
