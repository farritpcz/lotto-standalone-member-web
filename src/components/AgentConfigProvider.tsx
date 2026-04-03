/**
 * AgentConfigProvider — ดึง agent config + apply theme colors
 *
 * ⭐ Fetch 1 ครั้งตอน mount → cache 5 นาที → apply CSS variables
 * แต่ละ agent จะมีสีธีมเป็นของตัวเอง
 */

'use client'

import { useEffect } from 'react'
import { fetchAgentConfig } from '@/store/agent-store'

export default function AgentConfigProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    fetchAgentConfig()
  }, [])

  return <>{children}</>
}
