/**
 * NumberPad — ปุ่มกดเลขสำหรับเลือกเลขแทงหวย (แบบเจริญดี88 — teal theme)
 *
 * ⭐ Component นี้ใช้ร่วมกับ provider-game-web (#8) ได้เลย
 *
 * Features:
 * - กดเลข 0-9 เพื่อสร้างเลข
 * - แสดงจำนวนหลักที่ต้องกดตาม bet type (3TOP=3, 2TOP=2, RUN=1)
 * - ปุ่มลบ (backspace) + ล้าง (clear)
 * - กดครบหลัก → callback onComplete
 */

'use client'

import { useState, useCallback, useEffect } from 'react'

interface NumberPadProps {
  digitCount: number
  onComplete: (number: string) => void
  onChange?: (value: string) => void
  resetTrigger?: number
}

export default function NumberPad({ digitCount, onComplete, onChange, resetTrigger }: NumberPadProps) {
  const [value, setValue] = useState('')

  useEffect(() => {
    setValue('')
  }, [resetTrigger, digitCount])

  const handleDigit = useCallback((digit: string) => {
    setValue(prev => {
      if (prev.length >= digitCount) return prev
      const newVal = prev + digit
      onChange?.(newVal)
      if (newVal.length === digitCount) {
        setTimeout(() => onComplete(newVal), 100)
      }
      return newVal
    })
  }, [digitCount, onComplete, onChange])

  const handleBackspace = useCallback(() => {
    setValue(prev => {
      const newVal = prev.slice(0, -1)
      onChange?.(newVal)
      return newVal
    })
  }, [onChange])

  const handleClear = useCallback(() => {
    setValue('')
    onChange?.('')
  }, [onChange])

  return (
    <div className="w-full max-w-xs mx-auto">
      {/* Display — แสดงเลขที่กด */}
      <div className="card p-4 mb-3 text-center">
        <div className="flex justify-center gap-2">
          {Array.from({ length: digitCount }).map((_, i) => (
            <div
              key={i}
              className={`w-12 h-14 rounded-lg flex items-center justify-center text-2xl font-bold font-mono transition-all ${
                value[i]
                  ? 'text-white shadow-md'
                  : 'border-2 border-dashed border-gray-300'
              }`}
              style={{
                background: value[i] ? 'var(--color-primary)' : 'var(--color-bg-card-alt)',
                color: value[i] ? 'white' : 'var(--color-text-muted)',
              }}
            >
              {value[i] || '_'}
            </div>
          ))}
        </div>
        <p className="text-muted text-xs mt-2">
          {value.length}/{digitCount} หลัก
        </p>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
          <button
            key={digit}
            onClick={() => handleDigit(digit)}
            disabled={value.length >= digitCount}
            className="card py-3.5 text-xl font-bold transition active:scale-95 disabled:opacity-30"
            style={{ color: 'var(--color-text)' }}
          >
            {digit}
          </button>
        ))}

        {/* Row สุดท้าย: Clear, 0, Backspace */}
        <button
          onClick={handleClear}
          className="py-3.5 rounded-xl text-sm font-bold transition active:scale-95"
          style={{ background: 'rgba(229,62,62,0.08)', color: 'var(--color-red)' }}
        >
          ล้าง
        </button>
        <button
          onClick={() => handleDigit('0')}
          disabled={value.length >= digitCount}
          className="card py-3.5 text-xl font-bold transition active:scale-95 disabled:opacity-30"
          style={{ color: 'var(--color-text)' }}
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          disabled={value.length === 0}
          className="py-3.5 rounded-xl text-sm font-bold transition active:scale-95 disabled:opacity-30"
          style={{ background: 'rgba(212,160,23,0.08)', color: 'var(--color-gold)' }}
        >
          ลบ
        </button>
      </div>
    </div>
  )
}
