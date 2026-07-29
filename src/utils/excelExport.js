import ExcelJS from 'exceljs'
import { getQaTicket } from '../api/qaTickets'
import { QC_CHECKLIST_GROUPS } from './qcChecklist'

// Xem src/CLAUDE.md (mục "CẬP NHẬT (v2)") - đây là bản JS port 1:1 của
// fill_qa_report.py, chạy trong trình duyệt thay vì Python/openpyxl.
const TEMPLATE_URL = '/templates/BB_PREFINAL_FINAL_template.xlsx'
const SHEET_NAME = 'Main Report (2)'
const FIRST_DEFECT_ROW = 27
const LAST_DEFECT_ROW = 89
const LABEL_COL = 1 // A (merge A:F)
const LABEL_END_COL = 6 // F
const MAJOR_COL = 8 // H
const MINOR_COL = 9 // I
const REMARK_COL = 10 // J (merge J:M)
const REMARK_END_COL = 13 // M
const TOTAL_COLS = 13 // A..M

// Các ô nền vàng tĩnh ở dòng 4-5 (header, xem Header mapping.md) - theo yêu cầu
// bỏ màu vàng khi xuất, không đụng đến việc các ô này có phải đích ghi giá trị
// header hay không (hiện code chưa ghi header động - xem docstring exportTicketsExcel).
const YELLOW_HEADER_CELLS = ['B4', 'D4', 'H4', 'I4', 'M4', 'B5', 'H5', 'J5', 'M5']

// L16 ("Gross weight < 15Kg") có sẵn 1 rule conditional format trong template:
// tô đỏ nếu giá trị ô > 15. Vì ta ghi chữ "v"/"x" (không phải số) vào đây, Excel
// coi MỌI chuỗi text là "lớn hơn" mọi số khi so sánh cellIs -> rule luôn trúng,
// tô đỏ ô này dù không liên quan gì đến logic cân nặng gốc. Bỏ rule này khi xuất.
const GROSS_WEIGHT_CONDITIONAL_REF = 'L16'

const CATEGORY_FONT_SIZE = 13
const ITEM_FONT_SIZE = 11

// Sheet "Picture Major/Minor Defects" trong template: lưới 4x4 = 16 khung ảnh,
// mỗi khung là 1 vùng merge 8 dòng x 5 cột, ngay dưới có nhãn "Defect:" và 1 ô
// merge kế bên để ghi tên lỗi (xem cấu trúc merge thật trong file mẫu).
const PICTURE_SHEET_MAJOR = 'Picture Major Defects '
const PICTURE_SHEET_MINOR = 'Picture Minor Defects'
const PICTURE_BOX_ROW_STARTS = [4, 13, 22, 31]
const PICTURE_BOX_COL_STARTS = [1, 6, 11, 16]
const PICTURE_BOX_ROW_SPAN = 8
const PICTURE_BOX_COL_SPAN = 5
const PICTURE_LABEL_ROW_OFFSET = 8
const PICTURE_BOX_FIT_RATIO = 0.92 // chừa lề nhỏ quanh ảnh trong khung
const IMAGE_EXT_BY_MIME = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/gif': 'gif' }

// Gộp 2 cấp: defect (nhóm lỗi lớn, vd "1. FABRIC DEFECTS/LỖI VẢI") -> defectItem
// (lỗi cụ thể trong nhóm đó, vd "Đứt chỉ"). Trong cùng 1 nhóm, các defectItem
// trùng (id + severity) được cộng dồn số lượng - BE trả severity thật cho
// từng defect (xem src/CLAUDE.md); cùng 1 defect item nhưng ghi nhận khác
// mức độ (item cho phép cả Major/Minor) sẽ tách thành 2 dòng riêng.
function aggregateDefects(tickets) {
  const categories = new Map()
  for (const ticket of tickets) {
    for (const d of ticket.defects || []) {
      const categoryId = d.defect?.id ?? d.defectItem?.id ?? 'unknown'
      const categoryName = d.defect?.name || d.defectItem?.name || 'Khác'
      const itemId = d.defectItem?.id ?? d.defect.id
      const itemName = d.defectItem?.name || d.defect.name
      const severity = d.severity === 'MAJOR' ? 'MAJOR' : 'MINOR'
      const itemKey = `${itemId}:${severity}`
      const qty = (d.locations || []).reduce((sum, loc) => sum + (loc.quantity || 0), 0)

      if (!categories.has(categoryId)) {
        categories.set(categoryId, { name: categoryName, items: new Map() })
      }
      const category = categories.get(categoryId)
      if (!category.items.has(itemKey)) {
        category.items.set(itemKey, { name: itemName, severity, qty: 0, notes: [] })
      }
      const entry = category.items.get(itemKey)
      entry.qty += qty
      if (d.note) entry.notes.push(d.note)
    }
  }
  return categories
}

