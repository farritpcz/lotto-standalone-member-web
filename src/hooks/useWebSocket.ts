/**
 * useWebSocket hook — จัดการ WebSocket connection สำหรับยี่กี
 *
 * ความสัมพันธ์:
 * - เชื่อมต่อกับ: standalone-member-api (#3) → ws/ endpoint
 * - ใช้ใน: หน้ายี่กี play (src/app/(member)/yeekee/play/)
 * - provider-game-web (#8) ใช้ hook เดียวกันเป๊ะ
 *
 * WebSocket events:
 * - send: "shoot" → { number: "12345" }
 * - receive: "shoot_broadcast" → { member, number, shot_at, total_sum }
 * - receive: "countdown" → { seconds_remaining }
 * - receive: "result" → { result_number, top3, top2, bottom2 }
 * - receive: "error" → { message }
 *
 * ⭐ Security: rate limiting — ยิงได้สูงสุด 1 ครั้ง / 3 วินาที ป้องกันสแปม/แฮค
 */

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { WSMessage } from '@/types'

// ⭐ WebSocket URL ดึงจาก API URL → แปลง http → ws
// ถ้าตั้ง NEXT_PUBLIC_WS_URL ไว้ → ใช้ค่านั้น
// ถ้าไม่ → แปลงจาก NEXT_PUBLIC_API_URL (http://localhost:8082/api/v1 → ws://localhost:8082/api/v1)
function getWsBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
  return apiUrl.replace(/^http/, 'ws')
}

const WS_BASE_URL = getWsBaseUrl()

// ⭐ Rate limit — ยิงได้ 1 ครั้ง / SHOOT_COOLDOWN_MS มิลลิวินาที
const SHOOT_COOLDOWN_MS = 3000 // 3 วินาที

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
  /** ส่งเลขยิง (มี rate limiting) */
  shoot: (number: string) => boolean
  /** ปิด connection */
  disconnect: () => void
  /** วินาทีที่ต้องรอก่อนยิงได้อีก (0 = ยิงได้เลย) */
  cooldownRemaining: number
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

  // ⭐ Rate limiting state
  const lastShootTimeRef = useRef<number>(0)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Stable callback refs — ป้องกัน reconnect loop จาก dependency change
  const onMessageRef = useRef(onMessage)
  const onConnectRef = useRef(onConnect)
  const onDisconnectRef = useRef(onDisconnect)
  onMessageRef.current = onMessage
  onConnectRef.current = onConnect
  onDisconnectRef.current = onDisconnect

  // สร้าง WebSocket connection
  const connect = useCallback(() => {
    if (!roundId) return

    // ⭐ WebSocket URL — ส่ง token ผ่าน query param (ws_token cookie)
    // เพราะ WS ข้าม port (3001→8082) httpOnly cookie ไม่ถูกส่ง
    // ws_token เป็น non-httpOnly cookie ที่ JS อ่านได้
    const wsToken = document.cookie.match(/ws_token=([^;]*)/)?.[1] || ''
    const wsUrl = `${WS_BASE_URL}/yeekee/ws/${roundId}${wsToken ? `?token=${wsToken}` : ''}`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        onConnectRef.current?.()
      }

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data)
          onMessageRef.current?.(msg)
        } catch {
          // ignore parse errors
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        onDisconnectRef.current?.()

        // Auto reconnect — ทุก 3 วินาที
        if (autoReconnect) {
          reconnectTimerRef.current = setTimeout(() => {
            connect()
          }, 3000)
        }
      }

      ws.onerror = () => {
        // error จะ trigger onclose ด้วย — ไม่ต้อง handle เพิ่ม
      }
    } catch {
      // WebSocket constructor failed — retry
      if (autoReconnect) {
        reconnectTimerRef.current = setTimeout(connect, 3000)
      }
    }
  }, [roundId, autoReconnect])

  // Connect เมื่อ mount, disconnect เมื่อ unmount
  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null // ป้องกัน auto-reconnect ตอน unmount
        wsRef.current.close()
      }
    }
  }, [connect])

  // ⭐ ส่งเลขยิง — มี rate limiting ป้องกันสแปม
  // return true = ยิงสำเร็จ, false = ถูก rate limit
  const shoot = useCallback((number: string): boolean => {
    // เช็ค WebSocket connected
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      return false
    }

    // ⭐ Rate limiting — เช็คว่ายิงครั้งล่าสุดเมื่อไหร่
    const now = Date.now()
    const elapsed = now - lastShootTimeRef.current
    if (elapsed < SHOOT_COOLDOWN_MS) {
      // ยังอยู่ใน cooldown — ไม่ให้ยิง
      return false
    }

    // ยิงได้ — ส่ง message
    wsRef.current.send(JSON.stringify({
      type: 'shoot',
      data: { number },
    }))

    // บันทึกเวลายิง + เริ่ม cooldown timer
    lastShootTimeRef.current = now
    setCooldownRemaining(Math.ceil(SHOOT_COOLDOWN_MS / 1000))

    // อัพเดท cooldown ทุกวินาที
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current)
    cooldownTimerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((SHOOT_COOLDOWN_MS - (Date.now() - lastShootTimeRef.current)) / 1000))
      setCooldownRemaining(remaining)
      if (remaining <= 0 && cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current)
      }
    }, 200)

    return true
  }, [])

  // ปิด connection
  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current)
    if (wsRef.current) {
      wsRef.current.onclose = null
      wsRef.current.close()
    }
  }, [])

  return { isConnected, shoot, disconnect, cooldownRemaining }
}
