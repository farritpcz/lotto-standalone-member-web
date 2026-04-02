/**
 * ประวัติฝากเงิน — แยกหน้าจาก wallet
 *
 * แสดง: รายการฝากทั้งหมด (pending/approved/rejected/expired/cancelled)
 * สถานะสี: pending=ส้ม, approved=เขียว, rejected=แดง, expired=เทา, cancelled=เทา
 */
'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'

interface DepositItem {
  id: number
  amount: number
  status: string
  auto_matched: boolean
  created_at: string
  approved_at: string | null
}

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: 'rgba(255,159,10,0.12)', color: '#B25000', label: 'รอดำเนินการ' },
  approved:  { bg: 'rgba(52,199,89,0.12)',  color: '#1a8a40', label: 'สำเร็จ' },
  rejected:  { bg: 'rgba(255,59,48,0.10)',  color: '#CC2020', label: 'ปฏิเสธ' },
  expired:   { bg: 'rgba(142,142,147,0.10)',color: '#888',    label: 'หมดอายุ' },
  cancelled: { bg: 'rgba(142,142,147,0.10)',color: '#888',    label: 'ยกเลิก' },
  unmatched: { bg: 'rgba(255,159,10,0.12)', color: '#B25000', label: 'ไม่ match' },
}

export default function DepositHistoryPage() {
  const router = useRouter()
  const [items, setItems] = useState<DepositItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setLoading(true)
    import('@/lib/api').then(({ api }) => {
      api.get(`/wallet/deposits?page=${page}&per_page=20`)
        .then(res => {
          setItems(res.data.data?.items || [])
          setTotal(res.data.data?.total || 0)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    })
  }, [page])

  const handleCancel = async (id: number) => {
    try {
      const { api } = await import('@/lib/api')
      await api.delete(`/wallet/deposit/${id}`)
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'cancelled' } : i))
    } catch {}
  }

  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
    catch { return d }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <ChevronLeft size={22} strokeWidth={2.5} color="var(--ios-label)" />
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--ios-label)' }}>ประวัติฝากเงิน</h1>
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        {loading ? <Loading /> : items.length === 0 ? (
          <div style={{ background: 'var(--ios-card)', borderRadius: 16, padding: '48px 16px', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>💰</p>
            <p style={{ color: 'var(--ios-secondary-label)', fontSize: 15 }}>ยังไม่มีประวัติฝากเงิน</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(item => {
              const cfg = statusConfig[item.status] || statusConfig.pending
              return (
                <div key={item.id} style={{
                  background: 'var(--ios-card)', borderRadius: 14, padding: '14px 16px',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--ios-label)' }}>
                        ฿{item.amount.toLocaleString()}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                        background: cfg.bg, color: cfg.color,
                      }}>
                        {cfg.label}
                      </span>
                      {item.auto_matched && (
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,122,255,0.1)', color: '#0055CC' }}>
                          ออโต้
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ios-secondary-label)' }}>
                      #{item.id} · {fmtDate(item.created_at)}
                      {item.approved_at && ` · อนุมัติ ${fmtDate(item.approved_at)}`}
                    </div>
                  </div>

                  {/* pending แสดงข้อความรอ — ไม่ให้ยกเลิกเอง (auto-expire 30 นาที) */}
                  {item.status === 'pending' && (
                    <span style={{ fontSize: 11, color: '#B25000' }}>รอตรวจสอบ</span>
                  )}
                </div>
              )
            })}

            {/* Pagination */}
            {total > 20 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer', background: 'var(--ios-card)', color: 'var(--ios-label)', opacity: page === 1 ? 0.4 : 1 }}>
                  ← ก่อนหน้า
                </button>
                <span style={{ fontSize: 13, color: 'var(--ios-secondary-label)', alignSelf: 'center' }}>หน้า {page}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={items.length < 20}
                  style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer', background: 'var(--ios-card)', color: 'var(--ios-label)', opacity: items.length < 20 ? 0.4 : 1 }}>
                  ถัดไป →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
