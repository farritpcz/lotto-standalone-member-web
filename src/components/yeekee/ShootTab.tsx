/**
 * ShootTab — ยิงเลข 5 หลัก real-time ผ่าน WebSocket (ฟรี, ไม่คิดเงิน)
 * กดเลขครบ 5 หลัก + กดปุ่มยิง → เรียก `onConfirm()`
 * มี cooldown 3 วิ/ครั้ง (จัดการที่ useWebSocket hook)
 */
import NumberPad from '@/components/number-pad/NumberPad'

interface ShootTabProps {
  shootMessage: string
  shootNumber: string
  shootResetKey: number
  cooldownRemaining: number
  onShootNumberChange: (val: string) => void
  onConfirm: () => void
}

export default function ShootTab({
  shootMessage, shootNumber, shootResetKey,
  cooldownRemaining, onShootNumberChange, onConfirm,
}: ShootTabProps) {
  const canShoot = shootNumber.length === 5 && cooldownRemaining <= 0
  return (
    <div className="px-4 mb-3">
      {shootMessage && (
        <div className={`rounded-lg px-4 py-2.5 text-sm font-medium text-center mb-3 ${
          shootMessage.includes('แล้ว') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {shootMessage}
        </div>
      )}
      <h2 className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider text-center">
        กดเลข 5 หลัก แล้วกดยิง (ฟรี)
      </h2>
      {/* ⭐ ใช้ onChange เก็บค่า — ไม่ auto-fire ตอนกดครบ */}
      <NumberPad
        digitCount={5}
        onComplete={() => {}} // ไม่ auto-fire
        onChange={onShootNumberChange}
        resetTrigger={shootResetKey}
      />

      {/* ⭐ ปุ่มยิงเลข — กดได้เฉพาะเมื่อครบ 5 หลัก + ไม่ติด cooldown */}
      <button
        onClick={onConfirm}
        disabled={!canShoot}
        className="w-full mt-3 py-3 rounded-xl text-white font-bold text-base transition-all active:scale-[0.97] disabled:opacity-40"
        style={{
          background: canShoot
            ? 'linear-gradient(135deg, #FF9F0A, #FF6B00)'
            : '#C7C7CC',
        }}
      >
        {cooldownRemaining > 0
          ? `รอ ${cooldownRemaining} วินาที`
          : shootNumber.length === 5
            ? `🎯 ยิงเลข ${shootNumber}`
            : `กดเลขอีก ${5 - shootNumber.length} หลัก`
        }
      </button>
    </div>
  )
}
