/**
 * NumberPad — ปุ่มกดเลขสำหรับเลือกเลขแทงหวย
 *
 * ⭐ Component นี้ใช้ร่วมกับ provider-game-web (#8) ได้เลย
 * TODO: แยกเป็น @lotto/game-ui npm package
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
  /** จำนวนหลักที่ต้องกด (เช่น 3 สำหรับ 3TOP, 2 สำหรับ 2TOP, 1 สำหรับ RUN) */
  digitCount: number
  /** callback เมื่อกดครบหลัก */
  onComplete: (number: string) => void
  /** callback เมื่อ value เปลี่ยน (ทุกครั้งที่กด) */
  onChange?: (value: string) => void
  /** ล้าง input เมื่อ value นี้เปลี่ยน (ใช้สำหรับ reset จากภายนอก) */
  resetTrigger?: number
}

export default function NumberPad({ digitCount, onComplete, onChange, resetTrigger }: NumberPadProps) {
  const [value, setValue] = useState('')

  // Reset เมื่อ resetTrigger เปลี่ยน
  useEffect(() => {
    setValue('')
  }, [resetTrigger, digitCount])

  // กดเลข
  const handleDigit = useCallback((digit: string) => {
    setValue(prev => {
      if (prev.length >= digitCount) return prev // ครบแล้ว ไม่รับเพิ่ม
      const newVal = prev + digit
      onChange?.(newVal)
      if (newVal.length === digitCount) {
        // กดครบหลัก → callback
        setTimeout(() => onComplete(newVal), 100)
      }
      return newVal
    })
  }, [digitCount, onComplete, onChange])

  // ลบตัวสุดท้าย
  const handleBackspace = useCallback(() => {
    setValue(prev => {
      const newVal = prev.slice(0, -1)
      onChange?.(newVal)
      return newVal
    })
  }, [onChange])

  // ล้างทั้งหมด
  const handleClear = useCallback(() => {
    setValue('')
    onChange?.('')
  }, [onChange])

  return (
    <div className="w-full max-w-xs mx-auto">
      {/* Display — แสดงเลขที่กด */}
      <div className="bg-gray-800 rounded-xl p-4 mb-4 text-center">
        <div className="flex justify-center gap-2">
          {Array.from({ length: digitCount }).map((_, i) => (
            <div
              key={i}
              className={`w-12 h-14 rounded-lg flex items-center justify-center text-2xl font-bold
                ${value[i] ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-500 border-2 border-dashed border-gray-600'}`}
            >
              {value[i] || '_'}
            </div>
          ))}
        </div>
        <p className="text-gray-500 text-xs mt-2">
          {value.length}/{digitCount} หลัก
        </p>
      </div>

      {/* Keypad — ปุ่มเลข 0-9 */}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
          <button
            key={digit}
            onClick={() => handleDigit(digit)}
            disabled={value.length >= digitCount}
            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600
              text-white text-xl font-semibold py-4 rounded-xl transition active:scale-95"
          >
            {digit}
          </button>
        ))}

        {/* Row สุดท้าย: Clear, 0, Backspace */}
        <button
          onClick={handleClear}
          className="bg-red-900/50 hover:bg-red-800/50 text-red-400 text-sm font-semibold py-4 rounded-xl transition"
        >
          ล้าง
        </button>
        <button
          onClick={() => handleDigit('0')}
          disabled={value.length >= digitCount}
          className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600
            text-white text-xl font-semibold py-4 rounded-xl transition active:scale-95"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          disabled={value.length === 0}
          className="bg-yellow-900/50 hover:bg-yellow-800/50 disabled:bg-gray-800 disabled:text-gray-600
            text-yellow-400 text-sm font-semibold py-4 rounded-xl transition"
        >
          ลบ
        </button>
      </div>
    </div>
  )
}
