import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
// ดึง base (เช่น http://localhost:8082) จาก full URL
const API_BASE = API_URL.replace(/\/api\/v1$/, "");

const nextConfig: NextConfig = {
  // ⭐ Proxy /api → backend API (same-origin สำหรับ httpOnly cookie)
  // ทำให้ browser เห็น cookie จาก same port (3001) ไม่ใช่ cross-origin (8082)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
