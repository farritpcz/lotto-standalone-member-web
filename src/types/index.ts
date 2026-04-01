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

/** ประเภทหวย */
export type LotteryType = 'THAI' | 'LAO' | 'STOCK_TH' | 'STOCK_FOREIGN' | 'YEEKEE' | 'CUSTOM'

/** ประเภทการแทง */
export type BetType = '3TOP' | '3BOTTOM' | '3TOD' | '2TOP' | '2BOTTOM' | 'RUN_TOP' | 'RUN_BOT'

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
  created_at: string
}

/** ประเภทหวย */
export interface LotteryTypeInfo {
  id: number
  name: string
  code: LotteryType
  category: string
  description: string
  icon: string
  status: 'active' | 'inactive'
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
  lottery_round: LotteryRound
  bet_type: BetTypeInfo
  number: string
  amount: number
  rate: number
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
  email: string
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
export type WSMessageType = 'shoot' | 'shoot_broadcast' | 'countdown' | 'result' | 'error'

export interface WSMessage {
  type: WSMessageType
  data: unknown
}
