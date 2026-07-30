import { newLocalId, emptySpecImages } from './id'

const SPEC_IMAGE_TYPES = ['APPROVED_SAMPLE', 'SIZE_SPEC', 'PACKING', 'HANGTAG_LABEL']

// ảnh có type không nằm trong 4 loại đã biết (vd: null, data cũ) rơi vào bucket OTHER để hiển thị fallback
function groupSpecImages(specImages) {
  const buckets = emptySpecImages()
  ;(specImages || []).forEach((img) => {
    const bucket = SPEC_IMAGE_TYPES.includes(img.type) ? img.type : 'OTHER'
    buckets[bucket].push(img.imageUrl)
  })
  return buckets
}

export function toPayload(form) {
  const payload = {
    staffId: form.staffId,
    factoryId: form.factoryId,
    lineId: form.lineId,
    groupId: form.groupId || null,
    inspectionStage: form.inspectionStage,
    poId: form.poId || null,
    styleId: form.styleId || null,
    inspectedQty: form.inspectedQty,
    customerId: form.customerId,
    garmentTypeId: form.garmentTypeId,
    status: form.status,
    measurementImages: (form.measurementImages || []).map((imageUrl) => ({ imageUrl })),
    defects: form.defects.map((defect) => ({
      defectItemId: defect.defectId,
      severity: defect.severity || null,
      note: defect.note || '',
      locations: defect.locations.map((loc) => ({
        garmentLocationId: loc.garmentLocationId || null,
        locationText: loc.locationText,
        quantity: loc.quantity,
        images: loc.images || [],
      })),
    })),
  }

  // specImages chỉ áp dụng cho FINAL; stage khác không gửi field này lên (BE 400 nếu mảng có phần tử)
  if (form.inspectionStage === 'FINAL') {
    const specImages = []
    SPEC_IMAGE_TYPES.forEach((type) => {
      ;(form.specImages?.[type] || []).forEach((url) => specImages.push({ type, imageUrl: url }))
    })
    // ảnh cũ type:null giữ nguyên khi PUT (PUT thay thế toàn bộ) để không mất dữ liệu
    ;(form.specImages?.OTHER || []).forEach((url) => specImages.push({ type: null, imageUrl: url }))
    payload.specImages = specImages

    // Field AQL chỉ hợp lệ khi stage FINAL, BE trả 400 nếu gửi lúc stage khác -> không set field
    // khi không phải FINAL. aqlLevel/qtySize phải đi cùng cặp; actual defects gửi độc lập, có thể
    // để trống nếu chưa kiểm xong.
    if (form.aqlLevel && form.qtySize) {
      payload.aqlLevel = form.aqlLevel
      payload.qtySize = form.qtySize
    }
    if (form.actualMajorDefects !== null && form.actualMajorDefects !== undefined && form.actualMajorDefects !== '') {
      payload.actualMajorDefects = Number(form.actualMajorDefects)
    }
    if (form.actualMinorDefects !== null && form.actualMinorDefects !== undefined && form.actualMinorDefects !== '') {
      payload.actualMinorDefects = Number(form.actualMinorDefects)
    }
  }

  return payload
}

export function fromResponse(ticket) {
  return {
    id: ticket.id,
    ticketCode: ticket.ticketCode,
    staffId: ticket.staff?.id ?? null,
    staffName: ticket.staff?.name ?? '',
    factoryId: ticket.factory?.id ?? null,
    lineId: ticket.line?.id ?? null,
    groupId: ticket.group?.id ?? null,
    inspectionStage: ticket.inspectionStage,
    poId: ticket.purchaseOrder?.id ?? null,
    poLabel: ticket.purchaseOrder?.name ?? '',
    styleId: ticket.style?.id ?? null,
    inspectedQty: ticket.inspectedQty,
    customerId: ticket.customer?.id ?? null,
    garmentTypeId: ticket.garmentType?.id ?? null,
    status: ticket.status,
    measurementImages: (ticket.measurementImages || []).map((img) => img.imageUrl),
    specImages: groupSpecImages(ticket.specImages),
    aqlLevel: ticket.aqlLevel ?? null,
    qtySize: ticket.qtySize ?? null,
    samplingSize: ticket.samplingSize ?? null,
    actualMajorDefects: ticket.actualMajorDefects ?? null,
    actualMinorDefects: ticket.actualMinorDefects ?? null,
    inspectionResult: ticket.inspectionResult ?? null,
    defects: (ticket.defects || []).map((defect) => ({
      _localId: newLocalId(),
      defectId: defect.defectItem?.id ?? null,
      allowMinor: false,
      allowMajor: false,
      severity: defect.severity || null,
      note: defect.note || '',
      locations: (defect.locations || []).map((loc) => ({
        _localId: newLocalId(),
        garmentLocationId: loc.garmentLocation?.id ?? null,
        locationText: loc.locationText || '',
        quantity: loc.quantity,
        images: (loc.images || []).map((img) => img.imageUrl),
      })),
    })),
  }
}
