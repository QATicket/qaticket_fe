import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getQaTicket } from '../api/qaTickets'
import {
  QC_CHECKLIST_GROUPS,
  QC_CHOICE_GROUPS,
  AQL_PENDING_FLAG_KEY,
  AQL_PENDING_REASON_KEY,
} from './qcChecklist'
import { buildExportFilename } from './excelExport'
import { AQL_SAMPLING_TABLE, lookupAqlThresholds, resolveAqlResult } from './aqlResult'

// TÍNH NĂNG RIÊNG, TÁCH BIỆT HOÀN TOÀN với pdfExport.js/excelExport.js - chỉ
// import các hằng số/hàm thuần (QC_CHECKLIST_GROUPS, QC_CHOICE_GROUPS,
// buildExportFilename), KHÔNG dùng chung code build PDF/Excel hiện có. Mục
// đích: nếu tính năng này có vấn đề, xoá file này + phần wiring nút bấm là
// xong, không ảnh hưởng "Xuất PDF"/"Xuất Excel" đang chạy tốt.
//
// Mục tiêu: trang đầu của PDF tái hiện lại đúng nội dung/bố cục sheet
// "Main Report (2)" trong file mẫu BB_PREFINAL_FINAL_template.xlsx (đã đối
// chiếu trực tiếp từ file .xlsx thật - xem các hằng số bên dưới), rồi nối
// tiếp các trang ảnh (Measurement sheet/Picture Accept/Major/Minor Defects)
// giống cấu trúc PDF hiện có.

const PAGE_MARGIN = 10
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2
const BORDER_COLOR = [0, 0, 0]
const BORDER_WIDTH = 0.15
const PIC_GAP = 5

const FONT_FAMILY = 'DejaVuSansExcelStyle'
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

// Giống hệt loadImageAsJpegDataUrl() trong pdfExport.js (đã chạy tốt với ảnh
// thật ở "Xuất PDF" hiện có) - vẽ lại qua <canvas> rồi nén JPEG, KHÔNG nhúng
// thẳng bytes gốc (đã thử và bị lỗi "Image failed to load" với ảnh thật, dù
// chạy được với ảnh test - có thể do định dạng/Content-Type gốc không khớp
// hoàn toàn cách addImage() của jsPDF tự dò).
async function loadImageAsJpegDataUrl(url, maxDim = 900) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Failed to read image'))
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

function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_HEIGHT - PAGE_MARGIN) {
    doc.addPage()
    return PAGE_MARGIN
  }
  return y
}

// ---------------------------------------------------------------------------
// Dữ liệu đối chiếu TRỰC TIẾP từ sheet "Main Report (2)" trong
// public/templates/BB_PREFINAL_FINAL_template.xlsx (đọc bằng ExcelJS, không
// suy đoán) - dùng để hiển thị đúng tiêu đề/nhãn tĩnh và bảng tra AQL giống
// hệt file mẫu.
// ---------------------------------------------------------------------------

const STAGE_LABEL = {
  FIRST_OUTPUT: 'First Output',
  INLINE: 'Inline',
  ENDLINE: 'Endline',
  PREFINAL: 'Pre-Final',
  FINAL: 'Final',
  PACKING: 'Packing',
}
const INSPECTION_STAGE_TITLE_LABELS = {
  FIRST_OUTPUT: { en: 'First Output', vi: 'FIRST OUTPUT' },
  INLINE: { en: 'Inline', vi: 'INLINE' },
  ENDLINE: { en: 'Endline', vi: 'ENDLINE' },
  PREFINAL: { en: 'Pre-Final', vi: 'PRE-FINAL' },
  FINAL: { en: 'Final', vi: 'FINAL' },
  PACKING: { en: 'Packing', vi: 'PACKING' },
}

// Bảng màu chuẩn theo yêu cầu (dùng cho cả badge "Kết quả AQL" ở đầu trang
// và các ô tô màu trong "Inspection Result - Kết quả").
const RESULT_COLOR = {
  PASS: [45, 201, 55], // #2DC937
  REJECTED: [184, 27, 14], // #B81B0E
  PENDING: [254, 220, 57], // #FEDC39
}
const RESULT_LABEL_ROWS = [
  { key: 'PASS', label: 'Pass - Đạt :' },
  { key: 'REJECTED', label: 'Rejected - K.đạt :' },
  { key: 'PENDING', label: 'Pending - Treo :' },
]
const RESULT_LABEL_SHORT = {
  PASS: 'Pass - Đạt',
  REJECTED: 'Rejected - K.đạt',
  PENDING: 'Pending - Treo',
}

