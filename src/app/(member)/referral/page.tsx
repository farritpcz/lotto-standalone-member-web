// Page: /referral (member) — แนะนำเพื่อน แบบเจริญดี88
// Related: components/referral/*
//
// Layout:
// - Header: back + "แนะนำเพื่อน" + NotificationBell
// - Tab Switcher: ภาพรวม / อันดับ / ถอนรายได้
// - Overview tab: OverviewTab (link + share + stats + analytics + custom code)
// - Leaderboard tab: LeaderboardTab
// - Withdraw tab: WithdrawTab
//
// API:
// - referralApi.{getInfo, withdraw, getAnalytics, setCustomCode, getNotifications,
//   markNotificationsRead, getShareTemplates, getCommissions, getWithdrawals, getLeaderboard}

'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import {
  referralApi,
  type ReferralInfo, type ReferralCommission, type LeaderboardEntry,
  type ReferralAnalytics, type ReferralNotification, type ShareTemplate,
  type WithdrawalRecord,
} from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/components/Toast'

import { NotificationBell } from '@/components/referral/NotificationBell'
import { OverviewTab } from '@/components/referral/OverviewTab'
import { LeaderboardTab } from '@/components/referral/LeaderboardTab'
import { WithdrawTab } from '@/components/referral/WithdrawTab'
import { shareUrl } from '@/components/referral/SocialIcons'

