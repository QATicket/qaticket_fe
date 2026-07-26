import { newLocalId } from './id'

export function toPayload(form) {
  return {
    staffId: form.staffId,
    factoryId: form.factoryId,
    lineId: form.lineId,
    groupId: form.groupId || null,
    inspectionStage: form.inspectionStage,
    poId: form.poId || null,
    inspectedQty: form.inspectedQty,
    customerId: form.customerId,
    garmentTypeId: form.garmentTypeId,
    status: form.status,
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
    inspectedQty: ticket.inspectedQty,
    customerId: ticket.customer?.id ?? null,
    garmentTypeId: ticket.garmentType?.id ?? null,
    status: ticket.status,
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
