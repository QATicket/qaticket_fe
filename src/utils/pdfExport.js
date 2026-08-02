import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getQaTicket } from '../api/qaTickets'
import { QC_CHECKLIST_GROUPS, defaultQcChecklistValues } from './qcChecklist'

// Layout PDF theo mẫu công ty (NHA BE CORPORATION): 5 phần nối tiếp trong 1 file,
// mỗi phần bắt đầu 1 trang mới, đều lặp lại khối header giống nhau (build bằng
// drawHeader). Cấu trúc bảng/nhóm lấy đúng dữ liệu thật đang dùng cho excelExport.js
// (cùng nguồn ticket, cùng QC_CHECKLIST_GROUPS) - KHÔNG bịa field mà BE chưa trả
// (vd Supplier, Cutting/Sewing/Packing Qty, MDA#, QR code, version/khoá...).
const STATUS_LABEL = { DRAFT: 'Nháp', SUBMITTED: 'Đã nộp' }
const STAGE_LABEL = {
  FIRST_OUTPUT: 'First Output',
  INLINE: 'Inline',
  ENDLINE: 'Endline',
  PREFINAL: 'Pre-Final',
  FINAL: 'Final',
  PACKING: 'Packing',
}
const SPEC_IMAGE_TYPE_LABELS = {
  APPROVED_SAMPLE: 'Mẫu duyệt (Approved Sample)',
  SIZE_SPEC: 'Bảng thông số kích thước',
  PACKING: 'Quy cách đóng thùng/Bao bì',
  HANGTAG_LABEL: 'Thẻ treo & Nhãn hiệu',
}

const PAGE_MARGIN = 10
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2
const BORDER_COLOR = [0, 0, 0]
const BORDER_WIDTH = 0.15
const PIC_GAP = 5

// Font base14 (Helvetica...) của jsPDF chỉ có WinAnsi/Latin-1, thiếu hẳn các ký
// tự tiếng Việt tổ hợp dấu (ư, ơ, đ, ệ, ắ...) nằm ở khối Latin Extended Additional
// -> chữ bị vỡ/mất dấu. Nhúng DejaVu Sans (phủ đủ khối này, cách làm phổ biến cho
// PDF tiếng Việt) làm font TTF Unicode duy nhất dùng trong toàn bộ file.
const FONT_FAMILY = 'DejaVuSans'
const FONT_REGULAR_URL = '/fonts/DejaVuSans.ttf'
const FONT_BOLD_URL = '/fonts/DejaVuSans-Bold.ttf'
let cachedFontBase64 = null

