import SearchableSelect from './SearchableSelect'
import LocationItem from './LocationItem'
import { emptyLocation } from '../utils/id'

export default function DefectItem({
  defect,
  index,
  defectOptions,
  garmentLocationOptions,
  onChange,
  onRemove,
  error,
}) {
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
    <div className="bg-slate-50 border-l-4 border-brand-red rounded-md p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-slate-700 text-sm">DEFECT #{index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-sm text-slate-400 hover:text-brand-red underline"
        >
          Xoá defect
        </button>
      </div>

      <div className="mb-3">
        <label className="block text-xs font-medium text-slate-500 mb-1">1. DEFECT (Lỗi)</label>
        <SearchableSelect
          options={defectOptions}
          value={defect.defectId}
          onChange={(v) => onChange({ defectId: v })}
          placeholder="Tìm và chọn lỗi"
          error={error?.defectId}
        />
      </div>

      <div className="mb-3">
        <label className="block text-xs font-medium text-slate-500 mb-1">Note</label>
        <textarea
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
          rows={2}
          placeholder="Ghi chú lỗi (optional)"
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
        + Thêm vị trí (Add Location)
      </button>
    </div>
  )
}
