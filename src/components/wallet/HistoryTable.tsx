// Component: HistoryTable — list of recent deposit/withdraw entries
// Parent: src/app/(member)/wallet/page.tsx

export interface HistoryItem {
  id: number
  amount: number
  status: string
  created_at: string
}

export interface HistoryTableProps {
  isDeposit: boolean
  items: HistoryItem[]
}

export function HistoryTable({ isDeposit, items }: HistoryTableProps) {
  return (
    <div style={{ background: 'var(--ios-card)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--ios-separator)' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ios-label)' }}>
          รายการ{isDeposit ? 'ฝากเงิน' : 'ถอนเงิน'}
        </span>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
        padding: '10px 16px',
        fontSize: 11, fontWeight: 700, color: 'var(--accent-color)',
        textTransform: 'uppercase', letterSpacing: 0.5,
        background: 'linear-gradient(135deg, var(--header-bg) 0%, color-mix(in srgb, var(--header-bg) 70%, black) 100%)',
        backgroundImage: `linear-gradient(135deg, var(--header-bg) 0%, color-mix(in srgb, var(--header-bg) 70%, black) 100%), url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20.5z' fill='%23ffffff' fill-opacity='0.04' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        borderRadius: '12px 12px 0 0',
      }}>
        <span>วันที่</span>
        <span>ช่องทาง</span>
        <span style={{ textAlign: 'right' }}>จำนวนเงิน</span>
        <span style={{ textAlign: 'right' }}>สถานะ</span>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ios-tertiary-label)', fontSize: 14 }}>
          ไม่มีข้อมูล
        </div>
      ) : items.map((item, idx) => {
        const isPending = item.status === 'pending'
        const isSuccess = item.status === 'approved' || item.status === 'completed'
        return (
          <div key={item.id} style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
            padding: '10px 16px', alignItems: 'center',
            borderBottom: idx < items.length - 1 ? '0.5px solid var(--ios-separator)' : 'none',
            fontSize: 13,
          }}>
            <span style={{ color: 'var(--ios-secondary-label)' }}>
              {new Date(item.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
            </span>
            <span style={{ color: 'var(--ios-secondary-label)' }}>
              {isDeposit ? 'โอนเงิน' : 'ธนาคาร'}
            </span>
            <span style={{ textAlign: 'right', fontWeight: 600, color: isDeposit ? 'var(--ios-green)' : 'var(--ios-label)' }}>
              {isDeposit ? '+' : '-'}฿{item.amount.toLocaleString()}
            </span>
            <span style={{
              textAlign: 'right', fontSize: 11, fontWeight: 600,
              color: isPending ? 'var(--ios-orange)' : isSuccess ? 'var(--ios-green)' : 'var(--ios-red)',
            }}>
              {isPending ? 'รอตรวจสอบ' : isSuccess ? 'สำเร็จ' : item.status === 'rejected' ? 'ปฏิเสธ' : item.status}
            </span>
          </div>
        )
      })}
    </div>
  )
}
