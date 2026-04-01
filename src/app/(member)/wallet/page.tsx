/**
 * หน้า Wallet — ฝาก-ถอน + ประวัติธุรกรรม
 *
 * เรียก API: walletApi → standalone-member-api (#3)
 * ⭐ provider-game-web (#8) ไม่มีหน้านี้ (wallet อยู่ที่ operator)
 */

'use client'

import { useEffect, useState } from 'react'
import { walletApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import type { Transaction } from '@/types'

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
  }, [message]) // reload หลัง action

  const handleSubmit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setMessage('กรุณากรอกจำนวนเงิน'); return }
    setLoading(true)
    setMessage('')

    try {
      if (action === 'deposit') {
        const res = await walletApi.getBalance() // dummy — ใน production ใช้ payment gateway
        // Direct deposit (development)
        await (await import('@/lib/api')).api.post('/wallet/deposit', { amount: amt })
        updateBalance((res.data.data?.balance || 0) + amt)
        setMessage(`✅ ฝากเงิน ฿${amt.toLocaleString()} สำเร็จ`)
      } else {
        await (await import('@/lib/api')).api.post('/wallet/withdraw', { amount: amt })
        updateBalance((member?.balance || 0) - amt)
        setMessage(`✅ ถอนเงิน ฿${amt.toLocaleString()} สำเร็จ`)
      }
      setAmount('')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setMessage(`❌ ${axiosErr.response?.data?.error || 'เกิดข้อผิดพลาด'}`)
    } finally {
      setLoading(false)
    }
  }

  const txTypeLabels: Record<string, string> = {
    deposit: 'ฝากเงิน', withdraw: 'ถอนเงิน', bet: 'แทงหวย', win: 'ชนะรางวัล', refund: 'คืนเงิน',
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* ยอดเงิน */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 mb-6 text-center">
        <p className="text-blue-200 text-sm">ยอดเงินคงเหลือ</p>
        <p className="text-3xl font-bold text-white mt-1">
          ฿{member?.balance?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'}
        </p>
      </div>

      {/* ฝาก/ถอน */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setAction('deposit')}
            className={`flex-1 py-2 rounded-lg font-semibold text-sm ${action === 'deposit' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >ฝากเงิน</button>
          <button
            onClick={() => setAction('withdraw')}
            className={`flex-1 py-2 rounded-lg font-semibold text-sm ${action === 'withdraw' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >ถอนเงิน</button>
        </div>

        <div className="flex gap-2 mb-3">
          {[100, 500, 1000, 5000].map(a => (
            <button key={a} onClick={() => setAmount(String(a))}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded-lg">
              ฿{a.toLocaleString()}
            </button>
          ))}
        </div>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="กรอกจำนวนเงิน"
          className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 mb-3 text-center text-lg"
          min={1}
        />

        {message && (
          <div className={`rounded-lg px-4 py-2 mb-3 text-sm ${message.includes('✅') ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
            {message}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-semibold text-white transition
            ${action === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            disabled:bg-gray-600`}
        >
          {loading ? 'กำลังดำเนินการ...' : action === 'deposit' ? 'ฝากเงิน' : 'ถอนเงิน'}
        </button>
      </div>

      {/* ประวัติธุรกรรม */}
      <h2 className="text-white font-semibold mb-3">ประวัติธุรกรรม</h2>
      <div className="space-y-2">
        {transactions.length === 0 ? (
          <div className="text-gray-500 text-center py-6">ยังไม่มีธุรกรรม</div>
        ) : transactions.map(tx => (
          <div key={tx.id} className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
            <div>
              <span className="text-white text-sm">{txTypeLabels[tx.type] || tx.type}</span>
              <div className="text-gray-500 text-xs">{new Date(tx.created_at).toLocaleString('th-TH')}</div>
            </div>
            <div className="text-right">
              <span className={`font-semibold ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {tx.amount >= 0 ? '+' : ''}฿{Math.abs(tx.amount).toLocaleString()}
              </span>
              <div className="text-gray-500 text-xs">คงเหลือ ฿{tx.balance_after.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
