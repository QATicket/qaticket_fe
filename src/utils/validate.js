export function validateForm(form) {
  const errors = { defects: {} }

  if (!form.staffId) errors.staffId = 'Vui lòng chọn QA Name'
  if (!form.factoryId) errors.factoryId = 'Vui lòng chọn Factory'
  if (!form.lineId) errors.lineId = 'Vui lòng chọn Line'
  if (!form.inspectionStage) errors.inspectionStage = 'Vui lòng chọn Inspection Stage'
  if (!form.inspectedQty || form.inspectedQty <= 0) {
    errors.inspectedQty = 'Sản lượng kiểm tra phải lớn hơn 0'
  }
  if (!form.customerId) errors.customerId = 'Vui lòng chọn Customer'
  if (!form.garmentTypeId) errors.garmentTypeId = 'Vui lòng chọn Garment'

  if (form.defects.length === 0) {
    errors.defectsGeneral = 'Cần thêm ít nhất 1 defect'
  }

  form.defects.forEach((defect) => {
    const defectErr = {}
    if (!defect.defectId) defectErr.defectId = 'Vui lòng chọn lỗi (defect)'
    if (defect.defectId && defect.allowMinor && defect.allowMajor && !defect.severity) {
      defectErr.severity = 'Vui lòng chọn mức độ lỗi (Major/Minor)'
    }

    if (!defect.locations || defect.locations.length === 0) {
      defectErr.locationsGeneral = 'Cần thêm ít nhất 1 vị trí (location)'
    } else {
      const locErrors = {}
      defect.locations.forEach((loc) => {
        const locErr = {}
        if (!loc.locationText || !loc.locationText.trim()) {
          locErr.locationText = 'Vui lòng nhập vị trí'
        }
        if (!loc.quantity || loc.quantity <= 0) {
          locErr.quantity = 'Số lượng phải lớn hơn 0'
        }
        if (Object.keys(locErr).length > 0) locErrors[loc._localId] = locErr
      })
      if (Object.keys(locErrors).length > 0) defectErr.locations = locErrors
    }

    if (Object.keys(defectErr).length > 0) errors.defects[defect._localId] = defectErr
  })

  return errors
}

export function hasErrors(errors) {
  const { defects, ...rest } = errors
  if (Object.values(rest).some(Boolean)) return true
  return Object.keys(defects || {}).length > 0
}
