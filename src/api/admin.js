import { apiFetch } from './http'

export const createStaff = (data) => apiFetch('/api/admin/staff', { method: 'POST', body: data })

export const lockStaff = (staffId) =>
  apiFetch(`/api/admin/staff/${staffId}/lock`, { method: 'PATCH' })

export const unlockStaff = (staffId) =>
  apiFetch(`/api/admin/staff/${staffId}/unlock`, { method: 'PATCH' })

export const resetStaffPassword = (staffId, newPassword) =>
  apiFetch(`/api/auth/staff/${staffId}/reset-password`, {
    method: 'POST',
    body: { newPassword },
  })
