import { useEffect, useState } from 'react'
import { getQaTicket } from '../api/qaTickets'
import { exportTicketPdf } from '../utils/pdfExport'

const STATUS_LABEL = { DRAFT: 'Nháp', SUBMITTED: 'Đã nộp' }

export default function TicketDetailModal({ ticketId, onClose }) {
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pdfProgress, setPdfProgress] = useState('')

  async function handleExportPdf() {
    setPdfProgress('Đang chuẩn bị...')
    setError('')
    try {
      await exportTicketPdf(ticketId, { onProgress: setPdfProgress })
    } catch (err) {
      setError(err.message || 'Xuất PDF thất bại')
    } finally {
      setPdfProgress('')
    }
  }

  useEffect(() => {
    setLoading(true)
    setError('')
    getQaTicket(ticketId)
      .then(setTicket)
      .catch((err) => setError(err.message || 'Không tải được chi tiết phiếu'))
      .finally(() => setLoading(false))
  }, [ticketId])

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/40 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800">
            Chi tiết phiếu {ticket ? ticket.ticketCode : ''}
          </h2>
          <div className="flex items-center gap-3">
            {ticket && !loading && (
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={!!pdfProgress}
                className="text-sm border border-brand-red text-brand-red rounded-md px-3 py-1.5 hover:bg-red-50 disabled:opacity-50"
              >
                {pdfProgress ? 'Đang xuất...' : '⭳ Xuất PDF'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-slate-500 hover:text-brand-red underline"
            >
              Đóng
            </button>
          </div>
        </div>

        <div className="px-5 py-4 max-h-[75vh] overflow-y-auto">
          {loading && <p className="text-sm text-slate-400 text-center py-8">Đang tải...</p>}
          {error && <p className="text-sm text-brand-red mb-3">{error}</p>}
          {pdfProgress && <p className="text-sm text-sky-600 mb-3">{pdfProgress}</p>}

          {ticket && !loading && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-5">
                <InfoRow label="Nhân viên QA" value={ticket.staff?.name} />
                <InfoRow label="Trạng thái" value={STATUS_LABEL[ticket.status] || ticket.status} />
                <InfoRow label="Nhà máy" value={ticket.factory?.name} />
                <InfoRow label="Chuyền" value={ticket.line?.name} />
                <InfoRow label="Cụm / Group" value={ticket.group?.name || '—'} />
                <InfoRow label="PO" value={ticket.purchaseOrder?.name || '—'} />
                <InfoRow label="Khách hàng" value={ticket.customer?.name} />
                <InfoRow label="Loại sản phẩm" value={ticket.garmentType?.name} />
                <InfoRow label="Khâu kiểm tra" value={ticket.inspectionStage} />
                <InfoRow label="Sản lượng kiểm tra" value={ticket.inspectedQty} />
                <InfoRow label="Đã xuất" value={ticket.exported ? 'Có' : 'Không'} />
                <InfoRow
                  label="Ngày tạo"
                  value={ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('vi-VN') : '—'}
                />
              </div>

              <h3 className="font-semibold text-slate-700 text-sm mb-2">
                Defects ({ticket.defects?.length || 0})
              </h3>
              <div className="space-y-3">
                {(ticket.defects || []).map((defect) => (
                  <div
                    key={defect.id}
                    className="bg-slate-50 border-l-4 border-brand-red rounded-md p-3"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {defect.defectItem?.name || defect.defect?.name}
                        </p>
                        {defect.defectItem?.name &&
                          defect.defect?.name &&
                          defect.defectItem.name !== defect.defect.name && (
                            <p className="text-xs text-slate-400">{defect.defect.name}</p>
                          )}
                      </div>
                      {defect.severity && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            defect.severity === 'MAJOR'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {defect.severity === 'MAJOR' ? 'Major' : 'Minor'}
                        </span>
                      )}
                    </div>
                    {defect.note && (
                      <p className="text-xs text-slate-500 mt-1">Ghi chú: {defect.note}</p>
                    )}
                    <div className="mt-2 space-y-2">
                      {(defect.locations || []).map((loc) => (
                        <div
                          key={loc.id}
                          className="bg-white border border-sky-200 rounded-md p-2 text-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span>{loc.locationText}</span>
                            <span className="text-slate-500">SL: {loc.quantity}</span>
                          </div>
                          {loc.images?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {loc.images.map((img) => (
                                <a key={img.id} href={img.imageUrl} target="_blank" rel="noreferrer">
                                  <img
                                    src={img.imageUrl}
                                    alt=""
                                    className="w-14 h-14 object-cover rounded border border-slate-200"
                                  />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(!ticket.defects || ticket.defects.length === 0) && (
                  <p className="text-sm text-slate-400">Không có defect nào</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1.5">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-700 text-right">{value ?? '—'}</span>
    </div>
  )
}
