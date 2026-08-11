import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

const MAX_DIMENSION = 1600
const COLORS = ['#ef4444', '#111827', '#facc15']
const MIN_CROP_SIZE = 24
const HANDLE_HIT_PX = 44

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max)
}

export default function ImageEditorModal({ file, onCancel, onConfirm }) {
  const { t } = useLanguage()
  const canvasRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [tool, setTool] = useState('crop')
  const [cropRect, setCropRect] = useState(null)
  const [color, setColor] = useState(COLORS[0])
  const [lineWidth, setLineWidth] = useState(4)
  const [canUndo, setCanUndo] = useState(false)
  const historyRef = useRef([])
  const cropDragRef = useRef(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef(null)

  // Load ảnh vào canvas, downscale nếu quá lớn (ảnh camera có thể vài nghìn px, nặng cho canvas & upload)
  useEffect(() => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = canvasRef.current
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      setCropRect({ x: 0, y: 0, w, h })
      setReady(true)
      URL.revokeObjectURL(url)
    }
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Buộc re-render để overlay cắt ảnh tính lại vị trí theo kích thước hiển thị mới (xoay màn hình, đổi cỡ)
  const [, bumpTick] = useState(0)
  useEffect(() => {
    const onResize = () => bumpTick((n) => n + 1)
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])

  function pushHistory() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    historyRef.current.push({
      data: ctx.getImageData(0, 0, canvas.width, canvas.height),
      w: canvas.width,
      h: canvas.height,
    })
    if (historyRef.current.length > 20) historyRef.current.shift()
    setCanUndo(true)
  }

  function undo() {
    const snap = historyRef.current.pop()
    if (!snap) return
    const canvas = canvasRef.current
    canvas.width = snap.w
    canvas.height = snap.h
    canvas.getContext('2d').putImageData(snap.data, 0, 0)
    setCropRect({ x: 0, y: 0, w: snap.w, h: snap.h })
    setCanUndo(historyRef.current.length > 0)
  }

  function toCanvasPoint(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    }
  }

  // ---- Vẽ tự do ----
  function handleDrawDown(e) {
    if (tool !== 'draw') return
    e.currentTarget.setPointerCapture(e.pointerId)
    pushHistory()
    drawingRef.current = true
    const p = toCanvasPoint(e)
    lastPointRef.current = p
    const ctx = canvasRef.current.getContext('2d')
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(p.x, p.y, lineWidth / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  function handleDrawMove(e) {
    if (tool !== 'draw' || !drawingRef.current) return
    const p = toCanvasPoint(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    lastPointRef.current = p
  }

  function handleDrawUp() {
    drawingRef.current = false
  }

  // ---- Cắt ảnh ----
  function hitTestHandle(e) {
    const canvas = canvasRef.current
    const domRect = canvas.getBoundingClientRect()
    const scale = domRect.width / canvas.width
    const cx = domRect.left + cropRect.x * scale
    const cy = domRect.top + cropRect.y * scale
    const cw = cropRect.w * scale
    const ch = cropRect.h * scale
    const corners = {
      nw: { x: cx, y: cy },
      ne: { x: cx + cw, y: cy },
      sw: { x: cx, y: cy + ch },
      se: { x: cx + cw, y: cy + ch },
    }
    for (const key of Object.keys(corners)) {
      const pos = corners[key]
      if (Math.abs(e.clientX - pos.x) <= HANDLE_HIT_PX / 2 && Math.abs(e.clientY - pos.y) <= HANDLE_HIT_PX / 2) {
        return key
      }
    }
    if (e.clientX >= cx && e.clientX <= cx + cw && e.clientY >= cy && e.clientY <= cy + ch) {
      return 'move'
    }
    return null
  }

  function handleCropDown(e) {
    if (tool !== 'crop' || !cropRect) return
    const mode = hitTestHandle(e)
    if (!mode) return
    e.currentTarget.setPointerCapture(e.pointerId)
    cropDragRef.current = { mode, start: toCanvasPoint(e), startRect: { ...cropRect } }
  }

  function handleCropMove(e) {
    if (tool !== 'crop' || !cropDragRef.current) return
    const canvas = canvasRef.current
    const p = toCanvasPoint(e)
    const { mode, start, startRect } = cropDragRef.current
    const dx = p.x - start.x
    const dy = p.y - start.y
    const next = { ...startRect }

    if (mode === 'move') {
      next.x = clamp(startRect.x + dx, 0, canvas.width - startRect.w)
      next.y = clamp(startRect.y + dy, 0, canvas.height - startRect.h)
    } else {
      if (mode.includes('w')) {
        const newX = clamp(startRect.x + dx, 0, startRect.x + startRect.w - MIN_CROP_SIZE)
        next.w = startRect.w - (newX - startRect.x)
        next.x = newX
      }
      if (mode.includes('e')) {
        next.w = clamp(startRect.w + dx, MIN_CROP_SIZE, canvas.width - startRect.x)
      }
      if (mode.includes('n')) {
        const newY = clamp(startRect.y + dy, 0, startRect.y + startRect.h - MIN_CROP_SIZE)
        next.h = startRect.h - (newY - startRect.y)
        next.y = newY
      }
      if (mode.includes('s')) {
        next.h = clamp(startRect.h + dy, MIN_CROP_SIZE, canvas.height - startRect.y)
      }
    }
    setCropRect(next)
  }

  function handleCropUp() {
    cropDragRef.current = null
  }

  function applyCrop() {
    if (!cropRect) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const x = Math.round(cropRect.x)
    const y = Math.round(cropRect.y)
    const w = Math.round(cropRect.w)
    const h = Math.round(cropRect.h)
    if (w === canvas.width && h === canvas.height) return
    pushHistory()
    const data = ctx.getImageData(x, y, w, h)
    canvas.width = w
    canvas.height = h
    ctx.putImageData(data, 0, 0)
    setCropRect({ x: 0, y: 0, w, h })
  }

  // Người dùng muốn ảnh chụp (đã crop/vẽ) tự lưu về máy luôn khi bấm "Dùng ảnh
  // này", không chỉ upload lên server - tạo link tải tạm rồi click giả lập.
  function downloadBlob(blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `capture-${Date.now()}.jpg`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function handleConfirm() {
    canvasRef.current.toBlob(
      (blob) => {
        if (!blob) return
        downloadBlob(blob)
        onConfirm(blob)
      },
      'image/jpeg',
      0.9,
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-lg w-full max-w-lg flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between p-3 border-b border-slate-200">
          <span className="font-semibold text-sm text-slate-700">{t('Chỉnh sửa ảnh')}</span>
          <div className="flex gap-1">
            <ToolButton active={tool === 'crop'} onClick={() => setTool('crop')} label={t('Cắt ảnh')} />
            <ToolButton active={tool === 'draw'} onClick={() => setTool('draw')} label={t('Vẽ')} />
          </div>
        </div>

        <div className="relative flex-1 overflow-auto bg-slate-100 p-3 flex items-center justify-center">
          {!ready && <span className="text-xs text-slate-400">{t('Đang tải ảnh...')}</span>}
          <div className="relative" style={{ touchAction: 'none' }}>
            <canvas
              ref={canvasRef}
              className="max-w-full block rounded"
              style={{ display: ready ? 'block' : 'none', touchAction: 'none' }}
              onPointerDown={(e) => {
                handleDrawDown(e)
                handleCropDown(e)
              }}
              onPointerMove={(e) => {
                handleDrawMove(e)
                handleCropMove(e)
              }}
              onPointerUp={(e) => {
                handleDrawUp(e)
                handleCropUp(e)
              }}
              onPointerLeave={() => handleDrawUp()}
            />
            {ready && tool === 'crop' && cropRect && <CropOverlay canvasRef={canvasRef} cropRect={cropRect} />}
          </div>
        </div>

        {tool === 'draw' && (
          <div className="flex items-center gap-3 px-3 py-2 border-t border-slate-200">
            <div className="flex gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={t('Màu {{color}}', { color: c })}
                  className={`w-6 h-6 rounded-full border-2 ${
                    color === c ? 'border-brand-navy' : 'border-slate-200'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <input
              type="range"
              min="2"
              max="16"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="flex-1"
            />
          </div>
        )}
        {tool === 'crop' && (
          <div className="px-3 py-2 border-t border-slate-200">
            <button
              type="button"
              onClick={applyCrop}
              className="text-xs font-medium border border-slate-300 rounded-md px-3 py-1.5 hover:bg-slate-50"
            >
              {t('Áp dụng cắt')}
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 p-3 border-t border-slate-200">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="text-xs font-medium text-slate-500 hover:text-brand-navy disabled:opacity-40"
          >
            {t('Hoàn tác')}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm font-medium border border-slate-300 rounded-md px-4 py-2 hover:bg-slate-50"
            >
              {t('Huỷ')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!ready}
              className="text-sm font-semibold bg-brand-navy text-white rounded-md px-4 py-2 hover:opacity-90 disabled:opacity-50"
            >
              {t('Dùng ảnh này')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToolButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-medium rounded-md px-3 py-1.5 ${
        active ? 'bg-brand-navy text-white' : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  )
}

function CropOverlay({ canvasRef, cropRect }) {
  const canvas = canvasRef.current
  if (!canvas) return null
  const domRect = canvas.getBoundingClientRect()
  const scale = domRect.width / canvas.width
  const style = {
    left: cropRect.x * scale,
    top: cropRect.y * scale,
    width: cropRect.w * scale,
    height: cropRect.h * scale,
    boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
  }
  return (
    <div className="absolute border-2 border-brand-navy pointer-events-none" style={style}>
      {['nw', 'ne', 'sw', 'se'].map((pos) => (
        <div key={pos} className="absolute w-3 h-3 bg-brand-navy rounded-full" style={cornerStyle(pos)} />
      ))}
    </div>
  )
}

function cornerStyle(pos) {
  const base = { transform: 'translate(-50%, -50%)' }
  if (pos === 'nw') return { ...base, left: 0, top: 0 }
  if (pos === 'ne') return { ...base, left: '100%', top: 0 }
  if (pos === 'sw') return { ...base, left: 0, top: '100%' }
  return { ...base, left: '100%', top: '100%' }
}
