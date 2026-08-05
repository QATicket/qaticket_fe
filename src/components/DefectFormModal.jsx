import { useState } from 'react'
import { createDefect, updateDefect } from '../api/admin'
import { useLanguage } from '../i18n/LanguageContext'

export default function DefectFormModal({ defect, onClose, onSaved }) {
  const { t } = useLanguage()
  const isEdit = !!defect
  const [code, setCode] = useState(defect?.code || '')
  const [nameEn, setNameEn] = useState(defect?.nameEn || '')
  const [nameVi, setNameVi] = useState(defect?.nameVi || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    setError('')
    if (!nameVi.trim()) {
      setError(t('Vui lòng nhập tên lỗi (tiếng Việt)'))
      return
    }

    const body = {
      code: code.trim() || undefined,
      nameEn: nameEn.trim() || undefined,
      nameVi: nameVi.trim(),
    }

    setSaving(true)
    try {
      if (isEdit) {
        await updateDefect(defect.id, body)
      } else {
        await createDefect(body)
      }
      onSaved()
    } catch (err) {
      setError(err.message || t('Lưu nhóm lỗi thất bại'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/40 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm my-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800">
            {isEdit ? t('Sửa nhóm lỗi') : t('Thêm nhóm lỗi')}
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
            <Field label={t('Mã lỗi')}>
              <input
                type="text"
                maxLength={50}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </Field>
            <Field label={t('Tên lỗi (Tiếng Việt)')}>
              <input
                type="text"
                maxLength={150}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                value={nameVi}
                onChange={(e) => setNameVi(e.target.value)}
              />
            </Field>
            <Field label={t('Tên lỗi (Tiếng Anh)')}>
              <input
                type="text"
                maxLength={150}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
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
