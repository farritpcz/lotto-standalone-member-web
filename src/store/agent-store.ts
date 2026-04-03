/**
 * Agent Config Store — ดึง theme + config ของ agent จาก API
 *
 * ⭐ Multi-agent: แต่ละ agent มีสี/โลโก้/ชื่อเว็บเป็นของตัวเอง
 * Cache: localStorage 5 นาที → ไม่ fetch ทุก page load
 */

import { create } from 'zustand'

export interface AgentConfig {
  id: number
  name: string
  siteName: string
  logoUrl: string
  faviconUrl: string
  // Theme colors
  primaryColor: string
  secondaryColor: string
  bgColor: string
  accentColor: string
  cardGradient1: string
  cardGradient2: string
  navBG: string
  headerBG: string
  // Version (สำหรับ cache invalidation — admin เปลี่ยนสี → version++)
  themeVersion: number
  // Site config
  tickerText: string
  contactLine: string
  contactPhone: string
  referralEnabled: boolean
  minBet: number
  maxBet: number
  minDeposit: number
  minWithdraw: number
}

// Default config (สีเขียว — ใช้ก่อน fetch สำเร็จ)
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  id: 1,
  name: 'LOTTO',
  siteName: 'LOTTO',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#34C759',
  secondaryColor: '#30DB5B',
  bgColor: '#000000',
  accentColor: '#2dd4bf',
  cardGradient1: '#1a472a',
  cardGradient2: '#2d6a4f',
  navBG: '#0d1f1a',
  headerBG: '#0d3d2e',
  themeVersion: 0,
  tickerText: '',
  contactLine: '',
  contactPhone: '',
  referralEnabled: true,
  minBet: 1,
  maxBet: 0,
  minDeposit: 100,
  minWithdraw: 300,
}

const CACHE_KEY = 'agent-config'
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000 // 30 วัน (เคลียจากหลังบ้านเมื่อเปลี่ยนสี)

interface AgentStoreState {
  config: AgentConfig
  loaded: boolean
  setConfig: (config: AgentConfig) => void
}

/** แปลง API response → AgentConfig */
function mapApiResponse(data: Record<string, unknown>): AgentConfig {
  return {
    id: (data.id as number) || 1,
    name: (data.name as string) || 'LOTTO',
    siteName: (data.site_name as string) || 'LOTTO',
    logoUrl: (data.logo_url as string) || '',
    faviconUrl: (data.favicon_url as string) || '',
    primaryColor: (data.theme_primary_color as string) || DEFAULT_AGENT_CONFIG.primaryColor,
    secondaryColor: (data.theme_secondary_color as string) || DEFAULT_AGENT_CONFIG.secondaryColor,
    bgColor: (data.theme_bg_color as string) || DEFAULT_AGENT_CONFIG.bgColor,
    accentColor: (data.theme_accent_color as string) || DEFAULT_AGENT_CONFIG.accentColor,
    cardGradient1: (data.theme_card_gradient1 as string) || DEFAULT_AGENT_CONFIG.cardGradient1,
    cardGradient2: (data.theme_card_gradient2 as string) || DEFAULT_AGENT_CONFIG.cardGradient2,
    navBG: (data.theme_nav_bg as string) || DEFAULT_AGENT_CONFIG.navBG,
    headerBG: (data.theme_header_bg as string) || DEFAULT_AGENT_CONFIG.headerBG,
    themeVersion: (data.theme_version as number) || 0,
    tickerText: (data.ticker_text as string) || '',
    contactLine: (data.contact_line as string) || '',
    contactPhone: (data.contact_phone as string) || '',
    referralEnabled: (data.referral_enabled as boolean) ?? true,
    minBet: (data.min_bet as number) || 1,
    maxBet: (data.max_bet as number) || 0,
    minDeposit: (data.min_deposit as number) || 100,
    minWithdraw: (data.min_withdraw as number) || 300,
  }
}

interface CachedConfig {
  config: AgentConfig
  version: number  // theme_version จาก backend
  ts: number       // timestamp ที่ cache
}

/** อ่าน cache จาก localStorage */
function readCache(): CachedConfig | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as CachedConfig
    // เช็คอายุ cache (30 วัน)
    if (Date.now() - cached.ts > CACHE_TTL) return null
    return cached
  } catch {
    return null
  }
}

/** เขียน cache ลง localStorage */
function writeCache(config: AgentConfig, version: number) {
  try {
    const cached: CachedConfig = { config, version, ts: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
  } catch {}
}

export const useAgentStore = create<AgentStoreState>((set) => ({
  config: DEFAULT_AGENT_CONFIG,
  loaded: false,
  setConfig: (config) => set({ config, loaded: true }),
}))

/** Apply สี agent เป็น CSS variables บน document */
export function applyAgentTheme(config: AgentConfig) {
  const root = document.documentElement.style
  root.setProperty('--color-primary', config.primaryColor)
  root.setProperty('--color-primary-dark', config.primaryColor)
  root.setProperty('--color-primary-light', config.secondaryColor)
  root.setProperty('--ios-green', config.primaryColor)
  root.setProperty('--ios-green-dark', config.primaryColor)
  root.setProperty('--color-green', config.primaryColor)
  root.setProperty('--color-green-light', config.secondaryColor)
  root.setProperty('--card-gradient', `linear-gradient(145deg, ${config.cardGradient1} 0%, ${config.cardGradient2} 100%)`)
  root.setProperty('--nav-bg', config.navBG)
  root.setProperty('--header-bg', config.headerBG)
  root.setProperty('--accent-color', config.accentColor)
}

/** Fetch agent config จาก API (พร้อม cache 30 วัน + version check) */
export async function fetchAgentConfig(): Promise<AgentConfig> {
  const cached = readCache()

  // 1) มี cache → ใช้เลย + เช็ค version ใน background
  if (cached) {
    applyAgentTheme(cached.config)
    useAgentStore.getState().setConfig(cached.config)

    // Background version check (ไม่ block UI)
    checkVersionInBackground(cached)

    return cached.config
  }

  // 2) ไม่มี cache → fetch เลย
  return await fetchFreshConfig()
}

/** เช็ค version จาก API — ถ้าไม่ตรง → refetch + apply */
async function checkVersionInBackground(cached: CachedConfig) {
  try {
    // ⭐ Lightweight check: ดึงแค่ version ไม่ต้อง full config
    const res = await fetch('/api/v1/agent/config', { credentials: 'include' })
    if (!res.ok) return
    const json = await res.json()
    const serverVersion = (json.data?.theme_version as number) || 0
    // ถ้า version ตรง → ไม่ต้องทำอะไร
    if (serverVersion === cached.version) return
    // Version ไม่ตรง → admin เปลี่ยนสี → apply สีใหม่
    const config = mapApiResponse(json.data || {})
    writeCache(config, serverVersion)
    applyAgentTheme(config)
    useAgentStore.getState().setConfig(config)
  } catch {}
}

/** Fetch config ใหม่จาก API */
async function fetchFreshConfig(): Promise<AgentConfig> {
  try {
    const res = await fetch('/api/v1/agent/config', { credentials: 'include' })
    if (!res.ok) throw new Error('fetch failed')
    const json = await res.json()
    const config = mapApiResponse(json.data || {})
    const version = (json.data?.theme_version as number) || 0
    writeCache(config, version)
    applyAgentTheme(config)
    useAgentStore.getState().setConfig(config)
    return config
  } catch {
    applyAgentTheme(DEFAULT_AGENT_CONFIG)
    useAgentStore.getState().setConfig(DEFAULT_AGENT_CONFIG)
    return DEFAULT_AGENT_CONFIG
  }
}
