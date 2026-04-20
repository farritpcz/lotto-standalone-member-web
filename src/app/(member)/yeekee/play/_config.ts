/**
 * Yeekee play page config — bet types + helpers
 * Split from page.tsx to keep main file slim
 */
import type { BetType } from '@/types'

// =============================================================================
// ⭐ ยี่กี Bet Types — 6 ประเภทเท่านั้น (ตามรูปตัวอย่างเจริญดี88)
// =============================================================================
export interface YeekeeBetType {
  code: string
  label: string
  rate: number
  digitCount: number
}

export const YEEKEE_BET_TYPES: YeekeeBetType[] = [
  { code: '3TOP',    label: 'สามตัวบน',   rate: 1000, digitCount: 3 },
  { code: '3TOD',    label: 'สามตัวโต๊ด', rate: 150,  digitCount: 3 },
  { code: '2TOP',    label: 'สองตัวบน',   rate: 100,  digitCount: 2 },
  { code: '2BOTTOM', label: 'สองตัวล่าง', rate: 100,  digitCount: 2 },
  { code: 'RUN_TOP', label: 'วิ่งบน',     rate: 4,    digitCount: 1 },
  { code: 'RUN_BOT', label: 'วิ่งล่าง',   rate: 5,    digitCount: 1 },
]

/** แปลง YEEKEE_BET_TYPES ให้ตรงกับ shape ของ store */
export function yeekeeBetTypesForStore() {
  return YEEKEE_BET_TYPES.map(bt => ({
    id: 0,
    name: bt.label,
    code: bt.code as BetType,
    description: '',
    digit_count: bt.digitCount,
    rate: bt.rate,
    max_bet_per_number: 0,
  }))
}

/**
 * maskBotUsername — ถ้าชื่อเป็น bot (_system_bot_X) ให้แสดงเป็นเบอร์โทร mask
 * เช่น "_system_bot_1" → "09x-xxx-1847"
 * ถ้าเป็น user จริง → mask เบอร์โทรเช่น "0614797423" → "061-xxx-7423"
 */
export function maskBotUsername(username: string): string {
  // bot username → สร้างเบอร์ปลอมจาก hash ของ username
  if (username.startsWith('_system_bot') || username === 'BOT') {
    const hash = username.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const prefixes = ['06', '08', '09']
    const prefix = prefixes[hash % 3]
    const last4 = String(hash * 7 % 10000).padStart(4, '0')
    return `${prefix}x-xxx-${last4}`
  }
  // user จริง → mask ตรงกลาง เช่น "0614797423" → "061-xxx-7423"
  if (/^\d{10}$/.test(username)) {
    return `${username.slice(0, 3)}-xxx-${username.slice(-4)}`
  }
  return username
}

// =============================================================================
// Types
// =============================================================================
export interface ShootItem {
  member_username: string
  number: string
  shot_at: string
}

export interface ResultInfo {
  result_number: string
  top3: string
  top2: string
  bottom2: string
}

export type MainTab = 'bet' | 'shoot'
export type BetSubTab = 'keypad' | 'grid' | 'lucky'

export const betSubTabs: { key: BetSubTab; label: string }[] = [
  { key: 'keypad', label: 'กดเลขเอง' },
  { key: 'grid',   label: 'เลือกจากแผง' },
  { key: 'lucky',  label: 'เลขวิน' },
]

/** แปล error reason จาก backend เป็นข้อความสั้น ๆ สำหรับผู้ใช้ไทย */
export function translateBetReason(r: string): string {
  if (r.includes('auto-ban') || r.includes('อั้นอัตโนมัติ')) return 'เลขอั้น (ยอดรวมเกินที่กำหนด)'
  if (r.includes('banned') || r.includes('อั้น'))           return 'เลขอั้น'
  if (r.includes('insufficient') || r.includes('เครดิต'))    return 'เครดิตไม่พอ'
  if (r.includes('closed') || r.includes('ปิดรับ'))          return 'ปิดรับแล้ว'
  if (r.includes('limit') || r.includes('จำกัดยอด'))         return 'เกินวงเงิน'
  return r
}
