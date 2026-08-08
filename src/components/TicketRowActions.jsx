import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../i18n/LanguageContext'

export default function TicketRowActions({
  ticket,
  busy,
  isAdmin,
  onView,
  onEdit,
  onExportPdf,
  onExportExcel,
  onExportPdfExcelStyle,
  onUnexport,
  onDelete,
}) {
  const { t } = useLanguage()
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
      const menuWidth = 144 // w-36
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
    action()
  }

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={t('Thao tác')}
        className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 text-lg leading-none tracking-widest hover:bg-slate-100"
      >
        ⋮
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'absolute', top: menuPos.top, left: menuPos.left }}
            className="w-36 bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1"
          >
            <button
              type="button"
              onClick={() => runAndClose(onView)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
            >
              {t('Xem chi tiết')}
            </button>
            <button
              type="button"
              onClick={() => runAndClose(onEdit)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
            >
              {t('Sửa')}
            </button>
            {/* Tạm ẩn nút "Xuất PDF" cũ theo yêu cầu - nút "Xuất PDF giống Excel"
                bên dưới đã đổi tên thành "Xuất PDF" để thay thế. Giữ nguyên
                code này (chỉ comment) để khôi phục lại dễ dàng khi cần. */}
            {false && (
              <button
                type="button"
                disabled={busy || (ticket.exported && !isAdmin)}
                title={ticket.exported && !isAdmin ? t('Phiếu đã xuất, không thể xuất lại') : undefined}
                onClick={() => runAndClose(onExportPdf)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                {t('Xuất PDF')}
              </button>
            )}
            <button
              type="button"
              disabled={busy || (ticket.exported && !isAdmin)}
              title={ticket.exported && !isAdmin ? t('Phiếu đã xuất, không thể xuất lại') : undefined}
              onClick={() => runAndClose(onExportExcel)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              {t('Xuất Excel')}
            </button>
            <button
              type="button"
              disabled={busy || (ticket.exported && !isAdmin)}
              title={ticket.exported && !isAdmin ? t('Phiếu đã xuất, không thể xuất lại') : undefined}
              onClick={() => runAndClose(onExportPdfExcelStyle)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              {t('Xuất PDF')}
            </button>
            {isAdmin && ticket.exported && (
              <button
                type="button"
                disabled={busy}
                onClick={() => runAndClose(onUnexport)}
                className="w-full text-left px-3 py-2 text-sm text-sky-600 hover:bg-sky-50 disabled:opacity-50"
              >
                {t('Cho phép xuất lại')}
              </button>
            )}
            {ticket.status === 'DRAFT' && (
              <button
                type="button"
                disabled={busy}
                onClick={() => runAndClose(onDelete)}
                className="w-full text-left px-3 py-2 text-sm text-brand-red hover:bg-red-50 disabled:opacity-50"
              >
                {t('Xoá')}
              </button>
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}
