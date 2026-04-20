# Mobile Gestures — Swipe / Pull-to-refresh / Haptic

> Last updated: 2026-04-20
> Related code: `src/components/PullToRefresh.tsx:1`, `src/components/SwipeBack.tsx:1`, `src/components/PageTransition.tsx`, `src/components/Ripple.tsx`

## 🎯 Purpose
กฏเรื่อง gesture บน mobile — pull-to-refresh, swipe back, tap ripple, haptic feedback — ต้องลื่น, native-like, และ respect accessibility

## 📋 Rules
1. **Pull-to-refresh** ใช้กับหน้า list ที่มีข้อมูลเปลี่ยน (dashboard, history, results, wallet, referral)
2. **SwipeBack** เปิดบน iOS-like gesture (edge swipe ซ้าย → ย้อนกลับ) — `SwipeBack.tsx`
3. **Ripple** effect บน tap ของปุ่ม (`Ripple.tsx`) — ห้ามใส่ทุก element (เฉพาะ interactive)
4. **Haptic** ใช้ Vibration API ถ้ามี:
   - `10ms` — tap ทั่วไป (optional, ปิด default)
   - `20ms` — confirm success
   - `[10, 50, 10]` — error
5. **Respect `prefers-reduced-motion`** — ปิด animation + haptic ถ้า user เปิด
6. **Threshold** pull-to-refresh: 80px
7. **Page transition**: fade + slide (`PageTransition.tsx`) — duration 250ms
8. **ห้ามใช้ gesture ที่ block scroll** — เช่น capturing touchmove ทั้งหน้า

## 🎨 UI Spec
- **PullToRefresh indicator**: spinner + text "ดึงเพื่อรีเฟรช" / "ปล่อยเพื่อรีเฟรช" / "กำลังโหลด..."
- **Swipe back hint**: ไม่ต้องมี visible indicator (native-like)
- **Ripple**: `rgba(255,255,255,0.3)` บน accent, `rgba(0,0,0,0.1)` บน light

## 🔄 User Flow (Pull-to-refresh)
1. user drag down at scroll=0 → แสดง indicator
2. cross threshold → change state "ปล่อยเพื่อรีเฟรช"
3. release → call `onRefresh` (async) → show spinner
4. done → hide + toast optional

## 🌐 API Calls
ไม่มี (utility layer)

## ⚠️ Edge Cases
- **iOS bounce**: disable overscroll หน้าที่ไม่ต้องการ (`overscroll-behavior: contain`)
- **Android WebView**: Vibration API อาจถูก block — ใช้ try/catch
- **Desktop**: ไม่ init SwipeBack, PullToRefresh (detect pointer=fine)
- **Nested scroll**: PullToRefresh ต้อง attach เฉพาะ outer scroll

## 🔗 Source of Truth (file:line)
- PullToRefresh: `src/components/PullToRefresh.tsx:1`
- SwipeBack: `src/components/SwipeBack.tsx:1`
- Ripple: `src/components/Ripple.tsx`
- PageTransition: `src/components/PageTransition.tsx`
- Memory: `feedback_ui_rules.md`

## 📝 Change Log
- 2026-04-20: Initial — บันทึก gesture rules + haptic + reduced-motion
