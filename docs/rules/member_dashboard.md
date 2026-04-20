# Member Dashboard

> Last updated: 2026-04-21 (v2 — refactor: page split into components/dashboard/*)
> Related code:
>   - `src/app/(member)/dashboard/page.tsx` (107 LOC — orchestrator)
>   - `src/components/dashboard/BalanceCard.tsx` — hero balance card + refresh + ฝาก/ถอน
>   - `src/components/dashboard/MenuGrid.tsx` — 4×2 menu circles (grouped: primary/deposit/withdraw/other)
>   - `src/components/dashboard/FeaturedLotteries.tsx` — 6 featured lotteries + DashboardCountdown
>   - `src/components/dashboard/LatestResults.tsx` — 3 ผลรางวัลล่าสุด (cards)
>   - `src/components/layout/AppHeader.tsx`, `BottomNav.tsx`

## 🎯 Purpose
หน้าหลักหลัง login — โชว์ยอดเงิน, quick actions (ฝาก/ถอน/แทง), หวยที่กำลังเปิด, และ promo banner

## 📋 Rules
1. **Balance** ต้องโชว์ `CountUp` animation เมื่อยอดเปลี่ยน (`src/components/CountUp.tsx`)
2. **Refresh balance** — pull-to-refresh + auto refresh ทุก 60s (cache TTL 1min ใน `walletApi.getBalance`)
3. **Quick actions** อย่างน้อย: ฝาก, ถอน, แทงหวย, ยี่กี, ประวัติ
4. **Lotteries open**: โชว์เฉพาะประเภทที่ agent เปิด (config-driven)
5. **Yeekee countdown**: ทุก card ต้องมี countdown real-time — อ้าง `yeekee_live_ui.md`
6. **BottomNav** sticky ล่าง 5 ปุ่ม (Home, แทง, กระเป๋า, โปรไฟล์, อื่นๆ) — ซ่อนเมื่อ scroll ลง (optional)
7. **ContactFloat** มุมล่างขวา (เหนือ BottomNav)

## 🎨 UI Spec
- **Hero card** (balance) ด้านบน — gradient `--accent-color` → dark
- **Quick actions grid** 4 คอลัมน์ (mobile), 6 (sm+)
- **Lottery list** card แนวนอน scroll แบบ horizontal snap (mobile)
- **Promo banner** ใต้ balance — reuse `BannerCarousel`
- **Safe area**: padding-bottom = `env(safe-area-inset-bottom) + 64px` (BottomNav height)

## 🔄 User Flow
1. เข้า `/dashboard` → `AuthGuard` เช็ค session
2. ดึง parallel: `walletApi.getBalance`, `lotteryApi.getTypes`, `yeekeeApi.getRounds`, `memberApi.getProfile`
3. Render skeleton ระหว่างโหลด → fade-in เมื่อครบ
4. Pull-to-refresh → invalidate cache → fetch ใหม่
5. กด lottery card → `/lottery/[type]`

## 🌐 API Calls
- `GET /api/v1/wallet/balance` — `../../../lotto-standalone-member-api/docs/rules/wallet.md`
- `GET /api/v1/lotteries` — `../../../lotto-standalone-member-api/docs/rules/lottery.md`
- `GET /api/v1/yeekee/rounds`
- `GET /api/v1/member/profile`
- `GET /api/v1/notifications/unread-count` — badge

## ⚠️ Edge Cases
- **Balance -1/error**: โชว์ "—" แทน 0 (ไม่ทำให้ผู้ใช้เข้าใจผิด)
- **ไม่มีหวยเปิด**: `EmptyState` "ยังไม่มีหวยที่เปิดรับ"
- **Offline**: banner "ออฟไลน์" ด้านบน + ใช้ cache ล่าสุด
- **Token expired ระหว่าง refresh**: axios interceptor redirect `/login`

## 🔗 Source of Truth (file:line)
- Page: `src/app/(member)/dashboard/page.tsx:1`
- Header: `src/components/layout/AppHeader.tsx:1`
- BottomNav: `src/components/layout/BottomNav.tsx:1`
- SideMenu: `src/components/layout/SideMenu.tsx`
- CountUp: `src/components/CountUp.tsx`
- ContactFloat: `src/components/ContactFloat.tsx`
- API: `../../../lotto-standalone-member-api/docs/rules/wallet.md`

## 🧱 File structure (post-refactor, Tier A)
- `page.tsx` = orchestrator — state (lotteries/results/banners/refreshing) + fetch + compose sections
- Each section is a standalone component — `BalanceCard` / `MenuGrid` / `FeaturedLotteries` / `LatestResults`
- `MenuGrid` = static config (items + group-styles mapping inside); no data fetching
- `FeaturedLotteries` = receives `lotteries[]`, filters by `FEATURED_CODES` locally; includes its own `DashboardCountdown` helper

> **Rule**: page.tsx ต้อง ≤ 300 LOC. Section ใหม่ → สร้าง component ใน `components/dashboard/`, import เข้า page

## 📝 Change Log
- 2026-04-20: Initial — บันทึก layout, quick actions, refresh policy
- 2026-04-21: v2 refactor — split page (408→107 LOC) + extract BalanceCard / MenuGrid / FeaturedLotteries / LatestResults
