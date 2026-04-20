// Component: SectionCard + InfoRow — iOS grouped card primitives for profile page
// Parent: src/app/(member)/profile/page.tsx

import React from 'react'

/** SectionCard — iOS grouped card wrapper */
export function SectionCard({ title, titleIcon, action, children }: {
  title?: string
  titleIcon?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden',
      boxShadow: 'var(--shadow-card)',
    }}>
      {title && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 16px', borderBottom: '0.5px solid var(--ios-separator)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {titleIcon}
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ios-label)' }}>{title}</span>
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

/** InfoRow — แถวแสดงข้อมูล (label + value) */
export function InfoRow({ label, value, icon, dimmed, mono, noBorder, input }: {
  label: string
  value?: string
  icon?: string
  dimmed?: boolean
  mono?: boolean
  noBorder?: boolean
  input?: React.ReactNode
}) {
  return (
    <div style={{
      padding: '10px 16px',
      borderBottom: noBorder ? 'none' : '0.5px solid var(--ios-separator)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
        <span style={{ fontSize: 12, color: 'var(--ios-secondary-label)', fontWeight: 500 }}>{label}</span>
      </div>
      {input || (
        <div style={{
          fontSize: 15, color: 'var(--ios-label)',
          opacity: dimmed ? 0.6 : 1,
          fontFamily: mono ? 'var(--font-geist-mono), monospace' : 'inherit',
          letterSpacing: mono ? 1 : 0,
          fontWeight: 500,
        }}>
          {value}
        </div>
      )}
    </div>
  )
}
