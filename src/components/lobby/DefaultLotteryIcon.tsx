// SVG icon สวยๆ สำหรับ default card background (เมื่อ admin ไม่ได้อัพโหลดรูป)
// Parent: src/components/lobby/LotteryCard.tsx

export default function DefaultLotteryIcon({ cat, emoji }: { cat: string; emoji: string }) {
  const svgIcons: Record<string, React.ReactNode> = {
    thai: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="3" />
      </svg>
    ),
    yeekee: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
        <line x1="22" y1="12" x2="18" y2="12" /><line x1="6" y1="12" x2="2" y2="12" />
        <line x1="12" y1="6" x2="12" y2="2" /><line x1="12" y1="22" x2="12" y2="18" />
      </svg>
    ),
    lao: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </svg>
    ),
    hanoi: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="none">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ),
    malay: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="white" fillOpacity="0.2" />
        <polygon points="17,8 18,10.5 20.5,10.5 18.5,12 19.2,14.5 17,13 14.8,14.5 15.5,12 13.5,10.5 16,10.5" fill="white" />
      </svg>
    ),
    stock: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  }

  return (svgIcons[cat] || <span style={{ fontSize: 24, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>{emoji}</span>) as React.ReactElement
}
