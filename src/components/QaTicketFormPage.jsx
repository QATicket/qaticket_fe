import { useEffect, useRef, useState } from 'react'
import DraftBanner from './DraftBanner'
import InfoDialog from './InfoDialog'
import GeneralInfoCard from './GeneralInfoCard'
import DefectsCard from './DefectsCard'
import {
  getFactories,
  getLines,
  getGroups,
  getCustomers,
  getGarmentTypes,
  getGarmentLocations,
  getDefects,
} from '../api/master'
import { createQaTicket, updateQaTicket, getQaTicket } from '../api/qaTickets'
import { emptyFormState } from '../utils/id'
import { loadDraft, saveDraft, clearDraft } from '../utils/draft'
import { validateForm, hasErrors } from '../utils/validate'
import { toPayload, fromResponse } from '../utils/mapper'

function toOptions(list, labelKey = 'name') {
  return list.map((item) => ({ value: item.id, label: item[labelKey] }))
}

export default function QaTicketFormPage({ userInfo, ticketId }) {
  const [form, setForm] = useState(() => ({
    ...emptyFormState(),
    staffId: userInfo.staffId,
    staffName: userInfo.fullName,
  }))
  const [errors, setErrors] = useState({ defects: {} })
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)
  const [successDialog, setSuccessDialog] = useState(null)
  const [loadingTicket, setLoadingTicket] = useState(false)

  const [factoryOptions, setFactoryOptions] = useState([])
  const [lineOptions, setLineOptions] = useState([])
  const [groupOptions, setGroupOptions] = useState([])
  const [customerOptions, setCustomerOptions] = useState([])
  const [garmentTypeOptions, setGarmentTypeOptions] = useState([])
  const [garmentLocationOptions, setGarmentLocationOptions] = useState([])
  const [defectOptions, setDefectOptions] = useState([])

  const [showDraftBanner, setShowDraftBanner] = useState(false)
  const draftRef = useRef(null)
  const skipNextAutosave = useRef(true)

  const editingId = ticketId || null

  // Load static master data once
  useEffect(() => {
    getFactories().then((list) => setFactoryOptions(toOptions(list))).catch(() => {})
    getCustomers().then((list) => setCustomerOptions(toOptions(list))).catch(() => {})
    getGarmentTypes().then((list) => setGarmentTypeOptions(toOptions(list))).catch(() => {})
    getDefects()
      .then((list) => setDefectOptions(list.map((d) => ({ value: d.id, label: d.nameVi }))))
      .catch(() => {})
  }, [])

  // Load ticket for edit, or offer draft restore for new ticket
  useEffect(() => {
    if (editingId) {
      setLoadingTicket(true)
      getQaTicket(editingId)
        .then((data) => setForm(fromResponse(data)))
        .catch((err) => setServerError(err.message || 'Không tải được phiếu'))
        .finally(() => setLoadingTicket(false))
    } else {
      const draft = loadDraft()
      if (draft) {
        draftRef.current = draft
        setShowDraftBanner(true)
      }
    }
  }, [editingId])

  // Cascade: Factory -> Line
  useEffect(() => {
    if (!form.factoryId) {
      setLineOptions([])
      return
    }
    getLines(form.factoryId).then((list) => setLineOptions(toOptions(list))).catch(() => {})
  }, [form.factoryId])

  // Cascade: Line -> Group
  useEffect(() => {
    if (!form.lineId) {
      setGroupOptions([])
      return
    }
    getGroups(form.lineId).then((list) => setGroupOptions(toOptions(list))).catch(() => {})
  }, [form.lineId])

  // Cascade: Garment Type -> Garment Locations
  useEffect(() => {
    if (!form.garmentTypeId) {
      setGarmentLocationOptions([])
      return
    }
    getGarmentLocations(form.garmentTypeId)
      .then((list) => setGarmentLocationOptions(toOptions(list)))
      .catch(() => {})
  }, [form.garmentTypeId])

  // Debounced draft autosave (~1s)
  useEffect(() => {
    if (editingId) return
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false
      return
    }
    const handle = setTimeout(() => saveDraft(form), 1000)
    return () => clearTimeout(handle)
  }, [form, editingId])

  function patchForm(patch) {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  function restoreDraft() {
    if (draftRef.current) setForm(draftRef.current)
    setShowDraftBanner(false)
  }

  function dismissDraft() {
    clearDraft()
    setShowDraftBanner(false)
  }

  async function handleSave(status) {
    setServerError('')
    const nextForm = { ...form, status }
    const validationErrors = validateForm(nextForm)
    setErrors(validationErrors)
    if (hasErrors(validationErrors)) {
      setServerError('Vui lòng kiểm tra lại các trường còn thiếu/sai bên dưới.')
      return
    }

    setSaving(true)
    try {
      const payload = toPayload(nextForm)
      const response = form.id
        ? await updateQaTicket(form.id, payload)
        : await createQaTicket(payload)
      skipNextAutosave.current = true
      setForm({
        ...emptyFormState(),
        staffId: userInfo.staffId,
        staffName: userInfo.fullName,
      })
      setErrors({ defects: {} })
      clearDraft()
      setSuccessDialog({
        message:
          status === 'SUBMITTED'
            ? `Đã nộp phiếu ${response.ticketCode} thành công.`
            : `Đã lưu nháp phiếu ${response.ticketCode} thành công.`,
      })
    } catch (err) {
      if (err.status === 400 && err.fieldErrors) {
        setErrors((prev) => ({ ...prev, ...err.fieldErrors, defects: prev.defects }))
        setServerError(err.message || 'Dữ liệu không hợp lệ.')
      } else {
        setServerError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loadingTicket) {
    return <div className="p-8 text-center text-slate-500">Đang tải phiếu...</div>
  }

  return (
    <div className="min-h-screen py-6 px-3 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {showDraftBanner && <DraftBanner onRestore={restoreDraft} onDismiss={dismissDraft} />}

        {serverError && (
          <div className="bg-red-50 border border-brand-red text-brand-red text-sm rounded-md p-3 mb-4">
            {serverError}
          </div>
        )}
        <div className="space-y-4">
          <GeneralInfoCard
            form={form}
            onChange={patchForm}
            errors={errors}
            factoryOptions={factoryOptions}
            lineOptions={lineOptions}
            groupOptions={groupOptions}
            customerOptions={customerOptions}
            garmentTypeOptions={garmentTypeOptions}
          />

          <DefectsCard
            defects={form.defects}
            defectOptions={defectOptions}
            garmentLocationOptions={garmentLocationOptions}
            onChange={(defects) => patchForm({ defects })}
            errors={errors}
          />

          <div className="flex justify-end gap-3 pb-8">
            <button
              type="button"
              onClick={() => handleSave('SUBMITTED')}
              disabled={saving}
              className="bg-white border-2 border-brand-red text-brand-red font-semibold rounded-md px-6 py-2.5 hover:bg-red-50 disabled:opacity-60"
            >
              Nộp phiếu
            </button>
            <button
              type="button"
              onClick={() => handleSave('DRAFT')}
              disabled={saving}
              className="bg-brand-red text-white font-semibold rounded-md px-6 py-2.5 hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Đang lưu...' : 'Lưu Phiếu QA'}
            </button>
          </div>
        </div>
      </div>

      {successDialog && (
        <InfoDialog
          message={successDialog.message}
          onClose={() => setSuccessDialog(null)}
        />
      )}
    </div>
  )
}
