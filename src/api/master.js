import { apiFetch } from './http'

export const getStaff = (params) => apiFetch('/api/master/staff', { params })
export const getAllStaff = () => apiFetch('/api/master/staff/all')
export const getFactories = () => apiFetch('/api/master/factories')
export const getLines = (factoryId) => apiFetch('/api/master/lines', { params: { factoryId } })
export const getGroups = (lineId) => apiFetch('/api/master/groups', { params: { lineId } })
export const getGarmentTypes = () => apiFetch('/api/master/garment-types')
export const getGarmentLocations = (garmentTypeId) =>
  apiFetch('/api/master/garment-locations', { params: { garmentTypeId } })
export const getDefects = () => apiFetch('/api/master/defects')
export const getDefectItems = () => apiFetch('/api/master/defect-items')
