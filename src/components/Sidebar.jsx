import { useState } from 'react'

const NAV_ITEMS = [
  { key: 'list', label: 'Danh sách phiếu' },
  { key: 'form', label: 'Tạo phiếu mới' },
]

export default function Sidebar({ view, onNavigate, userInfo, onLogout, collapsed, onToggleCollapsed }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleNavigate(key) {
    onNavigate(key)
    setMobileOpen(false)
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="sm:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="text-sm font-medium text-slate-600 border border-slate-300 rounded-md px-3 py-1.5"
        >
          Menu
        </button>
        <span className="font-semibold text-slate-800 text-sm">Garment QA Checking</span>
        <span className="w-14" />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="sm:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Reopen button when sidebar collapsed on desktop */}
      {collapsed && (
        <button
          type="button"
          onClick={onToggleCollapsed}
          title="Hiện menu"
          className="hidden sm:flex items-center justify-center fixed top-4 left-4 z-40 w-9 h-9 text-base font-medium bg-slate-900 text-white rounded-full hover:bg-slate-800"
        >
          →
        </button>
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64
          bg-slate-900 text-slate-200 flex flex-col
          transform transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'sm:-translate-x-full' : 'sm:translate-x-0'}
        `}
      >
        <div className="px-5 py-5 border-b border-slate-700 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-bold text-white text-base leading-tight truncate">Garment QA</h1>
            <p className="text-xs text-slate-400 mt-0.5">Checking System</p>
          </div>
          <button
            type="button"
            onClick={onToggleCollapsed}
            title="Ẩn menu"
            className="hidden sm:flex items-center justify-center text-base font-medium text-slate-300 hover:text-white border border-slate-600 rounded-full w-7 h-7 hover:bg-slate-800 shrink-0"
          >
            ←
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handleNavigate(item.key)}
              className={`w-full text-left px-5 py-3 text-sm font-medium transition-colors ${
                view === item.key
                  ? 'bg-brand-red text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-700 px-5 py-4 shrink-0">
          <p className="text-xs text-slate-400">Đăng nhập với</p>
          <p className="text-sm font-medium text-white truncate">
            {userInfo?.fullName || userInfo?.username}
          </p>
          {userInfo?.role && (
            <p className="text-xs text-slate-400 truncate">{userInfo.role}</p>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="mt-3 w-full text-sm text-slate-300 hover:text-white border border-slate-600 rounded-md py-1.5 hover:bg-slate-800"
          >
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  )
}
