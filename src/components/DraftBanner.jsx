export default function DraftBanner({ onRestore, onDismiss }) {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm text-orange-800">
        Bạn có phiếu đang nhập dở. Muốn khôi phục lại không?
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRestore}
          className="bg-brand-navy text-white text-sm font-semibold rounded-md px-4 py-1.5 hover:opacity-90"
        >
          Khôi phục
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="text-sm text-slate-500 hover:text-slate-700 underline"
        >
          Bỏ qua
        </button>
      </div>
    </div>
  )
}
