import DefectItem from './DefectItem'
import { emptyDefect } from '../utils/id'

export default function DefectsCard({
  defects,
  defectOptions,
  garmentLocationOptions,
  onChange,
  errors,
}) {
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
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-red text-white text-xs font-bold">
            {defects.length}
          </span>
          <h2 className="font-semibold text-slate-700">
            Defects (Lỗi) — Chi Tiết Các Lỗi Phát Hiện Trên Chuyền
          </h2>
        </div>
        <button
          type="button"
          onClick={addDefect}
          className="border-2 border-brand-red text-brand-red text-sm font-semibold rounded-md px-4 py-1.5 hover:bg-red-50"
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
            defectOptions={defectOptions}
            garmentLocationOptions={garmentLocationOptions}
            onChange={(patch) => updateDefect(defect._localId, patch)}
            onRemove={() => removeDefect(defect._localId)}
            error={errors?.defects?.[defect._localId]}
          />
        ))}
        {defects.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">
            Chưa có defect nào. Bấm "+ Add Defect" để thêm.
          </p>
        )}
      </div>
    </div>
  )
}
