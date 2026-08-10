// Bảng B95:P103 của template BB_PREFINAL_FINAL_template.xlsx (sheet "Main
// Report (2)") - bảng tra Ac(chấp nhận)/Re(từ chối) theo Sample size, đã đối
// chiếu từng ô với file mẫu thật. Giống hệt cho AQL 2.5 và 1.5 NGOẠI TRỪ dòng
// đầu tiên (sample size 13) khác nhau thật sự trong file mẫu (không phải lỗi
// gõ). Dùng chung cho pdfExportExcelStyle.js (hiển thị bảng tra) và để tự
// tính PASS/REJECTED khi ticket.inspectionResult chưa được BE tính.
export const AQL_SAMPLING_TABLE = [
  { range: '51-90', sampling: 13, aql25: [0, 1, 0, 1], aql15: [1, 2, 1, 2] },
  { range: '91-150', sampling: 20, aql25: [1, 2, 1, 2], aql15: [1, 2, 1, 2] },
  { range: '151-280', sampling: 32, aql25: [2, 3, 2, 3], aql15: [2, 3, 2, 3] },
  { range: '281-500', sampling: 50, aql25: [3, 4, 3, 4], aql15: [3, 4, 3, 4] },
  { range: '501-1200', sampling: 80, aql25: [5, 6, 5, 6], aql15: [5, 6, 5, 6] },
  { range: '1,201-3,200', sampling: 125, aql25: [7, 8, 7, 8], aql15: [7, 8, 7, 8] },
  { range: '3,201-10,000', sampling: 200, aql25: [10, 11, 10, 11], aql15: [10, 11, 10, 11] },
  { range: '10,001-35,000', sampling: 315, aql25: [14, 15, 14, 15], aql15: [14, 15, 14, 15] },
  { range: '35,001-500,000', sampling: 500, aql25: [21, 22, 21, 22], aql15: [21, 22, 21, 22] },
]
// [Major Ac, Major Re, Minor Ac, Minor Re]

export function lookupAqlThresholds(samplingSize, aqlLevel) {
  const row = AQL_SAMPLING_TABLE.find((r) => r.sampling === Number(samplingSize))
  if (!row) return null
  const [majorAc, majorRe, minorAc, minorRe] = aqlLevel === '1.5' ? row.aql15 : row.aql25
  return { majorAc, majorRe, minorAc, minorRe }
}

// PASS/REJECTED tự tính từ Actual Major/Minor Defects so với ngưỡng Reject
// tra được trong bảng AQL - dùng làm fallback khi ticket.inspectionResult
// chưa được BE tính (field này hay bị null, ví dụ BE chưa recompute lại sau
// khi QA nhập actual defects). Trả về null nếu thiếu dữ liệu để tính (chưa
// nhập actual defects, hoặc không tra được sampling size/AQL level).
export function computeAqlFallbackResult(ticket) {
  if (!ticket) return null
  const { samplingSize, aqlLevel, actualMajorDefects, actualMinorDefects } = ticket
  if (actualMajorDefects == null || actualMinorDefects == null) return null
  const thresholds = lookupAqlThresholds(samplingSize, aqlLevel)
  if (!thresholds) return null
  const rejected = actualMajorDefects >= thresholds.majorRe || actualMinorDefects >= thresholds.minorRe
  return rejected ? 'REJECTED' : 'PASS'
}

// Kết quả AQL dùng cho báo cáo/UI: ưu tiên giá trị BE đã tính sẵn
// (ticket.inspectionResult, kể cả PENDING) - chỉ tự tính (PASS/REJECTED) khi
// BE chưa có giá trị.
export function resolveAqlResult(ticket) {
  return ticket?.inspectionResult || computeAqlFallbackResult(ticket) || null
}
