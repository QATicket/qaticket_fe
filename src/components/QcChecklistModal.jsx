import { useState } from 'react'
import {
  QC_CHECKLIST_GROUPS,
  QC_CHOICE_GROUPS,
  defaultQcChecklistValues,
  defaultQcChoiceValues,
} from '../utils/qcChecklist'
import { useLanguage } from '../i18n/LanguageContext'

export default function QcChecklistModal({ onConfirm, onCancel, exportLabel = 'Excel' }) {
  const { t } = useLanguage()
  const [values, setValues] = useState(() => ({
    ...defaultQcChecklistValues(),
    ...defaultQcChoiceValues(),
  }))

  function setItemValue(itemId, value) {
    setValues((prev) => ({ ...prev, [itemId]: value }))
  }

  // Chèn mục 6 (chọn 1-trong-2) ngay sau "Packing" để nằm cùng hàng, bên
  // phải mục 5 trong lưới 2 cột (packing là item cuối của QC_CHECKLIST_GROUPS).
  const gridGroups = []
  for (const group of QC_CHECKLIST_GROUPS) {
    gridGroups.push(group)
    if (group.id === 'packing') gridGroups.push(...QC_CHOICE_GROUPS)
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
            {gridGroups.map((group) =>
              group.items[0]?.options ? (
                <div key={group.id} className="border border-slate-200 rounded-md p-3">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">{group.title}</h3>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-slate-600">{item.label}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.options.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() =>
                                setItemValue(item.id, values[item.id] === option.id ? null : option.id)
                              }
                              aria-pressed={values[item.id] === option.id}
                              className={`px-3 h-7 rounded-full text-xs font-medium border transition-colors ${
                                values[item.id] === option.id
                                  ? 'bg-brand-navy border-brand-navy text-white'
                                  : 'bg-white border-slate-300 text-slate-500 hover:border-brand-navy hover:text-brand-navy'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
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
              ),
            )}
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
