{
  "_comment": "Các ô có nền vàng trong template là ô được phép ghi giá trị. Đã xác nhận bằng cách đọc màu fill thật của file gốc (Main Report (2)).",
  "header_cells": {
    "B4": { "source": "customer.name", "label": "Customer (KH)" },
    "D4": { "source": "purchaseOrder", "label": "PO", "note": "JSON mẫu có purchaseOrder = null -> cần xác nhận field thật khi PO có giá trị" },
    "H4": { "source": "garmentType.name", "label": "Style (mã hàng)", "note": "CHƯA CHẮC CHẮN 100% - I4 cũng là ô vàng cạnh đó, cần xác nhận với bạn cell nào đúng là style code" },
    "M4": { "source": "createdAt", "label": "Date (Ngày)", "format": "dd/mm/yyyy" },
    "B5": { "source": "MANUAL / order-level data, KHÔNG lấy từ ticket", "label": "Order Qty (SL)", "note": "Order Qty là số lượng cả đơn hàng, ticket chỉ có inspectedQty (số SP kiểm trong lần check này) - hai khái niệm khác nhau, không tự map" },
    "H5": { "source": "MANUAL / shipment plan", "label": "Shipment date" },
    "J5": { "source": "MANUAL", "label": "MDA#" },
    "M5": { "source": "staff.name", "label": "Inspector (Người kiểm tra)" },
    "B6": { "source": "factory.name", "label": "Supplier" },
    "F3_checkbox": { "source": "inspectionStage == 'PRE_FINAL'", "label": "Pre-Final checkbox" },
    "J3_checkbox": { "source": "inspectionStage == 'FINAL'", "label": "Final checkbox" },
    "M3_checkbox": { "source": "MANUAL - chọn AQL 2.5 hay 1.5, không có trong ticket", "label": "AQL level toggle" }
  },
  "important_note": "Ticket mẫu có inspectionStage = 'INLINE', nhưng bảng AQL Pass/Fail (dòng 90-108) trong sheet 'Main Report (2)' được thiết kế cho Pre-Final/Final (sample size tính theo Order Qty 20000 -> 315 mẫu). Ticket INLINE (inspectedQty=10) không khớp quy mô này. CẦN XÁC NHẬN: mỗi lần export report là gộp NHIỀU ticket Pre-Final/Final của cùng 1 PO lại, hay Inline có sheet/luồng xử lý riêng khác?",
  "excel_defect_rows_reference": "Xem file excel_defect_rows_reference.json - liệt kê toàn bộ 63 dòng lỗi (dòng 27-89) để đối chiếu khi điền defect_mapping.json"
}