function arrayBufferToBase64(buffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

// Cache base64 font trong bộ nhớ - tránh fetch lại ~1.4MB font mỗi lần xuất PDF
// trong cùng phiên làm việc (xuất nhiều ticket liên tiếp từ TicketListPage).
async function registerVietnameseFont(doc) {
  if (!cachedFontBase64) {
    const [regularBuf, boldBuf] = await Promise.all([
      fetch(FONT_REGULAR_URL).then((res) => res.arrayBuffer()),
      fetch(FONT_BOLD_URL).then((res) => res.arrayBuffer()),
    ])
    cachedFontBase64 = {
      regular: arrayBufferToBase64(regularBuf),
      bold: arrayBufferToBase64(boldBuf),
    }
  }
  doc.addFileToVFS('DejaVuSans.ttf', cachedFontBase64.regular)
  doc.addFont('DejaVuSans.ttf', FONT_FAMILY, 'normal')
  doc.addFileToVFS('DejaVuSans-Bold.ttf', cachedFontBase64.bold)
  doc.addFont('DejaVuSans-Bold.ttf', FONT_FAMILY, 'bold')
  doc.setFont(FONT_FAMILY, 'normal')
}

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

function formatDateOnly(isoString) {
  if (!isoString) return '—'
  const d = new Date(isoString)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

// Khối header dùng chung cho cả 5 trang: tiêu đề phần bên trái (+ dòng phụ AQL
// level chỉ ở trang Inspection Report), trạng thái/ngày tạo bên phải, và 1 bảng
// info 2-3 dòng bên dưới. extraRow chỉ truyền ở trang Inspection Report (thêm
// Inspector/Factory/Line) - các trang còn lại dùng chung info cơ bản.
function drawHeader(doc, ticket, sheetTitle, { showAqlLine = false, extraRow = null, titleColor = [20, 20, 20] } = {}) {
  let y = PAGE_MARGIN

  doc.setFont(FONT_FAMILY, 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...titleColor)
  doc.text(sheetTitle, PAGE_MARGIN, y + 5)

  if (showAqlLine && ticket.aqlLevel) {
    doc.setFont(FONT_FAMILY, 'normal')
    doc.setFontSize(9)
    doc.setTextColor(90)
    doc.text(`AQL ${ticket.aqlLevel}, LEVEL 2`, PAGE_MARGIN, y + 11)
  }

  doc.setFont(FONT_FAMILY, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(90)
  doc.text(`Trạng thái: ${STATUS_LABEL[ticket.status] || ticket.status || '—'}`, PAGE_WIDTH - PAGE_MARGIN, y + 4, {
    align: 'right',
  })
  doc.text(`Ngày tạo: ${formatDateOnly(ticket.createdAt)}`, PAGE_WIDTH - PAGE_MARGIN, y + 9, { align: 'right' })

  y += 16

  const rows = [
    ['Customer (KH)', ticket.customerName || '—', 'Style (Mã hàng)', ticket.style || '—'],
    ['PO', ticket.poNumber || '—', 'SL thực kiểm', ticket.inspectedQty ?? '—'],
    [
      'Khâu kiểm tra',
      STAGE_LABEL[ticket.inspectionStage] || ticket.inspectionStage || '—',
      'Sample size',
      ticket.qtySize ?? '—',
    ],
  ]
  if (ticket.aqlLevel || ticket.samplingSize) {
    rows.push(['AQL Level', ticket.aqlLevel || '—', 'Sampling size (AQL)', ticket.samplingSize ?? '—'])
  }
  if (extraRow) rows.push(extraRow)

  autoTable(doc, {
    startY: y,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    body: rows,
    theme: 'grid',
    styles: {
      font: FONT_FAMILY,
      fontSize: 8.5,
      cellPadding: 1.8,
      lineColor: BORDER_COLOR,
      lineWidth: BORDER_WIDTH,
      textColor: 20,
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: CONTENT_WIDTH * 0.2 },
      1: { cellWidth: CONTENT_WIDTH * 0.3 },
      2: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: CONTENT_WIDTH * 0.2 },
      3: { cellWidth: CONTENT_WIDTH * 0.3 },
    },
  })

  return doc.lastAutoTable.finalY + 4
}

// Bảng MATERIALS (3 cột nhóm lớn, dựng bằng 3 bảng con đặt cạnh nhau) - lấy
// đúng cấu trúc QC_CHECKLIST_GROUPS đang dùng cho Excel export, không hard-code
// lại danh sách hạng mục để tránh lệch 2 nguồn khi qcChecklist.js đổi.
const MATERIALS_COLUMNS = [['fabric', 'colours'], ['accessories', 'labels-appearance'], ['packing']]

function drawMaterialsSection(doc, startY, qcChecklistValues) {
  const values = qcChecklistValues || defaultQcChecklistValues()

  doc.setFont(FONT_FAMILY, 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(20)
  doc.text('MATERIALS', PAGE_MARGIN, startY)
  const tableStartY = startY + 3

  const colWidth = CONTENT_WIDTH / 3
  let maxFinalY = tableStartY

  MATERIALS_COLUMNS.forEach((groupIds, colIndex) => {
    const body = []
    groupIds.forEach((gid) => {
      const group = QC_CHECKLIST_GROUPS.find((g) => g.id === gid)
      if (!group) return
      body.push([{ content: group.title, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }])
      group.items.forEach((item) => {
        const v = values[item.id]
        body.push([item.label, v === 'x' ? '' : 'V', v === 'x' ? 'X' : ''])
      })
    })

    autoTable(doc, {
      startY: tableStartY,
      margin: { left: PAGE_MARGIN + colIndex * colWidth },
      tableWidth: colWidth - 2,
      body,
      theme: 'grid',
      styles: {
        font: FONT_FAMILY,
        fontSize: 6.8,
        cellPadding: 1,
        lineColor: BORDER_COLOR,
        lineWidth: BORDER_WIDTH,
        textColor: 20,
      },
      columnStyles: {
        0: { cellWidth: colWidth - 2 - 12 },
        1: { cellWidth: 6, halign: 'center' },
        2: { cellWidth: 6, halign: 'center' },
      },
    })
    maxFinalY = Math.max(maxFinalY, doc.lastAutoTable.finalY)
  })

  return maxFinalY + 5
}

// Gom defect của ticket theo nhóm (defect.name) -> item (defectItem.name),
// giống aggregateDefects() trong excelExport.js nhưng cho 1 ticket duy nhất.
function groupDefectsForPdf(ticket) {
  const categories = new Map()
  for (const d of ticket.defects || []) {
    const categoryId = d.defect?.id ?? d.defectItem?.id ?? 'unknown'
    const categoryName = d.defect?.name || d.defectItem?.name || 'Khác'
    const itemName = d.defectItem?.name || d.defect?.name || 'Lỗi'
    const severity = d.severity === 'MAJOR' ? 'MAJOR' : 'MINOR'
    const qty = (d.locations || []).reduce((sum, loc) => sum + (loc.quantity || 0), 0)
    if (!categories.has(categoryId)) categories.set(categoryId, { name: categoryName, items: [] })
    categories.get(categoryId).items.push({ itemName, severity, qty, note: d.note })
  }
  return categories
}

function drawInspectionPointsSection(doc, startY, ticket) {
  doc.setFont(FONT_FAMILY, 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(20)
  doc.text('INSPECTION POINTS', PAGE_MARGIN, startY)
  const tableStartY = startY + 3

  const categories = groupDefectsForPdf(ticket)
  const body = []
  if (categories.size === 0) {
    body.push([{ content: 'Không có defect nào', colSpan: 4, styles: { fontStyle: 'normal', textColor: 130 } }])
  }
  for (const category of categories.values()) {
    body.push([{ content: category.name, colSpan: 4, styles: { fontStyle: 'bold', fillColor: [254, 226, 226] } }])
    for (const item of category.items) {
      body.push([
        item.itemName,
        item.severity === 'MAJOR' ? String(item.qty) : '',
        item.severity === 'MINOR' ? String(item.qty) : '',
        item.note || '',
      ])
    }
  }

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [['Tên điểm kiểm tra', 'Major', 'Minor', 'Remark']],
    body,
    theme: 'grid',
    styles: {
      font: FONT_FAMILY,
      fontSize: 8,
      cellPadding: 1.5,
      lineColor: BORDER_COLOR,
      lineWidth: BORDER_WIDTH,
      textColor: 20,
    },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: CONTENT_WIDTH - 20 - 20 - 40 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 40 },
    },
  })
}

