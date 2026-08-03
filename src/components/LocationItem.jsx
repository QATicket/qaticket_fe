import { useRef, useState } from 'react'
import SearchableSelect from './SearchableSelect'
import NumberStepper from './NumberStepper'
import AddImageTile, { CameraIcon, GalleryIcon } from './AddImageTile'
import ImageEditorModal from './ImageEditorModal'
import { uploadImages } from '../api/uploads'
import { blobToFile } from '../utils/image'
import { useLanguage } from '../i18n/LanguageContext'

export default function LocationItem({
  location,
  index,
  garmentLocationOptions,
  onChange,
  onRemove,
  error,
}) {
  const { t } = useLanguage()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [pendingCameraFile, setPendingCameraFile] = useState(null)
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
      setUploadError(err.message || t('Upload ảnh thất bại'))
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
          {t('VỊ TRÍ {{n}}', { n: index + 1 })}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-sm text-slate-400 hover:text-brand-red underline"
        >
          {t('Xoá vị trí')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            {t('Vị trí (cổ, tay, sườn...)')}
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
            placeholder={t('Chọn hoặc gõ vị trí')}
            error={error?.locationText}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">{t('Số lượng')}</label>
          <NumberStepper
            value={location.quantity}
            onChange={(v) => onChange({ quantity: v })}
            error={error?.quantity}
          />
        </div>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) setPendingCameraFile(file)
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
      {uploading && <p className="text-xs text-slate-400 mb-2">{t('Đang tải ảnh lên...')}</p>}
      {uploadError && <p className="text-xs text-brand-red mb-2">{uploadError}</p>}

      <div className="flex gap-2">
        <AddImageTile
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading}
          icon={<CameraIcon />}
          label={t('Chụp ảnh')}
        />
        <AddImageTile
          onClick={() => galleryInputRef.current?.click()}
          disabled={uploading}
          icon={<GalleryIcon />}
          label={t('Thư viện')}
        />
      </div>

      {location.images.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {location.images.map((url) => (
            <div key={url} className="relative w-16 h-16">
              <img src={url} alt="" className="w-16 h-16 object-cover rounded-md border border-slate-200" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute -top-1.5 -right-1.5 bg-brand-red text-white rounded px-1 text-[10px] leading-4"
              >
                {t('Xoá')}
              </button>
            </div>
          ))}
        </div>
      )}

      {pendingCameraFile && (
        <ImageEditorModal
          file={pendingCameraFile}
          onCancel={() => setPendingCameraFile(null)}
          onConfirm={(blob) => {
            setPendingCameraFile(null)
            handleFilesSelected([blobToFile(blob, `capture-${Date.now()}.jpg`)])
          }}
        />
      )}
    </div>
  )
}
