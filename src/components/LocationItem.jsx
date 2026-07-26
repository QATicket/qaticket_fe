import { useRef, useState } from 'react'
import SearchableSelect from './SearchableSelect'
import NumberStepper from './NumberStepper'
import { uploadImages } from '../api/uploads'

export default function LocationItem({
  location,
  index,
  garmentLocationOptions,
  onChange,
  onRemove,
  error,
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  async function handleFilesSelected(fileList) {
    const files = Array.from(fileList || [])
    if (files.length === 0) return
    setUploading(true)
    setUploadError('')
    try {
      const urls = await uploadImages(files)
      onChange({ images: [...location.images, ...urls] })
    } catch (err) {
      setUploadError(err.message || 'Upload ảnh thất bại')
    } finally {
      setUploading(false)
    }
  }

  function removeImage(url) {
    onChange({ images: location.images.filter((img) => img !== url) })
  }

  return (
    <div className="bg-white border border-sky-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="inline-block bg-sky-100 text-sky-700 text-xs font-semibold px-2 py-1 rounded">
          VỊ TRÍ {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-sm text-slate-400 hover:text-brand-red underline"
        >
          Xoá vị trí
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Vị trí (cổ, tay, sườn...)
          </label>
          <SearchableSelect
            options={garmentLocationOptions}
            value={location.garmentLocationId}
            onChange={(v) => {
              const opt = garmentLocationOptions.find((o) => String(o.value) === String(v))
              onChange({ garmentLocationId: v, locationText: opt ? opt.label : location.locationText })
            }}
            allowFreeText
            freeTextValue={location.locationText}
            onFreeTextChange={(text) => onChange({ locationText: text, garmentLocationId: null })}
            placeholder="Chọn hoặc gõ vị trí"
            error={error?.locationText}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Số lượng</label>
          <NumberStepper
            value={location.quantity}
            onChange={(v) => onChange({ quantity: v })}
            error={error?.quantity}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            handleFilesSelected(e.target.files)
            e.target.value = ''
          }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFilesSelected(e.target.files)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading}
          className="text-xs font-medium border border-slate-300 rounded-md px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
        >
          Chụp ảnh
        </button>
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={uploading}
          className="text-xs font-medium border border-slate-300 rounded-md px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
        >
          Thư viện
        </button>
        {uploading && <span className="text-xs text-slate-400">Đang tải ảnh lên...</span>}
      </div>
      {uploadError && <p className="text-xs text-brand-red mb-2">{uploadError}</p>}

      {location.images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {location.images.map((url) => (
            <div key={url} className="relative w-16 h-16">
              <img src={url} alt="" className="w-16 h-16 object-cover rounded-md border border-slate-200" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute -top-1.5 -right-1.5 bg-brand-red text-white rounded px-1 text-[10px] leading-4"
              >
                Xoá
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
