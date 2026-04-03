/**
 * AgentConfigProvider — ดึง agent config + apply theme colors
 *
 * ⭐ อ่าน cache ทันที (synchronous) → ไม่ flash สีเขียวก่อน
 * แล้ว fetch background เช็ค version
 */

'use client'

import { useEffect } from 'react'
import { fetchAgentConfig, applyAgentTheme } from '@/store/agent-store'

// ⭐ อ่าน cache ทันทีตอน module load (ก่อน React render)
// ป้องกัน flash สีเขียว default ก่อนที่ theme จะ apply
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('agent-config')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.config?.primaryColor) {
        applyAgentTheme(parsed.config)
      }
    }
  } catch {}
}

export default function AgentConfigProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    fetchAgentConfig()
  }, [])

  return <>{children}</>
}
