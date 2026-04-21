// แถว icons หมวดหวย แบบเลื่อนได้ (drag + touch)
// Parent: src/app/(member)/lobby/page.tsx

'use client'

import { useRef, useCallback } from 'react'
import { categories } from './types'

interface Props {
  selectedCat: string
  onSelect: (key: string) => void
}

export default function CategoryIconsRow({ selectedCat, onSelect }: Props) {
  // ─── Drag scroll สำหรับ category icons row ─────────────────
  // ทำให้เลื่อนซ้ายขวาได้ทั้ง touch (มือถือ) และ mouse drag (PC)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0)
    scrollLeft.current = scrollRef.current?.scrollLeft || 0
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - (scrollRef.current.offsetLeft || 0)
    const walk = (x - startX.current) * 1.5
    scrollRef.current.scrollLeft = scrollLeft.current - walk
  }, [])

  const handleMouseUp = useCallback(() => { isDragging.current = false }, [])

  return (
    <div className="lobby-cat-scroll" ref={scrollRef}
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {categories.map(cat => {
        const isActive = selectedCat === cat.key
        return (
          <button key={cat.key} onClick={() => onSelect(cat.key)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 4px', flexShrink: 0, minWidth: 56,
          }}>
            {/* วงกลม — ธงชาติ หรือ emoji */}
            <div style={{
              width: 50, height: 50, borderRadius: '50%',
              background: isActive ? 'var(--accent-color)' : 'var(--ios-card)',
              border: isActive ? '2.5px solid var(--accent-color)' : '2px solid var(--ios-separator)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: isActive
                ? '0 4px 12px color-mix(in srgb, var(--accent-color) 35%, transparent)'
                : 'var(--shadow-card)',
              transition: 'all 0.2s',
            }}>
              {cat.img ? (
                <img src={cat.img} alt={cat.label}
                  style={{
                    width: '110%', height: '110%', objectFit: 'cover',
                    opacity: isActive ? 1 : 0.7,
                    transition: 'opacity 0.2s',
                  }}
                />
              ) : (
                <span style={{ fontSize: 22 }}>{cat.emoji}</span>
              )}
            </div>
            <span style={{
              fontSize: 10, fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--accent-color)' : 'var(--ios-secondary-label)',
              whiteSpace: 'nowrap',
            }}>
              {cat.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
