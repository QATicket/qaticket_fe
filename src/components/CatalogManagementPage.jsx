import { useState } from 'react'
import DefectManagementTab from './DefectManagementTab'
import DefectItemManagementTab from './DefectItemManagementTab'
import GarmentLocationManagementTab from './GarmentLocationManagementTab'
import { useLanguage } from '../i18n/LanguageContext'

const TABS = [
  { key: 'defects', label: 'Nhóm lỗi' },
  { key: 'defectItems', label: 'Lỗi chi tiết' },
  { key: 'garmentLocations', label: 'Vị trí trên sản phẩm' },
]

export default function CatalogManagementPage() {
  const { t } = useLanguage()
  const [tab, setTab] = useState('defects')

  return (
    <div className="min-h-screen py-6 px-3 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h1 className="text-lg font-bold text-slate-800 mb-3">{t('Quản lý danh mục')}</h1>
          <div className="flex flex-wrap gap-2 border-b border-slate-200 -mb-4 pb-0">
            {TABS.map((tb) => (
              <button
                key={tb.key}
                type="button"
                onClick={() => setTab(tb.key)}
                className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                  tab === tb.key
                    ? 'border-brand-navy text-brand-navy'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t(tb.label)}
              </button>
            ))}
          </div>
        </div>

        {tab === 'defects' && <DefectManagementTab />}
        {tab === 'defectItems' && <DefectItemManagementTab />}
        {tab === 'garmentLocations' && <GarmentLocationManagementTab />}
      </div>
    </div>
  )
}
