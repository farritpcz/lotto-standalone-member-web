/**
 * BetTab — Tab แทงหวย (เสียเงิน) — flow เดียวกับ /lottery/[type]
 * เลือกประเภทแทง → จำนวนเงิน → 3 sub-tabs (keypad/grid/lucky) → BetSlip
 * Reuse: BetTypeSelector, BetSlip, NumberPad, NumberGrid, LuckyNumbers
 */
import NumberPad from '@/components/number-pad/NumberPad'
import BetTypeSelector from '@/components/bet-board/BetTypeSelector'
import BetSlip from '@/components/bet-board/BetSlip'
import NumberGrid from '@/components/bet-board/NumberGrid'
import LuckyNumbers from '@/components/bet-board/LuckyNumbers'
import { betSubTabs, type BetSubTab } from '@/app/(member)/yeekee/play/_config'

interface BetTabProps {
  betMessage: string
  betSubTab: BetSubTab
  setBetSubTab: (t: BetSubTab) => void
  selectedBetTypesLength: number
  betAmount: number
  setBetAmount: (v: number) => void
  betSlipLength: number
  digitCount: number
  betResetKey: number
  submitting: boolean
  hasReversible: boolean
  onAddNumber: (n: string) => void
  onReverseLast: () => void
  onConfirm: () => Promise<boolean | string>
}

export default function BetTab(p: BetTabProps) {
  return (
    <>
      {/* Message */}
      {p.betMessage && (
        <div className="px-4 mb-3">
          <div className={`rounded-lg px-4 py-2.5 text-sm font-medium text-center ${
            p.betMessage.includes('สำเร็จ') ? 'bg-green-50 text-green-600' :
            p.betMessage.includes('ผิดพลาด') ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
          }`}>
            {p.betMessage}
          </div>
        </div>
      )}

      {/* ⭐ ประเภทการแทง — ใช้ BetTypeSelector component เดียวกับทุกหวย */}
      <div className="px-4 mb-3">
        <h2 className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider">ประเภทการแทง</h2>
        <BetTypeSelector />
      </div>

      {/* จำนวนเงิน + กลับตัวเลข */}
      <div className="px-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">จำนวนเงิน (บาท)</h2>
          {p.hasReversible && (
            <button
              onClick={p.onReverseLast}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition active:scale-95"
              style={{ background: 'rgba(212,160,23,0.1)', color: 'var(--color-gold)' }}
            >
              🔄 กลับตัวเลข
            </button>
          )}
        </div>
        <div className="quick-amount mb-2">
          {[5, 10, 20, 50, 100].map(amt => (
            <button key={amt} onClick={() => p.setBetAmount(amt)} className={p.betAmount === amt ? 'active' : ''}>
              ฿{amt}
            </button>
          ))}
        </div>
        <input
          type="number"
          value={p.betAmount}
          onChange={(e) => p.setBetAmount(Math.max(1, Number(e.target.value)))}
          className="w-full rounded-lg px-4 py-2.5 text-center text-sm font-bold border border-gray-200 focus:border-teal-500 focus:outline-none"
          style={{ background: 'var(--color-bg-card)' }}
          min={1}
        />
      </div>

      {/* 3 Sub-tabs: กดเลขเอง / เลือกจากแผง / เลขวิน */}
      <div className="px-4 mb-3">
        <div className="card p-1 flex gap-1 mb-3">
          {betSubTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => p.setBetSubTab(tab.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                p.betSubTab === tab.key ? 'text-white shadow-md' : 'text-secondary'
              }`}
              style={{ background: p.betSubTab === tab.key ? 'var(--color-primary)' : 'transparent' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content — ต้องเลือกประเภทแทงก่อน */}
        {p.selectedBetTypesLength === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-muted text-sm">กรุณาเลือกประเภทการแทงก่อน</p>
          </div>
        ) : (
          <>
            {p.betSubTab === 'keypad' && (
              <div>
                <h2 className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider">
                  กดเลข ({p.digitCount} หลัก)
                </h2>
                <NumberPad digitCount={p.digitCount} onComplete={p.onAddNumber} resetTrigger={p.betResetKey} />
              </div>
            )}
            {p.betSubTab === 'grid'  && <NumberGrid digitCount={p.digitCount} onSelect={p.onAddNumber} />}
            {p.betSubTab === 'lucky' && <LuckyNumbers digitCount={p.digitCount} onSelect={p.onAddNumber} />}
          </>
        )}
      </div>

      {/* Bet Slip */}
      <div className="px-4 pb-4">
        <h2 className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider">รายการแทง</h2>
        <BetSlip onConfirm={p.onConfirm} loading={p.submitting} />
      </div>
    </>
  )
}
