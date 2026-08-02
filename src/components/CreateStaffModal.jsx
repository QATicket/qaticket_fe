import { useState } from 'react'
import { createStaff } from '../api/admin'

const ROLE_OPTIONS = [
  { value: 'QA', label: 'QA' },
  { value: 'ADMIN', label: 'Admin' },
]

export default function CreateStaffModal({ onClose, onCreated }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('QA')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    setError('')
    if (!username.trim() || !password || !fullName.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin')
      return
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    setSaving(true)
    try {
      await createStaff({ username: username.trim(), password, fullName: fullName.trim(), role })
      onCreated()
    } catch (err) {
      setError(err.message || 'Tạo nhân viên thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/40 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm my-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800">Thêm nhân viên</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-brand-red underline"
          >
            Đóng
          </button>
        </div>

        <div className="px-5 py-4">
          <div onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} className="space-y-3">
            <Field label="Tài khoản (username)">
              <input
                type="text"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
              />
            </Field>
            <Field label="Mật khẩu">
              <input
                type="password"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Họ tên">
              <input
                type="text"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </Field>
            <Field label="Vai trò (role)">
              <select
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
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
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-brand-navy text-white text-sm font-medium rounded-md px-4 py-2 hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Đang tạo...' : 'Tạo nhân viên'}
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
