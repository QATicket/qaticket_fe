const DRAFT_KEY = 'qaticket.draft.v1'

export function loadDraft() {
  const raw = localStorage.getItem(DRAFT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveDraft(formState) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(formState))
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
}