// Nguồn chung duy nhất cho việc suy ra kết quả AQL hiển thị (PASS/REJECTED/
// PENDING) - dùng cả cho badge đầu trang lẫn drawResultSection() để không bị
// lệch logic Pending giữa 2 nơi (Pending là lớp phủ lên Pass, xem thêm ghi
// chú trong drawResultSection()).
function computeDisplayResult(ticket, qcChecklistValues) {
  const result = resolveAqlResult(ticket)
  if (!result) return null
  const withinAql = result === 'PASS' || result === 'PENDING'
  const isPending = withinAql && (qcChecklistValues?.[AQL_PENDING_FLAG_KEY] === true || result === 'PENDING')
  const key = isPending ? 'PENDING' : result === 'REJECTED' ? 'REJECTED' : 'PASS'
  return { key, label: RESULT_LABEL_SHORT[key] }
}

function lookupAqlAllowance(samplingSize, aqlLevel) {
  const thresholds = lookupAqlThresholds(samplingSize, aqlLevel)
  if (!thresholds) return null
  return { majorAc: thresholds.majorAc, minorAc: thresholds.minorAc }
}

// ---------------------------------------------------------------------------
// Trang "Main Report" - tái hiện sheet Main Report (2) của Excel
// ---------------------------------------------------------------------------

function drawTitle(doc, ticket) {
  const stage = INSPECTION_STAGE_TITLE_LABELS[ticket.inspectionStage] || INSPECTION_STAGE_TITLE_LABELS.FINAL
  let y = PAGE_MARGIN

  doc.setFont(FONT_FAMILY, 'bold')
  doc.setFontSize(14)
  doc.setTextColor(20)
  doc.text(`${stage.en} Inspection Report`, PAGE_WIDTH / 2, y + 6, { align: 'center' })
  doc.text(`BIÊN BẢN KIỂM TRA ${stage.vi}`, PAGE_WIDTH / 2, y + 12, { align: 'center' })

  return y + 18
}

// Badge "Kết quả AQL" đặt ở góc phải, ngay phía trên ô giá trị AQL Level
// (cột cuối, dòng đầu của bảng header vẽ ở drawHeaderInfoTable()) - chỉ vẽ
// khi đã có kết quả (không hiện gì nếu ticket chưa đủ dữ liệu để tính AQL).
function drawAqlResultBadge(doc, ticket, qcChecklistValues, tableStartY) {
  const resolved = computeDisplayResult(ticket, qcChecklistValues)
  if (!resolved) return

  const text = `Kết quả AQL: ${resolved.label}`
  doc.setFont(FONT_FAMILY, 'bold')
  doc.setFontSize(9)
  const textWidth = doc.getTextWidth(text)
  const paddingX = 3
  const boxWidth = textWidth + paddingX * 2
  const boxHeight = 6
  const x = PAGE_WIDTH - PAGE_MARGIN - boxWidth
  const y = tableStartY - boxHeight - 1

  doc.setFillColor(...RESULT_COLOR[resolved.key])
  doc.roundedRect(x, y, boxWidth, boxHeight, 1, 1, 'F')
  doc.setTextColor(...(resolved.key === 'PENDING' ? [20, 20, 20] : [255, 255, 255]))
  doc.text(text, x + boxWidth / 2, y + boxHeight / 2 + 1.1, { align: 'center' })
  doc.setTextColor(20)
}

