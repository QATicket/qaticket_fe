import { useEffect, useState } from 'react'
import { getDefects } from '../api/master'
import { deleteDefect } from '../api/admin'
import DefectFormModal from './DefectFormModal'
import { useLanguage } from '../i18n/LanguageContext'

export default function DefectManagementTab() {
  const { t } = useLanguage()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modalItem, setModalItem] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [busyId, setBusyId] = useState(null)

  async function handleDelete(id) {
    if (!window.confirm(t('Xoá nhóm lỗi này?'))) return
    setBusyId(id)
    setError('')
    try {
      await deleteDefect(id)
      setItems((prev) => prev.filter((row) => row.id !== id))
    } catch (err) {
      setError(err.message || t('Xoá nhóm lỗi thất bại'))
    } finally {
      setBusyId(null)
    }
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const list = await getDefects()
      setItems(Array.isArray(list) ? list : list.items || [])
    } catch (err) {
      setError(err.message || t('Không tải được danh sách nhóm lỗi'))
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
        <p className="text-sm text-slate-500">{t('Nhóm lỗi dùng làm danh mục cha cho các lỗi chi tiết.')}</p>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="bg-brand-navy text-white text-sm font-medium rounded-md px-4 py-2 hover:opacity-90 shrink-0"
        >
          {t('+ Thêm nhóm lỗi')}
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
              <th className="px-4 py-3">{t('Tên (Tiếng Việt)')}</th>
              <th className="px-4 py-3">{t('Tên (Tiếng Anh)')}</th>
              <th className="px-4 py-3">{t('Hành động')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">{d.code ?? '—'}</td>
                <td className="px-4 py-2 font-medium text-slate-800">{d.nameVi}</td>
                <td className="px-4 py-2">{d.nameEn ?? '—'}</td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => setModalItem(d)}
                    className="text-sm text-brand-navy hover:underline"
                  >
                    {t('Sửa')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(d.id)}
                    disabled={busyId === d.id}
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
                  {t('Chưa có nhóm lỗi nào')}
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
        <DefectFormModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false)
            load()
          }}
        />
      )}

      {modalItem && (
        <DefectFormModal
          defect={modalItem}
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
