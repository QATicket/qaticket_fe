import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export default function StaffRowActions({ staff, locked, busy, onLock, onUnlock, onResetPassword }) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useLayoutEffect(() => {
    if (!open) return

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const menuWidth = 160 // w-40
      setMenuPos({
        top: rect.bottom + window.scrollY + 4,
        left: Math.max(8, rect.right + window.scrollX - menuWidth),
      })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open])

  function runAndClose(action) {
    setOpen(false)
    action(staff)
  }

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Thao tác"
        className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 text-lg leading-none tracking-widest hover:bg-slate-100"
      >
        ⋮
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'absolute', top: menuPos.top, left: menuPos.left }}
            className="w-40 bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1"
          >
            <button
              type="button"
              disabled={busy || locked === true}
              onClick={() => runAndClose(onLock)}
              className="w-full text-left px-3 py-2 text-sm text-brand-red hover:bg-red-50 disabled:opacity-50"
            >
              Khoá tài khoản
            </button>
            <button
              type="button"
              disabled={busy || locked === false}
              onClick={() => runAndClose(onUnlock)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Mở khoá
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => runAndClose(onResetPassword)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Reset mật khẩu
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}
