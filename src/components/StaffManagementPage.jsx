import { useEffect, useState } from 'react'
import { getStaff } from '../api/master'
import { lockStaff, unlockStaff } from '../api/admin'
import CreateStaffModal from './CreateStaffModal'
import ResetStaffPasswordModal from './ResetStaffPasswordModal'
import StaffRowActions from './StaffRowActions'

// GET /api/master/staff trả field "active" (boolean) - tài khoản bị khoá khi active === false.
function getLockedState(staff) {
  if (typeof staff.active === 'boolean') return !staff.active
  return null
}

export default function StaffManagementPage() {
  const [items, setItems] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState(null)
  const [nameQuery, setNameQuery] = useState('')
  const [name, setName] = useState('')

  async function fetchPage(cursor) {
    setLoading(true)
    setError('')
    try {
      const res = await getStaff({ name: name || undefined, cursor: cursor || undefined, size: 20 })
      // BE có thể trả mảng phẳng (chưa phân trang) hoặc { items, nextCursor, hasNext }
      // (giống GET /api/qa-tickets) - chấp nhận cả 2 để không vỡ UI nếu contract thay đổi.
      const list = Array.isArray(res) ? res : res.items || []
      setItems((prev) => (cursor ? [...prev, ...list] : list))
      setNextCursor(Array.isArray(res) ? null : res.nextCursor)
      setHasNext(Array.isArray(res) ? false : !!res.hasNext)
    } catch (err) {
      setError(err.message || 'Không tải được danh sách nhân viên')
    } finally {
      setLoading(false)
    }
  }

  function load() {
    fetchPage(null)
  }

  // Search theo tên debounce 600ms để không bắn request mỗi lần gõ phím.
  useEffect(() => {
    const handle = setTimeout(() => {
      setName((n) => (n === nameQuery ? n : nameQuery))
    }, 600)
    return () => clearTimeout(handle)
  }, [nameQuery])

  useEffect(load, [name])

  async function handleLock(staff) {
    setBusyId(staff.id)
    setError('')
    try {
      await lockStaff(staff.id)
      load()
    } catch (err) {
      setError(err.message || 'Khoá tài khoản thất bại')
    } finally {
      setBusyId(null)
    }
  }

  async function handleUnlock(staff) {
    setBusyId(staff.id)
    setError('')
    try {
      await unlockStaff(staff.id)
      load()
    } catch (err) {
      setError(err.message || 'Mở khoá tài khoản thất bại')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen py-6 px-3 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-slate-800">Quản lý nhân viên</h1>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="bg-brand-navy text-white text-sm font-medium rounded-md px-4 py-2 hover:opacity-90"
            >
              + Thêm nhân viên
            </button>
          </div>

          <div className="mt-3 max-w-xs">
            <label className="block text-xs font-medium text-slate-500 mb-1">Tìm theo tên</label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder="Nhập họ tên nhân viên"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-brand-red text-brand-red text-sm rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3">Họ tên</th>
                <th className="px-4 py-3">Tài khoản</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => {
                const locked = getLockedState(s)
                const busy = busyId === s.id
                return (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-800">{s.fullName ?? '—'}</td>
                    <td className="px-4 py-2">{s.code ?? '—'}</td>
                    <td className="px-4 py-2">{s.role ?? '—'}</td>
                    <td className="px-4 py-2">
                      {locked === null ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            locked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {locked ? 'Đã khoá' : 'Hoạt động'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <StaffRowActions
                        staff={s}
                        locked={locked}
                        busy={busy}
                        onLock={handleLock}
                        onUnlock={handleUnlock}
                        onResetPassword={setResetTarget}
                      />
                    </td>
                  </tr>
                )
              })}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Chưa có nhân viên nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {loading && items.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">Đang tải...</p>
          )}
        </div>

        <div className="flex justify-center py-4">
          {hasNext && (
            <button
              type="button"
              onClick={() => fetchPage(nextCursor)}
              disabled={loading}
              className="bg-white border border-slate-300 rounded-md px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? 'Đang tải...' : 'Tải thêm'}
            </button>
          )}
        </div>
      </div>

      {createOpen && (
        <CreateStaffModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false)
            load()
          }}
        />
      )}

      {resetTarget && (
        <ResetStaffPasswordModal
          staff={resetTarget}
          onClose={() => setResetTarget(null)}
          onSuccess={() => setResetTarget(null)}
        />
      )}
    </div>
  )
}
