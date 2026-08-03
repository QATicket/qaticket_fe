import { createContext, useContext, useEffect, useState } from 'react'
import { en } from './translations'
import { setLanguage as persistLanguageToServer } from '../api/auth'

const LANG_KEY = 'qaticket.lang'
const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || 'vi')

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang)
  }, [lang])

  function t(text, vars) {
    let out = (lang === 'en' && en[text]) || text
    if (vars) {
      for (const [key, value] of Object.entries(vars)) {
        out = out.replaceAll(`{{${key}}}`, value)
      }
    }
    return out
  }

  // Đồng bộ ngôn ngữ từ field "language" (VI/EN) trong response đăng nhập -
  // chỉ set state ở FE, KHÔNG gọi lại API (tránh vòng lặp set->post->set).
  // LUÔN set lại (mặc định "vi" nếu tài khoản mới không có/không nhận diện
  // được field language) - tránh bị dính ngôn ngữ của tài khoản đăng nhập
  // trước đó còn sót lại trong state khi đổi tài khoản.
  function applyServerLanguage(code) {
    const normalized = String(code || '').toLowerCase()
    setLang(normalized === 'en' ? 'en' : 'vi')
  }

  // Người dùng bấm nút đổi ngôn ngữ - đổi ngay trên UI, đồng thời lưu lựa
  // chọn lên BE (POST /api/auth/language) để lần đăng nhập sau tự hiện đúng
  // ngôn ngữ. Lỗi mạng khi lưu lên BE không chặn việc đổi ngôn ngữ trên UI.
  function toggleLang() {
    const next = lang === 'vi' ? 'en' : 'vi'
    setLang(next)
    persistLanguageToServer(next.toUpperCase()).catch((err) => {
      console.error('[i18n] Failed to save language preference', err)
    })
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, applyServerLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}
