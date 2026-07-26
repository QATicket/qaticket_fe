import { apiFetch } from './http'

export const getQaTicket = (id) => apiFetch(`/api/qa-tickets/${id}`)

export const createQaTicket = (payload) =>
  apiFetch('/api/qa-tickets', { method: 'POST', body: payload })

export const updateQaTicket = (id, payload) =>
  apiFetch(`/api/qa-tickets/${id}`, { method: 'PUT', body: payload })

export const deleteQaTicket = (id) => apiFetch(`/api/qa-tickets/${id}`, { method: 'DELETE' })

export const listQaTickets = (query) => apiFetch('/api/qa-tickets', { params: query })

export const exportQaTicket = (id) =>
  apiFetch(`/api/qa-tickets/${id}/export`, { method: 'PATCH' })

export const unexportQaTicket = (id) =>
  apiFetch(`/api/qa-tickets/${id}/unexport`, { method: 'PATCH' })
