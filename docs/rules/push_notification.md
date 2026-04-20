# Push Notification — Browser Push + Service Worker

> Last updated: 2026-04-20
> Related code: `src/hooks/usePushNotification.ts:1`, `src/components/NotificationCenter.tsx:1`, `src/components/NotificationPoller.tsx`

## 🎯 Purpose
ระบบ push notification ผ่าน browser Web Push API — แจ้ง bet won, deposit approved, withdraw approved, commission earned, system message

## 📋 Rules
1. **ขอ permission** เฉพาะตอนสมาชิก **กดเปิดจริง** (in profile/settings) — ห้าม popup auto หลัง login
2. **VAPID public key** ดึงจาก `notificationApi.getVAPIDKey` (cache 30m)
3. **Service worker** register ที่ `/sw.js` — ไฟล์ใน `public/`
4. **Subscribe** → ส่ง subscription ไป backend (`notificationApi.subscribePush`)
5. **Unsubscribe** เมื่อ user toggle off หรือ logout (เฉพาะ endpoint ที่ browser นี้)
6. **Fallback polling** ถ้า push ไม่รองรับ → `NotificationPoller.tsx` ดึง unread-count ทุก 30s
7. **NotificationCenter** (bell icon) แสดง list in-app + mark read
8. **Icon** ใน notification ใช้ Lucide name จาก API (`type`): trophy, wallet, gift, percent, bell
9. **ห้าม spam** — rate limit ที่ backend + group same type ภายใน 1 นาที

## 🎨 UI Spec
- **Bell icon** ใน AppHeader → badge unread (จุดแดง + จำนวน)
- **NotificationCenter**: bottom sheet หรือ dropdown (desktop) — list card รายการ
- **Card**: icon + title + message + timestamp + unread dot
- **Permission prompt UI**: modal ใน profile อธิบายก่อนกดขอ permission

## 🔄 User Flow (subscribe)
1. Profile → toggle "รับการแจ้งเตือน" → open prompt modal
2. กดยืนยัน → `Notification.requestPermission()`
3. ถ้า granted → `serviceWorker.register` + `pushManager.subscribe({userVisibleOnly, vapidPublicKey})`
4. `notificationApi.subscribePush(subscription)` → toast success

## 🔄 User Flow (receive)
1. backend fire push → SW receive `push` event
2. SW show notification (`self.registration.showNotification`)
3. user คลิก → SW open URL ที่เกี่ยวข้อง (`/history`, `/wallet`, ฯลฯ)
4. เปิด app → call `notificationApi.list` + mark as read

## 🌐 API Calls
- `GET /api/v1/push/vapid-key`
- `POST /api/v1/push/subscribe`
- `DELETE /api/v1/push/subscribe`
- `GET /api/v1/notifications?page=&per_page=&is_read=`
- `GET /api/v1/notifications/unread-count`
- `POST /api/v1/notifications/:id/read`
- `POST /api/v1/notifications/read-all`
- API rule: `../../../lotto-standalone-member-api/docs/rules/push.md`, `notifications.md`

## ⚠️ Edge Cases
- **iOS Safari < 16.4**: ไม่รองรับ Web Push → ซ่อน toggle + โชว์ข้อความ
- **Permission denied**: โชว์คำแนะนำเปิดใน browser settings (ไม่ขอซ้ำ)
- **Subscription expired**: SW detect `pushsubscriptionchange` → re-subscribe อัตโนมัติ
- **Multi-device**: 1 member มีหลาย subscription — backend จัดการแยก endpoint
- **Logout**: unsubscribe เฉพาะ device นี้ (อย่า delete ของ device อื่น)

## 🔗 Source of Truth (file:line)
- Hook: `src/hooks/usePushNotification.ts:1`
- Center: `src/components/NotificationCenter.tsx:1`
- Poller fallback: `src/components/NotificationPoller.tsx`
- Service worker: `public/sw.js` (🚧 ต้องตรวจว่ามี — ถ้าไม่มีสร้าง)
- API client: `src/lib/api.ts:356` (notificationApi)
- API contract: `../../../lotto-standalone-member-api/docs/rules/push.md`

## 📝 Change Log
- 2026-04-20: Initial — บันทึก subscribe flow + fallback polling + iOS caveat
