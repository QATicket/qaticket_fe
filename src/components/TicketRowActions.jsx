import { useEffect, useRef, useState } from 'react'

export default function TicketRowActions({ ticket, busy, onView, onEdit, onExportPdf, onExportExcel, onDelete }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function runAndClose(action) {
    setOpen(false)
    action()
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Thao tác"
        className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 text-lg leading-none tracking-widest hover:bg-slate-100"
      >
        ⋮
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-md shadow-lg z-10 py-1">
          <button
            type="button"
            onClick={() => runAndClose(onView)}
            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
          >
            Xem chi tiết
          </button>
          <button
            type="button"
            onClick={() => runAndClose(onEdit)}
            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
          >
            Sửa
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => runAndClose(onExportPdf)}
            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Xuất PDF
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => runAndClose(onExportExcel)}
            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Xuất Excel
          </button>
          {ticket.status === 'DRAFT' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => runAndClose(onDelete)}
              className="w-full text-left px-3 py-2 text-sm text-brand-red hover:bg-red-50 disabled:opacity-50"
            >
              Xoá
            </button>
          )}
        </div>
      )}
    </div>
  )
}
