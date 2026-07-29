import { useEffect, useState } from 'react'
import { listQaTickets, deleteQaTicket, exportQaTicket, unexportQaTicket } from '../api/qaTickets'
import { getFactories, getLines, getStaff } from '../api/master'
import { exportTicketPdf } from '../utils/pdfExport'
import { exportTicketsExcel } from '../utils/excelExport'
import TicketRowActions from './TicketRowActions'
import TicketDetailModal from './TicketDetailModal'
import ExportProgressModal from './ExportProgressModal'
import QcChecklistModal from './QcChecklistModal'

const STATUS_LABEL = { DRAFT: 'Nháp', SUBMITTED: 'Đã nộp' }
const FILTER_INPUT_CLASS =
  'w-full bg-white text-slate-800 border border-slate-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy'

export default function TicketListPage({ userInfo, onEdit }) {
  const isAdmin = userInfo?.role === 'ADMIN'
  const [items, setItems] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [factoryOptions, setFactoryOptions] = useState([])
  const [lineOptions, setLineOptions] = useState([])
  const [staffOptions, setStaffOptions] = useState([])
  const [filters, setFilters] = useState({
    factoryId: '',
    lineId: '',
    staffId: '',
    status: '',
    exported: '',
    dateFrom: '',
    dateTo: '',
  })
  const [busyId, setBusyId] = useState(null)
  const [viewingTicketId, setViewingTicketId] = useState(null)
  const [pdfProgress, setPdfProgress] = useState('')
  const [excelProgress, setExcelProgress] = useState('')
  const [qcChecklistTicket, setQcChecklistTicket] = useState(null)

  useEffect(() => {
    getFactories()
      .then((list) => setFactoryOptions(list.map((f) => ({ value: f.id, label: f.name }))))
      .catch(() => {})
    // Nhân viên thường chỉ xem được phiếu của mình (BE tự scope), nên không
    // cần filter theo nhân viên - chỉ admin mới thấy/lọc được phiếu của tất cả.
    if (isAdmin) {
      getStaff()
        .then((list) => setStaffOptions(list.map((s) => ({ value: s.id, label: s.fullName }))))
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Chuyền phụ thuộc nhà máy - đổi nhà máy thì tải lại danh sách chuyền và
  // reset lineId (chuyền cũ có thể không thuộc nhà máy mới chọn).
  useEffect(() => {
    getLines(filters.factoryId || undefined)
      .then((list) => setLineOptions(list.map((l) => ({ value: l.id, label: l.name }))))
      .catch(() => {})
  }, [filters.factoryId])

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value, ...(key === 'factoryId' ? { lineId: '' } : {}) }))
  }

  function resetFilters() {
    setFilters({
      factoryId: '',
      lineId: '',
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
        lineId: filters.lineId || undefined,
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
      setError(err.message || 'Không tải được danh sách phiếu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPage(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  async function handleDelete(id) {
    if (!window.confirm('Xoá phiếu này? Chỉ xoá được phiếu ở trạng thái Nháp.')) return
    setBusyId(id)
    try {
      await deleteQaTicket(id)
      setItems((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      setError(err.message || 'Xoá phiếu thất bại')
    } finally {
      setBusyId(null)
    }
  }

  function markExportedLocally(id) {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, exported: true } : t)))
  }

  // Đánh dấu phiếu đã xuất ở BE ngay sau khi file được tạo thành công - phiếu
  // đã xuất thì không cho xuất lại nữa (trừ admin, xem isAdmin ở trên).
  async function markExported(ticket) {
    try {
      await exportQaTicket(ticket.id)
      markExportedLocally(ticket.id)
    } catch (err) {
      setError(err.message || 'Cập nhật trạng thái đã xuất thất bại')
    }
  }

  async function handleExportPdf(ticket) {
    if (ticket.exported && !isAdmin) {
      setError('Phiếu này đã được xuất, không thể xuất lại')
      return
    }
    setBusyId(ticket.id)
    setPdfProgress('Đang chuẩn bị...')
    setError('')
    try {
      await exportTicketPdf(ticket.id, { onProgress: setPdfProgress })
      await markExported(ticket)
    } catch (err) {
      setError(err.message || 'Xuất PDF thất bại')
    } finally {
      setBusyId(null)
      setPdfProgress('')
    }
  }

  function handleExportExcel(ticket) {
    if (ticket.exported && !isAdmin) {
      setError('Phiếu này đã được xuất, không thể xuất lại')
      return
    }
    setError('')
    setQcChecklistTicket(ticket)
  }

  async function handleConfirmQcChecklist(qcChecklistValues) {
    const ticket = qcChecklistTicket
    setQcChecklistTicket(null)
    setBusyId(ticket.id)
    setExcelProgress('Đang chuẩn bị...')
    setError('')
    try {
      const { overflow, imageOverflow } = await exportTicketsExcel(ticket.id, {
        onProgress: setExcelProgress,
        qcChecklistValues,
      })
      await markExported(ticket)
      const messages = []
      if (overflow.length > 0) {
        messages.push(
          `${overflow.length} loại lỗi bị bỏ qua do vượt quá số dòng cho phép trong bảng lỗi`
        )
      }
      if (imageOverflow?.major.length > 0) {
        messages.push(`${imageOverflow.major.length} ảnh Major bị bỏ qua do vượt quá 16 khung ảnh`)
      }
      if (imageOverflow?.minor.length > 0) {
        messages.push(`${imageOverflow.minor.length} ảnh Minor bị bỏ qua do vượt quá 16 khung ảnh`)
      }
      if (messages.length > 0) {
        setError(`Đã xuất file nhưng ${messages.join('; ')}`)
      }
    } catch (err) {
      setError(err.message || 'Xuất Excel thất bại')
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
      setItems((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, exported: false } : t)))
    } catch (err) {
      setError(err.message || 'Mở khoá xuất lại thất bại')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen py-6 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto">

        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-slate-800">Danh sách phiếu QA</h1>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-brand-navy underline"
            >
              Xoá bộ lọc
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nhà máy</label>
              <select
                className={FILTER_INPUT_CLASS}
                value={filters.factoryId}
                onChange={(e) => updateFilter('factoryId', e.target.value)}
              >
                <option value="">Tất cả</option>
                {factoryOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Chuyền</label>
              <select
                className={FILTER_INPUT_CLASS}
                value={filters.lineId}
                onChange={(e) => updateFilter('lineId', e.target.value)}
              >
                <option value="">Tất cả</option>
                {lineOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {isAdmin && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nhân viên</label>
                <select
                  className={FILTER_INPUT_CLASS}
                  value={filters.staffId}
                  onChange={(e) => updateFilter('staffId', e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {staffOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Trạng thái</label>
              <select
                className={FILTER_INPUT_CLASS}
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="DRAFT">Nháp</option>
                <option value="SUBMITTED">Đã nộp</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Đã xuất</label>
              <select
                className={FILTER_INPUT_CLASS}
                value={filters.exported}
                onChange={(e) => updateFilter('exported', e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="true">Đã xuất</option>
                <option value="false">Chưa xuất</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1 lg:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Từ ngày - Đến ngày</label>
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
                <th className="px-4 py-3">Mã phiếu</th>
                <th className="px-4 py-3">Nhân viên</th>
                <th className="px-4 py-3">Nhà máy</th>
                <th className="px-4 py-3">Chuyền</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Khâu KT</th>
                <th className="px-4 py-3">SL</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Xuất</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-brand-navy">{t.ticketCode}</td>
                  <td className="px-4 py-2">{t.staffName}</td>
                  <td className="px-4 py-2">{t.factoryName}</td>
                  <td className="px-4 py-2">{t.lineName}</td>
                  <td className="px-4 py-2">{t.customerName}</td>
                  <td className="px-4 py-2">{t.inspectionStage}</td>
                  <td className="px-4 py-2">{t.inspectedQty}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        t.status === 'DRAFT'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {STATUS_LABEL[t.status] || t.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        t.exported ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {t.exported ? 'Có' : 'Không'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {t.createdAt ? new Date(t.createdAt).toLocaleString('vi-VN') : ''}
                  </td>
                  <td className="px-4 py-2">
                    <TicketRowActions
                      ticket={t}
                      busy={busyId === t.id}
                      isAdmin={isAdmin}
                      onView={() => setViewingTicketId(t.id)}
                      onEdit={() => onEdit(t.id)}
                      onExportPdf={() => handleExportPdf(t)}
                      onExportExcel={() => handleExportExcel(t)}
                      onUnexport={() => handleUnexport(t)}
                      onDelete={() => handleDelete(t.id)}
                    />
                  </td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                    Chưa có phiếu nào
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
              {loading ? 'Đang tải...' : 'Tải thêm'}
            </button>
          )}
          {!hasNext && loading && <span className="text-sm text-slate-300">Đang tải...</span>}
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
          onConfirm={handleConfirmQcChecklist}
          onCancel={() => setQcChecklistTicket(null)}
        />
      )}

      <ExportProgressModal message={pdfProgress || excelProgress} />
    </div>
  )
}
