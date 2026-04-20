# Yeekee Live UI — Realtime + Countdown + Last-second Protection

> Last updated: 2026-04-20
> Related code: `src/app/(member)/yeekee/room/page.tsx:1`, `src/app/(member)/yeekee/play/page.tsx`, `src/hooks/useWebSocket.ts:1`

## 🎯 Purpose
หน้ายี่กี (ห้องสด) — แสดงการยิงเลข real-time, countdown จนถึงเวลาออก, และป้องกันการแทงวินาทีสุดท้าย

## 📋 Rules
1. **WebSocket** เชื่อมต่อเมื่อเข้าหน้า → subscribe room/round → ปิด connection เมื่อออกหน้า
2. **Auto-reconnect** ภายใน 2s ถ้า disconnect (exponential backoff max 30s) — `useWebSocket.ts`
3. **Last-second protection**: ปิดรับแทง `10 วินาทีก่อนออก` (`close_before_sec`) — disable ปุ่ม + โชว์ banner
4. **Countdown** ใช้ server time (sync ครั้งแรก) — ไม่ trust เวลา client
5. **Shoot list** (เลขที่ยิง) ต้อง append อัตโนมัติเมื่อรับ WS event + scroll to bottom (แต่ถ้า user scroll ขึ้นต้องไม่แย่ง)
6. **Total sum** (ผลรวม) update แบบ `CountUp` ทุกครั้งที่ shoot เข้า
7. **Yeekee เปิดอัตโนมัติทุก Agent** (อ้าง `agent_rules.md`) — ไม่มี agent ที่ปิด yeekee
8. **Haptic feedback** สั้นๆ ตอนยิงเลขเข้า (mobile) — อ้าง `mobile_gestures.md`

## 🎨 UI Spec
- Layout: header (countdown + รอบ) → shoot list scroll → bet slip ล่าง
- **Countdown**:
  - > 60s: หลักนาที สีเขียว
  - 10-60s: สีเหลือง + pulse
  - < 10s: สีแดง + shake + overlay "ปิดรับแล้ว"
- **Shoot item**: tp+bt+เลข, timestamp, animate fade-in
- **Connection indicator**: dot ขวาบน (เขียว=online, เหลือง=reconnecting, แดง=offline)

## 🔄 User Flow
1. เข้า `/yeekee/room` → ดึง `yeekeeApi.getRounds`
2. เลือกห้อง → เข้า `/yeekee/play` → open WebSocket
3. รับ event `shoot.new` → append list + update total
4. รับ event `round.close` → ปิดรับ, แสดงผล, นับถอยหลังรอบถัดไป
5. แทงปกติ (flow เดียวกับ `betting_ui.md`) + guard 10s cut-off

## 🌐 API Calls
- `GET /api/v1/yeekee/rounds`
- `GET /api/v1/yeekee/:id/shoots`
- WS: `wss://<api>/ws/yeekee/:round_id` — API rule: `../../../lotto-standalone-member-api/docs/rules/yeekee_ws.md`

## ⚠️ Edge Cases
- **WS disconnect** ระหว่างเล่น: banner สีเหลือง "กำลังเชื่อมต่อใหม่..." + polling fallback ทุก 3s
- **Clock drift**: ถ้าต่าง > 3s → ดึง server time ใหม่
- **Tab background**: pause auto-scroll แต่ยัง receive events (เก็บใน buffer)
- **Bet ที่ 10s สุดท้าย**: backend จะ reject — frontend ต้องไม่ส่งตั้งแต่แรก
- **Round skip**: ถ้า round.close ก่อนหน้าไม่ถึง → sync state ใหม่

## 🔗 Source of Truth (file:line)
- Room: `src/app/(member)/yeekee/room/page.tsx:1`
- Play: `src/app/(member)/yeekee/play/page.tsx`
- WS hook: `src/hooks/useWebSocket.ts:1`
- Countdown component: `src/components/countdown/` (🚧 empty — ต้องสร้าง)
- Yeekee components: `src/components/yeekee/` (🚧 empty)
- API: `../../../lotto-standalone-member-api/docs/rules/yeekee_ws.md`

## 📝 Change Log
- 2026-04-20: Initial — บันทึก last-second protection + WS auto-reconnect
