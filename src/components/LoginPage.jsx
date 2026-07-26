import { useState } from 'react'
import { login } from '../api/auth'

export default function LoginPage({ onLoggedIn }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [wakingUp, setWakingUp] = useState(false)

  async function handleSubmit() {
    if (!username || !password) {
      setError('Vui lòng nhập tài khoản và mật khẩu')
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
      setError(err.message || 'Đăng nhập thất bại')
    } finally {
      clearTimeout(wakeUpTimer)
      setLoading(false)
      setWakingUp(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-6">
        <h1 className="text-xl font-bold text-center mb-6 text-slate-800">
          Garment QA Checking
        </h1>
        <div onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-600 mb-1">Tài khoản</label>
            <input
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-orange"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-600 mb-1">Mật khẩu</label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-orange"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-brand-red mb-3">{error}</p>}
          {wakingUp && (
            <p className="text-sm text-slate-500 mb-3">
              Server đang khởi động lại (có thể mất tới 30-60 giây ở lần dùng đầu tiên sau một
              thời gian không hoạt động), vui lòng chờ...
            </p>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-brand-orange text-white font-semibold rounded-md py-2 hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  )
}
