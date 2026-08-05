import { useState } from 'react'
import { createGarmentLocation, updateGarmentLocation } from '../api/admin'
import { useLanguage } from '../i18n/LanguageContext'

export default function GarmentLocationFormModal({
  location,
  garmentTypeOptions,
  defaultGarmentTypeId,
  onClose,
  onSaved,
}) {
  const { t } = useLanguage()
  const isEdit = !!location
  const [garmentTypeId, setGarmentTypeId] = useState(
    location?.garmentTypeId ?? defaultGarmentTypeId ?? garmentTypeOptions[0]?.id ?? '',
  )
  const [name, setName] = useState(location?.name || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    setError('')
    if (!garmentTypeId) {
      setError(t('Vui lòng chọn loại sản phẩm'))
      return
    }
    if (!name.trim()) {
      setError(t('Vui lòng nhập tên vị trí'))
      return
    }

    const body = { garmentTypeId: Number(garmentTypeId), name: name.trim() }

    setSaving(true)
    try {
      if (isEdit) {
        await updateGarmentLocation(location.id, body)
      } else {
        await createGarmentLocation(body)
      }
      onSaved()
    } catch (err) {
      setError(err.message || t('Lưu vị trí thất bại'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/40 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm my-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800">
            {isEdit ? t('Sửa vị trí') : t('Thêm vị trí')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-brand-red underline"
          >
            {t('Đóng')}
          </button>
        </div>

        <div className="px-5 py-4">
          <div onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} className="space-y-3">
            <Field label={t('Loại sản phẩm')}>
              <select
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                value={garmentTypeId}
                onChange={(e) => setGarmentTypeId(e.target.value)}
              >
                {garmentTypeOptions.length === 0 && <option value="">{t('Chọn...')}</option>}
                {garmentTypeOptions.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('Tên vị trí')}>
              <input
                type="text"
                maxLength={100}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            {error && <p className="text-sm text-brand-red">{error}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-brand-red underline"
          >
            {t('Huỷ')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-brand-navy text-white text-sm font-medium rounded-md px-4 py-2 hover:opacity-90 disabled:opacity-60"
          >
            {saving ? t('Đang lưu...') : t('Lưu')}
          </button>
        </div>
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
