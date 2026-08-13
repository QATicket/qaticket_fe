import { useEffect, useState } from 'react'
import {
  listQaTickets,
  deleteQaTicket,
  exportQaTicket,
  unexportQaTicket,
  getQaTicket,
} from '../api/qaTickets'
import { getFactories, getAllStaff } from '../api/master'
import { exportTicketPdf } from '../utils/pdfExport'
import { exportTicketsExcel } from '../utils/excelExport'
import { exportTicketPdfExcelStyle } from '../utils/pdfExportExcelStyle'
import TicketRowActions from './TicketRowActions'
import TicketDetailModal from './TicketDetailModal'
import ExportProgressModal from './ExportProgressModal'
import QcChecklistModal from './QcChecklistModal'
import { useLanguage } from '../i18n/LanguageContext'

const STATUS_LABEL = { DRAFT: 'Nháp', SUBMITTED: 'Đã nộp' }
const FILTER_INPUT_CLASS =
  'w-full bg-white text-slate-800 border border-slate-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy'

export default function TicketListPage({ userInfo, onEdit }) {
  const { t } = useLanguage()
  const isAdmin = userInfo?.role === 'ADMIN'
  const [items, setItems] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [factoryOptions, setFactoryOptions] = useState([])
  const [staffOptions, setStaffOptions] = useState([])
  const [filters, setFilters] = useState({
    factoryId: '',
    customer: '',
    staffId: '',
    status: '',
    exported: '',
    dateFrom: '',
    dateTo: '',
  })
  const [customerQuery, setCustomerQuery] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [viewingTicketId, setViewingTicketId] = useState(null)
  const [pdfProgress, setPdfProgress] = useState('')
  const [excelProgress, setExcelProgress] = useState('')
  const [qcChecklistTicket, setQcChecklistTicket] = useState(null)
  const [qcChecklistMode, setQcChecklistMode] = useState('excel')

  useEffect(() => {
    getFactories()
      .then((list) => setFactoryOptions(list.map((f) => ({ value: f.id, label: f.name }))))
      .catch(() => {})
    // Nhân viên thường chỉ xem được phiếu của mình (BE tự scope), nên không
    // cần filter theo nhân viên - chỉ admin mới thấy/lọc được phiếu của tất cả.
    if (isAdmin) {
      getAllStaff()
        .then((list) => setStaffOptions(list.map((s) => ({ value: s.id, label: s.fullName }))))
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Search theo Customer debounce 600ms để không bắn request mỗi lần gõ phím.
  useEffect(() => {
    const handle = setTimeout(() => {
      setFilters((f) => (f.customer === customerQuery ? f : { ...f, customer: customerQuery }))
    }, 600)
    return () => clearTimeout(handle)
  }, [customerQuery])

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }))
  }

  function resetFilters() {
    setCustomerQuery('')
    setFilters({
      factoryId: '',
      customer: '',
      staffId: '',
      status: '',
      exported: '',
      dateFrom: '',
      dateTo: '',
    })
  }

  async function fetchPage(cursor) {
    setLoading(true)
    setError('')
    try {
      const query = {
        factoryId: filters.factoryId || undefined,
        customer: filters.customer || undefined,
        staffId: filters.staffId || undefined,
        status: filters.status || undefined,
        exported: filters.exported || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        cursor: cursor || undefined,
        size: 20,
      }
      const res = await listQaTickets(query)
      setItems((prev) => (cursor ? [...prev, ...res.items] : res.items))
      setNextCursor(res.nextCursor)
      setHasNext(res.hasNext)
    } catch (err) {
      setError(err.message || t('Không tải được danh sách phiếu'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPage(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  async function handleDelete(id) {
    if (!window.confirm(t('Xoá phiếu này? Chỉ xoá được phiếu ở trạng thái Nháp.'))) return
    setBusyId(id)
    try {
      await deleteQaTicket(id)
      setItems((prev) => prev.filter((row) => row.id !== id))
    } catch (err) {
      setError(err.message || t('Xoá phiếu thất bại'))
    } finally {
      setBusyId(null)
    }
  }

  function markExportedLocally(id) {
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, exported: true } : row)))
  }

  // Đánh dấu phiếu đã xuất ở BE ngay sau khi file được tạo thành công - phiếu
  // đã xuất thì không cho xuất lại nữa (trừ admin, xem isAdmin ở trên).
  async function markExported(ticket) {
    try {
      await exportQaTicket(ticket.id)
      markExportedLocally(ticket.id)
    } catch (err) {
      setError(err.message || t('Cập nhật trạng thái đã xuất thất bại'))
    }
  }

  // PDF cũng cần v/x Materials thật (không phải luôn mặc định "v") nên đi qua
  // QcChecklistModal giống flow Excel - qcChecklistMode phân biệt export nào
  // sẽ chạy khi người dùng xác nhận (xem handleConfirmQcChecklist).
  //
  // `row` trong bảng danh sách là DTO rút gọn (staffName/factoryName/lineName
  // dạng chuỗi phẳng) - KHÔNG có actualMajorDefects/actualMinorDefects/
  // aqlLevel, nên QcChecklistModal không tự tính được AQL result khi BE chưa
  // tính sẵn ticket.inspectionResult (xem utils/aqlResult.js). Phải gọi lại
  // getQaTicket(id) lấy chi tiết đầy đủ trước khi mở modal.
  async function openQcChecklistModal(ticket, mode) {
    if (ticket.exported && !isAdmin) {
      setError(t('Phiếu này đã được xuất, không thể xuất lại'))
      return
    }
    setError('')
    setBusyId(ticket.id)
    try {
      const fullTicket = await getQaTicket(ticket.id)
      setQcChecklistMode(mode)
      setQcChecklistTicket(fullTicket)
    } catch (err) {
      setError(err.message || t('Không tải được chi tiết phiếu'))
    } finally {
      setBusyId(null)
    }
  }

  function handleExportPdf(ticket) {
    openQcChecklistModal(ticket, 'pdf')
  }

  function handleExportExcel(ticket) {
    openQcChecklistModal(ticket, 'excel')
  }

  // Tính năng riêng "Xuất PDF giống Excel" (xem pdfExportExcelStyle.js) - đi
  // qua cùng QcChecklistModal để lấy v/x Materials thật, giống flow pdf/excel.
  function handleExportPdfExcelStyle(ticket) {
    openQcChecklistModal(ticket, 'pdf-excel-style')
  }

  async function handleConfirmQcChecklist(qcChecklistValues) {
    const ticket = qcChecklistTicket
    const mode = qcChecklistMode
    setQcChecklistTicket(null)
    setBusyId(ticket.id)
    setError('')

    if (mode === 'pdf') {
      setPdfProgress(t('Đang chuẩn bị...'))
      try {
        await exportTicketPdf(ticket.id, { onProgress: setPdfProgress, qcChecklistValues })
        await markExported(ticket)
      } catch (err) {
        setError(err.message || t('Xuất PDF thất bại'))
      } finally {
        setBusyId(null)
        setPdfProgress('')
      }
      return
    }

    if (mode === 'pdf-excel-style') {
      setPdfProgress(t('Đang chuẩn bị...'))
      try {
        await exportTicketPdfExcelStyle(ticket.id, { onProgress: setPdfProgress, qcChecklistValues })
        await markExported(ticket)
      } catch (err) {
        setError(err.message || t('Xuất PDF thất bại'))
      } finally {
        setBusyId(null)
        setPdfProgress('')
      }
      return
    }

    setExcelProgress(t('Đang chuẩn bị...'))
    try {
      const { overflow } = await exportTicketsExcel(ticket.id, {
        onProgress: setExcelProgress,
        qcChecklistValues,
      })
      await markExported(ticket)
      const messages = []
      if (overflow.length > 0) {
        messages.push(
          t('{{count}} loại lỗi bị bỏ qua do vượt quá số dòng cho phép trong bảng lỗi', {
            count: overflow.length,
          }),
        )
      }
      if (messages.length > 0) {
        setError(t('Đã xuất file nhưng {{details}}', { details: messages.join('; ') }))
      }
    } catch (err) {
      setError(err.message || t('Xuất Excel thất bại'))
    } finally {
      setBusyId(null)
      setExcelProgress('')
    }
  }

  async function handleUnexport(ticket) {
    setBusyId(ticket.id)
    setError('')
    try {
      await unexportQaTicket(ticket.id)
      setItems((prev) => prev.map((row) => (row.id === ticket.id ? { ...row, exported: false } : row)))
    } catch (err) {
      setError(err.message || t('Mở khoá xuất lại thất bại'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen py-6 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto">

        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-slate-800">{t('Danh sách phiếu QA')}</h1>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-brand-navy underline"
            >
              {t('Xoá bộ lọc')}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{t('Nhà máy')}</label>
              <select
                className={FILTER_INPUT_CLASS}
                value={filters.factoryId}
                onChange={(e) => updateFilter('factoryId', e.target.value)}
              >
                <option value="">{t('Tất cả')}</option>
                {factoryOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{t('Khách hàng')}</label>
              <input
                type="text"
                className={FILTER_INPUT_CLASS}
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                placeholder={t('Tìm theo tên khách hàng')}
              />
            </div>

            {isAdmin && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('Nhân viên')}</label>
                <select
                  className={FILTER_INPUT_CLASS}
                  value={filters.staffId}
                  onChange={(e) => updateFilter('staffId', e.target.value)}
                >
                  <option value="">{t('Tất cả')}</option>
                  {staffOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{t('Trạng thái')}</label>
              <select
                className={FILTER_INPUT_CLASS}
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
              >
                <option value="">{t('Tất cả')}</option>
                <option value="DRAFT">{t('Nháp')}</option>
                <option value="SUBMITTED">{t('Đã nộp')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{t('Đã xuất')}</label>
              <select
                className={FILTER_INPUT_CLASS}
                value={filters.exported}
                onChange={(e) => updateFilter('exported', e.target.value)}
              >
                <option value="">{t('Tất cả')}</option>
                <option value="true">{t('Đã xuất')}</option>
                <option value="false">{t('Chưa xuất')}</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1 lg:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">{t('Từ ngày - Đến ngày')}</label>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  className={FILTER_INPUT_CLASS}
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                />
                <span className="text-slate-400 text-xs shrink-0">–</span>
                <input
                  type="date"
                  className={FILTER_INPUT_CLASS}
                  value={filters.dateTo}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-brand-red text-brand-red text-sm rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3">{t('Mã phiếu')}</th>
                <th className="px-4 py-3">{t('Nhân viên')}</th>
                <th className="px-4 py-3">{t('Nhà máy')}</th>
                <th className="px-4 py-3">{t('Chuyền')}</th>
                <th className="px-4 py-3">{t('Khách hàng')}</th>
                <th className="px-4 py-3">{t('Khâu KT')}</th>
                <th className="px-4 py-3">{t('SL')}</th>
                <th className="px-4 py-3">{t('Trạng thái')}</th>
                <th className="px-4 py-3">{t('Xuất')}</th>
                <th className="px-4 py-3">{t('Ngày tạo')}</th>
                <th className="px-4 py-3">{t('Hành động')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-brand-navy">{row.ticketCode}</td>
                  <td className="px-4 py-2">{row.staffName}</td>
                  <td className="px-4 py-2">{row.factoryName}</td>
                  <td className="px-4 py-2">{row.lineName}</td>
                  <td className="px-4 py-2">{row.customerName}</td>
                  <td className="px-4 py-2">{row.inspectionStage}</td>
                  <td className="px-4 py-2">{row.inspectedQty}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        row.status === 'DRAFT'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {t(STATUS_LABEL[row.status] || row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        row.exported ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {row.exported ? t('Có') : t('Không')}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN') : ''}
                  </td>
                  <td className="px-4 py-2">
                    <TicketRowActions
                      ticket={row}
                      busy={busyId === row.id}
                      isAdmin={isAdmin}
                      onView={() => setViewingTicketId(row.id)}
                      onEdit={() => onEdit(row.id)}
                      onExportPdf={() => handleExportPdf(row)}
                      onExportExcel={() => handleExportExcel(row)}
                      onExportPdfExcelStyle={() => handleExportPdfExcelStyle(row)}
                      onUnexport={() => handleUnexport(row)}
                      onDelete={() => handleDelete(row.id)}
                    />
                  </td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-slate-400">
                    {t('Chưa có phiếu nào')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center py-4">
          {hasNext && (
            <button
              type="button"
              onClick={() => fetchPage(nextCursor)}
              disabled={loading}
              className="bg-white border border-slate-300 rounded-md px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? t('Đang tải...') : t('Tải thêm')}
            </button>
          )}
          {!hasNext && loading && <span className="text-sm text-slate-300">{t('Đang tải...')}</span>}
        </div>
      </div>

      {viewingTicketId && (
        <TicketDetailModal
          ticketId={viewingTicketId}
          onClose={() => setViewingTicketId(null)}
        />
      )}

      {qcChecklistTicket && (
        <QcChecklistModal
          exportLabel={qcChecklistMode === 'excel' ? 'Excel' : 'PDF'}
          ticket={qcChecklistTicket}
          onConfirm={handleConfirmQcChecklist}
          onCancel={() => setQcChecklistTicket(null)}
        />
      )}

      <ExportProgressModal message={pdfProgress || excelProgress} />
    </div>
  )
}
