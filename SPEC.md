# Spec xây dựng Frontend — Garment QA Checking (React)

## 0. Bối cảnh

Xây dựng 1 trang React "Tạo/Sửa Phiếu QA" (Garment QA Checking) kết nối với backend Spring Boot
(QMS Backend). Ưu tiên: **React (functional components + hooks)**, không dùng thẻ `<form>` gốc để
submit (tự quản lý state + onClick), gọi API bằng `fetch`.

---

## 1. Cấu trúc UI (theo mockup đính kèm)

### 1.1. Banner khôi phục nháp (trên cùng, chỉ hiện khi có draft local)
- Text: "📝 Bạn có phiếu đang nhập dở. Muốn khôi phục lại không?"
- 2 nút: **Khôi phục** (primary, màu cam) / **Bỏ qua** (link/text button)
- Draft lưu local (localStorage phía React app thật — lưu ý: trong môi trường Claude Artifact
  preview không dùng được localStorage, nhưng trong dự án React thật của bạn thì dùng bình thường).
  Lưu toàn bộ state form mỗi khi thay đổi (debounce ~1s), xoá draft sau khi submit thành công.

### 1.2. Card thông tin chung "GARMENT QA CHECKING"
Layout dạng grid, 5 cột responsive (wrap xuống mobile):

**Hàng 1:**
| Field | Component | Nguồn data |
|---|---|---|
| QA Name (Nhân viên QA) | Dropdown/combobox tìm kiếm | `GET /api/master/staff` → hiển thị `fullName`, value = `id` |
| Factory (Nhà máy) | Dropdown | `GET /api/master/factories` → hiển thị `name` |
| Line (Chuyền may) | Dropdown, **disabled đến khi chọn Factory** | `GET /api/master/lines?factoryId=` |
| Cụm / Group | Dropdown, optional, disabled đến khi chọn Line | `GET /api/master/groups?lineId=` |
| Inspection Stage (Khâu kiểm tra) | Select enum | `INLINE`\|`ENDLINE`\|`FINAL`\|`INPUT` (hiển thị: Inline/Endline/Final/Input) |

**Hàng 2:**
| Field | Component | Nguồn data |
|---|---|---|
| Ticket ID (mã phiếu tự động) | Readonly badge, style nổi bật (viền đỏ như mockup) | Trước khi lưu: hiển thị "Chưa cấp mã" hoặc placeholder; sau khi tạo thành công: hiển thị `ticketCode` trả về từ API (vd `I00150`) |
| PO | Autocomplete/search input | `GET /api/purchase-orders?search=` (debounce 300ms khi gõ), hiển thị `poCode`, value = `id`. Optional. |
| Inspected Qty (Sản lượng kiểm tra) | Number stepper (nút -/+, input giữa) | Bắt buộc, > 0 |
| Customer (Khách hàng) | Dropdown | `GET /api/master/customers` |
| Garment (Loại sản phẩm) | Dropdown | `GET /api/master/garment-types` |

### 1.3. Card Defect Details (Chi Tiết Các Lỗi Phát Hiện Trên Chuyền)
- Header: badge tròn "N Defects (Lỗi)" (N = số defect hiện tại) + tiêu đề + nút **"+ Add Defect"**
  (viền đỏ, góc phải)
- Mỗi **Defect card** (viền trái màu đỏ đậm, nền xám nhạt):
  - Label "DEFECT #k" + icon thùng rác (xoá cả defect này)
  - "1. DEFECT (Lỗi)" → dropdown tìm kiếm defect: `GET /api/master/defects` (hiển thị
    `nameVi` — hoặc `nameVi (nameEn)`; value = `id`)
  - (Thiếu trong mockup nhưng cần thêm) ô **Note** (textarea, optional) — ghi chú lỗi
  - Danh sách **Location** bên trong defect, mỗi location là 1 khối con (nền trắng, viền xanh dương nhạt):
    - Badge "VỊ TRÍ n" + nút x (xoá location này)
    - Input "Vị trí (cổ, tay, sườn...)" → nếu có danh mục theo garmentType đã chọn thì hiển thị
      dạng dropdown từ `GET /api/master/garment-locations?garmentTypeId=` (chọn `id` →
      `garmentLocationId`), đồng thời set `locationText` = tên hiển thị; nếu người dùng gõ tay
      (không có trong danh mục) thì `garmentLocationId = null`, chỉ gửi `locationText` tự do.
    - Number stepper Quantity (-/+ + input giữa), bắt buộc > 0
    - 2 nút: **Chụp** (mở camera, `<input type="file" accept="image/*" capture="environment">`) và
      **Thư viện** (mở gallery, `<input type="file" accept="image/*" multiple>`)
    - Thumbnail preview các ảnh đã chọn (chưa upload) + ảnh đã upload xong, có nút xoá từng ảnh
  - Nút "+ Thêm vị trí (Add Location)" (viền xanh dương, dashed) — thêm 1 location rỗng vào defect này

