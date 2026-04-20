// Component: SettingsCard — theme selector + push notification toggle
// Parent: src/app/(member)/profile/page.tsx

import { Sun, Moon, Monitor, Bell, BellOff } from 'lucide-react'
import { SectionCard } from './SectionCard'

export interface SettingsCardProps {
  themeMode: 'light' | 'dark' | 'system'
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void
  push: {
    isSupported: boolean
    isSubscribed: boolean
    loading: boolean
    permission: string
    subscribe: () => void
    unsubscribe: () => void
  }
}

export function SettingsCard({ themeMode, setThemeMode, push }: SettingsCardProps) {
  return (
    <SectionCard title="การตั้งค่า">
      {/* Theme selector */}
      <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--ios-separator)' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ios-secondary-label)', marginBottom: 8 }}>ธีม</div>
        <div style={{ display: 'flex', gap: 0, background: 'var(--ios-bg)', borderRadius: 10, padding: 3 }}>
          {([
            { value: 'light' as const, icon: Sun, label: 'สว่าง' },
            { value: 'dark' as const, icon: Moon, label: 'มืด' },
            { value: 'system' as const, icon: Monitor, label: 'ระบบ' },
          ]).map(({ value, icon: Icon, label }) => (
            <button key={value} onClick={() => setThemeMode(value)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '9px 4px', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer',
              fontWeight: themeMode === value ? 600 : 400,
              color: themeMode === value ? 'var(--ios-label)' : 'var(--ios-secondary-label)',
              background: themeMode === value ? 'var(--ios-card)' : 'transparent',
              boxShadow: themeMode === value ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
            }}>
              <Icon size={14} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Push notification toggle */}
      {push.isSupported && (
        <button onClick={() => push.isSubscribed ? push.unsubscribe() : push.subscribe()}
          disabled={push.loading || push.permission === 'denied'}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 15, color: 'var(--ios-label)', textAlign: 'left',
          }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: push.isSubscribed ? 'color-mix(in srgb, var(--accent-color) 12%, transparent)' : 'rgba(142,142,147,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {push.isSubscribed
              ? <Bell size={17} strokeWidth={2} style={{ color: 'var(--accent-color)' }} />
              : <BellOff size={17} strokeWidth={2} color="#8E8E93" />
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500 }}>แจ้งเตือน Push</div>
            <div style={{ fontSize: 12, color: 'var(--ios-secondary-label)', marginTop: 1 }}>
              {push.permission === 'denied' ? 'ถูกบล็อก (เปิดใน browser settings)'
                : push.isSubscribed ? 'เปิดอยู่ — รับแจ้งเตือนแม้ปิดเว็บ'
                : 'ปิดอยู่ — กดเพื่อเปิดรับแจ้งเตือน'}
            </div>
          </div>
          {/* Toggle indicator */}
          <div style={{
            width: 44, height: 26, borderRadius: 13, padding: 2,
            background: push.isSubscribed ? 'var(--accent-color)' : 'var(--ios-fill)',
            transition: 'background 0.25s',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', background: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transform: push.isSubscribed ? 'translateX(18px)' : 'translateX(0)',
              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>
        </button>
      )}
    </SectionCard>
  )
}
