import { useState } from 'react'
import { login } from '../api/auth'
import WorkshopWatermark from './WorkshopWatermark'
import { useLanguage } from '../i18n/LanguageContext'

function ShirtHangerIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10.3 3.2a1.7 1.7 0 0 1 3.4 0" />
      <path d="M12 3.2v3" />
      <path d="M7.7 6.2 2 9.6l2 3.3 3.7-1.9V19.5a1 1 0 0 0 1 1h6.6a1 1 0 0 0 1-1V11l3.7 1.9 2-3.3-5.7-3.4a3.3 3.3 0 0 1-6.6 0Z" />
    </svg>
  )
}

function UserIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  )
}

function LockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

function EyeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17.8 17.8 0 0 1-3.5 4.3M6.6 6.6C4 8.3 2 12 2 12s3.6 7 10 7c1.4 0 2.7-.3 3.8-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}

function ShieldIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3l7 3v6c0 5-3 8-7 9-4-1-7-4-7-9V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

export default function LoginPage({ onLoggedIn }) {
  const { t } = useLanguage()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [wakingUp, setWakingUp] = useState(false)

  async function handleSubmit() {
    if (!username || !password) {
      setError(t('Vui lòng nhập tài khoản và mật khẩu'))
      return
    }
    setLoading(true)
    setError('')
    setWakingUp(false)
    const wakeUpTimer = setTimeout(() => setWakingUp(true), 4000)
    try {
      const data = await login(username, password)
      onLoggedIn(data)
    } catch (err) {
      setError(err.message || t('Đăng nhập thất bại'))
    } finally {
      clearTimeout(wakeUpTimer)
      setLoading(false)
      setWakingUp(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-brand-navy to-brand-navyDark px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <WorkshopWatermark />
      </div>

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-7">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-brand-navy/10 flex items-center justify-center mb-3">
            <ShirtHangerIcon className="w-7 h-7 text-brand-navy" />
          </div>
          <h1 className="text-xl font-extrabold text-brand-navy tracking-wide uppercase text-center">
            Garment QA/QC
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="h-px w-6 bg-slate-300" />
            <span className="text-[11px] font-medium text-slate-400 tracking-widest uppercase">
              {t('Management System')}
            </span>
            <span className="h-px w-6 bg-slate-300" />
          </div>
        </div>

        <div onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}>
          <div className="mb-4 relative">
            <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy"
              placeholder={t('Tài khoản')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="mb-4 relative">
            <LockIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy"
              placeholder={t('Mật khẩu')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              tabIndex={-1}
              aria-label={showPassword ? t('Ẩn mật khẩu') : t('Hiện mật khẩu')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>

          {error && <p className="text-sm text-brand-red mb-3">{error}</p>}
          {wakingUp && (
            <p className="text-sm text-slate-500 mb-3">
              {t(
                'Server đang khởi động lại (có thể mất tới 30-60 giây ở lần dùng đầu tiên sau một thời gian không hoạt động), vui lòng chờ...',
              )}
            </p>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-brand-navy text-white font-semibold rounded-lg py-3.5 hover:bg-brand-navyDark transition-colors disabled:opacity-60"
          >
            {loading ? t('Đang đăng nhập...') : t('Đăng nhập')}
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-5 text-slate-400">
          <ShieldIcon className="w-3.5 h-3.5" />
          <span className="text-[11px]">Secure Login</span>
        </div>
      </div>
    </div>
  )
}
