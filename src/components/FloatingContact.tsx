/**
 * FloatingContact — ปุ่มลอยขวาล่าง กดแล้วแสดงช่องทางติดต่อจากหลังบ้าน
 *
 * ตำแหน่ง: fixed ขวาล่าง เหนือ BottomNav (bottom: 80px)
 * กดแล้ว: popup แสดงช่องทางติดต่อที่ admin สร้างไว้ (LINE, Telegram, Facebook, Phone, etc.)
 * Data: GET /api/v1/contact-channels (public)
 */

'use client'

import { useEffect, useState } from 'react'
import { Headphones, X, MessageCircle, Send, Phone, Globe, Mail, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'

// ⭐ Module-level cache — ช่องทางติดต่อแทบไม่เปลี่ยน cache ไว้จนกว่ารีเฟรช
let channelsCache: ContactChannel[] | null = null

// ไอคอนตาม platform
const PLATFORM_CONFIG: Record<string, { icon: typeof MessageCircle; color: string; label: string }> = {
  line:      { icon: MessageCircle, color: '#06C755', label: 'LINE' },
  telegram:  { icon: Send,          color: '#0088cc', label: 'Telegram' },
  facebook:  { icon: Globe,         color: '#1877F2', label: 'Facebook' },
  whatsapp:  { icon: Phone,         color: '#25D366', label: 'WhatsApp' },
  phone:     { icon: Phone,         color: '#34C759', label: 'โทรศัพท์' },
  email:     { icon: Mail,          color: '#FF9500', label: 'Email' },
  website:   { icon: Globe,         color: '#3b82f6', label: 'เว็บไซต์' },
  other:     { icon: MessageCircle, color: '#888',    label: 'ติดต่อ' },
}

interface ContactChannel {
  id: number; platform: string; name: string; value: string
  link_url: string; icon_url: string; sort_order: number
}

export default function FloatingContact({ bottom = 80 }: { bottom?: number } = {}) {
  const [open, setOpen] = useState(false)
  const [channels, setChannels] = useState<ContactChannel[]>([])
  const [loaded, setLoaded] = useState(false)

  // โหลดช่องทางติดต่อเมื่อเปิด popup ครั้งแรก (lazy load + module cache)
  useEffect(() => {
    if (!open || loaded) return
    if (channelsCache) {
      setChannels(channelsCache)
      setLoaded(true)
      return
    }
    api.get('/contact-channels')
      .then(res => {
        const data = res.data.data || []
        channelsCache = data
        setChannels(data)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [open, loaded])

  return (
    <>
      {/* ===== ปุ่มลอย — ขวาล่าง เหนือ BottomNav ===== */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="ติดต่อเรา"
        style={{
          position: 'fixed',
          right: 16,
          bottom, // เหนือ BottomNav (60px) + gap — ปรับได้ผ่าน prop
          zIndex: 90,
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--ios-green)',
          color: 'white', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          transition: 'transform 0.2s, background 0.2s',
          transform: open ? 'rotate(90deg)' : 'none',
        }}
      >
        {open ? <X size={24} strokeWidth={2.5} /> : <Headphones size={24} strokeWidth={2} />}
      </button>

      {/* ===== Popup ช่องทางติดต่อ ===== */}
      {open && (
        <>
          {/* Backdrop — กดพื้นหลังปิด */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 89,
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)',
            }}
          />

          {/* Card — โผล่จากขวาล่าง */}
          <div style={{
            position: 'fixed',
            right: 16,
            bottom: bottom + 60, // เหนือปุ่มลอย
            zIndex: 91,
            width: 280,
            background: 'var(--ios-card)',
            borderRadius: 16,
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
            overflow: 'hidden',
            animation: 'slideUp 0.2s ease-out',
          }}>
            {/* Header */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '0.5px solid var(--ios-separator)',
            }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ios-label)' }}>ติดต่อเรา</p>
              <p style={{ fontSize: 12, color: 'var(--ios-tertiary-label)', marginTop: 2 }}>เลือกช่องทางที่สะดวก</p>
            </div>

            {/* Channel list */}
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {!loaded ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--ios-secondary-label)', fontSize: 13 }}>
                  กำลังโหลด...
                </div>
              ) : channels.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--ios-secondary-label)', fontSize: 13 }}>
                  ยังไม่มีช่องทางติดต่อ
                </div>
              ) : (
                channels.map((ch, idx) => {
                  const config = PLATFORM_CONFIG[ch.platform] || PLATFORM_CONFIG.other
                  const Icon = config.icon
                  const href = ch.link_url || (ch.platform === 'phone' ? `tel:${ch.value}` : ch.platform === 'email' ? `mailto:${ch.value}` : '#')

                  return (
                    <a
                      key={ch.id}
                      href={href}
                      target={ch.platform !== 'phone' && ch.platform !== 'email' ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      onClick={() => { if (href === '#') { navigator.clipboard.writeText(ch.value).catch(() => {}) } }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px',
                        borderBottom: idx < channels.length - 1 ? '0.5px solid var(--ios-separator)' : 'none',
                        textDecoration: 'none', color: 'inherit',
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* ไอคอน platform */}
                      <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: config.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', flexShrink: 0,
                      }}>
                        <Icon size={20} strokeWidth={2} />
                      </div>

                      {/* ข้อมูล */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ios-label)' }}>
                          {ch.name || config.label}
                        </p>
                        <p style={{
                          fontSize: 12, color: 'var(--ios-secondary-label)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {ch.value}
                        </p>
                      </div>

                      <ExternalLink size={14} strokeWidth={2} style={{ color: 'var(--ios-tertiary-label)', flexShrink: 0 }} />
                    </a>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* Animation keyframes */}
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
