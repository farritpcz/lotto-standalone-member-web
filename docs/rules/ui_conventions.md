# UI Conventions — กฏพื้นฐาน UI ของ member frontend

> Last updated: 2026-04-20
> Related code: `src/components/Toast.tsx:91`, `src/components/bet-board/BetSlip.tsx:28`

## 🎯 Purpose
กำหนดกฏ UI/UX ร่วมของทุกหน้าใน `lotto-standalone-member-web` — ครอบคลุมการแจ้งเตือน, confirm, loading, empty state และการห้ามใช้ browser-native dialog

## 📋 Rules (กฏเงื่อนไข UI/UX)
1. **ห้ามใช้ `alert()`, `confirm()`, `prompt()` ของ browser เด็ดขาด** — ใช้ component แทนทุกกรณี
2. **แจ้ง success/error ทั่วไป** → ใช้ `useToast()` จาก `src/components/Toast.tsx`
3. **แจ้งผลการแทงหวย** (สำคัญ, ต้องยืนยัน) → ใช้ `resultAlert` pattern (modal ใน BetSlip, `src/components/bet-board/BetSlip.tsx:28`)
4. **ยืนยันการกระทำอันตราย** (ถอนเงิน, ลบ referral code, logout) → ใช้ ConfirmDialog (🚧 ยังไม่มี shared component — ใช้ modal inline pattern ของ BetSlip ไปก่อน)
5. **Loading** → ใช้ `Loading.tsx` หรือ skeleton, ห้าม block UI ด้วย overlay เต็มจอโดยไม่มีปุ่มปิด
6. **Empty state** → ใช้ `EmptyState.tsx` ทุกครั้งที่ list ว่าง (ห้ามโชว์แค่หน้าขาว)
7. **Mobile-first** — ทุก component ต้อง render ดีที่ `360 × 640` ก่อนค่อยคิด desktop
8. **No emoji in production UI** ยกเว้น icon ที่เป็นส่วน brand (จำกัด) — ใช้ `lucide-react` เป็นหลัก
9. **Tap target ขั้นต่ำ 44 × 44 px** ตามกฏ iOS/Android

## 🎨 UI Spec
- **Toast position**: top-center, auto dismiss 3s (success), 5s (error)
- **Modal**: full-width บน mobile (< 640px), centered card บน desktop
- **Font**: system font stack — อ้างอิง `design_system.md`
- **Z-index**:
  - `BottomNav` = 40
  - `Toast` = 60
  - `Modal` / `resultAlert` = 70
  - `ConfirmDialog` = 80

## 🔄 User Flow (ตัวอย่าง confirm ถอนเงิน)
`กดถอน` → เปิด modal confirm (ไม่ใช่ `confirm()`) → กดยืนยัน → call API → `toast.success()` หรือ `resultAlert({type:'error'})`

## 🌐 API Calls
ไม่ข้อง — เป็น convention ล้วน

## ⚠️ Edge Cases
- **SSR:** Toast context ต้องอยู่ใน client component (`'use client'`) — wrap ที่ `src/app/layout.tsx`
- **Double tap:** ปุ่มที่ trigger API ต้อง disable ระหว่าง loading
- **Offline:** แสดง toast error "ไม่มีอินเทอร์เน็ต" แทน silent fail

## 🔗 Source of Truth (file:line)
- Toast: `src/components/Toast.tsx:91` (useToast), `:191` (ToastProvider)
- resultAlert reference: `src/components/bet-board/BetSlip.tsx:28`
- Loading: `src/components/Loading.tsx`
- EmptyState: `src/components/EmptyState.tsx`
- Memory note: `feedback_no_browser_alert.md`, `feedback_ui_rules.md`

## 📝 Change Log
- 2026-04-20: Initial — บันทึกกฏห้าม alert/confirm, pattern resultAlert, toast (commit pending)
