import SearchableSelect from './SearchableSelect'
import LocationItem from './LocationItem'
import { emptyLocation } from '../utils/id'
import { useLanguage } from '../i18n/LanguageContext'

export default function DefectItem({
  defect,
  index,
  defectItemOptions,
  garmentLocationOptions,
  onChange,
  onRemove,
  error,
}) {
  const { t } = useLanguage()
  function handleDefectChange(id) {
    const item = defectItemOptions.find((o) => String(o.value) === String(id))
    const allowMinor = item?.allowMinor ?? false
    const allowMajor = item?.allowMajor ?? false
    let severity = null
    if (allowMinor && !allowMajor) severity = 'MINOR'
    else if (allowMajor && !allowMinor) severity = 'MAJOR'
    onChange({ defectId: id, allowMinor, allowMajor, severity })
  }

  function updateLocation(localId, patch) {
    onChange({
      locations: defect.locations.map((loc) =>
        loc._localId === localId ? { ...loc, ...patch } : loc,
      ),
    })
  }

  function removeLocation(localId) {
    onChange({ locations: defect.locations.filter((loc) => loc._localId !== localId) })
  }

  function addLocation() {
    onChange({ locations: [...defect.locations, emptyLocation()] })
  }

  return (
    <div className="bg-slate-50 border-l-4 border-brand-navy rounded-md p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-slate-700 text-sm">DEFECT #{index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-sm text-slate-400 hover:text-brand-red underline"
        >
          {t('Xoá defect')}
        </button>
      </div>

      <div className="mb-3">
        <label className="block text-xs font-medium text-slate-500 mb-1">{t('1. DEFECT (Lỗi)')}</label>
        <SearchableSelect
          options={defectItemOptions}
          value={defect.defectId}
          onChange={handleDefectChange}
          placeholder={t('Tìm và chọn lỗi')}
          error={error?.defectId}
        />
      </div>

      {defect.defectId && (defect.allowMinor || defect.allowMajor) && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-500 mb-1">
            {t('Mức độ lỗi (Severity)')}
          </label>
          {defect.allowMinor && defect.allowMajor ? (
            <select
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy ${
                error?.severity ? 'border-brand-red' : 'border-slate-300'
              }`}
              value={defect.severity || ''}
              onChange={(e) => onChange({ severity: e.target.value || null })}
            >
              <option value="">{t('-- Chọn mức độ --')}</option>
              <option value="MAJOR">{t('Major (Lỗi nặng)')}</option>
              <option value="MINOR">{t('Minor (Lỗi nhẹ)')}</option>
            </select>
          ) : (
            <div className="w-full border border-slate-200 bg-slate-100 text-slate-600 rounded-md px-3 py-2 text-sm">
              {defect.severity === 'MAJOR' ? t('Major (Lỗi nặng)') : t('Minor (Lỗi nhẹ)')}
            </div>
          )}
          {error?.severity && <p className="text-xs text-brand-red mt-1">{error.severity}</p>}
        </div>
      )}

      <div className="mb-3">
        <label className="block text-xs font-medium text-slate-500 mb-1">Note</label>
        <textarea
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
          rows={2}
          placeholder={t('Ghi chú lỗi (optional)')}
          value={defect.note}
          onChange={(e) => onChange({ note: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        {defect.locations.map((loc, locIndex) => (
          <LocationItem
            key={loc._localId}
            location={loc}
            index={locIndex}
            garmentLocationOptions={garmentLocationOptions}
            onChange={(patch) => updateLocation(loc._localId, patch)}
            onRemove={() => removeLocation(loc._localId)}
            error={error?.locations?.[loc._localId]}
          />
        ))}
      </div>
      {error?.locationsGeneral && (
        <p className="text-xs text-brand-red mt-2">{error.locationsGeneral}</p>
      )}

      <button
        type="button"
        onClick={addLocation}
        className="mt-3 w-full border-2 border-dashed border-sky-300 text-sky-600 text-sm font-medium rounded-md py-2 hover:bg-sky-50"
      >
        {t('+ Thêm vị trí (Add Location)')}
      </button>
    </div>
  )
}
