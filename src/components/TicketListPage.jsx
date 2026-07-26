import { useEffect, useState } from 'react'
import { listQaTickets, deleteQaTicket } from '../api/qaTickets'
import { getFactories } from '../api/master'
import { exportTicketPdf } from '../utils/pdfExport'
import TicketRowActions from './TicketRowActions'
import TicketDetailModal from './TicketDetailModal'

const STATUS_LABEL = { DRAFT: 'Nháp', SUBMITTED: 'Đã nộp' }

export default function TicketListPage({ onEdit }) {
  const [items, setItems] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [factoryOptions, setFactoryOptions] = useState([])
  const [filters, setFilters] = useState({ factoryId: '', status: '' })
  const [busyId, setBusyId] = useState(null)
  const [viewingTicketId, setViewingTicketId] = useState(null)
  const [pdfProgress, setPdfProgress] = useState('')

  useEffect(() => {
    getFactories()
      .then((list) => setFactoryOptions(list.map((f) => ({ value: f.id, label: f.name }))))
      .catch(() => {})
  }, [])

  async function fetchPage(cursor) {
    setLoading(true)
    setError('')
    try {
      const query = {
        factoryId: filters.factoryId || undefined,
        status: filters.status || undefined,
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

  async function handleExportPdf(ticket) {
    setBusyId(ticket.id)
    setPdfProgress('Đang chuẩn bị...')
    setError('')
    try {
      await exportTicketPdf(ticket.id, { onProgress: setPdfProgress })
    } catch (err) {
      setError(err.message || 'Xuất PDF thất bại')
    } finally {
      setBusyId(null)
      setPdfProgress('')
    }
  }

  return (
    <div className="min-h-screen py-6 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto">

        <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
          <h1 className="text-lg font-bold text-slate-800 mb-4">Danh sách phiếu QA</h1>

          <div className="flex flex-wrap gap-3">
            <select
              className="border border-slate-300 rounded-md px-3 py-2 text-sm"
              value={filters.factoryId}
              onChange={(e) => setFilters((f) => ({ ...f, factoryId: e.target.value }))}
            >
              <option value="">Tất cả nhà máy</option>
              {factoryOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              className="border border-slate-300 rounded-md px-3 py-2 text-sm"
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="DRAFT">Nháp</option>
              <option value="SUBMITTED">Đã nộp</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-brand-red text-brand-red text-sm rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        {pdfProgress && (
          <div className="bg-sky-50 border border-sky-200 text-sky-700 text-sm rounded-md p-3 mb-4">
            {pdfProgress}
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
                  <td className="px-4 py-2 font-medium text-brand-red">{t.ticketCode}</td>
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
                  <td className="px-4 py-2">{t.exported ? 'Có' : 'Không'}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {t.createdAt ? new Date(t.createdAt).toLocaleString('vi-VN') : ''}
                  </td>
                  <td className="px-4 py-2">
                    <TicketRowActions
                      ticket={t}
                      busy={busyId === t.id}
                      onView={() => setViewingTicketId(t.id)}
                      onEdit={() => onEdit(t.id)}
                      onExportPdf={() => handleExportPdf(t)}
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
              className="border border-slate-300 rounded-md px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? 'Đang tải...' : 'Tải thêm'}
            </button>
          )}
          {!hasNext && loading && <span className="text-sm text-slate-400">Đang tải...</span>}
        </div>
      </div>

      {viewingTicketId && (
        <TicketDetailModal
          ticketId={viewingTicketId}
          onClose={() => setViewingTicketId(null)}
        />
      )}
    </div>
  )
}
