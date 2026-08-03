import { useState } from 'react'
import { QC_CHECKLIST_GROUPS, defaultQcChecklistValues } from '../utils/qcChecklist'
import { useLanguage } from '../i18n/LanguageContext'

export default function QcChecklistModal({ onConfirm, onCancel, exportLabel = 'Excel' }) {
  const { t } = useLanguage()
  const [values, setValues] = useState(() => defaultQcChecklistValues())

  function setItemValue(itemId, value) {
    setValues((prev) => ({ ...prev, [itemId]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/40 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800">
            {t('Chọn v/x tiêu chí trước khi xuất {{label}}', { label: exportLabel })}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-slate-500 hover:text-brand-red underline"
          >
            {t('Đóng')}
          </button>
        </div>

        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-slate-400 mb-4">
            {t('Mặc định tất cả là "v" (đạt). Tick "x" cho tiêu chí không đạt.')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {QC_CHECKLIST_GROUPS.map((group) => (
              <div key={group.id} className="border border-slate-200 rounded-md p-3">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">{group.title}</h3>
                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-slate-600">{item.label}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setItemValue(item.id, 'v')}
                          title={t('Đạt')}
                          aria-label={t('Đạt')}
                          aria-pressed={values[item.id] === 'v'}
                          className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors ${
                            values[item.id] === 'v'
                              ? 'bg-green-600 border-green-600 text-white'
                              : 'bg-white border-slate-300 text-slate-300 hover:border-green-500 hover:text-green-500'
                          }`}
                        >
                          <CheckIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemValue(item.id, 'x')}
                          title={t('Không đạt')}
                          aria-label={t('Không đạt')}
                          aria-pressed={values[item.id] === 'x'}
                          className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors ${
                            values[item.id] === 'x'
                              ? 'bg-brand-red border-brand-red text-white'
                              : 'bg-white border-slate-300 text-slate-300 hover:border-brand-red hover:text-brand-red'
                          }`}
                        >
                          <XIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-slate-500 hover:text-brand-red underline"
          >
            {t('Huỷ')}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(values)}
            className="bg-brand-navy text-white text-sm font-medium rounded-md px-4 py-2 hover:opacity-90"
          >
            {t('Xác nhận & Xuất {{label}}', { label: exportLabel })}
          </button>
        </div>
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="w-4 h-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="w-4 h-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}
