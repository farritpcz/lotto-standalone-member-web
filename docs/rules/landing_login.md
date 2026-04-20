# Landing & Login Page

> Last updated: 2026-04-20
> Related code: `src/app/page.tsx`, `src/app/(auth)/login/page.tsx:1`, `src/components/BannerCarousel.tsx:1`

## 🎯 Purpose
หน้าแรก (landing) + login เป็นจุดแรกที่สมาชิกเจอ — ต้องโชว์ banner promo, form login สั้น, และ CTA สมัครสมาชิก

## 📋 Rules
1. **ถ้า login แล้ว** (มี cookie + Zustand `isAuthenticated`) → redirect `/dashboard` อัตโนมัติ (middleware.ts)
2. **BannerCarousel** auto-rotate 5s, หยุดเมื่อ user interact (touch/hover)
3. **Username/password form** ต้องมี `autocomplete="username"` / `autocomplete="current-password"`
4. **Login error** → toast + shake animation ที่ form (ไม่ใช้ alert)
5. **CSRF**: login endpoint ต้องอ่าน `csrf_token` cookie ก่อน submit
6. **Forgot password** → ให้ติดต่อ admin (ไม่มี self-service reset ตามนโยบาย multi-agent)
7. **Register** ปิด/เปิดตาม agent config (`AgentConfigProvider`)

## 🎨 UI Spec
- Layout: full-height mobile-first, banner ขนาด 16:9 ด้านบน, form ด้านล่าง
- **ปุ่ม login**: full-width, `--accent-color` background
- **Banner**: swipeable (touch), indicator dots ล่าง
- ซ่อน contact floating button หน้าหน้านี้? — **ไม่ซ่อน** (ช่วยติดต่อ admin)

## 🔄 User Flow
1. เปิด `/` → middleware เช็ค cookie → ถ้าไม่มี redirect `/login`
2. กรอก username/password → submit
3. `authApi.login()` → set httpOnly cookie ที่ backend + ส่ง member info
4. เก็บ member ใน Zustand → redirect `/dashboard`
5. ถ้า error: toast "รหัสผ่านไม่ถูกต้อง" + shake form

## 🌐 API Calls
- `POST /api/v1/auth/login` — `../../../lotto-standalone-member-api/docs/rules/auth.md`
- `POST /api/v1/auth/register` (optional)
- `GET /api/v1/agent/config` — ข้อมูล banner/logo ต่อ agent

## ⚠️ Edge Cases
- **Agent ไม่มี banner**: BannerCarousel.tsx ต้อง fallback รูป default
- **Network fail**: toast error + คง form value ไว้
- **Rate limit (429)**: toast "พยายามเข้าระบบบ่อยเกิน รอสักครู่"
- **Account banned**: backend ส่ง 403 → toast "บัญชีถูกระงับ ติดต่อ admin"

## 🔗 Source of Truth (file:line)
- Landing: `src/app/page.tsx`
- Login: `src/app/(auth)/login/page.tsx:1` (738 lines — พิจารณา split)
- Register: `src/app/(auth)/register/`
- Banner: `src/components/BannerCarousel.tsx:1`
- Middleware: `src/middleware.ts`
- AgentConfig: `src/components/AgentConfigProvider.tsx`
- API: `../../../lotto-standalone-member-api/docs/rules/auth.md`

## 📝 Change Log
- 2026-04-20: Initial — บันทึก flow login + banner + agent config
