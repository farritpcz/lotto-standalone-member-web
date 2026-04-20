// Component: AuthModals — rates / rules / invite modals for login page
// Parent: src/app/(auth)/login/page.tsx
'use client'

import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { lotteryApi } from '@/lib/api'
import { useEffect, useState } from 'react'
import type { LotteryTypeInfo, BetTypeInfo } from '@/types'

export type ModalType = null | 'rates' | 'rules' | 'invite'

const RULES = [
  {
    title: 'กติกาทั่วไป',
    items: [
      'สมาชิกต้องมีอายุ 20 ปีบริบูรณ์ขึ้นไป',
      'ยอดเดิมพันขั้นต่ำ 1 บาท สูงสุดตามที่ระบบกำหนด',
      'หากมีการทุจริต ทางเราขอสงวนสิทธิ์ยกเลิกรายการทันที',
      'ผลการแทงอ้างอิงจากแหล่งข้อมูลอย่างเป็นทางการเท่านั้น',
    ],
  },
  {
    title: 'การแทงหวย',
    items: [
      '3 ตัวบน — ทายผลเลข 3 ตัวบนตรงตำแหน่ง',
      '3 ตัวโต๊ด — ทายผลเลข 3 ตัวบนไม่จำกัดตำแหน่ง',
      '2 ตัวบน — ทายผลเลข 2 ตัวบนตรงตำแหน่ง',
      '2 ตัวล่าง — ทายผลเลข 2 ตัวล่างตรงตำแหน่ง',
      'วิ่งบน — ทายเลข 1 ตัวที่อยู่ใน 3 ตัวบน',
      'วิ่งล่าง — ทายเลข 1 ตัวที่อยู่ใน 2 ตัวล่าง',
    ],
  },
  {
    title: 'ยี่กี',
    items: [
      'ยิงเลข 5 หลัก ภายในเวลาที่กำหนด',
      'ผลรวมเลขทั้งหมด mod 100000 = ผลยี่กี',
      'เปิดให้เล่นตลอด 24 ชั่วโมง',
    ],
  },
  {
    title: 'การฝาก-ถอนเงิน',
    items: [
      'ฝากเงินขั้นต่ำ 100 บาท',
      'ถอนเงินขั้นต่ำ 300 บาท',
      'ถอนเงินได้ไม่เกิน 3 ครั้ง/วัน',
      'ระบบประมวลผลอัตโนมัติ ภายใน 1-5 นาที',
    ],
  },
]

interface Props {
  modal: ModalType
  setModal: (m: ModalType) => void
}

export default function AuthModals({ modal, setModal }: Props) {
  const [ratesTypes, setRatesTypes] = useState<LotteryTypeInfo[]>([])
  const [ratesSelected, setRatesSelected] = useState<LotteryTypeInfo | null>(null)
  const [ratesBetTypes, setRatesBetTypes] = useState<BetTypeInfo[]>([])
  const [ratesLoading, setRatesLoading] = useState(false)

  // Load rates when modal opens
  useEffect(() => {
    if (modal !== 'rates' || ratesTypes.length > 0) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRatesLoading(true)
    lotteryApi.getTypes()
      .then(res => {
        const types = res.data.data || []
        setRatesTypes(types)
        if (types.length > 0) setRatesSelected(types[0])
      })
      .catch(() => {})
      .finally(() => setRatesLoading(false))
  }, [modal, ratesTypes.length])

  // Load bet types when selection changes
  useEffect(() => {
    if (!ratesSelected) return
    lotteryApi.getBetTypes(ratesSelected.id)
      .then(res => setRatesBetTypes(res.data.data || []))
      .catch(() => setRatesBetTypes([]))
  }, [ratesSelected])

  if (!modal || typeof document === 'undefined') return null

  return createPortal(
    <div className="modal-backdrop" onClick={() => setModal(null)}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {modal === 'rates' && 'อัตราจ่าย'}
            {modal === 'rules' && 'กฎและกติกา'}
            {modal === 'invite' && 'เชิญเพื่อน'}
          </h3>
          <button className="modal-close" onClick={() => setModal(null)}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {modal === 'rates' && (
            ratesLoading ? (
              <p className="modal-empty">กำลังโหลด...</p>
            ) : ratesTypes.length === 0 ? (
              <p className="modal-empty">ยังไม่มีข้อมูล</p>
            ) : (
              <>
                <div className="rates-tabs">
                  {ratesTypes.map(lt => (
                    <button
                      key={lt.id}
                      onClick={() => setRatesSelected(lt)}
                      className={`rates-tab${ratesSelected?.id === lt.id ? ' active' : ''}`}
                    >
                      {lt.name}
                    </button>
                  ))}
                </div>
                {ratesBetTypes.length === 0 ? (
                  <p className="modal-empty">ไม่มีข้อมูล</p>
                ) : (
                  <div className="rates-table">
                    <div className="rates-row rates-header-row">
                      <span>ประเภท</span>
                      <span>อัตราจ่าย</span>
                      <span>สูงสุด/เลข</span>
                    </div>
                    {ratesBetTypes.map(bt => (
                      <div key={bt.code} className="rates-row">
                        <span className="rates-name">{bt.name}</span>
                        <span className="rates-rate">x{bt.rate}</span>
                        <span className="rates-max">
                          {bt.max_bet_per_number > 0 ? `฿${bt.max_bet_per_number.toLocaleString()}` : 'ไม่จำกัด'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )
          )}

          {modal === 'rules' && (
            <div className="rules-content">
              {RULES.map((section, i) => (
                <div key={i} className="rules-section">
                  <h4 className="rules-section-title">
                    <span className="rules-num">{i + 1}</span>
                    {section.title}
                  </h4>
                  <ul className="rules-list">
                    {section.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {modal === 'invite' && (
            <div className="invite-content">
              <h4 className="invite-heading">ชวนเพื่อนมาเล่น รับค่าคอมทุกยอดแทง!</h4>

              <div className="invite-section">
                <p className="invite-section-title">เงื่อนไข</p>
                <ul className="invite-list">
                  <li>เพื่อนสมัครผ่านลิงก์แนะนำของคุณ</li>
                  <li>รับค่าคอมมิชชั่นทุกครั้งที่เพื่อนแทงหวย</li>
                  <li>ไม่จำกัดจำนวนคนที่เชิญได้</li>
                  <li>ค่าคอมคำนวณอัตโนมัติหลังออกผล</li>
                </ul>
              </div>

              <div className="invite-section">
                <p className="invite-section-title">อัตราค่าคอมมิชชั่น</p>
                <div className="invite-rates">
                  <div className="invite-rate-row">
                    <span>หวยไทย / หวยลาว</span>
                    <span className="invite-rate-value">0.8%</span>
                  </div>
                  <div className="invite-rate-row">
                    <span>หวยหุ้น</span>
                    <span className="invite-rate-value">0.5%</span>
                  </div>
                  <div className="invite-rate-row">
                    <span>หวยยี่กี</span>
                    <span className="invite-rate-value">0.5%</span>
                  </div>
                </div>
              </div>

              <p className="invite-note">* สมัครสมาชิกและเข้าสู่ระบบเพื่อรับลิงก์แนะนำของคุณ</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
