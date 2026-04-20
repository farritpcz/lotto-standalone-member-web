/**
 * API Client สำหรับ lotto-standalone-member-web (#3) — Barrel
 *
 * ความสัมพันธ์:
 * - เรียก API ของ: #3 lotto-standalone-member-api (port 8082)
 * - ใช้ httpOnly cookie (JWT) + CSRF token
 * - มี X-Agent-Domain header สำหรับ multi-agent routing
 *
 * NOTE: provider-game-web (#8) จะมี api.ts คล้ายกัน
 * ต่างกันที่: base URL, auth method (launch token vs cookie)
 *
 * ⭐ ไฟล์นี้เป็น barrel — re-export ทั้งหมดจาก ./api/* เพื่อให้ caller เดิม
 * (`import { xxxApi } from '@/lib/api'`) ยังใช้งานได้ตามเดิม
 * ดูโครงสร้างไฟล์แยกที่ src/lib/api/*.ts
 */

// Shared axios instance + cache + CACHE_* constants
export * from './api/_client'

// Per-resource APIs
export * from './api/auth'
export * from './api/member'
export * from './api/lottery'
export * from './api/bet'
export * from './api/result'
export * from './api/wallet'
export * from './api/yeekee'
export * from './api/referral'
export * from './api/notification'
