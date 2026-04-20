// Component: ProfileHeaderCard — avatar + level badge + balance (premium gradient card)
// Parent: src/app/(member)/profile/page.tsx

import { Shield, Clock, TrendingUp } from 'lucide-react'
import { resolveImageUrl } from '@/lib/imageUrl'
import type { MemberLevelInfo } from '@/lib/api'

export interface ProfileHeaderCardProps {
  username?: string
  avatarUrl?: string
  balance: number
  joinDate: string
  levelInfo: MemberLevelInfo | null
  avatarUploading: boolean
  onAvatarFileSelect: (file: File) => void
}

export function ProfileHeaderCard({
  username, avatarUrl, balance, joinDate, levelInfo, avatarUploading, onAvatarFileSelect,
}: ProfileHeaderCardProps) {
  const initial = username?.charAt(0).toUpperCase() || 'U'
  const lv = levelInfo?.current_level
  const badgeColor = lv?.color || 'var(--accent-color)'
  const badgeName = lv?.name?.toUpperCase() || 'MEMBER'

  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 20,
      background: 'var(--card-gradient)',
      padding: '24px 20px 20px',
    }}>
      {/* ลายพื้นหลัง premium */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '30px 30px',
      }} />

      {/* Avatar + Info row */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Avatar — gradient ring + initial/image + upload button */}
        <label
          htmlFor="avatar-upload-input"
          style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, var(--accent-color), color-mix(in srgb, var(--accent-color) 60%, #5AC8FA))`,
            padding: 3, boxShadow: '0 4px 20px color-mix(in srgb, var(--accent-color) 30%, transparent)',
            cursor: avatarUploading ? 'wait' : 'pointer',
            position: 'relative', display: 'block',
          }}
          title="คลิกเพื่อเปลี่ยนรูปโปรไฟล์"
        >
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            background: 'var(--nav-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent-color)', fontSize: 28, fontWeight: 800,
            fontFamily: 'var(--font-geist-sans), sans-serif',
            overflow: 'hidden', position: 'relative',
          }}>
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={resolveImageUrl(avatarUrl)}
                alt="avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            ) : initial}
            {avatarUploading && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: 'white',
              }}>
                กำลังอัพ...
              </div>
            )}
          </div>
          {/* camera badge */}
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 22, height: 22, borderRadius: '50%',
            background: 'var(--accent-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--nav-bg)', fontSize: 11, color: 'white',
          }}>
            ✎
          </div>
          <input
            id="avatar-upload-input"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            style={{ display: 'none' }}
            disabled={avatarUploading}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onAvatarFileSelect(f)
              e.target.value = ''
            }}
          />
        </label>

        {/* User info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: 'white', fontWeight: 700, fontSize: 20, lineHeight: 1.2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {username || 'สมาชิก'}
          </div>
          <div
            title={levelInfo?.locked ? 'ระดับถูกตั้งโดยแอดมิน (ไม่เปลี่ยนอัตโนมัติ)' : 'ระดับคำนวณจากยอดฝาก 30 วันล่าสุด'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              marginTop: 6, padding: '3px 10px', borderRadius: 20,
              background: `color-mix(in srgb, ${badgeColor} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${badgeColor} 40%, transparent)`,
            }}
          >
            <Shield size={11} strokeWidth={2.5} style={{ color: badgeColor }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: badgeColor, letterSpacing: 0.3 }}>
              {badgeName}
            </span>
            {levelInfo?.locked && (
              <span style={{ fontSize: 9, opacity: 0.7, marginLeft: 2 }}>🔒</span>
            )}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} strokeWidth={2} />
            สมาชิกตั้งแต่ {joinDate}
          </div>
        </div>
      </div>

      {/* Balance row */}
      <div style={{
        marginTop: 16, padding: '12px 16px', borderRadius: 14,
        background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginBottom: 2 }}>
            ยอดเงินคงเหลือ
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-color)', fontFamily: 'var(--font-geist-mono), monospace' }}>
            ฿{balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'color-mix(in srgb, var(--accent-color) 15%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent-color) 20%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <TrendingUp size={22} strokeWidth={2} style={{ color: 'var(--accent-color)' }} />
        </div>
      </div>
    </div>
  )
}
