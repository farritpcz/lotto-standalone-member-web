// Types + constants สำหรับหน้า lobby
// Parent: src/app/(member)/lobby/page.tsx

// ─── Category config — ใช้รูปธงชาติ/emoji เป็น default (agent เปลี่ยนไม่ได้) ───
export const categories = [
  { key: 'all',    label: 'ทั้งหมด', img: null,                                emoji: '✨' },
  { key: 'thai',   label: 'หวยไทย',  img: 'https://flagcdn.com/w80/th.png',   emoji: '🇹🇭' },
  { key: 'yeekee', label: 'ยี่กี',    img: 'https://images.unsplash.com/photo-1518688248740-7c31f1a945c4?w=80&h=80&fit=crop&q=80', emoji: '🎯' },
  { key: 'lao',    label: 'หวยลาว',  img: 'https://flagcdn.com/w80/la.png',   emoji: '🇱🇦' },
  { key: 'hanoi',  label: 'ฮานอย',   img: 'https://flagcdn.com/w80/vn.png',   emoji: '🇻🇳' },
  { key: 'malay',  label: 'มาเลย์',  img: 'https://flagcdn.com/w80/my.png',   emoji: '🇲🇾' },
  { key: 'stock',  label: 'หุ้น',     img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=80&h=80&fit=crop&q=80', emoji: '📈' },
]

// ─── สีแถบสถานะ (เปิดรับ/ปิดรับ) ───────────────────────────────
export const STATUS_OPEN = { bg: 'color-mix(in srgb, var(--accent-color) 12%, transparent)', color: 'var(--accent-color)', label: 'เปิดรับแทง' }
export const STATUS_CLOSED = { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'ปิดรับแทง' }

// ─── Category order + labels สำหรับ render sections ────────────
export const catOrder = ['thai', 'yeekee', 'lao', 'hanoi', 'malay', 'stock', 'other']
export const catLabels: Record<string, string> = {
  thai: 'หวยไทย', yeekee: 'ยี่กี', lao: 'หวยลาว',
  hanoi: 'หวยฮานอย', malay: 'หวยมาเลย์', stock: 'หวยหุ้น', other: 'อื่นๆ',
}

// ─── Emoji fallback ต่อหมวด ──────────────────────────────────
export const catEmoji: Record<string, string> = {
  thai: '🇹🇭', yeekee: '🎯', lao: '🇱🇦', hanoi: '🇻🇳', malay: '🇲🇾', stock: '📈',
}

// ─── Gradient + Shadow maps ตามหมวด (ใช้ใน LotteryCard pattern bg) ───
export const catGradient: Record<string, string> = {
  thai:   'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  yeekee: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  lao:    'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
  hanoi:  'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
  malay:  'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
  stock:  'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
}

export const catShadow: Record<string, string> = {
  thai: 'rgba(245,158,11,0.3)', yeekee: 'rgba(239,68,68,0.3)',
  lao: 'rgba(239,68,68,0.25)', hanoi: 'rgba(236,72,153,0.3)',
  malay: 'rgba(20,184,166,0.3)', stock: 'rgba(59,130,246,0.3)',
}