function collectDefectImagesForPdf(ticket, severity) {
  const entries = []
  for (const d of ticket.defects || []) {
    const defectSeverity = d.severity === 'MAJOR' ? 'MAJOR' : 'MINOR'
    if (defectSeverity !== severity) continue
    const name = d.defectItem?.name || d.defect?.name || 'Khác'
    for (const loc of d.locations || []) {
      for (const img of loc.images || []) {
        if (img.imageUrl) entries.push({ name, imageUrl: img.imageUrl })
      }
    }
  }
  return entries
}

// Trang lưới ảnh dùng chung cho Measurement sheet / Picture Accept / Picture
// Major Defects / Picture Minor Defects: header giống nhau (chỉ khác tiêu đề +
// màu), ảnh fit giữ tỉ lệ trong khung viền, tự sang trang mới khi hết chỗ.
async function drawPictureGridPage(doc, ticket, sheetTitle, entries, options = {}) {
  const { titleColor, captionOf, emptyMessage, onProgress, progressPrefix, cols = 2, boxSize = 78 } = options

  doc.addPage()
  let y = drawHeader(doc, ticket, sheetTitle, { titleColor })

  if (entries.length === 0) {
    doc.setFont(FONT_FAMILY, 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(130)
    doc.text(emptyMessage || 'Không có ảnh', PAGE_MARGIN, y + 4)
    return
  }

  const colWidth = (CONTENT_WIDTH - PIC_GAP * (cols - 1)) / cols
  const captionH = captionOf ? 6 : 2

  for (let i = 0; i < entries.length; i++) {
    const col = i % cols
    if (col === 0 && y + boxSize + captionH > PAGE_HEIGHT - PAGE_MARGIN) {
      doc.addPage()
      y = drawHeader(doc, ticket, sheetTitle, { titleColor })
    }
    const x = PAGE_MARGIN + col * (colWidth + PIC_GAP)
    onProgress?.(`${progressPrefix || 'Đang xử lý ảnh'} ${i + 1}/${entries.length}...`)

    doc.setDrawColor(180)
    doc.setLineWidth(BORDER_WIDTH)
    doc.rect(x, y, colWidth, boxSize)

    try {
      const { dataUrl, width, height } = await loadImageAsJpegDataUrl(entries[i].imageUrl)
      const ratio = width / height
      let w = colWidth - 4
      let h = w / ratio
      if (h > boxSize - 4) {
        h = boxSize - 4
        w = h * ratio
      }
      doc.addImage(dataUrl, 'JPEG', x + (colWidth - w) / 2, y + (boxSize - h) / 2, w, h)
    } catch (err) {
      console.error(`[pdfExport] Không tải được ảnh: ${entries[i].imageUrl}`, err)
      doc.setFont(FONT_FAMILY, 'normal')
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text('Không tải được ảnh', x + colWidth / 2, y + boxSize / 2, { align: 'center' })
    }

    const caption = captionOf ? captionOf(entries[i]) : null
    if (caption) {
      doc.setFont(FONT_FAMILY, 'normal')
      doc.setFontSize(8)
      doc.setTextColor(60)
      doc.text(doc.splitTextToSize(caption, colWidth - 2), x + 1, y + boxSize + 4)
    }

    if (col === cols - 1 || i === entries.length - 1) {
      y += boxSize + captionH + PIC_GAP
    }
  }
}

/**
 * Lấy chi tiết phiếu QA theo id, dựng file PDF nhiều trang theo mẫu công ty
 * (Inspection Report + Materials/Inspection Points, Measurement sheet, Picture
 * Accept, Picture Major Defects, Picture Minor Defects) và trigger tải xuống
 * ngay trên trình duyệt. qcChecklistValues (v/x Materials) truyền từ
 * QcChecklistModal giống flow exportTicketsExcel - để trống thì mặc định "v".
 */
export async function exportTicketPdf(ticketId, { onProgress, qcChecklistValues } = {}) {
  onProgress?.('Đang tải dữ liệu phiếu...')
  const ticket = await getQaTicket(ticketId)

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  onProgress?.('Đang nạp font tiếng Việt...')
  await registerVietnameseFont(doc)

  let y = drawHeader(doc, ticket, 'In-line / Final Inspection Report', {
    showAqlLine: true,
    extraRow: [
      'Inspector (Người kiểm tra)',
      ticket.staff?.name || '—',
      'Factory / Line',
      `${ticket.factory?.name || '—'} / ${ticket.line?.name || '—'}`,
    ],
  })
  y = drawMaterialsSection(doc, y, qcChecklistValues)
  onProgress?.('Đang dựng bảng Inspection Points...')
  drawInspectionPointsSection(doc, y, ticket)

  onProgress?.('Đang chèn ảnh đo thông số...')
  await drawPictureGridPage(doc, ticket, 'Measurement sheet', ticket.measurementImages || [], {
    cols: 1,
    boxSize: 140,
    emptyMessage: 'Chưa có ảnh đo thông số',
    onProgress,
    progressPrefix: 'Đang xử lý ảnh đo thông số',
  })

  onProgress?.('Đang chèn ảnh Accept...')
  await drawPictureGridPage(
    doc,
    ticket,
    'Picture Accept',
    (ticket.specImages || []).filter((img) => img.imageUrl),
    {
      titleColor: [22, 163, 74],
      captionOf: (e) => SPEC_IMAGE_TYPE_LABELS[e.type] || null,
      emptyMessage: 'Chưa có ảnh duyệt (Spec Images)',
      onProgress,
      progressPrefix: 'Đang xử lý ảnh Accept',
    },
  )

  onProgress?.('Đang chèn ảnh Major Defects...')
  await drawPictureGridPage(doc, ticket, 'Picture Major Defects', collectDefectImagesForPdf(ticket, 'MAJOR'), {
    titleColor: [220, 38, 38],
    captionOf: (e) => `Defect: ${e.name}`,
    emptyMessage: 'Không có ảnh lỗi Major',
    onProgress,
    progressPrefix: 'Đang xử lý ảnh Major',
  })

  onProgress?.('Đang chèn ảnh Minor Defects...')
  await drawPictureGridPage(doc, ticket, 'Picture Minor Defects', collectDefectImagesForPdf(ticket, 'MINOR'), {
    titleColor: [147, 51, 234],
    captionOf: (e) => `Defect: ${e.name}`,
    emptyMessage: 'Không có ảnh lỗi Minor',
    onProgress,
    progressPrefix: 'Đang xử lý ảnh Minor',
  })

  onProgress?.('Đang tạo file PDF...')
  doc.save(`Phieu_QA_${ticket.ticketCode || ticketId}.pdf`)
}
