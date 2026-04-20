/**
 * Auth API — login / register / logout / refresh
 * Backend: lotto-standalone-member-api `/api/v1/auth/*`
 */
import { api } from './_client'
import type { LoginRequest, RegisterRequest, AuthResponse } from '@/types'

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data),

  /** Logout — ลบ httpOnly cookie ที่ backend */
  logout: () =>
    api.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refresh_token: refreshToken }),
}
