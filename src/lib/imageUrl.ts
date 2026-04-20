/**
 * imageUrl.ts — Helper สำหรับแก้ปัญหา URL ของรูปภาพ 2 แบบ:
 *
 * 1. **Absolute URL** (R2 Cloudflare): `https://pub-xxx.r2.dev/folder/file.png`
 *    → ใช้ตรงได้เลย
 *
 * 2. **Relative URL** (legacy local /uploads): `/uploads/folder/file.jpg`
 *    → ต้อง prefix ด้วย API_BASE (member-api)
 *
 * 3. **Empty / null / undefined** → คืน empty string (ไม่ error)
 *
 * 4. **Data URL** (base64 preview): `data:image/...` → คืนตรงๆ
 *
 * Usage:
 *   import { resolveImageUrl } from '@/lib/imageUrl'
 *   {banner.image_url && <img src={resolveImageUrl(banner.image_url)} />}
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082/api/v1'
const API_BASE = API_URL.replace(/\/api\/v1\/?$/, '')

// ⭐ admin-api base — รูปเก่า (เช่น logo หวย) ที่อัพผ่าน admin-api ยังอยู่ที่ port 8081
// หลัง migrate เสร็จจะไม่มี /uploads/ อีกต่อไป
const ADMIN_API_BASE = (process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:8081/api/v1').replace(/\/api\/v1\/?$/, '')

/**
 * resolveImageUrl - คืน URL ของรูปที่พร้อมใส่ <img src>
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return ''
  if (url.startsWith('data:') || url.startsWith('blob:')) return url
  if (url.startsWith('http://') || url.startsWith('https://')) return url

  // Legacy /uploads/... → ใช้ admin-api (ไฟล์เก่ามักอัพจาก admin)
  if (url.startsWith('/uploads/')) return ADMIN_API_BASE + url

  if (url.startsWith('/')) return API_BASE + url
  return url
}

/**
 * isR2Url - เช็คว่า URL เป็นของ R2 หรือไม่
 */
export function isR2Url(url: string): boolean {
  if (!url) return false
  return url.startsWith('https://pub-') && url.includes('.r2.dev')
}
