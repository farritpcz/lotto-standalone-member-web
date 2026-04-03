/**
 * ThemeProvider — ใช้ useThemeStore + set data-theme attribute บน <html>
 *
 * ความสัมพันธ์:
 * - อ่าน theme จาก: useThemeStore (Zustand persist)
 * - set attribute: document.documentElement.dataset.theme = 'dark' | 'light'
 * - CSS variables: globals.css [data-theme="dark"]
 * - ฟัง: OS prefers-color-scheme เมื่อ mode = 'system'
 */

'use client'

import { useEffect } from 'react'
import { useThemeStore, resolveTheme } from '@/store/theme-store'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode)

  useEffect(() => {
    // ตั้ง theme ทันที
    const theme = resolveTheme(mode)
    document.documentElement.dataset.theme = theme

    // ฟัง OS preference change เมื่อ mode = 'system'
    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.dataset.theme = e.matches ? 'dark' : 'light'
      }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [mode])

  return <>{children}</>
}