function drawHeaderInfoTable(doc, ticket, startY) {
  const stageLabel = STAGE_LABEL[ticket.inspectionStage] || ticket.inspectionStage || '—'
  const aqlLabel = ticket.aqlLevel === '1.5' || ticket.aqlLevel === '2.5' ? `AQL ${ticket.aqlLevel}` : '—'
  // qtySize/samplingSize chỉ được BE lưu cho FINAL/PREFINAL (xem toPayload() trong
  // mapper.js - field AQL không gửi lên ở stage khác) - các stage còn lại luôn null
  // nên "Sample size" bị trống. Fallback về inspectedQty (SL kiểm tra thực tế, field
  // bắt buộc cho MỌI stage - xem validate.js) để ô này luôn có giá trị.
  const sampleSize = ticket.samplingSize ?? ticket.inspectedQty ?? '—'

  const rows = [
    ['Inspection Stage - Loại kiểm tra', stageLabel, 'AQL Level', aqlLabel],
    ['Customer (KH)', ticket.customerName || '—', 'PO', ticket.poNumber || '—'],
    ['Style (mã hàng)', ticket.style || '—', 'Date (Ngày)', formatDateOnly(ticket.createdAt)],
    ['Order Qty (SL)', ticket.qtySize ?? '—', 'Sample size (SL mẫu)', sampleSize],
    ['Shipment date\nNgày xuất', '—', 'MDA#', '—'],
    ['Inspector\nNgười kiểm tra', ticket.staff?.name || '—', '', ''],
    ['Supplier', 'NHA BE', 'Location', 'VIET NAM'],
    ['Fty Name', '—', '', ''],
    ['Cutting Qty\nSL cắt', '—', 'Sewing Qty\nSL may', '—'],
    ['Pressing Qty\nSL ủi, ép', '—', 'Packing Qty\nSL đóng gói', '—'],
  ]

  autoTable(doc, {
    startY,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    body: rows,
    theme: 'grid',
    styles: {
      font: FONT_FAMILY,
      fontSize: 8.5,
      cellPadding: 1.6,
      lineColor: BORDER_COLOR,
      lineWidth: BORDER_WIDTH,
      textColor: 20,
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: CONTENT_WIDTH * 0.22 },
      1: { cellWidth: CONTENT_WIDTH * 0.28 },
      2: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: CONTENT_WIDTH * 0.22 },
      3: { cellWidth: CONTENT_WIDTH * 0.28 },
    },
  })

  return doc.lastAutoTable.finalY + 4
}

// MATERIALS (dòng 8-24 của Main Report): tái hiện đúng vị trí dòng thật của
// từng nhóm/tiêu chí lấy từ QC_CHECKLIST_GROUPS (row/checkCol/rejectCol dò
// trực tiếp từ file mẫu, xem qcChecklist.js) - 3 cột nhóm tương ứng 3 vùng
// cột thật trong Excel (A-D / E-H / I-M), KHÔNG dùng layout 3-cột đơn giản
// hoá như pdfExport.js hiện tại.
const MATERIALS_COL1_IDS = ['fabric', 'colours']
const MATERIALS_COL2_IDS = ['accessories', 'labels-appearance']
const MATERIALS_COL3_IDS = ['packing']
const MATERIALS_FIRST_ROW = 9
const MATERIALS_LAST_ROW = 24

function buildMaterialsColumnMap(groupIds) {
  const map = new Map()
  for (const gid of groupIds) {
    const group = QC_CHECKLIST_GROUPS.find((g) => g.id === gid)
    if (!group) continue
    const headerRow = Math.min(...group.items.map((i) => i.row)) - 1
    map.set(headerRow, { type: 'header', text: group.title })
    for (const item of group.items) {
      map.set(item.row, { type: 'item', item })
    }
  }
  return map
}

function materialsCellsForRow(map, row, values) {
  const entry = map.get(row)
  if (!entry) return ['', '', '']
  if (entry.type === 'header') {
    return [{ content: entry.text, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }]
  }
  const v = values?.[entry.item.id]
  return [entry.item.label, v === 'v' ? 'V' : '', v === 'x' ? 'X' : '']
}

