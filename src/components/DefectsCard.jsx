import DefectItem from './DefectItem'
import { emptyDefect } from '../utils/id'
import { useLanguage } from '../i18n/LanguageContext'

export default function DefectsCard({
  defects,
  defectItemOptions,
  garmentLocationOptions,
  onChange,
  errors,
  specNote,
  qualityNote,
  onSpecNoteChange,
  onQualityNoteChange,
}) {
  const { t } = useLanguage()
  function updateDefect(localId, patch) {
    onChange(defects.map((d) => (d._localId === localId ? { ...d, ...patch } : d)))
  }

  function removeDefect(localId) {
    onChange(defects.filter((d) => d._localId !== localId))
  }

  function addDefect() {
    onChange([...defects, emptyDefect()])
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-navy text-white text-xs font-bold">
            {defects.length}
          </span>
          <h2 className="font-semibold text-slate-700">
            {t('Defects (Lỗi) — Chi Tiết Các Lỗi Phát Hiện Trên Chuyền')}
          </h2>
        </div>
        <button
          type="button"
          onClick={addDefect}
          className="border-2 border-brand-navy text-brand-navy text-sm font-semibold rounded-md px-4 py-1.5 hover:bg-slate-50"
        >
          + Add Defect
        </button>
      </div>

      {errors?.defectsGeneral && (
        <p className="text-sm text-brand-red mb-3">{errors.defectsGeneral}</p>
      )}

      <div className="space-y-4">
        {defects.map((defect, index) => (
          <DefectItem
            key={defect._localId}
            defect={defect}
            index={index}
            defectItemOptions={defectItemOptions}
            garmentLocationOptions={garmentLocationOptions}
            onChange={(patch) => updateDefect(defect._localId, patch)}
            onRemove={() => removeDefect(defect._localId)}
            error={errors?.defects?.[defect._localId]}
          />
        ))}
        {defects.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">
            {t('Chưa có defect nào. Bấm "+ Add Defect" để thêm.')}
          </p>
        )}
      </div>

      {defects.length > 0 && (
        <button
          type="button"
          onClick={addDefect}
          className="mt-4 w-full border-2 border-brand-navy text-brand-navy text-sm font-semibold rounded-md px-4 py-1.5 hover:bg-slate-50"
        >
          + Add Defect
        </button>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">{t('Lưu ý thông số')}</label>
          <textarea
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
            rows={2}
            value={specNote || ''}
            onChange={(e) => onSpecNoteChange(e.target.value)}
            placeholder={t('Nhập lưu ý thông số (nếu có)')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">{t('Lưu ý chất lượng')}</label>
          <textarea
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
            rows={2}
            value={qualityNote || ''}
            onChange={(e) => onQualityNoteChange(e.target.value)}
            placeholder={t('Nhập lưu ý chất lượng (nếu có)')}
          />
        </div>
      </div>
    </div>
  )
}
