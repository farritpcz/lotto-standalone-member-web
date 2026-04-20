# Deposit / Withdraw UI

> Last updated: 2026-04-20
> Related code: `src/app/(member)/wallet/page.tsx:1`, `src/app/(member)/deposit-history/page.tsx:1`, `src/components/BankIcon.tsx`

## 🎯 Purpose
หน้ากระเป๋า — ฝาก (QR + สลิป + auto RKAUTO), ถอน, และประวัติธุรกรรม

## 📋 Rules
1. **ฝาก** รองรับ 3 วิธี:
   - **Auto QR (RKAUTO/GobexPay)** — generate QR ใหม่ทุกครั้ง, expire 15 นาที
   - **แนบสลิป** (manual) — upload รูป, รอ admin approve, เช็คด้วย EasySlip
   - **โอนตรงบัญชี** (fallback) — แสดงเลขบัญชี admin
2. **ถอน** ต้อง confirm dialog 2 ชั้น (ไม่ใช้ `confirm()`): confirm ยอด → ยืนยันสุดท้าย
3. **ยอดถอนขั้นต่ำ/สูงสุด** ดึงจาก agent config — validate client-side ก่อน
4. **บัญชีถอน** ต้องตรวจว่าเป็นบัญชี member เอง (name matching ที่ backend)
5. **Log filter** ประวัติ: filter ตามประเภท (deposit/withdraw/bet/commission), date range
6. **Date filter** default: 7 วันล่าสุด
7. **Status badge**: pending (เหลือง), approved (เขียว), rejected (แดง), processing (ฟ้า)

## 🎨 UI Spec
- **QR screen**: QR เต็ม ~60% viewport + countdown expire + ยอดเงิน + เลขอ้างอิง
- **Copy button** ข้างเลขบัญชี/จำนวน (แตะแล้ว toast "คัดลอกแล้ว")
- **BankIcon**: โลโก้ธนาคาร (`src/components/BankIcon.tsx`, asset `icon-bank/`)
- **History**: infinite scroll หรือ paginated 20/page
- **Empty state**: `EmptyState.tsx` "ยังไม่มีรายการ"

## 🔄 User Flow (ฝากผ่าน QR)
1. `/wallet` → tab "ฝาก" → กรอกยอด → เลือก "Auto QR"
2. `POST /api/v1/deposits/qr` → ได้ QR + ref_code
3. แสดง QR + countdown 15 นาที
4. ผู้ใช้โอนผ่าน mobile banking → webhook RKAUTO → backend notify ผ่าน WS/polling
5. Balance update + toast success + redirect history

## 🔄 User Flow (ถอน)
1. tab "ถอน" → กรอกยอด → validate (min/max/balance)
2. กดยืนยัน → confirm modal (1) → confirm modal (2)
3. `POST /api/v1/withdrawals` → status pending → แสดงใน history
4. Admin approve → webhook → toast + balance update

## 🌐 API Calls
- `POST /api/v1/deposits/qr` — สร้าง QR
- `POST /api/v1/deposits/slip` — upload สลิป
- `POST /api/v1/withdrawals` — ขอถอน
- `GET /api/v1/wallet/transactions` — ประวัติ
- `GET /api/v1/deposits/:id/status` — poll สถานะ (ถ้าไม่ใช้ WS)
- API rule: `../../../lotto-standalone-member-api/docs/rules/wallet.md`, `rkauto.md`

## ⚠️ Edge Cases
- **QR expire**: auto refresh หรือแจ้ง "QR หมดอายุ กดสร้างใหม่"
- **สลิปซ้ำ** (EasySlip duplicate): toast error + ห้าม submit
- **ถอนซ้ำ**: ถ้ามี pending withdrawal อยู่ → disable + แจ้ง
- **Offline upload สลิป**: queue retry (optional) หรือแจ้ง "กลับมาออนไลน์แล้วลองใหม่"
- **ยอดไม่พอ**: disable ปุ่มถอน + toast

## 🔗 Source of Truth (file:line)
- Wallet: `src/app/(member)/wallet/page.tsx:1` (996 lines — ควร split)
- Deposit history: `src/app/(member)/deposit-history/page.tsx:1`
- BankIcon: `src/components/BankIcon.tsx`
- Icon assets: `icon-bank/` (repo root)
- API: `../../../lotto-standalone-member-api/docs/rules/wallet.md`, `rkauto.md`
- Memory: `rkauto_gobexpay.md`

## 📝 Change Log
- 2026-04-20: Initial — บันทึก flow ฝาก 3 วิธี + ถอน 2-step confirm + log filter