function drawMaterialsSection(doc, startY, qcChecklistValues) {
  let y = ensureSpace(doc, startY, 20)
  doc.setFont(FONT_FAMILY, 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(20)
  doc.text('MATERIALS', PAGE_MARGIN, y)
  const tableStartY = y + 3

  const map1 = buildMaterialsColumnMap(MATERIALS_COL1_IDS)
  const map2 = buildMaterialsColumnMap(MATERIALS_COL2_IDS)
  const map3 = buildMaterialsColumnMap(MATERIALS_COL3_IDS)

  const body = [
    [
      { content: 'MATERIALS', styles: { fontStyle: 'bold' } },
      { content: 'v', styles: { fontStyle: 'bold', halign: 'center', fillColor: [230, 230, 230] } },
      { content: 'X', styles: { fontStyle: 'bold', halign: 'center', fillColor: [230, 230, 230] } },
      '',
      { content: 'v', styles: { fontStyle: 'bold', halign: 'center', fillColor: [230, 230, 230] } },
      { content: 'X', styles: { fontStyle: 'bold', halign: 'center', fillColor: [230, 230, 230] } },
      '',
      { content: 'v', styles: { fontStyle: 'bold', halign: 'center', fillColor: [230, 230, 230] } },
      { content: 'X', styles: { fontStyle: 'bold', halign: 'center', fillColor: [230, 230, 230] } },
    ],
  ]
  for (let row = MATERIALS_FIRST_ROW; row <= MATERIALS_LAST_ROW; row++) {
    body.push([
      ...materialsCellsForRow(map1, row, qcChecklistValues),
      ...materialsCellsForRow(map2, row, qcChecklistValues),
      ...materialsCellsForRow(map3, row, qcChecklistValues),
    ])
  }

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    body,
    theme: 'grid',
    styles: {
      font: FONT_FAMILY,
      fontSize: 6.6,
      cellPadding: 1,
      lineColor: BORDER_COLOR,
      lineWidth: BORDER_WIDTH,
      textColor: 20,
    },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 8, halign: 'center' },
      2: { cellWidth: 8, halign: 'center' },
      3: { cellWidth: 42 },
      4: { cellWidth: 8, halign: 'center' },
      5: { cellWidth: 8, halign: 'center' },
      6: { cellWidth: 58 },
      7: { cellWidth: 8, halign: 'center' },
      8: { cellWidth: 8, halign: 'center' },
    },
  })

  return doc.lastAutoTable.finalY + 5
}

// Gom defect của ticket theo nhóm (defect.name) -> item (defectItem.name),
// giống aggregateDefects() trong excelExport.js nhưng cho 1 ticket duy nhất
// (bản duplicate độc lập, xem ghi chú đầu file).
function groupDefectsForPdf(ticket) {
  const categories = new Map()
  for (const d of ticket.defects || []) {
    const categoryId = d.defect?.id ?? d.defectItem?.id ?? 'unknown'
    const categoryName = d.defect?.name || d.defectItem?.name || 'Other'
    const itemName = d.defectItem?.name || d.defect?.name || 'Defect'
    const severity = d.severity === 'MAJOR' ? 'MAJOR' : 'MINOR'
    const qty = (d.locations || []).reduce((sum, loc) => sum + (loc.quantity || 0), 0)
    // Vị trí lỗi (locationText - vd "Cổ áo", "Tay trái"...) ghi trên từng vị trí
    // thực tế của defect, có thể nhiều vị trí cho cùng 1 defect item - gộp lại
    // kèm số lượng riêng của từng vị trí (không phải tổng qty ở trên).
    const location = (d.locations || [])
      .map((loc) => {
        const name = loc.locationText || loc.garmentLocation?.name || ''
        if (!name) return null
        return loc.quantity ? `${name} (${loc.quantity})` : name
      })
      .filter(Boolean)
      .join(', ')
    if (!categories.has(categoryId)) categories.set(categoryId, { name: categoryName, items: [] })
    categories.get(categoryId).items.push({ itemName, severity, qty, note: d.note, location })
  }
  return categories
}

