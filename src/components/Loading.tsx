/**
 * Loading Components — iOS 17 HIG Style
 *
 * 3 variants:
 * 1. <Loading />        — fullpage: centered spinner + "กำลังโหลด..."
 * 2. <Loading inline />  — inline: small spinner only (no text)
 * 3. <LoadingSkeleton rows={3} /> — shimmer skeleton bars (iOS style)
 *
 * Spinner color: teal #0d6e6e
 * Skeleton: light gray gradient shimmer on white background
 *
 * ความสัมพันธ์:
 * - ใช้ใน: dashboard, lobby, history, results, rates, lottery/[type], yeekee/room, yeekee/play
 * - CSS keyframes: spin + shimmer อยู่ใน globals.css (skeleton-loading)
 * - เพิ่ม <style> tag สำรองกรณี keyframes ไม่ถูก load
 */

'use client'

// =============================================================================
// Loading — Spinner (fullpage / inline)
// =============================================================================
interface LoadingProps {
  /** inline mode: small spinner, no text */
  inline?: boolean
  /** override loading text (default: "กำลังโหลด...") */
  text?: string
}

export default function Loading({ inline = false, text = 'กำลังโหลด...' }: LoadingProps) {
  if (inline) {
    return (
      <>
        <style>{spinKeyframes}</style>
        <span
          style={{
            display: 'inline-block',
            width: 20,
            height: 20,
            border: '2.5px solid rgba(13, 110, 110, 0.2)',
            borderTopColor: '#0d6e6e',
            borderRadius: '50%',
            animation: 'loading-spin 0.7s linear infinite',
            verticalAlign: 'middle',
          }}
          role="status"
          aria-label="กำลังโหลด"
        />
      </>
    )
  }

  // Fullpage — centered spinner + text
  return (
    <>
      <style>{spinKeyframes}</style>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 16px',
          gap: 14,
        }}
        role="status"
        aria-label="กำลังโหลด"
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: '3px solid rgba(13, 110, 110, 0.15)',
            borderTopColor: '#0d6e6e',
            borderRadius: '50%',
            animation: 'loading-spin 0.7s linear infinite',
          }}
        />
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--ios-secondary-label, #8E8E93)',
          }}
        >
          {text}
        </span>
      </div>
    </>
  )
}

// =============================================================================
// LoadingSkeleton — Shimmer bars (iOS style, light theme)
// =============================================================================
interface LoadingSkeletonProps {
  /** number of shimmer bars (default: 3) */
  rows?: number
  /** height of each bar in px (default: 16) */
  height?: number
}

export function LoadingSkeleton({ rows = 3, height = 16 }: LoadingSkeletonProps) {
  // Alternate widths for natural look: 100%, 75%, 60%, 100%, 75%...
  const widths = ['100%', '75%', '60%']

  return (
    <>
      <style>{shimmerKeyframes}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            style={{
              height,
              width: widths[i % widths.length],
              borderRadius: 'var(--radius-xs, 6px)',
              background: 'linear-gradient(90deg, #E5E5EA 25%, #D1D1D6 50%, #E5E5EA 75%)',
              backgroundSize: '200% 100%',
              animation: 'loading-shimmer 1.5s infinite',
            }}
          />
        ))}
      </div>
    </>
  )
}

// =============================================================================
// Inline CSS Keyframes — fallback in case globals.css doesn't have them
// Uses loading-spin / loading-shimmer names to avoid collision with globals.css
// =============================================================================
const spinKeyframes = `
@keyframes loading-spin {
  to { transform: rotate(360deg); }
}
`

const shimmerKeyframes = `
@keyframes loading-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`
