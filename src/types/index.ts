/**
 * Shared TypeScript types สำหรับ lotto-standalone-member-web (#4)
 *
 * ความสัมพันธ์:
 * - types เหล่านี้ตรงกับ Go types ใน lotto-core (#2) → types/enums.go, types/models.go
 * - ใช้ร่วมกับ: lotto-provider-game-web (#8) — หน้าเล่นเหมือนกัน
 * - รับข้อมูลจาก: lotto-standalone-member-api (#3)
 *
 * TODO: ในอนาคตจะแยกเป็น @lotto/types npm package เพื่อ share ระหว่าง #4 กับ #8
 */

// =============================================================================
// Enums — ตรงกับ lotto-core/types/enums.go
// =============================================================================

/** ประเภทหวย (39 types) */
export type LotteryType =
  // หวยไทย
  | 'THAI_GOV' | 'BAAC' | 'GSB'
  // ยี่กี
  | 'YEEKEE'
  // หวยลาว
  | 'LAO_VIP' | 'LAO_PATTANA' | 'LAO_STAR' | 'LAO_SAMAKKEE' | 'LAO_THAKHEK_VIP'
  // หวยฮานอย
  | 'HANOI' | 'HANOI_VIP' | 'HANOI_PATTANA'
  // มาเลย์
  | 'MALAY'
  // หวยหุ้น (26 ตัว)
  | 'STOCK_RUSSIA_VIP' | 'STOCK_DJ_VIP' | 'STOCK_HSI_VIP_AM' | 'STOCK_TAIWAN_VIP'
  | 'STOCK_KOREA_VIP' | 'STOCK_HSI_VIP_PM' | 'STOCK_NIKKEI_AM' | 'STOCK_CHINA_AM'
  | 'STOCK_HSI_AM' | 'STOCK_TAIWAN' | 'STOCK_NIKKEI_PM' | 'STOCK_KOREA'
  | 'STOCK_CHINA_PM' | 'STOCK_HSI_PM' | 'STOCK_TH_PM' | 'STOCK_SINGAPORE'
  | 'STOCK_INDIA' | 'STOCK_UK' | 'STOCK_GERMANY' | 'STOCK_RUSSIA' | 'STOCK_DJ'
  | 'STOCK_GERMANY_VIP' | 'STOCK_UK_VIP' | 'STOCK_NIKKEI_VIP_PM'
  | 'STOCK_NIKKEI_VIP_AM' | 'STOCK_CHINA_VIP_PM' | 'STOCK_CHINA_VIP_AM'

/** ประเภทการแทง */
export type BetType = '3TOP' | '3BOTTOM' | '3TOD' | '3FRONT' | '3TOD_FRONT' | 'PERM3'
  | '2TOP' | '2BOTTOM' | '2TOP_UNDER' | 'PERM2'
  | 'RUN_TOP' | 'RUN_BOT' | '19DOOR' | '1TOP'
  | '4TOP' | '4TOD'

/** สถานะรอบหวย */
export type RoundStatus = 'upcoming' | 'open' | 'closed' | 'resulted'

/** สถานะ bet */
export type BetStatus = 'pending' | 'won' | 'lost' | 'cancelled' | 'refunded'

/** สถานะรอบยี่กี */
export type YeekeeStatus = 'waiting' | 'shooting' | 'calculating' | 'resulted'

// =============================================================================
// Models — ข้อมูลที่ได้จาก API (#3)
// =============================================================================

/** ข้อมูลสมาชิก */
export interface Member {
  id: number
  username: string
  phone: string
  email: string
  balance: number
  status: 'active' | 'suspended'
  // ข้อมูลธนาคาร (กรอกตอนสมัคร)
  bank_code?: string
  bank_account_number?: string
  bank_account_name?: string
  // Referral
  referred_by?: number | null
  referral_code?: string
  // ⭐ Avatar (R2 URL) — optional
  avatar_url?: string
  created_at: string
}

/** ประเภทหวย */
export interface LotteryTypeInfo {
  id: number
  name: string
  code: LotteryType
  category: string
  description: string
  image_url?: string
  icon: string
  status: 'active' | 'inactive'
  /** ⭐ เวลาปิดรับรอบถัดไป (null=ไม่มีรอบเปิด) — ใช้แสดง countdown */
  next_close_time?: string | null
}

/** รอบหวย */
export interface LotteryRound {
  id: number
  lottery_type_id: number
  lottery_type: LotteryTypeInfo
  round_number: string
  round_date: string
  open_time: string
  close_time: string
  status: RoundStatus
  result_top3?: string
  result_top2?: string
  result_bottom2?: string
}

/** ประเภทการแทง (พร้อม rate) */
export interface BetTypeInfo {
  id: number
  name: string
  code: BetType
  digit_count: number
  description: string
  rate: number              // rate จ่ายปัจจุบัน
  max_bet_per_number: number // max ต่อเลข (0 = ไม่จำกัด)
}

/** Bet 1 รายการ */
export interface Bet {
  id: number
  batch_id?: string        // กลุ่ม bets ที่แทงพร้อมกัน = 1 บิล
  lottery_round: LotteryRound
  bet_type: BetTypeInfo
  number: string
  amount: number
  rate: number             // เรทที่ได้จริง (อาจลดจากอั้น)
  original_rate?: number   // เรทเดิมก่อนลด (0 หรือ undefined = ไม่ถูกลด)
  rate_note?: string       // หมายเหตุ เช่น "เลขอั้น ลดเรท", "อั้นขั้นบันได"
  status: BetStatus
  win_amount: number
  created_at: string
}

/** ธุรกรรม */
export interface Transaction {
  id: number
  type: 'deposit' | 'withdraw' | 'bet' | 'win' | 'refund'
  amount: number
  balance_before: number
  balance_after: number
  reference_type?: string
  created_at: string
}

/** รอบยี่กี */
export interface YeekeeRound {
  id: number
  round_no: number
  start_time: string
  end_time: string
  status: YeekeeStatus
  result_number?: string
  shoot_count: number
}

/** เลขที่ยิง (ยี่กี) */
export interface YeekeeShoot {
  id: number
  member_id: number
  member_username: string
  number: string
  shot_at: string
}

// =============================================================================
// Request / Response types
// =============================================================================

/** Login request */
export interface LoginRequest {
  username: string
  password: string
}

/** Register request */
export interface RegisterRequest {
  username: string
  password: string
  phone: string
  email?: string
  bank_code?: string
  bank_account?: string
  full_name?: string
  ref_code?: string   // referral code จาก URL ?ref=CODE
}

/** Auth response (login/register) */
export interface AuthResponse {
  success: boolean
  data: {
    access_token: string
    refresh_token: string
    expires_in: number
    member: Member
  }
}

/** Place bet request — 1 รายการ */
export interface PlaceBetItem {
  lottery_round_id: number
  bet_type_code: BetType
  number: string
  amount: number
}

/** Place bet response */
export interface PlaceBetResponse {
  success: boolean
  data: {
    success_count: number
    total_amount: number
    balance_after: number
    errors?: { number: string; bet_type: string; reason: string }[]
  }
}

/** Paginated response */
export interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    total: number
    page: number
    per_page: number
  }
}

/** WebSocket message types (ยี่กี) */
export type WSMessageType = 'shoot' | 'shoot_broadcast' | 'countdown' | 'result' | 'error' | 'round_info'

export interface WSMessage {
  type: WSMessageType
  data: unknown
}
