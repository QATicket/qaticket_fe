import ExcelJS from 'exceljs'
import { getQaTicket } from '../api/qaTickets'

// Xem src/CLAUDE.md (mục "CẬP NHẬT (v2)") - đây là bản JS port 1:1 của
// fill_qa_report.py, chạy trong trình duyệt thay vì Python/openpyxl.
const TEMPLATE_URL = '/templates/BB_PREFINAL_FINAL_template.xlsx'
const SHEET_NAME = 'Main Report (2)'
const FIRST_DEFECT_ROW = 27
const LAST_DEFECT_ROW = 89
const HEADER_ROW = 26
const LABEL_COL = 1 // A (merge A:F)
const LABEL_END_COL = 6 // F
const MAJOR_COL = 8 // H
const MINOR_COL = 9 // I
const REMARK_COL = 10 // J (merge J:M)
const REMARK_END_COL = 13 // M
const TOTAL_COLS = 13 // A..M

// Gộp theo (defectItem.id + severity): BE giờ đã trả severity thật cho từng
// defect (xem src/CLAUDE.md) - cùng 1 defect item nhưng được ghi nhận khác
// mức độ (item cho phép cả Major/Minor) sẽ tách thành 2 dòng riêng.
function aggregateDefects(tickets) {
  const agg = new Map()
  for (const ticket of tickets) {
    for (const d of ticket.defects || []) {
      const itemId = d.defectItem?.id ?? d.defect.id
      const name = d.defectItem?.name || d.defect.name
      const severity = d.severity === 'MAJOR' ? 'MAJOR' : 'MINOR'
      const key = `${itemId}:${severity}`
      const qty = (d.locations || []).reduce((sum, loc) => sum + (loc.quantity || 0), 0)

      if (!agg.has(key)) agg.set(key, { name, severity, qty: 0, notes: [] })
      const entry = agg.get(key)
      entry.qty += qty
      if (d.note) entry.notes.push(d.note)
    }
  }
  return agg
}

function unmergeDefectRange(ws) {
  const toUnmerge = ws.model.merges.filter((range) => {
    const row = parseInt(range.split(':')[0].match(/\d+/)[0], 10)
    return row >= FIRST_DEFECT_ROW && row <= LAST_DEFECT_ROW
  })
  toUnmerge.forEach((range) => ws.unMergeCells(range))
}

function clearOldDefectRows(ws) {
  unmergeDefectRange(ws)
  for (let row = FIRST_DEFECT_ROW; row <= LAST_DEFECT_ROW; row++) {
    for (let col = 1; col <= TOTAL_COLS; col++) {
      ws.getCell(row, col).value = null
    }
  }
}

function writeDefectRows(ws, aggregated) {
  const templateStyles = {}
  for (let col = 1; col <= TOTAL_COLS; col++) {
    templateStyles[col] = { ...ws.getCell(HEADER_ROW, col).style }
  }

  let row = FIRST_DEFECT_ROW
  const overflow = []
  for (const data of aggregated.values()) {
    if (row > LAST_DEFECT_ROW) {
      overflow.push(data.name)
      continue
    }

    ws.mergeCells(row, LABEL_COL, row, LABEL_END_COL)
    ws.getCell(row, LABEL_COL).value = data.name
    ws.getCell(row, data.severity === 'MAJOR' ? MAJOR_COL : MINOR_COL).value = data.qty

    ws.mergeCells(row, REMARK_COL, row, REMARK_END_COL)
    const remark = data.notes.join('; ')
    if (remark) ws.getCell(row, REMARK_COL).value = remark

    for (let col = 1; col <= TOTAL_COLS; col++) {
      ws.getCell(row, col).style = templateStyles[col]
    }

    row += 1
  }

  return { lastRow: row - 1, overflow }
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
export async function exportTicketsExcel(ticketIds, { onProgress } = {}) {
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

  clearOldDefectRows(ws)
  const aggregated = aggregateDefects(tickets)
  const { overflow } = writeDefectRows(ws, aggregated)

  onProgress?.('Đang tạo file Excel...')
  const buffer = await workbook.xlsx.writeBuffer()

  const firstTicket = tickets[0]
  const filename =
    ids.length > 1
      ? `BB_PREFINAL_FINAL_${ids.join('-')}.xlsx`
      : `BB_PREFINAL_FINAL_${firstTicket?.ticketCode || ids[0]}.xlsx`
  downloadBlob(buffer, filename)

  return { overflow }
}
