import { useEffect, useRef, useState } from 'react'
import SearchableSelect from './SearchableSelect'
import NumberStepper from './NumberStepper'
import AddImageTile, { CameraIcon, GalleryIcon } from './AddImageTile'
import ImageEditorModal from './ImageEditorModal'
import { searchPurchaseOrders } from '../api/master'
import { uploadImages } from '../api/uploads'
import { blobToFile } from '../utils/image'

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
  styleOptions,
  garmentTypeOptions,
}) {
  const [poOptions, setPoOptions] = useState([])
  const [poQuery, setPoQuery] = useState(form.poLabel || '')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [pendingCameraFile, setPendingCameraFile] = useState(null)
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  useEffect(() => {
    const handle = setTimeout(() => {
      searchPurchaseOrders(poQuery)
        .then((list) => setPoOptions(list.map((po) => ({ value: po.id, label: po.poCode }))))
        .catch(() => setPoOptions([]))
    }, 300)
    return () => clearTimeout(handle)
  }, [poQuery])

  async function handleFilesSelected(fileList) {
    const files = Array.from(fileList || [])
    if (files.length === 0) return
    setUploading(true)
    setUploadError('')
    try {
      const urls = await uploadImages(files)
      onChange({ images: [...(form.images || []), ...urls] })
    } catch (err) {
      setUploadError(err.message || 'Upload ảnh thất bại')
    } finally {
      setUploading(false)
    }
  }

  function removeImage(url) {
    onChange({ images: (form.images || []).filter((img) => img !== url) })
  }

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

        <Field label="Style (Mã hàng)">
          <SearchableSelect
            options={styleOptions}
            value={form.styleId}
            onChange={(v) => onChange({ styleId: v })}
            placeholder="Chọn style"
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

      <div className="mt-4">
        <label className="block text-xs font-medium text-slate-500 mb-1">Hình ảnh thông số</label>

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

        {uploading && <p className="text-xs text-slate-400 mb-2">Đang tải ảnh lên...</p>}
        {uploadError && <p className="text-xs text-brand-red mb-2">{uploadError}</p>}

        <div className="flex gap-2">
          <AddImageTile
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            icon={<CameraIcon />}
            label="Chụp ảnh"
          />
          <AddImageTile
            onClick={() => galleryInputRef.current?.click()}
            disabled={uploading}
            icon={<GalleryIcon />}
            label="Thư viện"
          />
        </div>

        {(form.images || []).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {form.images.map((url) => (
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

      {form.inspectionStage === 'FINAL' && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <label className="block text-xs font-medium text-slate-500 mb-2">
            Upload hình ảnh duyệt (Spec Images)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MultiImageUpload
              label="Mẫu duyệt (Approved Sample)"
              urls={form.specImages?.APPROVED_SAMPLE || []}
              onChange={(urls) =>
                onChange({ specImages: { ...form.specImages, APPROVED_SAMPLE: urls } })
              }
            />
            <MultiImageUpload
              label="Bảng thông số kích thước"
              urls={form.specImages?.SIZE_SPEC || []}
              onChange={(urls) =>
                onChange({ specImages: { ...form.specImages, SIZE_SPEC: urls } })
              }
            />
            <MultiImageUpload
              label="Quy cách đóng thùng/Bao bì"
              urls={form.specImages?.PACKING || []}
              onChange={(urls) =>
                onChange({ specImages: { ...form.specImages, PACKING: urls } })
              }
            />
            <MultiImageUpload
              label="Thẻ treo & Nhãn hiệu"
              urls={form.specImages?.HANGTAG_LABEL || []}
              onChange={(urls) =>
                onChange({ specImages: { ...form.specImages, HANGTAG_LABEL: urls } })
              }
            />
          </div>

          {(form.specImages?.OTHER || []).length > 0 && (
            <div className="mt-4">
              <MultiImageUpload
                label="Khác (ảnh cũ chưa phân loại)"
                urls={form.specImages.OTHER}
                readOnly
              />
            </div>
          )}
        </div>
      )}
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

function MultiImageUpload({ label, urls, onChange, readOnly }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [pendingCameraFile, setPendingCameraFile] = useState(null)
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  async function handleFiles(fileList) {
    const files = Array.from(fileList || [])
    if (files.length === 0) return
    setUploading(true)
    setError('')
    try {
      const newUrls = await uploadImages(files)
      onChange([...urls, ...newUrls])
    } catch (err) {
      setError(err.message || 'Upload ảnh thất bại')
    } finally {
      setUploading(false)
    }
  }

  function removeImage(url) {
    onChange(urls.filter((u) => u !== url))
  }

  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>

      {!readOnly && (
        <>
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
              handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </>
      )}
      {uploading && <p className="text-xs text-slate-400 mb-2">Đang tải ảnh lên...</p>}
      {error && <p className="text-xs text-brand-red mb-2">{error}</p>}

      {!readOnly && (
        <div className="flex gap-2">
          <AddImageTile
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            icon={<CameraIcon />}
            label="Chụp ảnh"
          />
          <AddImageTile
            onClick={() => galleryInputRef.current?.click()}
            disabled={uploading}
            icon={<GalleryIcon />}
            label="Thư viện"
          />
        </div>
      )}

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {urls.map((url) => (
            <div key={url} className="relative w-16 h-16">
              <img
                src={url}
                alt=""
                className="w-16 h-16 object-cover rounded-md border border-slate-200"
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute -top-1.5 -right-1.5 bg-brand-red text-white rounded px-1 text-[10px] leading-4"
                >
                  Xoá
                </button>
              )}
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
            handleFiles([blobToFile(blob, `capture-${Date.now()}.jpg`)])
          }}
        />
      )}
    </div>
  )
}
