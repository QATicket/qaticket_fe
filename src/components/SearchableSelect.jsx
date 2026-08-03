import { useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

/**
 * Dropdown/combobox tìm kiếm dùng chung.
 * options: [{ value, label }]
 * Nếu allowFreeText=true, cho phép gõ tay 1 giá trị không nằm trong danh mục (dùng cho Location).
 */
export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Chọn...',
  disabled = false,
  error,
  allowFreeText = false,
  freeTextValue = '',
  onFreeTextChange,
}) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef(null)

  const selected = useMemo(() => options.find((o) => String(o.value) === String(value)), [options, value])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = useMemo(() => {
    if (!query) return options
    const q = query.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  const displayValue = open ? query : selected ? selected.label : allowFreeText ? freeTextValue : ''

  return (
    <div className="relative" ref={containerRef}>
      <input
        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy disabled:bg-slate-100 disabled:text-slate-400 ${
          error ? 'border-brand-red' : 'border-slate-300'
        }`}
        placeholder={t(placeholder)}
        disabled={disabled}
        value={displayValue}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value)
          if (allowFreeText) {
            onFreeTextChange?.(e.target.value)
          }
        }}
      />
      {open && !disabled && (
        <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-auto bg-white border border-slate-200 rounded-md shadow-lg">
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-400">{t('Không có kết quả')}</li>
          )}
          {filtered.map((o) => (
            <li
              key={o.value}
              className="px-3 py-2 text-sm hover:bg-orange-50 cursor-pointer"
              onMouseDown={() => {
                onChange(o.value)
                setQuery('')
                setOpen(false)
              }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-xs text-brand-red mt-1">{error}</p>}
    </div>
  )
}
