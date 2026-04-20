# Profile Level — Badge + Progress card ใน `/profile` (member-web, v3)

> Last updated: 2026-04-20 (v3 initial)
> Related code: `src/app/(member)/profile/page.tsx` (LevelProgressCard component + dynamic badge), `src/lib/api.ts` (`memberApi.getMyLevel`, `MemberLevelInfo`)

## 🎯 Purpose
แสดงระดับสมาชิก + progress ไปยังระดับถัดไปบนหน้าโปรไฟล์ — **สื่อสารกฏ rolling 30 วันให้ user เข้าใจชัด** (ว่าตกระดับได้)

## 📋 Rules

### Data flow
1. **Fetch** `GET /api/v1/member/level` บน mount ของ `ProfilePage` (silent fail — ไม่ toast)
2. Data type: `MemberLevelInfo` (api.ts) — `{current_level, next_level, deposit_30d, progress_pct, amount_to_next, locked, recalc_info, window_days}`
3. ถ้า fetch ล้มเหลว/ไม่มี level ในระบบ → badge fallback "MEMBER", ไม่แสดง progress card

### Dynamic badge (header)
4. แทนที่ static `<Shield>MEMBER</Shield>` เดิม → ใช้ `levelInfo.current_level.name` + สีของ level
5. ถ้า `current_level=null` → fallback "MEMBER" + สี accent default
6. ถ้า `locked=true` → แสดง emoji 🔒 ต่อท้าย + title tooltip "ระดับถูกตั้งโดยแอดมิน (ไม่เปลี่ยนอัตโนมัติ)"
7. Badge ต้องใช้สี dynamic (ไม่ hard-code accent) → `color-mix(in srgb, ${level.color} 15%, transparent)` สำหรับ background

### LevelProgressCard (ใต้ header card)
8. แสดง**เฉพาะ**เมื่อมี `current_level` **หรือ** `next_level` (มีบางอย่างแสดง)
9. Layout:
   - Top row: ชื่อระดับ (สีใหญ่) ซ้าย / ยอดฝาก 30 วัน (mono) ขวา
   - Middle: progress bar `linear-gradient(current.color → next.color)` + % ตัวเลข
   - "ฝากเพิ่มอีก ฿X ภายใน 30 วัน เพื่อขึ้นระดับ Y" — ชัดเจน
   - ถ้า `next_level=null` → แสดง "✨ คุณอยู่ที่ระดับสูงสุดแล้ว" (สี accent)
   - Bottom: **ℹ️ help block** — 2-3 บรรทัดอธิบาย rolling 30d

### Help text (บังคับใส่ — consistency กับ admin-web)
10. ข้อความ**ต้อง**มี 4 concept นี้:
    - ✅ "คำนวณจากยอดฝากสะสมย้อนหลัง **30 วันล่าสุด**"
    - ✅ "ไม่ใช่ยอดตลอดชีพ" (ป้องกันเข้าใจผิด)
    - ✅ "อัปเดตทุกวัน **02:00 น.**"
    - ✅ "หากฝากน้อยลง **ระดับอาจถูกปรับลงได้**" (ป้องกันผิดหวังตอนถูกลด)
11. ถ้า `locked=true` → เพิ่ม note: "🔒 หมายเหตุ: ระดับของคุณถูกตั้งโดยแอดมิน — จะไม่เปลี่ยนตามระบบอัตโนมัติ"

### Visual spec
12. Accent color = `current_level.color` (fallback `#6b7280`) — ใช้ใน border + gradient + shadow
13. Subtle bg gradient: `linear-gradient(135deg, ${accent} 8%, transparent 60%)` บน absolute overlay
14. Progress bar animate `width 600ms cubic-bezier(0.4, 0, 0.2, 1)` ตอนโหลด
15. Help block:
    - Font 10-11px, line-height 1.6
    - `borderLeft: 2px solid`, padding 8-10px
    - Background: `color-mix(in srgb, currentColor 4%, transparent)`

## 🔄 User Flow
1. Member เข้า `/profile` → fetch level + profile parallel
2. เห็น badge สีตาม tier ปัจจุบัน (เช่น Gold = สีทอง)
3. เลื่อนลงเห็น progress — "ฝากอีก ฿40,000 เพื่อขึ้น Diamond" + % bar
4. กดเข้าไปอ่าน help (หรือเห็นอัตโนมัติ) → เข้าใจว่าถ้าเดือนหน้าฝากน้อย ระดับจะตก

## ⚠️ Edge Cases
- **Network fail**: silent — แค่ fallback "MEMBER" badge + ไม่แสดง progress card (ไม่ crash)
- **สมาชิกใหม่ยังไม่มี level (current=null)**: แสดง "ยังไม่ถูกจัดระดับ" + progress ไปสู่ระดับต่ำสุด (จาก `next_level`)
- **ถึงสูงสุดแล้ว**: แสดง celebration text + ไม่มี progress bar
- **deposit_30d = 0**: progress 0%, "ฝากเพิ่มอีก ฿X..."
- **Admin override (locked)**: ผู้ใช้เห็น 🔒 + บอกเหตุผล — user ไม่งง

## 🔗 Related
- Backend member-api: `../../../lotto-standalone-member-api/docs/rules/member_levels.md`
- Backend admin-api: `../../../lotto-standalone-admin-api/docs/rules/member_levels.md`
- Admin UI: `../../../lotto-standalone-admin-web/docs/rules/member_levels_ui.md`
- API types: `src/lib/api.ts` (`MemberLevelInfo`, `MemberLevelTier`)

## 📝 Change Log
- 2026-04-20: **v3 initial** — dynamic badge ตาม level + LevelProgressCard + help text rolling 30d
