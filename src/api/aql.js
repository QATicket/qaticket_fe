import { apiFetch } from './http'

export const lookupAql = (aqlLevel, qtySize) =>
  apiFetch('/api/aql/lookup', { params: { aqlLevel, qtySize } })
