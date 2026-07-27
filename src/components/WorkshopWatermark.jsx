// Hoạ tiết nền "xưởng may" - lặp lại icon máy may/áo/kính lúp dày khắp màn
// hình bằng SVG <pattern>, dùng chung cho nền navy ở LoginPage lẫn khung app
// chính (Sidebar + nội dung) để đồng bộ thiết kế xuyên suốt sau đăng nhập.
export default function WorkshopWatermark({ className = '' }) {
  return (
    <svg className={`absolute inset-0 w-full h-full text-white/[0.07] ${className}`} aria-hidden="true">
      <defs>
        <symbol id="wm-sewing" viewBox="0 0 48 48">
          <path d="M6 33h29l5-5V19l-9-7H19l-3 4H9a3 3 0 0 0-3 3v4" />
          <circle cx="35" cy="16" r="1.4" fill="currentColor" stroke="none" />
          <path d="M6 33v5h35v-5" />
          <path d="M13 22v7" />
        </symbol>
        <symbol id="wm-shirt" viewBox="0 0 48 48">
          <path d="M17 13 7 19l4 6 6-3v18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V22l6 3 4-6-10-6a6 6 0 0 1-12 0Z" />
        </symbol>
        <symbol id="wm-magnifier" viewBox="0 0 48 48">
          <circle cx="20" cy="20" r="12" />
          <path d="M29 29l10 10" />
        </symbol>
        <pattern
          id="workshop-pattern"
          width="220"
          height="220"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(8)"
        >
          <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <use href="#wm-sewing" x="2" y="4" width="54" height="54" />
            <use href="#wm-shirt" x="110" y="10" width="42" height="42" transform="rotate(-10 131 31)" />
            <use href="#wm-magnifier" x="55" y="110" width="46" height="46" />
            <use href="#wm-sewing" x="140" y="130" width="58" height="58" transform="rotate(12 169 159)" />
            <use href="#wm-shirt" x="0" y="160" width="38" height="38" transform="rotate(6 19 179)" />
            <use href="#wm-magnifier" x="165" y="30" width="32" height="32" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#workshop-pattern)" />
    </svg>
  )
}
