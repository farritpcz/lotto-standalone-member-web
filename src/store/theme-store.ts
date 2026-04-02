/**
 * Theme Store — จัดการ Dark/Light mode ด้วย Zustand
 *
 * Modes:
 * - 'light': บังคับ light mode
 * - 'dark': บังคับ dark mode
 * - 'system': ตาม OS preference (prefers-color-scheme)
 *
 * Persist: localStorage key 'theme-storage'
 *
 * ความสัมพันธ์:
 * - ใช้โดย: ThemeProvider (layout.tsx), SideMenu (toggle)
 * - CSS variables: globals.css [data-theme="dark"]
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',

      setMode: (mode) => set({ mode }),

      toggleMode: () =>
        set((state) => {
          // Cycle: light → dark → system → light
          const next: Record<ThemeMode, ThemeMode> = {
            light: 'dark',
            dark: 'system',
            system: 'light',
          }
          return { mode: next[state.mode] }
        }),
    }),
    {
      name: 'theme-storage',
    }
  )
)

/**
 * resolveTheme — คำนวณ theme จริงจาก mode + OS preference
 * ใช้ใน ThemeProvider เพื่อ set data-theme attribute
 */
export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }
  return mode
}