function drawInspectionPointsSection(doc, startY, ticket) {
  let y = ensureSpace(doc, startY, 20)
  doc.setFont(FONT_FAMILY, 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(20)
  doc.text('INSPECTION POINTS( Những Điểm Kiểm Tra )', PAGE_MARGIN, y)
  const tableStartY = y + 3

  const categories = groupDefectsForPdf(ticket)
  const body = []
  let totalMajor = 0
  let totalMinor = 0
  if (categories.size === 0) {
    body.push([{ content: 'No defects', colSpan: 5, styles: { fontStyle: 'normal', textColor: 130 } }])
  }
  for (const category of categories.values()) {
    body.push([{ content: category.name, colSpan: 5, styles: { fontStyle: 'bold', fillColor: [254, 226, 226] } }])
    for (const item of category.items) {
      if (item.severity === 'MAJOR') totalMajor += item.qty
      else totalMinor += item.qty
      body.push([
        item.itemName,
        item.location || '',
        item.severity === 'MAJOR' ? String(item.qty) : '',
        item.severity === 'MINOR' ? String(item.qty) : '',
        item.note || '',
      ])
    }
  }
  const totalRowStyles = { fontStyle: 'bold', fillColor: [226, 232, 240], textColor: 20 }
  body.push([
    { content: 'Total', styles: totalRowStyles },
    { content: '', styles: totalRowStyles },
    { content: String(totalMajor), styles: { ...totalRowStyles, halign: 'center' } },
    { content: String(totalMinor), styles: { ...totalRowStyles, halign: 'center' } },
    { content: '', styles: totalRowStyles },
  ])

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [['Inspection Point Name', 'Vị trí lỗi', 'Major\nLỗi nặng', 'Minor\nLỗi nhẹ', 'Remarks ( Ghi chú )']],
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
      0: { cellWidth: 70 },
      1: { cellWidth: 40 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 40 },
    },
  })

  return doc.lastAutoTable.finalY + 5
}

// Lưu ý thông số/chất lượng (specNote/qualityNote) nhập ở form, hiển thị trong
// modal xem chi tiết (xem TicketDetailModal.jsx) - không thuộc layout gốc của
// file mẫu Excel nhưng vẫn cần xuất ra PDF nên chèn thêm ở đây, chỉ vẽ hàng
// nào có dữ liệu, bỏ hẳn cả bảng nếu ticket không có ghi chú nào.
function drawNotesSection(doc, startY, ticket) {
  const body = []
  if (ticket.specNote) body.push(['Spec Note - Lưu ý thông số', ticket.specNote])
  if (ticket.qualityNote) body.push(['Quality Note - Lưu ý chất lượng', ticket.qualityNote])
  if (body.length === 0) return startY

  const y = ensureSpace(doc, startY, 16)

  autoTable(doc, {
    startY: y,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    body,
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
      0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 45 },
      1: { cellWidth: CONTENT_WIDTH - 45 },
    },
  })

  return doc.lastAutoTable.finalY + 5
}

function drawAqlSamplingTable(doc, startY, ticket) {
  let y = ensureSpace(doc, startY, 20)
  doc.setFont(FONT_FAMILY, 'bold')
  doc.setFontSize(9)
  doc.setTextColor(20)
  doc.text('AQL SAMPLING TABLE - BẢNG TRA AQL', PAGE_MARGIN, y)
  const tableStartY = y + 3

  const body = AQL_SAMPLING_TABLE.map((row) => [
    row.range,
    String(row.sampling),
    ...row.aql25.map(String),
    ...row.aql15.map(String),
  ])

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [
      [
        { content: 'Qty size', rowSpan: 2 },
        { content: 'Sampling\nsize', rowSpan: 2 },
        { content: 'AQL 2.5, Level 2', colSpan: 4 },
        { content: 'AQL 1.5, Level 2', colSpan: 4 },
      ],
      // Không lặp lại 2 ô placeholder cho "Qty size"/"Sampling size" ở đây -
      // 2 cột đó đã dùng rowSpan:2 từ dòng head trên, autoTable tự chiếm chỗ.
      [
        'Major\nAccept',
        'Major\nReject',
        'Minor\nAccept',
        'Minor\nReject',
        'Major\nAccept',
        'Major\nReject',
        'Minor\nAccept',
        'Minor\nReject',
      ],
    ],
    body,
    theme: 'grid',
    styles: {
      font: FONT_FAMILY,
      fontSize: 6.8,
      cellPadding: 1,
      lineColor: BORDER_COLOR,
      lineWidth: BORDER_WIDTH,
      textColor: 20,
      halign: 'center',
    },
    headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: 'bold', fontSize: 6.6 },
    columnStyles: { 0: { cellWidth: 34 }, 1: { cellWidth: 14 } },
    didParseCell: (data) => {
      if (data.section !== 'body') return
      const rowData = AQL_SAMPLING_TABLE[data.row.index]
      if (rowData && Number(ticket.samplingSize) === rowData.sampling) {
        data.cell.styles.fillColor = [255, 249, 196]
      }
    },
  })

  return doc.lastAutoTable.finalY + 5
}

