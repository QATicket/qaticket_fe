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

export function emptySpecImages() {
  return {
    APPROVED_SAMPLE: [],
    SIZE_SPEC: [],
    PACKING: [],
    HANGTAG_LABEL: [],
    // ảnh cũ (trước khi có field type) chỉ để hiển thị, không gán lại type khi lưu
    OTHER: [],
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
    styleId: null,
    inspectedQty: 1,
    customerId: null,
    garmentTypeId: null,
    status: 'DRAFT',
    id: null,
    ticketCode: null,
    measurementImages: [],
    specImages: emptySpecImages(),
    defects: [emptyDefect()],
    aqlLevel: null,
    qtySize: null,
    samplingSize: null,
    actualMajorDefects: null,
    actualMinorDefects: null,
    inspectionResult: null,
  }
}
