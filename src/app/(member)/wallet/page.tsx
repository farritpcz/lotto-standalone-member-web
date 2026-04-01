/**
 * หน้า Wallet — ฝาก-ถอน + ประวัติธุรกรรม (แบบเจริญดี88 — teal theme)
 *
 * เรียก API: walletApi → standalone-member-api (#3)
 * ⭐ provider-game-web (#8) ไม่มีหน้านี้ (wallet อยู่ที่ operator)
 */

'use client'

import { useEffect, useState } from 'react'
import { walletApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import type { Transaction } from '@/types'

const txTypeLabels: Record<string, string> = {
  deposit: 'ฝากเงิน', withdraw: 'ถอนเงิน', bet: 'แทงหวย', win: 'ชนะรางวัล', refund: 'คืนเงิน',
}
const txTypeIcons: Record<string, string> = {
  deposit: '💰', withdraw: '🏧', bet: '🎰', win: '🏆', refund: '↩️',
}

export default function WalletPage() {
  const { member, updateBalance } = useAuthStore()
  const [amount, setAmount] = useState('')
  const [action, setAction] = useState<'deposit' | 'withdraw'>('deposit')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    walletApi.getTransactions({ per_page: 30 })
      .then(res => setTransactions(res.data.data?.items || []))
      .catch(() => {})
  }, [message])

  const handleSubmit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setMessage('กรุณากรอกจำนวนเงิน'); return }
    setLoading(true)
    setMessage('')

    try {
      if (action === 'deposit') {
        const res = await walletApi.getBalance()
        await (await import('@/lib/api')).api.post('/wallet/deposit', { amount: amt })
        updateBalance((res.data.data?.balance || 0) + amt)
        setMessage('ฝากเงินสำเร็จ')
      } else {
        await (await import('@/lib/api')).api.post('/wallet/withdraw', { amount: amt })
        updateBalance((member?.balance || 0) - amt)
        setMessage('ถอนเงินสำเร็จ')
      }
      setAmount('')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setMessage(axiosErr.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const isError = message && !message.includes('สำเร็จ')
  const isSuccess = message && message.includes('สำเร็จ')

  return (
    <div>
      {/* Balance Card */}
      <div className="p-4">
        <div className="balance-card text-center">
          <p className="text-white/60 text-xs">ยอดเงินคงเหลือ</p>
          <p className="text-3xl font-bold text-white mt-1">
            ฿{member?.balance?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'}
          </p>
        </div>
      </div>

      {/* Action Tabs (ฝาก / ถอน) */}
      <div className="px-4 mb-3">
        <div className="card p-1 flex gap-1">
          <button
            onClick={() => setAction('deposit')}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition ${
              action === 'deposit' ? 'text-white shadow-md' : 'text-secondary'
            }`}
            style={{ background: action === 'deposit' ? 'var(--color-green)' : 'transparent' }}
          >
            ฝากเงิน
          </button>
          <button
            onClick={() => setAction('withdraw')}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition ${
              action === 'withdraw' ? 'text-white shadow-md' : 'text-secondary'
            }`}
            style={{ background: action === 'withdraw' ? 'var(--color-red)' : 'transparent' }}
          >
            ถอนเงิน
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="px-4 mb-4">
        <div className="card p-4">
          {/* Quick amounts */}
          <div className="quick-amount mb-3">
            {[100, 500, 1000, 5000].map(a => (
              <button
                key={a}
                onClick={() => setAmount(String(a))}
                className={amount === String(a) ? 'active' : ''}
              >
                ฿{a.toLocaleString()}
              </button>
            ))}
          </div>

          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="กรอกจำนวนเงิน"
            className="w-full rounded-lg px-4 py-3.5 text-center text-lg font-bold border border-gray-200 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition mb-3"
            style={{ background: 'var(--color-bg-card-alt)' }}
            min={1}
          />

          {/* Message */}
          {message && (
            <div className={`rounded-lg px-4 py-2.5 mb-3 text-sm font-medium text-center ${
              isSuccess ? 'bg-green-50 text-green-600' : isError ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {isSuccess ? '✓' : isError ? '✗' : '!'} {message}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-white text-sm transition ${
              action === 'deposit'
                ? 'bg-green-500 hover:bg-green-600 active:bg-green-700'
                : 'bg-red-500 hover:bg-red-600 active:bg-red-700'
            } disabled:opacity-50`}
          >
            {loading ? 'กำลังดำเนินการ...' : action === 'deposit' ? 'ยืนยันฝากเงิน' : 'ยืนยันถอนเงิน'}
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="section-title">
        <span>ประวัติธุรกรรม</span>
      </div>
      <div className="px-4 pb-4 space-y-1.5">
        {transactions.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-muted text-sm">ยังไม่มีธุรกรรม</p>
          </div>
        ) : transactions.map(tx => (
          <div key={tx.id} className="card p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: 'var(--color-bg-card-alt)' }}>
              {txTypeIcons[tx.type] || '💳'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{txTypeLabels[tx.type] || tx.type}</div>
              <div className="text-muted text-[10px]">{new Date(tx.created_at).toLocaleString('th-TH')}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className={`font-bold text-sm ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {tx.amount >= 0 ? '+' : ''}฿{Math.abs(tx.amount).toLocaleString()}
              </span>
              <div className="text-muted text-[10px]">คงเหลือ ฿{tx.balance_after.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
