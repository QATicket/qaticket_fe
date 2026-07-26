export function newLocalId() {
  return crypto.randomUUID()
}

export function emptyLocation() {
  return {
    _localId: newLocalId(),
    garmentLocationId: null,
    locationText: '',
    quantity: 1,
    images: [],
  }
}

export function emptyDefect() {
  return {
    _localId: newLocalId(),
    defectId: null,
    allowMinor: false,
    allowMajor: false,
    severity: null,
    note: '',
    locations: [emptyLocation()],
  }
}

export function emptyFormState() {
  return {
    staffId: null,
    staffName: null,
    factoryId: null,
    lineId: null,
    groupId: null,
    inspectionStage: 'INLINE',
    poId: null,
    inspectedQty: 1,
    customerId: null,
    garmentTypeId: null,
    status: 'DRAFT',
    id: null,
    ticketCode: null,
    defects: [emptyDefect()],
  }
}
