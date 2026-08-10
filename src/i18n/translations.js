// Từ điển Anh ngữ. Tiếng Việt trong JSX chính là "khoá" mặc định (không cần
// từ điển vi riêng) - useLanguage().t(str) trả về bản dịch nếu lang === 'en'
// và có trong bảng dưới, ngược lại trả nguyên văn tiếng Việt. Hỗ trợ nội suy
// {{tên_biến}} - xem LanguageContext.jsx.
export const en = {
  // -- Sidebar --
  'Tạo phiếu mới': 'New Ticket',
  'Danh sách phiếu': 'Ticket List',
  'Quản lý nhân viên': 'Staff Management',
  'Quản lý danh mục': 'Catalog Management',
  'Thống kê': 'Dashboard',
  'Tài liệu tham khảo': 'Reference Docs',
  Menu: 'Menu',
  'Garment QA Checking': 'Garment QA Checking',
  'Hiện menu': 'Show menu',
  'Ẩn menu': 'Hide menu',
  'Đổi ngôn ngữ': 'Switch language',
  'Garment QA': 'Garment QA',
  'Checking System': 'Checking System',
  'Tính năng đang phát triển': 'Feature in development',
  'Đang phát triển': 'In development',
  'Đăng nhập với': 'Signed in as',
  'Đổi mật khẩu': 'Change Password',
  'Đăng xuất': 'Log Out',
  'Đổi mật khẩu thành công.': 'Password changed successfully.',

  // -- LoginPage --
  'Vui lòng nhập tài khoản và mật khẩu': 'Please enter your username and password',
  'Đăng nhập thất bại': 'Login failed',
  'Management System': 'Management System',
  'Tài khoản': 'Username',
  'Mật khẩu': 'Password',
  'Ẩn mật khẩu': 'Hide password',
  'Hiện mật khẩu': 'Show password',
  'Server đang khởi động lại (có thể mất tới 30-60 giây ở lần dùng đầu tiên sau một thời gian không hoạt động), vui lòng chờ...':
    'Server is waking up (this may take 30-60 seconds on first use after a period of inactivity), please wait...',
  'Đang đăng nhập...': 'Logging in...',
  'Đăng nhập': 'Login',

  // -- QaDashboard --
  'Chưa có dữ liệu': 'No data yet',
  'Không tải được dữ liệu dashboard': 'Failed to load dashboard data',
  'Thống kê QA': 'QA Dashboard',
  'Nhà máy': 'Factory',
  'Tất cả': 'All',
  'Nhân viên': 'Staff',
  'Đang tải...': 'Loading...',
  'Số lượt kiểm theo khâu': 'Inspections by Stage',
  'Tổng số lượt kiểm:': 'Total inspections:',
  'lần kiểm': 'inspections',
  'Tỉ lệ DHU (%) theo ngày': 'DHU Rate (%) by Date',
  'Tỉ lệ DHU': 'DHU Rate',
  'Tỉ lệ DHU (%)': 'DHU Rate (%)',
  'Pareto nhóm lỗi': 'Defect Group Pareto',
  'Số lượng lỗi': 'Defect Count',
  '% tích luỹ': '% Cumulative',
  'Tỉ lệ DHU (%) theo khâu kiểm': 'DHU Rate (%) by Inspection Stage',

  // -- TicketListPage --
  'Không tải được danh sách phiếu': 'Failed to load ticket list',
  'Xoá phiếu này? Chỉ xoá được phiếu ở trạng thái Nháp.': 'Delete this ticket? Only tickets in Draft status can be deleted.',
  'Xoá phiếu thất bại': 'Failed to delete ticket',
  'Cập nhật trạng thái đã xuất thất bại': 'Failed to update export status',
  'Phiếu này đã được xuất, không thể xuất lại': 'This ticket has already been exported and cannot be exported again',
  'Đang chuẩn bị...': 'Preparing...',
  'Xuất PDF thất bại': 'PDF export failed',
  '{{count}} loại lỗi bị bỏ qua do vượt quá số dòng cho phép trong bảng lỗi':
    '{{count}} defect type(s) were skipped because they exceed the allowed rows in the defect table',
  '{{count}} ảnh Major bị bỏ qua do vượt quá 16 khung ảnh':
    '{{count}} Major image(s) were skipped because they exceed the 16-image limit',
  '{{count}} ảnh Minor bị bỏ qua do vượt quá 16 khung ảnh':
    '{{count}} Minor image(s) were skipped because they exceed the 16-image limit',
  'Đã xuất file nhưng {{details}}': 'File exported but {{details}}',
  'Xuất Excel thất bại': 'Excel export failed',
  'Mở khoá xuất lại thất bại': 'Failed to unlock re-export',
  'Danh sách phiếu QA': 'QA Ticket List',
  'Xoá bộ lọc': 'Clear filters',
  'Khách hàng': 'Customer',
  'Tìm theo tên khách hàng': 'Search by customer name',
  'Trạng thái': 'Status',
  Nháp: 'Draft',
  'Đã nộp': 'Submitted',
  'Đã xuất': 'Exported',
  'Chưa xuất': 'Not exported',
  'Từ ngày - Đến ngày': 'From date - To date',
  'Mã phiếu': 'Ticket Code',
  Chuyền: 'Line',
  'Khâu KT': 'Inspection Stage',
  SL: 'Qty',
  'KQ AQL': 'AQL Result',
  Xuất: 'Exported',
  'Ngày tạo': 'Created Date',
  'Hành động': 'Action',
  Có: 'Yes',
  Không: 'No',
  'Chưa có phiếu nào': 'No tickets yet',
  'Tải thêm': 'Load more',

  // -- QaTicketFormPage --
  'Không tải được phiếu': 'Failed to load ticket',
  'Vui lòng kiểm tra lại các trường còn thiếu/sai bên dưới.': 'Please review the missing/incorrect fields below.',
  'Đã nộp phiếu {{code}} thành công.': 'Ticket {{code}} submitted successfully.',
  'Đã lưu nháp phiếu {{code}} thành công.': 'Ticket {{code}} saved as draft successfully.',
  'Dữ liệu không hợp lệ.': 'Invalid data.',
  'Có lỗi xảy ra, vui lòng thử lại.': 'Something went wrong, please try again.',
  'Đang tải phiếu...': 'Loading ticket...',
  'Quay lại danh sách': 'Back to list',
  'Nộp phiếu': 'Submit Ticket',
  'Đang lưu...': 'Saving...',
  'Lưu Phiếu QA': 'Save QA Ticket',

  // -- GeneralInfoCard --
  'Upload ảnh thất bại': 'Image upload failed',
  '{{n}} ảnh không đọc được, vui lòng thử ảnh khác': '{{n}} image(s) could not be read, please try another image',
  'QA Name (Nhân viên QA)': 'QA Name',
  'Factory (Nhà máy)': 'Factory',
  'Chọn nhà máy': 'Select factory',
  'Line (Chuyền may)': 'Line',
  'Chọn chuyền': 'Select line',
  'Cụm / Group': 'Group',
  'Chọn cụm (optional)': 'Select group (optional)',
  'Nhập số PO': 'Enter PO number',
  'Style (Mã hàng)': 'Style',
  'Nhập mã hàng (style)': 'Enter style code',
  'Tự động lấy theo Sampling size (AQL)': 'Automatically set from Sampling size (AQL)',
  'Customer (Khách hàng)': 'Customer',
  'Nhập tên khách hàng': 'Enter customer name',
  'Garment (Loại sản phẩm)': 'Garment Type',
  'Chọn loại sản phẩm': 'Select garment type',
  'Hình ảnh thông số': 'Measurement Images',
  'Đang tải ảnh lên...': 'Uploading images...',
  'Chụp ảnh': 'Take Photo',
  'Thư viện': 'Gallery',
  Xoá: 'Remove',
  'Upload hình ảnh duyệt (Spec Images)': 'Upload Approval Images (Spec Images)',
  'Mẫu duyệt (Approved Sample)': 'Approved Sample',
  'Bảng thông số kích thước': 'Size Spec Sheet',
  'Quy cách đóng thùng/Bao bì': 'Packing Specification',
  'Thẻ treo & Nhãn hiệu': 'Hangtag & Label',
  'Khác (ảnh cũ chưa phân loại)': 'Other (unclassified legacy images)',

  // -- DefectsCard --
  'Defects (Lỗi) — Chi Tiết Các Lỗi Phát Hiện Trên Chuyền': 'Defects — Detailed Defects Found on the Line',
  'Chưa có defect nào. Bấm "+ Add Defect" để thêm.': 'No defects yet. Click "+ Add Defect" to add one.',

  // -- DefectItem --
  'Xoá defect': 'Remove defect',
  '1. DEFECT (Lỗi)': '1. DEFECT',
  'Tìm và chọn lỗi': 'Search and select defect',
  'Mức độ lỗi (Severity)': 'Severity',
  '-- Chọn mức độ --': '-- Select severity --',
  'Major (Lỗi nặng)': 'Major',
  'Minor (Lỗi nhẹ)': 'Minor',
  'Ghi chú lỗi (optional)': 'Defect note (optional)',
  '+ Thêm vị trí (Add Location)': '+ Add Location',

  // -- LocationItem --
  'VỊ TRÍ {{n}}': 'LOCATION {{n}}',
  'Xoá vị trí': 'Remove location',
  'Vị trí (cổ, tay, sườn...)': 'Location (collar, sleeve, side seam...)',
  'Chọn hoặc gõ vị trí': 'Select or type location',
  'Số lượng': 'Quantity',

  // -- AqlSamplingSection --
  'Không tra được sampling plan': 'Failed to look up sampling plan',
  'Nhập order qty': 'Enter order qty',
  'Actual Major/Minor Defects tự tính từ tổng số lượng các defect đã khai báo bên dưới theo mức độ (Major/Minor).':
    'Actual Major/Minor Defects are auto-calculated from the total quantity of defects declared below, grouped by severity (Major/Minor).',
  'Đang tra sampling plan...': 'Looking up sampling plan...',

  // -- TicketDetailModal --
  'Mẫu duyệt': 'Approved Sample',
  Khác: 'Other',
  'Không tải được chi tiết phiếu': 'Failed to load ticket detail',
  'Chi tiết phiếu {{code}}': 'Ticket Detail {{code}}',
  'Đóng': 'Close',
  'Nhân viên QA': 'QA Staff',
  'Loại sản phẩm': 'Garment Type',
  'Khâu kiểm tra': 'Inspection Stage',
  'Sản lượng kiểm tra': 'Inspected Qty',
  'Kết quả AQL': 'AQL Result',
  'Hình ảnh Spec': 'Spec Images',
  'Defects ({{count}})': 'Defects ({{count}})',
  'Ghi chú:': 'Note:',
  'SL:': 'Qty:',
  'Không có defect nào': 'No defects',

  // -- StaffManagementPage --
  'Không tải được danh sách nhân viên': 'Failed to load staff list',
  'Khoá tài khoản thất bại': 'Failed to lock account',
  'Mở khoá tài khoản thất bại': 'Failed to unlock account',
  '+ Thêm nhân viên': '+ Add Staff',
  'Tìm theo tên': 'Search by name',
  'Nhập họ tên nhân viên': 'Enter staff full name',
  'Họ tên': 'Full Name',
  'Vai trò': 'Role',
  'Đã khoá': 'Locked',
  'Hoạt động': 'Active',
  'Chưa có nhân viên nào': 'No staff yet',

  // -- StaffRowActions --
  'Thao tác': 'Actions',
  'Khoá tài khoản': 'Lock account',
  'Mở khoá': 'Unlock',
  'Reset mật khẩu': 'Reset password',

  // -- CreateStaffModal --
  'Vui lòng nhập đầy đủ thông tin': 'Please fill in all required information',
  'Mật khẩu phải có ít nhất 6 ký tự': 'Password must be at least 6 characters',
  'Tạo nhân viên thất bại': 'Failed to create staff',
  'Thêm nhân viên': 'Add Staff',
  'Tài khoản (username)': 'Username',
  'Vai trò (role)': 'Role',
  'Huỷ': 'Cancel',
  'Đang tạo...': 'Creating...',
  'Tạo nhân viên': 'Create Staff',

  // -- ResetStaffPasswordModal --
  'Mật khẩu mới phải có ít nhất 6 ký tự': 'New password must be at least 6 characters',
  'Xác nhận mật khẩu mới không khớp': 'Password confirmation does not match',
  'Reset mật khẩu thất bại': 'Failed to reset password',
  'Mật khẩu mới': 'New password',
  'Xác nhận mật khẩu mới': 'Confirm new password',

  // -- ChangePasswordModal --
  'Đổi mật khẩu thất bại': 'Failed to change password',
  'Mật khẩu hiện tại': 'Current password',

  // -- QcChecklistModal --
  'Chọn v/x tiêu chí trước khi xuất {{label}}': 'Select pass/fail criteria before exporting {{label}}',
  'Mặc định tất cả là "v" (đạt). Tick "x" cho tiêu chí không đạt.':
    'All items default to "v" (pass). Tick "x" for items that fail.',
  'Đạt': 'Pass',
  'Không đạt': 'Fail',
  'Pending - Treo (vẫn trong AQL nhưng có yếu tố khách quan)':
    'Pending - Treo (still within AQL but held for an external reason)',
  'Phiếu này có bị Pending không?': 'Is this ticket Pending?',
  'Có': 'Yes',
  'Không': 'No',
  'Lý do Pending': 'Pending reason',
  'Nhập lý do pending...': 'Enter the pending reason...',
  'Vui lòng nhập lý do Pending': 'Please enter the Pending reason',
  'Xác nhận & Xuất {{label}}': 'Confirm & Export {{label}}',

  // -- TicketRowActions --
  'Xem chi tiết': 'View detail',
  'Sửa': 'Edit',
  'Phiếu đã xuất, không thể xuất lại': 'Ticket already exported, cannot export again',
  'Xuất PDF': 'Export PDF',
  'Xuất Excel': 'Export Excel',
  'Xuất PDF giống Excel': 'Export PDF (Excel-like)',
  'Cho phép xuất lại': 'Allow re-export',

  // -- ImageEditorModal --
  'Chỉnh sửa ảnh': 'Edit Image',
  'Cắt ảnh': 'Crop',
  'Vẽ': 'Draw',
  'Đang tải ảnh...': 'Loading image...',
  'Màu {{color}}': 'Color {{color}}',
  'Áp dụng cắt': 'Apply Crop',
  'Hoàn tác': 'Undo',
  'Dùng ảnh này': 'Use This Image',

  // -- DraftBanner --
  'Bạn có phiếu đang nhập dở. Muốn khôi phục lại không?': 'You have an unfinished ticket in progress. Restore it?',
  'Khôi phục': 'Restore',
  'Bỏ qua': 'Dismiss',

  // -- SearchableSelect --
  'Chọn...': 'Select...',
  'Không có kết quả': 'No results',

  // -- CatalogManagementPage --
  'Nhóm lỗi': 'Defect Group',
  'Lỗi chi tiết': 'Defect Item',
  'Vị trí trên sản phẩm': 'Garment Location',

  // -- DefectManagementTab --
  'Nhóm lỗi dùng làm danh mục cha cho các lỗi chi tiết.':
    'Defect groups are the parent category for detailed defect items.',
  'Không tải được danh sách nhóm lỗi': 'Failed to load defect group list',
  '+ Thêm nhóm lỗi': '+ Add Defect Group',
  'Mã': 'Code',
  'Tên (Tiếng Việt)': 'Name (Vietnamese)',
  'Tên (Tiếng Anh)': 'Name (English)',
  'Chưa có nhóm lỗi nào': 'No defect groups yet',

  // -- DefectFormModal --
  'Vui lòng nhập tên lỗi (tiếng Việt)': 'Please enter the defect name (Vietnamese)',
  'Lưu nhóm lỗi thất bại': 'Failed to save defect group',
  'Sửa nhóm lỗi': 'Edit Defect Group',
  'Thêm nhóm lỗi': 'Add Defect Group',
  'Mã lỗi': 'Code',
  'Đang lưu...': 'Saving...',
  'Lưu': 'Save',

  // -- DefectItemManagementTab --
  'Lỗi chi tiết thuộc về 1 nhóm lỗi, dùng trong danh sách chọn lỗi khi tạo phiếu.':
    'Defect items belong to a defect group and are used in the defect picker when creating a ticket.',
  'Không tải được danh sách lỗi chi tiết': 'Failed to load defect item list',
  '+ Thêm lỗi chi tiết': '+ Add Defect Item',
  'Chưa có lỗi chi tiết nào': 'No defect items yet',

  // -- DefectItemFormModal --
  'Vui lòng chọn nhóm lỗi': 'Please select a defect group',
  'Lưu lỗi chi tiết thất bại': 'Failed to save defect item',
  'Sửa lỗi chi tiết': 'Edit Defect Item',
  'Thêm lỗi chi tiết': 'Add Defect Item',
  'Cho phép Minor': 'Allow Minor',
  'Cho phép Major': 'Allow Major',

  // -- GarmentLocationManagementTab --
  'Không tải được danh sách loại sản phẩm': 'Failed to load garment type list',
  'Không tải được danh sách vị trí': 'Failed to load location list',
  '+ Thêm vị trí': '+ Add Location',
  'Tên vị trí': 'Location Name',
  'Chưa có vị trí nào': 'No locations yet',

  // -- GarmentLocationFormModal --
  'Vui lòng chọn loại sản phẩm': 'Please select a garment type',
  'Vui lòng nhập tên vị trí': 'Please enter a location name',
  'Lưu vị trí thất bại': 'Failed to save location',
  'Sửa vị trí': 'Edit Location',
  'Thêm vị trí': 'Add Location',
}
