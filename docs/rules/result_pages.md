# Result Pages & Bet History

> Last updated: 2026-04-20
> Related code: `src/app/(member)/results/page.tsx:1`, `src/app/(member)/history/page.tsx:1`

## 🎯 Purpose
หน้าผลรางวัล (แยกตามประเภทหวย + รอบ) และประวัติการแทงของสมาชิก (bill-level + detail ต่อเลข)

## 📋 Rules
1. **Bet history** แสดงแบบ **bill-level เป็น default** (1 บิล = 1 row) — ขยายดู detail ต่อเลข
2. **Filter**: ตามประเภทหวย, status (won/lost/pending/canceled), date range
3. **Date filter** default: 7 วันล่าสุด — max 30 วันต่อการดึง
4. **Result page**: โชว์เฉพาะหวยที่ออกผลแล้ว, latest first
5. **Highlight**: เลขถูกของสมาชิกใน result (ถ้า login อยู่)
6. **Payout badge**: โชว์ยอดที่ถูกรางวัล (สีเขียว) หรือ "เสีย" (สีแดง)
7. **Yeekee results**: โชว์ตามห้อง + รอบย่อย (เยอะ → paginated)
8. **Copy bill number** เพื่อแจ้ง admin ได้

## 🎨 UI Spec
- **Result card**: lottery name + รอบ (date) + ตัวเลขหลัก (3 ตัวบน / 2 ตัวล่าง ฯลฯ) + expand ดู prize อื่น
- **Bill row** (history):
  - header: bill_id, timestamp, lottery+round, ยอดรวม, สถานะ badge
  - expand: รายการเลข + bet_type + rate + ยอดต่อเลข
- **Empty**: EmptyState "ยังไม่มีประวัติ" + CTA แทงเลย
- **Skeleton** ระหว่างโหลด (ไม่ใช้ spinner เต็มหน้า)

## 🔄 User Flow
1. `/results` → `resultApi.getResults` (cache 30m) → แสดง list
2. tap card → expand prize detail
3. `/history` → `betApi.getMyBets` → แสดง bill-level
4. tap bill → ขยาย detail เลข (inline หรือ bottom sheet)
5. pull-to-refresh → invalidate cache

## 🌐 API Calls
- `GET /api/v1/results?lottery_type_id=&page=&per_page=`
- `GET /api/v1/bets?status=&round_id=&page=&per_page=`
- API rule: `../../../lotto-standalone-member-api/docs/rules/result.md`, `betting.md`

## ⚠️ Edge Cases
- **Pending result**: badge "รอประกาศ" สีเทา — ไม่คำนวณ payout
- **Canceled round**: แสดง "รอบถูกยกเลิก" + คืนเงิน
- **หลายบิลในรอบเดียว**: group อัตโนมัติ หรือแสดงแยก (default แยก)
- **Bill ที่ถูกยกเลิกบางเลข** (partial): แสดง status "บางส่วน" + expand ดู

## 🔗 Source of Truth (file:line)
- Results: `src/app/(member)/results/page.tsx:1` (229 lines)
- History: `src/app/(member)/history/page.tsx:1` (418 lines)
- Result components: `src/components/result/` (🚧 empty — ต้องสร้าง)
- API: `src/lib/api.ts` (resultApi, betApi)
- API contract: `../../../lotto-standalone-member-api/docs/rules/result.md`
- Memory: `project_current_work.md` (Bets Redesign bill-level)

## 📝 Change Log
- 2026-04-20: Initial — บันทึก bill-level default + filter + date range