### 1.4. Footer
- Nút **"✓ Lưu Phiếu QA"** (đỏ, góc phải, nổi bật). Cần làm rõ 2 hành vi:
  - Nếu chưa có yêu cầu phân biệt Nháp/Nộp trên UI này → mặc định `status = "DRAFT"` khi bấm nút
    này, và có thể thêm 1 nút phụ "Nộp phiếu" (`status = "SUBMITTED"`) nếu bạn cần — **hỏi lại tôi
    nếu muốn thêm nút Nộp riêng**, hiện mockup chỉ có 1 nút Lưu.

---

## 2. Auth & vòng đời token

- `POST /api/auth/login` → nhận `accessToken` (hết hạn sau `expiresInMs`, mặc định 1h),
  `refreshToken` (hết hạn 30 ngày). Lưu cả 2 vào storage (localStorage trong app thật).
- Mọi request tới `/api/**` (trừ `login`, `refresh`, `logout`) phải có header
  `Authorization: Bearer <accessToken>`.
- Khi nhận `401`: gọi `POST /api/auth/refresh` với `refreshToken` hiện tại → nhận cặp token mới →
  **ghi đè cả accessToken lẫn refreshToken** (refresh token cũ bị vô hiệu ngay do rotation) → retry
  lại request vừa 401. Nếu refresh cũng 401 → xoá token, điều hướng về màn Login.
- Nên viết 1 hàm `apiFetch(url, options)` dùng chung, tự đính kèm token + tự xử lý refresh-and-retry
  1 lần, để mọi lời gọi API trong app đều đi qua đây.
- `POST /api/auth/logout` (body `{ refreshToken }`) → `204` → xoá token local → về Login.

---

## 3. Upload ảnh

- `POST /api/uploads/images`, `multipart/form-data`, field name **`files`**, gửi nhiều file cùng
  field name trong 1 request để upload song song (không gửi từng ảnh 1 request).
- Chỉ nhận `image/jpeg`, `image/png`, `image/webp`, `image/gif`; tối đa 10MB/ảnh, 50MB/request.
- Response: mảng URL string, **đúng thứ tự** với file đã gửi → gán vào `location.images` (mảng
  string URL) tương ứng.
- Flow đề xuất: khi user chọn/chụp ảnh cho 1 location → upload ngay lập tức (không đợi tới lúc bấm
  Lưu Phiếu QA) → nhận URL → lưu vào state của location đó, hiển thị thumbnail. Khi bấm Lưu Phiếu QA
  thì `images` trong payload đã sẵn là mảng URL.

---

## 4. Tạo / Cập nhật phiếu (QA Ticket)

### Payload chung cho `POST /api/qa-tickets` (tạo) và `PUT /api/qa-tickets/{id}` (sửa):

```json
{
  "staffId": 1,
  "factoryId": 1,
  "lineId": 1,
  "groupId": 1,
  "inspectionStage": "INLINE",
  "poId": 1,
  "inspectedQty": 120,
  "customerId": 1,
  "garmentTypeId": 1,
  "status": "DRAFT",
  "defects": [
    {
      "defectId": 1,
      "note": "Phát hiện ở mũi may đầu tay",
      "locations": [
        {
          "garmentLocationId": 1,
          "locationText": "Cổ áo",
          "quantity": 2,
          "images": ["https://.../abc.jpg"]
        }
      ]
    }
  ]
}
```

