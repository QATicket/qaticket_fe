import { useEffect, useState } from 'react'
import { getFactories } from '../api/master'
import { deleteFactory } from '../api/admin'
import FactoryFormModal from './FactoryFormModal'
import { useLanguage } from '../i18n/LanguageContext'

export default function FactoryManagementTab() {
  const { t } = useLanguage()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modalItem, setModalItem] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [busyId, setBusyId] = useState(null)

  async function handleDelete(id) {
    if (!window.confirm(t('Xoá nhà máy này?'))) return
    setBusyId(id)
    setError('')
    try {
      await deleteFactory(id)
      setItems((prev) => prev.filter((row) => row.id !== id))
    } catch (err) {
      setError(err.message || t('Xoá nhà máy thất bại'))
    } finally {
      setBusyId(null)
    }
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const list = await getFactories()
      setItems(Array.isArray(list) ? list : list.items || [])
    } catch (err) {
      setError(err.message || t('Không tải được danh sách nhà máy'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">{t('Nhà máy dùng làm danh mục cho chuyền/line và phiếu kiểm.')}</p>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="bg-brand-navy text-white text-sm font-medium rounded-md px-4 py-2 hover:opacity-90 shrink-0"
        >
          {t('+ Thêm nhà máy')}
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
              <th className="px-4 py-3">{t('Mã')}</th>
              <th className="px-4 py-3">{t('Tên nhà máy')}</th>
              <th className="px-4 py-3">{t('Địa chỉ')}</th>
              <th className="px-4 py-3">{t('Hành động')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((f) => (
              <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">{f.code ?? '—'}</td>
                <td className="px-4 py-2 font-medium text-slate-800">{f.name}</td>
                <td className="px-4 py-2">{f.address ?? '—'}</td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => setModalItem(f)}
                    className="text-sm text-brand-navy hover:underline"
                  >
                    {t('Sửa')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(f.id)}
                    disabled={busyId === f.id}
                    className="text-sm text-brand-red hover:underline ml-3 disabled:opacity-50"
                  >
                    {t('Xoá')}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  {t('Chưa có nhà máy nào')}
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
        <FactoryFormModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false)
            load()
          }}
        />
      )}

      {modalItem && (
        <FactoryFormModal
          factory={modalItem}
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
