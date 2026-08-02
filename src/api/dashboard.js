import { apiFetch } from './http'

export const getQaDashboard = (params) => apiFetch('/api/qa/dashboard', { params })
