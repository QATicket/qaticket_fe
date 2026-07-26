export default function InfoDialog({ message, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-slate-700 mb-5">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="bg-brand-red text-white font-semibold rounded-md px-6 py-2 hover:opacity-90"
        >
          OK
        </button>
      </div>
    </div>
  )
}