function drawResultSection(doc, startY, ticket, qcChecklistValues) {
  let y = ensureSpace(doc, startY, 20)
  doc.setFont(FONT_FAMILY, 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(20)
  doc.text('Inspection Result - Kết quả', PAGE_MARGIN, y)
  const tableStartY = y + 3

  const allowance = lookupAqlAllowance(ticket.samplingSize, ticket.aqlLevel)

  // Pending là lớp phủ lên Pass (vẫn trong AQL), không phải trạng thái loại
  // trừ Pass như Reject - xem writeAqlResultCell() trong excelExport.js và
  // computeDisplayResult() ở trên (cùng logic, giữ đồng bộ giữa 3 nơi).
  const resolved = computeDisplayResult(ticket, qcChecklistValues)
  const shouldFill = {
    PASS: resolved?.key === 'PASS',
    REJECTED: resolved?.key === 'REJECTED',
    PENDING: resolved?.key === 'PENDING',
  }

  const body = RESULT_LABEL_ROWS.map(({ key, label }) => [
    { content: label, styles: { fontStyle: 'bold' } },
    { content: '', styles: { fillColor: shouldFill[key] ? RESULT_COLOR[key] : [255, 255, 255] } },
  ])
  body[0].push('Major - No# of defect allowed', allowance ? String(allowance.majorAc) : '—')
  body[1].push('Minor - No# of defect allowed', allowance ? String(allowance.minorAc) : '—')
  body[2].push('No# of unit inspected', ticket.samplingSize ?? '—')

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    body,
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
      0: { cellWidth: 45 },
      1: { cellWidth: 10 },
      2: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 65 },
      3: { cellWidth: 70, halign: 'center' },
    },
  })

  y = doc.lastAutoTable.finalY + 5

  const reason = resolved?.key === 'PENDING' ? (qcChecklistValues?.[AQL_PENDING_REASON_KEY] || '').trim() : ''
  if (reason) {
    const lines = doc.splitTextToSize(`Lý do Pending - Treo: ${reason}`, CONTENT_WIDTH)
    y = ensureSpace(doc, y, lines.length * 4 + 3)
    doc.setFont(FONT_FAMILY, 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(20)
    doc.text(lines, PAGE_MARGIN, y)
    y += lines.length * 4 + 3
  }

  return y
}

function drawPackingShipmentSection(doc, startY, qcChecklistValues) {
  let y = ensureSpace(doc, startY, 16)
  doc.setFont(FONT_FAMILY, 'bold')
  doc.setFontSize(9)
  doc.setTextColor(20)
  doc.text('Packing Method & Shipment - PT đóng gói & Vận chuyển', PAGE_MARGIN, y)
  const tableStartY = y + 3

  const body = QC_CHOICE_GROUPS[0].items.map((item) => {
    const selected = qcChecklistValues?.[item.id]
    const selectedLabel = item.options.find((o) => o.id === selected)?.label || '—'
    return [item.label, selectedLabel]
  })

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    body,
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
      0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 45 },
      1: { cellWidth: CONTENT_WIDTH - 45 },
    },
  })

  return doc.lastAutoTable.finalY + 8
}

function drawMainReportPages(doc, ticket, qcChecklistValues) {
  let y = drawTitle(doc, ticket)
  drawAqlResultBadge(doc, ticket, qcChecklistValues, y)
  y = drawHeaderInfoTable(doc, ticket, y)
  y = drawMaterialsSection(doc, y, qcChecklistValues)
  y = drawInspectionPointsSection(doc, y, ticket)
  y = drawNotesSection(doc, y, ticket)
  y = drawAqlSamplingTable(doc, y, ticket)
  y = drawResultSection(doc, y, ticket, qcChecklistValues)
  drawPackingShipmentSection(doc, y, qcChecklistValues)
}