// Ghi lựa chọn v/x (từ QcChecklistModal, xem qcChecklist.js) vào vùng "MATERIALS"
// (dòng 8-24) của template - 2 ô riêng biệt như thiết kế gốc: checkCol nhận "v"
// khi đạt, rejectCol nhận "x" khi không đạt (ô còn lại để trống). Một vài ô
// reject trong template gốc (H20, H23, H24 - nhóm Labels & APPEARANCE) thiếu
// sẵn "horizontal: center" nên chữ bị lệch trái - ép căn giữa lại cho cả 2 ô
// mỗi dòng để đồng nhất, không đụng border/fill.
function writeQcChecklist(ws, qcChecklistValues) {
  if (!qcChecklistValues) return
  for (const group of QC_CHECKLIST_GROUPS) {
    for (const item of group.items) {
      const value = qcChecklistValues[item.id]
      const checkCell = ws.getCell(item.row, group.checkCol)
      const rejectCell = ws.getCell(item.row, group.rejectCol)
      checkCell.value = value === 'x' ? null : 'v'
      rejectCell.value = value === 'x' ? 'x' : null
      checkCell.alignment = { horizontal: 'center', vertical: 'middle' }
      rejectCell.alignment = { horizontal: 'center', vertical: 'middle' }
    }
  }
}

function clearYellowHeaderFill(ws) {
  for (const address of YELLOW_HEADER_CELLS) {
    ws.getCell(address).fill = { type: 'pattern', pattern: 'none' }
  }
}

function removeGrossWeightConditionalFormatting(ws) {
  ws.conditionalFormattings = (ws.conditionalFormattings || []).filter(
    (cf) => cf.ref !== GROSS_WEIGHT_CONDITIONAL_REF,
  )
}

function unmergeDefectRange(ws) {
  const toUnmerge = ws.model.merges.filter((range) => {
    const row = parseInt(range.split(':')[0].match(/\d+/)[0], 10)
    return row >= FIRST_DEFECT_ROW && row <= LAST_DEFECT_ROW
  })
  toUnmerge.forEach((range) => ws.unMergeCells(range))
}

function styleRow(ws, row, colStyles) {
  for (let col = 1; col <= TOTAL_COLS; col++) {
    ws.getCell(row, col).style = { ...colStyles[col] }
  }
}

// Xoá toàn bộ nội dung CŨ của vùng lỗi và ép mọi dòng về 1 kiểu nền/viền
// trung tính duy nhất (lấy từ 1 dòng lỗi thường trong template gốc) trước
// khi ghi dữ liệu động. Nếu không làm bước này, các dòng KHÔNG được ghi lại
// (vd phần dư ở cuối bảng khi số lỗi ít hơn 63 dòng) vẫn giữ nguyên định
// dạng tô xám/viền dày của các dòng "nhóm lỗi" cũ nằm rải rác trong template
// -> nhìn lởm chởm, dư ra từng khúc không đồng nhất với phần vừa in.
function resetDefectRows(ws) {
  // PHẢI đọc style mẫu TRƯỚC khi unmerge: exceljs reset style của các ô
  // không phải master (B..F, K..M) về mặc định rỗng ngay khi unmerge, nên
  // nếu đọc sau đó sẽ chỉ lấy được style rỗng -> viền các cột này biến mất
  // (chỗ có viền đen ở cột A, chỗ mất hẳn viền/thành "trắng" ở B..F, K..M).
  const categoryStyle = {}
  const itemStyle = {}
  for (let col = 1; col <= TOTAL_COLS; col++) {
    categoryStyle[col] = { ...ws.getCell(FIRST_DEFECT_ROW, col).style }
    itemStyle[col] = { ...ws.getCell(FIRST_DEFECT_ROW + 1, col).style }
  }
  categoryStyle[LABEL_COL] = {
    ...categoryStyle[LABEL_COL],
    font: { ...categoryStyle[LABEL_COL].font, size: CATEGORY_FONT_SIZE, bold: true },
  }
  itemStyle[LABEL_COL] = {
    ...itemStyle[LABEL_COL],
    font: { ...itemStyle[LABEL_COL].font, size: ITEM_FONT_SIZE, bold: false },
  }

  unmergeDefectRange(ws)

  for (let row = FIRST_DEFECT_ROW; row <= LAST_DEFECT_ROW; row++) {
    styleRow(ws, row, itemStyle)
    for (let col = 1; col <= TOTAL_COLS; col++) {
      ws.getCell(row, col).value = null
    }
  }

  return { categoryStyle, itemStyle }
}

