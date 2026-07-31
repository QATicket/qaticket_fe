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

// M3_checkbox (xem Header mapping.md): TRUE nếu chọn AQL 2.5, FALSE nếu AQL 1.5.
const AQL_LEVEL_CELL = 'M3'

// B3 (dòng "Loại kiểm tra") - ghi thẳng giá trị inspectionStage của ticket.
const MAIN_REPORT_INSPECTION_STAGE_CELL = 'B3'

const CATEGORY_FONT_SIZE = 13
const ITEM_FONT_SIZE = 11

// Ô A2 (merge A2:M2) chứa tiêu đề báo cáo, gốc là text tĩnh "Final Inspection
// Report / BIÊN BẢN KIỂM TRA FINAL" trong template - đổi tên theo
// inspectionStage của ticket. Giữ nguyên phần đệm khoảng trắng cuối dòng 1
// (163 ký tự) như trong template gốc vì ô này không có horizontal alignment
// center - phần đệm là cách căn chỉnh thủ công có sẵn.
const TITLE_CELL = 'A2'
const TITLE_LINE1_PADDING = ' '.repeat(163)
const INSPECTION_STAGE_TITLE_LABELS = {
  INLINE: { en: 'Inline', vi: 'INLINE' },
  PRE_FINAL: { en: 'Pre-Final', vi: 'PRE-FINAL' },
  FINAL: { en: 'Final', vi: 'FINAL' },
}

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
const PICTURE_BOX_FIT_RATIO = 0.96 // chừa lề nhỏ quanh ảnh trong khung, đảm bảo không vượt viền
const IMAGE_EXT_BY_MIME = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/gif': 'gif' }

// Sheet "picture accept": cùng lưới 4x4 khung ảnh (cùng cột A/F/K/P như trên),
// nhưng 4 hàng khung liền kề nhau (4, 12, 20, 28 - không có dòng nhãn "Defect:"
// chen giữa như 2 sheet Major/Minor) nên không cần labelOffset.
const PICTURE_ACCEPT_SHEET = 'picture accept'
const PICTURE_ACCEPT_ROW_STARTS = [4, 12, 20, 28]

// type (từ specImages, xem GeneralInfoCard.jsx) -> tên hiển thị ở overflow list.
// type null/không rõ (ảnh cũ) rơi vào 'Khác'.
const SPEC_IMAGE_TYPE_LABELS = {
  APPROVED_SAMPLE: 'Mẫu duyệt (Approved Sample)',
  SIZE_SPEC: 'Bảng thông số kích thước',
  PACKING: 'Quy cách đóng thùng/Bao bì',
  HANGTAG_LABEL: 'Thẻ treo & Nhãn hiệu',
}

// Sheet "Measurement sheet": không có khung ảnh cố định như các sheet trên,
// chỉ có 1 vùng merge DUY NHẤT A4:S55 để chèn ảnh đo thông số (measurementImages).
// Theo yêu cầu: chia vùng này thành lưới 4 cột, số hàng tự tính theo số ảnh
// thực tế (rows = ceil(count / 4)) để ảnh nào cũng có chỗ, không giới hạn 16 ảnh.
const MEASUREMENT_SHEET = 'Measurement sheet'
const MEASUREMENT_INSPECTION_STAGE_CELL = 'B3'
const MEASUREMENT_REGION_FIRST_ROW = 4
const MEASUREMENT_REGION_LAST_ROW = 55
const MEASUREMENT_REGION_FIRST_COL = 1 // A
const MEASUREMENT_REGION_LAST_COL = 19 // S
const MEASUREMENT_GRID_COLS = 4

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

