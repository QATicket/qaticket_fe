import { jsPDF } from 'jspdf'
import { getQaTicket } from '../api/qaTickets'

const STATUS_LABEL = { DRAFT: 'Nháp', SUBMITTED: 'Đã nộp' }
const PAGE_MARGIN = 14
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2
const IMG_SIZE = 45
const IMG_GAP = 4
const IMAGES_PER_ROW = 3

async function loadImageAsJpegDataUrl(url, maxDim = 900) {
  // "no-store" bắt buộc gọi mạng lại thay vì dùng cache "opaque" mà trình duyệt
  // có thể đã lưu từ lần load ảnh trước đó qua thẻ <img> (no-cors) — cache đó
  // không tái sử dụng được cho fetch chế độ CORS dù server đã trả đúng header.
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Không đọc được ảnh'))
      el.src = objectUrl
    })

    const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
    const w = Math.max(1, Math.round(img.width * scale))
    const h = Math.max(1, Math.round(img.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)

    return { dataUrl: canvas.toDataURL('image/jpeg', 0.82), width: img.width, height: img.height }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function makeLayout(doc) {
  let y = PAGE_MARGIN

  function ensureSpace(needed) {
    if (y + needed > PAGE_HEIGHT - PAGE_MARGIN) {
      doc.addPage()
      y = PAGE_MARGIN
    }
  }

  function text(str, x, size, opts = {}) {
    doc.setFontSize(size)
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    doc.text(String(str ?? '—'), x, y, opts.textOpts)
  }

  function line(label, value) {
    ensureSpace(6)
    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    doc.text(label, PAGE_MARGIN, y)
    doc.setTextColor(20)
    doc.setFont('helvetica', 'bold')
    doc.text(String(value ?? '—'), PAGE_MARGIN + 55, y)
    y += 6
  }

  function heading(str, size = 12) {
    ensureSpace(9)
    doc.setTextColor(20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(size)
    doc.text(str, PAGE_MARGIN, y)
    y += size === 12 ? 7 : 6
  }

  function divider() {
    ensureSpace(4)
    doc.setDrawColor(220)
    doc.line(PAGE_MARGIN, y, PAGE_WIDTH - PAGE_MARGIN, y)
    y += 5
  }

  return {
    get y() { return y },
    set y(v) { y = v },
    ensureSpace,
    text,
    line,
    heading,
    divider,
  }
}

/**
 * Lấy chi tiết phiếu QA theo id, dựng file PDF (kèm ảnh đã upload trong từng vị trí lỗi)
 * và trigger tải xuống ngay trên trình duyệt.
 */
export async function exportTicketPdf(ticketId, { onProgress } = {}) {
  onProgress?.('Đang tải dữ liệu phiếu...')
  const ticket = await getQaTicket(ticketId)

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const L = makeLayout(doc)

  L.heading(`PHIẾU QA CHECKING - ${ticket.ticketCode || ''}`, 14)
  L.divider()

  L.line('Nhân viên QA', ticket.staff?.name)
  L.line('Trạng thái', STATUS_LABEL[ticket.status] || ticket.status)
  L.line('Nhà máy', ticket.factory?.name)
  L.line('Chuyền', ticket.line?.name)
  L.line('Cụm / Group', ticket.group?.name)
  L.line('PO', ticket.purchaseOrder?.name)
  L.line('Khách hàng', ticket.customer?.name)
  L.line('Loại sản phẩm', ticket.garmentType?.name)
  L.line('Khâu kiểm tra', ticket.inspectionStage)
  L.line('Sản lượng kiểm tra', ticket.inspectedQty)
  L.line('Đã xuất', ticket.exported ? 'Có' : 'Không')
  L.line('Ngày tạo', ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('vi-VN') : null)

  L.y += 3
  L.divider()
  L.heading(`Danh sách lỗi (${ticket.defects?.length || 0})`)

  const defects = ticket.defects || []
  if (defects.length === 0) {
    L.ensureSpace(6)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.setTextColor(120)
    doc.text('Không có defect nào', PAGE_MARGIN, L.y)
    L.y += 6
  }

  for (let di = 0; di < defects.length; di++) {
    const defect = defects[di]
    L.ensureSpace(8)
    doc.setFillColor(254, 226, 226)
    doc.rect(PAGE_MARGIN, L.y - 4.5, CONTENT_WIDTH, 6.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(30)
    const defectName = defect.defectItem?.name || defect.defect?.name || 'Lỗi'
    const severityLabel = defect.severity === 'MAJOR' ? 'Major' : defect.severity === 'MINOR' ? 'Minor' : ''
    doc.text(
      `${di + 1}. ${defectName}${severityLabel ? ` [${severityLabel}]` : ''}`,
      PAGE_MARGIN + 2,
      L.y,
    )
    L.y += 6.5

    if (defect.note) {
      L.ensureSpace(5)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(90)
      const noteLines = doc.splitTextToSize(`Ghi chú: ${defect.note}`, CONTENT_WIDTH - 4)
      noteLines.forEach((ln) => {
        L.ensureSpace(4.5)
        doc.text(ln, PAGE_MARGIN + 2, L.y)
        L.y += 4.5
      })
    }

    const locations = defect.locations || []
    for (let li = 0; li < locations.length; li++) {
      const loc = locations[li]
      L.ensureSpace(6)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(40)
      doc.text(`Vị trí ${li + 1}: ${loc.locationText || '—'}   (SL: ${loc.quantity ?? '—'})`, PAGE_MARGIN + 4, L.y)
      L.y += 5.5

      const images = loc.images || []
      if (images.length > 0) {
        onProgress?.(`Đang xử lý ảnh: defect ${di + 1}, vị trí ${li + 1}...`)
        for (let ii = 0; ii < images.length; ii++) {
          const col = ii % IMAGES_PER_ROW
          if (col === 0) L.ensureSpace(IMG_SIZE + IMG_GAP)
          const x = PAGE_MARGIN + 4 + col * (IMG_SIZE + IMG_GAP)

          try {
            const { dataUrl, width, height } = await loadImageAsJpegDataUrl(images[ii].imageUrl)
            const ratio = width / height
            let w = IMG_SIZE
            let h = IMG_SIZE
            if (ratio > 1) h = IMG_SIZE / ratio
            else w = IMG_SIZE * ratio
            const offsetX = x + (IMG_SIZE - w) / 2
            const offsetY = L.y + (IMG_SIZE - h) / 2
            doc.setDrawColor(210)
            doc.rect(x, L.y, IMG_SIZE, IMG_SIZE)
            doc.addImage(dataUrl, 'JPEG', offsetX, offsetY, w, h)
          } catch (err) {
            console.error(`[pdfExport] Không tải được ảnh: ${images[ii].imageUrl}`, err)
            doc.setDrawColor(210)
            doc.rect(x, L.y, IMG_SIZE, IMG_SIZE)
            doc.setFont('helvetica', 'italic')
            doc.setFontSize(7.5)
            doc.setTextColor(150)
            doc.text('Không tải được ảnh', x + IMG_SIZE / 2, L.y + IMG_SIZE / 2, { align: 'center' })
          }

          if (col === IMAGES_PER_ROW - 1 || ii === images.length - 1) {
            L.y += IMG_SIZE + IMG_GAP
          }
        }
      }
      L.y += 2
    }
    L.y += 3
  }

  onProgress?.('Đang tạo file PDF...')
  doc.save(`Phieu_QA_${ticket.ticketCode || ticketId}.pdf`)
}