// ---------------------------------------------------------------------------
// Các trang ảnh (Measurement sheet/Picture Accept/Major/Minor Defects) - lấy
// đúng dữ liệu ticket thật, cùng cách trình bày lưới ảnh như pdfExport.js
// (bản duplicate độc lập, xem ghi chú đầu file).
// ---------------------------------------------------------------------------

const SPEC_IMAGE_TYPE_LABELS = {
  APPROVED_SAMPLE: 'Approved Sample',
  SIZE_SPEC: 'Size Spec Sheet',
  PACKING: 'Packing Specification',
  HANGTAG_LABEL: 'Hangtag & Label',
  PACKING_LIST: 'Packing List',
}
// Thứ tự trang "Picture Accept" phải khớp thứ tự các mục upload trong form
// (GeneralInfoCard.jsx): thùng hộp -> thẻ treo/nhãn -> mẫu duyệt -> packing
// list. Sort tường minh ở đây vì mảng ticket.specImages từ BE có thể theo thứ
// tự cũ (ticket tạo trước khi đổi thứ tự) - không thể trông cậy vào thứ tự BE
// trả về.
const SPEC_IMAGE_ORDER = ['PACKING', 'HANGTAG_LABEL', 'APPROVED_SAMPLE', 'PACKING_LIST', 'SIZE_SPEC']
function specImageRank(type) {
  const i = SPEC_IMAGE_ORDER.indexOf(type)
  return i === -1 ? SPEC_IMAGE_ORDER.length : i
}
function sortSpecImages(specImages) {
  return [...specImages].sort((a, b) => specImageRank(a.type) - specImageRank(b.type))
}

