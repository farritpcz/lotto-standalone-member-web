# Betting UI — หน้าแทงหวย + BetSlip

> Last updated: 2026-04-20
> Related code: `src/app/(member)/lottery/[type]/page.tsx:1`, `src/components/bet-board/BetSlip.tsx:1`, `src/components/bet-board/NumberGrid.tsx`, `src/components/number-pad/NumberPad.tsx`

## 🎯 Purpose
หน้าแทงหวยครอบคลุม 39 ประเภท (THAI_GOV, LAO_VIP, HANOI, STOCK, YEEKEE) — ใช้ layout เดียวกัน + bet type selector + number grid + bet slip

## 📋 Rules
1. **ก่อนแทงทุกครั้ง** → call `betApi.checkNumbers` เพื่อเช็คอั้น/ลดเรท/จำกัดยอด
2. **Bet slip แสดงสรุป** ทั้งหมด: จำนวนบิล, ยอดรวม, เรทต่อเลข, ยอดที่จะได้ถ้าถูก
3. **ยืนยันก่อนส่ง** — modal confirm (ไม่ใช้ `confirm()`)
4. **ผลการแทง** → `resultAlert` (success/error) ใน BetSlip (`src/components/bet-board/BetSlip.tsx:28`)
5. **เมื่อแทงสำเร็จ** → invalidate cache `/wallet` + แสดง `BetSuccess.tsx` + Confetti (ถ้าเป็นครั้งแรก)
6. **NumberPad** mobile-only — desktop ใช้ keyboard + NumberGrid
7. **Bet type selector** sticky top (scrollable tabs)
8. **ปิดรับแทง**: แสดง overlay "ปิดรับแล้ว" ทับ grid + disable ปุ่มส่ง
9. **Balance ไม่พอ**: disable ปุ่มส่ง + toast "ยอดเงินไม่พอ กรุณาฝากก่อน" + ลิงก์ `/wallet`
10. **จำกัดยอดต่อเลข** (max_per_number): เช็คใน frontend ก่อน แล้ว backend ยืนยัน

## 🎨 UI Spec
- Layout: sticky header (lottery name + countdown) → bet type tabs → number grid → floating BetSlip ล่าง
- **BetSlip** floating bar ล่าง (ซ้อน BottomNav) → กดเปิด full-sheet
- **NumberGrid**: 10 × 10 grid (2 หลัก), 10 × 10 × 10 paginated (3 หลัก)
- **Lucky Numbers**: `LuckyNumbers.tsx` — เสนอเลขยอดนิยม
- **Selected number**: highlight `--accent-color`
- **Disabled/ปิดอั้น**: gray out + tooltip

## 🔄 User Flow
1. เข้า `/lottery/[type]` → ดึง `lotteryApi.getOpenRounds(type_id)` + `getBetTypes`
2. เลือก bet type → เลือกเลข (tap/long-press) → popup ใส่จำนวน
3. เลขเข้า BetSlip → แก้/ลบได้
4. กด "ส่งบิล" → `betApi.checkNumbers` → ถ้า OK เปิด confirm modal
5. ยืนยัน → `betApi.placeBets` → `resultAlert({type:'success'})` → clear slip → update balance

## 🌐 API Calls
- `GET /api/v1/lotteries/:id/rounds`
- `GET /api/v1/lotteries/:id/bet-types`
- `POST /api/v1/bets/check` — เช็คก่อนส่ง
- `POST /api/v1/bets` — ส่งจริง
- API rule: `../../../lotto-standalone-member-api/docs/rules/betting.md`

## ⚠️ Edge Cases
- **Countdown หมดระหว่างกรอก**: toast "รอบนี้ปิดรับแล้ว" + clear slip
- **Partial fail** (บางเลขโดนอั้น): resultAlert แสดงรายการที่ถูกตัด + ยอดที่ผ่าน
- **Network timeout** ระหว่าง `placeBets`: อย่าให้ส่งซ้ำ — disable ปุ่ม + เช็คบิลใน `history`
- **Double submit**: guard ด้วย `isSubmitting` state
- **Yeekee last-second**: อ้าง `yeekee_live_ui.md` (cut-off 10s)

## 🔗 Source of Truth (file:line)
- Page: `src/app/(member)/lottery/[type]/page.tsx:1`
- BetSlip: `src/components/bet-board/BetSlip.tsx:1` (452 lines)
- BetTypeSelector: `src/components/bet-board/BetTypeSelector.tsx`
- NumberGrid: `src/components/bet-board/NumberGrid.tsx`
- LuckyNumbers: `src/components/bet-board/LuckyNumbers.tsx`
- NumberPad: `src/components/number-pad/NumberPad.tsx`
- BetSuccess: `src/components/BetSuccess.tsx`
- API: `../../../lotto-standalone-member-api/docs/rules/betting.md`

## 📝 Change Log
- 2026-04-20: Initial — บันทึก flow แทง + bet slip + resultAlert pattern
