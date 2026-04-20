// Component: OverviewTab — referral overview (commission rates + link + share + stats + analytics + custom code)
// Parent: src/app/(member)/referral/page.tsx

import { Copy, BarChart3, QrCode, Edit3, MessageSquare, Check } from 'lucide-react'
import Link from 'next/link'
import Loading from '@/components/Loading'
import type { ReferralInfo, ReferralAnalytics, ShareTemplate } from '@/lib/api'
import { SHARE_PLATFORMS, shareUrl } from './SocialIcons'

export interface OverviewTabProps {
  loading: boolean
  info: ReferralInfo | null
  refLink: string
  copied: boolean
  onCopy: () => void
  onShare: (platform: string) => void
  analytics: ReferralAnalytics | null
  analyticsLoading: boolean
  shareTemplates: ShareTemplate[]
  templateCopied: number | null
  onCopyTemplate: (tpl: ShareTemplate) => void
  username?: string
  customCodeInput: string
  setCustomCodeInput: (v: string) => void
  customCodeSaving: boolean
  customCodeMsg: string
  customCodeErr: string
  onSetCustomCode: () => void
}

export function OverviewTab(props: OverviewTabProps) {
  const {
    loading, info, refLink, copied, onCopy, onShare,
    analytics, analyticsLoading,
    shareTemplates, templateCopied, onCopyTemplate, username,
    customCodeInput, setCustomCodeInput, customCodeSaving, customCodeMsg, customCodeErr, onSetCustomCode,
  } = props

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Commission Rates */}
      <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
        <p style={{ fontSize: 13, color: 'var(--ios-secondary-label)', marginBottom: 10 }}>อัตราค่าคอมมิชชั่น</p>
        {loading ? (
          <Loading inline />
        ) : info?.commission_rates.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {info.commission_rates.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: 'var(--ios-label)' }}>{r.lottery_type || 'ทุกประเภทหวย'}</span>
                <span style={{
                  fontSize: 14, fontWeight: 700,
                  background: 'color-mix(in srgb, var(--accent-color) 10%, transparent)', color: 'var(--accent-color)',
                  padding: '2px 10px', borderRadius: 20,
                }}>{r.rate}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 14, color: 'var(--accent-color)', fontWeight: 700 }}>0.5% (default)</p>
        )}
      </div>

      {/* ลิงก์เชิญเพื่อน */}
      <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ios-label)' }}>ลิงก์เชิญเพื่อน</p>
          <Link href="/referral/commissions" style={{ fontSize: 13, color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 500 }}>
            เงื่อนไขรายได้
          </Link>
        </div>

        <p style={{ fontSize: 13, color: 'var(--ios-secondary-label)', lineHeight: 1.5, marginBottom: 12 }}>
          ชวนเพื่อนง่ายๆ แค่แชร์ลิงก์ รับค่าคอมทุกวัน ทุกการเดิมพันหวยของเพื่อน
        </p>

        <div style={{
          background: 'var(--ios-bg)', borderRadius: 10, padding: '10px 12px',
          fontSize: 13, color: 'var(--ios-secondary-label)', fontFamily: 'monospace',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 10,
        }}>
          {refLink || '...'}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onCopy}
            style={{
              flex: 1, padding: '12px', borderRadius: 10,
              background: copied ? 'var(--accent-color)' : 'var(--header-bg)',
              color: 'white', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Copy size={16} strokeWidth={2} />
            {copied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}
          </button>
        </div>

        {refLink && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            marginTop: 14, padding: '12px', background: 'white', borderRadius: 12,
          }}>
            <QrCode size={16} strokeWidth={2} style={{ color: '#333', marginBottom: 6 }} />
            <p style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>สแกน QR Code เพื่อสมัคร</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(refLink)}&size=180x180&bgcolor=ffffff&color=000000`}
              alt="Referral QR Code"
              width={180}
              height={180}
              style={{ borderRadius: 8 }}
            />
          </div>
        )}
      </div>

      {/* Share Templates / Fallback buttons */}
      <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
        {shareTemplates.length > 0 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <MessageSquare size={16} strokeWidth={2} style={{ color: 'var(--accent-color)' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ios-label)' }}>ข้อความสำเร็จรูป</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {shareTemplates.map(tpl => (
                <div
                  key={tpl.id}
                  style={{
                    background: 'var(--ios-bg)', borderRadius: 10, padding: '10px 12px',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-color)', marginBottom: 3 }}>
                      {tpl.name} {tpl.platform && `(${tpl.platform})`}
                    </p>
                    <p style={{
                      fontSize: 12, color: 'var(--ios-secondary-label)', lineHeight: 1.5,
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {tpl.content
                        .replace(/\{link\}/g, refLink || '...')
                        .replace(/\{code\}/g, info?.link.code || '...')
                        .replace(/\{username\}/g, username || '...')}
                    </p>
                  </div>
                  <button
                    onClick={() => onCopyTemplate(tpl)}
                    style={{
                      flexShrink: 0, background: templateCopied === tpl.id ? 'var(--accent-color)' : 'var(--header-bg)',
                      color: 'white', border: 'none', borderRadius: 8,
                      padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    {templateCopied === tpl.id ? <Check size={14} /> : <Copy size={14} />}
                    {templateCopied === tpl.id ? 'คัดลอกแล้ว' : 'คัดลอก'}
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {SHARE_PLATFORMS.map(p => (
              <button
                key={p.key}
                onClick={() => { void shareUrl; onShare(p.key) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '11px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: typeof p.bg === 'string' && p.bg.startsWith('linear') ? p.bg : p.bg,
                  color: 'white', fontSize: 13, fontWeight: 600,
                  transition: 'opacity 0.15s',
                }}
              >
                {p.icon}
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--ios-label)' }}>ภาพรวม</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'จำนวนสมาชิก', value: loading ? '...' : String(info?.stats.total_referred ?? 0), color: 'var(--ios-blue)' },
            { label: 'สมาชิก Active', value: loading ? '...' : String(info?.stats.active_referred ?? 0), color: 'var(--accent-color)' },
            { label: 'รายได้ทั้งหมด', value: loading ? '...' : `฿${(info?.stats.total_comm ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`, color: 'var(--ios-orange)' },
            { label: 'รอถอน', value: loading ? '...' : `฿${(info?.stats.pending_comm ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`, color: 'var(--ios-red)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--ios-bg)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--ios-secondary-label)', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Section */}
      <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <BarChart3 size={16} strokeWidth={2} style={{ color: 'var(--accent-color)' }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ios-label)' }}>สถิติลิงก์ (7 วัน)</p>
        </div>

        {analyticsLoading ? (
          <Loading inline />
        ) : analytics ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
              <div style={{ background: 'var(--ios-bg)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ios-blue)' }}>{analytics.summary.total_clicks}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-secondary-label)', marginTop: 2 }}>คลิกทั้งหมด</div>
              </div>
              <div style={{ background: 'var(--ios-bg)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-color)' }}>{analytics.summary.total_registrations}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-secondary-label)', marginTop: 2 }}>สมัครแล้ว</div>
              </div>
              <div style={{ background: 'var(--ios-bg)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ios-orange)' }}>{analytics.summary.conversion_rate}%</div>
                <div style={{ fontSize: 11, color: 'var(--ios-secondary-label)', marginTop: 2 }}>อัตราแปลง</div>
              </div>
            </div>

            {analytics.daily.length > 0 && (() => {
              const maxClicks = Math.max(...analytics.daily.map(d => d.clicks), 1)
              const barMaxHeight = 80
              return (
                <div>
                  <p style={{ fontSize: 12, color: 'var(--ios-secondary-label)', marginBottom: 8 }}>คลิกรายวัน</p>
                  <div style={{
                    display: 'flex', alignItems: 'flex-end', gap: 4,
                    height: barMaxHeight + 24,
                  }}>
                    {analytics.daily.map((day, i) => {
                      const h = Math.max((day.clicks / maxClicks) * barMaxHeight, 2)
                      const dateLabel = day.date.slice(-2)
                      return (
                        <div
                          key={i}
                          style={{
                            flex: 1, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'flex-end',
                          }}
                        >
                          <span style={{ fontSize: 10, color: 'var(--ios-secondary-label)', marginBottom: 2 }}>
                            {day.clicks}
                          </span>
                          <div style={{
                            width: '100%', maxWidth: 36,
                            height: h, borderRadius: 4,
                            background: 'linear-gradient(180deg, var(--accent-color), color-mix(in srgb, var(--accent-color) 50%, transparent))',
                            transition: 'height 0.3s ease',
                          }} />
                          <span style={{ fontSize: 10, color: 'var(--ios-tertiary-label)', marginTop: 4 }}>
                            {dateLabel}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--ios-secondary-label)', textAlign: 'center', padding: '10px 0' }}>
            ไม่มีข้อมูลสถิติ
          </p>
        )}
      </div>

      {/* Custom Code Section */}
      <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Edit3 size={16} strokeWidth={2} style={{ color: 'var(--accent-color)' }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ios-label)' }}>ตั้งโค้ดแนะนำ</p>
        </div>

        {info?.link.code && (
          <div style={{
            background: 'color-mix(in srgb, var(--accent-color) 8%, transparent)', borderRadius: 8, padding: '8px 12px',
            marginBottom: 10, fontSize: 13, color: 'var(--accent-color)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Check size={14} />
            <span>โค้ดปัจจุบัน: <strong>{info.link.code}</strong></span>
          </div>
        )}

        <p style={{ fontSize: 12, color: 'var(--ios-secondary-label)', marginBottom: 8, lineHeight: 1.5 }}>
          กฎ: 4-20 ตัวอักษร, ใช้ได้ a-z A-Z 0-9 - _ เท่านั้น
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={customCodeInput}
            onChange={e => setCustomCodeInput(e.target.value)}
            placeholder="เช่น JOHN2024"
            maxLength={20}
            style={{
              flex: 1, background: 'var(--ios-bg)', border: 'none', borderRadius: 10,
              padding: '10px 12px', fontSize: 14, color: 'var(--ios-label)', outline: 'none',
            }}
          />
          <button
            onClick={onSetCustomCode}
            disabled={customCodeSaving || !customCodeInput.trim()}
            style={{
              padding: '10px 16px', borderRadius: 10,
              background: customCodeSaving ? 'var(--ios-secondary-label)' : 'var(--header-bg)',
              color: 'white', fontSize: 13, fontWeight: 600, border: 'none',
              cursor: customCodeSaving ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {customCodeSaving ? 'กำลังบันทึก...' : 'ตั้งโค้ด'}
          </button>
        </div>

        {customCodeErr && (
          <div style={{ background: 'rgba(255,59,48,0.08)', color: 'var(--ios-red)', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginTop: 8 }}>
            {customCodeErr}
          </div>
        )}
        {customCodeMsg && (
          <div style={{ background: 'color-mix(in srgb, var(--accent-color) 8%, transparent)', color: 'var(--accent-color)', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginTop: 8 }}>
            {customCodeMsg}
          </div>
        )}
      </div>

    </div>
  )
}
