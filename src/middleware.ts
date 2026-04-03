/**
 * Next.js Middleware — Route Guard + Security Headers
 *
 * ป้องกันเข้าหน้า member โดยไม่ login:
 * - ถ้าไม่มี access_token httpOnly cookie → redirect ไป /login
 * - ถ้ามี token แล้วเข้า /login → redirect ไป /dashboard
 *
 * ⭐ httpOnly cookie ถูก set โดย backend (member-api)
 * middleware เช็คแค่ว่า cookie มีหรือไม่ (API จะ verify จริง)
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// หน้าที่ไม่ต้อง auth (public) — นอกนี้ทั้งหมดต้อง login
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/contact']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ข้ามไฟล์ static + api routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.includes('.')
  ) {
    return addSecurityHeaders(NextResponse.next())
  }

  // ⭐ เช็คว่ามี httpOnly cookie (access_token) หรือไม่
  const token = request.cookies.get('access_token')?.value

  const isPublicPath = pathname === '/' || PUBLIC_PATHS.some(p => pathname.startsWith(p))

  // ⭐ ถ้าไม่ใช่หน้า public + ไม่มี token → redirect ไป login
  if (!isPublicPath && !token) {
    return addSecurityHeaders(
      NextResponse.redirect(new URL('/login', request.url))
    )
  }

  return addSecurityHeaders(NextResponse.next())
}

/** เพิ่ม Security Headers ทุก response */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // ป้องกัน MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  // ป้องกัน clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  // XSS filter (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block')
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  // CSP — ป้องกัน inline script injection
  // CSP: อนุญาต unsafe-eval + unsafe-inline สำหรับ Next.js (Turbopack dev)
  // ws:/wss: สำหรับ HMR + WebSocket (ยี่กี)
  // production ควรใช้ nonce-based CSP แทน unsafe-inline
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: http: https:; font-src 'self' data:; connect-src 'self' ws://localhost:* wss://localhost:* http://localhost:* https:; frame-ancestors 'none'"
  )
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
