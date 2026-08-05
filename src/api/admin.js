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

export const createDefect = (data) => apiFetch('/api/admin/defects', { method: 'POST', body: data })

export const updateDefect = (id, data) =>
  apiFetch(`/api/admin/defects/${id}`, { method: 'PUT', body: data })

export const createDefectItem = (data) =>
  apiFetch('/api/admin/defect-items', { method: 'POST', body: data })

export const updateDefectItem = (id, data) =>
  apiFetch(`/api/admin/defect-items/${id}`, { method: 'PUT', body: data })

export const createGarmentLocation = (data) =>
  apiFetch('/api/admin/garment-locations', { method: 'POST', body: data })

export const updateGarmentLocation = (id, data) =>
  apiFetch(`/api/admin/garment-locations/${id}`, { method: 'PUT', body: data })
