/**
 * Shared axios instance + client-side cache สำหรับ member-web (#3)
 *
 * รับผิดชอบ:
 * - สร้าง axios instance singleton (withCredentials + CSRF + X-Agent-Domain)
 * - interceptor จัดการ 401 → redirect /login + เคลียร์ Zustand persist
 * - client-side GET cache (Map-based) — ลด request ซ้ำ
 *
 * Rule: docs/rules/api_client.md (ถ้ามี) — คู่กับ admin-web _client.ts
 */
import axios, { AxiosInstance } from 'axios'

// ⭐ relative URL → Next.js rewrites proxy ไป backend (same-origin สำหรับ httpOnly cookie)
// dev: /api/v1 → Next.js rewrite → http://localhost:8082/api/v1
// prod: /api/v1 → reverse proxy (nginx) → backend
const API_BASE_URL = '/api/v1'

/** อ่าน cookie value จาก document.cookie */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * สร้าง Axios instance พร้อม interceptors
 * - Request: แนบ CSRF + X-Agent-Domain
 * - Response: จัดการ 401 (redirect login + clear Zustand persist)
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    withCredentials: true, // ⭐ ส่ง httpOnly cookie ทุก request (แทน localStorage token)
    headers: { 'Content-Type': 'application/json' },
  })

  // ⭐ CSRF: อ่าน csrf_token cookie → ส่งกลับใน X-CSRF-Token header
  // ⭐ Agent Domain: ส่ง X-Agent-Domain header บอก member-api ว่าเป็นเว็บไหน
  //    ตั้งค่าผ่าน env NEXT_PUBLIC_AGENT_DOMAIN (เช่น "jrd88.com")
  //    ถ้าไม่ตั้ง → member-api จะ detect จาก Host header อัตโนมัติ
  client.interceptors.request.use((config) => {
    const csrfToken = getCookie('csrf_token')
    if (csrfToken && config.headers) {
      config.headers['X-CSRF-Token'] = csrfToken
    }
    // ⭐ บอก backend ว่าเป็นเว็บไหน (สำหรับ multi-agent 300+ เว็บ)
    const agentDomain = process.env.NEXT_PUBLIC_AGENT_DOMAIN
    if (agentDomain && config.headers) {
      config.headers['X-Agent-Domain'] = agentDomain
    }
    return config
  })

  // Response interceptor — จัดการ 401
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired / cookie หมดอายุ → clear auth store + redirect login
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          // ⭐ ลบ Zustand persist ด้วย (ไม่งั้น isAuthenticated ค้างใน localStorage)
          try {
            const raw = localStorage.getItem('lotto-auth')
            if (raw) {
              localStorage.setItem('lotto-auth', JSON.stringify({
                state: { member: null, isAuthenticated: false },
                version: 0,
              }))
            }
          } catch {}
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }
  )

  return client
}

/** API client instance (singleton) */
export const api = createApiClient()

// =============================================================================
// Client-side Cache — ลด request ซ้ำสำหรับ data ที่ไม่เปลี่ยนบ่อย
// =============================================================================

/** cache entry: data + expiry timestamp */
const apiCache = new Map<string, { data: unknown; expiry: number }>()

/**
 * cachedGet — GET แบบ cache (ถ้ายังไม่หมดอายุจะคืนจาก cache ไม่ยิง request)
 *
 * @param url   - API path เช่น '/lotteries'
 * @param ttlMs - cache TTL in milliseconds (default 5 นาที)
 * @param params - query params (optional)
 *
 * ใช้: const res = await cachedGet<MyType>('/lotteries', 5 * 60 * 1000)
 */
export async function cachedGet<T>(url: string, ttlMs: number, params?: Record<string, unknown>): Promise<{ data: T }> {
  // สร้าง cache key จาก url + params
  const key = url + (params ? '?' + JSON.stringify(params) : '')
  const now = Date.now()
  const cached = apiCache.get(key)

  // ถ้ามี cache ยังไม่หมดอายุ → คืนทันที
  if (cached && cached.expiry > now) {
    return { data: cached.data as T }
  }

  // ไม่มี cache หรือหมดอายุ → ยิง request จริง
  const res = await api.get<T>(url, { params })
  apiCache.set(key, { data: res.data, expiry: now + ttlMs })
  return res
}

/** ล้าง cache ทั้งหมด (เรียกหลัง login/logout) */
export function clearApiCache() { apiCache.clear() }

/** ล้าง cache เฉพาะ prefix (เช่น '/referral' จะลบ /referral/info, /referral/leaderboard ฯลฯ) */
export function invalidateCache(prefix: string) {
  for (const key of apiCache.keys()) {
    if (key.startsWith(prefix)) apiCache.delete(key)
  }
}

// Cache durations (milliseconds) — export เพื่อให้ไฟล์ resource อื่นใช้ร่วมกัน
export const CACHE_1MIN  = 60 * 1000
export const CACHE_5MIN  = 5 * 60 * 1000
export const CACHE_30MIN = 30 * 60 * 1000
export const CACHE_1HR   = 60 * 60 * 1000
