{
  "_comment": "Mapping từ defect.id (BE) sang dòng trong sheet 'Main Report (2)' của file mẫu. Điền đủ cho toàn bộ defect catalog. 'severity' KHÔNG có trong response BE hiện tại nên phải khai báo tay ở đây (hoặc tốt hơn: thêm cột severity vào bảng defect trong DB, xem ghi chú CLAUDE.md).",
  "defects": {
    "2": {
      "name": "Vết bẩn",
      "row": 74,
      "excelLabel": "C. Spots / Stain / abrasion mark / soil / stamps / stickers",
      "severity": "minor"
    }
  },
  "_todo": "Bổ sung toàn bộ id còn lại trong bảng defect_catalog theo mẫu trên. Danh sách dòng tham khảo nằm trong header_mapping.json phần 'excel_defect_rows_reference'."
}