export default function ReferralPage() {
  const { member, updateBalance } = useAuthStore()
  const { toast } = useToast()
  const [tab, setTab] = useState<'overview' | 'withdraw' | 'leaderboard'>('overview')
  const [info, setInfo] = useState<ReferralInfo | null>(null)
  const [commissions, setCommissions] = useState<ReferralCommission[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showConditions, setShowConditions] = useState(false)

  // Withdraw form
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [cooldown, setCooldown] = useState(0) // 5s cooldown กันกดรัวๆ
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([])

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [lbPeriod, setLbPeriod] = useState<'day' | 'week' | 'month'>('month')
  const [lbLoading, setLbLoading] = useState(false)

  // Analytics
  const [analytics, setAnalytics] = useState<ReferralAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // Custom Code
  const [customCodeInput, setCustomCodeInput] = useState('')
  const [customCodeSaving, setCustomCodeSaving] = useState(false)
  const [customCodeMsg, setCustomCodeMsg] = useState('')
  const [customCodeErr, setCustomCodeErr] = useState('')

  // Share Templates
  const [shareTemplates, setShareTemplates] = useState<ShareTemplate[]>([])
  const [templateCopied, setTemplateCopied] = useState<number | null>(null)

  // Notifications
  const [notifications, setNotifications] = useState<ReferralNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)

  // โหลดข้อมูลหลักตอน mount
  useEffect(() => {
    referralApi.getInfo()
      .then(res => setInfo(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))

    // ⚠️ API คืน { data: [...], meta: {...} } — data เป็น array ตรงๆ ไม่มี .items
    referralApi.getCommissions({ per_page: 3 })
      .then(res => {
        const d = res.data.data
        setCommissions(Array.isArray(d) ? d : (d as unknown as { items?: ReferralCommission[] })?.items || [])
      })
      .catch(() => {})

    referralApi.getWithdrawals({ per_page: 3 })
      .then(res => {
        const d = res.data.data
        setWithdrawals(Array.isArray(d) ? d : [])
      })
      .catch(() => {})

    referralApi.getShareTemplates()
      .then(res => setShareTemplates(res.data.data || []))
      .catch(() => {})

    referralApi.getNotifications({ page: 1, per_page: 1 })
      .then(res => setUnreadCount(res.data.data?.unread_count || 0))
      .catch(() => {})
  }, [])

  // โหลด analytics เมื่ออยู่ tab ภาพรวม
  useEffect(() => {
    if (tab !== 'overview') return
    setAnalyticsLoading(true)
    referralApi.getAnalytics(7)
      .then(res => setAnalytics(res.data.data))
      .catch(() => {})
      .finally(() => setAnalyticsLoading(false))
  }, [tab])

  // โหลด leaderboard เมื่อเปลี่ยน period หรือเปิด tab อันดับ
  useEffect(() => {
    if (tab !== 'leaderboard') return
    setLbLoading(true)
    referralApi.getLeaderboard(lbPeriod)
      .then(res => setLeaderboard(res.data.data?.leaderboard || []))
      .catch(() => setLeaderboard([]))
      .finally(() => setLbLoading(false))
  }, [tab, lbPeriod])

  // สร้างลิงก์เชิญฝั่ง client เท่านั้น (ป้องกัน hydration mismatch)
  const [refLink, setRefLink] = useState('')
  useEffect(() => {
    const refCode = info?.link.code || `REF${member?.id || '0'}`
    setRefLink(`${window.location.origin}/register?ref=${refCode}`)
  }, [info, member])

  const handleCopy = () => {
    if (!refLink) return
    navigator.clipboard.writeText(refLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = (platform: string) => {
    if (!refLink) return
    const url = shareUrl(platform, refLink)
    if (platform === 'instagram' || platform === 'tiktok') {
      // IG/TikTok ไม่มี web share API → copy link แทน
      navigator.clipboard.writeText(refLink).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      window.open(url, '_blank', 'noopener')
    }
  }

  // ถอนค่าคอม + toast + cooldown + อัพเดท balance
  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0) { toast.error('กรุณากรอกจำนวนเงิน'); return }
    if (info && amount < info.withdrawal.min) {
      toast.error(`ยอดถอนขั้นต่ำ ฿${info.withdrawal.min.toFixed(2)}`); return
    }
    const pendingAmount = info?.stats.pending_comm ?? 0
    if (amount > pendingAmount) {
      toast.error(`ยอดค่าคอมไม่เพียงพอ (มี ฿${pendingAmount.toFixed(2)})`); return
    }
    if (cooldown > 0) { toast.error(`กรุณารอ ${cooldown} วินาที`); return }

    setWithdrawing(true)
    try {
      const res = await referralApi.withdraw(amount)
      toast.success(res.data.message || `ถอน ฿${amount.toFixed(2)} สำเร็จ!`)
      setWithdrawAmount('')

      const newBalance = (res.data as unknown as { data?: { new_balance?: number } }).data?.new_balance
      if (newBalance !== undefined && updateBalance) {
        updateBalance(newBalance)
      }

      setCooldown(5)
      const interval = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0 }
          return prev - 1
        })
      }, 1000)

      referralApi.getInfo().then(r => setInfo(r.data.data)).catch(() => {})
      referralApi.getCommissions({ per_page: 3 }).then(r => {
        const d = r.data.data
        setCommissions(Array.isArray(d) ? d : [])
      }).catch(() => {})
      referralApi.getWithdrawals({ per_page: 3 }).then(r => {
        const d = r.data.data
        setWithdrawals(Array.isArray(d) ? d : [])
      }).catch(() => {})
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      toast.error(e.response?.data?.error || 'ถอนไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setWithdrawing(false)
    }
  }

  // ตั้ง custom referral code
  const handleSetCustomCode = async () => {
    const code = customCodeInput.trim()
    if (code.length < 4 || code.length > 20) {
      setCustomCodeErr('โค้ดต้องมี 4-20 ตัวอักษร')
      return
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
      setCustomCodeErr('ใช้ได้เฉพาะ a-z A-Z 0-9 - _ เท่านั้น')
      return
    }
    setCustomCodeErr('')
    setCustomCodeMsg('')
    setCustomCodeSaving(true)
    try {
      const res = await referralApi.setCustomCode(code)
      setCustomCodeMsg(res.data.message || 'ตั้งโค้ดสำเร็จ')
      if (res.data.data?.link) {
        setRefLink(res.data.data.link)
      }
      referralApi.getInfo().then(r => setInfo(r.data.data)).catch(() => {})
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setCustomCodeErr(e.response?.data?.error || 'ตั้งโค้ดไม่สำเร็จ')
    } finally {
      setCustomCodeSaving(false)
    }
  }

  // คัดลอก share template (แทนค่า placeholder)
  const handleCopyTemplate = useCallback((template: ShareTemplate) => {
    const refCode = info?.link.code || ''
    const username = member?.username || ''
    const text = template.content
      .replace(/\{link\}/g, refLink)
      .replace(/\{code\}/g, refCode)
      .replace(/\{username\}/g, username)
    navigator.clipboard.writeText(text).catch(() => {})
    setTemplateCopied(template.id)
    setTimeout(() => setTemplateCopied(null), 2000)
  }, [refLink, info, member])

  // เปิด/ปิด notification dropdown + โหลดรายการแจ้งเตือน
  const toggleNotifications = async () => {
    const willOpen = !showNotifDropdown
    setShowNotifDropdown(willOpen)
    if (willOpen) {
      setNotifLoading(true)
      try {
        const res = await referralApi.getNotifications({ page: 1, per_page: 20 })
        setNotifications(res.data.data?.notifications || [])
        setUnreadCount(res.data.data?.unread_count || 0)
        // อ่านทั้งหมดอัตโนมัติเมื่อเปิด dropdown
        if (res.data.data?.unread_count > 0) {
          await referralApi.markNotificationsRead({ all: true })
          setUnreadCount(0)
        }
      } catch {
        // ถ้าโหลดไม่ได้ก็ไม่เป็นไร
      } finally {
        setNotifLoading(false)
      }
    }
  }

  return (
    <div style={{ paddingBottom: 16 }}>

      {/* Header — back + title + notification bell */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 10px', position: 'relative' }}>
        <Link href="/dashboard" style={{ color: 'var(--ios-label)', position: 'absolute', left: 16 }}>
          <ChevronLeft size={22} strokeWidth={2.5} />
        </Link>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 700, color: 'var(--ios-label)' }}>แนะนำเพื่อน</span>
        <NotificationBell
          unreadCount={unreadCount}
          show={showNotifDropdown}
          onToggle={toggleNotifications}
          onClose={() => setShowNotifDropdown(false)}
          notifLoading={notifLoading}
          notifications={notifications}
        />
      </div>

      {/* Tab Switcher */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ background: 'var(--ios-card)', borderRadius: 10, padding: 3, display: 'flex', boxShadow: 'var(--shadow-card)' }}>
          {([
            { key: 'overview' as const, label: 'ภาพรวม' },
            { key: 'leaderboard' as const, label: 'อันดับ' },
            { key: 'withdraw' as const, label: 'ถอนรายได้' },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 14, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: tab === t.key ? 'var(--accent-color)' : 'transparent',
                color: tab === t.key ? 'white' : 'var(--ios-secondary-label)',
                boxShadow: tab === t.key ? '0 2px 8px color-mix(in srgb, var(--accent-color) 35%, transparent)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <OverviewTab
          loading={loading}
          info={info}
          refLink={refLink}
          copied={copied}
          onCopy={handleCopy}
          onShare={handleShare}
          analytics={analytics}
          analyticsLoading={analyticsLoading}
          shareTemplates={shareTemplates}
          templateCopied={templateCopied}
          onCopyTemplate={handleCopyTemplate}
          username={member?.username}
          customCodeInput={customCodeInput}
          setCustomCodeInput={setCustomCodeInput}
          customCodeSaving={customCodeSaving}
          customCodeMsg={customCodeMsg}
          customCodeErr={customCodeErr}
          onSetCustomCode={handleSetCustomCode}
        />
      )}

      {tab === 'leaderboard' && (
        <LeaderboardTab
          lbPeriod={lbPeriod}
          setLbPeriod={setLbPeriod}
          lbLoading={lbLoading}
          leaderboard={leaderboard}
        />
      )}

      {tab === 'withdraw' && (
        <WithdrawTab
          loading={loading}
          info={info}
          showConditions={showConditions}
          setShowConditions={setShowConditions}
          withdrawAmount={withdrawAmount}
          setWithdrawAmount={setWithdrawAmount}
          withdrawing={withdrawing}
          cooldown={cooldown}
          onWithdraw={handleWithdraw}
          withdrawals={withdrawals}
          commissions={commissions}
        />
      )}
    </div>
  )
}
