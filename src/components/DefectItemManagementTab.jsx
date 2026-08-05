import { useEffect, useState } from 'react'
import { getDefects, getDefectItems } from '../api/master'
import DefectItemFormModal from './DefectItemFormModal'
import { useLanguage } from '../i18n/LanguageContext'

export default function DefectItemManagementTab() {
  const { t } = useLanguage()
  const [items, setItems] = useState([])
  const [defects, setDefects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modalItem, setModalItem] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [itemList, defectList] = await Promise.all([getDefectItems(), getDefects()])
      setItems(Array.isArray(itemList) ? itemList : itemList.items || [])
      setDefects(Array.isArray(defectList) ? defectList : defectList.items || [])
    } catch (err) {
      setError(err.message || t('Không tải được danh sách lỗi chi tiết'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function defectName(defectId) {
    return defects.find((d) => String(d.id) === String(defectId))?.nameVi ?? '—'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">{t('Lỗi chi tiết thuộc về 1 nhóm lỗi, dùng trong danh sách chọn lỗi khi tạo phiếu.')}</p>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          disabled={defects.length === 0}
          className="bg-brand-navy text-white text-sm font-medium rounded-md px-4 py-2 hover:opacity-90 disabled:opacity-50 shrink-0"
        >
          {t('+ Thêm lỗi chi tiết')}
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
              <th className="px-4 py-3">{t('Nhóm lỗi')}</th>
              <th className="px-4 py-3">Minor</th>
              <th className="px-4 py-3">Major</th>
              <th className="px-4 py-3">{t('Hành động')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">{it.code ?? '—'}</td>
                <td className="px-4 py-2 font-medium text-slate-800">{it.nameVi}</td>
                <td className="px-4 py-2">{it.nameEn ?? '—'}</td>
                <td className="px-4 py-2">{defectName(it.defectId)}</td>
                <td className="px-4 py-2">{it.allowMinor ? t('Có') : t('Không')}</td>
                <td className="px-4 py-2">{it.allowMajor ? t('Có') : t('Không')}</td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => setModalItem(it)}
                    className="text-sm text-brand-navy hover:underline"
                  >
                    {t('Sửa')}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  {t('Chưa có lỗi chi tiết nào')}
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
        <DefectItemFormModal
          defectOptions={defects}
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false)
            load()
          }}
        />
      )}

      {modalItem && (
        <DefectItemFormModal
          defectItem={modalItem}
          defectOptions={defects}
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
