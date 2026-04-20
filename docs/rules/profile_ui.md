# Profile UI

> Last updated: 2026-04-20
> Related code: `src/app/(member)/profile/page.tsx:1`, `src/components/Avatar.tsx:1`

## 🎯 Purpose
หน้าโปรไฟล์สมาชิก — แก้ไขข้อมูลส่วนตัว, upload avatar, เปลี่ยนรหัสผ่าน, ตั้งค่าบัญชีธนาคาร, push notification toggle

## 📋 Rules
1. **Username เปลี่ยนไม่ได้** — readonly + tooltip "ไม่สามารถแก้ไขได้"
2. **เบอร์โทร/ชื่อ/นามสกุล** แก้ได้ แต่ validate format
3. **บัญชีธนาคาร** ต้องตรงกับชื่อ member — ถ้าเปลี่ยนชื่อต้องแจ้ง admin approve (lock หลังตั้งครั้งแรก ตาม config agent)
4. **เปลี่ยนรหัสผ่าน** ต้องใส่รหัสเก่า + ยืนยันใหม่ 2 ครั้ง + ขั้นต่ำ 8 ตัว
5. **Avatar upload**: รองรับ JPG/PNG/WebP ≤ 2MB, crop 1:1 ก่อน upload
6. **Avatar fallback**: ถ้าไม่มี → ใช้ตัวอักษรแรกของ username + สีสุ่ม (seeded) — `Avatar.tsx`
7. **Logout** → confirm modal (ไม่ใช้ `confirm()`) → call `authApi.logout` → clear Zustand + redirect `/login`
8. **Push notification toggle** → อ้าง `push_notification.md`

## 🎨 UI Spec
- Layout: mobile stack (avatar → info → sections)
- **Avatar**: 96 × 96 circle + ปุ่มแก้ไขมุมขวาล่าง
- **Section divider**: `--border-color` 1px + title `title-md`
- **Field row**: label ซ้าย, value ขวา, แตะเพื่อแก้ (bottom sheet)
- **Danger zone**: logout + delete account แยกล่างสุด สีแดง

## 🔄 User Flow (แก้ไขเบอร์)
1. แตะ field "เบอร์โทร" → เปิด bottom sheet input
2. กรอก → validate regex → กดบันทึก
3. `PUT /api/v1/member/profile` → toast success → update Zustand
4. Sheet close

## 🔄 User Flow (upload avatar)
1. แตะปุ่มกล้อง → open file picker
2. เลือกรูป → เปิด crop modal (1:1)
3. ยืนยัน → upload multipart → backend คืน URL
4. Update Avatar component

## 🌐 API Calls
- `GET /api/v1/member/profile`
- `PUT /api/v1/member/profile`
- `POST /api/v1/member/avatar` (multipart)
- `POST /api/v1/member/password`
- `POST /api/v1/auth/logout`
- API rule: `../../../lotto-standalone-member-api/docs/rules/member.md`

## ⚠️ Edge Cases
- **Avatar upload fail**: toast error, คงรูปเดิม
- **Session expired ระหว่างแก้**: redirect login (interceptor)
- **รหัสผ่านเก่าผิด**: toast + shake form
- **เบอร์ซ้ำกับคนอื่น**: backend 409 → toast

## 🔗 Source of Truth (file:line)
- Page: `src/app/(member)/profile/page.tsx:1` (608 lines)
- Avatar: `src/components/Avatar.tsx:1`
- imageUrl util: `src/lib/imageUrl.ts`
- API: `../../../lotto-standalone-member-api/docs/rules/member.md`

## 📝 Change Log
- 2026-04-20: Initial — บันทึก field editable, avatar upload, logout flow
