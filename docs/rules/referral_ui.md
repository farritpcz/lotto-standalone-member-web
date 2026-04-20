# Referral UI

> Last updated: 2026-04-20
> Related code: `src/app/(member)/referral/page.tsx:1`, `src/lib/api.ts:248` (referralApi)

## 🎯 Purpose
หน้าแนะนำเพื่อน/affiliate — แชร์ลิงก์, custom code, ดู downline, commission, leaderboard, analytics

## 📋 Rules
1. **Referral link** generate อัตโนมัติเมื่อสมาชิกลงทะเบียน — แสดงเต็ม + copy/share
2. **Custom code** ตั้งได้ 1 ครั้ง (หรือเปลี่ยนได้ทุก X วัน ตาม config) — validate 3-20 ตัว a-zA-Z0-9_
3. **Commission** แสดงแยกตาม lottery type + rate + ยอดรวม
4. **Withdraw commission**: ขั้นต่ำตาม `withdrawal.min` จาก API → invalidate cache ทั้ง `/wallet` + `/referral`
5. **Downline view**: โชว์เฉพาะสายใต้ตัวเอง (scoping) — อ้าง `downline_scoping.md`
6. **Leaderboard** period: day / week / month — highlight `is_me`
7. **Share templates** ดึงจาก admin — preview + copy (ไม่ share โดยตรงใน native share API ก็ได้)
8. **Notifications** badge unread — mark read เมื่อเปิด

## 🎨 UI Spec
- Layout: tabs (สรุป / สาย / อันดับ / ประวัติ)
- **Link card**: gradient + QR + ปุ่ม copy + share
- **Stats grid** 2 × 2: total_referred, active_referred, total_comm, pending_comm
- **Leaderboard row**: rank badge (1=gold, 2=silver, 3=bronze), avatar, username, ยอด
- **Commission row**: username, ประเภทหวย, rate%, ยอด, สถานะ

## 🔄 User Flow (แชร์)
1. เข้า `/referral` → `referralApi.getInfo` (cache 2m)
2. กดปุ่ม "แชร์" → navigator.share() ถ้ามี, fallback copy + toast
3. เลือก template → prefill ข้อความ

## 🔄 User Flow (ถอน commission)
1. tab สรุป → ปุ่ม "ถอนเข้ากระเป๋า"
2. กรอกยอด ≥ min → confirm modal
3. `referralApi.withdraw` → invalidate `/wallet` + `/referral` → toast + update stats

## 🌐 API Calls
- `GET /api/v1/referral/info`
- `GET /api/v1/referral/commissions`
- `POST /api/v1/referral/withdraw`
- `GET /api/v1/referral/withdrawals`
- `GET /api/v1/referral/leaderboard?period=...`
- `GET /api/v1/referral/analytics?days=...`
- `POST /api/v1/referral/custom-code`
- `GET /api/v1/referral/notifications`
- `POST /api/v1/referral/notifications/read`
- `GET /api/v1/referral/share-templates`
- API rule: `../../../lotto-standalone-member-api/docs/rules/referral.md`

## ⚠️ Edge Cases
- **Custom code ซ้ำ**: backend 409 → toast "โค้ดถูกใช้แล้ว"
- **ยอด commission ไม่พอ min**: disable ปุ่มถอน + hint
- **ยังไม่มี downline**: EmptyState "ยังไม่มีคนใช้ลิงก์ของคุณ" + tutorial
- **Clipboard API fail** (iOS private mode): fallback `document.execCommand('copy')`

## 🔗 Source of Truth (file:line)
- Page: `src/app/(member)/referral/page.tsx:1` (1142 lines — ต้อง split เป็น tabs)
- API: `src/lib/api.ts:248` (referralApi)
- Types: `src/lib/api.ts:295` (ReferralInfo, LeaderboardEntry, ShareTemplate)
- Memory: `referral_system_plan.md`, `downline_system.md`, `downline_scoping.md`
- API contract: `../../../lotto-standalone-member-api/docs/rules/referral.md`

## 📝 Change Log
- 2026-04-20: Initial — บันทึก tabs + withdraw flow + leaderboard + downline scoping
