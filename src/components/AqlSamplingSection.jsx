import { useEffect, useState } from 'react'
import { lookupAql } from '../api/aql'
import { useLanguage } from '../i18n/LanguageContext'

const AQL_LEVEL_OPTIONS = ['1.5', '2.5']

// Actual Major/Minor Defects không phải nhập tay - lấy từ tổng quantity các defect
// đã khai trong phiếu, gộp theo severity (MAJOR/MINOR) đã chọn ở từng defect.
function countActualDefects(defects) {
  let major = 0
  let minor = 0
  ;(defects || []).forEach((d) => {
    const qty = (d.locations || []).reduce((sum, loc) => sum + (Number(loc.quantity) || 0), 0)
    if (d.severity === 'MAJOR') major += qty
    else if (d.severity === 'MINOR') minor += qty
  })
  return { major, minor }
}

export default function AqlSamplingSection({ form, onChange, errors }) {
  const { t } = useLanguage()
  const [preview, setPreview] = useState(null)
  const [lookupError, setLookupError] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)

  useEffect(() => {
    const { major, minor } = countActualDefects(form.defects)
    if (form.actualMajorDefects !== major || form.actualMinorDefects !== minor) {
      onChange({ actualMajorDefects: major, actualMinorDefects: minor })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.defects])

  useEffect(() => {
    if (!form.aqlLevel || !form.qtySize || form.qtySize < 1) {
      setPreview(null)
      setLookupError('')
      if (form.samplingSize != null) onChange({ samplingSize: null })
      return
    }
    setLookupLoading(true)
    setLookupError('')
    const handle = setTimeout(() => {
      lookupAql(form.aqlLevel, form.qtySize)
        .then((data) => {
          setPreview(data)
          // Inspected Qty (FINAL) phải khớp Sampling size tra được từ bảng AQL, không cho sửa tay.
          onChange({ samplingSize: data.samplingSize, inspectedQty: data.samplingSize })
        })
        .catch((err) => {
          setPreview(null)
          setLookupError(err.message || t('Không tra được sampling plan'))
          onChange({ samplingSize: null })
        })
        .finally(() => setLookupLoading(false))
    }, 400)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.aqlLevel, form.qtySize])

  return (
    <div className="mt-4 pt-4 border-t border-slate-200">
      <label className="block text-xs font-medium text-slate-500 mb-2">AQL Sampling Plan</label>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label="Order Qty" error={errors.qtySize}>
          <input
            type="number"
            min={1}
            className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy ${
              errors.qtySize ? 'border-brand-red' : 'border-slate-300'
            }`}
            value={form.qtySize ?? ''}
            onChange={(e) => {
              const v = e.target.value
              onChange({ qtySize: v === '' ? null : Number(v) })
            }}
            placeholder={t('Nhập order qty')}
          />
        </Field>

        <Field label="AQL Level" error={errors.aqlLevel}>
          <select
            className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy ${
              errors.aqlLevel ? 'border-brand-red' : 'border-slate-300'
            }`}
            value={form.aqlLevel || '1.5'}
            onChange={(e) => onChange({ aqlLevel: e.target.value })}
          >
            {AQL_LEVEL_OPTIONS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Actual Major Defects">
          <div className="w-full border border-slate-200 bg-slate-100 text-slate-600 rounded-md px-3 py-2 text-sm">
            {form.actualMajorDefects ?? 0}
          </div>
        </Field>

        <Field label="Actual Minor Defects">
          <div className="w-full border border-slate-200 bg-slate-100 text-slate-600 rounded-md px-3 py-2 text-sm">
            {form.actualMinorDefects ?? 0}
          </div>
        </Field>
      </div>
      <p className="text-[11px] text-slate-400 mt-1">
        {t(
          'Actual Major/Minor Defects tự tính từ tổng số lượng các defect đã khai báo bên dưới theo mức độ (Major/Minor).',
        )}
      </p>

      {lookupLoading && <p className="text-xs text-slate-400 mt-2">{t('Đang tra sampling plan...')}</p>}
      {lookupError && <p className="text-xs text-brand-red mt-2">{lookupError}</p>}

      {preview && !lookupLoading && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 rounded-md p-3 text-sm">
          <PreviewItem label="Sampling size" value={preview.samplingSize} />
          <PreviewItem label="Major Accept" value={preview.majorAccept} />
          <PreviewItem label="Major Reject" value={preview.majorReject} />
          <PreviewItem label="Minor Accept" value={preview.minorAccept} />
          <PreviewItem label="Minor Reject" value={preview.minorReject} />
        </div>
      )}
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-brand-red mt-1">{error}</p>}
    </div>
  )
}

function PreviewItem({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="font-semibold text-slate-700">{value ?? '—'}</p>
    </div>
  )
}
