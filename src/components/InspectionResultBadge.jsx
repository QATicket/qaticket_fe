const LABELS = { PASS: 'Pass', REJECTED: 'Rejected', PENDING: 'Pending' }
const COLORS = {
  PASS: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  PENDING: 'bg-amber-100 text-amber-700',
}

export default function InspectionResultBadge({ value }) {
  if (!value) return <span className="text-slate-300">—</span>
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${COLORS[value] || 'bg-slate-100 text-slate-600'}`}
    >
      {LABELS[value] || value}
    </span>
  )
}
