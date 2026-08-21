import { apiFetch } from './http'

// BE trả images theo Set nên thứ tự không đảm bảo đúng thứ tự upload -> sort lại
// theo id (auto-increment, phản ánh đúng thứ tự tạo/upload) ngay khi nhận response,
// để mọi nơi dùng ticket (chi tiết, export PDF/Excel) đều thấy ảnh đúng thứ tự.
function byId(a, b) {
  return (a.id ?? 0) - (b.id ?? 0)
}

function sortTicketImages(ticket) {
  if (!ticket) return ticket
  return {
    ...ticket,
    measurementImages: [...(ticket.measurementImages || [])].sort(byId),
    specImages: [...(ticket.specImages || [])].sort(byId),
    defects: (ticket.defects || []).map((defect) => ({
      ...defect,
      locations: (defect.locations || []).map((loc) => ({
        ...loc,
        images: [...(loc.images || [])].sort(byId),
      })),
    })),
  }
}

export const getQaTicket = (id) => apiFetch(`/api/qa-tickets/${id}`).then(sortTicketImages)

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
