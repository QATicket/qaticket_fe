import { useState } from 'react'
import { changePassword } from '../api/auth'
import { useLanguage } from '../i18n/LanguageContext'

export default function ChangePasswordModal({ onClose, onSuccess }) {
  const { t } = useLanguage()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    setError('')
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError(t('Vui lòng nhập đầy đủ thông tin'))
      return
    }
    if (newPassword.length < 6) {
      setError(t('Mật khẩu mới phải có ít nhất 6 ký tự'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('Xác nhận mật khẩu mới không khớp'))
      return
    }

    setSaving(true)
    try {
      await changePassword(oldPassword, newPassword)
      onSuccess()
    } catch (err) {
      setError(err.message || t('Đổi mật khẩu thất bại'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/40 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm my-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800">{t('Đổi mật khẩu')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-brand-red underline"
          >
            {t('Đóng')}
          </button>
        </div>

        <div className="px-5 py-4">
          <div onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} className="space-y-3">
            <Field label={t('Mật khẩu hiện tại')}>
              <input
                type="password"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <Field label={t('Mật khẩu mới')}>
              <input
                type="password"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field label={t('Xác nhận mật khẩu mới')}>
              <input
                type="password"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>

            {error && <p className="text-sm text-brand-red">{error}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-brand-red underline"
          >
            {t('Huỷ')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-brand-navy text-white text-sm font-medium rounded-md px-4 py-2 hover:opacity-90 disabled:opacity-60"
          >
            {saving ? t('Đang lưu...') : t('Đổi mật khẩu')}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  )
}
