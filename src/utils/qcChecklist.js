// Danh sách tiêu chí v/x ở vùng "MATERIALS" (dòng 8-24, sheet "Main Report (2)")
// của template BB_PREFINAL_FINAL - xem src/CLAUDE.md. Vị trí row/checkCol/rejectCol
// được dò trực tiếp từ file .xlsx gốc (không suy đoán), KHÔNG được tự đổi khi
// không đối chiếu lại template.
// checkCol = cột ghi "v" (đạt), rejectCol = cột ghi "x" (không đạt).
export const QC_CHECKLIST_GROUPS = [
  {
    id: 'fabric',
    title: '1. Fabric - Vải',
    checkCol: 3, // C
    rejectCol: 4, // D
    items: [
      { id: 'fabric-qlty', label: 'Fabric Qlty (CL vải chính)', row: 10 },
      { id: 'handfeel', label: 'Handfeel (Độ cầm nhẳn)', row: 11 },
      { id: 'contrast-fabric', label: 'Contrast fabric', row: 12 },
      { id: 'lining-qlty', label: 'Lining Qlty (CL lót)', row: 13 },
      { id: 'lining-colour', label: 'Lining Colour (màu lót)', row: 14 },
    ],
  },
  {
    id: 'colours',
    title: '2. Colours - Màu sắc',
    checkCol: 3, // C
    rejectCol: 4, // D
    items: [
      { id: 'colour-lab-dip', label: 'Colour as lab dip - So bảng màu', row: 18 },
      { id: 'matching-tones', label: 'Matching tones - Tông màu', row: 19 },
      { id: 'colour-fastness', label: 'Colour fastness - Bền màu', row: 20 },
      { id: 'printing', label: 'Printing - In', row: 21 },
      { id: 'embroidery', label: 'Embroidery - Thêu', row: 22 },
      { id: 'shade-band', label: 'Shade Band - Ánh màu', row: 23 },
    ],
  },
  {
    id: 'accessories',
    title: '3. Accessories / Trims - Phụ liệu',
    checkCol: 7, // G
    rejectCol: 8, // H
    items: [
      { id: 'zipper', label: 'Zipper - Dây kéo', row: 10 },
      { id: 'button-buttonhole', label: 'Button/ button hole - Khuy', row: 11 },
      { id: 'snap-button', label: 'Snap / button - Nút đóng', row: 12 },
      { id: 'rivet', label: 'Rivet - Ri vê', row: 13 },
      { id: 'eyelet', label: 'Eyelet - Mắt cáo', row: 14 },
      { id: 'buckle', label: 'Buckle - Khóa chốt', row: 15 },
      { id: 'piping', label: 'Piping - Viền', row: 16 },
      { id: 'threads', label: 'Threads - Chỉ', row: 17 },
    ],
  },
  {
    id: 'labels-appearance',
    title: 'Labels & APPEARANCE',
    checkCol: 7, // G
    rejectCol: 8, // H
    items: [
      { id: 'main-label', label: 'Main label - Nhãn chính', row: 20 },
      { id: 'size-label', label: 'Size label - Nhãn size', row: 21 },
      { id: 'care-label', label: 'Care label - Nhãn care', row: 22 },
      { id: 'hang-tag', label: 'Hang tag - Nhãn treo', row: 23 },
      { id: 'price-label', label: 'Price label - Nhãn giá', row: 24 },
    ],
  },
  {
    id: 'packing',
    title: '5. Packing - Đóng gói',
    checkCol: 12, // L
    rejectCol: 13, // M
    items: [
      { id: 'unit-packed', label: 'Unit packed - SL đóng', row: 10 },
      { id: 'folding-method', label: 'Folding method - Gấp xếp', row: 11 },
      { id: 'cardboard-size-qlty', label: 'Cardboard size & qlty - CL và size bìa', row: 12 },
      { id: 'polybag-size-qlty', label: 'Polybag size & qlty - CL và size bao nylon', row: 13 },
      { id: 'box-size-qlty', label: 'Box size & qlty - CL và size thùng', row: 14 },
      { id: 'box-end-label', label: 'Box end label - Nhãn thùng', row: 15 },
      { id: 'gross-weight', label: 'Gross weight < 15Kg', row: 16 },
      { id: 'sealing-tape', label: 'Sealing tape - Keo dán thùng', row: 17 },
      { id: 'ration-pack-sticker', label: 'Ration pack sticker - Tỷ lệ trên nhãn', row: 18 },
      { id: 'flat-packed', label: 'Flat Packed - Đóng phẳng', row: 19 },
      { id: 'hanging-goods', label: 'Hanging goods - Hàng treo', row: 20 },
    ],
  },
]

// Mặc định mọi tiêu chí đạt (v) - giống giá trị tĩnh có sẵn trong template gốc.
export function defaultQcChecklistValues() {
  const values = {}
  for (const group of QC_CHECKLIST_GROUPS) {
    for (const item of group.items) {
      values[item.id] = 'v'
    }
  }
  return values
}
