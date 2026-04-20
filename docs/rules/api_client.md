# API Client — Axios Setup / Interceptor / Error Handling

> Last updated: 2026-04-20
> Related code: `src/lib/api.ts:1`

## 🎯 Purpose
Axios client กลางของ member frontend — จัดการ base URL, CSRF, agent domain, JWT/cookie auth, error interceptor, และ in-memory cache

## 📋 Rules
1. **Base URL** ใช้ relative `/api/v1` — Next.js rewrites proxy ไป backend (same-origin สำหรับ httpOnly cookie)
2. **Auth** ใช้ **httpOnly cookie** (ไม่ใช่ localStorage token) — `withCredentials: true`
3. **CSRF**: อ่าน `csrf_token` cookie → แนบ `X-CSRF-Token` header ทุก request
4. **Agent domain**: แนบ `X-Agent-Domain` จาก `NEXT_PUBLIC_AGENT_DOMAIN` (สำหรับ multi-agent 300+ เว็บ)
5. **401 interceptor** → clear Zustand persist + redirect `/login` (ยกเว้นถ้าอยู่หน้า login แล้ว)
6. **Timeout** 30s default
7. **Cache layer** (in-memory Map) สำหรับ GET data ที่ไม่เปลี่ยนบ่อย:
   - `CACHE_1MIN` — balance
   - `CACHE_5MIN` — transactions, lotteries, analytics
   - `CACHE_30MIN` — bet types, results, VAPID, share templates
8. **Invalidate cache** ทุกครั้งที่ mutation:
   - หลัง `betApi.placeBets` → invalidate `/wallet`
   - หลัง `referralApi.withdraw` → invalidate `/wallet` + `/referral`
9. **Clear cache** หลัง login/logout — `clearApiCache()`
10. **ห้าม import axios โดยตรง** ใน component/page — ใช้ `api` หรือ xxxApi

## 🎨 Contract Structure
ทุก response ควรมี shape:
```ts
{ success: boolean; data: T; message?: string }
```
หรือสำหรับ paginated:
```ts
{ success: boolean; data: T[]; meta: { page, per_page, total, total_pages } }
```

## 🔄 Request Flow
1. component call `xxxApi.yyy()`
2. interceptor แนบ CSRF + agent domain
3. browser ส่ง httpOnly cookie อัตโนมัติ
4. response: ถ้า 401 → redirect, 2xx → return, อื่นๆ → throw สำหรับ component catch
5. component แสดง toast error หรือ resultAlert

## 🌐 API Calls (groups ใน `src/lib/api.ts`)
- `authApi` — login/register/logout/refresh
- `memberApi` — profile
- `lotteryApi` — types/rounds/bet-types
- `betApi` — placeBets/checkNumbers/getMyBets
- `resultApi` — getResults
- `walletApi` — balance/transactions
- `yeekeeApi` — rounds/shoots
- `referralApi` — info/commissions/withdraw/leaderboard/analytics/custom-code/notifications/share-templates
- `notificationApi` — list/unread-count/read/push

API contract หลัก: `../../../lotto-standalone-member-api/docs/rules/`

## ⚠️ Edge Cases
- **Cookie ถูก block** (3rd party): dev ต้อง same-origin; prod ต้องมี reverse proxy
- **Clock skew**: ถ้า cookie expire เพราะ clock drift → interceptor redirect login
- **Network error**: reject ให้ component catch + แสดง toast "เชื่อมต่อไม่ได้"
- **Retry**: ไม่ทำ auto retry (ยกเว้น idempotent GET + user pull-to-refresh)
- **Race condition** cache: ถ้า 2 request ยิงพร้อมกัน key เดียว → ทั้งคู่ hit network (ไม่ coalesce) — acceptable
- **SSR**: `getCookie` return null ถ้า `document` undefined — ต้อง guard

## 🔗 Source of Truth (file:line)
- Client: `src/lib/api.ts:1`
- Interceptor request: `src/lib/api.ts:48`
- Interceptor response: `src/lib/api.ts:62`
- Cache: `src/lib/api.ts:93`
- Middleware auth: `src/middleware.ts`
- Store: `src/store/` (Zustand)
- Types: `src/types/`
- API rules: `../../../lotto-standalone-member-api/docs/rules/`

## 📝 Change Log
- 2026-04-20: Initial — บันทึก cookie auth + CSRF + agent domain + cache layer