// dd/mm/yyyy, không kèm giờ - theo yêu cầu ô M4 (Date) chỉ hiện ngày.
function formatDateOnly(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

// Điền các ô header động (dòng 4-5) từ ticket đầu tiên - xem Header mapping.md.
function writeHeaderValues(ws, ticket) {
  if (!ticket) return
  ws.getCell('B4').value = ticket.customer?.name ?? ''
  ws.getCell('D4').value = ticket.purchaseOrder?.name ?? ''
  ws.getCell('H4').value = ticket.style?.name ?? ''
  ws.getCell('M4').value = formatDateOnly(ticket.createdAt)
  ws.getCell('B5').value = ticket.qtySize ?? ''
  ws.getCell('E5').value = ticket.samplingSize ?? ''
  ws.getCell('M5').value = ticket.staff?.name ?? ''
}

function writeAqlLevelCell(ws, ticket) {
  if (!ticket?.aqlLevel) return
  ws.getCell(AQL_LEVEL_CELL).value = ticket.aqlLevel === '2.5'
}

function writeInspectionStageCell(ws, cellAddress, ticket) {
  if (!ticket) return
  ws.getCell(cellAddress).value = ticket.inspectionStage ?? ''
}

// Lấy tên hiển thị từ giá trị ĐÃ GHI ở ô B3 (dòng "Loại kiểm tra") thay vì
// đọc lại ticket.inspectionStage riêng - đảm bảo tiêu đề luôn khớp đúng với
// B3, kể cả nếu sau này B3 được ghi/sửa theo cách khác. Vì vậy hàm này phải
// chạy SAU writeInspectionStageCell(ws, MAIN_REPORT_INSPECTION_STAGE_CELL, ...).
function writeTitleCell(ws) {
  const stageValue = ws.getCell(MAIN_REPORT_INSPECTION_STAGE_CELL).value
  const stage = INSPECTION_STAGE_TITLE_LABELS[stageValue] || INSPECTION_STAGE_TITLE_LABELS.FINAL
  ws.getCell(TITLE_CELL).value = `${stage.en} Inspection Report${TITLE_LINE1_PADDING}\nBIÊN BẢN KIỂM TRA ${stage.vi}`
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
    ws.getRow(row).hidden = false
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

  const lastRow = row - 1

  // Vùng lỗi (27-89) là vùng CỐ ĐỊNH KÍCH THƯỚC - không được insert/delete
  // dòng thật (sẽ làm lệch công thức SUM ở dòng 90 và cả bảng AQL bên dưới,
  // xem src/CLAUDE.md). Thay vào đó ẨN các dòng dư không có dữ liệu: Excel
  // bỏ qua dòng ẩn khi hiển thị/in, nên phần Total/AQL phía dưới nhìn như
  // "được đưa lên" ngay sau dòng lỗi cuối cùng, không còn khoảng trống to.
  for (let r = lastRow + 1; r <= LAST_DEFECT_ROW; r++) {
    ws.getRow(r).hidden = true
  }

  return { lastRow, overflow }
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

// Gom toàn bộ ảnh Spec (specImages, chỉ ticket FINAL mới có - xem GeneralInfoCard.jsx)
// để đổ vào sheet "picture accept".
function collectSpecImages(tickets) {
  const entries = []
  for (const ticket of tickets) {
    for (const img of ticket.specImages || []) {
      if (!img.imageUrl) continue
      entries.push({ name: SPEC_IMAGE_TYPE_LABELS[img.type] || 'Khác', imageUrl: img.imageUrl })
    }
  }
  return entries
}

// Gom toàn bộ ảnh đo thông số (measurementImages) để đổ vào sheet "Measurement sheet".
function collectMeasurementImages(tickets) {
  const entries = []
  for (const ticket of tickets) {
    for (const img of ticket.measurementImages || []) {
      if (img.imageUrl) entries.push({ imageUrl: img.imageUrl })
    }
  }
  return entries
}

// labelOffset undefined/null -> khung không có dòng nhãn riêng (vd sheet
// "picture accept"), chỉ chèn ảnh, bỏ qua việc ghi tên loại ảnh bên dưới.
function getPictureSlots(rowStarts, labelOffset) {
  const slots = []
  for (const boxRow of rowStarts) {
    for (const boxCol of PICTURE_BOX_COL_STARTS) {
      slots.push({
        boxRow,
        boxCol,
        labelRow: labelOffset != null ? boxRow + labelOffset : null,
        labelCol: labelOffset != null ? boxCol + 1 : null,
      })
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

// "contain": giữ nguyên tỉ lệ ảnh gốc (không crop, không méo), scale để vừa
// lọt bên trong khung - PICTURE_BOX_FIT_RATIO chừa margin nhỏ để chắc chắn
// không bao giờ vượt quá viền đen của khung dù công thức quy đổi px ở trên
// chỉ là ước lượng gần đúng (cột quá hẹp như cột P có thể lệch vài px).
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
// trong 16 khung có sẵn của template, ảnh được fit giữ tỉ lệ (không méo,
// không crop) và canh giữa trong khung. Vượt quá 16 ảnh thì phần dư trả về
// qua overflow.
async function fillPictureSheet(
  workbook,
  ws,
  entries,
  onProgress,
  label,
  rowStarts = PICTURE_BOX_ROW_STARTS,
  labelOffset = PICTURE_LABEL_ROW_OFFSET,
) {
  const slots = getPictureSlots(rowStarts, labelOffset)
  const used = entries.slice(0, slots.length)
  const overflow = entries.slice(slots.length).map((entry) => entry.name)

  for (let i = 0; i < used.length; i++) {
    const entry = used[i]
    const slot = slots[i]
    onProgress?.(`Đang chèn ảnh ${label} ${i + 1}/${used.length}...`)

    if (slot.labelRow != null) {
      ws.getCell(slot.labelRow, slot.labelCol).value = entry.name
    }

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

    // Neo thẳng vào góc trên-trái THẬT của khung (không căn giữa theo chiều
    // ngang) - khung "picture 4" có cột đầu (P) rất hẹp so với các cột kế
    // bên (Q/R/S/T); nếu căn giữa, phần margin rơi vào cột hẹp gần như vô
    // hình khiến ảnh nhìn như bị đẩy hẳn sang cột bên phải. Neo góc trên-trái
    // luôn là 1 toạ độ nguyên (không cần quy đổi px) nên không bao giờ lệch.
    const imageId = workbook.addImage({ buffer: loaded.buffer, extension: loaded.extension })
    ws.addImage(imageId, {
      tl: { col: slot.boxCol - 1, row: slot.boxRow - 1 },
      ext: { width, height },
    })
  }

  return { overflow }
}

function regionWidthPx(ws, startCol, endCol) {
  let total = 0
  for (let c = startCol; c <= endCol; c++) total += colWidthPx(ws.getColumn(c).width)
  return total
}

function regionHeightPx(ws, startRow, endRow) {
  let total = 0
  for (let r = startRow; r <= endRow; r++) total += rowHeightPx(ws.getRow(r).height)
  return total
}

// Giống anchorOffset() nhưng cho vùng trải qua NHIỀU cột/dòng có độ rộng/cao
// khác nhau (anchorOffset gốc chỉ quy đổi lệch pixel bên trong ĐÚNG 1 cột/dòng)
// - dùng khi ảnh có thể rơi vào bất kỳ cột/dòng nào trong vùng lớn (Measurement
// sheet chỉ có 1 vùng merge A4:S55 duy nhất, không chia sẵn khung như các sheet
// ảnh khác) bằng cách duyệt trừ dần offset qua từng cột/dòng cho đến khi khớp.
function colOffsetToAnchor(ws, startCol, endCol, offsetPx) {
  let col = startCol
  let remaining = offsetPx
  while (col < endCol && remaining >= colWidthPx(ws.getColumn(col).width)) {
    remaining -= colWidthPx(ws.getColumn(col).width)
    col += 1
  }
  return anchorOffset(col - 1, remaining, colWidthPx(ws.getColumn(col).width))
}

function rowOffsetToAnchor(ws, startRow, endRow, offsetPx) {
  let row = startRow
  let remaining = offsetPx
  while (row < endRow && remaining >= rowHeightPx(ws.getRow(row).height)) {
    remaining -= rowHeightPx(ws.getRow(row).height)
    row += 1
  }
  return anchorOffset(row - 1, remaining, rowHeightPx(ws.getRow(row).height))
}

// Điền ảnh đo thông số vào vùng merge A4:S55 của sheet "Measurement sheet":
// chia thành lưới 4 cột, số hàng tự tính theo số ảnh (rows = ceil(count/4)),
// mỗi ảnh fit giữ tỉ lệ, canh giữa theo chiều ngang nhưng canh SÁT TRÊN theo
// chiều dọc (không canh giữa dọc) trong khung của nó - không giới hạn số
// ảnh tối đa (khung càng nhiều ảnh thì càng nhỏ, không có khái niệm overflow).
async function fillMeasurementSheet(workbook, ws, entries, onProgress) {
  if (entries.length === 0) return

  const totalWidthPx = regionWidthPx(ws, MEASUREMENT_REGION_FIRST_COL, MEASUREMENT_REGION_LAST_COL)
  const totalHeightPx = regionHeightPx(ws, MEASUREMENT_REGION_FIRST_ROW, MEASUREMENT_REGION_LAST_ROW)
  const gridRows = Math.ceil(entries.length / MEASUREMENT_GRID_COLS)
  const boxWidthPx = totalWidthPx / MEASUREMENT_GRID_COLS
  const boxHeightPx = totalHeightPx / gridRows

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    onProgress?.(`Đang chèn ảnh đo thông số ${i + 1}/${entries.length}...`)

    let loaded
    try {
      loaded = await loadImageForExcel(entry.imageUrl)
    } catch (err) {
      console.error(`[excelExport] Không tải được ảnh: ${entry.imageUrl}`, err)
      continue
    }

    const boxLeftPx = (i % MEASUREMENT_GRID_COLS) * boxWidthPx
    const boxTopPx = Math.floor(i / MEASUREMENT_GRID_COLS) * boxHeightPx

    const { width, height } = fitContain(
      loaded.width,
      loaded.height,
      boxWidthPx * PICTURE_BOX_FIT_RATIO,
      boxHeightPx * PICTURE_BOX_FIT_RATIO,
    )
    const offsetX = boxLeftPx + (boxWidthPx - width) / 2
    const offsetY = boxTopPx

    const imageId = workbook.addImage({ buffer: loaded.buffer, extension: loaded.extension })
    ws.addImage(imageId, {
      tl: {
        col: colOffsetToAnchor(ws, MEASUREMENT_REGION_FIRST_COL, MEASUREMENT_REGION_LAST_COL, offsetX),
        row: rowOffsetToAnchor(ws, MEASUREMENT_REGION_FIRST_ROW, MEASUREMENT_REGION_LAST_ROW, offsetY),
      },
      ext: { width, height },
    })
  }
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
  writeHeaderValues(ws, tickets[0])
  writeInspectionStageCell(ws, MAIN_REPORT_INSPECTION_STAGE_CELL, tickets[0])
  writeTitleCell(ws)
  writeAqlLevelCell(ws, tickets[0])
  writeQcChecklist(ws, qcChecklistValues)

  const aggregated = aggregateDefects(tickets)
  const { overflow } = writeDefectRows(ws, aggregated)

  const wsMajor = workbook.getWorksheet(PICTURE_SHEET_MAJOR)
  const wsMinor = workbook.getWorksheet(PICTURE_SHEET_MINOR)
  const wsAccept = workbook.getWorksheet(PICTURE_ACCEPT_SHEET)
  const imageOverflow = { major: [], minor: [], spec: [] }
  if (wsMajor) {
    const majorImages = collectDefectImages(tickets, 'MAJOR')
    imageOverflow.major = (await fillPictureSheet(workbook, wsMajor, majorImages, onProgress, 'Major')).overflow
  }
  if (wsMinor) {
    const minorImages = collectDefectImages(tickets, 'MINOR')
    imageOverflow.minor = (await fillPictureSheet(workbook, wsMinor, minorImages, onProgress, 'Minor')).overflow
  }
  if (wsAccept) {
    const specImages = collectSpecImages(tickets)
    imageOverflow.spec = (
      await fillPictureSheet(workbook, wsAccept, specImages, onProgress, 'Spec', PICTURE_ACCEPT_ROW_STARTS, null)
    ).overflow
  }

  const wsMeasurement = workbook.getWorksheet(MEASUREMENT_SHEET)
  if (wsMeasurement) {
    writeInspectionStageCell(wsMeasurement, MEASUREMENT_INSPECTION_STAGE_CELL, tickets[0])
    const measurementImages = collectMeasurementImages(tickets)
    await fillMeasurementSheet(workbook, wsMeasurement, measurementImages, onProgress)
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
