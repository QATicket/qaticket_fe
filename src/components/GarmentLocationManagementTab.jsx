import { useEffect, useState } from 'react'
import { getGarmentTypes, getGarmentLocations } from '../api/master'
import { deleteGarmentLocation } from '../api/admin'
import GarmentLocationFormModal from './GarmentLocationFormModal'
import { useLanguage } from '../i18n/LanguageContext'

export default function GarmentLocationManagementTab() {
  const { t } = useLanguage()
  const [garmentTypes, setGarmentTypes] = useState([])
  const [garmentTypeId, setGarmentTypeId] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modalItem, setModalItem] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [busyId, setBusyId] = useState(null)

  async function handleDelete(id) {
    if (!window.confirm(t('Xoá vị trí này?'))) return
    setBusyId(id)
    setError('')
    try {
      await deleteGarmentLocation(id)
      setItems((prev) => prev.filter((row) => row.id !== id))
    } catch (err) {
      setError(err.message || t('Xoá vị trí thất bại'))
    } finally {
      setBusyId(null)
    }
  }

  useEffect(() => {
    getGarmentTypes()
      .then((list) => {
        const arr = Array.isArray(list) ? list : list.items || []
        setGarmentTypes(arr)
        if (arr.length > 0) setGarmentTypeId(String(arr[0].id))
      })
      .catch((err) => setError(err.message || t('Không tải được danh sách loại sản phẩm')))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    if (!garmentTypeId) return
    setLoading(true)
    setError('')
    try {
      const list = await getGarmentLocations(garmentTypeId)
      setItems(Array.isArray(list) ? list : list.items || [])
    } catch (err) {
      setError(err.message || t('Không tải được danh sách vị trí'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [garmentTypeId])

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
        <div className="max-w-xs">
          <label className="block text-xs font-medium text-slate-500 mb-1">{t('Loại sản phẩm')}</label>
          <select
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
            value={garmentTypeId}
            onChange={(e) => setGarmentTypeId(e.target.value)}
          >
            {garmentTypes.length === 0 && <option value="">{t('Chọn...')}</option>}
            {garmentTypes.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          disabled={garmentTypes.length === 0}
          className="bg-brand-navy text-white text-sm font-medium rounded-md px-4 py-2 hover:opacity-90 disabled:opacity-50 shrink-0"
        >
          {t('+ Thêm vị trí')}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-brand-red text-brand-red text-sm rounded-md p-3 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-4 py-3">{t('Tên vị trí')}</th>
              <th className="px-4 py-3">{t('Hành động')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((loc) => (
              <tr key={loc.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-800">{loc.name}</td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => setModalItem(loc)}
                    className="text-sm text-brand-navy hover:underline"
                  >
                    {t('Sửa')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(loc.id)}
                    disabled={busyId === loc.id}
                    className="text-sm text-brand-red hover:underline ml-3 disabled:opacity-50"
                  >
                    {t('Xoá')}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-slate-400">
                  {t('Chưa có vị trí nào')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && items.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">{t('Đang tải...')}</p>
        )}
      </div>

      {createOpen && (
        <GarmentLocationFormModal
          garmentTypeOptions={garmentTypes}
          defaultGarmentTypeId={garmentTypeId}
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false)
            load()
          }}
        />
      )}

      {modalItem && (
        <GarmentLocationFormModal
          location={modalItem}
          garmentTypeOptions={garmentTypes}
          onClose={() => setModalItem(null)}
          onSaved={() => {
            setModalItem(null)
            load()
          }}
        />
      )}
    </div>
  )
}