function writeDefectRows(ws, categories) {
  const { categoryStyle, itemStyle } = resetDefectRows(ws)

  let row = FIRST_DEFECT_ROW
  const overflow = []

  for (const category of categories.values()) {
    const items = Array.from(category.items.values())
    const rowsNeeded = 1 + items.length

    if (row + rowsNeeded - 1 > LAST_DEFECT_ROW) {
      overflow.push(category.name, ...items.map((item) => item.name))
      continue
    }

    ws.mergeCells(row, LABEL_COL, row, LABEL_END_COL)
    ws.getCell(row, LABEL_COL).value = category.name
    styleRow(ws, row, categoryStyle)
    row += 1

    for (const item of items) {
      ws.mergeCells(row, LABEL_COL, row, LABEL_END_COL)
      ws.getCell(row, LABEL_COL).value = item.name
      ws.getCell(row, item.severity === 'MAJOR' ? MAJOR_COL : MINOR_COL).value = item.qty

      ws.mergeCells(row, REMARK_COL, row, REMARK_END_COL)
      const remark = item.notes.join('; ')
      if (remark) ws.getCell(row, REMARK_COL).value = remark

      styleRow(ws, row, itemStyle)
      row += 1
    }
  }

  return { lastRow: row - 1, overflow }
}

// Lấy list ảnh theo severity (Major/Minor), gắn kèm tên lỗi (defectItem, hoặc
// defect nếu không có defectItem) để ghi vào ô "Defect:" cạnh mỗi khung ảnh.
function collectDefectImages(tickets, severity) {
  const entries = []
  for (const ticket of tickets) {
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
  }
  return entries
}

function getPictureSlots() {
  const slots = []
  for (const boxRow of PICTURE_BOX_ROW_STARTS) {
    for (const boxCol of PICTURE_BOX_COL_STARTS) {
      slots.push({ boxRow, boxCol, labelRow: boxRow + PICTURE_LABEL_ROW_OFFSET, labelCol: boxCol + 1 })
    }
  }
  return slots
}

// "no-store" bắt buộc gọi mạng lại thay vì dùng cache "opaque" trình duyệt có
// thể đã lưu từ lần load ảnh trước qua thẻ <img> (no-cors) - xem pdfExport.js.
async function loadImageForExcel(url) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const blob = await res.blob()
  const buffer = await blob.arrayBuffer()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const { width, height } = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve({ width: el.naturalWidth, height: el.naturalHeight })
      el.onerror = () => reject(new Error('Không đọc được ảnh'))
      el.src = objectUrl
    })
    return { buffer, width, height, extension: IMAGE_EXT_BY_MIME[blob.type] || 'jpeg' }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

// Quy đổi gần đúng độ rộng cột (đơn vị ký tự Excel) / chiều cao dòng (point)
// sang pixel - dùng để tính kích thước khung ảnh và fit ảnh (giữ tỉ lệ) vào
// bên trong, không kéo dãn méo ảnh.
function colWidthPx(width) {
  return Math.round((width ?? 8.43) * 7 + 5)
}

function rowHeightPx(points) {
  return Math.round(((points ?? 15) * 96) / 72)
}

function fitContain(srcWidth, srcHeight, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / srcWidth, maxHeight / srcHeight, 1)
  return { width: Math.round(srcWidth * scale), height: Math.round(srcHeight * scale) }
}

// Excel neo ảnh bằng {cột, dòng} + phần lẻ (tỉ lệ trong đúng cột/dòng đó) chứ
// không phải toạ độ pixel tuyệt đối - hàm này quy đổi 1 khoảng lệch pixel
// (để canh ảnh vào giữa khung) thành {số cột/dòng nguyên cộng thêm, phần lẻ}.
function anchorOffset(startIndex0, offsetPx, unitPx) {
  const whole = Math.floor(offsetPx / unitPx)
  const fraction = (offsetPx - whole * unitPx) / unitPx
  return startIndex0 + whole + fraction
}

