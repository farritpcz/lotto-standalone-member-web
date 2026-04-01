/**
 * useWebSocket hook — จัดการ WebSocket connection สำหรับยี่กี
 *
 * ความสัมพันธ์:
 * - เชื่อมต่อกับ: standalone-member-api (#3) → ws/ endpoint
 * - ใช้ใน: หน้ายี่กี play (src/app/(member)/yeekee/play/)
 * - provider-game-web (#8) ใช้ hook เดียวกันเป๊ะ
 *   TODO: แยกเป็น @lotto/hooks npm package ในอนาคต
 *
 * WebSocket events:
 * - send: "shoot" → { number: "12345" }
 * - receive: "shoot_broadcast" → { member, number, shot_at, total_sum }
 * - receive: "countdown" → { seconds_remaining }
 * - receive: "result" → { result_number, top3, top2, bottom2 }
 * - receive: "error" → { message }
 */

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { WSMessage } from '@/types'

// WebSocket base URL ของ standalone-member-api (#3)
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/api/v1'

interface UseWebSocketOptions {
  /** ID ของรอบยี่กี */
  roundId: number
  /** Callback เมื่อได้รับ message */
  onMessage?: (msg: WSMessage) => void
  /** Callback เมื่อ connect สำเร็จ */
  onConnect?: () => void
  /** Callback เมื่อ disconnect */
  onDisconnect?: () => void
  /** Auto reconnect เมื่อหลุด */
  autoReconnect?: boolean
}

interface UseWebSocketReturn {
  /** สถานะ connection */
  isConnected: boolean
  /** ส่งเลขยิง */
  shoot: (number: string) => void
  /** ปิด connection */
  disconnect: () => void
}

export function useWebSocket({
  roundId,
  onMessage,
  onConnect,
  onDisconnect,
  autoReconnect = true,
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)

  // สร้าง WebSocket connection
  const connect = useCallback(() => {
    // ดึง JWT token สำหรับ auth
    const token = localStorage.getItem('access_token')
    if (!token) return

    // สร้าง WebSocket URL พร้อม token
    const wsUrl = `${WS_BASE_URL}/yeekee/ws/${roundId}?token=${token}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      onConnect?.()
    }

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data)
        onMessage?.(msg)
      } catch {
        console.error('Failed to parse WebSocket message:', event.data)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      onDisconnect?.()

      // Auto reconnect
      if (autoReconnect) {
        reconnectTimerRef.current = setTimeout(() => {
          connect()
        }, 3000) // retry ทุก 3 วินาที
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }, [roundId, onMessage, onConnect, onDisconnect, autoReconnect])

  // Connect เมื่อ mount, disconnect เมื่อ unmount
  useEffect(() => {
    connect()

    return () => {
      // Cleanup
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  // ส่งเลขยิง
  const shoot = useCallback((number: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'shoot',
        data: { number },
      }))
    }
  }, [])

  // ปิด connection
  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
    }
  }, [])

  return { isConnected, shoot, disconnect }
}
