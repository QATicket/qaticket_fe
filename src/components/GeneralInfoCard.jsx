import { useEffect, useState } from 'react'
import SearchableSelect from './SearchableSelect'
import NumberStepper from './NumberStepper'
import { searchPurchaseOrders } from '../api/master'

const STAGE_OPTIONS = [
  { value: 'INLINE', label: 'Inline' },
  { value: 'ENDLINE', label: 'Endline' },
  { value: 'FINAL', label: 'Final' },
  { value: 'INPUT', label: 'Input' },
]

export default function GeneralInfoCard({
  form,
  onChange,
  errors,
  factoryOptions,
  lineOptions,
  groupOptions,
  customerOptions,
  garmentTypeOptions,
}) {
  const [poOptions, setPoOptions] = useState([])
  const [poQuery, setPoQuery] = useState(form.poLabel || '')

  useEffect(() => {
    const handle = setTimeout(() => {
      searchPurchaseOrders(poQuery)
        .then((list) => setPoOptions(list.map((po) => ({ value: po.id, label: po.poCode }))))
        .catch(() => setPoOptions([]))
    }, 300)
    return () => clearTimeout(handle)
  }, [poQuery])

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h1 className="text-lg font-bold text-slate-800 mb-4 tracking-wide">
        GARMENT QA CHECKING
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <Field label="QA Name (Nhân viên QA)">
          <div className="w-full border border-slate-200 bg-slate-100 text-slate-600 rounded-md px-3 py-2 text-sm">
            {form.staffName || '—'}
          </div>
        </Field>

        <Field label="Factory (Nhà máy)" error={errors.factoryId}>
          <SearchableSelect
            options={factoryOptions}
            value={form.factoryId}
            onChange={(v) =>
              onChange({ factoryId: v, lineId: null, groupId: null })
            }
            placeholder="Chọn nhà máy"
            error={errors.factoryId}
          />
        </Field>

        <Field label="Line (Chuyền may)" error={errors.lineId}>
          <SearchableSelect
            options={lineOptions}
            value={form.lineId}
            onChange={(v) => onChange({ lineId: v, groupId: null })}
            placeholder="Chọn chuyền"
            disabled={!form.factoryId}
            error={errors.lineId}
          />
        </Field>

        <Field label="Cụm / Group">
          <SearchableSelect
            options={groupOptions}
            value={form.groupId}
            onChange={(v) => onChange({ groupId: v })}
            placeholder="Chọn cụm (optional)"
            disabled={!form.lineId}
          />
        </Field>

        <Field label="Inspection Stage" error={errors.inspectionStage}>
          <select
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
            value={form.inspectionStage}
            onChange={(e) => onChange({ inspectionStage: e.target.value })}
          >
            {STAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label="PO">
          <SearchableSelect
            options={poOptions}
            value={form.poId}
            onChange={(v) => onChange({ poId: v })}
            placeholder="Tìm PO (gõ để tìm)"
            allowFreeText
            freeTextValue={poQuery}
            onFreeTextChange={(text) => {
              setPoQuery(text)
              onChange({ poId: null })
            }}
          />
        </Field>

        <Field label="Inspected Qty" error={errors.inspectedQty}>
          <NumberStepper
            value={form.inspectedQty}
            onChange={(v) => onChange({ inspectedQty: v })}
            error={errors.inspectedQty}
          />
        </Field>

        <Field label="Customer (Khách hàng)" error={errors.customerId}>
          <SearchableSelect
            options={customerOptions}
            value={form.customerId}
            onChange={(v) => onChange({ customerId: v })}
            placeholder="Chọn khách hàng"
            error={errors.customerId}
          />
        </Field>

        <Field label="Garment (Loại sản phẩm)" error={errors.garmentTypeId}>
          <SearchableSelect
            options={garmentTypeOptions}
            value={form.garmentTypeId}
            onChange={(v) => onChange({ garmentTypeId: v })}
            placeholder="Chọn loại sản phẩm"
            error={errors.garmentTypeId}
          />
        </Field>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  )
}
