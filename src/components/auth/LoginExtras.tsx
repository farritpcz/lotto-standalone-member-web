// Component: LoginExtras — quick links + latest results + reviews section
// Parent: src/app/(auth)/login/page.tsx
'use client'

import { Monitor, FileText, Users, Star } from 'lucide-react'
import type { LotteryRound } from '@/types'
import type { ModalType } from './AuthModals'

const REVIEWS = [
  { id: 1, name: '09494xxxxx', rating: 5, text: 'ถอนไวมาก ไม่ถึง 5 นาที เงินเข้าเลย สุดยอดครับ', date: '2026-03-22' },
  { id: 2, name: '06587xxxxx', rating: 5, text: 'ดีมากอยากให้ทุกคนมาเล่นเยอะๆของจริง ชอบมากครับ', date: '2026-03-16' },
  { id: 3, name: '06255xxxxx', rating: 5, text: 'แทงหวยง่าย UI สวย ใช้งานสะดวกมาก', date: '2026-03-10' },
  { id: 4, name: '09182xxxxx', rating: 4, text: 'หวยครบทุกประเภท ทั้งไทย ลาว หุ้น ยี่กี เยี่ยม', date: '2026-03-05' },
]

const categoryFlags: Record<string, string> = {
  thai: '🇹🇭', lao: '🇱🇦', hanoi: '🇻🇳', malay: '🇲🇾', stock: '📈', yeekee: '🎯', custom: '🎲',
}
const getFlag = (lt: { category?: string }) => categoryFlags[lt.category || ''] || '🎲'

interface Props {
  latestResults: LotteryRound[]
  setModal: (m: ModalType) => void
}

export default function LoginExtras({ latestResults, setModal }: Props) {
  return (
    <>
      {/* Quick links */}
      <div className="login-section">
        <div className="login-links">
          <button className="login-link-btn" onClick={() => setModal('rates')}>
            <Monitor size={18} />
            <span>อัตราจ่าย</span>
          </button>
          <button className="login-link-btn" onClick={() => setModal('rules')}>
            <FileText size={18} />
            <span>กฎและกติกา</span>
          </button>
          <button className="login-link-btn" onClick={() => setModal('invite')}>
            <Users size={18} />
            <span>เชิญเพื่อน</span>
          </button>
        </div>
      </div>

      {/* Latest results */}
      {latestResults.length > 0 && (
        <div className="login-section">
          <h2 className="login-section-title">ผลรางวัลหวยล่าสุด</h2>
          <div className="login-results">
            {latestResults.map(round => (
              <div key={round.id} className="login-result-card">
                <div className="login-result-header">
                  <div className="login-result-name">
                    <span>{getFlag(round.lottery_type || {})}</span>
                    <span>{round.lottery_type?.name}</span>
                  </div>
                  <span className="login-result-date">
                    {new Date(round.round_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </span>
                </div>
                <div className="login-result-numbers">
                  {[
                    { label: '3 ตัวบน', value: round.result_top3, accent: true },
                    { label: '2 ตัวบน', value: round.result_top2 },
                    { label: '2 ตัวล่าง', value: round.result_bottom2 },
                  ].map(item => (
                    <div key={item.label} className="login-result-num">
                      <span className="login-result-num-label">{item.label}</span>
                      <span className={`login-result-num-value${item.accent ? ' accent' : ''}`}>{item.value || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="login-section">
        <h2 className="login-section-title">รีวิวจากผู้ใช้</h2>
        <div className="login-reviews">
          {REVIEWS.map(r => (
            <div key={r.id} className="login-review-card">
              <div className="login-review-top">
                <div className="login-review-user">
                  <div className="login-review-avatar">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <div className="login-review-name">{r.name}</div>
                    <div className="login-review-date">{r.date}</div>
                  </div>
                </div>
                <div className="login-review-stars">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i < r.rating ? '#f59e0b' : 'none'}
                      stroke={i < r.rating ? '#f59e0b' : 'var(--ios-tertiary-label)'}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
              </div>
              <p className="login-review-text">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