function drawPictureHeader(doc, ticket, sheetTitle, titleColor = [20, 20, 20]) {
  const y = PAGE_MARGIN
  doc.setFont(FONT_FAMILY, 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...titleColor)
  doc.text(sheetTitle, PAGE_MARGIN, y + 5)
  doc.setFont(FONT_FAMILY, 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(90)
  doc.text(`${ticket.customerName || '—'} / ${ticket.poNumber || '—'} / ${ticket.style || '—'}`, PAGE_MARGIN, y + 10)
  return y + 16
}

function collectDefectImagesForPdf(ticket, severity) {
  const entries = []
  for (const d of ticket.defects || []) {
    const defectSeverity = d.severity === 'MAJOR' ? 'MAJOR' : 'MINOR'
    if (defectSeverity !== severity) continue
    const name = d.defectItem?.name || d.defect?.name || 'Other'
    for (const loc of d.locations || []) {
      for (const img of loc.images || []) {
        if (img.imageUrl) entries.push({ name, imageUrl: img.imageUrl })
      }
    }
  }
  return entries
}

// Tải+xử lý (fetch -> canvas -> JPEG) tối đa CONCURRENCY ảnh cùng lúc thay vì
// tuần tự từng ảnh một - trước đây ảnh sau phải đợi ảnh trước tải xong mới
// bắt đầu tải, rất chậm khi có nhiều ảnh. Giới hạn concurrency (không tải
// TẤT CẢ cùng lúc) để không dí quá nhiều request đồng thời vào server ảnh.
const IMAGE_LOAD_CONCURRENCY = 6

async function preloadImages(entries, onEachDone) {
  const results = new Array(entries.length)
  let nextIndex = 0
  async function worker() {
    while (nextIndex < entries.length) {
      const i = nextIndex++
      try {
        results[i] = await loadImageAsJpegDataUrl(entries[i].imageUrl)
      } catch (err) {
        console.error(`[pdfExportExcelStyle] Failed to load image: ${entries[i].imageUrl}`, err)
        results[i] = null
      }
      onEachDone?.()
    }
  }
  await Promise.all(Array.from({ length: Math.min(IMAGE_LOAD_CONCURRENCY, entries.length) }, worker))
  return results
}

async function drawPictureGridPage(doc, ticket, sheetTitle, entries, options = {}) {
  if (entries.length === 0) return

  // boxSize=74 (thay vì 78 trước đây) để 1 trang chứa đủ 2 cột x 3 hàng = 6
  // ảnh thay vì chỉ 4, đỡ phí giấy khi lô hàng có nhiều lỗi/ảnh.
  const { titleColor, captionOf, onProgress, progressPrefix, cols = 2, boxSize = 74 } = options

  let doneCount = 0
  onProgress?.(`${progressPrefix || 'Processing image'} 0/${entries.length}...`)
  const loaded = await preloadImages(entries, () => {
    doneCount++
    onProgress?.(`${progressPrefix || 'Processing image'} ${doneCount}/${entries.length}...`)
  })

  doc.addPage()
  let y = drawPictureHeader(doc, ticket, sheetTitle, titleColor)

  const colWidth = (CONTENT_WIDTH - PIC_GAP * (cols - 1)) / cols
  const captionH = captionOf ? 6 : 2

  for (let i = 0; i < entries.length; i++) {
    const col = i % cols
    if (col === 0 && y + boxSize + captionH > PAGE_HEIGHT - PAGE_MARGIN) {
      doc.addPage()
      y = drawPictureHeader(doc, ticket, sheetTitle, titleColor)
    }
    const x = PAGE_MARGIN + col * (colWidth + PIC_GAP)

    doc.setDrawColor(180)
    doc.setLineWidth(BORDER_WIDTH)
    doc.rect(x, y, colWidth, boxSize)

    if (loaded[i]) {
      const { dataUrl, width, height } = loaded[i]
      const ratio = width / height
      let w = colWidth - 4
      let h = w / ratio
      if (h > boxSize - 4) {
        h = boxSize - 4
        w = h * ratio
      }
      doc.addImage(dataUrl, 'JPEG', x + (colWidth - w) / 2, y + (boxSize - h) / 2, w, h)
    } else {
      doc.setFont(FONT_FAMILY, 'normal')
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text('Image failed to load', x + colWidth / 2, y + boxSize / 2, { align: 'center' })
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
 * Xuất PDF mà các trang đầu tái hiện đúng sheet "Main Report (2)" của Excel
 * (tiêu đề, header, MATERIALS, INSPECTION POINTS, bảng tra AQL, kết quả
 * Pass/Fail, Packing Method/Shipment), sau đó nối tiếp các trang ảnh
 * (Measurement sheet/Picture Accept/Major/Minor Defects) giống PDF hiện có.
 * Tính năng RIÊNG - không sửa/đụng vào exportTicketPdf() ở pdfExport.js.
 */
export async function exportTicketPdfExcelStyle(ticketId, { onProgress, qcChecklistValues } = {}) {
  onProgress?.('Loading ticket data...')
  const ticket = await getQaTicket(ticketId)

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  onProgress?.('Loading fonts...')
  await registerVietnameseFont(doc)

  onProgress?.('Building Main Report page...')
  drawMainReportPages(doc, ticket, qcChecklistValues)

  onProgress?.('Inserting measurement images...')
  await drawPictureGridPage(doc, ticket, 'Measurement sheet', ticket.measurementImages || [], {
    cols: 1,
    boxSize: 140,
    onProgress,
    progressPrefix: 'Processing measurement image',
  })

  onProgress?.('Inserting Accept images...')
  await drawPictureGridPage(
    doc,
    ticket,
    'Picture Accept',
    sortSpecImages((ticket.specImages || []).filter((img) => img.imageUrl)),
    {
      titleColor: [22, 163, 74],
      captionOf: (e) => SPEC_IMAGE_TYPE_LABELS[e.type] || null,
      onProgress,
      progressPrefix: 'Processing Accept image',
    },
  )

  onProgress?.('Inserting Major Defect images...')
  await drawPictureGridPage(doc, ticket, 'Picture Major Defects', collectDefectImagesForPdf(ticket, 'MAJOR'), {
    titleColor: [220, 38, 38],
    captionOf: (e) => `Defect: ${e.name}`,
    onProgress,
    progressPrefix: 'Processing Major image',
  })

  onProgress?.('Inserting Minor Defect images...')
  await drawPictureGridPage(doc, ticket, 'Picture Minor Defects', collectDefectImagesForPdf(ticket, 'MINOR'), {
    titleColor: [147, 51, 234],
    captionOf: (e) => `Defect: ${e.name}`,
    onProgress,
    progressPrefix: 'Processing Minor image',
  })

  onProgress?.('Generating PDF file...')
  doc.save(buildExportFilename([ticket], 'pdf'))
}
