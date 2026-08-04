import { useEffect, useState } from 'react'
import { getQaTicket } from '../api/qaTickets'
import InspectionResultBadge from './InspectionResultBadge'
import ImageLightbox from './ImageLightbox'
import { useLanguage } from '../i18n/LanguageContext'

const STATUS_LABEL = { DRAFT: 'Nháp', SUBMITTED: 'Đã nộp' }

const SPEC_IMAGE_TYPES = ['APPROVED_SAMPLE', 'SIZE_SPEC', 'PACKING', 'HANGTAG_LABEL']
const SPEC_IMAGE_LABELS = {
  APPROVED_SAMPLE: 'Mẫu duyệt',
  SIZE_SPEC: 'Bảng thông số kích thước',
  PACKING: 'Quy cách đóng thùng/Bao bì',
  HANGTAG_LABEL: 'Thẻ treo & Nhãn hiệu',
  OTHER: 'Khác',
}

function groupSpecImagesByType(specImages) {
  const buckets = { APPROVED_SAMPLE: [], SIZE_SPEC: [], PACKING: [], HANGTAG_LABEL: [], OTHER: [] }
  ;(specImages || []).forEach((img) => {
    const bucket = SPEC_IMAGE_TYPES.includes(img.type) ? img.type : 'OTHER'
    buckets[bucket].push(img)
  })
  return buckets
}

export default function TicketDetailModal({ ticketId, onClose }) {
  const { t } = useLanguage()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError('')
    getQaTicket(ticketId)
      .then(setTicket)
      .catch((err) => setError(err.message || t('Không tải được chi tiết phiếu')))
      .finally(() => setLoading(false))
  }, [ticketId])

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/40 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800">
            {t('Chi tiết phiếu {{code}}', { code: ticket ? ticket.ticketCode : '' })}
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-slate-500 hover:text-brand-red underline"
            >
              {t('Đóng')}
            </button>
          </div>
        </div>

        <div className="px-5 py-4 max-h-[75vh] overflow-y-auto">
          {loading && <p className="text-sm text-slate-400 text-center py-8">{t('Đang tải...')}</p>}
          {error && <p className="text-sm text-brand-red mb-3">{error}</p>}

          {ticket && !loading && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-5">
                <InfoRow label={t('Nhân viên QA')} value={ticket.staff?.name} />
                <InfoRow label={t('Trạng thái')} value={t(STATUS_LABEL[ticket.status] || ticket.status)} />
                <InfoRow label={t('Nhà máy')} value={ticket.factory?.name} />
                <InfoRow label={t('Chuyền')} value={ticket.line?.name} />
                <InfoRow label={t('Cụm / Group')} value={ticket.group?.name || '—'} />
                <InfoRow label="PO" value={ticket.poNumber || '—'} />
                <InfoRow label={t('Style (Mã hàng)')} value={ticket.style || '—'} />
                <InfoRow label={t('Khách hàng')} value={ticket.customerName} />
                <InfoRow label={t('Loại sản phẩm')} value={ticket.garmentType?.name} />
                <InfoRow label={t('Khâu kiểm tra')} value={ticket.inspectionStage} />
                <InfoRow label={t('Sản lượng kiểm tra')} value={ticket.inspectedQty} />
                <InfoRow label={t('Đã xuất')} value={ticket.exported ? t('Có') : t('Không')} />
                <InfoRow
                  label={t('Ngày tạo')}
                  value={ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('vi-VN') : '—'}
                />
                {(ticket.inspectionStage === 'FINAL' || ticket.inspectionStage === 'PREFINAL') && (
                  <>
                    <InfoRow label="AQL Level" value={ticket.aqlLevel ?? '—'} />
                    <InfoRow label="Order qty" value={ticket.qtySize ?? '—'} />
                    <InfoRow label="Sampling size" value={ticket.samplingSize ?? '—'} />
                    <InfoRow label="Actual Major Defects" value={ticket.actualMajorDefects ?? '—'} />
                    <InfoRow label="Actual Minor Defects" value={ticket.actualMinorDefects ?? '—'} />
                    <InfoRow
                      label={t('Kết quả AQL')}
                      value={<InspectionResultBadge value={ticket.inspectionResult} />}
                    />
                  </>
                )}
              </div>

              {ticket.measurementImages?.length > 0 && (
                <div className="mb-5">
                  <h3 className="font-semibold text-slate-700 text-sm mb-2">{t('Hình ảnh thông số')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {ticket.measurementImages.map((img) => (
                      <button key={img.id} type="button" onClick={() => setPreviewUrl(img.imageUrl)}>
                        <img
                          src={img.imageUrl}
                          alt=""
                          className="w-14 h-14 object-cover rounded border border-slate-200"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {ticket.specImages?.length > 0 && (
                <div className="mb-5">
                  <h3 className="font-semibold text-slate-700 text-sm mb-2">{t('Hình ảnh Spec')}</h3>
                  <div className="space-y-3">
                    {Object.entries(groupSpecImagesByType(ticket.specImages)).map(
                      ([type, imgs]) =>
                        imgs.length > 0 && (
                          <div key={type}>
                            <p className="text-xs font-medium text-slate-500 mb-1">
                              {t(SPEC_IMAGE_LABELS[type])}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {imgs.map((img) => (
                                <button
                                  key={img.id}
                                  type="button"
                                  onClick={() => setPreviewUrl(img.imageUrl)}
                                >
                                  <img
                                    src={img.imageUrl}
                                    alt=""
                                    className="w-14 h-14 object-cover rounded border border-slate-200"
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        ),
                    )}
                  </div>
                </div>
              )}

              <h3 className="font-semibold text-slate-700 text-sm mb-2">
                {t('Defects ({{count}})', { count: ticket.defects?.length || 0 })}
              </h3>
              <div className="space-y-3">
                {(ticket.defects || []).map((defect) => (
                  <div
                    key={defect.id}
                    className="bg-slate-50 border-l-4 border-brand-navy rounded-md p-3"
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
                      <p className="text-xs text-slate-500 mt-1">{t('Ghi chú:')} {defect.note}</p>
                    )}
                    <div className="mt-2 space-y-2">
                      {(defect.locations || []).map((loc) => (
                        <div
                          key={loc.id}
                          className="bg-white border border-sky-200 rounded-md p-2 text-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span>{loc.locationText}</span>
                            <span className="text-slate-500">{t('SL:')} {loc.quantity}</span>
                          </div>
                          {loc.images?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {loc.images.map((img) => (
                                <button
                                  key={img.id}
                                  type="button"
                                  onClick={() => setPreviewUrl(img.imageUrl)}
                                >
                                  <img
                                    src={img.imageUrl}
                                    alt=""
                                    className="w-14 h-14 object-cover rounded border border-slate-200"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(!ticket.defects || ticket.defects.length === 0) && (
                  <p className="text-sm text-slate-400">{t('Không có defect nào')}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ImageLightbox url={previewUrl} onClose={() => setPreviewUrl(null)} />
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
