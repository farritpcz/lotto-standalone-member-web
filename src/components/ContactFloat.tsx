/**
 * ContactFloat — ปุ่มลอยขวาล่าง + หน้าข้อมูลติดต่อ
 *
 * - ปุ่มกลมสีเขียว มี icon headset
 * - กดแล้วเปิด panel slide-up แสดงช่องทางติดต่อทั้งหมด
 * - ดึงข้อมูลจาก API: GET /api/v1/public/contact-channels
 */
'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, X, ExternalLink, Phone, Send, Mail, Globe } from 'lucide-react'

interface ContactChannel {
  id: number; platform: string; name: string; value: string; link_url: string
}

const platformConfig: Record<string, { icon: React.ComponentType<{size?: number; color?: string}>; color: string; bg: string }> = {
  line:      { icon: MessageCircle, color: '#06C755', bg: 'rgba(6,199,85,0.1)' },
  telegram:  { icon: Send,          color: '#0088cc', bg: 'rgba(0,136,204,0.1)' },
  facebook:  { icon: Globe,         color: '#1877F2', bg: 'rgba(24,119,242,0.1)' },
  whatsapp:  { icon: Phone,         color: '#25D366', bg: 'rgba(37,211,102,0.1)' },
  phone:     { icon: Phone,         color: '#34C759', bg: 'rgba(52,199,89,0.1)' },
  email:     { icon: Mail,          color: '#FF9500', bg: 'rgba(255,149,0,0.1)' },
  website:   { icon: Globe,         color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  other:     { icon: MessageCircle,  color: '#888',    bg: 'rgba(136,136,136,0.1)' },
}

export default function ContactFloat() {
  const [open, setOpen] = useState(false)
  const [channels, setChannels] = useState<ContactChannel[]>([])

  useEffect(() => {
    // ดึงจาก admin-api public endpoint
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:8081'
    fetch(`${adminUrl}/api/v1/public/contact-channels`)
      .then(r => r.json())
      .then(d => setChannels(d.data || []))
      .catch(() => {
        // fallback mock
        setChannels([
          { id: 1, platform: 'line', name: 'LINE Official', value: '@lotto-official', link_url: '#' },
          { id: 2, platform: 'telegram', name: 'Telegram', value: '@lotto_support', link_url: '#' },
        ])
      })
  }, [])

  if (channels.length === 0) return null

  return (
    <>
      {/* ── Floating Button ────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 76,
          right: 16,
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #0d6e6e, #34d399)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(13,110,110,0.4)',
          zIndex: 90,
          animation: 'pulse-contact 2s infinite',
        }}
      >
        <MessageCircle size={24} color="white" fill="white" />
      </button>

      {/* ── Contact Panel (slide-up) ───────────────────── */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 250 }} onClick={() => setOpen(false)}>
          {/* Overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />

          {/* Panel */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              maxWidth: 480, margin: '0 auto',
              background: 'white', borderRadius: '20px 20px 0 0',
              padding: '20px 16px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
              animation: 'slideUp 0.25s ease',
              maxHeight: '70vh', overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a3d35' }}>ติดต่อเรา</div>
                <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>เลือกช่องทางที่สะดวก</div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} color="#888" />
              </button>
            </div>

            {/* Channel list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {channels.map(ch => {
                const cfg = platformConfig[ch.platform] || platformConfig.other
                const Icon = cfg.icon
                return (
                  <a
                    key={ch.id}
                    href={ch.link_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 14,
                      background: '#f8f8f8', textDecoration: 'none',
                      transition: 'transform 0.1s',
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: cfg.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={22} color={cfg.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#333', marginBottom: 2 }}>{ch.name}</div>
                      <div style={{ fontSize: 13, color: '#888' }}>{ch.value}</div>
                    </div>
                    <ExternalLink size={16} color="#ccc" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes pulse-contact {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