- Bắt buộc: `staffId`, `factoryId`, `lineId`, `inspectionStage`, `inspectedQty` (>0), `customerId`,
  `garmentTypeId`, `status`. `groupId`, `poId` optional (gửi `null` nếu không chọn).
- Mỗi location bắt buộc `locationText`, `quantity` (>0); `garmentLocationId` optional;
  `images` optional (mảng URL, có thể rỗng).
- **QUAN TRỌNG khi sửa (PUT):** backend thay thế toàn bộ cây con defects/locations/images (orphan
  removal) — không phải gửi diff. Flow bắt buộc: `GET /api/qa-tickets/{id}` trước để lấy full data
  → đổ vào state form (đầy đủ, không rút gọn) → user sửa gì thì sửa trên state đó → khi PUT thì gửi
  lại **toàn bộ** state (kể cả các defect/location/image không đổi), nếu không sẽ bị mất dữ liệu.
- Response `201`/`200` trả về `QaTicketResponse` đầy đủ (có `id`, `ticketCode`, các object
  reference dạng `{id, name}` đã kèm tên hiển thị, không cần tự lookup thêm) — dùng để cập nhật lại
  `ticketCode` hiển thị ở ô "Ticket ID" và điều hướng/hiển thị kết quả.
- Lỗi validate → `400` kèm `fieldErrors: { tenField: "message" }` → map từng key trong
  `fieldErrors` vào field lỗi tương ứng trên form để hiện message đỏ dưới input đó. Lỗi khác (404
  không tìm thấy staff/factory/...) → hiện toast lỗi chung với `message`.

### Các API khác liên quan tới danh sách/thao tác phiếu (dùng cho các màn khác ngoài form này):
- `GET /api/qa-tickets/{id}` — chi tiết 1 phiếu (dùng khi mở sửa)
- `GET /api/qa-tickets?factoryId=&lineId=&staffId=&status=&exported=&dateFrom=&dateTo=&cursor=&size=`
  — danh sách phân trang kiểu cursor (sort mới nhất trước); lấy trang kế = gọi lại với
  `cursor = nextCursor` của response trước; `hasNext=false` là hết dữ liệu.
- `PATCH /api/qa-tickets/{id}/export` / `PATCH /api/qa-tickets/{id}/unexport` — đánh dấu / bỏ đánh
  dấu đã xuất file, không cần body, trả về ticket đầy đủ.
- `DELETE /api/qa-tickets/{id}` — chỉ xoá được khi `status = DRAFT`, nếu `SUBMITTED` → `409`.

---

## 5. State shape đề xuất (React)

```js
{
  staffId: null, factoryId: null, lineId: null, groupId: null,
  inspectionStage: "INLINE", poId: null, inspectedQty: null,
  customerId: null, garmentTypeId: null, status: "DRAFT",
  ticketCode: null, // chỉ có sau khi tạo thành công
  defects: [
    {
      _localId: "uuid-tam-thoi-de-render-key", // không gửi lên BE
      defectId: null, note: "",
      locations: [
        {
          _localId: "uuid-tam-thoi",
          garmentLocationId: null, locationText: "", quantity: null,
          images: [] // mảng URL string sau khi upload xong
        }
      ]
    }
  ]
}
```
Dùng `_localId` (uuid) làm `key` khi render list defect/location để tránh bug reorder khi
thêm/xoá; khi build payload gửi API thì loại bỏ field `_localId` (và `id` nếu đang tạo mới) trước
khi `POST`/`PUT`.

## 6. Dropdown phụ thuộc (cascade) — thứ tự bắt buộc gọi lại
1. Chọn Factory → gọi `lines?factoryId=` → enable Line dropdown, reset Line/Group đã chọn trước đó
2. Chọn Line → gọi `groups?lineId=` → enable Group dropdown (optional), reset Group đã chọn
3. Chọn Garment Type → gọi `garment-locations?garmentTypeId=` → dùng cho toàn bộ location picker
   trong các defect (garmentType chỉ chọn 1 lần ở cấp phiếu, áp dụng chung)

## 7. Validate phía client trước khi gọi API (giảm round-trip lỗi 400)
- `inspectedQty > 0`, các field bắt buộc ở mục 4 không null
- Mỗi defect phải có `defectId`, ít nhất 1 location
- Mỗi location phải có `locationText` không rỗng và `quantity > 0`