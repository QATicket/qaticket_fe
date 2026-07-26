# QA Report Export - hướng dẫn cho Claude Code

## Bối cảnh
Project này xuất báo cáo Final/Pre-Final Inspection (file `BB_PREFINAL_FINAL.xlsx`)
từ dữ liệu QA ticket do backend Spring Boot trả về (`GET /api/tickets/{id}` hoặc tương tự).

File Excel mẫu có 2 vùng RÕ RỆT trong sheet `Main Report (2)`:
- **Dòng 1-25**: thông tin cố định của lô hàng (Customer, PO, Style, Order Qty...).
  Chỉ những ô có NỀN VÀNG mới được phép ghi giá trị (xem `header_mapping.json`).
- **Dòng 27-89**: bảng lỗi (INSPECTION POINTS). Mỗi dòng ứng với 1 loại lỗi cố định,
  KHÔNG được thêm/xóa/sắp xếp lại dòng. Chỉ ghi số lượng vào cột H (Major),
  I (Minor), và text vào cột J (Remarks).
- **Dòng 90 trở xuống**: có công thức SUM và VLOOKUP tính AQL Pass/Fail sẵn.
  TUYỆT ĐỐI không ghi đè giá trị cứng vào các ô này, để công thức tự tính.

## Luật bắt buộc khi sửa/tạo script trong project này
1. Không bao giờ suy luận vị trí dòng/cột của 1 loại lỗi từ tên tiếng Việt/Anh.
   Luôn tra qua `defect_mapping.json` bằng `defect.id`. Nếu id chưa có trong
   mapping, dừng lại và báo cho người dùng bổ sung, KHÔNG tự đoán dòng gần đúng.
2. `severity` (Major/Minor) không có trong response BE hiện tại -> lấy từ
   `defect_mapping.json`. Nếu sau này BE bổ sung field `severity` trong bảng
   defect, sửa `aggregate_defects()` trong `fill_qa_report.py` để đọc trực
   tiếp từ ticket và bỏ field severity trong mapping (tránh 2 nguồn sự thật).
3. Không sửa style, format, merge cell, font của file mẫu gốc. Chỉ ghi value
   vào đúng ô đã xác định.
4. Sau khi script chạy xong (`fill_qa_report.py`), luôn chạy lại bằng
   LibreOffice/`soffice --convert-to xlsx` hoặc script recalc để công thức
   SUM/VLOOKUP có giá trị, vì openpyxl không tự tính công thức.
5. Nếu người dùng đưa thêm ticket JSON mới, mặc định coi đây là NHIỀU ticket
   của CÙNG một PO/style cần gộp lại thành 1 báo cáo duy nhất (cộng dồn số
   lượng lỗi), trừ khi được yêu cầu khác.

## Việc còn cần xác nhận với người dùng (đừng tự quyết định)
- Ticket mẫu có `inspectionStage = "INLINE"` nhưng bảng AQL trong file mẫu
  được thiết kế cho Pre-Final/Final (sample size lớn, tới 315). Cần hỏi rõ:
  Inline có dùng chung sheet này không, hay có mẫu báo cáo riêng?
- Ô Style (mã hàng) đang tạm map vào H4, nhưng I4 cũng là ô vàng liền kề -
  cần người dùng xác nhận ô nào đúng.
- `defect_mapping.json` mới chỉ có 1 defect id mẫu (id=2). Cần danh sách đầy
  đủ defect catalog (id + tên) từ BE để hoàn thiện mapping cho toàn bộ 63
  dòng lỗi trong `excel_defect_rows_reference.json`.

## Cách chạy
```bash
pip install openpyxl --break-system-packages   # nếu chưa có

python fill_qa_report.py \
  --template BB_PREFINAL_FINAL_template.xlsx \
  --tickets tickets.json \
  --defect-mapping defect_mapping.json \
  --output output/report_filled.xlsx \
  --header-overrides header_overrides.json   # optional: Order Qty, MDA#...
```

## File trong project
- `fill_qa_report.py` — script chính, điền header + defect vào template.
- `defect_mapping.json` — defect.id -> {row, severity}. PHẢI hoàn thiện.
- `header_mapping.json` — tài liệu tra cứu ô nào map field nào, KHÔNG phải
  file được script đọc runtime (logic header đang hardcode trong
  `build_header_values()` để dễ đọc — có thể refactor đọc từ file này sau).
- `excel_defect_rows_reference.json` — liệt kê toàn bộ dòng lỗi trong file
  mẫu, dùng để đối chiếu khi bổ sung `defect_mapping.json`.

## CẬP NHẬT (v2) - Đọc kỹ, thay thế phần cũ bên trên về defect_mapping.json
Không dùng `defect_mapping.json` để map defect vào dòng cố định nữa.
Cách làm mới:
- Dòng 1-26 (header + tiêu đề cột OK/Major/Minor/Remarks): GIỮ NGUYÊN, không đụng vào.
- Dòng 27-89: XOÁ SẠCH nội dung cũ, ghi ĐỘNG mỗi `defect.name` khác nhau mà BE
  trả về thành 1 dòng (cột A = tên lỗi, cột I = số lượng, cột J = remarks).
  Đây LÀ MỘT VÙNG CỐ ĐỊNH KÍCH THƯỚC (63 dòng, 27-89) - chỉ nội dung bên
  trong là động, KHÔNG được insert/delete dòng thật (sẽ làm lệch công thức
  SUM ở dòng 90 và toàn bộ bảng AQL/Result phía dưới).
- Dòng 90 trở xuống (Total, bảng AQL, Kết quả Pass/Fail...): TUYỆT ĐỐI
  không xoá/ghi đè, để nguyên công thức có sẵn - nó tự tính lại dựa trên
  vùng H27:H89 / I27:I89.
- severity (Major/Minor) chưa có trong response BE -> script đang mặc định
  đẩy hết vào cột Minor (I) kèm cảnh báo trong Remarks. Khi BE bổ sung
  field severity, sửa `write_defect_rows()` để ghi đúng cột H hoặc I.
- Nếu số lượng defect.name khác nhau vượt quá 63 (nhiều hơn số dòng
  27-89 cho phép), script sẽ CẢNH BÁO và bỏ qua phần dư — cần bàn thêm
  hướng xử lý (mở rộng vùng, hoặc gộp nhóm lỗi) nếu gặp trường hợp này.