export default function ExportProgressModal({ message }) {
  if (!message) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl px-6 py-5 flex items-center gap-3 max-w-sm w-full">
        <span className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin shrink-0" />
        <p className="text-sm text-slate-700">{message}</p>
      </div>
    </div>
  )
}
