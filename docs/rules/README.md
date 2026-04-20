# 📋 Rule Files — `lotto-standalone-member-web`

> **Source of truth** ของกฏ/เงื่อนไขแต่ละฟีเจอร์ใน member frontend (Next.js)
> ทุกครั้งที่แก้ UI/logic ในไฟล์ที่ rule อ้างถึง → **ต้องอัพเดท rule ในคอมมิตเดียวกัน**
> API contract อยู่ที่ `../../../lotto-standalone-member-api/docs/rules/`

---

## 📚 Index — Rule Files ทั้งหมด

| Status | File | ครอบคลุม |
|--------|------|---------|
| ✅ | `ui_conventions.md` | กฏ UI: ห้าม alert, ConfirmDialog, resultAlert |
| ✅ | `design_system.md` | Color, spacing, typography (redesign เจริญดี88) |
| ✅ | `landing_login.md` | Login page, Banner carousel, login flow |
| ✅ | `member_dashboard.md` | Dashboard layout, balance display, quick actions |
| ✅ | `betting_ui.md` | หน้าแทงหวย แต่ละประเภท, bill summary |
| 🚧 | `yeekee_live_ui.md` | Realtime update, countdown, last-second protection UX (countdown/yeekee components ยังว่าง) |
| ✅ | `deposit_withdraw_ui.md` | QR display, history, log filter |
| ✅ | `profile_ui.md` | Profile edit, avatar upload |
| ✅ | `referral_ui.md` | Referral link, downline view |
| 🚧 | `result_pages.md` | ผลรางวัล, bet history (bill-level) (components/result ยังว่าง) |
| ✅ | `mobile_gestures.md` | Swipe, pull-to-refresh, haptic |
| 🚧 | `push_notification.md` | Browser push subscribe, service worker (ต้องตรวจ sw.js) |
| ✅ | `api_client.md` | Axios setup, interceptor, error handling |

**Legend:** ✅ done · 🚧 partial · ⏳ not started

---

## ✍️ Template (ทุกไฟล์ต้องมีโครงนี้)

```markdown
# [ชื่อฟีเจอร์/หน้า]

> Last updated: YYYY-MM-DD
> Related code: `src/app/xxx/page.tsx:LINE`, `src/components/xxx.tsx:LINE`

## 🎯 Purpose
[หน้านี้/คอมโพเนนต์นี้ทำอะไร — 1-3 บรรทัด]

## 📋 Rules (กฏเงื่อนไข UI/UX)
1. เงื่อนไขข้อ 1
2. เงื่อนไขข้อ 2

## 🎨 UI Spec
- Layout: [grid / flex / responsive breakpoint]
- Colors: [primary / accent / status] — อ้างอิง `design_system.md`
- Spacing / Typography

## 🔄 User Flow
[click → state → API → UI update]

## 🌐 API Calls
- `GET /api/v1/xxx` — [purpose + rule file reference]

## ⚠️ Edge Cases
- Empty state / Error state / Loading state / Offline

## 🔗 Source of Truth (file:line)
- Page: `src/app/xxx/page.tsx:10`
- Component: `src/components/xxx.tsx:20`
- Hook: `src/hooks/useXxx.ts:15`
- API contract: `../../../lotto-standalone-member-api/docs/rules/xxx.md`

## 📝 Change Log
- YYYY-MM-DD: [สิ่งที่เปลี่ยน] (commit abc123)
```

---

## 🔒 Convention

1. **ภาษา:** ไทยเป็นหลัก, ศัพท์เทคนิค/component/prop ใช้ภาษาอังกฤษ
2. **ความยาว:** ไม่เกิน ~200 บรรทัดต่อไฟล์ — ถ้ายาวเกิน → split
3. **ห้ามใช้ `alert()` / `confirm()`** — ใช้ `ConfirmDialog` / `resultAlert` เสมอ
4. **file:line ต้อง up-to-date** — ถ้าย้ายโค้ด ต้องอัพเดท reference
5. **Change log** — เขียนย่อๆ 1 บรรทัด + commit hash
6. **Next.js version** — อ่าน `AGENTS.md` ก่อน
7. **Mobile-first** — ทุก UI rule ต้องคิด mobile ก่อน desktop
