# Design System — Color / Spacing / Typography

> Last updated: 2026-04-20
> Related code: `src/app/globals.css`, `src/components/ThemeProvider.tsx`

## 🎯 Purpose
Design tokens ของ frontend — อ้างอิงจาก redesign เจริญดี88 (dark theme + gold accent) — ทุก component ต้องใช้ CSS variable ไม่ hard-code สี

## 📋 Rules
1. **ห้ามใช้สี hex แบบ hard-code** — ต้องอ้าง `var(--xxx)` ใน `globals.css`
2. **Theme**: dark เป็น default (เจริญดี88 style), รองรับ light ในอนาคต
3. **Mobile-first spacing**: 4 / 8 / 12 / 16 / 20 / 24 / 32 (step 4px)
4. **Border-radius**: 8 (card inside), 12 (card), 16 (modal), 999 (pill/avatar)
5. **ทุกแอนิเมชัน** respect `prefers-reduced-motion` — ถ้าเปิดต้อง fallback เป็น opacity/instant
6. **Typography**: Thai-friendly font — รองรับ `ก-๙` แบบไม่ตัวเล็กเกิน

## 🎨 Tokens

### Colors (CSS vars อยู่ใน `src/app/globals.css`)
- `--accent-color` — gold/yellow primary action
- `--ios-red` — error / destructive
- `--bg-color` — dark background
- `--card-bg` — card surface
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--border-color`

### Status colors
- success: green (`--success`)
- warning: amber (`--warning`)
- error: `--ios-red`
- info: blue (`--info`)

### Spacing
| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 12px |
| lg | 16px |
| xl | 24px |
| 2xl | 32px |

### Typography scale (mobile)
- `title-xl` 24px / bold — หน้า dashboard header
- `title-lg` 20px / bold — section header
- `title-md` 17px / semibold — card header
- `body` 15px / regular
- `caption` 13px / regular
- `tiny` 11px / regular — timestamp

### Breakpoints (mobile-first)
- base: 0–640 (mobile)
- `sm:` 640+
- `md:` 768+
- `lg:` 1024+ (desktop)

## 🔄 Usage
```tsx
<div style={{ background: 'var(--card-bg)', padding: 16, borderRadius: 12 }}>
```

## 🌐 API Calls
ไม่มี

## ⚠️ Edge Cases
- **Banner image**: ถ้ารูป fail → fallback placeholder (อย่าโชว์ broken image)
- **High DPI**: ใช้ `@2x`/webp สำหรับ banner
- **Tailwind v4**: ใช้ `@tailwindcss/postcss` — sync token กับ CSS var ใน `globals.css`

## 🔗 Source of Truth (file:line)
- Globals: `src/app/globals.css`
- Theme: `src/components/ThemeProvider.tsx`
- Tailwind config: `postcss.config.mjs`
- Memory note: `ui_redesign_plan.md`

## 📝 Change Log
- 2026-04-20: Initial — ตั้ง token ตาม redesign เจริญดี88 (dark + gold)