// Điền ảnh + tên lỗi vào sheet "Picture Major/Minor Defects": mỗi ảnh chiếm 1
// trong 16 khung có sẵn của template, ảnh được fit giữ tỉ lệ (không méo) và
// canh giữa trong khung. Vượt quá 16 ảnh thì phần dư trả về qua overflow.
async function fillPictureSheet(workbook, ws, entries, onProgress, label) {
  const slots = getPictureSlots()
  const used = entries.slice(0, slots.length)
  const overflow = entries.slice(slots.length).map((entry) => entry.name)

  for (let i = 0; i < used.length; i++) {
    const entry = used[i]
    const slot = slots[i]
    onProgress?.(`Đang chèn ảnh ${label} ${i + 1}/${used.length}...`)

    ws.getCell(slot.labelRow, slot.labelCol).value = entry.name

    let loaded
    try {
      loaded = await loadImageForExcel(entry.imageUrl)
    } catch (err) {
      console.error(`[excelExport] Không tải được ảnh: ${entry.imageUrl}`, err)
      continue
    }

    let boxWidthPx = 0
    for (let c = slot.boxCol; c < slot.boxCol + PICTURE_BOX_COL_SPAN; c++) {
      boxWidthPx += colWidthPx(ws.getColumn(c).width)
    }
    let boxHeightPx = 0
    for (let r = slot.boxRow; r < slot.boxRow + PICTURE_BOX_ROW_SPAN; r++) {
      boxHeightPx += rowHeightPx(ws.getRow(r).height)
    }

    const { width, height } = fitContain(
      loaded.width,
      loaded.height,
      boxWidthPx * PICTURE_BOX_FIT_RATIO,
      boxHeightPx * PICTURE_BOX_FIT_RATIO,
    )
    const offsetX = (boxWidthPx - width) / 2
    const offsetY = (boxHeightPx - height) / 2

    const imageId = workbook.addImage({ buffer: loaded.buffer, extension: loaded.extension })
    ws.addImage(imageId, {
      tl: {
        col: anchorOffset(slot.boxCol - 1, offsetX, colWidthPx(ws.getColumn(slot.boxCol).width)),
        row: anchorOffset(slot.boxRow - 1, offsetY, rowHeightPx(ws.getRow(slot.boxRow).height)),
      },
      ext: { width, height },
    })
  }

  return { overflow }
}

function downloadBlob(buffer, filename) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Lấy 1 hoặc nhiều ticket theo id, gộp defect (cùng defectItem.id + severity
 * -> cộng dồn số lượng), điền vào bảng lỗi (dòng 27-89) của file mẫu
 * BB_PREFINAL_FINAL - đúng cột Major (H) hoặc Minor (I) theo severity thật
 * từ BE - và tải xuống. Dòng 1-26 (header) và dòng 90 trở xuống (Total/AQL)
 * giữ nguyên từ template - xem src/CLAUDE.md.
 */
export async function exportTicketsExcel(ticketIds, { onProgress, qcChecklistValues } = {}) {
  const ids = Array.isArray(ticketIds) ? ticketIds : [ticketIds]

  onProgress?.('Đang tải dữ liệu phiếu...')
  const tickets = await Promise.all(ids.map((id) => getQaTicket(id)))

  onProgress?.('Đang tải file mẫu Excel...')
  const res = await fetch(TEMPLATE_URL)
  if (!res.ok) throw new Error(`Không tải được file mẫu Excel (HTTP ${res.status})`)
  const arrayBuffer = await res.arrayBuffer()

  onProgress?.('Đang điền dữ liệu...')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(arrayBuffer)
  const ws = workbook.getWorksheet(SHEET_NAME)
  if (!ws) throw new Error(`Không tìm thấy sheet "${SHEET_NAME}" trong file mẫu`)

  clearYellowHeaderFill(ws)
  removeGrossWeightConditionalFormatting(ws)
  writeQcChecklist(ws, qcChecklistValues)

  const aggregated = aggregateDefects(tickets)
  const { overflow } = writeDefectRows(ws, aggregated)

  const wsMajor = workbook.getWorksheet(PICTURE_SHEET_MAJOR)
  const wsMinor = workbook.getWorksheet(PICTURE_SHEET_MINOR)
  const imageOverflow = { major: [], minor: [] }
  if (wsMajor) {
    const majorImages = collectDefectImages(tickets, 'MAJOR')
    imageOverflow.major = (await fillPictureSheet(workbook, wsMajor, majorImages, onProgress, 'Major')).overflow
  }
  if (wsMinor) {
    const minorImages = collectDefectImages(tickets, 'MINOR')
    imageOverflow.minor = (await fillPictureSheet(workbook, wsMinor, minorImages, onProgress, 'Minor')).overflow
  }

  // Dòng Total (90) dùng công thức SUM(H27:H89)/SUM(I27:I89) có sẵn trong
  // template - ép Excel tính lại khi mở file, vì openpyxl/exceljs không tự
  // tính công thức nên nếu không có cờ này, Excel sẽ hiển thị kết quả CŨ đã
  // cache sẵn trong file mẫu thay vì tổng số lỗi vừa in ra.
  workbook.calcProperties.fullCalcOnLoad = true

  onProgress?.('Đang tạo file Excel...')
  const buffer = await workbook.xlsx.writeBuffer()

  const firstTicket = tickets[0]
  const filename =
    ids.length > 1
      ? `BB_PREFINAL_FINAL_${ids.join('-')}.xlsx`
      : `BB_PREFINAL_FINAL_${firstTicket?.ticketCode || ids[0]}.xlsx`
  downloadBlob(buffer, filename)

  return { overflow, imageOverflow }
}
